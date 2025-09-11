# Authentication Testing Utilities

Comprehensive authentication testing utilities for the PA-QA framework supporting React, FastAPI, and WordPress projects. These utilities provide everything needed to test authentication flows, user management, session handling, and security features across multiple frameworks.

## 🚀 Quick Start

```typescript
// TypeScript/React
import { authHelper, UserTypes, JwtPatterns } from './auth-helpers';

// Create test user and authentication context
const user = UserTypes.basicUser();
const authContext = authHelper.createAuthenticatedState(user);
const token = JwtPatterns.userToken(user.id);
```

```python
# Python/FastAPI
from auth_helpers import auth_helper, UserTypes, create_authenticated_context

# Create test user and context
user = auth_helper.create_user(email="test@example.com", password="password123")
context = create_authenticated_context("basic_user")
token = auth_helper.create_access_token({"sub": user.id})
```

```php
// PHP/WordPress
require_once 'auth-helpers.php';

// Create WordPress test user
$user = create_user_with_role('subscriber');
$session = simulate_user_login($user);
$nonce = generate_wp_nonce('test_action');
```

## 📁 File Structure

```
auth/
├── auth-helpers.ts          # General TypeScript auth utilities
├── jwt-utils.ts            # JWT token management
├── oauth-mocks.ts          # OAuth2 provider mocks
├── user-factories.ts       # User data factories
├── session-mocks.ts        # Session management
├── auth-helpers.php        # WordPress auth utilities
├── auth_helpers.py         # FastAPI auth utilities
└── README.md              # This documentation
```

## 🔧 Core Components

### 1. General Auth Helpers (`auth-helpers.ts`)

Framework-agnostic authentication utilities with password hashing, MFA support, and role-based access control.

#### Key Features
- Password hashing and verification (PBKDF2)
- MFA (TOTP) generation and validation
- Role and permission management
- Session ID generation
- API key generation
- Reset token handling

#### Basic Usage

```typescript
import { authHelper, AuthScenarios } from './auth-helpers';

// Hash password
const { hash, salt } = await authHelper.hashPassword('password123');

// Generate MFA token
const secret = authHelper.generateMfaSecret();
const token = authHelper.generateMfaToken(secret);
const isValid = authHelper.verifyMfaToken(token, secret);

// Check permissions
const user = AuthScenarios.validAuth.adminUser();
const canDelete = authHelper.hasPermission(user.user, 'delete');
const isAdmin = authHelper.hasRole(user.user, 'admin');

// Create auth headers
const headers = authHelper.createAuthHeaders('bearer-token', 'Bearer');
```

### 2. JWT Token Management (`jwt-utils.ts`)

Comprehensive JWT token creation, validation, and testing utilities supporting HS256/384/512 and RS256/384/512 algorithms.

#### Key Features
- JWT token generation with custom claims
- Token validation and verification
- Access, refresh, and ID token patterns
- Malformed token generation for testing
- Token expiration checking

#### Usage Examples

```typescript
import { jwtUtils, JwtPatterns } from './jwt-utils';

// Generate tokens
const accessToken = jwtUtils.generateAccessToken('user-123', {
  email: 'user@test.com',
  roles: ['user'],
  permissions: ['read', 'write']
});

const refreshToken = jwtUtils.generateRefreshToken('user-123');
const idToken = jwtUtils.generateIdToken('user-123', {
  email: 'user@test.com',
  name: 'Test User'
});

// Verify tokens
const { valid, payload, error } = jwtUtils.verifyToken(accessToken);

// Test scenarios
const scenarios = jwtUtils.createTestScenarios();
const expiredToken = scenarios.invalid.expired();
const malformedToken = scenarios.invalid.malformed();

// Quick patterns
const adminToken = JwtPatterns.adminToken('admin-123');
const serviceToken = JwtPatterns.serviceToken('api-service', ['read', 'write']);
```

### 3. OAuth2 Provider Mocks (`oauth-mocks.ts`)

Mock implementations for popular OAuth2 providers including Google, GitHub, and Auth0.

#### Supported Providers
- Google OAuth2 with OpenID Connect
- GitHub OAuth2
- Auth0 with OIDC
- Generic OAuth2 provider

#### Usage Examples

```typescript
import { oauthMocks, OAuthScenarios } from './oauth-mocks';

// Add test users to providers
const googleUser = oauthMocks.google.addGoogleUser({
  id: '12345',
  email: 'user@gmail.com',
  name: 'Test User',
  verified_email: true
});

const githubUser = oauthMocks.github.addGitHubUser({
  id: 54321,
  login: 'testuser',
  email: 'user@github.com',
  name: 'Test User'
});

// Simulate complete OAuth flow
const flow = oauthMocks.manager.simulateCompleteFlow('google', googleUser.id, {
  scopes: ['openid', 'email', 'profile']
});

console.log('Auth URL:', flow.authUrl);
console.log('Access Token:', flow.tokens.access_token);
console.log('User Info:', flow.user);

// Test scenarios
const googleLogin = OAuthScenarios.successful.googleLogin();
const githubLogin = OAuthScenarios.successful.githubLogin();
const accessDenied = OAuthScenarios.errors.accessDenied();
```

### 4. User Factories (`user-factories.ts`)

Realistic user data generation with role-based permissions and comprehensive user profiles.

#### Key Features
- Role-based user generation
- Realistic fake data using Faker.js
- User hierarchies and batch creation
- User validation helpers
- Custom user scenarios

#### Usage Examples

```typescript
import { userFactory, UserTypes, UserValidation } from './user-factories';

// Create individual users
const basicUser = UserTypes.basicUser();
const adminUser = UserTypes.adminUser();
const premiumUser = UserTypes.premiumUser();

// Create user with specific role
const moderator = userFactory.createUserWithRole('moderator', {
  email: 'mod@test.com',
  mfaEnabled: true
});

// Create user hierarchy
const hierarchy = UserTypes.hierarchy();
console.log('Admin:', hierarchy.admin);
console.log('Moderators:', hierarchy.moderators);
console.log('Users:', hierarchy.users);

// Batch creation for load testing
const loadTestUsers = userFactory.createUserBatch(1000, {
  roleDistribution: { user: 0.8, moderator: 0.15, admin: 0.05 },
  emailDomains: ['test.com', 'example.org'],
  activePercentage: 0.95
});

// User validation
const isValid = UserValidation.isValid(basicUser);
const hasPermission = UserValidation.hasPermission(basicUser, 'read');
const displayName = UserValidation.getDisplayName(basicUser);
```

### 5. Session Management (`session-mocks.ts`)

Comprehensive session management with storage adapters, device tracking, and framework-specific implementations.

#### Key Features
- Configurable session lifecycle
- Device fingerprinting
- Concurrent session limits
- Storage adapters (memory, custom)
- React and WordPress specific utilities

#### Usage Examples

```typescript
import { sessionManager, SessionScenarios, ReactSessionState } from './session-mocks';

// Create session
const user = UserTypes.basicUser();
const session = await sessionManager.createSession(user, {
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  metadata: { loginMethod: 'password' }
});

// Validate session
const { valid, reason } = await sessionManager.validateSession(session.id);

// React session state
const reactSession = new ReactSessionState(sessionManager);
await reactSession.setSession(session.id);
const isAuthenticated = reactSession.isAuthenticated();

// Session scenarios
const activeSession = await SessionScenarios.valid.activeSession(user);
const expiredSession = await SessionScenarios.invalid.expiredSession(user);
const mobileSession = await SessionScenarios.valid.mobileSession(user);

// WordPress sessions
import { wpSessionMock } from './session-mocks';
const wpUser = { ID: 123, user_login: 'testuser', user_email: 'user@test.com' };
const { session: wpSession, authCookie } = await wpSessionMock.createWPSession(wpUser);
```

### 6. WordPress Auth Helpers (`auth-helpers.php`)

WordPress-specific authentication utilities with nonce generation, user roles, and multisite support.

#### Key Features
- WordPress password hashing
- Nonce generation and verification
- User capability checking
- Authentication cookies
- Multisite scenarios
- REST API and AJAX nonce support

#### Usage Examples

```php
// Create test users
$subscriber = create_user_with_role('subscriber');
$admin = create_user_with_role('administrator', [
    'user_email' => 'admin@test.com',
    'first_name' => 'Admin',
    'last_name' => 'User'
]);

// Check capabilities
$canEdit = $wpAuthHelper->userCan($admin, 'edit_posts'); // true
$canManage = $wpAuthHelper->userCan($subscriber, 'manage_options'); // false

// Generate nonces
$actionNonce = generate_wp_nonce('delete_post');
$restNonce = $wpAuthHelper->generateRestNonce();
$ajaxNonce = $wpAuthHelper->generateAjaxNonce('my_ajax_action');

// Simulate login
$loginResult = simulate_user_login($admin);
echo $loginResult['auth_cookie']; // WordPress auth cookie

// Multisite scenario
$multisite = $wpAuthHelper->createMultisiteScenario();
$networkAdmin = $multisite['network_admin'];
$siteAdmins = $multisite['site_admins'];
```

### 7. FastAPI Auth Helpers (`auth_helpers.py`)

Async-first authentication utilities for FastAPI with comprehensive JWT support and role management.

#### Key Features
- Async authentication methods
- bcrypt password hashing
- TOTP MFA support
- JWT token management (jose library)
- Session and API key management
- Comprehensive user model with dataclasses

#### Usage Examples

```python
import asyncio
from auth_helpers import FastAPIAuthTestHelper, auth_scenarios

# Initialize helper
auth_helper = FastAPIAuthTestHelper()

# Create users
user = auth_helper.create_user(
    email="test@example.com",
    password="password123",
    roles=["user"],
    first_name="Test",
    last_name="User"
)

admin = auth_helper.create_user(
    email="admin@example.com", 
    password="admin123",
    roles=["admin"]
)

# Authenticate user
authenticated_user = auth_helper.authenticate_user("test@example.com", "password123")

# Create tokens
access_token = auth_helper.create_access_token({
    "sub": user.id,
    "email": user.email,
    "roles": user.roles
})

refresh_token = auth_helper.create_refresh_token(user.id)
id_token = auth_helper.create_id_token(user)

# Verify tokens
payload = auth_helper.verify_token(access_token)

# Async operations
async def test_async_auth():
    helper = AsyncAuthHelper(auth_helper)
    user = await helper.authenticate_user_async("test@example.com", "password123")
    mfa_valid = await helper.verify_mfa_async(user, "123456")

# Test scenarios
scenarios = auth_scenarios.create_valid_users()
basic_user = scenarios["basic_user"]
admin_user = scenarios["admin_user"]
mfa_user = scenarios["mfa_user"]
```

## 🧪 Testing Patterns

### Authentication Flow Testing

```typescript
// Complete login flow test
describe('Authentication Flow', () => {
  test('should authenticate user with valid credentials', async () => {
    const user = UserTypes.basicUser();
    const context = authHelper.createAuthenticatedState(user);
    
    expect(context.isAuthenticated).toBe(true);
    expect(context.user?.email).toBe(user.email);
    expect(context.token).toBeDefined();
  });

  test('should handle MFA authentication', async () => {
    const user = UserTypes.mfaUser();
    const secret = authHelper.generateMfaSecret();
    const token = authHelper.generateMfaToken(secret);
    
    const isValid = authHelper.verifyMfaToken(token, secret);
    expect(isValid).toBe(true);
  });
});
```

### JWT Token Testing

```typescript
describe('JWT Token Management', () => {
  test('should create and verify valid tokens', () => {
    const user = UserTypes.basicUser();
    const token = JwtPatterns.userToken(user.id, { 
      email: user.email,
      roles: user.roles 
    });
    
    const { valid, payload } = jwtUtils.verifyToken(token);
    expect(valid).toBe(true);
    expect(payload?.sub).toBe(user.id);
  });

  test('should reject expired tokens', () => {
    const expiredToken = jwtUtils.generateExpiredToken({ sub: 'user-123' });
    const { valid, error } = jwtUtils.verifyToken(expiredToken);
    
    expect(valid).toBe(false);
    expect(error).toBe('Token expired');
  });
});
```

### OAuth2 Flow Testing

```typescript
describe('OAuth2 Authentication', () => {
  test('should simulate Google OAuth flow', async () => {
    const user = oauthMocks.google.addGoogleUser({
      id: '12345',
      email: 'user@gmail.com',
      name: 'Test User'
    });

    const flow = oauthMocks.manager.simulateCompleteFlow('google', user.id);
    
    expect(flow.tokens.access_token).toBeDefined();
    expect(flow.user.email).toBe('user@gmail.com');
    expect(flow.tokens.id_token).toBeDefined(); // OIDC token
  });
});
```

### Session Management Testing

```typescript
describe('Session Management', () => {
  test('should create and validate sessions', async () => {
    const user = UserTypes.basicUser();
    const session = await sessionManager.createSession(user);
    
    const { valid } = await sessionManager.validateSession(session.id);
    expect(valid).toBe(true);
  });

  test('should handle session expiration', async () => {
    const user = UserTypes.basicUser();
    const session = await SessionScenarios.invalid.expiredSession(user);
    
    const { valid, reason } = await sessionManager.validateSession(session.id);
    expect(valid).toBe(false);
    expect(reason).toBe('Session expired');
  });
});
```

### WordPress Testing

```php
class WPAuthTest extends WP_UnitTestCase {
    public function test_user_capabilities() {
        $admin = create_user_with_role('administrator');
        $subscriber = create_user_with_role('subscriber');
        
        $this->assertTrue($wpAuthHelper->userCan($admin, 'manage_options'));
        $this->assertFalse($wpAuthHelper->userCan($subscriber, 'manage_options'));
    }

    public function test_nonce_generation() {
        $nonce = generate_wp_nonce('test_action');
        $this->assertNotEmpty($nonce);
        
        $isValid = $wpAuthHelper->verifyNonce($nonce, 'test_action');
        $this->assertTrue($isValid);
    }
}
```

### FastAPI Testing

```python
import pytest
from auth_helpers import auth_helper

@pytest.mark.asyncio
async def test_user_authentication():
    # Create test user
    user = auth_helper.create_user(
        email="test@example.com",
        password="password123"
    )
    
    # Test authentication
    authenticated = auth_helper.authenticate_user("test@example.com", "password123")
    assert authenticated is not None
    assert authenticated.email == "test@example.com"

@pytest.mark.asyncio 
async def test_jwt_token_creation():
    user = auth_helper.create_user(email="test@example.com", password="password123")
    
    token = auth_helper.create_access_token({
        "sub": user.id,
        "email": user.email
    })
    
    payload = auth_helper.verify_token(token)
    assert payload["sub"] == user.id
```

## 🔒 Security Features

### Password Security
- PBKDF2 hashing (TypeScript/PHP)
- bcrypt hashing (Python)
- Salt generation and verification
- Password complexity validation helpers

### MFA Support
- TOTP (Time-based One-Time Password)
- Secret key generation
- Token validation with time windows
- Backup code simulation

### Token Security
- JWT with configurable algorithms
- Token expiration and refresh
- Secure random token generation
- Token blacklisting simulation

### Session Security
- Secure session cookies
- Session hijacking prevention
- Concurrent session limits
- Activity tracking and timeouts

## 🛠️ Configuration

### Environment Setup

```typescript
// TypeScript configuration
const authHelper = new AuthTestHelper({
  secret: process.env.AUTH_SECRET || 'test-secret',
  tokenExpiry: 3600,
  sessionExpiry: 86400,
  enableMfa: true
});

const jwtUtils = new JwtTestUtils({
  secret: process.env.JWT_SECRET || 'jwt-secret',
  algorithm: 'HS256',
  issuer: 'test-app',
  audience: 'test-users'
});
```

```python
# Python configuration
auth_helper = FastAPIAuthTestHelper(
    secret_key=os.getenv("AUTH_SECRET", "test-secret"),
    algorithm="HS256",
    access_token_expire_minutes=60,
    refresh_token_expire_days=7
)
```

```php
// PHP configuration
$wpAuthHelper = new WPAuthTestHelper([
    'secret' => $_ENV['WP_AUTH_SECRET'] ?? 'wp-test-secret',
    'token_expiry' => 3600,
    'session_expiry' => 86400,
    'enable_mfa' => false
]);
```

### Session Configuration

```typescript
const sessionManager = new SessionManager({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sliding: true,
  maxConcurrentSessions: 5,
  secureOnly: false, // Set to true in production
  sameSite: 'lax'
}, new MemoryStorageAdapter());
```

## 📚 Advanced Usage

### Custom User Roles

```typescript
// Add custom role permissions
userFactory.setRolePermissions('custom_role', [
  'custom_read',
  'custom_write',
  'special_access'
]);

const customUser = userFactory.createUserWithRole('custom_role');
```

### Custom OAuth Provider

```typescript
const customProvider = new GenericOAuth2Mock({
  name: 'custom',
  clientId: 'custom-client-id',
  clientSecret: 'custom-secret',
  authUrl: 'https://auth.custom.com/oauth2/authorize',
  tokenUrl: 'https://auth.custom.com/oauth2/token',
  userInfoUrl: 'https://api.custom.com/user',
  scopes: ['read', 'write'],
  redirectUri: 'http://localhost:3000/auth/callback'
});

oauthMocks.manager.addProvider('custom', customProvider);
```

### Custom Storage Adapter

```typescript
class RedisStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    // Redis implementation
  }
  
  async set(key: string, value: string, ttl?: number): Promise<void> {
    // Redis implementation
  }
  
  // ... other methods
}

const sessionManager = new SessionManager({}, new RedisStorageAdapter());
```

## 🚨 Common Pitfalls

1. **Token Expiration**: Always test with both valid and expired tokens
2. **MFA Timing**: TOTP tokens are time-sensitive, use proper time windows
3. **Session Cleanup**: Remember to reset test data between tests
4. **Role Hierarchies**: Admin roles inherit permissions from lower roles
5. **OAuth State**: Always validate OAuth state parameters in production

## 🔧 Troubleshooting

### Token Validation Issues
```typescript
// Debug token validation
const token = "your-token-here";
const decoded = jwtUtils.decodePayload(token);
console.log('Token payload:', decoded);

const { valid, error } = jwtUtils.verifyToken(token);
console.log('Validation result:', { valid, error });
```

### Session Problems
```typescript
// Debug session state
const stats = sessionManager.getStats();
console.log('Session stats:', stats);

const session = await sessionManager.getSession('session-id');
console.log('Session data:', session);
```

### User Factory Issues
```typescript
// Check factory state
const stats = userFactory.getStats();
console.log('Factory stats:', stats);

// Reset if needed
userFactory.reset();
```

## 📦 Dependencies

### TypeScript/JavaScript
- `crypto` (Node.js built-in)
- `@faker-js/faker` (user data generation)
- `events` (Node.js built-in)

### Python
- `bcrypt` (password hashing)
- `pyotp` (TOTP/MFA)
- `python-jose` (JWT tokens)
- `passlib` (password context)

### PHP
- No external dependencies (uses built-in functions)
- Compatible with WordPress 5.0+

## 🤝 Contributing

When adding new authentication utilities:

1. Follow the existing patterns and interfaces
2. Include comprehensive test scenarios
3. Add TypeScript definitions where applicable
4. Update this documentation
5. Ensure framework compatibility

## 📄 License

Part of the PA-QA testing framework. Use according to your project's license terms.

---

**Need help?** Check the individual file headers for more specific documentation, or refer to the test files in the project-types directories for real-world usage examples.