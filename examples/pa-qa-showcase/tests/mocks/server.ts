/**
 * MSW Server Configuration
 * 
 * This file sets up the Mock Service Worker server for use in Node.js
 * test environments (Vitest, Jest). It creates a server instance
 * with all the request handlers.
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Setup MSW server with all request handlers
 * This server will intercept HTTP requests in Node.js test environment
 */
export const server = setupServer(...handlers)

/**
 * Helper function to add runtime handlers for specific tests
 */
export const addHandler = (...newHandlers: any[]) => {
  server.use(...newHandlers)
}

/**
 * Helper function to reset handlers to original set
 */
export const resetHandlers = () => {
  server.resetHandlers(...handlers)
}

/**
 * Helper function to clear all handlers
 */
export const clearHandlers = () => {
  server.resetHandlers()
}

export default server