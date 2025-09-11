const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔍 Testing PA-QA Showcase Navigation\n');
  console.log('=====================================\n');
  
  // Navigate to homepage
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
  console.log('✅ Homepage loaded');
  
  // Get the page title
  const title = await page.title();
  console.log(`   Title: ${title}`);
  
  // Check for main content
  const heroText = await page.textContent('h1').catch(() => 'No H1 found');
  console.log(`   Hero: ${heroText}\n`);
  
  // Define all navigation links to test
  const navLinks = [
    { name: 'Getting Started', path: '/getting-started' },
    { name: 'Testing Patterns', path: '/testing-patterns' },
    { name: 'Utilities', path: '/utilities' },
    { name: 'Best Practices', path: '/best-practices' },
    { name: 'CI/CD', path: '/ci-cd' },
    { name: 'Templates', path: '/templates' },
    { name: 'Showcase', path: '/showcase' },
  ];
  
  console.log('📍 Testing Navigation Links:\n');
  
  for (const link of navLinks) {
    try {
      // Navigate directly to the path
      await page.goto(`http://localhost:3005${link.path}`, { waitUntil: 'networkidle' });
      
      // Get page content indicators
      const pageTitle = await page.title();
      const h1Text = await page.textContent('h1').catch(() => null);
      const mainContent = await page.locator('main').textContent().catch(() => '');
      
      // Check if page has substantial content
      const contentLength = mainContent.length;
      const hasContent = contentLength > 500; // Arbitrary threshold for "has content"
      
      console.log(`${hasContent ? '✅' : '❌'} ${link.name} (${link.path})`);
      console.log(`   Title: ${pageTitle}`);
      console.log(`   H1: ${h1Text || 'No H1 found'}`);
      console.log(`   Content length: ${contentLength} chars`);
      
      // Look for specific indicators of empty pages
      if (!h1Text || contentLength < 200) {
        console.log(`   ⚠️  Page appears to be empty or minimal`);
      }
      
      // Check for any error messages
      const errorText = await page.textContent('text=/error|not found|404/i').catch(() => null);
      if (errorText) {
        console.log(`   ⚠️  Error message found: ${errorText}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${link.name} (${link.path})`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  // Also test some additional pages that might exist
  console.log('📍 Testing Additional Pages:\n');
  
  const additionalPaths = [
    '/examples',
    '/docs',
  ];
  
  for (const path of additionalPaths) {
    try {
      await page.goto(`http://localhost:3005${path}`, { waitUntil: 'networkidle' });
      const pageTitle = await page.title();
      const hasContent = (await page.locator('main').textContent().catch(() => '')).length > 500;
      
      console.log(`${hasContent ? '✅' : '❌'} ${path}`);
      console.log(`   Title: ${pageTitle}\n`);
    } catch (error) {
      console.log(`❌ ${path}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  // Summary
  console.log('=====================================');
  console.log('📊 Test Summary:');
  console.log('   - Check the results above to see which pages have content');
  console.log('   - Pages with ❌ or ⚠️ may need attention');
  
  await browser.close();
})();