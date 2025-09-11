const http = require('http');

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Getting Started', path: '/getting-started' },
  { name: 'Testing Patterns', path: '/testing-patterns' },
  { name: 'Utilities', path: '/utilities' },
  { name: 'Best Practices', path: '/best-practices' },
  { name: 'CI/CD', path: '/ci-cd' },
  { name: 'Templates', path: '/templates' },
  { name: 'Examples', path: '/examples' },
  { name: 'Showcase', path: '/showcase' },
];

console.log('🔍 Checking PA-QA Showcase Pages\n');
console.log('=====================================\n');

async function checkPage(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const hasContent = data.length > 1000;
        const hasH1 = data.includes('<h1');
        const hasMain = data.includes('<main');
        const isEmpty = data.includes('empty') || data.includes('404') || data.includes('not found');
        
        resolve({
          status: res.statusCode,
          contentLength: data.length,
          hasContent,
          hasH1,
          hasMain,
          isEmpty
        });
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    req.end();
  });
}

async function checkAllPages() {
  for (const page of pages) {
    const result = await checkPage(page.path);
    
    if (result.error) {
      console.log(`❌ ${page.name} (${page.path})`);
      console.log(`   Error: ${result.error}\n`);
    } else {
      const icon = result.hasContent && result.hasH1 ? '✅' : '⚠️';
      console.log(`${icon} ${page.name} (${page.path})`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Content length: ${result.contentLength} bytes`);
      console.log(`   Has H1: ${result.hasH1 ? 'Yes' : 'No'}`);
      console.log(`   Has Main: ${result.hasMain ? 'Yes' : 'No'}`);
      if (result.isEmpty) {
        console.log(`   ⚠️  Page might be empty or showing error`);
      }
      console.log('');
    }
  }
  
  console.log('=====================================');
  console.log('📊 Summary:');
  console.log('   ✅ = Page has content and H1');
  console.log('   ⚠️  = Page might be missing content');
}

// Wait a moment for the server to be ready
setTimeout(() => {
  checkAllPages();
}, 2000);