/**
 * React Testing Utilities
 * 
 * This file provides enhanced testing utilities that wrap React Testing Library
 * with additional functionality specific to the PA-QA Showcase application.
 * It includes custom render functions, theme providers, and common test helpers.
 */

import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { vi } from 'vitest'
import { ThemeProvider } from 'next-themes'

// Test IDs for consistent element selection
export const testIds = {
  // Layout
  header: 'header',
  main: 'main-content',
  footer: 'footer',
  navigation: 'navigation',
  sidebar: 'sidebar',
  
  // Components
  button: 'button',
  modal: 'modal',
  dialog: 'dialog',
  tooltip: 'tooltip',
  dropdown: 'dropdown',
  searchBox: 'search-box',
  loadingSpinner: 'loading-spinner',
  errorBoundary: 'error-boundary',
  
  // Forms
  form: 'form',
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  checkbox: 'checkbox',
  radio: 'radio',
  submitButton: 'submit-button',
  resetButton: 'reset-button',
  
  // Content
  heading: 'heading',
  paragraph: 'paragraph',
  list: 'list',
  listItem: 'list-item',
  link: 'link',
  image: 'image',
  video: 'video',
  
  // Testing Framework
  showcaseCard: 'showcase-card',
  testResult: 'test-result',
  coverageReport: 'coverage-report',
  performanceMetric: 'performance-metric'
} as const

// Mock router push function
export const mockRouterPush = vi.fn()
export const mockRouterReplace = vi.fn()

// Custom render options interface
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark' | 'system'
  initialProps?: Record<string, any>
}

// All providers wrapper component
interface AllProvidersProps {
  children: ReactNode
  theme?: 'light' | 'dark' | 'system'
}

const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  theme = 'light' 
}) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={theme}
      enableSystem={theme === 'system'}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

/**
 * Custom render function that wraps React Testing Library's render
 * with all necessary providers and context
 */
export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { theme = 'light', initialProps, ...renderOptions } = options

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AllProviders theme={theme}>
      {children}
    </AllProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Render hook wrapper with providers
 */
export { renderHook } from '@testing-library/react'

/**
 * Custom render function for testing with different themes
 */
export const renderWithTheme = (
  ui: ReactElement,
  theme: 'light' | 'dark' | 'system' = 'light'
) => {
  return customRender(ui, { theme })
}

/**
 * Utility to create a mock component with test id
 */
export const createMockComponent = (
  displayName: string,
  testId?: string
) => {
  const MockComponent = ({ children, ...props }: { children?: ReactNode }) => (
    <div data-testid={testId || displayName.toLowerCase()} {...props}>
      {children}
    </div>
  )
  
  MockComponent.displayName = displayName
  return MockComponent
}

/**
 * Helper to simulate user interactions with better error handling
 */
export const userInteraction = {
  click: async (element: HTMLElement) => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    await user.click(element)
  },
  
  type: async (element: HTMLElement, text: string) => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    await user.type(element, text)
  },
  
  clear: async (element: HTMLElement) => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    await user.clear(element)
  },
  
  selectOptions: async (element: HTMLElement, values: string | string[]) => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    await user.selectOptions(element, values)
  },
  
  upload: async (element: HTMLElement, files: File | File[]) => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    await user.upload(element, files)
  }
}

/**
 * Helper to wait for element with better error messages
 */
export const waitForElementWithTimeout = async (
  callback: () => Promise<HTMLElement> | HTMLElement,
  timeout = 5000
) => {
  const { waitFor } = await import('@testing-library/react')
  return waitFor(callback, { timeout })
}

/**
 * Mock fetch responses for API testing
 */
export const mockFetch = {
  success: (data: any, status = 200) => {
    return vi.fn().mockResolvedValueOnce({
      ok: true,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers({
        'content-type': 'application/json'
      })
    })
  },
  
  error: (message = 'Network Error', status = 500) => {
    return vi.fn().mockRejectedValueOnce(new Error(message))
  },
  
  json: (data: any, status = 200) => {
    return vi.fn().mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      headers: new Headers({
        'content-type': 'application/json'
      })
    })
  }
}

/**
 * Helper to create mock file objects for file upload testing
 */
export const createMockFile = (
  name: string,
  content: string,
  type = 'text/plain'
) => {
  const file = new File([content], name, { type })
  return file
}

/**
 * Helper to create mock image file for image upload testing
 */
export const createMockImageFile = (
  name = 'test-image.jpg',
  width = 100,
  height = 100
) => {
  // Create a minimal valid JPEG header
  const jpegHeader = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46
  ])
  
  return new File([jpegHeader], name, { type: 'image/jpeg' })
}

/**
 * Helper to mock localStorage for testing
 */
export const mockLocalStorage = {
  setup: () => {
    const store: Record<string, string> = {}
    
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete store[key]
    })
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
    
    return store
  },
  
  reset: () => {
    vi.restoreAllMocks()
  }
}

/**
 * Helper to mock window.matchMedia for responsive testing
 */
export const mockMatchMedia = (matches = false) => {
  return vi.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
}

/**
 * Helper to create accessibility-focused test utilities
 */
export const a11yUtils = {
  getByRole: (role: string, options?: any) => {
    const { screen } = require('@testing-library/react')
    return screen.getByRole(role, options)
  },
  
  getByLabelText: (text: string, options?: any) => {
    const { screen } = require('@testing-library/react')
    return screen.getByLabelText(text, options)
  },
  
  queryByRole: (role: string, options?: any) => {
    const { screen } = require('@testing-library/react')
    return screen.queryByRole(role, options)
  }
}

/**
 * Common test data generators
 */
export const testData = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com'
  },
  
  post: {
    id: '1',
    title: 'Test Post',
    content: 'This is test content',
    author: 'Test Author'
  }
}

// Re-export everything from React Testing Library for convenience
export * from '@testing-library/react'
export { customRender as render }