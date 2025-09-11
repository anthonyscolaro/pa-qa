import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { Component, ReactNode, ErrorInfo } from 'react'
import { render } from '@/test-utils'

// Mock error reporting service
const mockErrorReporting = {
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
}

// Error types
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{
    error: Error | null
    errorInfo: ErrorInfo | null
    onRetry: () => void
    onReport: () => void
  }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'section' | 'component'
  isolate?: boolean
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Report error to monitoring service
    try {
      mockErrorReporting.setContext('errorBoundary', {
        level: this.props.level || 'component',
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })

      mockErrorReporting.captureException(error, {
        tags: {
          errorBoundary: true,
          level: this.props.level || 'component',
        },
        extra: {
          errorInfo,
          errorId: this.state.errorId,
        },
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }

    // Call custom error handler
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo)
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError)
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Error Info:', errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  reportProblem = () => {
    if (this.state.error) {
      mockErrorReporting.captureMessage(`User reported problem: ${this.state.errorId}`, {
        level: 'info',
        tags: {
          userReported: true,
          errorId: this.state.errorId,
        },
      })
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props

      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.retry}
            onReport={this.reportProblem}
          />
        )
      }

      return <DefaultErrorFallback {...this.state} onRetry={this.retry} onReport={this.reportProblem} />
    }

    return this.props.children
  }
}

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<{
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  onRetry: () => void
  onReport: () => void
}> = ({ error, errorInfo, errorId, onRetry, onReport }) => {
  const [isReported, setIsReported] = React.useState(false)

  const handleReport = () => {
    onReport()
    setIsReported(true)
  }

  return (
    <div className="error-boundary" role="alert" data-testid="error-boundary">
      <div className="error-boundary__content">
        <h2 className="error-boundary__title">Oops! Something went wrong</h2>
        
        <p className="error-boundary__message">
          We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
        </p>

        <div className="error-boundary__actions">
          <button 
            onClick={onRetry}
            className="btn btn--primary"
            data-testid="retry-button"
          >
            Try Again
          </button>
          
          <button 
            onClick={handleReport}
            className="btn btn--secondary"
            disabled={isReported}
            data-testid="report-button"
          >
            {isReported ? 'Problem Reported' : 'Report Problem'}
          </button>
        </div>

        {errorId && (
          <div className="error-boundary__details">
            <p className="error-boundary__error-id">
              Error ID: <code>{errorId}</code>
            </p>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && error && (
          <details className="error-boundary__debug" data-testid="error-details">
            <summary>Debug Information (Development Only)</summary>
            <div className="error-boundary__stack">
              <h4>Error:</h4>
              <pre>{error.toString()}</pre>
              
              <h4>Stack Trace:</h4>
              <pre>{error.stack}</pre>
              
              {errorInfo?.componentStack && (
                <>
                  <h4>Component Stack:</h4>
                  <pre>{errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

// Custom Error Fallback Components for testing
const MinimalErrorFallback: React.FC<{
  error: Error | null
  onRetry: () => void
  onReport: () => void
}> = ({ error, onRetry }) => (
  <div data-testid="minimal-fallback">
    <p>Something went wrong: {error?.message}</p>
    <button onClick={onRetry}>Retry</button>
  </div>
)

const CustomErrorFallback: React.FC<{
  error: Error | null
  errorInfo: ErrorInfo | null
  onRetry: () => void
  onReport: () => void
}> = ({ error, errorInfo, onRetry, onReport }) => (
  <div data-testid="custom-fallback">
    <h1>Custom Error Page</h1>
    <p data-testid="error-message">{error?.message}</p>
    <button onClick={onRetry} data-testid="custom-retry">
      Try Again
    </button>
    <button onClick={onReport} data-testid="custom-report">
      Report Issue
    </button>
    {errorInfo && (
      <div data-testid="component-stack">{errorInfo.componentStack}</div>
    )}
  </div>
)

// Test Components
const ThrowError: React.FC<{ 
  shouldError?: boolean
  errorMessage?: string
  errorType?: 'render' | 'async' | 'event'
}> = ({ 
  shouldError = false, 
  errorMessage = 'Test error',
  errorType = 'render'
}) => {
  const [asyncError, setAsyncError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (shouldError && errorType === 'async') {
      // Simulate async error that should be caught by error boundary
      setTimeout(() => {
        setAsyncError(new Error(errorMessage))
      }, 10)
    }
  }, [shouldError, errorType, errorMessage])

  const handleEventError = () => {
    if (errorType === 'event') {
      throw new Error(errorMessage)
    }
  }

  // Throw async errors in render
  if (asyncError) {
    throw asyncError
  }

  // Throw render errors immediately
  if (shouldError && errorType === 'render') {
    throw new Error(errorMessage)
  }

  return (
    <div>
      <h1>Working Component</h1>
      <p>This component is working correctly</p>
      {errorType === 'event' && (
        <button onClick={handleEventError} data-testid="trigger-error">
          Trigger Error
        </button>
      )}
    </div>
  )
}

const WorkingComponent: React.FC = () => (
  <div data-testid="working-component">
    <h1>Working Component</h1>
    <p>This component renders successfully</p>
  </div>
)

describe('ErrorBoundary Component', () => {
  let consoleError: any

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.error to prevent noise in test output
    consoleError = console.error
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = consoleError
  })

  describe('Normal Operation', () => {
    it('renders children when there are no errors', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      expect(screen.getByText('Working Component')).toBeInTheDocument()
    })

    it('does not interfere with normal component behavior', () => {
      render(
        <ErrorBoundary>
          <div>
            <WorkingComponent />
            <button>Click me</button>
          </div>
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
      expect(screen.getByTestId('working-component')).toBeInTheDocument()
    })
  })

  describe('Error Catching', () => {
    it('catches and displays render errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError errorMessage="Render error occurred" />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.queryByText('Working Component')).not.toBeInTheDocument()
    })

    it('catches errors from child components', () => {
      render(
        <ErrorBoundary>
          <div>
            <WorkingComponent />
            <ThrowError shouldError errorMessage="Child component error" />
          </div>
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument()
    })

    it('catches async errors that occur in useEffect', async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError errorType="async" errorMessage="Async error" />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('displays error ID for tracking', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError errorMessage="Test error" />
        </ErrorBoundary>
      )

      const errorIdElement = screen.getByText(/error id:/i)
      expect(errorIdElement).toBeInTheDocument()
      
      const errorId = errorIdElement.textContent?.match(/Error ID: (.+)/)?.[1]
      expect(errorId).toMatch(/^error_\d+_[a-z0-9]+$/)
    })
  })

  describe('Default Error Fallback', () => {
    it('displays default error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/we're sorry, but something unexpected happened/i)).toBeInTheDocument()
    })

    it('displays retry and report buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      expect(screen.getByTestId('report-button')).toBeInTheDocument()
      expect(screen.getByText(/try again/i)).toBeInTheDocument()
      expect(screen.getByText(/report problem/i)).toBeInTheDocument()
    })

    it('shows debug information in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldError errorMessage="Development error" />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-details')).toBeInTheDocument()
      expect(screen.getByText(/debug information/i)).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('hides debug information in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      render(
        <ErrorBoundary>
          <ThrowError shouldError errorMessage="Production error" />
        </ErrorBoundary>
      )

      expect(screen.queryByTestId('error-details')).not.toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Custom Error Fallback', () => {
    it('renders custom fallback component', () => {
      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <ThrowError shouldError errorMessage="Custom fallback test" />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error Page')).toBeInTheDocument()
      expect(screen.getByTestId('error-message')).toHaveTextContent('Custom fallback test')
    })

    it('passes error and errorInfo to custom fallback', () => {
      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <ThrowError shouldError errorMessage="Error with info" />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-message')).toHaveTextContent('Error with info')
      expect(screen.getByTestId('component-stack')).toBeInTheDocument()
    })

    it('provides retry and report callbacks to custom fallback', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-retry')).toBeInTheDocument()
      expect(screen.getByTestId('custom-report')).toBeInTheDocument()

      await user.click(screen.getByTestId('custom-report'))
      expect(mockErrorReporting.captureMessage).toHaveBeenCalled()
    })
  })

  describe('Error Recovery', () => {
    it('recovers from error when retry is clicked', async () => {
      const user = userEvent.setup()
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()

      await user.click(screen.getByTestId('retry-button'))

      // Simulate re-rendering with working component
      rerender(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )

      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
      expect(screen.getByTestId('working-component')).toBeInTheDocument()
    })

    it('can recover from multiple errors', async () => {
      const user = userEvent.setup()
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldError errorMessage="First error" />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Retry first error
      await user.click(screen.getByTestId('retry-button'))
      
      rerender(
        <ErrorBoundary>
          <ThrowError shouldError errorMessage="Second error" />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Retry second error
      await user.click(screen.getByTestId('retry-button'))
      
      rerender(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
    })
  })

  describe('Error Reporting', () => {
    it('reports errors to monitoring service', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError errorMessage="Monitored error" />
        </ErrorBoundary>
      )

      expect(mockErrorReporting.setContext).toHaveBeenCalledWith('errorBoundary', expect.objectContaining({
        level: 'component',
        timestamp: expect.any(String),
        userAgent: expect.any(String),
        url: expect.any(String),
      }))

      expect(mockErrorReporting.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            errorBoundary: true,
            level: 'component',
          },
          extra: expect.objectContaining({
            errorInfo: expect.any(Object),
          }),
        })
      )
    })

    it('allows user to report problems', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      const reportButton = screen.getByTestId('report-button')
      await user.click(reportButton)

      expect(mockErrorReporting.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('User reported problem:'),
        expect.objectContaining({
          level: 'info',
          tags: {
            userReported: true,
            errorId: expect.any(String),
          },
        })
      )

      expect(reportButton).toHaveTextContent('Problem Reported')
      expect(reportButton).toBeDisabled()
    })

    it('calls custom error handler when provided', () => {
      const mockErrorHandler = vi.fn()
      
      render(
        <ErrorBoundary onError={mockErrorHandler}>
          <ThrowError shouldError errorMessage="Custom handler error" />
        </ErrorBoundary>
      )

      expect(mockErrorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('handles errors in custom error handler gracefully', () => {
      const mockErrorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Error handler failed')
      })
      
      // Should not throw, should render error boundary
      render(
        <ErrorBoundary onError={mockErrorHandler}>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
      expect(console.error).toHaveBeenCalledWith('Error in custom error handler:', expect.any(Error))
    })
  })

  describe('Error Boundary Props', () => {
    it('accepts level prop for error categorization', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(mockErrorReporting.setContext).toHaveBeenCalledWith('errorBoundary', expect.objectContaining({
        level: 'page',
      }))

      expect(mockErrorReporting.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({
            level: 'page',
          }),
        })
      )
    })

    it('uses default level when not specified', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(mockErrorReporting.setContext).toHaveBeenCalledWith('errorBoundary', expect.objectContaining({
        level: 'component',
      }))
    })
  })

  describe('Event Handler Errors', () => {
    it('does not catch errors in event handlers by default', async () => {
      const user = userEvent.setup()
      
      // Event handler errors should not be caught by error boundaries
      // They need to be handled differently
      const { container } = render(
        <ErrorBoundary>
          <ThrowError errorType="event" errorMessage="Event handler error" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Working Component')).toBeInTheDocument()
      
      // Clicking should throw an error that's not caught by the boundary
      const triggerButton = screen.getByTestId('trigger-error')
      
      // We expect this to throw, but error boundary won't catch it
      await expect(async () => {
        await user.click(triggerButton)
      }).rejects.toThrow('Event handler error')

      // Component should still be there since error boundary didn't catch it
      expect(screen.getByText('Working Component')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA attributes for error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toBeInTheDocument()
      expect(errorAlert).toHaveAttribute('data-testid', 'error-boundary')
    })

    it('provides accessible button labels', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /report problem/i })).toBeInTheDocument()
    })

    it('maintains focus management during error recovery', async () => {
      const user = userEvent.setup()
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      const retryButton = screen.getByTestId('retry-button')
      retryButton.focus()
      
      expect(retryButton).toHaveFocus()

      await user.click(retryButton)
      
      rerender(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )

      // Focus should be manageable after recovery
      expect(document.body).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles errors during error reporting', () => {
      mockErrorReporting.captureException.mockImplementation(() => {
        throw new Error('Reporting service unavailable')
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
      expect(console.error).toHaveBeenCalledWith('Failed to report error:', expect.any(Error))
    })

    it('handles null/undefined error objects', () => {
      const ThrowNullError: React.FC = () => {
        // @ts-ignore - Testing edge case
        throw null
      }

      render(
        <ErrorBoundary>
          <ThrowNullError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    })

    it('cleans up timeouts on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldError />
        </ErrorBoundary>
      )

      unmount()

      // Verify cleanup (implementation detail, but important for memory leaks)
      expect(clearTimeoutSpy).toHaveBeenCalled()
      
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('Nested Error Boundaries', () => {
    it('allows inner boundary to catch specific errors', () => {
      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <div>
            <WorkingComponent />
            <ErrorBoundary fallback={MinimalErrorFallback}>
              <ThrowError shouldError errorMessage="Inner boundary error" />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      )

      // Inner boundary should catch the error
      expect(screen.getByTestId('minimal-fallback')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong: Inner boundary error')).toBeInTheDocument()
      
      // Outer components should still be visible
      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      
      // Outer boundary should not be triggered
      expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument()
    })
  })
})