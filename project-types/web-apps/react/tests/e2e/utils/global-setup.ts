import { chromium, FullConfig } from '@playwright/test';
import { AuthHelpers, storageStates, testUsers } from '../fixtures/auth';
import fs from 'fs';
import path from 'path';

/**
 * PA-QA Global Setup
 * 
 * Performs one-time setup before all tests:
 * - Creates authentication states for different user types
 * - Sets up test database
 * - Initializes shared resources
 * - Prepares test fixtures
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting PA-QA E2E test setup...');

  // Create .auth directory if it doesn't exist
  const authDir = path.dirname(Object.values(storageStates)[0]);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Start a browser for authentication setup
  const browser = await chromium.launch();
  
  try {
    // Create authentication states for different user types
    await setupAuthenticationStates(browser);
    
    // Setup test database
    await setupTestDatabase();
    
    // Initialize test fixtures
    await initializeTestFixtures();
    
    // Setup performance monitoring
    await setupPerformanceMonitoring();
    
    console.log('✅ PA-QA E2E test setup completed successfully');
    
  } catch (error) {
    console.error('❌ PA-QA E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Create and save authentication states for different user roles
 */
async function setupAuthenticationStates(browser: any) {
  console.log('🔐 Setting up authentication states...');
  
  const userTypes: Array<keyof typeof testUsers> = ['admin', 'user', 'viewer'];
  
  for (const userType of userTypes) {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Setup API mocks
      await AuthHelpers.setupAuthMocks(page);
      
      // Perform login and save state
      await AuthHelpers.loginAndSaveState(
        page,
        userType,
        storageStates[userType]
      );
      
      console.log(`✅ Authentication state created for ${userType}`);
      
    } catch (error) {
      console.error(`❌ Failed to create auth state for ${userType}:`, error);
      throw error;
    } finally {
      await context.close();
    }
  }
}

/**
 * Setup test database with initial data
 */
async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...');
  
  try {
    // In a real application, you would:
    // 1. Create/reset test database
    // 2. Run migrations
    // 3. Seed with test data
    
    // Mock database setup for demonstration
    const testData = {
      users: [
        {
          id: 1,
          email: testUsers.admin.email,
          role: 'admin',
          name: 'Admin User',
          status: 'active'
        },
        {
          id: 2,
          email: testUsers.user.email,
          role: 'user',
          name: 'Test User',
          status: 'active'
        },
        {
          id: 3,
          email: testUsers.viewer.email,
          role: 'viewer',
          name: 'Viewer User',
          status: 'active'
        },
        {
          id: 4,
          email: testUsers.inactive.email,
          role: 'user',
          name: 'Inactive User',
          status: 'inactive'
        }
      ],
      projects: [
        {
          id: 1,
          name: 'Sample Project',
          description: 'A sample project for testing',
          status: 'active',
          owner_id: 1
        }
      ],
      tasks: [
        {
          id: 1,
          title: 'Sample Task',
          description: 'A sample task for testing',
          status: 'pending',
          project_id: 1,
          assigned_to: 2
        }
      ]
    };
    
    // Save test data to file for reference
    const testDataPath = path.join(__dirname, '../fixtures/test-data.json');
    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
    
    console.log('✅ Test database setup completed');
    
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Initialize test fixtures and sample files
 */
async function initializeTestFixtures() {
  console.log('📁 Initializing test fixtures...');
  
  const fixturesDir = path.join(__dirname, '../fixtures');
  
  // Create fixtures directory if it doesn't exist
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  // Create sample CSV file for import tests
  const sampleCsvPath = path.join(fixturesDir, 'sample-data.csv');
  const csvContent = `full_name,email_address,phone,department
John Doe,john.doe@example.com,555-0101,Engineering
Jane Smith,jane.smith@example.com,555-0102,Marketing
Bob Johnson,bob.johnson@example.com,555-0103,Sales
Alice Brown,alice.brown@example.com,555-0104,Support`;
  
  fs.writeFileSync(sampleCsvPath, csvContent);
  
  // Create sample CSV with validation errors
  const invalidCsvPath = path.join(fixturesDir, 'invalid-data.csv');
  const invalidCsvContent = `full_name,email_address,phone,department
John Doe,invalid-email,555-0101,Engineering
Jane Smith,jane.smith@example.com,not-a-phone,Marketing
,bob.johnson@example.com,555-0103,Sales
Alice Brown,alice.brown@example.com,555-0104,
Test User,test@example.com,555-0105,Unknown Department`;
  
  fs.writeFileSync(invalidCsvPath, invalidCsvContent);
  
  // Create sample PDF file (mock)
  const samplePdfPath = path.join(fixturesDir, 'sample-document.pdf');
  const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF');
  
  fs.writeFileSync(samplePdfPath, pdfContent);
  
  // Create sample image files
  const images = ['avatar-1.jpg', 'avatar-2.jpg', 'logo.png'];
  for (const imageName of images) {
    const imagePath = path.join(fixturesDir, imageName);
    // Create minimal valid image file (1x1 PNG)
    const imageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8E, 0x23, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(imagePath, imageBuffer);
  }
  
  console.log('✅ Test fixtures initialized');
}

/**
 * Setup performance monitoring baseline
 */
async function setupPerformanceMonitoring() {
  console.log('📊 Setting up performance monitoring...');
  
  try {
    const performanceDir = path.join(__dirname, '../results/performance');
    if (!fs.existsSync(performanceDir)) {
      fs.mkdirSync(performanceDir, { recursive: true });
    }
    
    // Create performance baseline configuration
    const performanceConfig = {
      budgets: {
        loadTime: 3000, // 3 seconds
        firstContentfulPaint: 1500, // 1.5 seconds
        largestContentfulPaint: 2500, // 2.5 seconds
        cumulativeLayoutShift: 0.1,
        firstInputDelay: 100 // 100ms
      },
      thresholds: {
        accessibility: 0, // No violations allowed
        performance: 90, // Lighthouse performance score
        bestPractices: 90,
        seo: 90
      }
    };
    
    const configPath = path.join(performanceDir, 'performance-config.json');
    fs.writeFileSync(configPath, JSON.stringify(performanceConfig, null, 2));
    
    console.log('✅ Performance monitoring setup completed');
    
  } catch (error) {
    console.error('❌ Performance monitoring setup failed:', error);
    throw error;
  }
}

/**
 * Verify environment prerequisites
 */
async function verifyEnvironment() {
  console.log('🔍 Verifying environment prerequisites...');
  
  // Check required environment variables
  const requiredEnvVars = ['BASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Check if test server is running
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      console.warn('⚠️ Health check failed, but continuing with setup');
    }
  } catch (error) {
    console.warn('⚠️ Could not connect to test server, but continuing with setup');
  }
  
  console.log('✅ Environment verification completed');
}

/**
 * Cleanup any existing test artifacts
 */
async function cleanupPreviousRuns() {
  console.log('🧹 Cleaning up previous test runs...');
  
  const dirs = [
    path.join(__dirname, '../results'),
    path.join(__dirname, '../allure-results'),
    path.join(__dirname, '../test-results')
  ];
  
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
  }
  
  console.log('✅ Cleanup completed');
}

export default async function(config: FullConfig) {
  await verifyEnvironment();
  await cleanupPreviousRuns();
  await globalSetup(config);
}