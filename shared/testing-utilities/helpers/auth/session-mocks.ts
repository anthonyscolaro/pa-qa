/**
 * Session Management Mocks and State Utilities
 * Provides comprehensive session mocking for React, FastAPI, and WordPress testing
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { User, AuthContext } from './auth-helpers';

export interface SessionData {
  id: string;
  userId: string;
  token?: string;
  refreshToken?: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  device?: DeviceInfo;
  metadata: Record<string, any>;
  isActive: boolean;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  browser: string;
  fingerprint: string;
}

export interface SessionConfig {
  maxAge: number; // milliseconds
  sliding: boolean; // extend session on activity
  maxConcurrentSessions: number;
  secureOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  path: string;
  httpOnly: boolean;
}

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, { value: string; expires?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.storage.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const item: { value: string; expires?: number } = { value };
    if (ttl) {
      item.expires = Date.now() + ttl;
    }
    this.storage.set(key, item);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.storage.get(key);
    if (!item) return false;
    
    if (item.expires && Date.now() > item.expires) {
      this.storage.delete(key);
      return false;
    }
    
    return true;
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

export class SessionManager extends EventEmitter {
  private config: SessionConfig;
  private storage: StorageAdapter;
  private sessions = new Map<string, SessionData>();
  private userSessions = new Map<string, Set<string>>(); // userId -> sessionIds
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<SessionConfig> = {}, storage?: StorageAdapter) {
    super();
    
    this.config = {
      maxAge: config.maxAge ?? 24 * 60 * 60 * 1000, // 24 hours
      sliding: config.sliding ?? true,
      maxConcurrentSessions: config.maxConcurrentSessions ?? 5,
      secureOnly: config.secureOnly ?? false,
      sameSite: config.sameSite ?? 'lax',
      path: config.path ?? '/',
      httpOnly: config.httpOnly ?? true,
      ...config
    };

    this.storage = storage ?? new MemoryStorageAdapter();
    this.startCleanupInterval();
  }

  /**
   * Create a new session
   */
  async createSession(
    user: User,
    options: {
      ipAddress?: string;
      userAgent?: string;
      device?: DeviceInfo;
      metadata?: Record<string, any>;
      token?: string;
      refreshToken?: string;
    } = {}
  ): Promise<SessionData> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    
    // Check concurrent session limit
    await this.enforceSessionLimit(user.id);
    
    const session: SessionData = {
      id: sessionId,
      userId: user.id,
      token: options.token,
      refreshToken: options.refreshToken,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.config.maxAge),
      ipAddress: options.ipAddress ?? '127.0.0.1',
      userAgent: options.userAgent ?? 'Test User Agent',
      device: options.device ?? this.generateDefaultDevice(),
      metadata: options.metadata ?? {},
      isActive: true
    };

    // Store session
    this.sessions.set(sessionId, session);
    await this.storage.set(`session:${sessionId}`, JSON.stringify(session));

    // Track user sessions
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set());
    }
    this.userSessions.get(user.id)!.add(sessionId);

    this.emit('sessionCreated', session);
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    // Try memory first
    let session = this.sessions.get(sessionId);
    
    // Fallback to storage
    if (!session) {
      const stored = await this.storage.get(`session:${sessionId}`);
      if (stored) {
        session = JSON.parse(stored);
        session!.createdAt = new Date(session!.createdAt);
        session!.lastActivity = new Date(session!.lastActivity);
        session!.expiresAt = new Date(session!.expiresAt);
        this.sessions.set(sessionId, session!);
      }
    }

    if (!session) return null;

    // Check if session is expired
    if (this.isExpired(session)) {
      await this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    const now = new Date();
    session.lastActivity = now;

    // Extend session if sliding expiration is enabled
    if (this.config.sliding) {
      session.expiresAt = new Date(now.getTime() + this.config.maxAge);
    }

    // Update storage
    this.sessions.set(sessionId, session);
    await this.storage.set(`session:${sessionId}`, JSON.stringify(session));

    this.emit('sessionActivity', session);
    return true;
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    
    // Remove from memory
    this.sessions.delete(sessionId);
    
    // Remove from storage
    await this.storage.delete(`session:${sessionId}`);

    // Remove from user sessions tracking
    if (session) {
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
      
      this.emit('sessionDestroyed', session);
    }

    return !!session;
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId: string): Promise<number> {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return 0;

    let destroyedCount = 0;
    for (const sessionId of sessionIds) {
      if (await this.destroySession(sessionId)) {
        destroyedCount++;
      }
    }

    this.emit('userSessionsDestroyed', { userId, count: destroyedCount });
    return destroyedCount;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];

    const sessions: SessionData[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<{ valid: boolean; session?: SessionData; reason?: string }> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (!session.isActive) {
      return { valid: false, session, reason: 'Session is inactive' };
    }

    if (this.isExpired(session)) {
      await this.destroySession(sessionId);
      return { valid: false, session, reason: 'Session expired' };
    }

    return { valid: true, session };
  }

  /**
   * Create session cookie
   */
  createSessionCookie(sessionId: string, options: Partial<{
    maxAge: number;
    domain: string;
    path: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  }> = {}): string {
    const cookieOptions = {
      maxAge: options.maxAge ?? this.config.maxAge,
      domain: options.domain ?? this.config.domain,
      path: options.path ?? this.config.path,
      secure: options.secure ?? this.config.secureOnly,
      httpOnly: options.httpOnly ?? this.config.httpOnly,
      sameSite: options.sameSite ?? this.config.sameSite
    };

    let cookie = `sessionId=${sessionId}`;
    
    if (cookieOptions.maxAge) {
      cookie += `; Max-Age=${Math.floor(cookieOptions.maxAge / 1000)}`;
    }
    
    if (cookieOptions.domain) {
      cookie += `; Domain=${cookieOptions.domain}`;
    }
    
    if (cookieOptions.path) {
      cookie += `; Path=${cookieOptions.path}`;
    }
    
    if (cookieOptions.secure) {
      cookie += '; Secure';
    }
    
    if (cookieOptions.httpOnly) {
      cookie += '; HttpOnly';
    }
    
    if (cookieOptions.sameSite) {
      cookie += `; SameSite=${cookieOptions.sameSite}`;
    }

    return cookie;
  }

  /**
   * Parse session cookie
   */
  parseSessionCookie(cookieHeader: string): string | null {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'sessionId') {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Check if session is expired
   */
  private isExpired(session: SessionData): boolean {
    return Date.now() > session.expiresAt.getTime();
  }

  /**
   * Enforce session limit for user
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    
    if (sessions.length >= this.config.maxConcurrentSessions) {
      // Remove oldest sessions
      const sessionsToRemove = sessions
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
        .slice(0, sessions.length - this.config.maxConcurrentSessions + 1);

      for (const session of sessionsToRemove) {
        await this.destroySession(session.id);
      }
    }
  }

  /**
   * Generate default device info
   */
  private generateDefaultDevice(): DeviceInfo {
    return {
      type: 'desktop',
      os: 'Test OS',
      browser: 'Test Browser',
      fingerprint: crypto.randomBytes(16).toString('hex')
    };
  }

  /**
   * Start cleanup interval for expired sessions
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 60000); // Check every minute
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (this.isExpired(session)) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.destroySession(sessionId);
    }

    if (expiredSessions.length > 0) {
      this.emit('expiredSessionsCleanup', { count: expiredSessions.length });
    }
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    uniqueUsers: number;
    averageSessionAge: number;
  } {
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => !this.isExpired(session));
    
    const averageAge = activeSessions.length > 0
      ? activeSessions.reduce((sum, session) => 
          sum + (Date.now() - session.createdAt.getTime()), 0) / activeSessions.length
      : 0;

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      uniqueUsers: this.userSessions.size,
      averageSessionAge: averageAge
    };
  }

  /**
   * Reset all sessions (for testing)
   */
  async reset(): Promise<void> {
    this.sessions.clear();
    this.userSessions.clear();
    await this.storage.clear();
    this.emit('reset');
  }

  /**
   * Destroy the session manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.removeAllListeners();
  }
}

// React-specific session hooks simulation
export class ReactSessionState {
  private sessionManager: SessionManager;
  private currentSession: SessionData | null = null;
  private listeners = new Set<(session: SessionData | null) => void>();

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: (session: SessionData | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Set current session
   */
  async setSession(sessionId: string | null): Promise<void> {
    if (!sessionId) {
      this.currentSession = null;
    } else {
      this.currentSession = await this.sessionManager.getSession(sessionId);
    }
    
    this.notifyListeners();
  }

  /**
   * Update session activity
   */
  async updateActivity(): Promise<void> {
    if (this.currentSession) {
      await this.sessionManager.updateActivity(this.currentSession.id);
      this.currentSession = await this.sessionManager.getSession(this.currentSession.id);
      this.notifyListeners();
    }
  }

  /**
   * Clear session
   */
  async clearSession(): Promise<void> {
    if (this.currentSession) {
      await this.sessionManager.destroySession(this.currentSession.id);
      this.currentSession = null;
      this.notifyListeners();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentSession.isActive;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentSession));
  }
}

// WordPress-specific session utilities
export class WordPressSessionMock {
  private sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Create WordPress session with auth cookies
   */
  async createWPSession(
    user: { ID: number; user_login: string; user_email: string },
    options: { remember?: boolean; secure?: boolean } = {}
  ): Promise<{ session: SessionData; authCookie: string; loggedInCookie: string }> {
    const session = await this.sessionManager.createSession({
      id: user.ID.toString(),
      email: user.user_email,
      username: user.user_login,
      roles: ['subscriber'],
      permissions: ['read'],
      isActive: true,
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      metadata: { 
        wpUser: user,
        remember: options.remember ?? false
      }
    });

    // Generate WordPress-style auth cookies
    const expiration = options.remember ? 
      Date.now() + (14 * 24 * 60 * 60 * 1000) : // 14 days
      Date.now() + (2 * 24 * 60 * 60 * 1000);   // 2 days

    const authCookie = this.generateWPAuthCookie(user, expiration, 'auth');
    const loggedInCookie = this.generateWPAuthCookie(user, expiration, 'logged_in');

    return { session, authCookie, loggedInCookie };
  }

  /**
   * Generate WordPress-style auth cookie
   */
  private generateWPAuthCookie(
    user: { ID: number; user_login: string },
    expiration: number,
    scheme: 'auth' | 'logged_in'
  ): string {
    const username = user.user_login;
    const token = crypto.randomBytes(20).toString('hex');
    const hash = crypto.createHash('sha256')
      .update(`${username}|${expiration}|${token}|${scheme}`)
      .digest('hex');

    return `${username}|${expiration}|${token}|${hash}`;
  }

  /**
   * Parse WordPress auth cookie
   */
  parseWPAuthCookie(cookie: string): {
    username: string;
    expiration: number;
    token: string;
    hash: string;
  } | null {
    const parts = cookie.split('|');
    if (parts.length !== 4) return null;

    return {
      username: parts[0],
      expiration: parseInt(parts[1]),
      token: parts[2],
      hash: parts[3]
    };
  }
}

// Default instances for testing
export const sessionManager = new SessionManager();
export const reactSessionState = new ReactSessionState(sessionManager);
export const wpSessionMock = new WordPressSessionMock(sessionManager);

// Common test scenarios
export const SessionScenarios = {
  /**
   * Valid session scenarios
   */
  valid: {
    freshSession: async (user: User) => {
      return await sessionManager.createSession(user);
    },

    activeSession: async (user: User) => {
      const session = await sessionManager.createSession(user);
      await sessionManager.updateActivity(session.id);
      return session;
    },

    rememberedSession: async (user: User) => {
      return await sessionManager.createSession(user, {
        metadata: { remember: true }
      });
    },

    mobileSession: async (user: User) => {
      return await sessionManager.createSession(user, {
        device: {
          type: 'mobile',
          os: 'iOS 15',
          browser: 'Safari',
          fingerprint: crypto.randomBytes(16).toString('hex')
        },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
      });
    }
  },

  /**
   * Invalid session scenarios
   */
  invalid: {
    expiredSession: async (user: User) => {
      const session = await sessionManager.createSession(user);
      // Manually expire the session
      session.expiresAt = new Date(Date.now() - 1000);
      return session;
    },

    inactiveSession: async (user: User) => {
      const session = await sessionManager.createSession(user);
      session.isActive = false;
      return session;
    },

    corruptedSession: () => {
      return {
        id: 'corrupted-session-id',
        userId: 'invalid-user',
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(),
        ipAddress: '0.0.0.0',
        userAgent: 'Invalid',
        metadata: {},
        isActive: true
      } as SessionData;
    }
  },

  /**
   * Edge case scenarios
   */
  edge: {
    concurrentSessions: async (user: User, count: number = 3) => {
      const sessions: SessionData[] = [];
      for (let i = 0; i < count; i++) {
        const session = await sessionManager.createSession(user, {
          ipAddress: `192.168.1.${i + 1}`,
          userAgent: `Test Client ${i + 1}`
        });
        sessions.push(session);
      }
      return sessions;
    },

    sessionWithManyUpdates: async (user: User) => {
      const session = await sessionManager.createSession(user);
      // Simulate multiple activity updates
      for (let i = 0; i < 10; i++) {
        await sessionManager.updateActivity(session.id);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return await sessionManager.getSession(session.id);
    }
  }
};

export default SessionManager;