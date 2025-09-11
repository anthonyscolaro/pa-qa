/**
 * Vitest Allure Reporter Configuration
 * 
 * Comprehensive Allure integration for Vitest test framework
 * Supports screenshots, attachments, parallel execution, and detailed reporting
 */

import { defineConfig } from 'vitest/config';
import { allure } from 'allure-vitest/reporter';
import { resolve } from 'path';

// Environment configuration
const PROJECT_NAME = process.env.ALLURE_PROJECT_NAME || 'unknown-project';
const ALLURE_RESULTS_DIR = process.env.ALLURE_RESULTS_DIR || './allure-results';
const CI_BUILD_URL = process.env.CI_BUILD_URL || process.env.GITHUB_SERVER_URL;
const CI_BUILD_NUMBER = process.env.CI_BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER;
const CI_COMMIT_SHA = process.env.CI_COMMIT_SHA || process.env.GITHUB_SHA;
const CI_BRANCH = process.env.CI_BRANCH || process.env.GITHUB_REF_NAME;

export default defineConfig({
  test: {
    // Allure reporter configuration
    reporters: [
      'default',
      [
        'allure-vitest/reporter',
        {
          resultsDir: ALLURE_RESULTS_DIR,
          projectName: PROJECT_NAME,
          detail: true,
          
          // Environment information
          environmentInfo: {
            'Project Name': PROJECT_NAME,
            'Test Framework': 'Vitest',
            'Node Version': process.version,
            'Platform': process.platform,
            'Vitest Version': '1.0.0', // Will be dynamically determined
            'CI Build URL': CI_BUILD_URL,
            'CI Build Number': CI_BUILD_NUMBER,
            'Commit SHA': CI_COMMIT_SHA,
            'Branch': CI_BRANCH,
            'Test Run Date': new Date().toISOString(),
          },
          
          // Test categorization
          categories: [
            {
              name: 'Product defects',
              matchedStatuses: ['failed'],
              messageRegex: '.*AssertionError.*|.*expect.*',
            },
            {
              name: 'Test defects',
              matchedStatuses: ['failed'],
              messageRegex: '.*TypeError.*|.*ReferenceError.*|.*SyntaxError.*',
            },
            {
              name: 'Infrastructure problems',
              matchedStatuses: ['broken'],
              messageRegex: '.*timeout.*|.*connection.*|.*network.*',
            },
            {
              name: 'Performance issues',
              matchedStatuses: ['failed'],
              messageRegex: '.*performance.*|.*slow.*|.*timeout.*',
            },
            {
              name: 'Flaky tests',
              matchedStatuses: ['failed', 'passed'],
              messageRegex: '.*flaky.*|.*intermittent.*',
            },
          ],
          
          // Executor information
          executorInfo: {
            name: 'Vitest',
            type: 'vitest',
            url: CI_BUILD_URL,
            buildOrder: parseInt(CI_BUILD_NUMBER || '0'),
            buildName: `${PROJECT_NAME}-${CI_BUILD_NUMBER}`,
            buildUrl: CI_BUILD_URL,
            reportUrl: `https://allure.projectassistant.ai/${PROJECT_NAME}`,
            reportName: `${PROJECT_NAME} Test Report`,
          },
          
          // Links configuration
          links: [
            {
              type: 'issue',
              urlTemplate: 'https://github.com/your-org/your-repo/issues/%s',
              nameTemplate: 'Issue #%s',
            },
            {
              type: 'tms',
              urlTemplate: 'https://your-tms.com/testcase/%s',
              nameTemplate: 'Test Case %s',
            },
          ],
        },
      ],
    ],
    
    // Test environment configuration
    environment: 'jsdom',
    
    // Global setup and teardown
    globalSetup: [resolve(__dirname, 'vitest-allure-setup.ts')],
    setupFiles: [resolve(__dirname, 'vitest-allure-test-setup.ts')],
    
    // Coverage configuration for Allure
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
      ],
    },
    
    // Test timeout and retry configuration
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    
    // File patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  
  // Resolve aliases for better error reporting
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@test': resolve(__dirname, '../../tests'),
      '@shared': resolve(__dirname, '../../shared'),
    },
  },
});

// Vitest Global Setup Content
export const vitestAllureGlobalSetupContent = `
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const ALLURE_RESULTS_DIR = process.env.ALLURE_RESULTS_DIR || './allure-results';
const PROJECT_NAME = process.env.ALLURE_PROJECT_NAME || 'unknown-project';

export default function setup() {
  console.log('🚀 Setting up Vitest with Allure reporting...');
  
  // Ensure results directory exists
  if (!existsSync(ALLURE_RESULTS_DIR)) {
    mkdirSync(ALLURE_RESULTS_DIR, { recursive: true });
  }
  
  // Create environment.properties file
  const envProperties = [
    \`Project=\${PROJECT_NAME}\`,
    'Framework=Vitest',
    \`Node.Version=\${process.version}\`,
    \`Platform=\${process.platform}\`,
    \`Test.Run.Date=\${new Date().toISOString()}\`,
  ];
  
  if (process.env.CI) {
    envProperties.push('CI=true');
    envProperties.push(\`Build.Number=\${process.env.GITHUB_RUN_NUMBER || 'unknown'}\`);
    envProperties.push(\`Commit.SHA=\${process.env.GITHUB_SHA || 'unknown'}\`);
    envProperties.push(\`Branch=\${process.env.GITHUB_REF_NAME || 'unknown'}\`);
  }
  
  writeFileSync(
    resolve(ALLURE_RESULTS_DIR, 'environment.properties'),
    envProperties.join('\\n')
  );
  
  // Create executor.json file
  const executorInfo = {
    name: 'Vitest',
    type: 'vitest',
    url: process.env.CI_BUILD_URL || process.env.GITHUB_SERVER_URL,
    buildOrder: parseInt(process.env.CI_BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || '0'),
    buildName: \`\${PROJECT_NAME}-\${process.env.CI_BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER}\`,
    buildUrl: process.env.CI_BUILD_URL || process.env.GITHUB_SERVER_URL,
    reportUrl: \`https://allure.projectassistant.ai/\${PROJECT_NAME}\`,
    reportName: \`\${PROJECT_NAME} Test Report\`,
  };
  
  writeFileSync(
    resolve(ALLURE_RESULTS_DIR, 'executor.json'),
    JSON.stringify(executorInfo, null, 2)
  );
  
  console.log('✅ Allure setup completed');
}
`;

// Vitest Test Setup Content
export const vitestAllureTestSetupContent = `
import { beforeEach, afterEach } from 'vitest';
import { allure } from 'allure-vitest';

const PROJECT_NAME = process.env.ALLURE_PROJECT_NAME || 'unknown-project';

// Global test setup for Allure reporting
beforeEach((ctx) => {
  // Add test metadata
  const testName = ctx.task.name;
  const testFilePath = ctx.task.file?.filepath || 'unknown';
  
  // Set feature and story
  allure.feature(PROJECT_NAME);
  allure.story(testFilePath.split('/').pop()?.replace(/\\.(test|spec)\\.(ts|js)$/, '') || 'unknown');
  
  // Add environment labels
  allure.label('framework', 'vitest');
  allure.label('language', 'typescript');
  allure.label('project', PROJECT_NAME);
  allure.label('testClass', testFilePath.split('/').pop() || 'unknown');
  
  // Add CI/CD information
  if (process.env.CI) {
    allure.label('ci', 'true');
    allure.label('build', process.env.GITHUB_RUN_NUMBER || 'local');
    allure.label('branch', process.env.GITHUB_REF_NAME || 'unknown');
  }
  
  // Add severity based on test name patterns
  if (testName.toLowerCase().includes('critical')) {
    allure.severity('critical');
  } else if (testName.toLowerCase().includes('major')) {
    allure.severity('major');
  } else if (testName.toLowerCase().includes('minor')) {
    allure.severity('minor');
  } else {
    allure.severity('normal');
  }
});

// Global error handler for better Allure reporting
process.on('unhandledRejection', (reason, promise) => {
  allure.attachment('Unhandled Rejection', JSON.stringify({
    reason: reason?.toString(),
    stack: reason?.stack,
    promise: promise?.toString(),
    timestamp: new Date().toISOString(),
  }, null, 2), 'application/json');
});

// Screenshot and log capture for failed tests
afterEach(async (ctx) => {
  if (ctx.task.result?.state === 'fail') {
    // Test failed, capture additional information
    
    // Take screenshot if page context is available (for E2E tests)
    if (global.page && typeof global.page.screenshot === 'function') {
      try {
        const screenshot = await global.page.screenshot({ 
          fullPage: true,
          quality: 80,
        });
        allure.attachment('Screenshot on Failure', screenshot, 'image/png');
        
        // Capture page URL and title
        const pageInfo = await global.page.evaluate(() => ({
          url: window.location.href,
          title: document.title,
          userAgent: navigator.userAgent,
        }));
        allure.attachment('Page Information', JSON.stringify(pageInfo, null, 2), 'application/json');
      } catch (error) {
        allure.attachment('Screenshot Error', error.message, 'text/plain');
      }
    }
    
    // Attach browser logs if available
    if (global.page && typeof global.page.evaluate === 'function') {
      try {
        const logs = await global.page.evaluate(() => {
          return {
            errors: (window as any).testErrors || [],
            warnings: (window as any).testWarnings || [],
            performance: performance.getEntriesByType('navigation')[0],
          };
        });
        allure.attachment('Browser Context', JSON.stringify(logs, null, 2), 'application/json');
      } catch (error) {
        // Ignore if browser context not available
      }
    }
    
    // Attach test error details
    if (ctx.task.result?.errors) {
      ctx.task.result.errors.forEach((error, index) => {
        allure.attachment(
          \`Error Details \${index + 1}\`,
          JSON.stringify({
            message: error.message,
            stack: error.stack,
            name: error.name,
          }, null, 2),
          'application/json'
        );
      });
    }
  }
});

// Global helper functions for Allure integration
declare global {
  function allureStep<T>(name: string, fn: () => T | Promise<T>): Promise<T>;
  function allureAttachment(name: string, content: string | Buffer, type?: string): void;
  function allureParameter(name: string, value: string): void;
  function allureIssue(url: string): void;
  function allureTestCase(id: string): void;
  function allureSeverity(severity: 'blocker' | 'critical' | 'major' | 'minor' | 'trivial'): void;
}

// Performance measurement helpers
global.allureStep = async (name, fn) => {
  return allure.step(name, fn);
};

global.allureAttachment = (name, content, type = 'text/plain') => {
  allure.attachment(name, content, type);
};

global.allureParameter = (name, value) => {
  allure.parameter(name, value);
};

global.allureIssue = (url) => {
  allure.issue(url);
};

global.allureTestCase = (id) => {
  allure.testCaseId(id);
};

global.allureSeverity = (severity) => {
  allure.severity(severity);
};
`;