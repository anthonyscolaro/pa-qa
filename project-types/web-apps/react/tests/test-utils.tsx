import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'styled-components'
import { vi } from 'vitest'

// Example theme object - replace with your actual theme
const mockTheme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
  },
}

// Example user context - replace with your actual user context
interface MockUser {
  id: string
  name: string
  email: string
  role: string
}

export const mockUser: MockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
}

// Mock User Context Provider
const MockUserContext = React.createContext<{
  user: MockUser | null
  login: (user: MockUser) => void
  logout: () => void
  isLoading: boolean
}>({
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
})

export const MockUserProvider: React.FC<{
  children: ReactNode
  user?: MockUser | null
  isLoading?: boolean
}> = ({ children, user = mockUser, isLoading = false }) => {
  const login = vi.fn()
  const logout = vi.fn()

  return (
    <MockUserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </MockUserContext.Provider>
  )
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Router options
  initialEntries?: string[]
  route?: string
  
  // Query client options
  queryClient?: QueryClient
  
  // User context options
  user?: MockUser | null
  userLoading?: boolean
  
  // Theme options
  theme?: typeof mockTheme
  
  // Additional wrapper
  wrapper?: React.ComponentType<{ children: ReactNode }>
}

export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

const AllTheProviders: React.FC<{
  children: ReactNode
  options: CustomRenderOptions
}> = ({ children, options }) => {
  const {
    initialEntries = ['/'],
    route = '/',
    queryClient = createTestQueryClient(),
    user = mockUser,
    userLoading = false,
    theme = mockTheme,
    wrapper: Wrapper,
  } = options

  let component = (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <MockUserProvider user={user} isLoading={userLoading}>
            {children}
          </MockUserProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )

  if (Wrapper) {
    component = <Wrapper>{component}</Wrapper>
  }

  return component
}

export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders options={options}>{children}</AllTheProviders>
    ),
    ...options,
  })
}

// Utility function to render with specific user state
export const renderWithUser = (
  ui: ReactElement,
  user: MockUser | null = mockUser,
  options: CustomRenderOptions = {}
): RenderResult => {
  return customRender(ui, { ...options, user })
}

// Utility function to render without user (unauthenticated)
export const renderUnauthenticated = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  return customRender(ui, { ...options, user: null })
}

// Utility function to render with loading state
export const renderWithLoading = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  return customRender(ui, { ...options, userLoading: true })
}

// Utility function for testing async components
export const waitForLoadingToFinish = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Mock handlers for common API calls
export const mockHandlers = {
  // Mock fetch responses
  mockFetchSuccess: (data: any) => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    })
  },
  
  mockFetchError: (status = 500, message = 'Internal Server Error') => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status,
      statusText: message,
      json: async () => ({ error: message }),
    })
  },
  
  // Mock API endpoints
  mockApiGet: (endpoint: string, data: any) => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes(endpoint)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => data,
        })
      }
      return Promise.reject(new Error('Unexpected API call'))
    })
  },
}

// Accessibility testing helpers
export const getByRoleWithAccessibleName = (
  container: HTMLElement,
  role: string,
  name: string
) => {
  return container.querySelector(`[role="${role}"][aria-label="${name}"], [role="${role}"][aria-labelledby] *:contains("${name}")`)
}

// Custom matchers (extend if needed)
export const customMatchers = {
  toBeInTheDocument: (element: HTMLElement | null) => {
    return element !== null && document.body.contains(element)
  },
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Re-export our custom render as the default export
export { customRender as render }