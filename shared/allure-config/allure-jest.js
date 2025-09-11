/**
 * Jest Allure Reporter Configuration
 * 
 * Comprehensive Allure integration for Jest test framework
 * Supports screenshots, attachments, parallel execution, and detailed reporting
 */

const path = require('path');
const fs = require('fs');

// Environment configuration
const PROJECT_NAME = process.env.ALLURE_PROJECT_NAME || 'unknown-project';
const ALLURE_RESULTS_DIR = process.env.ALLURE_RESULTS_DIR || './allure-results';
const CI_BUILD_URL = process.env.CI_BUILD_URL || process.env.GITHUB_SERVER_URL;
const CI_BUILD_NUMBER = process.env.CI_BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER;
const CI_COMMIT_SHA = process.env.CI_COMMIT_SHA || process.env.GITHUB_SHA;
const CI_BRANCH = process.env.CI_BRANCH || process.env.GITHUB_REF_NAME;

module.exports = {
  // Allure Jest reporter configuration
  reporter: [
    'default',
    [
      'jest-allure/dist/reporter',
      {
        resultsDir: ALLURE_RESULTS_DIR,
        projectName: PROJECT_NAME,
        environmentInfo: {
          'Project Name': PROJECT_NAME,
          'Test Framework': 'Jest',
          'Node Version': process.version,
          'Platform': process.platform,
          'CI Build URL': CI_BUILD_URL,
          'CI Build Number': CI_BUILD_NUMBER,
          'Commit SHA': CI_COMMIT_SHA,
          'Branch': CI_BRANCH,
          'Test Run Date': new Date().toISOString(),
        },
        categories: [
          {
            name: 'Product defects',
            matchedStatuses: ['failed'],
            messageRegex: '.*Assertion.*',
          },
          {
            name: 'Test defects',
            matchedStatuses: ['failed'],
            messageRegex: '.*TypeError.*|.*ReferenceError.*',
          },
          {
            name: 'Infrastructure problems',
            matchedStatuses: ['broken'],
            messageRegex: '.*timeout.*|.*connection.*',
          },
          {
            name: 'Flaky tests',
            matchedStatuses: ['failed', 'passed'],
            messageRegex: '.*flaky.*',
          },
        ],
        executorInfo: {
          name: 'Jest',
          type: 'jest',
          url: CI_BUILD_URL,
          buildOrder: CI_BUILD_NUMBER,
          buildName: `${PROJECT_NAME}-${CI_BUILD_NUMBER}`,
          buildUrl: CI_BUILD_URL,
          reportUrl: `https://allure.projectassistant.ai/${PROJECT_NAME}`,
          reportName: `${PROJECT_NAME} Test Report`,
        },
      },
    ],
  ],

  // Jest configuration for Allure integration
  setupFilesAfterEnv: ['<rootDir>/shared/allure-config/jest-allure-setup.js'],
  
  // Test timeout for async operations
  testTimeout: 30000,
  
  // Collect coverage for Allure reports
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  
  // Test environment setup
  testEnvironment: 'jsdom',
  
  // Module name mapping for better error reporting
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/tests/$1',
  },
  
  // Global teardown for Allure results processing
  globalTeardown: '<rootDir>/shared/allure-config/jest-allure-teardown.js',
};

// Jest Allure Setup File Content
const jestAllureSetupContent = `
import { allure } from 'allure-jest';

// Global test setup for Allure reporting
beforeEach(() => {
  // Add test metadata
  const testName = expect.getState().currentTestName;
  const testFilePath = expect.getState().testPath;
  
  allure.feature('${PROJECT_NAME}');
  allure.story(path.basename(testFilePath, '.test.js'));
  
  // Add environment labels
  allure.label('framework', 'jest');
  allure.label('language', 'javascript');
  allure.label('project', '${PROJECT_NAME}');
  
  // Add CI/CD information
  if (process.env.CI) {
    allure.label('ci', 'true');
    allure.label('build', process.env.GITHUB_RUN_NUMBER || 'local');
  }
});

// Global error handler for better Allure reporting
process.on('unhandledRejection', (reason, promise) => {
  allure.attachment('Unhandled Rejection', JSON.stringify({
    reason: reason?.toString(),
    stack: reason?.stack,
    promise: promise?.toString(),
  }, null, 2), 'application/json');
});

// Screenshot helper for failed tests
afterEach(async () => {
  const testState = expect.getState();
  
  if (testState.numPassingAsserts === 0 && testState.assertionCalls > 0) {
    // Test failed, take screenshot if possible
    if (global.page && typeof global.page.screenshot === 'function') {
      try {
        const screenshot = await global.page.screenshot({ fullPage: true });
        allure.attachment('Screenshot on Failure', screenshot, 'image/png');
      } catch (error) {
        allure.attachment('Screenshot Error', error.message, 'text/plain');
      }
    }
    
    // Attach browser logs if available
    if (global.page && typeof global.page.evaluate === 'function') {
      try {
        const logs = await global.page.evaluate(() => {
          return {
            errors: window.console.errors || [],
            warnings: window.console.warnings || [],
            url: window.location.href,
          };
        });
        allure.attachment('Browser Logs', JSON.stringify(logs, null, 2), 'application/json');
      } catch (error) {
        // Ignore if browser context not available
      }
    }
  }
});

// Performance measurement helpers
global.allureStep = (name, fn) => {
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

global.allureTestCase = (url) => {
  allure.testCaseId(url);
};
`;

// Jest Allure Teardown File Content
const jestAllureTeardownContent = `
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const resultsDir = '${ALLURE_RESULTS_DIR}';
  
  // Ensure results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Create environment.properties file
  const envProperties = [
    'Project=${PROJECT_NAME}',
    'Framework=Jest',
    'Node.Version=' + process.version,
    'Platform=' + process.platform,
    'Test.Run.Date=' + new Date().toISOString(),
  ];
  
  if (process.env.CI) {
    envProperties.push('CI=true');
    envProperties.push('Build.Number=' + (process.env.GITHUB_RUN_NUMBER || 'unknown'));
    envProperties.push('Commit.SHA=' + (process.env.GITHUB_SHA || 'unknown'));
    envProperties.push('Branch=' + (process.env.GITHUB_REF_NAME || 'unknown'));
  }
  
  fs.writeFileSync(
    path.join(resultsDir, 'environment.properties'),
    envProperties.join('\\n')
  );
  
  // Create executor.json file
  const executorInfo = {
    name: 'Jest',
    type: 'jest',
    url: '${CI_BUILD_URL}',
    buildOrder: parseInt('${CI_BUILD_NUMBER}') || 0,
    buildName: '${PROJECT_NAME}-${CI_BUILD_NUMBER}',
    buildUrl: '${CI_BUILD_URL}',
    reportUrl: 'https://allure.projectassistant.ai/${PROJECT_NAME}',
    reportName: '${PROJECT_NAME} Test Report',
  };
  
  fs.writeFileSync(
    path.join(resultsDir, 'executor.json'),
    JSON.stringify(executorInfo, null, 2)
  );
  
  console.log('✅ Allure results prepared in:', resultsDir);
};
`;

// Write setup and teardown files
const setupFilePath = path.dirname(__filename) + '/jest-allure-setup.js';
const teardownFilePath = path.dirname(__filename) + '/jest-allure-teardown.js';

if (!fs.existsSync(setupFilePath)) {
  fs.writeFileSync(setupFilePath, jestAllureSetupContent);
}

if (!fs.existsSync(teardownFilePath)) {
  fs.writeFileSync(teardownFilePath, jestAllureTeardownContent);
}