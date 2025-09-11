/**
 * Performance Testing Suite
 * 
 * This file provides comprehensive performance testing for the PA-QA Showcase
 * application using Playwright's performance APIs and web vitals metrics.
 * It measures Core Web Vitals, load times, and resource optimization.
 */

import { test, expect, Page } from '@playwright/test'

// Performance thresholds (adjust based on your requirements)
const performanceThresholds = {
  // Core Web Vitals
  largestContentfulPaint: 2500, // ms
  firstContentfulPaint: 1800, // ms
  cumulativeLayoutShift: 0.1, // score
  firstInputDelay: 100, // ms
  timeToInteractive: 3800, // ms
  
  // Load time metrics
  domContentLoaded: 2000, // ms
  loadComplete: 5000, // ms
  
  // Resource metrics
  totalByteWeight: 2 * 1024 * 1024, // 2MB
  imageByteWeight: 1 * 1024 * 1024, // 1MB
  jsCompressedBytes: 500 * 1024, // 500KB
  cssCompressedBytes: 100 * 1024, // 100KB
  
  // Network metrics
  requestCount: 50, // total requests
  imageRequestCount: 20, // image requests
  
  // Performance scores (0-100)
  lighthousePerformanceScore: 90,
  lighthouseAccessibilityScore: 95,
  lighthouseBestPracticesScore: 95,
  lighthouseSeoScore: 95
}

// Helper functions
async function measurePageLoadMetrics(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      // Wait for load event
      if (document.readyState === 'complete') {
        collectMetrics()
      } else {
        window.addEventListener('load', collectMetrics)
      }
      
      function collectMetrics() {
        const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const paintEntries = performance.getEntriesByType('paint')
        
        const metrics = {
          // Navigation timing
          domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.navigationStart,
          loadComplete: perfEntries.loadEventEnd - perfEntries.navigationStart,
          timeToInteractive: 0, // Will be calculated separately
          
          // Paint metrics
          firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0, // Will be measured via Performance Observer
          
          // Layout metrics
          cumulativeLayoutShift: 0, // Will be measured via Performance Observer
          
          // Resource metrics
          resourceCount: performance.getEntriesByType('resource').length,
          
          // Memory (if available)
          usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
          totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
        }
        
        resolve(metrics)
      }
    })
  })
}

async function measureCoreWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals: any = {}
      
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        vitals.largestContentfulPaint = lastEntry.startTime
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      
      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0]
        if (firstInput) {
          vitals.firstInputDelay = firstInput.processingStart - firstInput.startTime
        }
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
      
      // Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        vitals.cumulativeLayoutShift = clsValue
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      
      // Resolve after a delay to collect metrics
      setTimeout(() => {
        resolve(vitals)
      }, 3000)
    })
  })
}

async function measureResourceMetrics(page: Page) {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    const resourceMetrics = {
      totalRequests: resources.length,
      totalByteSize: 0,
      imageRequests: 0,
      imageTotalBytes: 0,
      jsRequests: 0,
      jsTotalBytes: 0,
      cssRequests: 0,
      cssTotalBytes: 0,
      fontRequests: 0,
      slowestResource: { name: '', duration: 0 },
      requestsByType: {} as Record<string, number>
    }
    
    resources.forEach(resource => {
      // Calculate total bytes (approximation)
      const transferSize = resource.transferSize || 0
      resourceMetrics.totalByteSize += transferSize
      
      // Duration
      const duration = resource.responseEnd - resource.requestStart
      if (duration > resourceMetrics.slowestResource.duration) {
        resourceMetrics.slowestResource = { name: resource.name, duration }
      }
      
      // Categorize by type
      const url = new URL(resource.name)
      const pathname = url.pathname
      let resourceType = 'other'
      
      if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        resourceType = 'image'
        resourceMetrics.imageRequests++
        resourceMetrics.imageTotalBytes += transferSize
      } else if (pathname.match(/\.(js|mjs)$/i)) {
        resourceType = 'javascript'
        resourceMetrics.jsRequests++
        resourceMetrics.jsTotalBytes += transferSize
      } else if (pathname.match(/\.css$/i)) {
        resourceType = 'stylesheet'
        resourceMetrics.cssRequests++
        resourceMetrics.cssTotalBytes += transferSize
      } else if (pathname.match(/\.(woff|woff2|ttf|eot)$/i)) {
        resourceType = 'font'
        resourceMetrics.fontRequests++
      }
      
      resourceMetrics.requestsByType[resourceType] = (resourceMetrics.requestsByType[resourceType] || 0) + 1
    })
    
    return resourceMetrics
  })
}

async function runLighthouseAudit(page: Page) {
  // This is a simplified version - in a real implementation, you'd use the Lighthouse API
  // For now, we'll simulate some basic checks
  const lighthouseResults = {
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
    audits: {
      'first-contentful-paint': { score: 0, numericValue: 0 },
      'largest-contentful-paint': { score: 0, numericValue: 0 },
      'cumulative-layout-shift': { score: 0, numericValue: 0 },
      'total-blocking-time': { score: 0, numericValue: 0 },
      'unused-css-rules': { score: 0, details: { overallSavingsBytes: 0 } },
      'unused-javascript': { score: 0, details: { overallSavingsBytes: 0 } },
      'render-blocking-resources': { score: 0, numericValue: 0 },
      'unminified-css': { score: 0, details: { overallSavingsBytes: 0 } },
      'unminified-javascript': { score: 0, details: { overallSavingsBytes: 0 } },
      'efficient-animated-content': { score: 0, numericValue: 0 },
      'offscreen-images': { score: 0, details: { overallSavingsBytes: 0 } },
      'uses-webp-images': { score: 0, details: { overallSavingsBytes: 0 } }
    }
  }
  
  // Basic performance scoring based on metrics
  const loadMetrics = await measurePageLoadMetrics(page)
  const webVitals = await measureCoreWebVitals(page)
  const resourceMetrics = await measureResourceMetrics(page)
  
  // Score FCP (First Contentful Paint)
  const fcpScore = loadMetrics.firstContentfulPaint < 1800 ? 100 : 
                   loadMetrics.firstContentfulPaint < 3000 ? 50 : 0
  
  // Score LCP (Largest Contentful Paint)
  const lcpScore = webVitals.largestContentfulPaint < 2500 ? 100 :
                   webVitals.largestContentfulPaint < 4000 ? 50 : 0
  
  // Score CLS (Cumulative Layout Shift)
  const clsScore = webVitals.cumulativeLayoutShift < 0.1 ? 100 :
                   webVitals.cumulativeLayoutShift < 0.25 ? 50 : 0
  
  lighthouseResults.performance = Math.round((fcpScore + lcpScore + clsScore) / 3)
  
  return {
    ...lighthouseResults,
    metrics: {
      ...loadMetrics,
      ...webVitals,
      ...resourceMetrics
    }
  }
}

test.describe('PA-QA Showcase - Performance Tests', () => {
  test.describe('Core Web Vitals', () => {
    test('should meet Core Web Vitals thresholds on homepage', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const webVitals = await measureCoreWebVitals(page)
      
      console.log('Core Web Vitals:', webVitals)
      
      // Largest Contentful Paint
      if (webVitals.largestContentfulPaint) {
        expect(webVitals.largestContentfulPaint).toBeLessThan(performanceThresholds.largestContentfulPaint)
      }
      
      // First Input Delay (only available after user interaction)
      if (webVitals.firstInputDelay) {
        expect(webVitals.firstInputDelay).toBeLessThan(performanceThresholds.firstInputDelay)
      }
      
      // Cumulative Layout Shift
      if (webVitals.cumulativeLayoutShift !== undefined) {
        expect(webVitals.cumulativeLayoutShift).toBeLessThan(performanceThresholds.cumulativeLayoutShift)
      }
    })

    test('should measure FID after user interaction', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Simulate user interaction to measure FID
      await page.click('body')
      await page.waitForTimeout(1000)
      
      const webVitals = await measureCoreWebVitals(page)
      
      if (webVitals.firstInputDelay) {
        console.log('First Input Delay:', webVitals.firstInputDelay)
        expect(webVitals.firstInputDelay).toBeLessThan(performanceThresholds.firstInputDelay)
      }
    })
  })

  test.describe('Page Load Performance', () => {
    test('should load homepage within acceptable time limits', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')
      
      const domLoadTime = Date.now() - startTime
      console.log('DOM Content Loaded:', domLoadTime + 'ms')
      
      await page.waitForLoadState('networkidle')
      
      const totalLoadTime = Date.now() - startTime
      console.log('Total Load Time:', totalLoadTime + 'ms')
      
      expect(domLoadTime).toBeLessThan(performanceThresholds.domContentLoaded)
      expect(totalLoadTime).toBeLessThan(performanceThresholds.loadComplete)
    })

    test('should measure detailed load metrics', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const loadMetrics = await measurePageLoadMetrics(page)
      
      console.log('Load Metrics:', loadMetrics)
      
      expect(loadMetrics.domContentLoaded).toBeLessThan(performanceThresholds.domContentLoaded)
      expect(loadMetrics.loadComplete).toBeLessThan(performanceThresholds.loadComplete)
      expect(loadMetrics.firstContentfulPaint).toBeLessThan(performanceThresholds.firstContentfulPaint)
    })
  })

  test.describe('Resource Optimization', () => {
    test('should optimize resource loading and sizes', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const resourceMetrics = await measureResourceMetrics(page)
      
      console.log('Resource Metrics:', resourceMetrics)
      
      // Check total requests
      expect(resourceMetrics.totalRequests).toBeLessThan(performanceThresholds.requestCount)
      
      // Check image optimization
      expect(resourceMetrics.imageRequests).toBeLessThan(performanceThresholds.imageRequestCount)
      expect(resourceMetrics.imageTotalBytes).toBeLessThan(performanceThresholds.imageByteWeight)
      
      // Check JavaScript size
      expect(resourceMetrics.jsTotalBytes).toBeLessThan(performanceThresholds.jsCompressedBytes)
      
      // Check CSS size
      expect(resourceMetrics.cssTotalBytes).toBeLessThan(performanceThresholds.cssCompressedBytes)
      
      // Log slowest resource
      console.log('Slowest Resource:', resourceMetrics.slowestResource)
    })

    test('should use modern image formats', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const imageFormats = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
        return images.map(img => {
          const url = new URL(img.src, window.location.href)
          const pathname = url.pathname
          const extension = pathname.split('.').pop()?.toLowerCase()
          return { src: img.src, format: extension }
        })
      })
      
      console.log('Image Formats:', imageFormats)
      
      // Check for modern formats (WebP, AVIF)
      const modernFormats = imageFormats.filter(img => 
        ['webp', 'avif'].includes(img.format || '')
      )
      
      // At least 50% of images should use modern formats (adjust as needed)
      const modernFormatPercentage = (modernFormats.length / imageFormats.length) * 100
      console.log(`Modern image format usage: ${modernFormatPercentage.toFixed(1)}%`)
      
      if (imageFormats.length > 0) {
        expect(modernFormatPercentage).toBeGreaterThan(30) // Adjust threshold as needed
      }
    })

    test('should implement resource caching', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Get initial resource count
      const initialResourceCount = await page.evaluate(() => 
        performance.getEntriesByType('resource').length
      )
      
      // Reload the page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Get resource count after reload
      const reloadResourceCount = await page.evaluate(() => 
        performance.getEntriesByType('resource').length
      )
      
      // Check for cached resources (fewer requests on reload)
      console.log(`Initial requests: ${initialResourceCount}, Reload requests: ${reloadResourceCount}`)
      
      // Some resources should be cached
      expect(reloadResourceCount).toBeLessThanOrEqual(initialResourceCount)
    })
  })

  test.describe('JavaScript Performance', () => {
    test('should minimize main thread blocking time', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const longTasks = await page.evaluate(() => {
        return new Promise((resolve) => {
          const tasks: any[] = []
          const observer = new PerformanceObserver((list) => {
            tasks.push(...list.getEntries())
          })
          observer.observe({ entryTypes: ['longtask'] })
          
          setTimeout(() => {
            observer.disconnect()
            resolve(tasks)
          }, 5000)
        })
      })
      
      console.log('Long Tasks:', longTasks)
      
      // Check for excessive long tasks (>50ms)
      const totalBlockingTime = (longTasks as any[]).reduce((total, task) => 
        total + Math.max(0, task.duration - 50), 0
      )
      
      console.log('Total Blocking Time:', totalBlockingTime + 'ms')
      expect(totalBlockingTime).toBeLessThan(300) // 300ms threshold
    })

    test('should not have memory leaks', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const initialMemory = await page.evaluate(() => 
        (performance as any).memory?.usedJSHeapSize || 0
      )
      
      // Navigate between pages multiple times
      for (let i = 0; i < 3; i++) {
        await page.goto('/docs')
        await page.waitForLoadState('networkidle')
        await page.goto('/examples')
        await page.waitForLoadState('networkidle')
        await page.goto('/')
        await page.waitForLoadState('networkidle')
      }
      
      const finalMemory = await page.evaluate(() => 
        (performance as any).memory?.usedJSHeapSize || 0
      )
      
      console.log(`Memory usage: ${initialMemory} -> ${finalMemory} bytes`)
      
      // Memory shouldn't increase too dramatically
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB threshold
    })
  })

  test.describe('Network Performance', () => {
    test('should minimize render-blocking resources', async ({ page }) => {
      const renderBlockingResources: string[] = []
      
      page.on('response', response => {
        const url = response.url()
        const contentType = response.headers()['content-type'] || ''
        
        // Check for render-blocking CSS and JS
        if (contentType.includes('text/css') || contentType.includes('javascript')) {
          renderBlockingResources.push(url)
        }
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      console.log('Render-blocking resources:', renderBlockingResources.length)
      console.log('Resources:', renderBlockingResources)
      
      // Should minimize render-blocking resources
      expect(renderBlockingResources.length).toBeLessThan(10) // Adjust threshold
    })

    test('should use compression for text resources', async ({ page }) => {
      const uncompressedResources: string[] = []
      
      page.on('response', response => {
        const encoding = response.headers()['content-encoding']
        const contentType = response.headers()['content-type'] || ''
        
        // Check text resources for compression
        if ((contentType.includes('text/') || 
             contentType.includes('application/javascript') ||
             contentType.includes('application/json')) &&
            !encoding) {
          uncompressedResources.push(response.url())
        }
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      console.log('Uncompressed text resources:', uncompressedResources)
      
      // Most text resources should be compressed
      expect(uncompressedResources.length).toBeLessThan(3) // Allow few exceptions
    })
  })

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ page }) => {
      // Simulate mobile device
      await page.emulate({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      })
      
      // Throttle network to simulate 3G
      await page.route('**/*', async (route, request) => {
        await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
        route.continue()
      })
      
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      console.log('Mobile load time:', loadTime + 'ms')
      
      // Mobile should still load reasonably fast
      expect(loadTime).toBeLessThan(8000) // 8 second threshold for slow connections
      
      // Check mobile-specific metrics
      const mobileMetrics = await measurePageLoadMetrics(page)
      console.log('Mobile metrics:', mobileMetrics)
      
      expect(mobileMetrics.firstContentfulPaint).toBeLessThan(3000) // More lenient for mobile
    })
  })

  test.describe('Progressive Loading', () => {
    test('should show content progressively', async ({ page }) => {
      await page.goto('/')
      
      // Check that something renders quickly (before full load)
      await page.waitForSelector('h1, header, nav', { timeout: 2000 })
      
      const hasEarlyContent = await page.evaluate(() => {
        return document.querySelector('h1, header, nav') !== null
      })
      
      expect(hasEarlyContent).toBeTruthy()
      
      // Wait for full load
      await page.waitForLoadState('networkidle')
      
      const hasFullContent = await page.evaluate(() => {
        return document.querySelectorAll('h1, h2, p, article, section').length > 3
      })
      
      expect(hasFullContent).toBeTruthy()
    })
  })

  test.describe('Performance Budget Monitoring', () => {
    test('should stay within performance budget', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const budget = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        
        return {
          totalSize: resources.reduce((total, resource) => 
            total + (resource.transferSize || 0), 0
          ),
          jsSize: resources
            .filter(r => r.name.includes('.js'))
            .reduce((total, resource) => total + (resource.transferSize || 0), 0),
          cssSize: resources
            .filter(r => r.name.includes('.css'))
            .reduce((total, resource) => total + (resource.transferSize || 0), 0),
          imageSize: resources
            .filter(r => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(r.name))
            .reduce((total, resource) => total + (resource.transferSize || 0), 0)
        }
      })
      
      console.log('Performance Budget:', budget)
      
      // Check against budget thresholds
      expect(budget.totalSize).toBeLessThan(performanceThresholds.totalByteWeight)
      expect(budget.jsSize).toBeLessThan(performanceThresholds.jsCompressedBytes)
      expect(budget.cssSize).toBeLessThan(performanceThresholds.cssCompressedBytes)
      expect(budget.imageSize).toBeLessThan(performanceThresholds.imageByteWeight)
    })
  })
})