# PA-QA JavaScript/TypeScript Linting Configuration

A comprehensive, modern linting and formatting setup for JavaScript/TypeScript projects in the PA-QA framework. This configuration includes ESLint 9.x with flat config, Prettier, TypeScript support, and pre-commit hooks for maximum code quality and consistency.

## Features

- **ESLint 9.x Flat Config**: Modern ESLint configuration with performance optimizations
- **Multi-Framework Support**: React, Vue, Node.js, and vanilla JavaScript/TypeScript
- **Airbnb-Style Rules**: Industry-standard code quality rules with customizations
- **Accessibility**: JSX-A11y plugin for WCAG 2.1 AA compliance
- **Testing Integration**: Jest, Vitest, and Testing Library support
- **Security**: Built-in security rules and secret detection
- **Performance**: SonarJS rules for cognitive complexity and code smells
- **Import Management**: Automatic import sorting with TypeScript support
- **Pre-commit Hooks**: Husky + lint-staged for automated quality checks
- **IDE Integration**: VS Code settings and EditorConfig for consistency

## Quick Start

### 1. Copy Configuration Files

Copy the entire `javascript` directory to your project root or install as a package:

```bash
# Copy files directly
cp -r /path/to/pa-qa/shared/linting-configs/javascript/* ./

# Or symlink for development
ln -s /path/to/pa-qa/shared/linting-configs/javascript/* ./
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Pre-commit Hooks

```bash
npm run setup
```

### 4. Validate Setup

```bash
npm run validate
```

## Configuration Files

| File | Purpose |
|------|---------|
| `eslint.config.js` | Modern ESLint 9.x flat configuration |
| `.prettierrc.js` | Prettier formatting rules |
| `tsconfig.json` | TypeScript configuration optimized for linting |
| `package.json` | Dependencies and npm scripts |
| `lint-staged.config.js` | Pre-commit file processing |
| `husky-setup.sh` | Git hooks installation script |
| `vscode-settings.json` | VS Code workspace settings |
| `.editorconfig` | Cross-editor configuration |
| `.gitignore` | Ignore patterns for build tools and artifacts |

## Usage

### Basic Commands

```bash
# Lint all files
npm run lint

# Lint with auto-fix
npm run lint:fix

# Check formatting
npm run format:check

# Format all files
npm run format

# Type check TypeScript
npm run type-check

# Full validation
npm run validate
```

### Pre-commit Workflow

The pre-commit hooks automatically:

1. **Lint staged files** with ESLint auto-fix
2. **Format staged files** with Prettier
3. **Type check** TypeScript files
4. **Validate commit messages** (Conventional Commits format)
5. **Check for secrets** and security issues

### Commit Message Format

Use Conventional Commits format:

```
type(scope): description

# Examples:
feat(auth): add user login functionality
fix(api): resolve memory leak in data processing
docs(readme): update installation instructions
test(utils): add unit tests for validation helpers
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

## Framework-Specific Usage

### React Projects

The configuration automatically detects React and enables:
- React Hooks rules
- JSX accessibility (a11y) rules
- React Refresh support for Vite
- Component naming conventions

```javascript
// React components are automatically formatted
const UserProfile = ({ user, onUpdate }) => {
  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <button onClick={onUpdate} type="button">
        Update Profile
      </button>
    </div>
  );
};
```

### Vue Projects

Vue files (`.vue`) get special treatment:
- Vue 3 recommended rules
- Composition API support
- Template formatting
- Script setup syntax

```vue
<script setup lang="ts">
interface User {
  name: string;
  email: string;
}

const props = defineProps<{
  user: User;
}>();

const emit = defineEmits<{
  update: [user: User];
}>();
</script>

<template>
  <div class="user-profile">
    <h1>{{ props.user.name }}</h1>
    <button @click="emit('update', props.user)" type="button">
      Update Profile
    </button>
  </div>
</template>
```

### TypeScript Projects

Enhanced TypeScript support includes:
- Strict type checking
- Import/export consistency
- Type-only imports
- Advanced TypeScript-specific rules

```typescript
// Automatic import sorting and type-only imports
import type { User } from '@/types';
import { validateUser } from '@/utils';

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const validatedData = validateUser(userData);
  // Implementation...
  return validatedData as User;
};
```

### Testing Files

Test files get relaxed rules:
- Console statements allowed
- `any` type permitted for mocking
- Testing Library best practices
- Both Jest and Vitest support

```typescript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { UserProfile } from './UserProfile';

test('displays user name correctly', () => {
  const mockUser = { name: 'John Doe', email: 'john@example.com' };
  
  render(<UserProfile user={mockUser} onUpdate={() => {}} />);
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run ci:validate
```

### Package.json Scripts for CI

```json
{
  "scripts": {
    "ci:install": "npm ci --prefer-offline --no-audit",
    "ci:lint": "npm run lint:check",
    "ci:format": "npm run format:check",
    "ci:typecheck": "npm run type-check",
    "ci:validate": "npm run ci:lint && npm run ci:format && npm run ci:typecheck"
  }
}
```

## Customization

### Project-Specific Rules

Create an `eslint.config.local.js` file to extend the base configuration:

```javascript
import baseConfig from './eslint.config.js';

export default [
  ...baseConfig,
  {
    rules: {
      // Override specific rules for your project
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
```

### Prettier Overrides

Add project-specific Prettier settings to `.prettierrc.js`:

```javascript
import baseConfig from './.prettierrc.js';

export default {
  ...baseConfig,
  printWidth: 120, // Override for your project
  tabWidth: 4,     // Use 4 spaces instead of 2
};
```

### VS Code Integration

Copy `vscode-settings.json` to `.vscode/settings.json`:

```bash
mkdir -p .vscode
cp vscode-settings.json .vscode/settings.json
```

## Monorepo Support

For monorepos, place the configuration in the root and reference it in workspaces:

```javascript
// packages/frontend/eslint.config.js
import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
    // Package-specific overrides
  },
];
```

## Performance Optimization

The configuration includes several performance optimizations:

- **ESLint Cache**: Enabled by default in scripts
- **Incremental TypeScript**: Uses project references when available  
- **Staged File Processing**: Only lints changed files in pre-commit
- **Parallel Processing**: Multiple tools run concurrently where possible

### Large Codebase Tips

For large codebases (>1000 files):

1. **Enable ESLint cache**:
   ```bash
   eslint . --cache --cache-location node_modules/.cache/eslint/
   ```

2. **Use TypeScript project references**:
   ```json
   {
     "references": [
       { "path": "./packages/frontend" },
       { "path": "./packages/backend" }
     ]
   }
   ```

3. **Exclude unnecessary files**:
   ```javascript
   // In eslint.config.js, add to ignores array
   ignores: [
     'dist/**',
     'node_modules/**',
     'coverage/**',
     '*.generated.*'
   ]
   ```

## Troubleshooting

### Common Issues

#### ESLint "Cannot resolve dependency" errors

```bash
# Clear cache and reinstall
npm run clean
npm install
```

#### TypeScript path mapping not working

Ensure `tsconfig.json` baseUrl and paths are configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

#### Pre-commit hooks not running

```bash
# Reinstall hooks
npm run setup:husky
# Or manually
npx husky install
```

#### Prettier and ESLint conflicts

The configuration includes `eslint-config-prettier` to resolve conflicts. If you see conflicts:

```bash
# Check for conflicts
npx eslint-config-prettier 'src/**/*.{js,ts,jsx,tsx}'
```

### Performance Issues

If linting is slow:

1. **Check cache location**:
   ```bash
   # Ensure cache directory exists and is writable
   mkdir -p node_modules/.cache/eslint
   ```

2. **Reduce scope**:
   ```bash
   # Lint specific directories only
   eslint src/ --cache
   ```

3. **Parallel processing**:
   ```bash
   # Use parallel flag for large projects
   eslint . --cache --max-warnings 0 --format=compact
   ```

## Migration Guide

### From ESLint 8.x

1. **Update configuration**:
   - Replace `.eslintrc.*` with `eslint.config.js`
   - Update extends to use flat config format
   - Check plugin compatibility

2. **Update scripts**:
   ```json
   {
     "scripts": {
       "lint": "eslint . --fix",
       "lint:check": "eslint ."
     }
   }
   ```

### From Create React App

1. **Eject or use CRACO** to customize ESLint
2. **Remove react-scripts ESLint dependency**
3. **Install this configuration**
4. **Update package.json scripts**

### From Vue CLI

1. **Remove Vue CLI ESLint plugin**
2. **Install this configuration**
3. **Update vue.config.js** to disable built-in linting

## Contributing

### Adding New Rules

1. **Test the rule** on a sample project
2. **Check performance impact** with `eslint --debug`
3. **Document the rule** purpose and examples
4. **Update tests** in the configuration

### Supporting New Frameworks

1. **Add framework detection** to the config
2. **Install required plugins**
3. **Create framework-specific rule sets**
4. **Test with real projects**
5. **Update documentation**

## Version History

- **v2.0.0** (September 2025)
  - ESLint 9.x flat config migration
  - Multi-agent workflow integration
  - Performance optimizations
  - Enhanced TypeScript support

- **v1.0.0** (September 2025)
  - Initial release with ESLint 8.x
  - Basic React and Vue support
  - Prettier integration

## Support

For issues and questions:

1. **Check this README** for common solutions
2. **Review PA-QA documentation** in the main repository
3. **Create an issue** in the PA-QA repository
4. **Join the team Slack** #qa-testing channel

## License

MIT License - see the main PA-QA repository for details.