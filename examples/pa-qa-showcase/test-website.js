const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class WebsiteTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      homepage: {},
      pages: {},
      templates: {},
      showcase: {},
      issues: [],
      screenshots: []
    };
    this.baseUrl = 'http://localhost:3005';
    
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.issues.push({
          type: 'console_error',
          message: msg.text(),
          url: this.page.url()
        });
      }
    });
    
    // Listen for page errors
    this.page.on('pageerror', error => {
      this.results.issues.push({
        type: 'page_error',
        message: error.message,
        url: this.page.url()
      });
    });
  }

  async takeScreenshot(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${name}.png`;
    const filepath = path.join(__dirname, 'screenshots', filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    
    this.results.screenshots.push({
      name,
      description,
      filename,
      filepath,
      url: this.page.url()
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  async testHomepage() {
    console.log('🏠 Testing Homepage...');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle' });
      await this.takeScreenshot('homepage', 'Initial homepage load');
      
      // Check for basic elements
      const title = await this.page.title();
      const heading = await this.page.textContent('h1').catch(() => null);
      
      this.results.homepage = {
        loaded: true,
        title,
        heading,
        url: this.page.url()
      };
      
      // Test navigation menu
      const navLinks = await this.page.$$('nav a, [role="navigation"] a');
      console.log(`Found ${navLinks.length} navigation links`);
      
      // Get all navigation links text and hrefs
      const navData = [];
      for (const link of navLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        navData.push({ text: text?.trim(), href });
      }
      
      this.results.homepage.navigation = navData;
      
    } catch (error) {
      this.results.issues.push({
        type: 'homepage_error',
        message: error.message,
        url: this.baseUrl
      });
    }
  }

  async testPage(url, pageName) {
    console.log(`📄 Testing ${pageName} page...`);
    
    try {
      await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle' });
      await this.takeScreenshot(pageName.toLowerCase().replace(/\s+/g, '-'), `${pageName} page`);
      
      const title = await this.page.title();
      const heading = await this.page.textContent('h1').catch(() => null);
      
      // Check for empty content or placeholder text
      const bodyText = await this.page.textContent('body');
      const hasPlaceholder = /lorem ipsum|placeholder|coming soon|under construction/i.test(bodyText);
      
      // Count interactive elements
      const buttons = await this.page.$$('button');
      const links = await this.page.$$('a');
      const forms = await this.page.$$('form');
      
      this.results.pages[pageName] = {
        url,
        title,
        heading,
        hasPlaceholder,
        interactiveElements: {
          buttons: buttons.length,
          links: links.length,
          forms: forms.length
        }
      };
      
      // Test all buttons on the page
      for (let i = 0; i < buttons.length; i++) {
        try {
          const button = buttons[i];
          const buttonText = await button.textContent();
          const isVisible = await button.isVisible();
          const isEnabled = await button.isEnabled();
          
          if (isVisible && isEnabled) {
            console.log(`  🔘 Testing button: "${buttonText?.trim()}"`);
            await button.click();
            await this.page.waitForTimeout(1000); // Wait for any animations
          }
        } catch (error) {
          this.results.issues.push({
            type: 'button_error',
            message: `Button click failed: ${error.message}`,
            page: pageName,
            url: this.page.url()
          });
        }
      }
      
    } catch (error) {
      this.results.issues.push({
        type: 'page_error',
        message: error.message,
        page: pageName,
        url: `${this.baseUrl}${url}`
      });
    }
  }

  async testTemplatesPage() {
    console.log('📋 Testing Templates page...');
    
    try {
      await this.page.goto(`${this.baseUrl}/templates`, { waitUntil: 'networkidle' });
      await this.takeScreenshot('templates-initial', 'Templates page initial load');
      
      // Test tab switching
      const tabs = await this.page.$$('[role="tab"], .tab, button[data-tab]');
      console.log(`Found ${tabs.length} tabs`);
      
      for (let i = 0; i < tabs.length; i++) {
        try {
          const tab = tabs[i];
          const tabText = await tab.textContent();
          console.log(`  📑 Testing tab: "${tabText?.trim()}"`);
          
          await tab.click();
          await this.page.waitForTimeout(1000);
          await this.takeScreenshot(`templates-tab-${i}`, `Templates tab: ${tabText?.trim()}`);
        } catch (error) {
          this.results.issues.push({
            type: 'tab_error',
            message: `Tab switch failed: ${error.message}`,
            page: 'Templates'
          });
        }
      }
      
      // Test Download buttons
      const downloadButtons = await this.page.$$('button:has-text("Download"), a:has-text("Download")');
      console.log(`Found ${downloadButtons.length} download buttons`);
      
      for (let i = 0; i < downloadButtons.length; i++) {
        try {
          const button = downloadButtons[i];
          const buttonText = await button.textContent();
          console.log(`  ⬇️ Testing download: "${buttonText?.trim()}"`);
          
          await button.click();
          await this.page.waitForTimeout(2000);
        } catch (error) {
          this.results.issues.push({
            type: 'download_error',
            message: `Download button failed: ${error.message}`,
            page: 'Templates'
          });
        }
      }
      
      // Test Demo buttons
      const demoButtons = await this.page.$$('button:has-text("Demo"), a:has-text("Demo")');
      console.log(`Found ${demoButtons.length} demo buttons`);
      
      for (let i = 0; i < demoButtons.length; i++) {
        try {
          const button = demoButtons[i];
          const buttonText = await button.textContent();
          console.log(`  🎯 Testing demo: "${buttonText?.trim()}"`);
          
          await button.click();
          await this.page.waitForTimeout(2000);
        } catch (error) {
          this.results.issues.push({
            type: 'demo_error',
            message: `Demo button failed: ${error.message}`,
            page: 'Templates'
          });
        }
      }
      
    } catch (error) {
      this.results.issues.push({
        type: 'templates_error',
        message: error.message,
        url: `${this.baseUrl}/templates`
      });
    }
  }

  async testShowcasePages() {
    console.log('🎪 Testing Showcase pages...');
    
    const showcasePages = [
      { url: '/showcase/api-dashboard', name: 'API Dashboard' },
      { url: '/showcase/react-playground', name: 'React Playground' },
      { url: '/showcase/e2e-suite', name: 'E2E Suite' }
    ];
    
    for (const { url, name } of showcasePages) {
      console.log(`  🎭 Testing ${name}...`);
      
      try {
        await this.page.goto(`${this.baseUrl}${url}`, { waitUntil: 'networkidle' });
        await this.takeScreenshot(name.toLowerCase().replace(/\s+/g, '-'), `${name} showcase`);
        
        // Test interactive elements specific to each showcase
        if (name === 'API Dashboard') {
          // Test dashboard features
          const dashboardElements = await this.page.$$('[data-testid*="dashboard"], .dashboard-item, .metric, .chart');
          console.log(`    Found ${dashboardElements.length} dashboard elements`);
          
          // Test any API call buttons or refresh buttons
          const apiButtons = await this.page.$$('button:has-text("Refresh"), button:has-text("Load"), button:has-text("Fetch")');
          for (const button of apiButtons) {
            try {
              await button.click();
              await this.page.waitForTimeout(2000);
            } catch (error) {
              this.results.issues.push({
                type: 'api_dashboard_error',
                message: `API Dashboard button failed: ${error.message}`
              });
            }
          }
        }
        
        if (name === 'React Playground') {
          // Test playground features
          const codeEditor = await this.page.$('.monaco-editor, .code-editor, textarea[data-testid*="code"]');
          if (codeEditor) {
            console.log('    Found code editor');
            try {
              await codeEditor.click();
              await this.page.keyboard.type('// Test code input');
              await this.page.waitForTimeout(1000);
            } catch (error) {
              this.results.issues.push({
                type: 'playground_error',
                message: `Playground editor failed: ${error.message}`
              });
            }
          }
          
          // Test run button
          const runButton = await this.page.$('button:has-text("Run"), button:has-text("Execute")');
          if (runButton) {
            try {
              await runButton.click();
              await this.page.waitForTimeout(2000);
            } catch (error) {
              this.results.issues.push({
                type: 'playground_error',
                message: `Playground run button failed: ${error.message}`
              });
            }
          }
        }
        
        if (name === 'E2E Suite') {
          // Test suite runner features
          const testButtons = await this.page.$$('button:has-text("Run"), button:has-text("Test"), button:has-text("Start")');
          for (const button of testButtons) {
            try {
              const buttonText = await button.textContent();
              console.log(`    Testing E2E button: "${buttonText?.trim()}"`);
              await button.click();
              await this.page.waitForTimeout(3000);
            } catch (error) {
              this.results.issues.push({
                type: 'e2e_suite_error',
                message: `E2E Suite button failed: ${error.message}`
              });
            }
          }
        }
        
      } catch (error) {
        this.results.issues.push({
          type: 'showcase_error',
          message: error.message,
          page: name,
          url: `${this.baseUrl}${url}`
        });
      }
    }
  }

  async runCompleteTest() {
    console.log('🚀 Starting comprehensive website test...');
    
    await this.init();
    
    // Test homepage
    await this.testHomepage();
    
    // Test all main pages
    const pages = [
      { url: '/getting-started', name: 'Getting Started' },
      { url: '/testing-patterns', name: 'Testing Patterns' },
      { url: '/utilities', name: 'Utilities' },
      { url: '/best-practices', name: 'Best Practices' },
      { url: '/ci-cd', name: 'CI/CD' },
      { url: '/examples', name: 'Examples' },
      { url: '/showcase', name: 'Showcase' }
    ];
    
    for (const page of pages) {
      await this.testPage(page.url, page.name);
    }
    
    // Test Templates page specifically
    await this.testTemplatesPage();
    
    // Test Showcase pages
    await this.testShowcasePages();
    
    await this.browser.close();
    
    console.log('✅ Test completed!');
    return this.results;
  }

  generateReport() {
    const report = {
      summary: {
        total_pages_tested: Object.keys(this.results.pages).length + 1, // +1 for homepage
        total_issues: this.results.issues.length,
        total_screenshots: this.results.screenshots.length,
        test_completed: new Date().toISOString()
      },
      homepage: this.results.homepage,
      pages: this.results.pages,
      issues: this.results.issues,
      screenshots: this.results.screenshots.map(s => ({
        name: s.name,
        description: s.description,
        filename: s.filename,
        url: s.url
      }))
    };
    
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Test report saved to: ${reportPath}`);
    return report;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  (async () => {
    const tester = new WebsiteTester();
    try {
      await tester.runCompleteTest();
      const report = tester.generateReport();
      
      console.log('\n📊 TEST SUMMARY:');
      console.log(`Pages tested: ${report.summary.total_pages_tested}`);
      console.log(`Issues found: ${report.summary.total_issues}`);
      console.log(`Screenshots taken: ${report.summary.total_screenshots}`);
      
      if (report.issues.length > 0) {
        console.log('\n❌ ISSUES FOUND:');
        report.issues.forEach((issue, i) => {
          console.log(`${i + 1}. ${issue.type}: ${issue.message}`);
          if (issue.page) console.log(`   Page: ${issue.page}`);
          if (issue.url) console.log(`   URL: ${issue.url}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = WebsiteTester;