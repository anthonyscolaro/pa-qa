/**
 * OAuth2 Provider Mocks for Testing
 * Provides mock implementations for Google, GitHub, Auth0, and generic OAuth2 providers
 */

import crypto from 'crypto';
import { jwtUtils } from './jwt-utils';

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  verified: boolean;
  locale?: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  raw?: Record<string, any>;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: 'Bearer' | 'bearer';
  expires_in: number;
  scope?: string;
  id_token?: string;
}

export interface OAuthAuthorizationCode {
  code: string;
  state: string;
  expiresAt: number;
  userId: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export class OAuthMockProvider {
  private provider: OAuthProvider;
  private users: Map<string, OAuthUser> = new Map();
  private authCodes: Map<string, OAuthAuthorizationCode> = new Map();
  private accessTokens: Map<string, { userId: string; scopes: string[]; expiresAt: number }> = new Map();

  constructor(provider: OAuthProvider) {
    this.provider = provider;
  }

  /**
   * Add mock user to the provider
   */
  addUser(user: Omit<OAuthUser, 'provider' | 'providerAccountId'>): OAuthUser {
    const oauthUser: OAuthUser = {
      ...user,
      provider: this.provider.name,
      providerAccountId: user.id
    };
    
    this.users.set(user.id, oauthUser);
    return oauthUser;
  }

  /**
   * Generate authorization URL
   */
  getAuthorizationUrl(options: {
    state?: string;
    scopes?: string[];
    redirectUri?: string;
  } = {}): string {
    const params = new URLSearchParams({
      client_id: this.provider.clientId,
      redirect_uri: options.redirectUri || this.provider.redirectUri,
      response_type: 'code',
      scope: (options.scopes || this.provider.scopes).join(' '),
      state: options.state || crypto.randomBytes(16).toString('hex')
    });

    return `${this.provider.authUrl}?${params.toString()}`;
  }

  /**
   * Simulate user authorization and generate authorization code
   */
  simulateUserAuthorization(userId: string, options: {
    state?: string;
    scopes?: string[];
    redirectUri?: string;
  } = {}): { code: string; state: string; redirectUrl: string } {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const code = crypto.randomBytes(32).toString('hex');
    const state = options.state || crypto.randomBytes(16).toString('hex');
    const redirectUri = options.redirectUri || this.provider.redirectUri;
    const scopes = options.scopes || this.provider.scopes;

    const authCode: OAuthAuthorizationCode = {
      code,
      state,
      expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
      userId,
      clientId: this.provider.clientId,
      redirectUri,
      scopes
    };

    this.authCodes.set(code, authCode);

    const redirectParams = new URLSearchParams({ code, state });
    const redirectUrl = `${redirectUri}?${redirectParams.toString()}`;

    return { code, state, redirectUrl };
  }

  /**
   * Exchange authorization code for access token
   */
  exchangeCodeForToken(code: string, options: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  } = {}): OAuthTokenResponse {
    const authCode = this.authCodes.get(code);
    if (!authCode) {
      throw new Error('Invalid authorization code');
    }

    if (Date.now() > authCode.expiresAt) {
      this.authCodes.delete(code);
      throw new Error('Authorization code expired');
    }

    if (options.clientId && options.clientId !== authCode.clientId) {
      throw new Error('Invalid client_id');
    }

    if (options.redirectUri && options.redirectUri !== authCode.redirectUri) {
      throw new Error('Invalid redirect_uri');
    }

    // Generate tokens
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = 3600; // 1 hour
    const expiresAt = Date.now() + (expiresIn * 1000);

    // Store access token
    this.accessTokens.set(accessToken, {
      userId: authCode.userId,
      scopes: authCode.scopes,
      expiresAt
    });

    // Generate ID token for OIDC providers
    let idToken: string | undefined;
    if (this.provider.name === 'google' || this.provider.name === 'auth0') {
      const user = this.users.get(authCode.userId);
      if (user) {
        idToken = jwtUtils.generateIdToken(user.id, {
          email: user.email,
          name: user.name,
          givenName: user.firstName,
          familyName: user.lastName,
          picture: user.avatar,
          emailVerified: user.verified
        });
      }
    }

    // Clean up authorization code
    this.authCodes.delete(code);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: authCode.scopes.join(' '),
      ...(idToken && { id_token: idToken })
    };
  }

  /**
   * Get user info from access token
   */
  getUserInfo(accessToken: string): OAuthUser {
    const tokenData = this.accessTokens.get(accessToken);
    if (!tokenData) {
      throw new Error('Invalid access token');
    }

    if (Date.now() > tokenData.expiresAt) {
      this.accessTokens.delete(accessToken);
      throw new Error('Access token expired');
    }

    const user = this.users.get(tokenData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
      accessToken,
      expiresAt: tokenData.expiresAt
    };
  }

  /**
   * Refresh access token
   */
  refreshToken(refreshToken: string): OAuthTokenResponse {
    // Find user by refresh token (simplified for testing)
    const user = Array.from(this.users.values()).find(u => u.refreshToken === refreshToken);
    if (!user) {
      throw new Error('Invalid refresh token');
    }

    const accessToken = crypto.randomBytes(32).toString('hex');
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = 3600;
    const expiresAt = Date.now() + (expiresIn * 1000);

    this.accessTokens.set(accessToken, {
      userId: user.id,
      scopes: this.provider.scopes,
      expiresAt
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: this.provider.scopes.join(' ')
    };
  }

  /**
   * Revoke access token
   */
  revokeToken(token: string): boolean {
    return this.accessTokens.delete(token);
  }

  /**
   * Get provider info
   */
  getProviderInfo(): OAuthProvider {
    return { ...this.provider };
  }

  /**
   * Clear all data (for test cleanup)
   */
  clear(): void {
    this.users.clear();
    this.authCodes.clear();
    this.accessTokens.clear();
  }

  /**
   * Simulate OAuth error response
   */
  simulateError(error: 'access_denied' | 'invalid_request' | 'server_error', description?: string): never {
    const errorMap = {
      access_denied: 'The user denied the authorization request',
      invalid_request: 'The request is missing a required parameter',
      server_error: 'The server encountered an unexpected condition'
    };

    throw new Error(`${error}: ${description || errorMap[error]}`);
  }
}

// Google OAuth Mock Provider
export class GoogleOAuthMock extends OAuthMockProvider {
  constructor(options: Partial<OAuthProvider> = {}) {
    super({
      name: 'google',
      clientId: options.clientId || 'test-google-client-id',
      clientSecret: options.clientSecret || 'test-google-client-secret',
      authUrl: 'https://accounts.google.com/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['openid', 'email', 'profile'],
      redirectUri: options.redirectUri || 'http://localhost:3000/auth/callback/google',
      ...options
    });
  }

  /**
   * Add Google user with proper structure
   */
  addGoogleUser(userData: {
    id: string;
    email: string;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    verified_email?: boolean;
    locale?: string;
  }): OAuthUser {
    return this.addUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      firstName: userData.given_name,
      lastName: userData.family_name,
      avatar: userData.picture,
      verified: userData.verified_email || true,
      locale: userData.locale || 'en',
      raw: userData
    });
  }
}

// GitHub OAuth Mock Provider
export class GitHubOAuthMock extends OAuthMockProvider {
  constructor(options: Partial<OAuthProvider> = {}) {
    super({
      name: 'github',
      clientId: options.clientId || 'test-github-client-id',
      clientSecret: options.clientSecret || 'test-github-client-secret',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scopes: ['user:email'],
      redirectUri: options.redirectUri || 'http://localhost:3000/auth/callback/github',
      ...options
    });
  }

  /**
   * Add GitHub user with proper structure
   */
  addGitHubUser(userData: {
    id: number;
    login: string;
    email: string;
    name: string;
    avatar_url?: string;
    bio?: string;
    company?: string;
    location?: string;
    hireable?: boolean;
    public_repos?: number;
    followers?: number;
    following?: number;
  }): OAuthUser {
    return this.addUser({
      id: userData.id.toString(),
      email: userData.email,
      name: userData.name,
      username: userData.login,
      avatar: userData.avatar_url,
      verified: true, // GitHub emails are considered verified
      raw: userData
    });
  }
}

// Auth0 OAuth Mock Provider
export class Auth0OAuthMock extends OAuthMockProvider {
  constructor(domain: string, options: Partial<OAuthProvider> = {}) {
    super({
      name: 'auth0',
      clientId: options.clientId || 'test-auth0-client-id',
      clientSecret: options.clientSecret || 'test-auth0-client-secret',
      authUrl: `https://${domain}/authorize`,
      tokenUrl: `https://${domain}/oauth/token`,
      userInfoUrl: `https://${domain}/userinfo`,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: options.redirectUri || 'http://localhost:3000/auth/callback/auth0',
      ...options
    });
  }

  /**
   * Add Auth0 user with proper structure
   */
  addAuth0User(userData: {
    sub: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    nickname?: string;
    picture?: string;
    email_verified?: boolean;
    locale?: string;
    updated_at?: string;
  }): OAuthUser {
    return this.addUser({
      id: userData.sub,
      email: userData.email,
      name: userData.name || userData.nickname || userData.email,
      firstName: userData.given_name,
      lastName: userData.family_name,
      username: userData.nickname,
      avatar: userData.picture,
      verified: userData.email_verified || false,
      locale: userData.locale,
      raw: userData
    });
  }
}

// Generic OAuth2 Mock Provider
export class GenericOAuth2Mock extends OAuthMockProvider {
  constructor(config: OAuthProvider) {
    super(config);
  }
}

// OAuth Mock Manager
export class OAuthMockManager {
  private providers: Map<string, OAuthMockProvider> = new Map();

  /**
   * Add provider to manager
   */
  addProvider(name: string, provider: OAuthMockProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Get provider by name
   */
  getProvider(name: string): OAuthMockProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Remove provider
   */
  removeProvider(name: string): boolean {
    return this.providers.delete(name);
  }

  /**
   * Clear all providers
   */
  clearAll(): void {
    this.providers.forEach(provider => provider.clear());
    this.providers.clear();
  }

  /**
   * Get all provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Create complete OAuth flow for testing
   */
  simulateCompleteFlow(providerName: string, userId: string, options: {
    scopes?: string[];
    state?: string;
    redirectUri?: string;
  } = {}): {
    authUrl: string;
    code: string;
    state: string;
    tokens: OAuthTokenResponse;
    user: OAuthUser;
  } {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Step 1: Get authorization URL
    const authUrl = provider.getAuthorizationUrl(options);

    // Step 2: Simulate user authorization
    const { code, state } = provider.simulateUserAuthorization(userId, options);

    // Step 3: Exchange code for tokens
    const tokens = provider.exchangeCodeForToken(code);

    // Step 4: Get user info
    const user = provider.getUserInfo(tokens.access_token);

    return { authUrl, code, state, tokens, user };
  }
}

// Pre-configured providers for common testing scenarios
export const oauthMocks = {
  google: new GoogleOAuthMock(),
  github: new GitHubOAuthMock(),
  auth0: new Auth0OAuthMock('test-tenant.auth0.com'),
  manager: new OAuthMockManager()
};

// Initialize manager with default providers
oauthMocks.manager.addProvider('google', oauthMocks.google);
oauthMocks.manager.addProvider('github', oauthMocks.github);
oauthMocks.manager.addProvider('auth0', oauthMocks.auth0);

// Common test scenarios
export const OAuthScenarios = {
  /**
   * Successful OAuth flows
   */
  successful: {
    googleLogin: () => {
      const user = oauthMocks.google.addGoogleUser({
        id: '12345',
        email: 'user@gmail.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/avatar.jpg',
        verified_email: true
      });

      return oauthMocks.manager.simulateCompleteFlow('google', user.id);
    },

    githubLogin: () => {
      const user = oauthMocks.github.addGitHubUser({
        id: 54321,
        login: 'testuser',
        email: 'user@github.com',
        name: 'Test User',
        avatar_url: 'https://github.com/avatar.jpg',
        public_repos: 10
      });

      return oauthMocks.manager.simulateCompleteFlow('github', user.id);
    },

    auth0Login: () => {
      const user = oauthMocks.auth0.addAuth0User({
        sub: 'auth0|67890',
        email: 'user@auth0.com',
        name: 'Test User',
        email_verified: true,
        picture: 'https://auth0.com/avatar.jpg'
      });

      return oauthMocks.manager.simulateCompleteFlow('auth0', user.id);
    }
  },

  /**
   * Error scenarios
   */
  errors: {
    accessDenied: () => {
      try {
        oauthMocks.google.simulateError('access_denied');
      } catch (error) {
        return error;
      }
    },

    invalidRequest: () => {
      try {
        oauthMocks.github.simulateError('invalid_request', 'Missing client_id parameter');
      } catch (error) {
        return error;
      }
    },

    expiredCode: () => {
      // This would be tested by manipulating the authCode expiry
      return new Error('Authorization code expired');
    }
  }
};

export default OAuthMockProvider;