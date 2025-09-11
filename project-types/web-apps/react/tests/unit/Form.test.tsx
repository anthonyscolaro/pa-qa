import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState, FormEvent } from 'react'
import { render } from '@/test-utils'

// Mock validation library
const mockValidation = {
  validateEmail: vi.fn(),
  validatePassword: vi.fn(),
  validateRequired: vi.fn(),
}

// Form validation utilities
const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? null : 'Please enter a valid email address'
}

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number'
  return null
}

const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password'
  return password === confirmPassword ? null : 'Passwords do not match'
}

// Mock API
const mockAPI = {
  submitForm: vi.fn(),
  checkEmailAvailability: vi.fn(),
}

// Form component types
interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  agreeToTerms: boolean
  newsletter: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  agreeToTerms?: string
  general?: string
}

// Registration Form Component
const RegistrationForm: React.FC<{
  onSubmit?: (data: FormData) => void | Promise<void>
  onEmailCheck?: (email: string) => Promise<boolean>
  initialData?: Partial<FormData>
  disabled?: boolean
}> = ({ 
  onSubmit,
  onEmailCheck,
  initialData = {},
  disabled = false 
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    agreeToTerms: false,
    newsletter: false,
    ...initialData,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const markFieldAsTouched = (field: string) => {
    setTouchedFields(prev => new Set([...prev, field]))
  }

  const validateField = (field: keyof FormData, value: string | boolean): string | null => {
    switch (field) {
      case 'email':
        return validateEmail(value as string)
      case 'password':
        return validatePassword(value as string)
      case 'confirmPassword':
        return validateConfirmPassword(formData.password, value as string)
      case 'firstName':
        return !value ? 'First name is required' : null
      case 'lastName':
        return !value ? 'Last name is required' : null
      case 'agreeToTerms':
        return !value ? 'You must agree to the terms and conditions' : null
      default:
        return null
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field as keyof FormData, formData[field as keyof FormData])
      if (error) {
        newErrors[field as keyof FormErrors] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldBlur = async (field: keyof FormData) => {
    markFieldAsTouched(field)
    
    const error = validateField(field, formData[field])
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }))
    }

    // Check email availability on blur
    if (field === 'email' && formData.email && !error && onEmailCheck) {
      setIsCheckingEmail(true)
      try {
        const isAvailable = await onEmailCheck(formData.email)
        if (!isAvailable) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered' }))
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, email: 'Unable to check email availability' }))
      } finally {
        setIsCheckingEmail(false)
      }
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (disabled || isSubmitting) return

    // Mark all fields as touched
    setTouchedFields(new Set(Object.keys(formData)))
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      if (onSubmit) {
        await onSubmit(formData)
      } else {
        await mockAPI.submitForm(formData)
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'An error occurred while submitting the form'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldError = (field: keyof FormErrors): string | undefined => {
    return touchedFields.has(field) ? errors[field] : undefined
  }

  const isFieldInvalid = (field: keyof FormErrors): boolean => {
    return touchedFields.has(field) && !!errors[field]
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1>Create Account</h1>
      
      {errors.general && (
        <div role="alert" className="error-message" data-testid="form-error">
          {errors.general}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="firstName">
          First Name *
        </label>
        <input
          id="firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          onBlur={() => handleFieldBlur('firstName')}
          disabled={disabled || isSubmitting}
          aria-invalid={isFieldInvalid('firstName')}
          aria-describedby={getFieldError('firstName') ? 'firstName-error' : undefined}
          required
        />
        {getFieldError('firstName') && (
          <div id="firstName-error" role="alert" className="field-error">
            {getFieldError('firstName')}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="lastName">
          Last Name *
        </label>
        <input
          id="lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          onBlur={() => handleFieldBlur('lastName')}
          disabled={disabled || isSubmitting}
          aria-invalid={isFieldInvalid('lastName')}
          aria-describedby={getFieldError('lastName') ? 'lastName-error' : undefined}
          required
        />
        {getFieldError('lastName') && (
          <div id="lastName-error" role="alert" className="field-error">
            {getFieldError('lastName')}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          disabled={disabled || isSubmitting}
          aria-invalid={isFieldInvalid('email')}
          aria-describedby={getFieldError('email') ? 'email-error' : undefined}
          required
        />
        {isCheckingEmail && (
          <div className="checking-message">Checking email availability...</div>
        )}
        {getFieldError('email') && (
          <div id="email-error" role="alert" className="field-error">
            {getFieldError('email')}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">
          Password *
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          onBlur={() => handleFieldBlur('password')}
          disabled={disabled || isSubmitting}
          aria-invalid={isFieldInvalid('password')}
          aria-describedby={getFieldError('password') ? 'password-error password-help' : 'password-help'}
          required
        />
        <div id="password-help" className="help-text">
          Password must be at least 8 characters with uppercase, lowercase, and number
        </div>
        {getFieldError('password') && (
          <div id="password-error" role="alert" className="field-error">
            {getFieldError('password')}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">
          Confirm Password *
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          onBlur={() => handleFieldBlur('confirmPassword')}
          disabled={disabled || isSubmitting}
          aria-invalid={isFieldInvalid('confirmPassword')}
          aria-describedby={getFieldError('confirmPassword') ? 'confirmPassword-error' : undefined}
          required
        />
        {getFieldError('confirmPassword') && (
          <div id="confirmPassword-error" role="alert" className="field-error">
            {getFieldError('confirmPassword')}
          </div>
        )}
      </div>

      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => updateField('agreeToTerms', e.target.checked)}
            onBlur={() => handleFieldBlur('agreeToTerms')}
            disabled={disabled || isSubmitting}
            aria-invalid={isFieldInvalid('agreeToTerms')}
            aria-describedby={getFieldError('agreeToTerms') ? 'agreeToTerms-error' : undefined}
            required
          />
          I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">terms and conditions</a> *
        </label>
        {getFieldError('agreeToTerms') && (
          <div id="agreeToTerms-error" role="alert" className="field-error">
            {getFieldError('agreeToTerms')}
          </div>
        )}
      </div>

      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={formData.newsletter}
            onChange={(e) => updateField('newsletter', e.target.checked)}
            disabled={disabled || isSubmitting}
          />
          Subscribe to newsletter
        </label>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          aria-describedby="submit-help"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
        <div id="submit-help" className="help-text">
          By creating an account, you agree to our terms and privacy policy
        </div>
      </div>
    </form>
  )
}

describe('RegistrationForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAPI.submitForm.mockResolvedValue({ success: true })
  })

  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(<RegistrationForm />)
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/agree to the terms/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subscribe to newsletter/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('renders with initial data', () => {
      const initialData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        newsletter: true,
      }
      
      render(<RegistrationForm initialData={initialData} />)
      
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
      expect(screen.getByLabelText(/subscribe to newsletter/i)).toBeChecked()
    })

    it('shows required field indicators', () => {
      render(<RegistrationForm />)
      
      const requiredLabels = screen.getAllByText('*')
      expect(requiredLabels).toHaveLength(5) // firstName, lastName, email, password, confirmPassword
    })

    it('includes help text for password requirements', () => {
      render(<RegistrationForm />)
      
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('updates field values when typing', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.type(firstNameInput, 'John')
      
      expect(firstNameInput).toHaveValue('John')
    })

    it('toggles checkbox values', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)
      
      const termsCheckbox = screen.getByLabelText(/agree to the terms/i)
      const newsletterCheckbox = screen.getByLabelText(/subscribe to newsletter/i)
      
      expect(termsCheckbox).not.toBeChecked()
      expect(newsletterCheckbox).not.toBeChecked()
      
      await user.click(termsCheckbox)
      await user.click(newsletterCheckbox)
      
      expect(termsCheckbox).toBeChecked()
      expect(newsletterCheckbox).toBeChecked()
    })

    it('clears field error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      // Trigger validation by blurring empty field
      await user.click(emailInput)
      await user.tab()
      
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      
      // Start typing to clear error
      await user.type(emailInput, 'test')
      
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    })
  })

  describe('Field Validation', () => {
    describe('Email Validation', () => {
      it('shows error for empty email on blur', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const emailInput = screen.getByLabelText(/email address/i)
        
        await user.click(emailInput)
        await user.tab()
        
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })

      it('shows error for invalid email format', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const emailInput = screen.getByLabelText(/email address/i)
        
        await user.type(emailInput, 'invalid-email')
        await user.tab()
        
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      it('accepts valid email format', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const emailInput = screen.getByLabelText(/email address/i)
        
        await user.type(emailInput, 'test@example.com')
        await user.tab()
        
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
        expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      })
    })

    describe('Password Validation', () => {
      it('shows error for empty password', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const passwordInput = screen.getByLabelText(/^password/i)
        
        await user.click(passwordInput)
        await user.tab()
        
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })

      it('shows error for short password', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const passwordInput = screen.getByLabelText(/^password/i)
        
        await user.type(passwordInput, '123')
        await user.tab()
        
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })

      it('validates password complexity requirements', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const passwordInput = screen.getByLabelText(/^password/i)
        
        // Missing uppercase
        await user.type(passwordInput, 'lowercase123')
        await user.tab()
        expect(screen.getByText(/must contain at least one uppercase letter/i)).toBeInTheDocument()
        
        await user.clear(passwordInput)
        
        // Missing lowercase
        await user.type(passwordInput, 'UPPERCASE123')
        await user.tab()
        expect(screen.getByText(/must contain at least one lowercase letter/i)).toBeInTheDocument()
        
        await user.clear(passwordInput)
        
        // Missing number
        await user.type(passwordInput, 'UpperLower')
        await user.tab()
        expect(screen.getByText(/must contain at least one number/i)).toBeInTheDocument()
      })

      it('accepts valid password', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const passwordInput = screen.getByLabelText(/^password/i)
        
        await user.type(passwordInput, 'ValidPass123')
        await user.tab()
        
        expect(screen.queryByText(/password must be/i)).not.toBeInTheDocument()
        expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
      })
    })

    describe('Password Confirmation', () => {
      it('shows error when passwords do not match', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const passwordInput = screen.getByLabelText(/^password/i)
        const confirmInput = screen.getByLabelText(/confirm password/i)
        
        await user.type(passwordInput, 'ValidPass123')
        await user.type(confirmInput, 'DifferentPass123')
        await user.tab()
        
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })

      it('accepts matching passwords', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const passwordInput = screen.getByLabelText(/^password/i)
        const confirmInput = screen.getByLabelText(/confirm password/i)
        
        await user.type(passwordInput, 'ValidPass123')
        await user.type(confirmInput, 'ValidPass123')
        await user.tab()
        
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
      })
    })

    describe('Required Fields', () => {
      it('validates required text fields', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const firstNameInput = screen.getByLabelText(/first name/i)
        const lastNameInput = screen.getByLabelText(/last name/i)
        
        await user.click(firstNameInput)
        await user.tab()
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
        
        await user.click(lastNameInput)
        await user.tab()
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      })

      it('validates required checkbox', async () => {
        const user = userEvent.setup()
        render(<RegistrationForm />)
        
        const termsCheckbox = screen.getByLabelText(/agree to the terms/i)
        
        await user.click(termsCheckbox)
        await user.click(termsCheckbox) // Uncheck
        
        expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument()
      })
    })
  })

  describe('Email Availability Check', () => {
    it('checks email availability on blur', async () => {
      const mockEmailCheck = vi.fn().mockResolvedValue(true)
      const user = userEvent.setup()
      
      render(<RegistrationForm onEmailCheck={mockEmailCheck} />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      await user.type(emailInput, 'test@example.com')
      await user.tab()
      
      expect(mockEmailCheck).toHaveBeenCalledWith('test@example.com')
    })

    it('shows checking message during email validation', async () => {
      const mockEmailCheck = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      )
      const user = userEvent.setup()
      
      render(<RegistrationForm onEmailCheck={mockEmailCheck} />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      await user.type(emailInput, 'test@example.com')
      user.tab() // Don't await to see loading state
      
      expect(screen.getByText(/checking email availability/i)).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByText(/checking email availability/i)).not.toBeInTheDocument()
      })
    })

    it('shows error when email is already taken', async () => {
      const mockEmailCheck = vi.fn().mockResolvedValue(false)
      const user = userEvent.setup()
      
      render(<RegistrationForm onEmailCheck={mockEmailCheck} />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      await user.type(emailInput, 'taken@example.com')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument()
      })
    })

    it('handles email check API failure', async () => {
      const mockEmailCheck = vi.fn().mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      
      render(<RegistrationForm onEmailCheck={mockEmailCheck} />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      await user.type(emailInput, 'test@example.com')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/unable to check email availability/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    const fillValidForm = async (user: any) => {
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123')
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123')
      await user.click(screen.getByLabelText(/agree to the terms/i))
    }

    it('submits valid form successfully', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      
      render(<RegistrationForm onSubmit={mockSubmit} />)
      
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /create account/i }))
      
      expect(mockSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        agreeToTerms: true,
        newsletter: false,
      })
    })

    it('prevents submission of invalid form', async () => {
      const mockSubmit = vi.fn()
      const user = userEvent.setup()
      
      render(<RegistrationForm onSubmit={mockSubmit} />)
      
      await user.click(screen.getByRole('button', { name: /create account/i }))
      
      expect(mockSubmit).not.toHaveBeenCalled()
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument()
    })

    it('shows loading state during submission', async () => {
      const mockSubmit = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      const user = userEvent.setup()
      
      render(<RegistrationForm onSubmit={mockSubmit} />)
      
      await fillValidForm(user)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      user.click(submitButton) // Don't await to see loading state
      
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })
      
      await waitFor(() => {
        expect(screen.getByText(/create account/i)).toBeInTheDocument()
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('handles submission error', async () => {
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
      const user = userEvent.setup()
      
      render(<RegistrationForm onSubmit={mockSubmit} />)
      
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent('Server error')
      })
    })

    it('prevents double submission', async () => {
      const mockSubmit = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      const user = userEvent.setup()
      
      render(<RegistrationForm onSubmit={mockSubmit} />)
      
      await fillValidForm(user)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      user.click(submitButton)
      user.click(submitButton) // Try to click again
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Disabled State', () => {
    it('disables all form inputs when disabled prop is true', () => {
      render(<RegistrationForm disabled />)
      
      expect(screen.getByLabelText(/first name/i)).toBeDisabled()
      expect(screen.getByLabelText(/last name/i)).toBeDisabled()
      expect(screen.getByLabelText(/email address/i)).toBeDisabled()
      expect(screen.getByLabelText(/^password/i)).toBeDisabled()
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled()
      expect(screen.getByLabelText(/agree to the terms/i)).toBeDisabled()
      expect(screen.getByLabelText(/subscribe to newsletter/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled()
    })

    it('prevents form submission when disabled', async () => {
      const mockSubmit = vi.fn()
      const user = userEvent.setup()
      
      render(<RegistrationForm disabled onSubmit={mockSubmit} />)
      
      await user.click(screen.getByRole('button', { name: /create account/i }))
      
      expect(mockSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('associates labels with form controls', () => {
      render(<RegistrationForm />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      expect(firstNameInput).toHaveAttribute('id', 'firstName')
      expect(lastNameInput).toHaveAttribute('id', 'lastName')
      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword')
    })

    it('provides proper aria-invalid attributes', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      // Should be false initially
      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      
      // Should be true after validation error
      await user.click(emailInput)
      await user.tab()
      
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('associates error messages with form controls', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      await user.click(emailInput)
      await user.tab()
      
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      expect(screen.getByText(/email is required/i)).toHaveAttribute('id', 'email-error')
    })

    it('provides help text for password requirements', () => {
      render(<RegistrationForm />)
      
      const passwordInput = screen.getByLabelText(/^password/i)
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-help')
      expect(screen.getByText(/password must be at least 8 characters/i)).toHaveAttribute('id', 'password-help')
    })

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)
      
      await user.click(screen.getByRole('button', { name: /create account/i }))
      
      const errorMessages = screen.getAllByRole('alert')
      expect(errorMessages.length).toBeGreaterThan(0)
    })

    it('provides proper form structure', () => {
      render(<RegistrationForm />)
      
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('novalidate')
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Keyboard Navigation', () => {
    it('allows tab navigation through form fields', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)
      
      // Start from first field
      await user.tab()
      expect(screen.getByLabelText(/first name/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/last name/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/email address/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/^password/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/confirm password/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/agree to the terms/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/subscribe to newsletter/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /create account/i })).toHaveFocus()
    })

    it('allows form submission with Enter key', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      
      render(<RegistrationForm onSubmit={mockSubmit} />)
      
      await fillValidForm(user)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      submitButton.focus()
      await user.keyboard('{Enter}')
      
      expect(mockSubmit).toHaveBeenCalled()
    })
  })
})