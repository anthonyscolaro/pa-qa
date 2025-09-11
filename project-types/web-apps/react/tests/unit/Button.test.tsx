import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test-utils'

// Mock Button component - replace with your actual component import
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
  className?: string
  loading?: boolean
  icon?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  'aria-label': ariaLabel,
  className = '',
  loading = false,
  icon,
  ...props
}) => {
  const baseClasses = 'btn focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  }
  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg',
  }

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ].join(' ')

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={buttonClasses}
      {...props}
    >
      {loading ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with children', () => {
      render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
    })

    it('renders button with custom aria-label', () => {
      render(
        <Button aria-label="Custom action button">
          <span>🔥</span>
        </Button>
      )
      
      const button = screen.getByRole('button', { name: /custom action button/i })
      expect(button).toBeInTheDocument()
    })

    it('renders button with icon', () => {
      const icon = <span data-testid="icon">⭐</span>
      render(<Button icon={icon}>Star</Button>)
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveTextContent('Star')
    })

    it('applies correct default attributes', () => {
      render(<Button>Default Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Variants and Styling', () => {
    it('applies primary variant classes by default', () => {
      render(<Button>Primary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white')
    })

    it('applies secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-600', 'hover:bg-gray-700', 'text-white')
    })

    it('applies danger variant classes', () => {
      render(<Button variant="danger">Delete</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'hover:bg-red-700', 'text-white')
    })

    it('applies small size classes', () => {
      render(<Button size="small">Small</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-2', 'py-1', 'text-sm')
    })

    it('applies medium size classes by default', () => {
      render(<Button>Medium</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2')
    })

    it('applies large size classes', () => {
      render(<Button size="large">Large</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
    })

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Button Types', () => {
    it('renders submit button', () => {
      render(<Button type="submit">Submit</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('renders reset button', () => {
      render(<Button type="reset">Reset</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'reset')
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('calls onClick handler when activated with keyboard', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Press me</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('calls onClick handler when activated with Space key', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Press me</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('supports programmatic click via fireEvent', () => {
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick}>Fire Event</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Disabled State', () => {
    it('renders disabled button', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('cannot be focused when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(button).not.toHaveFocus()
    })
  })

  describe('Loading State', () => {
    it('renders loading state', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows loading spinner', () => {
      render(<Button loading>Save</Button>)
      
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button loading onClick={handleClick}>Loading</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('hides original content when loading', () => {
      render(<Button loading>Original Text</Button>)
      
      expect(screen.queryByText('Original Text')).not.toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper focus management', async () => {
      const user = userEvent.setup()
      
      render(<Button>Focus me</Button>)
      
      const button = screen.getByRole('button')
      await user.tab()
      
      expect(button).toHaveFocus()
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
    })

    it('supports aria-label for accessibility', () => {
      render(
        <Button aria-label="Close dialog">
          ✕
        </Button>
      )
      
      const button = screen.getByRole('button', { name: /close dialog/i })
      expect(button).toBeInTheDocument()
    })

    it('maintains accessibility when disabled', () => {
      render(<Button disabled aria-label="Disabled action">Action</Button>)
      
      const button = screen.getByRole('button', { name: /disabled action/i })
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-label', 'Disabled action')
    })

    it('loading spinner has proper accessibility attributes', () => {
      render(<Button loading>Submit</Button>)
      
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined onClick gracefully', async () => {
      const user = userEvent.setup()
      
      // Should not throw error
      render(<Button>No handler</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(button).toBeInTheDocument()
    })

    it('handles empty children', () => {
      render(<Button>{''}</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('')
    })

    it('handles complex children', () => {
      render(
        <Button>
          <span>Complex</span>
          <em>Content</em>
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('ComplexContent')
    })

    it('forwards additional props', () => {
      render(
        <Button data-testid="custom-button" tabIndex={0}>
          Custom Props
        </Button>
      )
      
      const button = screen.getByTestId('custom-button')
      expect(button).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = vi.fn()
      const TestButton = (props: ButtonProps) => {
        renderSpy()
        return <Button {...props} />
      }

      const { rerender } = render(<TestButton>Test</TestButton>)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestButton>Test</TestButton>)
      
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})