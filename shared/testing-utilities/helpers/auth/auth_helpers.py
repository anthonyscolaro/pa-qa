"""
FastAPI Authentication Testing Utilities
Provides comprehensive authentication helpers with async support for FastAPI testing
"""

import asyncio
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union, Tuple
from dataclasses import dataclass, field
from enum import Enum
import uuid
import base64

import bcrypt
import pyotp
from passlib.context import CryptContext
from jose import JWTError, jwt


class UserRole(Enum):
    """User roles enumeration"""
    GUEST = "guest"
    USER = "user"
    PREMIUM_USER = "premium_user"
    MODERATOR = "moderator"
    EDITOR = "editor"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    API_USER = "api_user"
    SERVICE_ACCOUNT = "service_account"


class TokenType(Enum):
    """Token types enumeration"""
    ACCESS = "access_token"
    REFRESH = "refresh_token"
    ID = "id_token"
    API_KEY = "api_key"
    SERVICE = "service_token"


@dataclass
class User:
    """User data model for testing"""
    id: str
    email: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    roles: List[str] = field(default_factory=lambda: ["user"])
    permissions: List[str] = field(default_factory=list)
    is_active: bool = True
    email_verified: bool = True
    mfa_enabled: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = field(default_factory=dict)
    password_hash: Optional[str] = None
    mfa_secret: Optional[str] = None

    def __post_init__(self):
        """Post-initialization processing"""
        if not self.permissions:
            self.permissions = self._get_permissions_for_roles()

    def _get_permissions_for_roles(self) -> List[str]:
        """Get permissions based on user roles"""
        role_permissions = {
            "guest": ["read_public"],
            "user": ["read", "write_own", "update_own", "delete_own"],
            "premium_user": ["read", "write_own", "update_own", "delete_own", "access_premium"],
            "moderator": ["read", "write", "update_own", "delete_own", "moderate_content", "ban_user"],
            "editor": ["read", "write", "update", "delete_own", "publish_content", "edit_content"],
            "admin": ["*"],
            "super_admin": ["*", "system_admin", "user_admin"],
            "api_user": ["api_read", "api_write"],
            "service_account": ["service_api", "automated_actions"]
        }
        
        permissions = set()
        for role in self.roles:
            permissions.update(role_permissions.get(role, []))
        
        return list(permissions)

    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission"""
        return permission in self.permissions or "*" in self.permissions

    def has_role(self, role: str) -> bool:
        """Check if user has specific role"""
        return role in self.roles or "admin" in self.roles or "super_admin" in self.roles

    def has_any_role(self, roles: List[str]) -> bool:
        """Check if user has any of the specified roles"""
        return any(self.has_role(role) for role in roles)

    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary"""
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "roles": self.roles,
            "permissions": self.permissions,
            "is_active": self.is_active,
            "email_verified": self.email_verified,
            "mfa_enabled": self.mfa_enabled,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "metadata": self.metadata
        }


@dataclass
class AuthContext:
    """Authentication context for testing"""
    user: Optional[User] = None
    token: Optional[str] = None
    refresh_token: Optional[str] = None
    session_id: Optional[str] = None
    is_authenticated: bool = False
    permissions: List[str] = field(default_factory=list)
    roles: List[str] = field(default_factory=list)
    expires_at: Optional[datetime] = None

    def __post_init__(self):
        """Post-initialization processing"""
        if self.user:
            self.is_authenticated = True
            self.permissions = self.user.permissions
            self.roles = self.user.roles


class FastAPIAuthTestHelper:
    """Main authentication testing helper for FastAPI"""

    def __init__(self, 
                 secret_key: str = "test-secret-key-for-testing-only",
                 algorithm: str = "HS256",
                 access_token_expire_minutes: int = 60,
                 refresh_token_expire_days: int = 7):
        """Initialize the auth helper"""
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days
        
        # Password hashing context
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Storage for testing
        self.users: Dict[str, User] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.refresh_tokens: Dict[str, Dict[str, Any]] = {}
        self.api_keys: Dict[str, Dict[str, Any]] = {}

    # Password utilities
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return self.pwd_context.verify(plain_password, hashed_password)

    # MFA utilities
    def generate_mfa_secret(self) -> str:
        """Generate MFA secret key"""
        return pyotp.random_base32()

    def generate_mfa_token(self, secret: str, interval: int = 30) -> str:
        """Generate MFA TOTP token"""
        totp = pyotp.TOTP(secret, interval=interval)
        return totp.now()

    def verify_mfa_token(self, token: str, secret: str, valid_window: int = 1) -> bool:
        """Verify MFA TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=valid_window)

    # JWT token utilities
    def create_access_token(self, 
                           data: Dict[str, Any], 
                           expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": TokenType.ACCESS.value
        })
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(self, user_id: str, session_id: Optional[str] = None) -> str:
        """Create JWT refresh token"""
        data = {
            "sub": user_id,
            "type": TokenType.REFRESH.value,
            "jti": str(uuid.uuid4())
        }
        
        if session_id:
            data["session_id"] = session_id
        
        expire = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        data.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc)
        })
        
        token = jwt.encode(data, self.secret_key, algorithm=self.algorithm)
        
        # Store refresh token
        self.refresh_tokens[data["jti"]] = {
            "user_id": user_id,
            "session_id": session_id,
            "expires_at": expire,
            "token": token
        }
        
        return token

    def create_id_token(self, user: User, nonce: Optional[str] = None) -> str:
        """Create OIDC ID token"""
        data = {
            "sub": user.id,
            "email": user.email,
            "email_verified": user.email_verified,
            "name": f"{user.first_name} {user.last_name}".strip() if user.first_name else user.username,
            "given_name": user.first_name,
            "family_name": user.last_name,
            "preferred_username": user.username,
            "type": TokenType.ID.value,
            "aud": "test-client",
            "iss": "test-issuer",
            "auth_time": int(datetime.now(timezone.utc).timestamp())
        }
        
        if nonce:
            data["nonce"] = nonce
        
        expire = datetime.now(timezone.utc) + timedelta(hours=1)
        data.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc)
        })
        
        return jwt.encode(data, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            raise ValueError("Invalid token")

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode token without verification (for testing)"""
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except JWTError:
            return None

    # Session management
    def create_session(self, user: User) -> str:
        """Create user session"""
        session_id = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(days=1)
        
        self.sessions[session_id] = {
            "user_id": user.id,
            "created_at": datetime.now(timezone.utc),
            "expires_at": expires_at,
            "last_activity": datetime.now(timezone.utc),
            "ip_address": "127.0.0.1",
            "user_agent": "Test Client"
        }
        
        return session_id

    def validate_session(self, session_id: str) -> bool:
        """Validate session"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        if datetime.now(timezone.utc) > session["expires_at"]:
            del self.sessions[session_id]
            return False
        
        # Update last activity
        session["last_activity"] = datetime.now(timezone.utc)
        return True

    def destroy_session(self, session_id: str) -> bool:
        """Destroy session"""
        return self.sessions.pop(session_id, None) is not None

    # API key management
    def generate_api_key(self, user_id: str, name: str = "test-key", 
                        scopes: Optional[List[str]] = None) -> str:
        """Generate API key"""
        key_id = str(uuid.uuid4())
        key_secret = secrets.token_urlsafe(32)
        api_key = f"pk_{key_id}_{key_secret}"
        
        self.api_keys[api_key] = {
            "user_id": user_id,
            "name": name,
            "scopes": scopes or [],
            "created_at": datetime.now(timezone.utc),
            "last_used": None,
            "is_active": True
        }
        
        return api_key

    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate API key"""
        if api_key not in self.api_keys:
            return None
        
        key_data = self.api_keys[api_key]
        if not key_data["is_active"]:
            return None
        
        # Update last used
        key_data["last_used"] = datetime.now(timezone.utc)
        return key_data

    # User management
    def create_user(self, 
                   email: str,
                   password: str,
                   username: Optional[str] = None,
                   first_name: Optional[str] = None,
                   last_name: Optional[str] = None,
                   roles: Optional[List[str]] = None,
                   **kwargs) -> User:
        """Create a test user"""
        user_id = str(uuid.uuid4())
        
        user = User(
            id=user_id,
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            roles=roles or ["user"],
            password_hash=self.hash_password(password),
            **kwargs
        )
        
        self.users[user_id] = user
        return user

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.get_user_by_email(email)
        if not user or not user.password_hash:
            return None
        
        if not self.verify_password(password, user.password_hash):
            return None
        
        if not user.is_active:
            return None
        
        return user

    # Authentication context
    def create_auth_context(self, 
                           user: Optional[User] = None,
                           include_tokens: bool = True) -> AuthContext:
        """Create authentication context"""
        context = AuthContext(user=user)
        
        if user and include_tokens:
            # Create tokens
            token_data = {
                "sub": user.id,
                "email": user.email,
                "roles": user.roles,
                "permissions": user.permissions
            }
            
            context.token = self.create_access_token(token_data)
            context.refresh_token = self.create_refresh_token(user.id)
            context.session_id = self.create_session(user)
            
            # Set expiration
            expires_delta = timedelta(minutes=self.access_token_expire_minutes)
            context.expires_at = datetime.now(timezone.utc) + expires_delta
        
        return context

    # Rate limiting utilities
    def create_rate_limit_key(self, identifier: str, action: str = "login") -> str:
        """Create rate limit key"""
        return f"rate_limit:{action}:{identifier}"

    def check_rate_limit(self, 
                        identifier: str, 
                        max_attempts: int = 5, 
                        window_minutes: int = 15) -> Dict[str, Any]:
        """Check rate limiting (simplified for testing)"""
        return {
            "allowed": True,
            "attempts": 0,
            "remaining": max_attempts,
            "reset_time": datetime.now(timezone.utc) + timedelta(minutes=window_minutes)
        }

    # Test utilities
    async def simulate_auth_delay(self, milliseconds: int = 100) -> None:
        """Simulate authentication processing delay"""
        await asyncio.sleep(milliseconds / 1000)

    def create_expired_token(self, user: User) -> str:
        """Create expired token for testing"""
        data = {
            "sub": user.id,
            "email": user.email,
            "type": TokenType.ACCESS.value
        }
        
        # Set expiration in the past
        expire = datetime.now(timezone.utc) - timedelta(hours=1)
        data.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc) - timedelta(hours=2)
        })
        
        return jwt.encode(data, self.secret_key, algorithm=self.algorithm)

    def create_malformed_token(self) -> str:
        """Create malformed token for testing"""
        return "invalid.jwt.token.format"

    def reset(self) -> None:
        """Reset all test data"""
        self.users.clear()
        self.sessions.clear()
        self.refresh_tokens.clear()
        self.api_keys.clear()


# Async utilities
class AsyncAuthHelper:
    """Async authentication helper utilities"""
    
    def __init__(self, auth_helper: FastAPIAuthTestHelper):
        self.auth_helper = auth_helper

    async def authenticate_user_async(self, email: str, password: str) -> Optional[User]:
        """Async user authentication"""
        await self.auth_helper.simulate_auth_delay()
        return self.auth_helper.authenticate_user(email, password)

    async def verify_mfa_async(self, user: User, token: str) -> bool:
        """Async MFA verification"""
        await self.auth_helper.simulate_auth_delay(50)
        if not user.mfa_secret:
            return False
        return self.auth_helper.verify_mfa_token(token, user.mfa_secret)

    async def create_user_async(self, **kwargs) -> User:
        """Async user creation"""
        await self.auth_helper.simulate_auth_delay()
        return self.auth_helper.create_user(**kwargs)


# Predefined test scenarios
class AuthTestScenarios:
    """Predefined authentication test scenarios"""
    
    def __init__(self, auth_helper: FastAPIAuthTestHelper):
        self.auth_helper = auth_helper

    def create_valid_users(self) -> Dict[str, User]:
        """Create valid user scenarios"""
        return {
            "basic_user": self.auth_helper.create_user(
                email="user@test.com",
                password="password123",
                username="testuser",
                first_name="Test",
                last_name="User"
            ),
            "admin_user": self.auth_helper.create_user(
                email="admin@test.com",
                password="admin123",
                username="admin",
                roles=["admin"],
                first_name="Admin",
                last_name="User"
            ),
            "mfa_user": self.auth_helper.create_user(
                email="mfa@test.com",
                password="mfa123",
                username="mfauser",
                mfa_enabled=True,
                mfa_secret=self.auth_helper.generate_mfa_secret()
            ),
            "premium_user": self.auth_helper.create_user(
                email="premium@test.com",
                password="premium123",
                roles=["premium_user"],
                metadata={"subscription": "premium"}
            )
        }

    def create_invalid_users(self) -> Dict[str, User]:
        """Create invalid user scenarios"""
        return {
            "inactive_user": self.auth_helper.create_user(
                email="inactive@test.com",
                password="password123",
                is_active=False
            ),
            "unverified_user": self.auth_helper.create_user(
                email="unverified@test.com",
                password="password123",
                email_verified=False
            ),
            "no_permissions_user": self.auth_helper.create_user(
                email="noperms@test.com",
                password="password123",
                roles=[]
            )
        }

    def create_service_accounts(self) -> Dict[str, User]:
        """Create service account scenarios"""
        return {
            "api_service": self.auth_helper.create_user(
                email="api@service.com",
                password="service123",
                username="api_service",
                roles=["service_account"],
                metadata={"service_type": "api"}
            ),
            "background_worker": self.auth_helper.create_user(
                email="worker@service.com",
                password="worker123",
                username="bg_worker",
                roles=["service_account"],
                metadata={"service_type": "background_worker"}
            )
        }


# Default instances for convenience
auth_helper = FastAPIAuthTestHelper()
async_auth_helper = AsyncAuthHelper(auth_helper)
auth_scenarios = AuthTestScenarios(auth_helper)

# Common test patterns
def create_authenticated_context(user_type: str = "basic_user") -> AuthContext:
    """Create authenticated context for testing"""
    users = auth_scenarios.create_valid_users()
    user = users.get(user_type, users["basic_user"])
    return auth_helper.create_auth_context(user)

def create_unauthenticated_context() -> AuthContext:
    """Create unauthenticated context for testing"""
    return AuthContext()

def create_token_for_user(user: User) -> str:
    """Create access token for user"""
    token_data = {
        "sub": user.id,
        "email": user.email,
        "roles": user.roles,
        "permissions": user.permissions
    }
    return auth_helper.create_access_token(token_data)

# Error scenarios
class AuthErrors:
    """Authentication error scenarios"""
    
    INVALID_CREDENTIALS = {"error": "invalid_credentials", "message": "Invalid email or password"}
    ACCOUNT_INACTIVE = {"error": "account_inactive", "message": "Account is inactive"}
    EMAIL_NOT_VERIFIED = {"error": "email_not_verified", "message": "Email not verified"}
    MFA_REQUIRED = {"error": "mfa_required", "message": "MFA token required"}
    INVALID_MFA = {"error": "invalid_mfa", "message": "Invalid MFA token"}
    TOKEN_EXPIRED = {"error": "token_expired", "message": "Token has expired"}
    INVALID_TOKEN = {"error": "invalid_token", "message": "Invalid token"}
    INSUFFICIENT_PERMISSIONS = {"error": "insufficient_permissions", "message": "Insufficient permissions"}
    RATE_LIMITED = {"error": "rate_limited", "message": "Too many attempts, please try again later"}


if __name__ == "__main__":
    # Example usage
    helper = FastAPIAuthTestHelper()
    
    # Create test user
    user = helper.create_user(
        email="test@example.com",
        password="password123",
        username="testuser"
    )
    
    # Create auth context
    context = helper.create_auth_context(user)
    
    print(f"Created user: {user.email}")
    print(f"Auth token: {context.token[:50]}...")
    print(f"User has 'read' permission: {user.has_permission('read')}")