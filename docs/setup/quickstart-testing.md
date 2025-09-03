# Quick Start Guide: PA-QA Testing Framework

## 🚀 Getting Started in 5 Minutes

### Step 1: Copy Test Structure from Blog-Poster
```bash
# Copy the battle-tested structure
cp -r ~/apps/blog-poster/frontend/tests ./tests
cp ~/apps/blog-poster/frontend/playwright.config.ts ./
cp ~/apps/blog-poster/frontend/package.json ./package.test.json
```

### Step 2: Install Testing Dependencies
```bash
npm install --save-dev @playwright/test @faker-js/faker allure-playwright dotenv
npx playwright install --with-deps chromium
```

### Step 3: Create Your First Test
```typescript
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('app loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Your App Name/);
});
```

### Step 4: Run Tests
```bash
# Run all tests
npx playwright test

# Run with UI (recommended for development)
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/smoke.spec.ts
```

## 📋 Checklist for New Projects

### Initial Setup
- [ ] Copy test structure from blog-poster
- [ ] Install Playwright and dependencies
- [ ] Configure environment variables (.env.test)
- [ ] Set up base URL in playwright.config.ts
- [ ] Create initial smoke test
- [ ] Verify test execution

### Core Test Implementation
- [ ] Authentication tests (login, registration, password reset)
- [ ] Critical user journeys
- [ ] Form validation tests
- [ ] API integration tests

### Advanced Features
- [ ] Set up Allure reporting
- [ ] Configure Docker test environment
- [ ] Add visual regression tests
- [ ] Implement performance tests
- [ ] Create accessibility tests

### CI/CD Integration
- [ ] GitHub Actions workflow
- [ ] Test artifact storage
- [ ] Failure notifications
- [ ] Automated report deployment

## 🎯 Example Test Patterns

### Page Object Pattern (Recommended)
```typescript
// helpers/page-objects/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}

// tests/e2e/auth/login.spec.ts
test('successful login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

### Test Data Factory
```typescript
// helpers/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export const createTestUser = () => ({
  email: faker.internet.email(),
  password: 'TestPass123!',
  name: faker.person.fullName()
});

// Usage in test
const user = createTestUser();
await registrationPage.register(user);
```

### API Testing
```typescript
test('API: Create user', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: {
      email: 'test@example.com',
      password: 'password123'
    }
  });
  expect(response.ok()).toBeTruthy();
  const user = await response.json();
  expect(user.email).toBe('test@example.com');
});
```

## 🐳 Docker Testing (Optional but Recommended)

### Basic docker-compose.test.yml
```yaml
version: '3.8'
services:
  playwright:
    image: mcr.microsoft.com/playwright:v1.40.0
    working_dir: /app
    volumes:
      - .:/app
    command: npx playwright test
    
  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "8025:8025"
```

### Run Tests in Docker
```bash
docker-compose -f docker-compose.test.yml up
```

## 📊 Viewing Test Reports

### Playwright HTML Report
```bash
npx playwright show-report
```

### Allure Report (if configured)
```bash
npx allure generate allure-results -o allure-report --clean
npx allure open allure-report
```

## 🔗 Useful Commands

```bash
# Install/Update Playwright
npx playwright install

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests for specific browser
npx playwright test --project=chromium

# Debug a specific test
npx playwright test --debug tests/e2e/auth/login.spec.ts

# Generate code by recording actions
npx playwright codegen https://your-app.com

# Update snapshots for visual tests
npx playwright test --update-snapshots
```

## 📚 Learning Path

1. **Start Here**: Run the blog-poster tests to see them in action
   ```bash
   cd ~/apps/blog-poster/frontend
   npm run test:e2e:ui
   ```

2. **Study Examples**: Review test patterns in blog-poster
   - `tests/e2e/auth/registration.spec.ts` - Comprehensive test example
   - `tests/helpers/` - Helper utilities patterns

3. **Read Documentation**: 
   - [initial.md](initial.md) - Complete framework specification
   - [PA_QA_FRAMEWORK.md](PA_QA_FRAMEWORK.md) - Detailed implementation guide

4. **Practice**: Create tests for a simple feature in your project

5. **Scale**: Add more test types and integrate with CI/CD

## 🆘 Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout in playwright.config.ts
- Check if services are running
- Verify BASE_URL is correct

**Element not found**
- Use Playwright Inspector: `npx playwright test --debug`
- Check selectors with: `await page.locator('selector').isVisible()`
- Add explicit waits: `await page.waitForSelector('selector')`

**Flaky tests**
- Use `waitForLoadState('networkidle')`
- Implement retry logic
- Use more specific selectors

**Docker issues**
- Ensure Docker Desktop is running
- Check port conflicts
- Verify volume mounts

## 🎉 Next Steps

1. ✅ Run example tests from blog-poster
2. ✅ Create your first smoke test
3. ✅ Implement authentication tests
4. ✅ Set up CI/CD pipeline
5. ✅ Share knowledge with team

---

**Need help?** Check the blog-poster implementation or refer to the comprehensive guides in this repository.