import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Global test setup for Vitest + React Testing Library

// Cleanup DOM after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Global beforeAll setup
beforeAll(() => {
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock matchMedia
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
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  vi.stubGlobal('localStorage', localStorageMock)

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  vi.stubGlobal('sessionStorage', sessionStorageMock)

  // Mock console methods to avoid noise in tests (optional)
  vi.stubGlobal('console', {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
  })
})

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
})