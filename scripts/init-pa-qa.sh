#!/bin/bash

# PA-QA Framework Initialization Script
# Run this when incorporating PA-QA into a new web application

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║      PA-QA Testing Framework Setup             ║"
echo "║      Production-Ready Quality Assurance        ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Project type detection
echo "🔍 Detecting project type..."

# Detect deployment platform
DEPLOYMENT_PLATFORM=""
if [ -f "vercel.json" ] || [ -d ".vercel" ]; then
    DEPLOYMENT_PLATFORM="vercel"
    echo -e "${BLUE}   → Vercel project detected${NC}"
elif [ -f "netlify.toml" ] || [ -d ".netlify" ]; then
    DEPLOYMENT_PLATFORM="netlify"
    echo -e "${BLUE}   → Netlify project detected${NC}"
elif [ -f "amplify.yml" ]; then
    DEPLOYMENT_PLATFORM="amplify"
    echo -e "${BLUE}   → AWS Amplify project detected${NC}"
fi

# Detect framework
FRAMEWORK=""
if [ -f "package.json" ]; then
    if grep -q '"react"' package.json; then
        FRAMEWORK="react"
        echo -e "${BLUE}   → React application detected${NC}"
    elif grep -q '"vue"' package.json; then
        FRAMEWORK="vue"
        echo -e "${BLUE}   → Vue application detected${NC}"
    elif grep -q '"next"' package.json; then
        FRAMEWORK="nextjs"
        echo -e "${BLUE}   → Next.js application detected${NC}"
    fi
fi

echo ""
echo "📋 Setting up PA-QA Testing Framework..."
echo ""

# Step 1: Install dependencies
echo "1️⃣  Installing test dependencies..."
npm install --save-dev @playwright/test @faker-js/faker dotenv || true

# Step 2: Install Playwright browsers
echo ""
echo "2️⃣  Installing Playwright browsers..."
npx playwright install --with-deps chromium || true

# Step 3: Create test structure
echo ""
echo "3️⃣  Creating test directory structure..."
mkdir -p tests/e2e tests/helpers tests/fixtures
mkdir -p .github/workflows

# Step 4: Platform-specific setup
if [ "$DEPLOYMENT_PLATFORM" = "vercel" ]; then
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  VERCEL DEPLOYMENT PROTECTION SETUP REQUIRED${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Your app uses Vercel. To enable E2E testing on protected deployments:"
    echo ""
    echo -e "${BOLD}Step 1: Enable Protection Bypass in Vercel${NC}"
    echo "  1. Go to https://vercel.com/dashboard"
    echo "  2. Select your project: ${PWD##*/}"
    echo "  3. Navigate to: Settings → Security → Deployment Protection"
    echo "  4. Find 'Protection Bypass for Automation'"
    echo "  5. Toggle it ON ✅"
    echo "  6. Copy the generated secret"
    echo ""
    echo -e "${BOLD}Step 2: Add Secret to GitHub${NC}"
    echo "  Run this command with your secret:"
    echo -e "  ${GREEN}gh secret set VERCEL_AUTOMATION_BYPASS_SECRET --body 'your-secret-here'${NC}"
    echo ""
    echo -e "${BOLD}Step 3: Update Playwright Config${NC}"
    echo "  The config template has been created with bypass headers."
    echo "  Check: playwright.config.ts"
    echo ""
    echo "📚 Full documentation: node_modules/pa-qa/docs/testing/deployment-testing.md"
    echo ""
    
    # Create a reminder file
    cat > .pa-qa-setup-required.md << 'EOF'
# ⚠️ PA-QA Setup Required: Vercel Protection Bypass

Your application uses Vercel deployment protection. To enable automated testing on protected deployments, you must complete the following setup:

## Required Actions:

### 1. Enable Protection Bypass in Vercel Dashboard
- [ ] Visit https://vercel.com/dashboard
- [ ] Select your project
- [ ] Go to Settings → Security → Deployment Protection
- [ ] Enable "Protection Bypass for Automation"
- [ ] Copy the generated secret

### 2. Add Secret to GitHub
```bash
gh secret set VERCEL_AUTOMATION_BYPASS_SECRET --body "your-secret-here"
```

### 3. Verify Setup
```bash
./scripts/check-deployment-setup.sh
```

## Why This is Important:
Without this setup, your E2E tests will fail when running against Vercel deployments because they'll be blocked by the authentication screen.

## Documentation:
- Full guide: docs/testing/deployment-testing.md
- Troubleshooting: docs/testing/deployment-testing.md#troubleshooting

---
Delete this file once setup is complete.
EOF
    
    echo -e "${RED}📌 Created: .pa-qa-setup-required.md - DELETE AFTER COMPLETING SETUP${NC}"
fi

# Step 5: Create basic Playwright config if it doesn't exist
if [ ! -f "playwright.config.ts" ] && [ ! -f "playwright.config.js" ]; then
    echo ""
    echo "4️⃣  Creating Playwright configuration..."
    
    cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    
    // Vercel Protection Bypass Header
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? {
      'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    } : undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
EOF
    echo -e "${GREEN}   ✓ Created playwright.config.ts${NC}"
fi

# Step 6: Create example test
if [ ! -f "tests/e2e/example.spec.ts" ]; then
    echo ""
    echo "5️⃣  Creating example test..."
    
    cat > tests/e2e/example.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  
  // Update this assertion based on your app
  await expect(page).toHaveTitle(/Your App Name/);
  
  // Verify key elements are visible
  // await expect(page.locator('h1')).toBeVisible();
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Add navigation tests based on your app structure
  // Example:
  // await page.click('text=About');
  // await expect(page).toHaveURL('/about');
});
EOF
    echo -e "${GREEN}   ✓ Created tests/e2e/example.spec.ts${NC}"
fi

# Step 7: Create GitHub Actions workflow
if [ ! -f ".github/workflows/e2e-tests.yml" ]; then
    echo ""
    echo "6️⃣  Creating GitHub Actions workflow..."
    
    cat > .github/workflows/e2e-tests.yml << 'EOF'
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  deployment_status:

jobs:
  test:
    if: github.event_name != 'deployment_status' || github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        
      - name: Run E2E tests
        env:
          PLAYWRIGHT_TEST_BASE_URL: ${{ github.event.deployment_status.target_url || 'http://localhost:3000' }}
          VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
        run: npx playwright test
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
EOF
    echo -e "${GREEN}   ✓ Created .github/workflows/e2e-tests.yml${NC}"
fi

# Step 8: Update package.json scripts
echo ""
echo "7️⃣  Adding test scripts to package.json..."

# Check if package.json exists
if [ -f "package.json" ]; then
    # Add test scripts if they don't exist
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!pkg.scripts) pkg.scripts = {};
    
    if (!pkg.scripts['test:e2e']) {
        pkg.scripts['test:e2e'] = 'playwright test';
    }
    if (!pkg.scripts['test:e2e:ui']) {
        pkg.scripts['test:e2e:ui'] = 'playwright test --ui';
    }
    if (!pkg.scripts['test:e2e:debug']) {
        pkg.scripts['test:e2e:debug'] = 'playwright test --debug';
    }
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('   ✓ Updated package.json with test scripts');
    "
fi

# Step 9: Create .env.test template
if [ ! -f ".env.test.example" ]; then
    echo ""
    echo "8️⃣  Creating environment template..."
    
    cat > .env.test.example << 'EOF'
# Test Environment Variables
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# Vercel Protection Bypass (if using Vercel)
VERCEL_AUTOMATION_BYPASS_SECRET=

# Test User Credentials (if needed)
TEST_USER_EMAIL=
TEST_USER_PASSWORD=
EOF
    echo -e "${GREEN}   ✓ Created .env.test.example${NC}"
fi

# Step 10: Add to .gitignore
echo ""
echo "9️⃣  Updating .gitignore..."

if [ -f ".gitignore" ]; then
    if ! grep -q "test-results" .gitignore; then
        echo "" >> .gitignore
        echo "# Playwright" >> .gitignore
        echo "/test-results/" >> .gitignore
        echo "/playwright-report/" >> .gitignore
        echo "/playwright/.cache/" >> .gitignore
        echo ".env.test" >> .gitignore
        echo -e "${GREEN}   ✓ Updated .gitignore${NC}"
    else
        echo "   → Test directories already in .gitignore"
    fi
fi

# Final summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ PA-QA Framework Setup Complete!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Run your first test:"
echo -e "   ${BLUE}npm run test:e2e${NC}"
echo ""
echo "2. Open Playwright UI for development:"
echo -e "   ${BLUE}npm run test:e2e:ui${NC}"
echo ""
echo "3. Debug tests interactively:"
echo -e "   ${BLUE}npm run test:e2e:debug${NC}"
echo ""

if [ "$DEPLOYMENT_PLATFORM" = "vercel" ]; then
    echo -e "${YELLOW}⚠️  IMPORTANT: Complete Vercel setup before deploying!${NC}"
    echo "   See .pa-qa-setup-required.md for instructions"
    echo ""
fi

echo "📖 Documentation:"
echo "   • Quick Start: docs/setup/quickstart-testing.md"
echo "   • Deployment: docs/testing/deployment-testing.md"
echo "   • Full Guide: docs/framework/PA_QA_FRAMEWORK.md"
echo ""
echo "Happy Testing! 🚀"