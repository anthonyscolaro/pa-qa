/**
 * Playwright Global Teardown
 * 
 * This file handles cleanup after all Playwright tests have completed.
 * It cleans up test artifacts, generates reports, and performs final cleanup.
 */

import { FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...')
  
  try {
    // Clean up temporary authentication files
    const authFile = path.join(process.cwd(), 'tests/setup/auth.json')
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile)
      console.log('🗑️ Cleaned up authentication state file')
    }
    
    // Archive test results if in CI
    if (process.env.CI) {
      console.log('📦 Archiving test results for CI...')
      
      // Create archive directory with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const archiveDir = path.join(process.cwd(), 'archived-results', timestamp)
      
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true })
      }
      
      // Copy important test artifacts
      const artifactsToArchive = [
        'test-results',
        'playwright-report',
        'allure-results'
      ]
      
      for (const artifact of artifactsToArchive) {
        const sourcePath = path.join(process.cwd(), artifact)
        const targetPath = path.join(archiveDir, artifact)
        
        if (fs.existsSync(sourcePath)) {
          fs.cpSync(sourcePath, targetPath, { recursive: true })
          console.log(`📋 Archived ${artifact}`)
        }
      }
    }
    
    // Generate summary report
    const summaryPath = path.join(process.cwd(), 'test-results', 'test-summary.json')
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
      console.log('📊 Test Summary:')
      console.log(`   ✅ Passed: ${summary.passed || 0}`)
      console.log(`   ❌ Failed: ${summary.failed || 0}`)
      console.log(`   ⏭️  Skipped: ${summary.skipped || 0}`)
      console.log(`   ⏱️  Duration: ${summary.duration || 'Unknown'}`)
    }
    
    // Clean up large temporary files if needed
    const tempFiles = [
      'tests/screenshots/temp',
      'tests/videos/temp'
    ]
    
    for (const tempPath of tempFiles) {
      const fullPath = path.join(process.cwd(), tempPath)
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true })
        console.log(`🗑️ Cleaned up temporary files: ${tempPath}`)
      }
    }
    
    console.log('✅ Playwright global teardown completed successfully!')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw - teardown failures shouldn't fail the entire test run
  }
}

export default globalTeardown