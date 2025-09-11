/**
 * User Factory Functions for Testing
 * Provides comprehensive user data generation with role-based access and realistic test data
 */

import { faker } from '@faker-js/faker';
import crypto from 'crypto';
import { User } from './auth-helpers';
import { authHelper } from './auth-helpers';

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
  isActive?: boolean;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
  overrides?: Partial<User>;
}

export interface UserProfile {
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  dateOfBirth?: Date;
  avatar?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface UserStats {
  loginCount: number;
  lastLogin?: Date;
  lastActive?: Date;
  failedLoginAttempts: number;
  passwordChangedAt?: Date;
  accountLockedUntil?: Date;
  sessionCount: number;
}

export interface FullUser extends User {
  profile?: UserProfile;
  stats?: UserStats;
  password?: string;
  passwordSalt?: string;
  mfaSecret?: string;
  apiKeys?: string[];
  sessions?: string[];
}

export class UserFactory {
  private static instance: UserFactory;
  private rolePermissionMap: Map<string, string[]> = new Map();
  private usedEmails: Set<string> = new Set();
  private usedUsernames: Set<string> = new Set();

  constructor() {
    this.initializeRolePermissions();
  }

  static getInstance(): UserFactory {
    if (!UserFactory.instance) {
      UserFactory.instance = new UserFactory();
    }
    return UserFactory.instance;
  }

  /**
   * Initialize default role-permission mappings
   */
  private initializeRolePermissions(): void {
    this.rolePermissionMap.set('guest', ['read_public']);
    this.rolePermissionMap.set('user', ['read', 'write_own', 'update_own', 'delete_own']);
    this.rolePermissionMap.set('premium_user', ['read', 'write_own', 'update_own', 'delete_own', 'access_premium']);
    this.rolePermissionMap.set('moderator', ['read', 'write', 'update_own', 'delete_own', 'moderate_content', 'ban_user']);
    this.rolePermissionMap.set('editor', ['read', 'write', 'update', 'delete_own', 'publish_content', 'edit_content']);
    this.rolePermissionMap.set('admin', ['*']);
    this.rolePermissionMap.set('super_admin', ['*', 'system_admin', 'user_admin']);
    this.rolePermissionMap.set('api_user', ['api_read', 'api_write']);
    this.rolePermissionMap.set('service_account', ['service_api', 'automated_actions']);
  }

  /**
   * Add or update role permissions
   */
  setRolePermissions(role: string, permissions: string[]): void {
    this.rolePermissionMap.set(role, permissions);
  }

  /**
   * Get permissions for a role
   */
  getRolePermissions(role: string): string[] {
    return this.rolePermissionMap.get(role) || [];
  }

  /**
   * Generate unique email
   */
  private generateUniqueEmail(): string {
    let email: string;
    do {
      email = faker.internet.email().toLowerCase();
    } while (this.usedEmails.has(email));
    
    this.usedEmails.add(email);
    return email;
  }

  /**
   * Generate unique username
   */
  private generateUniqueUsername(): string {
    let username: string;
    do {
      username = faker.internet.userName().toLowerCase();
    } while (this.usedUsernames.has(username));
    
    this.usedUsernames.add(username);
    return username;
  }

  /**
   * Create basic user
   */
  createUser(options: UserFactoryOptions = {}): User {
    const firstName = options.firstName || faker.person.firstName();
    const lastName = options.lastName || faker.person.lastName();
    const roles = options.roles || ['user'];
    const permissions = options.permissions || this.getPermissionsForRoles(roles);

    const user: User = {
      id: options.id || crypto.randomUUID(),
      email: options.email || this.generateUniqueEmail(),
      username: options.username || this.generateUniqueUsername(),
      firstName,
      lastName,
      roles,
      permissions,
      isActive: options.isActive !== undefined ? options.isActive : true,
      emailVerified: options.emailVerified !== undefined ? options.emailVerified : true,
      mfaEnabled: options.mfaEnabled !== undefined ? options.mfaEnabled : false,
      createdAt: options.createdAt || faker.date.past({ years: 2 }),
      updatedAt: options.updatedAt || faker.date.recent(),
      metadata: options.metadata || {},
      ...options.overrides
    };

    return user;
  }

  /**
   * Create full user with profile and stats
   */
  createFullUser(options: UserFactoryOptions = {}): FullUser {
    const user = this.createUser(options);
    const password = faker.internet.password();
    const { hash, salt } = authHelper.hashPassword(password);

    const fullUser: FullUser = {
      ...user,
      password: hash,
      passwordSalt: salt,
      mfaSecret: user.mfaEnabled ? authHelper.generateMfaSecret() : undefined,
      profile: this.createUserProfile(),
      stats: this.createUserStats(),
      apiKeys: [],
      sessions: []
    };

    return fullUser;
  }

  /**
   * Create user profile
   */
  private createUserProfile(): UserProfile {
    return {
      bio: faker.lorem.sentence(),
      website: faker.internet.url(),
      location: faker.location.city(),
      phone: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      avatar: faker.image.avatar(),
      timezone: faker.location.timeZone(),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'it']),
      theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
      notifications: {
        email: faker.datatype.boolean(),
        push: faker.datatype.boolean(),
        sms: faker.datatype.boolean()
      }
    };
  }

  /**
   * Create user statistics
   */
  private createUserStats(): UserStats {
    const loginCount = faker.number.int({ min: 0, max: 1000 });
    const lastLogin = loginCount > 0 ? faker.date.recent() : undefined;

    return {
      loginCount,
      lastLogin,
      lastActive: lastLogin ? faker.date.between({ from: lastLogin, to: new Date() }) : undefined,
      failedLoginAttempts: faker.number.int({ min: 0, max: 3 }),
      passwordChangedAt: faker.date.past({ years: 1 }),
      sessionCount: faker.number.int({ min: 0, max: 5 })
    };
  }

  /**
   * Get permissions for multiple roles
   */
  private getPermissionsForRoles(roles: string[]): string[] {
    const permissions = new Set<string>();
    
    roles.forEach(role => {
      const rolePermissions = this.getRolePermissions(role);
      rolePermissions.forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
  }

  /**
   * Create user with specific role
   */
  createUserWithRole(role: string, options: Omit<UserFactoryOptions, 'roles' | 'permissions'> = {}): User {
    return this.createUser({
      ...options,
      roles: [role],
      permissions: this.getRolePermissions(role)
    });
  }

  /**
   * Create multiple users
   */
  createUsers(count: number, options: UserFactoryOptions = {}): User[] {
    return Array.from({ length: count }, () => this.createUser(options));
  }

  /**
   * Create user hierarchy (admin, moderators, users)
   */
  createUserHierarchy(): {
    admin: User;
    moderators: User[];
    editors: User[];
    users: User[];
    guests: User[];
  } {
    return {
      admin: this.createUserWithRole('admin'),
      moderators: this.createUsers(2, { roles: ['moderator'] }),
      editors: this.createUsers(3, { roles: ['editor'] }),
      users: this.createUsers(10, { roles: ['user'] }),
      guests: this.createUsers(5, { roles: ['guest'] })
    };
  }

  /**
   * Create user with specific email domain
   */
  createUserWithEmailDomain(domain: string, options: UserFactoryOptions = {}): User {
    const username = faker.internet.userName().toLowerCase();
    const email = `${username}@${domain}`;
    
    return this.createUser({
      ...options,
      email,
      username
    });
  }

  /**
   * Create inactive user
   */
  createInactiveUser(options: UserFactoryOptions = {}): User {
    return this.createUser({
      ...options,
      isActive: false,
      emailVerified: false
    });
  }

  /**
   * Create user with MFA enabled
   */
  createMfaUser(options: UserFactoryOptions = {}): FullUser {
    const user = this.createFullUser({
      ...options,
      mfaEnabled: true
    });

    user.mfaSecret = authHelper.generateMfaSecret();
    return user;
  }

  /**
   * Create API service user
   */
  createServiceUser(serviceName: string, options: UserFactoryOptions = {}): User {
    return this.createUser({
      ...options,
      username: `service_${serviceName}`,
      email: `${serviceName}@services.test.com`,
      roles: ['service_account'],
      permissions: this.getRolePermissions('service_account'),
      emailVerified: true,
      mfaEnabled: false,
      metadata: {
        serviceType: 'api',
        serviceName,
        automatedAccount: true
      }
    });
  }

  /**
   * Create test user for specific scenario
   */
  createTestScenarioUser(scenario: string): User {
    const scenarios: Record<string, UserFactoryOptions> = {
      'new_user': {
        emailVerified: false,
        mfaEnabled: false,
        roles: ['guest'],
        metadata: { registrationStep: 'email_verification' }
      },
      'premium_user': {
        roles: ['premium_user'],
        emailVerified: true,
        metadata: { subscriptionType: 'premium', subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
      },
      'suspended_user': {
        isActive: false,
        metadata: { suspendedReason: 'policy_violation', suspendedAt: new Date() }
      },
      'password_reset_user': {
        metadata: { passwordResetRequired: true, passwordResetToken: crypto.randomBytes(32).toString('hex') }
      },
      'legacy_user': {
        emailVerified: true,
        metadata: { migrated: true, legacyId: faker.number.int({ min: 1000, max: 9999 }).toString() }
      }
    };

    const scenarioOptions = scenarios[scenario] || {};
    return this.createUser(scenarioOptions);
  }

  /**
   * Create user batch for load testing
   */
  createUserBatch(count: number, batchConfig: {
    roleDistribution?: Record<string, number>;
    emailDomains?: string[];
    activePercentage?: number;
  } = {}): User[] {
    const {
      roleDistribution = { user: 0.7, moderator: 0.2, admin: 0.1 },
      emailDomains = ['test.com', 'example.com', 'demo.org'],
      activePercentage = 0.9
    } = batchConfig;

    const users: User[] = [];
    
    for (let i = 0; i < count; i++) {
      // Determine role based on distribution
      const roleRandom = Math.random();
      let role = 'user';
      let cumulative = 0;
      
      for (const [roleKey, percentage] of Object.entries(roleDistribution)) {
        cumulative += percentage;
        if (roleRandom <= cumulative) {
          role = roleKey;
          break;
        }
      }

      // Determine if user should be active
      const isActive = Math.random() < activePercentage;

      // Select email domain
      const domain = faker.helpers.arrayElement(emailDomains);

      const user = this.createUserWithEmailDomain(domain, {
        roles: [role],
        isActive,
        emailVerified: isActive,
        mfaEnabled: role === 'admin' || Math.random() < 0.1
      });

      users.push(user);
    }

    return users;
  }

  /**
   * Reset factory state (clear used emails/usernames)
   */
  reset(): void {
    this.usedEmails.clear();
    this.usedUsernames.clear();
  }

  /**
   * Get factory statistics
   */
  getStats(): {
    usedEmails: number;
    usedUsernames: number;
    configuredRoles: string[];
  } {
    return {
      usedEmails: this.usedEmails.size,
      usedUsernames: this.usedUsernames.size,
      configuredRoles: Array.from(this.rolePermissionMap.keys())
    };
  }
}

// Default factory instance
export const userFactory = UserFactory.getInstance();

// Predefined user types for common scenarios
export const UserTypes = {
  // Basic users
  basicUser: () => userFactory.createUser(),
  premiumUser: () => userFactory.createUserWithRole('premium_user'),
  guestUser: () => userFactory.createUserWithRole('guest'),

  // Staff users
  adminUser: () => userFactory.createUserWithRole('admin'),
  moderatorUser: () => userFactory.createUserWithRole('moderator'),
  editorUser: () => userFactory.createUserWithRole('editor'),

  // System users
  serviceUser: (name: string) => userFactory.createServiceUser(name),
  apiUser: () => userFactory.createUserWithRole('api_user'),

  // Special cases
  inactiveUser: () => userFactory.createInactiveUser(),
  unverifiedUser: () => userFactory.createUser({ emailVerified: false }),
  mfaUser: () => userFactory.createMfaUser(),
  suspendedUser: () => userFactory.createTestScenarioUser('suspended_user'),

  // Bulk creation
  userBatch: (count: number) => userFactory.createUsers(count),
  hierarchy: () => userFactory.createUserHierarchy(),
  loadTestUsers: (count: number) => userFactory.createUserBatch(count)
};

// User validation helpers
export const UserValidation = {
  /**
   * Validate user has required fields
   */
  isValid(user: User): boolean {
    return !!(
      user.id &&
      user.email &&
      user.roles &&
      user.permissions &&
      user.createdAt &&
      user.updatedAt
    );
  },

  /**
   * Check if user has specific permission
   */
  hasPermission(user: User, permission: string): boolean {
    return authHelper.hasPermission(user, permission);
  },

  /**
   * Check if user has specific role
   */
  hasRole(user: User, role: string): boolean {
    return authHelper.hasRole(user, role);
  },

  /**
   * Check if user is active and verified
   */
  isActiveAndVerified(user: User): boolean {
    return user.isActive && user.emailVerified;
  },

  /**
   * Get user display name
   */
  getDisplayName(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  }
};

export default UserFactory;