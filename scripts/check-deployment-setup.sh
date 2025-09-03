#!/bin/bash

# PA-QA Deployment Setup Checker
# This script checks if Vercel deployment protection bypass is configured

echo "🔍 PA-QA Deployment Setup Checker"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if project uses Vercel
if [ -f "vercel.json" ] || [ -d ".vercel" ]; then
    echo -e "${YELLOW}⚡ Vercel deployment detected${NC}"
    
    # Check for VERCEL_AUTOMATION_BYPASS_SECRET in environment
    if [ -z "${VERCEL_AUTOMATION_BYPASS_SECRET}" ]; then
        echo -e "${RED}❌ VERCEL_AUTOMATION_BYPASS_SECRET not found${NC}"
        echo ""
        echo "⚠️  ACTION REQUIRED: Set up Vercel Protection Bypass"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Your app uses Vercel deployment protection. To run E2E tests on"
        echo "protected deployments, you need to enable Protection Bypass:"
        echo ""
        echo "1️⃣  Go to https://vercel.com/dashboard"
        echo "2️⃣  Select your project"
        echo "3️⃣  Navigate to Settings → Security → Deployment Protection"
        echo "4️⃣  Enable 'Protection Bypass for Automation'"
        echo "5️⃣  Copy the generated secret"
        echo ""
        echo "Then add the secret to GitHub:"
        echo "  gh secret set VERCEL_AUTOMATION_BYPASS_SECRET --body 'your-secret'"
        echo ""
        echo "📚 Full guide: docs/testing/deployment-testing.md"
        echo ""
        exit 1
    else
        echo -e "${GREEN}✅ Vercel Protection Bypass configured${NC}"
    fi
fi

# Check for Playwright configuration
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
    echo -e "${GREEN}✅ Playwright configuration found${NC}"
    
    # Check if bypass header is configured
    if grep -q "x-vercel-protection-bypass" playwright.config.* 2>/dev/null; then
        echo -e "${GREEN}✅ Bypass header configured in Playwright${NC}"
    else
        echo -e "${YELLOW}⚠️  Consider adding Vercel bypass header to Playwright config${NC}"
        echo "   See: docs/testing/deployment-testing.md#step-3-update-playwright-configuration"
    fi
else
    echo -e "${YELLOW}⚠️  No Playwright configuration found${NC}"
fi

# Check GitHub Actions workflow
if [ -d ".github/workflows" ]; then
    if grep -r "VERCEL_AUTOMATION_BYPASS_SECRET" .github/workflows/ 2>/dev/null; then
        echo -e "${GREEN}✅ GitHub Actions configured with bypass secret${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub Actions may need bypass secret configuration${NC}"
        echo "   See: docs/testing/deployment-testing.md#step-4-update-github-actions-workflow"
    fi
fi

echo ""
echo "✨ Setup check complete!"