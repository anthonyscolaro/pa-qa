# TypeScript Setup for E2E Testing

## Why TypeScript for Testing?

Project Assistant standardizes on **TypeScript** for all E2E testing because:

1. **Type Safety**: Catches errors before runtime
2. **Better IDE Support**: IntelliSense, auto-completion, refactoring
3. **Self-Documenting**: Types serve as inline documentation
4. **Industry Standard**: Playwright, Jest, and modern frameworks use TypeScript
5. **Maintainability**: Easier to refactor and update tests

## Basic TypeScript Configuration

### tsconfig.json (from blog-poster)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@tests/*": ["./tests/*"]
    },
    "types": ["@playwright/test", "node"]
  },
  "include": ["tests/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Installation

```bash
# Core TypeScript dependencies
npm install --save-dev typescript @types/node

# Playwright with TypeScript support (included by default)
npm install --save-dev @playwright/test

# Additional type definitions for testing
npm install --save-dev @faker-js/faker @types/faker
```

## File Structure

All test files should use the `.ts` extension:

```
tests/
├── e2e/
│   ├── smoke.spec.ts          # TypeScript test files
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── registration.spec.ts
├── helpers/
│   ├── page-objects/
│   │   ├── base.page.ts       # Base class with types
│   │   └── login.page.ts      # Typed page object
│   ├── factories/
│   │   └── user.factory.ts    # Typed data factories
│   └── types/
│       └── test.types.ts      # Shared type definitions
```

## TypeScript Test Examples

### Basic Test with Types
```typescript
// tests/e2e/smoke.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load application', async ({ page }: { page: Page }) => {
    await page.goto('/');
    const title: string = await page.title();
    expect(title).toContain('Your App');
  });
});
```

### Page Object with TypeScript
```typescript
// tests/helpers/page-objects/base.page.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async getElement(selector: string): Promise<Locator> {
    return this.page.locator(selector);
  }

  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }
}
```

### Typed Test Data Factory
```typescript
// tests/helpers/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  company?: string;
}

export class UserFactory {
  static createValidUser(): TestUser {
    return {
      email: faker.internet.email(),
      password: this.generateSecurePassword(),
      fullName: faker.person.fullName(),
      company: faker.company.name()
    };
  }

  private static generateSecurePassword(): string {
    return `${faker.internet.password(12)}!1Aa`;
  }

  static createBatch(count: number): TestUser[] {
    return Array.from({ length: count }, () => this.createValidUser());
  }
}
```

### Test with Custom Types
```typescript
// tests/helpers/types/test.types.ts
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed';
```

### Using Types in Tests
```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '@tests/helpers/page-objects/login.page';
import { LoginCredentials } from '@tests/helpers/types/test.types';
import { UserFactory } from '@tests/helpers/factories/user.factory';

test.describe('Login Tests', () => {
  let loginPage: LoginPage;
  let credentials: LoginCredentials;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    const user = UserFactory.createValidUser();
    credentials = {
      email: user.email,
      password: user.password,
      rememberMe: true
    };
  });

  test('successful login with valid credentials', async () => {
    await loginPage.navigate('/login');
    await loginPage.login(credentials);
    
    const isLoggedIn: boolean = await loginPage.isUserLoggedIn();
    expect(isLoggedIn).toBe(true);
  });
});
```

## Type Benefits in Action

### 1. Compile-Time Error Detection
```typescript
// ❌ TypeScript catches this error
const user = UserFactory.createValidUser();
user.emial = 'test@example.com';  // Property 'emial' does not exist

// ✅ Correct property name
user.email = 'test@example.com';
```

### 2. IntelliSense Support
```typescript
// IDE shows all available methods and properties
const loginPage = new LoginPage(page);
loginPage. // IDE shows: login(), logout(), isUserLoggedIn(), etc.
```

### 3. Refactoring Safety
```typescript
// Renaming a method updates all usages automatically
// Change login() to authenticate() - all references update
```

## Common TypeScript Patterns for Testing

### Async/Await with Types
```typescript
async function waitForElement(page: Page, selector: string): Promise<Locator> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  return element;
}
```

### Generic Helper Functions
```typescript
async function getApiResponse<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint);
  return response.json() as Promise<T>;
}

// Usage
interface User {
  id: number;
  name: string;
}
const user = await getApiResponse<User>('/api/user/1');
```

### Type Guards
```typescript
function isErrorResponse(response: any): response is { error: string } {
  return response && typeof response.error === 'string';
}

// Usage
const response = await apiCall();
if (isErrorResponse(response)) {
  console.error(response.error); // TypeScript knows error exists
}
```

## Migration from JavaScript

If migrating existing JavaScript tests:

1. **Rename files**: Change `.js` to `.ts`
2. **Add types gradually**: Start with `any` and refine
3. **Create interfaces**: Define shapes for complex objects
4. **Use strict mode**: Enable gradually in tsconfig.json

```typescript
// Before (JavaScript)
function createUser(name, email) {
  return { name, email };
}

// After (TypeScript)
interface User {
  name: string;
  email: string;
}

function createUser(name: string, email: string): User {
  return { name, email };
}
```

## VS Code Settings

Recommended settings for TypeScript testing:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Playwright with TypeScript](https://playwright.dev/docs/test-typescript)
- [Blog-Poster Example](~/apps/blog-poster/frontend/tests) - See real implementation

---

**Remember**: Start with basic types and add more as needed. The goal is better code quality, not perfect typing from day one.