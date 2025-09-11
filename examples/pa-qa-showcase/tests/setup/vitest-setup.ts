/**
 * Vitest Global Setup Configuration
 * 
 * This file configures the global test environment for Vitest unit and integration tests.
 * It sets up React Testing Library, Jest DOM matchers, MSW for API mocking,
 * and other essential testing utilities.
 */

import '@testing-library/jest-dom'
import { expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from '../mocks/server'

// Extend Vitest's expect with jest-dom matchers
expect.extend({})

// Configure MSW (Mock Service Worker)
beforeAll(() => {
  // Start MSW server for API mocking
  server.listen({
    onUnhandledRequest: 'error'
  })
  
  console.log('🔧 MSW server started for API mocking')
})

afterEach(() => {
  // Reset MSW handlers after each test
  server.resetHandlers()
  
  // Clean up React Testing Library
  cleanup()
  
  // Clear all mocks
  vi.clearAllMocks()
})

afterAll(() => {
  // Stop MSW server after all tests
  server.close()
  
  console.log('🛑 MSW server stopped')
})

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    pop: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    },
    isFallback: false,
    isLocaleDomain: true,
    isReady: true
  }))
}))

// Mock Next.js navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({}))
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  })
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: vi.fn(({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ))
}))

// Mock Next.js themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
    themes: ['light', 'dark'],
    systemTheme: 'light'
  })),
  ThemeProvider: vi.fn(({ children }) => children)
}))

// Mock Intersection Observer
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn()
})) as any

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn()
})) as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn()
})

// Mock HTMLElement.scrollIntoView
HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock fetch
global.fetch = vi.fn()

// Mock console methods for cleaner test output
const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// Override console methods in test environment
Object.defineProperty(global.console, 'log', { value: consoleMock.log })
Object.defineProperty(global.console, 'warn', { value: consoleMock.warn })
Object.defineProperty(global.console, 'error', { value: consoleMock.error })
Object.defineProperty(global.console, 'info', { value: consoleMock.info })
Object.defineProperty(global.console, 'debug', { value: consoleMock.debug })

// Set up environment variables for tests
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

console.log('🚀 Vitest setup complete - Ready for testing!')