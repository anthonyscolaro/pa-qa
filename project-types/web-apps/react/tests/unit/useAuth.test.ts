import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useState, useEffect, useCallback } from 'react'

// Mock API service
const mockAuthAPI = {
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
}

// Mock types
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'moderator'
  avatar?: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface AuthError {
  code: string
  message: string
  field?: string
}

// Mock useAuth hook implementation
const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  })

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setState(prev => ({ ...prev, isLoading: false }))
          return
        }

        const user = await mockAuthAPI.getCurrentUser()
        setState({
          user,
          isLoading: false,
          error: null,
          isAuthenticated: true,
        })
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
          isAuthenticated: false,
        })
        localStorage.removeItem('auth_token')
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await mockAuthAPI.login(credentials)
      const { user, token } = response
      
      localStorage.setItem('auth_token', token)
      if (credentials.rememberMe) {
        localStorage.setItem('remember_me', 'true')
      }

      setState({
        user,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      })

      return { success: true, user }
    } catch (error) {
      const authError = error as AuthError
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: authError.message || 'Login failed',
      }))
      return { success: false, error: authError }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      await mockAuthAPI.logout()
      localStorage.removeItem('auth_token')
      localStorage.removeItem('remember_me')
      
      setState({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      })
    } catch (error) {
      // Even if logout fails on server, clear local state
      localStorage.removeItem('auth_token')
      localStorage.removeItem('remember_me')
      
      setState({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      })
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await mockAuthAPI.refreshToken()
      const { user, token } = response
      
      localStorage.setItem('auth_token', token)
      setState({
        user,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      })
      
      return { success: true, user }
    } catch (error) {
      const authError = error as AuthError
      setState({
        user: null,
        isLoading: false,
        error: authError.message || 'Token refresh failed',
        isAuthenticated: false,
      })
      localStorage.removeItem('auth_token')
      return { success: false, error: authError }
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user) {
      throw new Error('No authenticated user')
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const updatedUser = await mockAuthAPI.updateProfile(updates)
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }))
      
      return { success: true, user: updatedUser }
    } catch (error) {
      const authError = error as AuthError
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: authError.message || 'Profile update failed',
      }))
      return { success: false, error: authError }
    }
  }, [state.user])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    login,
    logout,
    refreshAuth,
    updateProfile,
    clearError,
  }
}

describe('useAuth Hook', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    avatar: 'https://example.com/avatar.jpg',
    isEmailVerified: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default mock implementations
    mockAuthAPI.getCurrentUser.mockResolvedValue(mockUser)
    mockAuthAPI.login.mockResolvedValue({ user: mockUser, token: 'test-token' })
    mockAuthAPI.logout.mockResolvedValue(undefined)
    mockAuthAPI.refreshToken.mockResolvedValue({ user: mockUser, token: 'new-token' })
    mockAuthAPI.updateProfile.mockResolvedValue({ ...mockUser, name: 'Updated User' })
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should initialize as unauthenticated when no token exists', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should initialize as authenticated when valid token exists', async () => {
      localStorage.setItem('auth_token', 'valid-token')
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBeNull()
      expect(mockAuthAPI.getCurrentUser).toHaveBeenCalledTimes(1)
    })

    it('should handle invalid token on initialization', async () => {
      localStorage.setItem('auth_token', 'invalid-token')
      mockAuthAPI.getCurrentUser.mockRejectedValue(new Error('Invalid token'))
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Invalid token')
      expect(localStorage.getItem('auth_token')).toBeNull()
    })
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const { result } = renderHook(() => useAuth())
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })
      
      expect(loginResult.success).toBe(true)
      expect(loginResult.user).toEqual(mockUser)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBeNull()
      expect(localStorage.getItem('auth_token')).toBe('test-token')
      expect(mockAuthAPI.login).toHaveBeenCalledWith(credentials)
    })

    it('should set remember me flag when requested', async () => {
      const { result } = renderHook(() => useAuth())
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      }
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login(credentials)
      })
      
      expect(localStorage.getItem('remember_me')).toBe('true')
    })

    it('should handle login failure', async () => {
      const { result } = renderHook(() => useAuth())
      const error: AuthError = {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        field: 'password',
      }
      
      mockAuthAPI.login.mockRejectedValue(error)
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      })
      
      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toEqual(error)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Invalid email or password')
      expect(localStorage.getItem('auth_token')).toBeNull()
    })

    it('should show loading state during login', async () => {
      const { result } = renderHook(() => useAuth())
      
      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock a slow login
      mockAuthAPI.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ user: mockUser, token: 'test-token' }), 100))
      )

      act(() => {
        result.current.login({ email: 'test@example.com', password: 'password123' })
      })
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Logout', () => {
    it('should logout successfully', async () => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('remember_me', 'true')
      
      const { result } = renderHook(() => useAuth())
      
      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('remember_me')).toBeNull()
      expect(mockAuthAPI.logout).toHaveBeenCalledTimes(1)
    })

    it('should clear local state even if logout API fails', async () => {
      localStorage.setItem('auth_token', 'test-token')
      mockAuthAPI.logout.mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorage.getItem('auth_token')).toBeNull()
    })
  })

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      localStorage.setItem('auth_token', 'old-token')
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      let refreshResult: any
      await act(async () => {
        refreshResult = await result.current.refreshAuth()
      })
      
      expect(refreshResult.success).toBe(true)
      expect(refreshResult.user).toEqual(mockUser)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(localStorage.getItem('auth_token')).toBe('new-token')
      expect(mockAuthAPI.refreshToken).toHaveBeenCalledTimes(1)
    })

    it('should handle token refresh failure', async () => {
      localStorage.setItem('auth_token', 'expired-token')
      const error: AuthError = {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      }
      
      mockAuthAPI.refreshToken.mockRejectedValue(error)
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      let refreshResult: any
      await act(async () => {
        refreshResult = await result.current.refreshAuth()
      })
      
      expect(refreshResult.success).toBe(false)
      expect(refreshResult.error).toEqual(error)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Token has expired')
      expect(localStorage.getItem('auth_token')).toBeNull()
    })
  })

  describe('Profile Update', () => {
    it('should update profile successfully', async () => {
      localStorage.setItem('auth_token', 'test-token')
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      const updates = { name: 'Updated User' }
      let updateResult: any
      
      await act(async () => {
        updateResult = await result.current.updateProfile(updates)
      })
      
      expect(updateResult.success).toBe(true)
      expect(updateResult.user.name).toBe('Updated User')
      expect(result.current.user?.name).toBe('Updated User')
      expect(mockAuthAPI.updateProfile).toHaveBeenCalledWith(updates)
    })

    it('should handle profile update failure', async () => {
      localStorage.setItem('auth_token', 'test-token')
      const error: AuthError = {
        code: 'VALIDATION_ERROR',
        message: 'Email already exists',
        field: 'email',
      }
      
      mockAuthAPI.updateProfile.mockRejectedValue(error)
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateProfile({ email: 'existing@example.com' })
      })
      
      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toEqual(error)
      expect(result.current.error).toBe('Email already exists')
    })

    it('should throw error when updating profile without authentication', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(async () => {
        await act(async () => {
          await result.current.updateProfile({ name: 'New Name' })
        })
      }).rejects.toThrow('No authenticated user')
    })
  })

  describe('Error Management', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useAuth())
      
      // First cause an error
      mockAuthAPI.login.mockRejectedValue(new Error('Login failed'))
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'wrong' })
      })
      
      expect(result.current.error).toBe('Login failed')
      
      // Clear the error
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('Hook Stability', () => {
    it('should maintain function references between renders', () => {
      const { result, rerender } = renderHook(() => useAuth())
      
      const initialLogin = result.current.login
      const initialLogout = result.current.logout
      const initialRefreshAuth = result.current.refreshAuth
      const initialUpdateProfile = result.current.updateProfile
      const initialClearError = result.current.clearError
      
      rerender()
      
      expect(result.current.login).toBe(initialLogin)
      expect(result.current.logout).toBe(initialLogout)
      expect(result.current.refreshAuth).toBe(initialRefreshAuth)
      expect(result.current.updateProfile).toBe(initialUpdateProfile)
      expect(result.current.clearError).toBe(initialClearError)
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent login requests', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const credentials = { email: 'test@example.com', password: 'password123' }
      
      // Start multiple login requests simultaneously
      const [result1, result2] = await Promise.all([
        act(async () => await result.current.login(credentials)),
        act(async () => await result.current.login(credentials)),
      ])
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle localStorage access errors', async () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      
      // Restore localStorage
      localStorage.getItem = originalGetItem
    })
  })
})