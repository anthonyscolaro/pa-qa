/**
 * MSW Browser Configuration
 * 
 * This file sets up the Mock Service Worker for use in browser environments.
 * It's primarily used for development and manual testing, but can also be
 * used in browser-based E2E tests if needed.
 */

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * Setup MSW worker for browser environment
 * This worker will intercept HTTP requests in the browser
 */
export const worker = setupWorker(...handlers)

/**
 * Helper function to start the worker with custom options
 */
export const startWorker = async (options: any = {}) => {
  const defaultOptions = {
    onUnhandledRequest: 'warn' as const,
    serviceWorker: {
      url: '/mockServiceWorker.js'
    }
  }

  return worker.start({
    ...defaultOptions,
    ...options
  })
}

/**
 * Helper function to add runtime handlers for browser testing
 */
export const addBrowserHandler = (...newHandlers: any[]) => {
  worker.use(...newHandlers)
}

/**
 * Helper function to reset handlers to original set
 */
export const resetBrowserHandlers = () => {
  worker.resetHandlers(...handlers)
}

/**
 * Helper function to stop the worker
 */
export const stopWorker = () => {
  worker.stop()
}

export default worker