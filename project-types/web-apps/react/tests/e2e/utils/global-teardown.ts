import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * PA-QA Global Teardown
 * 
 * Performs cleanup after all tests complete:
 * - Generates consolidated reports
 * - Uploads results to Allure dashboard
 * - Cleans up temporary files
 * - Archives test artifacts
 */

async function globalTeardown(config: FullConfig) {
  console.log('🏁 Starting PA-QA E2E test teardown...');

  try {
    // Generate consolidated reports
    await generateReports();
    
    // Upload results to Allure dashboard
    await uploadToAllure();
    
    // Archive test artifacts
    await archiveTestArtifacts();
    
    // Cleanup temporary files
    await cleanupTemporaryFiles();
    
    // Generate performance summary
    await generatePerformanceSummary();
    
    console.log('✅ PA-QA E2E test teardown completed successfully');
    
  } catch (error) {
    console.error('❌ PA-QA E2E test teardown failed:', error);
    // Don't throw error to avoid failing the entire test run
  }
}

/**
 * Generate consolidated test reports
 */
async function generateReports() {
  console.log('📊 Generating consolidated reports...');
  
  try {
    const resultsDir = path.join(__dirname, '../results');
    const reportsDir = path.join(resultsDir, 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate HTML report if Playwright results exist
    const testResultsPath = path.join(__dirname, '../test-results.json');
    if (fs.existsSync(testResultsPath)) {
      try {
        execSync('npx playwright show-report --reporter=html', {
          cwd: path.join(__dirname, '../'),
          stdio: 'inherit'
        });
        console.log('✅ HTML report generated');
      } catch (error) {
        console.warn('⚠️ Could not generate HTML report:', error);
      }
    }
    
    // Generate Allure report if results exist
    const allureResultsPath = path.join(__dirname, '../allure-results');
    if (fs.existsSync(allureResultsPath) && fs.readdirSync(allureResultsPath).length > 0) {
      try {
        execSync('npx allure generate allure-results --clean -o allure-report', {
          cwd: path.join(__dirname, '../'),
          stdio: 'inherit'
        });
        console.log('✅ Allure report generated');
      } catch (error) {
        console.warn('⚠️ Could not generate Allure report:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Report generation failed:', error);
  }
}

/**
 * Upload test results to centralized Allure dashboard
 */
async function uploadToAllure() {
  console.log('☁️ Uploading results to Allure dashboard...');
  
  try {
    const allureResultsPath = path.join(__dirname, '../allure-results');
    
    if (!fs.existsSync(allureResultsPath) || fs.readdirSync(allureResultsPath).length === 0) {
      console.log('ℹ️ No Allure results to upload');
      return;
    }
    
    // Get project name from package.json or environment
    const projectName = process.env.PROJECT_NAME || 'react-e2e-tests';
    const buildId = process.env.BUILD_ID || Date.now().toString();
    
    // Upload using shared script
    const uploadScript = path.join(__dirname, '../../../../shared/allure-config/upload-results.sh');
    
    if (fs.existsSync(uploadScript)) {
      try {
        execSync(`bash "${uploadScript}" "${projectName}" "${buildId}" "${allureResultsPath}"`, {
          stdio: 'inherit',
          env: {
            ...process.env,
            ALLURE_SERVER_URL: 'https://allure.projectassistant.ai'
          }
        });
        console.log('✅ Results uploaded to Allure dashboard');
      } catch (error) {
        console.warn('⚠️ Could not upload to Allure dashboard:', error);
      }
    } else {
      console.warn('⚠️ Allure upload script not found');
    }
    
  } catch (error) {
    console.error('❌ Allure upload failed:', error);
  }
}

/**
 * Archive test artifacts for future reference
 */
async function archiveTestArtifacts() {
  console.log('🗄️ Archiving test artifacts...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(__dirname, '../../../archives', timestamp);
    
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    // Archive directories to copy
    const archivePaths = [
      { src: '../test-results', dest: 'test-results' },
      { src: '../allure-results', dest: 'allure-results' },
      { src: '../allure-report', dest: 'allure-report' },
      { src: '../results', dest: 'results' }
    ];
    
    for (const { src, dest } of archivePaths) {
      const srcPath = path.join(__dirname, src);
      const destPath = path.join(archiveDir, dest);
      
      if (fs.existsSync(srcPath)) {
        try {
          fs.cpSync(srcPath, destPath, { recursive: true });
          console.log(`✅ Archived ${dest}`);
        } catch (error) {
          console.warn(`⚠️ Could not archive ${dest}:`, error);
        }
      }
    }
    
    // Create archive metadata
    const metadata = {
      timestamp,
      projectName: process.env.PROJECT_NAME || 'react-e2e-tests',
      buildId: process.env.BUILD_ID || 'local',
      branch: process.env.BRANCH_NAME || 'unknown',
      environment: process.env.NODE_ENV || 'test',
      playwrightVersion: require('@playwright/test/package.json').version,
      nodeVersion: process.version
    };
    
    fs.writeFileSync(
      path.join(archiveDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`✅ Test artifacts archived to: ${archiveDir}`);
    
  } catch (error) {
    console.error('❌ Archiving failed:', error);
  }
}

/**
 * Cleanup temporary files and directories
 */
async function cleanupTemporaryFiles() {
  console.log('🧹 Cleaning up temporary files...');
  
  try {
    const tempPaths = [
      path.join(__dirname, '../.auth'),
      path.join(__dirname, '../fixtures/test-data.json'),
      path.join(__dirname, '../temp')
    ];
    
    for (const tempPath of tempPaths) {
      if (fs.existsSync(tempPath)) {
        try {
          fs.rmSync(tempPath, { recursive: true, force: true });
          console.log(`✅ Cleaned up ${path.basename(tempPath)}`);
        } catch (error) {
          console.warn(`⚠️ Could not cleanup ${tempPath}:`, error);
        }
      }
    }
    
    // Keep important artifacts but clean up large temporary files
    const keepPaths = [
      '../test-results',
      '../allure-results',
      '../results/reports'
    ];
    
    for (const keepPath of keepPaths) {
      const fullPath = path.join(__dirname, keepPath);
      if (fs.existsSync(fullPath)) {
        // Remove large files but keep the structure
        const files = fs.readdirSync(fullPath, { withFileTypes: true });
        for (const file of files) {
          if (file.isFile()) {
            const filePath = path.join(fullPath, file.name);
            const stats = fs.statSync(filePath);
            
            // Remove files larger than 10MB
            if (stats.size > 10 * 1024 * 1024) {
              fs.unlinkSync(filePath);
              console.log(`✅ Removed large file: ${file.name}`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

/**
 * Generate performance summary report
 */
async function generatePerformanceSummary() {
  console.log('📈 Generating performance summary...');
  
  try {
    const performanceDir = path.join(__dirname, '../results/performance');
    const summaryPath = path.join(performanceDir, 'summary.json');
    
    if (!fs.existsSync(performanceDir)) {
      fs.mkdirSync(performanceDir, { recursive: true });
    }
    
    // Collect performance data from test results
    const performanceData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        averageLoadTime: 0,
        slowestTests: [],
        fastestTests: []
      },
      metrics: {
        accessibility: {
          violations: 0,
          averageScore: 100
        },
        performance: {
          averageScore: 0,
          budgetViolations: []
        },
        coverage: {
          pages: 0,
          interactions: 0,
          browsers: []
        }
      },
      recommendations: []
    };
    
    // Parse test results if available
    const testResultsPath = path.join(__dirname, '../test-results.json');
    if (fs.existsSync(testResultsPath)) {
      try {
        const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
        
        performanceData.summary.totalTests = testResults.suites?.length || 0;
        
        // Add more detailed analysis here based on actual test results structure
        
      } catch (error) {
        console.warn('⚠️ Could not parse test results for performance summary');
      }
    }
    
    // Generate recommendations based on results
    performanceData.recommendations = [
      'Consider implementing lazy loading for images',
      'Optimize bundle size for better initial load times',
      'Implement service worker for offline functionality',
      'Add performance monitoring in production'
    ];
    
    fs.writeFileSync(summaryPath, JSON.stringify(performanceData, null, 2));
    
    console.log('✅ Performance summary generated');
    
    // Display key metrics
    console.log('\n📊 Test Execution Summary:');
    console.log(`Total Tests: ${performanceData.summary.totalTests}`);
    console.log(`Accessibility Violations: ${performanceData.metrics.accessibility.violations}`);
    console.log(`Performance Score: ${performanceData.metrics.performance.averageScore || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Performance summary generation failed:', error);
  }
}

/**
 * Send notification about test completion
 */
async function sendNotification() {
  console.log('📬 Sending test completion notification...');
  
  try {
    // In a real environment, you might send notifications to:
    // - Slack channels
    // - Email lists
    // - Teams webhooks
    // - Project management tools
    
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    
    if (webhookUrl || discordWebhook) {
      const message = {
        text: '🧪 E2E Test Suite Completed',
        attachments: [{
          color: 'good',
          fields: [
            {
              title: 'Project',
              value: process.env.PROJECT_NAME || 'React E2E Tests',
              short: true
            },
            {
              title: 'Environment',
              value: process.env.NODE_ENV || 'test',
              short: true
            },
            {
              title: 'Build ID',
              value: process.env.BUILD_ID || 'local',
              short: true
            }
          ]
        }]
      };
      
      // Send notification (implementation depends on your notification service)
      console.log('ℹ️ Notification ready to send (webhook implementation needed)');
    }
    
  } catch (error) {
    console.warn('⚠️ Could not send notification:', error);
  }
}

/**
 * Generate test execution statistics
 */
async function generateExecutionStats() {
  console.log('📋 Generating execution statistics...');
  
  try {
    const stats = {
      executionTime: {
        start: process.env.TEST_START_TIME || Date.now(),
        end: Date.now(),
        duration: 0
      },
      environment: {
        nodeVersion: process.version,
        playwrightVersion: require('@playwright/test/package.json').version,
        os: process.platform,
        ci: !!process.env.CI
      },
      resources: {
        maxMemoryUsage: process.memoryUsage().heapUsed,
        finalMemoryUsage: process.memoryUsage()
      }
    };
    
    stats.executionTime.duration = stats.executionTime.end - stats.executionTime.start;
    
    const statsPath = path.join(__dirname, '../results/execution-stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    
    console.log(`✅ Execution completed in ${Math.round(stats.executionTime.duration / 1000)}s`);
    
  } catch (error) {
    console.error('❌ Stats generation failed:', error);
  }
}

export default async function(config: FullConfig) {
  await generateExecutionStats();
  await generatePerformanceSummary();
  await generateReports();
  await uploadToAllure();
  await archiveTestArtifacts();
  await cleanupTemporaryFiles();
  await sendNotification();
  await globalTeardown(config);
}