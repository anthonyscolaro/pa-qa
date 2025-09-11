/**
 * General Authentication Testing Utilities
 * Provides framework-agnostic authentication helpers for testing
 */

import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AuthContext {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  roles: string[];
}

export interface AuthTestConfig {
  secret: string;
  tokenExpiry: number;
  refreshTokenExpiry: number;
  sessionExpiry: number;
  enableMfa: boolean;
  enableEmailVerification: boolean;
}

export class AuthTestHelper {
  private config: AuthTestConfig;

  constructor(config: Partial<AuthTestConfig> = {}) {
    this.config = {
      secret: config.secret || 'test-secret-key-for-testing-only',
      tokenExpiry: config.tokenExpiry || 3600, // 1 hour
      refreshTokenExpiry: config.refreshTokenExpiry || 604800, // 7 days
      sessionExpiry: config.sessionExpiry || 86400, // 24 hours
      enableMfa: config.enableMfa || false,
      enableEmailVerification: config.enableEmailVerification || true,
      ...config
    };
  }

  /**
   * Hash password for testing
   */
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, actualSalt, 1000, 64, 'sha512').toString('hex');
    return { hash, salt: actualSalt };
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hashedPassword === hash;
  }

  /**
   * Generate MFA secret
   */
  generateMfaSecret(): string {
    return crypto.randomBytes(16).toString('base32');
  }

  /**
   * Generate MFA token (TOTP simulation)
   */
  generateMfaToken(secret: string, timeStep?: number): string {
    const time = Math.floor((timeStep || Date.now()) / 30000);
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'));
    const digest = hmac.digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
    return code.toString().padStart(6, '0');
  }

  /**
   * Verify MFA token
   */
  verifyMfaToken(token: string, secret: string, windowSize = 1): boolean {
    const currentTime = Date.now();
    for (let i = -windowSize; i <= windowSize; i++) {
      const timeStep = currentTime + (i * 30000);
      const expectedToken = this.generateMfaToken(secret, timeStep);
      if (token === expectedToken) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate session ID
   */
  generateSessionId(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate API key
   */
  generateApiKey(prefix = 'test'): string {
    const key = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${key}`;
  }

  /**
   * Create authentication context
   */
  createAuthContext(user: User | null, options: Partial<{
    token: string;
    refreshToken: string;
    sessionId: string;
  }> = {}): AuthContext {
    return {
      user,
      token: options.token || null,
      refreshToken: options.refreshToken || null,
      sessionId: options.sessionId || (user ? this.generateSessionId() : null),
      isAuthenticated: !!user,
      permissions: user?.permissions || [],
      roles: user?.roles || []
    };
  }

  /**
   * Mock authentication state for testing
   */
  mockAuthState(overrides: Partial<AuthContext> = {}): AuthContext {
    const defaultContext: AuthContext = {
      user: null,
      token: null,
      refreshToken: null,
      sessionId: null,
      isAuthenticated: false,
      permissions: [],
      roles: []
    };

    return { ...defaultContext, ...overrides };
  }

  /**
   * Create authenticated state for testing
   */
  createAuthenticatedState(user: User, options: {
    includeToken?: boolean;
    includeRefreshToken?: boolean;
    includeSession?: boolean;
  } = {}): AuthContext {
    const { includeToken = true, includeRefreshToken = true, includeSession = true } = options;
    
    return this.createAuthContext(user, {
      token: includeToken ? `test-token-${user.id}` : undefined,
      refreshToken: includeRefreshToken ? `test-refresh-${user.id}` : undefined,
      sessionId: includeSession ? this.generateSessionId() : undefined
    });
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: User | AuthContext, permission: string): boolean {
    const permissions = 'permissions' in user ? user.permissions : user.permissions;
    return permissions.includes(permission) || permissions.includes('*');
  }

  /**
   * Check if user has role
   */
  hasRole(user: User | AuthContext, role: string): boolean {
    const roles = 'roles' in user ? user.roles : user.roles;
    return roles.includes(role) || roles.includes('admin') || roles.includes('super_admin');
  }

  /**
   * Check if user has any of the required roles
   */
  hasAnyRole(user: User | AuthContext, roles: string[]): boolean {
    return roles.some(role => this.hasRole(user, role));
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(user: User | AuthContext, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Generate reset password token
   */
  generateResetToken(userId: string, expiryHours = 24): {
    token: string;
    expires: Date;
    hash: string;
  } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + (expiryHours * 60 * 60 * 1000));
    const hash = crypto.createHash('sha256').update(token + userId).digest('hex');
    
    return { token, expires, hash };
  }

  /**
   * Verify reset password token
   */
  verifyResetToken(token: string, userId: string, hash: string, expires: Date): boolean {
    if (new Date() > expires) {
      return false;
    }
    
    const expectedHash = crypto.createHash('sha256').update(token + userId).digest('hex');
    return expectedHash === hash;
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(email: string): string {
    return crypto.createHash('sha256').update(email + this.config.secret + Date.now()).digest('hex');
  }

  /**
   * Create test authentication headers
   */
  createAuthHeaders(token: string, type: 'Bearer' | 'Basic' | 'ApiKey' = 'Bearer'): Record<string, string> {
    switch (type) {
      case 'Bearer':
        return { Authorization: `Bearer ${token}` };
      case 'Basic':
        return { Authorization: `Basic ${Buffer.from(token).toString('base64')}` };
      case 'ApiKey':
        return { 'X-API-Key': token };
      default:
        return { Authorization: `Bearer ${token}` };
    }
  }

  /**
   * Simulate authentication flow delays
   */
  async simulateAuthDelay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create rate limiting state
   */
  createRateLimitState(identifier: string, maxAttempts = 5, windowMs = 300000): {
    attempts: number;
    resetTime: Date;
    isBlocked: boolean;
  } {
    return {
      attempts: 0,
      resetTime: new Date(Date.now() + windowMs),
      isBlocked: false
    };
  }

  /**
   * Generate device fingerprint for testing
   */
  generateDeviceFingerprint(): string {
    const components = [
      'Mozilla/5.0 (Test Browser)',
      'Test Device',
      'en-US',
      '1920x1080',
      'UTC-0'
    ];
    return crypto.createHash('sha256').update(components.join('|')).digest('hex').substring(0, 16);
  }
}

// Default instance for quick access
export const authHelper = new AuthTestHelper();

// Common test scenarios
export const AuthScenarios = {
  /**
   * Valid authentication scenarios
   */
  validAuth: {
    basicUser: () => authHelper.createAuthenticatedState({
      id: 'user-1',
      email: 'user@test.com',
      roles: ['user'],
      permissions: ['read'],
      isActive: true,
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    
    adminUser: () => authHelper.createAuthenticatedState({
      id: 'admin-1',
      email: 'admin@test.com',
      roles: ['admin'],
      permissions: ['*'],
      isActive: true,
      emailVerified: true,
      mfaEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }),

    mfaUser: () => authHelper.createAuthenticatedState({
      id: 'mfa-user-1',
      email: 'mfa@test.com',
      roles: ['user'],
      permissions: ['read', 'write'],
      isActive: true,
      emailVerified: true,
      mfaEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  },

  /**
   * Invalid authentication scenarios
   */
  invalidAuth: {
    expiredToken: () => authHelper.mockAuthState({
      user: null,
      token: 'expired.token.here',
      isAuthenticated: false
    }),

    unverifiedEmail: () => authHelper.createAuthenticatedState({
      id: 'unverified-1',
      email: 'unverified@test.com',
      roles: ['user'],
      permissions: ['read'],
      isActive: true,
      emailVerified: false,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }),

    inactiveUser: () => authHelper.createAuthenticatedState({
      id: 'inactive-1',
      email: 'inactive@test.com',
      roles: ['user'],
      permissions: [],
      isActive: false,
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }),

    noPermissions: () => authHelper.createAuthenticatedState({
      id: 'no-perms-1',
      email: 'noperms@test.com',
      roles: [],
      permissions: [],
      isActive: true,
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  },

  /**
   * Edge case scenarios
   */
  edgeCases: {
    partialSession: () => authHelper.mockAuthState({
      sessionId: authHelper.generateSessionId(),
      isAuthenticated: false
    }),

    tokenOnly: () => authHelper.mockAuthState({
      token: 'test-token-without-user',
      isAuthenticated: false
    }),

    multipleRoles: () => authHelper.createAuthenticatedState({
      id: 'multi-role-1',
      email: 'multirole@test.com',
      roles: ['user', 'moderator', 'editor'],
      permissions: ['read', 'write', 'moderate', 'edit'],
      isActive: true,
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
};

export default AuthTestHelper;