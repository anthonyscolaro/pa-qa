# Deployment Testing Documentation

## 🔒 Vercel Protected Deployment Testing

### Overview

When deploying React frontend applications to Vercel with deployment protection enabled, E2E tests need to bypass the Vercel login screen to access the staging/preview environments.

### The Problem

- **Issue**: Vercel deployment protection requires login, blocking automated tests
- **Impact**: E2E tests fail or provide false positives when they can't access the protected site
- **Risk**: Tests may pass with `|| true` fallback, hiding real failures

### The Solution: Protection Bypass for Automation

#### Step 1: Enable Protection Bypass in Vercel

1. Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Security → Deployment Protection**
4. Find **"Protection Bypass for Automation"**
5. Toggle it **ON** ✅
6. Copy the generated secret token

#### Step 2: Add Secret to GitHub Repository

```bash
# Add the bypass secret to GitHub Actions
gh secret set VERCEL_AUTOMATION_BYPASS_SECRET --body "paste-your-secret-here"
```

#### Step 3: Update Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    // Add bypass header for Vercel protected deployments
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? {
      'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    } : undefined,
  },
});
```

#### Step 4: Update GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on:
  deployment_status:

jobs:
  test:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        
      - name: Run E2E tests
        env:
          PLAYWRIGHT_TEST_BASE_URL: ${{ github.event.deployment_status.target_url }}
          VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
        run: npx playwright test
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### How It Works

1. **Vercel generates** a secret bypass token when you enable the feature
2. **GitHub Actions** passes the secret as an environment variable
3. **Playwright** includes the `x-vercel-protection-bypass` header in all requests
4. **Vercel** recognizes the header and allows access without login
5. **Tests run** against the real protected staging environment

### Benefits

- ✅ **Real testing**: Tests run against actual deployed environment
- ✅ **Security maintained**: Public still needs authentication
- ✅ **Accurate results**: No false positives from inaccessible sites
- ✅ **CI/CD integration**: Seamless automation in deployment pipeline

## 📋 Deployment Testing Checklist

### Pre-Deployment

- [ ] Enable Vercel Protection Bypass
- [ ] Add bypass secret to GitHub Secrets
- [ ] Update Playwright configuration with bypass headers
- [ ] Configure GitHub Actions workflow
- [ ] Test locally with staging URL

### Post-Deployment

- [ ] Verify E2E tests are triggered on deployment
- [ ] Confirm tests can access protected URLs
- [ ] Check test reports for actual pass/fail status
- [ ] Monitor for flaky tests due to deployment timing

### Troubleshooting

#### Tests Still Blocked by Login

- Verify the bypass secret is correctly set in GitHub Secrets
- Check that the environment variable is passed to Playwright
- Ensure the header name is exactly `x-vercel-protection-bypass`
- Confirm Protection Bypass is enabled in Vercel settings

#### Tests Running Too Early

- Add a wait/retry mechanism for deployment readiness
- Use Vercel's deployment status webhook
- Implement health check before running tests

#### Environment Variable Issues

```bash
# Debug: Print environment variables (remove in production!)
echo "Base URL: $PLAYWRIGHT_TEST_BASE_URL"
echo "Bypass Secret exists: ${VERCEL_AUTOMATION_BYPASS_SECRET:+true}"
```

## 🚀 Other Deployment Platforms

### Netlify

For Netlify password-protected sites:

```typescript
// playwright.config.ts
use: {
  httpCredentials: {
    username: process.env.NETLIFY_SITE_USERNAME,
    password: process.env.NETLIFY_SITE_PASSWORD
  }
}
```

### AWS Amplify

For Amplify preview deployments with basic auth:

```typescript
// Similar to Netlify, use httpCredentials
use: {
  httpCredentials: {
    username: process.env.AMPLIFY_USERNAME,
    password: process.env.AMPLIFY_PASSWORD
  }
}
```

### Custom Authentication

For custom auth implementations:

```typescript
// tests/setup/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', process.env.TEST_USER_EMAIL);
  await page.fill('#password', process.env.TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Save auth state
  await page.context().storageState({ path: 'auth.json' });
});
```

## 📚 Resources

- [Vercel Deployment Protection Docs](https://vercel.com/docs/security/deployment-protection)
- [Playwright Environment Variables](https://playwright.dev/docs/test-parameterize#env-files)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
