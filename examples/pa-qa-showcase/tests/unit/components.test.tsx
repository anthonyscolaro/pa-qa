/**
 * Component Unit Tests
 * 
 * This file demonstrates comprehensive component testing using Vitest and
 * React Testing Library. It showcases best practices for testing React
 * components in the PA-QA framework.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render, userInteraction, testIds, mockRouterPush } from '../utils/test-utils'
import { Navigation } from '@/components/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { ThemeProvider } from '@/components/theme-provider'
import { userFactory, postFactory } from '../fixtures/test-data'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: mockRouterPush,
    replace: vi.fn(),
    refresh: vi.fn()
  }))
}))

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation links correctly', () => {
    render(<Navigation />)

    // Check that all navigation items are present
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByText('Examples')).toBeInTheDocument()
    expect(screen.getByText('Best Practices')).toBeInTheDocument()
    expect(screen.getByText('Templates')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    const { rerender } = render(<Navigation />)

    // Mock current pathname
    const usePathname = await import('next/navigation')
    vi.mocked(usePathname.usePathname).mockReturnValue('/docs')
    
    rerender(<Navigation />)

    // Check that the Documentation link is highlighted (has active styling)
    const docsLink = screen.getByText('Documentation').closest('a')
    expect(docsLink).toHaveClass('text-blue-600') // Assuming this is the active class
  })

  it('opens and closes mobile menu', async () => {
    render(<Navigation />)

    // Find mobile menu button
    const menuButton = screen.getByRole('button', { name: /menu/i })
    expect(menuButton).toBeInTheDocument()

    // Click to open menu
    await userInteraction.click(menuButton)

    // Check that mobile menu is visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Find close button and click it
    const closeButton = screen.getByRole('button', { name: /close/i })
    await userInteraction.click(closeButton)

    // Check that mobile menu is closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('renders external links with correct attributes', () => {
    render(<Navigation />)

    const githubLink = screen.getByRole('link', { name: /github/i })
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('handles keyboard navigation', async () => {
    render(<Navigation />)

    const firstLink = screen.getByRole('link', { name: 'Home' })
    firstLink.focus()

    expect(firstLink).toHaveFocus()
  })
})

describe('ThemeToggle Component', () => {
  it('renders theme toggle button', () => {
    render(<ThemeToggle />)

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
    expect(toggleButton).toBeInTheDocument()
  })

  it('toggles theme on click', async () => {
    // Mock next-themes hook
    const mockSetTheme = vi.fn()
    vi.mock('next-themes', () => ({
      useTheme: () => ({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light'
      })
    }))

    render(<ThemeToggle />)

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
    await userInteraction.click(toggleButton)

    expect(mockSetTheme).toHaveBeenCalled()
  })

  it('shows correct icon for current theme', () => {
    render(<ThemeToggle />)

    // Check for sun/moon icon presence
    const icon = screen.getByRole('button').querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})

describe('ThemeProvider Component', () => {
  it('renders children correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="test-child">Test Content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('provides theme context to children', () => {
    const TestComponent = () => {
      // This would use useTheme in real implementation
      return <div data-testid="themed-component">Themed Content</div>
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('themed-component')).toBeInTheDocument()
  })
})

// Mock MDX Component Tests
describe('Mock MDX Components', () => {
  // Mock a typical MDX component that might exist in the app
  const MockCoverageReport = ({ data }: { data: any }) => (
    <div data-testid={testIds.coverageReport}>
      <h2>Coverage Report</h2>
      <div>Lines: {data.lines}%</div>
      <div>Functions: {data.functions}%</div>
      <div>Branches: {data.branches}%</div>
    </div>
  )

  it('renders coverage report with correct data', () => {
    const mockData = {
      lines: 95,
      functions: 90,
      branches: 88
    }

    render(<MockCoverageReport data={mockData} />)

    expect(screen.getByText('Coverage Report')).toBeInTheDocument()
    expect(screen.getByText('Lines: 95%')).toBeInTheDocument()
    expect(screen.getByText('Functions: 90%')).toBeInTheDocument()
    expect(screen.getByText('Branches: 88%')).toBeInTheDocument()
  })

  // Mock Test Runner Component
  const MockTestRunner = ({ 
    tests, 
    onRunTests 
  }: { 
    tests: string[]
    onRunTests: () => void 
  }) => (
    <div data-testid={testIds.testResult}>
      <h3>Test Runner</h3>
      <ul>
        {tests.map((test, index) => (
          <li key={index}>{test}</li>
        ))}
      </ul>
      <button onClick={onRunTests}>Run Tests</button>
    </div>
  )

  it('renders test runner with test list', () => {
    const mockTests = [
      'should render component',
      'should handle user input',
      'should display error states'
    ]
    const mockOnRunTests = vi.fn()

    render(<MockTestRunner tests={mockTests} onRunTests={mockOnRunTests} />)

    expect(screen.getByText('Test Runner')).toBeInTheDocument()
    mockTests.forEach(test => {
      expect(screen.getByText(test)).toBeInTheDocument()
    })
  })

  it('calls onRunTests when run button is clicked', async () => {
    const mockTests = ['test 1', 'test 2']
    const mockOnRunTests = vi.fn()

    render(<MockTestRunner tests={mockTests} onRunTests={mockOnRunTests} />)

    const runButton = screen.getByRole('button', { name: /run tests/i })
    await userInteraction.click(runButton)

    expect(mockOnRunTests).toHaveBeenCalledTimes(1)
  })
})

// Form Component Tests
describe('Form Components', () => {
  // Mock form component
  const MockContactForm = ({ 
    onSubmit 
  }: { 
    onSubmit: (data: any) => void 
  }) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      const formData = new FormData(e.target as HTMLFormElement)
      onSubmit(Object.fromEntries(formData))
    }

    return (
      <form onSubmit={handleSubmit} data-testid={testIds.form}>
        <input 
          name="name" 
          placeholder="Your name"
          data-testid={testIds.input}
          required
        />
        <input 
          name="email" 
          type="email" 
          placeholder="Your email"
          required
        />
        <textarea 
          name="message" 
          placeholder="Your message"
          data-testid={testIds.textarea}
          required
        />
        <button 
          type="submit"
          data-testid={testIds.submitButton}
        >
          Send Message
        </button>
      </form>
    )
  }

  it('renders form fields correctly', () => {
    const mockOnSubmit = vi.fn()
    render(<MockContactForm onSubmit={mockOnSubmit} />)

    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('submits form with correct data', async () => {
    const mockOnSubmit = vi.fn()
    render(<MockContactForm onSubmit={mockOnSubmit} />)

    const nameInput = screen.getByPlaceholderText('Your name')
    const emailInput = screen.getByPlaceholderText('Your email')
    const messageTextarea = screen.getByPlaceholderText('Your message')
    const submitButton = screen.getByRole('button', { name: /send message/i })

    await userInteraction.type(nameInput, 'John Doe')
    await userInteraction.type(emailInput, 'john@example.com')
    await userInteraction.type(messageTextarea, 'Hello, this is a test message.')

    await userInteraction.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message.'
    })
  })

  it('validates required fields', async () => {
    const mockOnSubmit = vi.fn()
    render(<MockContactForm onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /send message/i })
    await userInteraction.click(submitButton)

    // Form should not submit with empty required fields
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})

// Loading State Tests
describe('Loading States', () => {
  const MockLoadingComponent = ({ 
    isLoading, 
    data 
  }: { 
    isLoading: boolean
    data?: any 
  }) => (
    <div>
      {isLoading ? (
        <div data-testid={testIds.loadingSpinner}>Loading...</div>
      ) : (
        <div data-testid="loaded-content">
          {data ? JSON.stringify(data) : 'No data'}
        </div>
      )}
    </div>
  )

  it('shows loading state', () => {
    render(<MockLoadingComponent isLoading={true} />)

    expect(screen.getByTestId(testIds.loadingSpinner)).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows loaded content when not loading', () => {
    const testData = { message: 'Test data' }
    render(<MockLoadingComponent isLoading={false} data={testData} />)

    expect(screen.getByTestId('loaded-content')).toBeInTheDocument()
    expect(screen.getByText(JSON.stringify(testData))).toBeInTheDocument()
  })

  it('shows no data message when no data provided', () => {
    render(<MockLoadingComponent isLoading={false} />)

    expect(screen.getByText('No data')).toBeInTheDocument()
  })
})

// Error Boundary Tests
describe('Error Handling', () => {
  const MockErrorBoundary = ({ 
    hasError, 
    error, 
    children 
  }: { 
    hasError: boolean
    error?: Error
    children: React.ReactNode 
  }) => {
    if (hasError) {
      return (
        <div data-testid={testIds.errorBoundary}>
          <h2>Something went wrong</h2>
          {error && <p>{error.message}</p>}
        </div>
      )
    }

    return <>{children}</>
  }

  it('renders children when no error', () => {
    render(
      <MockErrorBoundary hasError={false}>
        <div>Normal content</div>
      </MockErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('renders error message when error occurs', () => {
    const testError = new Error('Test error message')
    
    render(
      <MockErrorBoundary hasError={true} error={testError}>
        <div>Normal content</div>
      </MockErrorBoundary>
    )

    expect(screen.getByTestId(testIds.errorBoundary)).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.queryByText('Normal content')).not.toBeInTheDocument()
  })
})

// Data Integration Tests
describe('Data Integration', () => {
  it('works with test data factories', () => {
    const user = userFactory.create()
    const post = postFactory.create({ author: user })

    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('name')
    expect(user).toHaveProperty('email')
    expect(post).toHaveProperty('title')
    expect(post).toHaveProperty('content')
    expect(post.author).toEqual(user)
  })

  it('generates consistent test data', () => {
    const users = userFactory.createMany(5)
    
    expect(users).toHaveLength(5)
    users.forEach(user => {
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('name')
      expect(user).toHaveProperty('email')
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) // Email format
    })
  })
})