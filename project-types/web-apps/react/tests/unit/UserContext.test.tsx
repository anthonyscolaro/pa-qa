import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { render } from '@/test-utils'

// Mock User types
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'moderator'
  avatar?: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
    language: string
  }
  permissions: string[]
}

interface UserContextState {
  user: User | null
  isLoading: boolean
  error: string | null
}

interface UserContextActions {
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  updatePreferences: (preferences: Partial<User['preferences']>) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

type UserContextValue = UserContextState & UserContextActions

// Mock API service
const mockUserAPI = {
  getUser: vi.fn(),
  updateUser: vi.fn(),
  updatePreferences: vi.fn(),
}

// User Context implementation
type UserAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<User['preferences']> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }

const userReducer = (state: UserContextState, action: UserAction): UserContextState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      }
    case 'UPDATE_USER':
      if (!state.user) return state
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
        error: null,
      }
    case 'UPDATE_PREFERENCES':
      if (!state.user) return state
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload,
          },
        },
        error: null,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    default:
      return state
  }
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export const useUserContext = (): UserContextValue => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}

export const UserProvider: React.FC<{ children: ReactNode; userId?: string }> = ({
  children,
  userId,
}) => {
  const [state, dispatch] = useReducer(userReducer, {
    user: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    if (!userId) {
      dispatch({ type: 'SET_USER', payload: null })
      return
    }

    const fetchUser = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        const user = await mockUserAPI.getUser(userId)
        dispatch({ type: 'SET_USER', payload: user })
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Failed to fetch user',
        })
      }
    }

    fetchUser()
  }, [userId])

  const setUser = (user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user })
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!state.user) {
      dispatch({ type: 'SET_ERROR', payload: 'No user to update' })
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const updatedUser = await mockUserAPI.updateUser(state.user.id, updates)
      dispatch({ type: 'UPDATE_USER', payload: updatedUser })
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to update user',
      })
    }
  }

  const updatePreferences = async (preferences: Partial<User['preferences']>) => {
    if (!state.user) {
      dispatch({ type: 'SET_ERROR', payload: 'No user to update' })
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const updatedPreferences = await mockUserAPI.updatePreferences(
        state.user.id,
        preferences
      )
      dispatch({ type: 'UPDATE_PREFERENCES', payload: updatedPreferences })
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to update preferences',
      })
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const contextValue: UserContextValue = {
    ...state,
    setUser,
    updateUser,
    updatePreferences,
    clearError,
    setLoading,
  }

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

// Test components
const UserProfile: React.FC = () => {
  const { user, isLoading, error } = useUserContext()

  if (isLoading) {
    return <div>Loading user...</div>
  }

  if (error) {
    return <div role="alert">Error: {error}</div>
  }

  if (!user) {
    return <div>No user found</div>
  }

  return (
    <div>
      <h1>User Profile</h1>
      <p data-testid="user-name">{user.name}</p>
      <p data-testid="user-email">{user.email}</p>
      <p data-testid="user-role">{user.role}</p>
      <p data-testid="user-theme">{user.preferences.theme}</p>
    </div>
  )
}

const UserActions: React.FC = () => {
  const { user, updateUser, updatePreferences, clearError } = useUserContext()

  const handleUpdateName = async () => {
    await updateUser({ name: 'Updated Name' })
  }

  const handleToggleTheme = async () => {
    const newTheme = user?.preferences.theme === 'light' ? 'dark' : 'light'
    await updatePreferences({ theme: newTheme })
  }

  const handleClearError = () => {
    clearError()
  }

  return (
    <div>
      <button onClick={handleUpdateName}>Update Name</button>
      <button onClick={handleToggleTheme}>Toggle Theme</button>
      <button onClick={handleClearError}>Clear Error</button>
    </div>
  )
}

const TestApp: React.FC<{ userId?: string }> = ({ userId }) => {
  return (
    <UserProvider userId={userId}>
      <UserProfile />
      <UserActions />
    </UserProvider>
  )
}

describe('UserContext', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    avatar: 'https://example.com/avatar.jpg',
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en',
    },
    permissions: ['read', 'write'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserAPI.getUser.mockResolvedValue(mockUser)
    mockUserAPI.updateUser.mockResolvedValue({ name: 'Updated Name' })
    mockUserAPI.updatePreferences.mockResolvedValue({ theme: 'dark' })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Provider Setup', () => {
    it('should throw error when useUserContext is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<UserProfile />)
      }).toThrow('useUserContext must be used within a UserProvider')

      consoleSpy.mockRestore()
    })

    it('should provide context value to children', () => {
      render(<TestApp />)
      
      expect(screen.getByText('Loading user...')).toBeInTheDocument()
    })
  })

  describe('Initial State', () => {
    it('should show loading state initially when userId is provided', () => {
      render(<TestApp userId="1" />)
      
      expect(screen.getByText('Loading user...')).toBeInTheDocument()
    })

    it('should show no user when userId is not provided', async () => {
      render(<TestApp />)
      
      await waitFor(() => {
        expect(screen.getByText('No user found')).toBeInTheDocument()
      })
    })

    it('should load user data when userId is provided', async () => {
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('user-role')).toHaveTextContent('user')
        expect(screen.getByTestId('user-theme')).toHaveTextContent('light')
      })
      
      expect(mockUserAPI.getUser).toHaveBeenCalledWith('1')
    })
  })

  describe('Error Handling', () => {
    it('should handle API error when fetching user', async () => {
      mockUserAPI.getUser.mockRejectedValue(new Error('User not found'))
      
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error: User not found')
      })
    })

    it('should handle generic error when fetching user', async () => {
      mockUserAPI.getUser.mockRejectedValue('Generic error')
      
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error: Failed to fetch user')
      })
    })

    it('should clear error when clearError is called', async () => {
      mockUserAPI.getUser.mockRejectedValue(new Error('User not found'))
      const user = userEvent.setup()
      
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Clear Error'))
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('User Updates', () => {
    it('should update user data', async () => {
      const user = userEvent.setup()
      
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
      })

      await user.click(screen.getByText('Update Name'))
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Updated Name')
      })
      
      expect(mockUserAPI.updateUser).toHaveBeenCalledWith('1', { name: 'Updated Name' })
    })

    it('should handle user update error', async () => {
      mockUserAPI.updateUser.mockRejectedValue(new Error('Update failed'))
      const user = userEvent.setup()
      
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Update Name'))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error: Update failed')
      })
    })

    it('should handle update when no user exists', async () => {
      const user = userEvent.setup()
      
      render(<TestApp />)
      
      await waitFor(() => {
        expect(screen.getByText('No user found')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Update Name'))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error: No user to update')
      })
    })
  })

  describe('Preferences Updates', () => {
    it('should update user preferences', async () => {
      const user = userEvent.setup()
      
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-theme')).toHaveTextContent('light')
      })

      await user.click(screen.getByText('Toggle Theme'))
      
      await waitFor(() => {
        expect(screen.getByTestId('user-theme')).toHaveTextContent('dark')
      })
      
      expect(mockUserAPI.updatePreferences).toHaveBeenCalledWith('1', { theme: 'dark' })
    })

    it('should handle preferences update error', async () => {
      mockUserAPI.updatePreferences.mockRejectedValue(new Error('Preferences update failed'))
      const user = userEvent.setup()
      
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-theme')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Toggle Theme'))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error: Preferences update failed')
      })
    })

    it('should handle preferences update when no user exists', async () => {
      const user = userEvent.setup()
      
      render(<TestApp />)
      
      await waitFor(() => {
        expect(screen.getByText('No user found')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Toggle Theme'))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error: No user to update')
      })
    })
  })

  describe('Direct State Management', () => {
    const DirectStateTest: React.FC = () => {
      const { user, setUser, isLoading, setLoading } = useUserContext()

      const handleSetUser = () => {
        setUser({
          ...mockUser,
          name: 'Direct Set User',
        })
      }

      const handleSetLoading = () => {
        setLoading(true)
      }

      return (
        <div>
          <p data-testid="current-user">{user?.name || 'No user'}</p>
          <p data-testid="loading-state">{isLoading ? 'Loading' : 'Not Loading'}</p>
          <button onClick={handleSetUser}>Set User</button>
          <button onClick={handleSetLoading}>Set Loading</button>
        </div>
      )
    }

    it('should allow direct user state management', async () => {
      const user = userEvent.setup()
      
      render(
        <UserProvider>
          <DirectStateTest />
        </UserProvider>
      )
      
      expect(screen.getByTestId('current-user')).toHaveTextContent('No user')

      await user.click(screen.getByText('Set User'))
      
      expect(screen.getByTestId('current-user')).toHaveTextContent('Direct Set User')
    })

    it('should allow direct loading state management', async () => {
      const user = userEvent.setup()
      
      render(
        <UserProvider>
          <DirectStateTest />
        </UserProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading')
      })

      await user.click(screen.getByText('Set Loading'))
      
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading')
    })
  })

  describe('Provider Re-rendering', () => {
    it('should handle userId changes', async () => {
      const anotherUser: User = {
        ...mockUser,
        id: '2',
        name: 'Another User',
      }

      mockUserAPI.getUser.mockImplementation((id) => {
        if (id === '1') return Promise.resolve(mockUser)
        if (id === '2') return Promise.resolve(anotherUser)
        return Promise.reject(new Error('User not found'))
      })

      const { rerender } = render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
      })

      rerender(<TestApp userId="2" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Another User')
      })
      
      expect(mockUserAPI.getUser).toHaveBeenCalledWith('1')
      expect(mockUserAPI.getUser).toHaveBeenCalledWith('2')
    })

    it('should handle userId removal', async () => {
      const { rerender } = render(<TestApp userId="1" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
      })

      rerender(<TestApp />)
      
      await waitFor(() => {
        expect(screen.getByText('No user found')).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Consumers', () => {
    const MultipleConsumers: React.FC = () => {
      return (
        <UserProvider userId="1">
          <div data-testid="consumer-1">
            <UserProfile />
          </div>
          <div data-testid="consumer-2">
            <UserActions />
          </div>
          <div data-testid="consumer-3">
            <UserProfile />
          </div>
        </UserProvider>
      )
    }

    it('should provide same context value to multiple consumers', async () => {
      render(<MultipleConsumers />)
      
      await waitFor(() => {
        const consumer1 = screen.getByTestId('consumer-1')
        const consumer3 = screen.getByTestId('consumer-3')
        
        expect(consumer1.querySelector('[data-testid="user-name"]')).toHaveTextContent('Test User')
        expect(consumer3.querySelector('[data-testid="user-name"]')).toHaveTextContent('Test User')
      })
    })

    it('should update all consumers when context changes', async () => {
      const user = userEvent.setup()
      
      render(<MultipleConsumers />)
      
      await waitFor(() => {
        expect(screen.getAllByTestId('user-name')[0]).toHaveTextContent('Test User')
        expect(screen.getAllByTestId('user-name')[1]).toHaveTextContent('Test User')
      })

      await user.click(screen.getByText('Update Name'))
      
      await waitFor(() => {
        expect(screen.getAllByTestId('user-name')[0]).toHaveTextContent('Updated Name')
        expect(screen.getAllByTestId('user-name')[1]).toHaveTextContent('Updated Name')
      })
    })
  })

  describe('Accessibility', () => {
    it('should properly announce errors to screen readers', async () => {
      mockUserAPI.getUser.mockRejectedValue(new Error('Access denied'))
      
      render(<TestApp userId="1" />)
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent('Error: Access denied')
        expect(alert).toBeInTheDocument()
      })
    })

    it('should provide meaningful loading states', () => {
      render(<TestApp userId="1" />)
      
      const loadingText = screen.getByText('Loading user...')
      expect(loadingText).toBeInTheDocument()
    })
  })
})