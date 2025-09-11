/**
 * JWT Token Management Utilities for Testing
 * Provides comprehensive JWT creation, validation, and mocking capabilities
 */

import crypto from 'crypto';

export interface JwtHeader {
  alg: string;
  typ: string;
  kid?: string;
}

export interface JwtPayload {
  sub?: string; // Subject (user ID)
  iat?: number; // Issued at
  exp?: number; // Expiration
  nbf?: number; // Not before
  iss?: string; // Issuer
  aud?: string | string[]; // Audience
  jti?: string; // JWT ID
  scope?: string; // OAuth2 scopes
  permissions?: string[]; // Custom permissions
  roles?: string[]; // User roles
  email?: string; // User email
  email_verified?: boolean; // Email verification status
  name?: string; // User name
  given_name?: string; // First name
  family_name?: string; // Last name
  picture?: string; // Profile picture URL
  [key: string]: any; // Additional custom claims
}

export interface JwtTestConfig {
  secret: string;
  algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
  issuer: string;
  audience: string;
  defaultExpiry: number; // seconds
}

export class JwtTestUtils {
  private config: JwtTestConfig;
  private privateKey?: string;
  private publicKey?: string;

  constructor(config: Partial<JwtTestConfig> = {}) {
    this.config = {
      secret: config.secret || 'test-jwt-secret-key-for-testing-only',
      algorithm: config.algorithm || 'HS256',
      issuer: config.issuer || 'test-issuer',
      audience: config.audience || 'test-audience',
      defaultExpiry: config.defaultExpiry || 3600, // 1 hour
      ...config
    };

    // Generate RSA keys if using RSA algorithm
    if (this.config.algorithm.startsWith('RS')) {
      this.generateRSAKeys();
    }
  }

  /**
   * Generate RSA key pair for RS256/384/512 algorithms
   */
  private generateRSAKeys(): void {
    const { generateKeyPairSync } = crypto;
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  /**
   * Base64URL encode
   */
  private base64urlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64URL decode
   */
  private base64urlDecode(str: string): string {
    str += new Array(5 - (str.length % 4)).join('=');
    return Buffer.from(str.replace(/\-/g, '+').replace(/_/g, '/'), 'base64').toString();
  }

  /**
   * Create JWT signature
   */
  private createSignature(header: string, payload: string): string {
    const data = `${header}.${payload}`;
    
    if (this.config.algorithm.startsWith('HS')) {
      const hmac = crypto.createHmac(`sha${this.config.algorithm.slice(2)}`, this.config.secret);
      return this.base64urlEncode(hmac.update(data).digest('base64'));
    } else if (this.config.algorithm.startsWith('RS')) {
      const sign = crypto.createSign(`RSA-SHA${this.config.algorithm.slice(2)}`);
      sign.update(data);
      return this.base64urlEncode(sign.sign(this.privateKey!, 'base64'));
    }
    
    throw new Error(`Unsupported algorithm: ${this.config.algorithm}`);
  }

  /**
   * Verify JWT signature
   */
  private verifySignature(header: string, payload: string, signature: string): boolean {
    try {
      const data = `${header}.${payload}`;
      const expectedSignature = this.createSignature(header, payload);
      return expectedSignature === signature;
    } catch {
      return false;
    }
  }

  /**
   * Generate a JWT token
   */
  generateToken(payload: Partial<JwtPayload> = {}, options: {
    expiresIn?: number; // seconds
    notBefore?: number; // seconds from now
    jwtId?: string;
    keyId?: string;
  } = {}): string {
    const now = Math.floor(Date.now() / 1000);
    
    const header: JwtHeader = {
      alg: this.config.algorithm,
      typ: 'JWT',
      ...(options.keyId && { kid: options.keyId })
    };

    const jwtPayload: JwtPayload = {
      iss: this.config.issuer,
      aud: this.config.audience,
      iat: now,
      exp: now + (options.expiresIn || this.config.defaultExpiry),
      ...(options.notBefore && { nbf: now + options.notBefore }),
      ...(options.jwtId && { jti: options.jwtId }),
      ...payload
    };

    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(jwtPayload));
    const signature = this.createSignature(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Parse JWT token (without verification)
   */
  parseToken(token: string): { header: JwtHeader; payload: JwtPayload; signature: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = JSON.parse(this.base64urlDecode(parts[0]));
      const payload = JSON.parse(this.base64urlDecode(parts[1]));
      const signature = parts[2];

      return { header, payload, signature };
    } catch {
      return null;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string, options: {
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    clockTolerance?: number; // seconds
    requiredClaims?: string[];
  } = {}): { valid: boolean; payload?: JwtPayload; error?: string } {
    const parsed = this.parseToken(token);
    if (!parsed) {
      return { valid: false, error: 'Invalid token format' };
    }

    const { header, payload, signature } = parsed;

    // Verify signature
    if (!this.verifySignature(
      this.base64urlEncode(JSON.stringify(header)),
      this.base64urlEncode(JSON.stringify(payload)),
      signature
    )) {
      return { valid: false, error: 'Invalid signature' };
    }

    const now = Math.floor(Date.now() / 1000);
    const clockTolerance = options.clockTolerance || 0;

    // Check expiration
    if (!options.ignoreExpiration && payload.exp && now > payload.exp + clockTolerance) {
      return { valid: false, error: 'Token expired' };
    }

    // Check not before
    if (!options.ignoreNotBefore && payload.nbf && now < payload.nbf - clockTolerance) {
      return { valid: false, error: 'Token not yet valid' };
    }

    // Check required claims
    if (options.requiredClaims) {
      for (const claim of options.requiredClaims) {
        if (!(claim in payload)) {
          return { valid: false, error: `Missing required claim: ${claim}` };
        }
      }
    }

    return { valid: true, payload };
  }

  /**
   * Generate expired token
   */
  generateExpiredToken(payload: Partial<JwtPayload> = {}): string {
    return this.generateToken(payload, { expiresIn: -3600 }); // Expired 1 hour ago
  }

  /**
   * Generate token with custom claims
   */
  generateTokenWithClaims(claims: Record<string, any>, expiresIn?: number): string {
    return this.generateToken(claims, { expiresIn });
  }

  /**
   * Generate access token for user
   */
  generateAccessToken(userId: string, options: {
    email?: string;
    roles?: string[];
    permissions?: string[];
    scope?: string;
    expiresIn?: number;
  } = {}): string {
    const payload: JwtPayload = {
      sub: userId,
      email: options.email,
      roles: options.roles || ['user'],
      permissions: options.permissions || [],
      scope: options.scope || 'read',
      token_type: 'access_token'
    };

    return this.generateToken(payload, { expiresIn: options.expiresIn });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string, sessionId?: string): string {
    const payload: JwtPayload = {
      sub: userId,
      token_type: 'refresh_token',
      ...(sessionId && { session_id: sessionId })
    };

    return this.generateToken(payload, { expiresIn: 604800 }); // 7 days
  }

  /**
   * Generate ID token (OpenID Connect)
   */
  generateIdToken(userId: string, options: {
    email: string;
    name?: string;
    givenName?: string;
    familyName?: string;
    picture?: string;
    emailVerified?: boolean;
    nonce?: string;
    authTime?: number;
  }): string {
    const payload: JwtPayload = {
      sub: userId,
      email: options.email,
      email_verified: options.emailVerified || true,
      name: options.name,
      given_name: options.givenName,
      family_name: options.familyName,
      picture: options.picture,
      nonce: options.nonce,
      auth_time: options.authTime || Math.floor(Date.now() / 1000)
    };

    return this.generateToken(payload, { expiresIn: 3600 }); // 1 hour
  }

  /**
   * Generate malformed token for testing
   */
  generateMalformedToken(): string {
    return 'not.a.valid.jwt.token';
  }

  /**
   * Generate token with invalid signature
   */
  generateInvalidSignatureToken(payload: Partial<JwtPayload> = {}): string {
    const validToken = this.generateToken(payload);
    const parts = validToken.split('.');
    // Modify the signature to make it invalid
    const invalidSignature = this.base64urlEncode('invalid-signature');
    return `${parts[0]}.${parts[1]}.${invalidSignature}`;
  }

  /**
   * Generate token with missing claims
   */
  generateTokenWithMissingClaims(missingClaims: string[] = ['sub']): string {
    const payload: JwtPayload = {
      iss: this.config.issuer,
      aud: this.config.audience,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.defaultExpiry
    };

    // Remove specified claims
    missingClaims.forEach(claim => {
      delete payload[claim as keyof JwtPayload];
    });

    return this.generateToken(payload);
  }

  /**
   * Decode token payload without verification (for testing)
   */
  decodePayload(token: string): JwtPayload | null {
    const parsed = this.parseToken(token);
    return parsed ? parsed.payload : null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) {
      return false;
    }
    return Math.floor(Date.now() / 1000) > payload.exp;
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) {
      return null;
    }
    return new Date(payload.exp * 1000);
  }

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiration(token: string): number | null {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return null;
    }
    return Math.max(0, Math.floor((expiration.getTime() - Date.now()) / 1000));
  }

  /**
   * Create JWT test scenarios
   */
  createTestScenarios() {
    return {
      valid: {
        basicUser: () => this.generateAccessToken('user-1', {
          email: 'user@test.com',
          roles: ['user'],
          permissions: ['read']
        }),
        
        adminUser: () => this.generateAccessToken('admin-1', {
          email: 'admin@test.com',
          roles: ['admin'],
          permissions: ['*']
        }),

        withScopes: () => this.generateAccessToken('user-2', {
          email: 'user2@test.com',
          scope: 'read write profile'
        }),

        refreshToken: () => this.generateRefreshToken('user-1', 'session-123')
      },

      invalid: {
        expired: () => this.generateExpiredToken({ sub: 'user-1' }),
        malformed: () => this.generateMalformedToken(),
        invalidSignature: () => this.generateInvalidSignatureToken({ sub: 'user-1' }),
        missingSubject: () => this.generateTokenWithMissingClaims(['sub']),
        notYetValid: () => this.generateToken({ sub: 'user-1' }, { notBefore: 3600 })
      },

      edge: {
        emptyPayload: () => this.generateToken({}),
        customClaims: () => this.generateTokenWithClaims({
          custom_claim: 'custom_value',
          nested: { data: 'test' }
        }),
        longExpiry: () => this.generateToken({ sub: 'user-1' }, { expiresIn: 31536000 }) // 1 year
      }
    };
  }
}

// Default instance for quick access
export const jwtUtils = new JwtTestUtils();

// Common JWT test patterns
export const JwtPatterns = {
  /**
   * Standard user token pattern
   */
  userToken: (userId: string, overrides: Partial<JwtPayload> = {}) => 
    jwtUtils.generateAccessToken(userId, overrides),

  /**
   * Admin token pattern
   */
  adminToken: (adminId: string) => 
    jwtUtils.generateAccessToken(adminId, {
      roles: ['admin'],
      permissions: ['*']
    }),

  /**
   * Service-to-service token pattern
   */
  serviceToken: (serviceId: string, scopes: string[]) => 
    jwtUtils.generateTokenWithClaims({
      sub: serviceId,
      client_id: serviceId,
      scope: scopes.join(' '),
      token_type: 'service'
    }),

  /**
   * API key token pattern
   */
  apiKeyToken: (keyId: string, permissions: string[]) => 
    jwtUtils.generateTokenWithClaims({
      sub: keyId,
      permissions,
      token_type: 'api_key'
    })
};

export default JwtTestUtils;