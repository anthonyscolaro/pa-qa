# FastAPI Testing Setup Guide - PA-QA Framework

## 🚀 Quick Start

Set up comprehensive FastAPI testing in under 8 minutes with pytest, SQLAlchemy fixtures, async testing, and API contract validation.

## 📋 Prerequisites

- Python 3.8+ (recommended: 3.11+)
- pip or poetry package manager
- Existing FastAPI project
- Docker (recommended for database testing)
- PostgreSQL or MySQL (for integration tests)

## 🎯 What You'll Get

After following this guide, your FastAPI project will have:

✅ **Unit Tests** with pytest and pytest-asyncio  
✅ **Integration Tests** with database fixtures  
✅ **API Tests** with FastAPI TestClient  
✅ **Authentication Tests** with JWT mocking  
✅ **Database Tests** with SQLAlchemy transactions  
✅ **Contract Tests** with Pydantic validation  
✅ **Load Tests** with Locust integration  
✅ **Security Tests** with automated vulnerability scanning  
✅ **Code Coverage** with pytest-cov (70% minimum)  
✅ **Allure Reporting** integration  
✅ **CI/CD Ready** GitHub Actions workflow  

## 🔧 Step 1: Copy PA-QA Templates

### Option A: Manual Copy (Recommended for Learning)

```bash
# Navigate to your FastAPI project
cd your-fastapi-project

# Copy configuration files
cp /path/to/pa-qa/project-types/api-services/fastapi/pytest.ini ./
cp /path/to/pa-qa/project-types/api-services/fastapi/pyproject.toml ./

# Create tests directory structure
mkdir -p tests/{unit,integration,api,load,fixtures,conftest}

# Copy test utilities and setup
cp -r /path/to/pa-qa/project-types/api-services/fastapi/tests/* ./tests/

# Copy configuration files
cp -r /path/to/pa-qa/project-types/api-services/fastapi/configs/* ./configs/
```

### Option B: Multi-Agent Setup (Advanced)

```bash
# Use PA-QA multi-agent command to generate custom test suite
cd your-fastapi-project
pa-qa generate-test-suite api-service fastapi --with-auth --with-database --project-name="your-api"
```

## 🔧 Step 2: Install Dependencies

### Update pyproject.toml Dependencies

Add these dependencies to your existing `pyproject.toml`:

```toml
[tool.poetry.group.test.dependencies]
pytest = "^7.4.3"
pytest-asyncio = "^0.21.1"
pytest-cov = "^4.1.0"
pytest-mock = "^3.12.0"
pytest-xdist = "^3.5.0"
httpx = "^0.25.2"
faker = "^20.1.0"
factory-boy = "^3.3.0"
pytest-benchmark = "^4.0.0"
locust = "^2.17.0"
allure-pytest = "^2.13.2"
sqlalchemy-utils = "^0.41.1"
pytest-postgresql = "^5.0.0"
pytest-redis = "^3.0.2"

[tool.poetry.group.dev.dependencies]
black = "^23.11.0"
isort = "^5.12.0"
flake8 = "^6.1.0"
mypy = "^1.7.0"
bandit = "^1.7.5"
safety = "^2.3.5"

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = """
    -ra
    --strict-markers
    --strict-config
    --cov=app
    --cov-report=term-missing
    --cov-report=html:coverage-report
    --cov-report=xml:coverage.xml
    --cov-fail-under=70
    --alluredir=allure-results
"""
asyncio_mode = "auto"
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
    "api: marks tests as API tests",
    "auth: marks tests as authentication tests",
    "db: marks tests as database tests"
]

[tool.coverage.run]
source = ["app"]
omit = [
    "*/tests/*",
    "*/venv/*",
    "*/__pycache__/*",
    "*/migrations/*",
    "app/main.py"
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "class .*\\bProtocol\\):",
    "@(abc\\.)?abstractmethod"
]

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88
known_first_party = ["app", "tests"]

[tool.black]
line-length = 88
target-version = ['py38']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''

[tool.mypy]
python_version = "3.8"
check_untyped_defs = true
disallow_any_generics = true
disallow_incomplete_defs = true
disallow_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_return_any = true
strict_equality = true
```

### Install Dependencies

```bash
# Using Poetry (recommended)
poetry install --with test,dev

# Using pip
pip install -r requirements-test.txt
```

## 🔧 Step 3: Configure Testing Environment

### Main Test Configuration (tests/conftest.py)

```python
"""
Global test configuration and fixtures
"""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import create_database, drop_database, database_exists

from app.main import app
from app.database import get_async_session, Base
from app.core.config import get_settings
from app.models import User
from tests.factories import UserFactory

# Test database configuration
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"
TEST_DATABASE_URL_SYNC = "postgresql://test:test@localhost:5432/test_db"

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def async_engine():
    """Create async database engine for testing."""
    # Create test database if it doesn't exist
    if not database_exists(TEST_DATABASE_URL_SYNC):
        create_database(TEST_DATABASE_URL_SYNC)
    
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()
    drop_database(TEST_DATABASE_URL_SYNC)

@pytest_asyncio.fixture
async def async_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create async database session for testing."""
    async_session_factory = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_factory() as session:
        yield session
        await session.rollback()

@pytest_asyncio.fixture
async def async_client(async_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing."""
    
    # Override database dependency
    async def override_get_async_session():
        yield async_session
    
    app.dependency_overrides[get_async_session] = override_get_async_session
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # Clean up dependency override
    app.dependency_overrides.clear()

@pytest.fixture
def test_user_data():
    """Generate test user data."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "testpassword123"
    }

@pytest_asyncio.fixture
async def test_user(async_session: AsyncSession, test_user_data: dict) -> User:
    """Create a test user in the database."""
    user = await UserFactory.create_async(async_session, **test_user_data)
    await async_session.commit()
    await async_session.refresh(user)
    return user

@pytest_asyncio.fixture
async def authenticated_client(
    async_client: AsyncClient, test_user: User
) -> AsyncClient:
    """Create authenticated HTTP client."""
    # Login to get access token
    login_data = {
        "username": test_user.email,
        "password": "testpassword123"
    }
    
    response = await async_client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    
    token_data = response.json()
    access_token = token_data["access_token"]
    
    # Set authorization header
    async_client.headers.update({"Authorization": f"Bearer {access_token}"})
    
    return async_client

@pytest.fixture
def mock_settings():
    """Mock application settings for testing."""
    from app.core.config import Settings
    
    return Settings(
        database_url=TEST_DATABASE_URL,
        secret_key="test-secret-key",
        algorithm="HS256",
        access_token_expire_minutes=30,
        environment="test"
    )
```

### Factory Helpers (tests/factories.py)

```python
"""
Factory classes for creating test data
"""
import asyncio
from typing import Any, Dict
import factory
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Post, Comment
from app.core.security import get_password_hash

fake = Faker()

class UserFactory(factory.Factory):
    """Factory for creating User instances."""
    
    class Meta:
        model = User
    
    email = factory.LazyFunction(lambda: fake.email())
    username = factory.LazyFunction(lambda: fake.user_name())
    full_name = factory.LazyFunction(lambda: fake.name())
    hashed_password = factory.LazyFunction(
        lambda: get_password_hash("testpassword123")
    )
    is_active = True
    is_superuser = False
    
    @classmethod
    async def create_async(
        cls, session: AsyncSession, **kwargs: Any
    ) -> User:
        """Create user asynchronously."""
        user_data = factory.build(dict, FACTORY_FOR=User, **kwargs)
        
        # Hash password if provided as plain text
        if "password" in kwargs:
            user_data["hashed_password"] = get_password_hash(kwargs["password"])
            del user_data["password"]
        
        user = User(**user_data)
        session.add(user)
        await session.flush()
        return user

class PostFactory(factory.Factory):
    """Factory for creating Post instances."""
    
    class Meta:
        model = Post
    
    title = factory.LazyFunction(lambda: fake.sentence())
    content = factory.LazyFunction(lambda: fake.text())
    is_published = True
    
    @classmethod
    async def create_async(
        cls, session: AsyncSession, author_id: int, **kwargs: Any
    ) -> Post:
        """Create post asynchronously."""
        post_data = factory.build(dict, FACTORY_FOR=Post, **kwargs)
        post_data["author_id"] = author_id
        
        post = Post(**post_data)
        session.add(post)
        await session.flush()
        return post

class CommentFactory(factory.Factory):
    """Factory for creating Comment instances."""
    
    class Meta:
        model = Comment
    
    content = factory.LazyFunction(lambda: fake.paragraph())
    
    @classmethod
    async def create_async(
        cls, session: AsyncSession, author_id: int, post_id: int, **kwargs: Any
    ) -> Comment:
        """Create comment asynchronously."""
        comment_data = factory.build(dict, FACTORY_FOR=Comment, **kwargs)
        comment_data.update({"author_id": author_id, "post_id": post_id})
        
        comment = Comment(**comment_data)
        session.add(comment)
        await session.flush()
        return comment
```

### Test Utilities (tests/utils.py)

```python
"""
Test utility functions
"""
import json
from typing import Any, Dict
from httpx import AsyncClient
from jose import jwt

from app.core.config import get_settings
from app.models import User

settings = get_settings()

def create_test_token(user: User) -> str:
    """Create JWT token for testing."""
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "username": user.username
    }
    
    return jwt.encode(
        token_data, 
        settings.secret_key, 
        algorithm=settings.algorithm
    )

async def assert_response_status(
    response, 
    expected_status: int, 
    message: str = None
):
    """Assert response status with detailed error message."""
    if response.status_code != expected_status:
        error_msg = f"Expected {expected_status}, got {response.status_code}"
        if message:
            error_msg += f": {message}"
        
        try:
            response_data = response.json()
            error_msg += f"\nResponse: {json.dumps(response_data, indent=2)}"
        except:
            error_msg += f"\nResponse text: {response.text}"
        
        raise AssertionError(error_msg)

async def create_test_data(session, factories: Dict[str, Any]) -> Dict[str, Any]:
    """Create multiple test objects."""
    created_objects = {}
    
    for name, factory_config in factories.items():
        factory_class = factory_config["factory"]
        factory_kwargs = factory_config.get("kwargs", {})
        
        # Handle dependencies
        if "depends_on" in factory_config:
            for dependency in factory_config["depends_on"]:
                if dependency in created_objects:
                    dependency_key = f"{dependency}_id"
                    factory_kwargs[dependency_key] = created_objects[dependency].id
        
        obj = await factory_class.create_async(session, **factory_kwargs)
        created_objects[name] = obj
    
    await session.commit()
    return created_objects

class MockRedis:
    """Mock Redis client for testing."""
    
    def __init__(self):
        self.data = {}
    
    async def get(self, key: str) -> str:
        return self.data.get(key)
    
    async def set(self, key: str, value: str, ex: int = None):
        self.data[key] = value
    
    async def delete(self, key: str):
        self.data.pop(key, None)
    
    async def exists(self, key: str) -> bool:
        return key in self.data
```

## 🔧 Step 4: Write Your First Tests

### Unit Test Example (tests/unit/test_auth.py)

```python
"""
Unit tests for authentication logic
"""
import pytest
from unittest.mock import Mock, patch
from jose import jwt
from datetime import datetime, timedelta

from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    verify_token
)
from app.core.config import get_settings

settings = get_settings()

@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_password_hashing(self):
        """Test password is properly hashed."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed)
    
    def test_password_verification_fails_with_wrong_password(self):
        """Test password verification fails with wrong password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        
        assert not verify_password(wrong_password, hashed)

@pytest.mark.unit
class TestTokenGeneration:
    """Test JWT token generation and verification."""
    
    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        # Decode token to verify contents
        payload = jwt.decode(
            token, 
            settings.secret_key, 
            algorithms=[settings.algorithm]
        )
        
        assert payload["sub"] == "test@example.com"
        assert "exp" in payload
    
    def test_create_access_token_with_custom_expiry(self):
        """Test access token with custom expiry."""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta)
        
        payload = jwt.decode(
            token, 
            settings.secret_key, 
            algorithms=[settings.algorithm]
        )
        
        # Check expiry is approximately 15 minutes from now
        exp_time = datetime.fromtimestamp(payload["exp"])
        expected_time = datetime.utcnow() + expires_delta
        time_diff = abs((exp_time - expected_time).total_seconds())
        
        assert time_diff < 5  # Allow 5 second tolerance
    
    def test_verify_token_valid(self):
        """Test token verification with valid token."""
        data = {"sub": "test@example.com", "username": "testuser"}
        token = create_access_token(data)
        
        payload = verify_token(token)
        
        assert payload["sub"] == "test@example.com"
        assert payload["username"] == "testuser"
    
    def test_verify_token_invalid(self):
        """Test token verification with invalid token."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(ValueError):
            verify_token(invalid_token)
    
    def test_verify_token_expired(self):
        """Test token verification with expired token."""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(seconds=-1)  # Already expired
        token = create_access_token(data, expires_delta)
        
        with pytest.raises(ValueError):
            verify_token(token)
```

### Integration Test Example (tests/integration/test_crud.py)

```python
"""
Integration tests for CRUD operations
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user_crud, post_crud
from app.schemas import UserCreate, PostCreate
from tests.factories import UserFactory, PostFactory

@pytest.mark.integration
@pytest.mark.db
class TestUserCRUD:
    """Test user CRUD operations."""
    
    async def test_create_user(self, async_session: AsyncSession):
        """Test user creation."""
        user_data = UserCreate(
            email="test@example.com",
            username="testuser",
            full_name="Test User",
            password="testpassword123"
        )
        
        user = await user_crud.create(async_session, user_data)
        
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.full_name == "Test User"
        assert user.hashed_password != "testpassword123"  # Should be hashed
        assert user.is_active is True
    
    async def test_get_user_by_email(self, async_session: AsyncSession):
        """Test getting user by email."""
        # Create user
        user = await UserFactory.create_async(
            async_session, 
            email="test@example.com"
        )
        await async_session.commit()
        
        # Retrieve user
        retrieved_user = await user_crud.get_by_email(
            async_session, 
            "test@example.com"
        )
        
        assert retrieved_user is not None
        assert retrieved_user.id == user.id
        assert retrieved_user.email == "test@example.com"
    
    async def test_get_user_by_email_not_found(self, async_session: AsyncSession):
        """Test getting non-existent user by email."""
        user = await user_crud.get_by_email(
            async_session, 
            "nonexistent@example.com"
        )
        
        assert user is None
    
    async def test_update_user(self, async_session: AsyncSession):
        """Test user update."""
        # Create user
        user = await UserFactory.create_async(async_session)
        await async_session.commit()
        
        # Update user
        update_data = {"full_name": "Updated Name"}
        updated_user = await user_crud.update(
            async_session, 
            user, 
            update_data
        )
        
        assert updated_user.full_name == "Updated Name"
        assert updated_user.id == user.id
    
    async def test_delete_user(self, async_session: AsyncSession):
        """Test user deletion."""
        # Create user
        user = await UserFactory.create_async(async_session)
        await async_session.commit()
        user_id = user.id
        
        # Delete user
        await user_crud.delete(async_session, user_id)
        
        # Verify deletion
        deleted_user = await user_crud.get(async_session, user_id)
        assert deleted_user is None

@pytest.mark.integration
@pytest.mark.db
class TestPostCRUD:
    """Test post CRUD operations."""
    
    async def test_create_post(self, async_session: AsyncSession):
        """Test post creation."""
        # Create author
        author = await UserFactory.create_async(async_session)
        await async_session.commit()
        
        # Create post
        post_data = PostCreate(
            title="Test Post",
            content="This is test content",
            is_published=True
        )
        
        post = await post_crud.create(
            async_session, 
            post_data, 
            author_id=author.id
        )
        
        assert post.title == "Test Post"
        assert post.content == "This is test content"
        assert post.is_published is True
        assert post.author_id == author.id
    
    async def test_get_posts_by_author(self, async_session: AsyncSession):
        """Test getting posts by author."""
        # Create author and posts
        author = await UserFactory.create_async(async_session)
        await async_session.flush()
        
        post1 = await PostFactory.create_async(
            async_session, 
            author_id=author.id,
            title="Post 1"
        )
        post2 = await PostFactory.create_async(
            async_session, 
            author_id=author.id,
            title="Post 2"
        )
        await async_session.commit()
        
        # Get posts by author
        posts = await post_crud.get_by_author(async_session, author.id)
        
        assert len(posts) == 2
        post_titles = [post.title for post in posts]
        assert "Post 1" in post_titles
        assert "Post 2" in post_titles
    
    async def test_get_published_posts_only(self, async_session: AsyncSession):
        """Test getting only published posts."""
        # Create author
        author = await UserFactory.create_async(async_session)
        await async_session.flush()
        
        # Create published and unpublished posts
        published_post = await PostFactory.create_async(
            async_session,
            author_id=author.id,
            is_published=True
        )
        unpublished_post = await PostFactory.create_async(
            async_session,
            author_id=author.id,
            is_published=False
        )
        await async_session.commit()
        
        # Get only published posts
        published_posts = await post_crud.get_published(async_session)
        
        assert len(published_posts) == 1
        assert published_posts[0].id == published_post.id
```

### API Test Example (tests/api/test_authentication.py)

```python
"""
API tests for authentication endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import UserFactory
from tests.utils import assert_response_status

@pytest.mark.api
@pytest.mark.auth
class TestAuthenticationAPI:
    """Test authentication API endpoints."""
    
    async def test_register_user_success(self, async_client: AsyncClient):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "full_name": "New User",
            "password": "password123"
        }
        
        response = await async_client.post("/auth/register", json=user_data)
        
        await assert_response_status(response, 201, "User registration failed")
        
        response_data = response.json()
        assert response_data["email"] == "newuser@example.com"
        assert response_data["username"] == "newuser"
        assert response_data["full_name"] == "New User"
        assert "password" not in response_data
        assert "id" in response_data
    
    async def test_register_user_duplicate_email(
        self, 
        async_client: AsyncClient, 
        async_session: AsyncSession
    ):
        """Test registration with duplicate email."""
        # Create existing user
        await UserFactory.create_async(
            async_session, 
            email="existing@example.com"
        )
        await async_session.commit()
        
        # Try to register with same email
        user_data = {
            "email": "existing@example.com",
            "username": "newuser",
            "full_name": "New User",
            "password": "password123"
        }
        
        response = await async_client.post("/auth/register", json=user_data)
        
        await assert_response_status(response, 400, "Should reject duplicate email")
        
        response_data = response.json()
        assert "email" in response_data["detail"].lower()
    
    async def test_login_success(
        self, 
        async_client: AsyncClient, 
        test_user_data: dict
    ):
        """Test successful login."""
        # Register user first
        await async_client.post("/auth/register", json=test_user_data)
        
        # Login with credentials
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        response = await async_client.post("/auth/login", data=login_data)
        
        await assert_response_status(response, 200, "Login failed")
        
        response_data = response.json()
        assert "access_token" in response_data
        assert response_data["token_type"] == "bearer"
    
    async def test_login_invalid_credentials(self, async_client: AsyncClient):
        """Test login with invalid credentials."""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = await async_client.post("/auth/login", data=login_data)
        
        await assert_response_status(response, 401, "Should reject invalid credentials")
    
    async def test_get_current_user(
        self, 
        authenticated_client: AsyncClient,
        test_user: object
    ):
        """Test getting current user info."""
        response = await authenticated_client.get("/auth/me")
        
        await assert_response_status(response, 200, "Failed to get current user")
        
        response_data = response.json()
        assert response_data["id"] == test_user.id
        assert response_data["email"] == test_user.email
        assert response_data["username"] == test_user.username
    
    async def test_get_current_user_unauthorized(self, async_client: AsyncClient):
        """Test getting current user without authentication."""
        response = await async_client.get("/auth/me")
        
        await assert_response_status(response, 401, "Should require authentication")
    
    async def test_refresh_token(
        self, 
        authenticated_client: AsyncClient
    ):
        """Test token refresh."""
        response = await authenticated_client.post("/auth/refresh")
        
        await assert_response_status(response, 200, "Token refresh failed")
        
        response_data = response.json()
        assert "access_token" in response_data
        assert response_data["token_type"] == "bearer"
```

### Load Test Example (tests/load/test_api_performance.py)

```python
"""
Load tests for API performance
"""
from locust import HttpUser, task, between
import json

class APILoadTest(HttpUser):
    """Load test for API endpoints."""
    
    wait_time = between(1, 3)
    
    def on_start(self):
        """Setup for each user."""
        # Register and login
        user_data = {
            "email": f"loadtest{self.environment.runner.user_count}@example.com",
            "username": f"loadtest{self.environment.runner.user_count}",
            "full_name": "Load Test User",
            "password": "password123"
        }
        
        # Register
        response = self.client.post("/auth/register", json=user_data)
        if response.status_code == 201:
            # Login
            login_data = {
                "username": user_data["email"],
                "password": user_data["password"]
            }
            response = self.client.post("/auth/login", data=login_data)
            if response.status_code == 200:
                token = response.json()["access_token"]
                self.client.headers.update({
                    "Authorization": f"Bearer {token}"
                })
    
    @task(3)
    def get_posts(self):
        """Load test getting posts."""
        self.client.get("/posts/")
    
    @task(2)
    def get_post_detail(self):
        """Load test getting post detail."""
        self.client.get("/posts/1")
    
    @task(1)
    def create_post(self):
        """Load test creating posts."""
        post_data = {
            "title": "Load Test Post",
            "content": "This is a load test post",
            "is_published": True
        }
        
        self.client.post("/posts/", json=post_data)
    
    @task(1)
    def get_profile(self):
        """Load test getting user profile."""
        self.client.get("/auth/me")
```

## 🔧 Step 5: Set Up Allure Reporting

### Install Allure CLI

```bash
# macOS
brew install allure

# Ubuntu/Debian
sudo apt-get install allure

# Manual installation
wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz
tar -zxvf allure-2.24.0.tgz
sudo mv allure-2.24.0 /opt/allure
echo 'export PATH="/opt/allure/bin:$PATH"' >> ~/.bashrc
```

### Generate Reports

```bash
# Run tests and generate results
pytest

# Generate Allure report
allure generate allure-results -o allure-report --clean

# Serve report locally
allure serve allure-results
```

### Upload to PA-QA Dashboard

```bash
# Copy upload script
cp /path/to/pa-qa/shared/allure-config/upload-results.sh ./

# Upload results
./upload-results.sh your-fastapi-project
```

## 🔧 Step 6: Docker Integration

### Test Dockerfile

Create `Dockerfile.test`:

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry config virtualenvs.create false
RUN poetry install --with test,dev

# Copy source code
COPY . .

# Run tests
CMD ["pytest", "-v", "--alluredir=allure-results"]
```

### Docker Compose for Testing

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - DATABASE_URL=postgresql+asyncpg://test:test@postgres:5432/test_db
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=test-secret-key
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - allure-results:/app/allure-results

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  load-tests:
    build:
      context: .
      dockerfile: Dockerfile.test
    command: locust -f tests/load/test_api_performance.py --host=http://api:8000
    ports:
      - "8089:8089"
    depends_on:
      - api

volumes:
  postgres_data:
  allure-results:
```

## 🔧 Step 7: CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/fastapi-test.yml`:

```yaml
name: FastAPI Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  ALLURE_PROJECT_NAME: your-fastapi-project

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        python-version: [3.8, 3.9, "3.10", "3.11"]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install Poetry
      uses: snok/install-poetry@v1
      with:
        version: latest
        virtualenvs-create: true
        virtualenvs-in-project: true
    
    - name: Cache Poetry dependencies
      uses: actions/cache@v3
      with:
        path: .venv
        key: venv-${{ runner.os }}-${{ matrix.python-version }}-${{ hashFiles('**/poetry.lock') }}
    
    - name: Install dependencies
      run: poetry install --with test,dev
    
    - name: Run code quality checks
      run: |
        poetry run black --check .
        poetry run isort --check-only .
        poetry run flake8 .
        poetry run mypy app/
        poetry run bandit -r app/
        poetry run safety check
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379/0
        SECRET_KEY: test-secret-key-for-ci
      run: |
        poetry run pytest -v \
          --cov=app \
          --cov-report=xml \
          --cov-report=html \
          --alluredir=allure-results
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        fail_ci_if_error: true
    
    - name: Upload test results to Allure
      if: always()
      run: ./upload-results.sh ${{ env.ALLURE_PROJECT_NAME }}

  load-test:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run load tests
      run: |
        docker-compose -f docker-compose.test.yml up -d api
        sleep 30
        docker-compose -f docker-compose.test.yml run --rm load-tests \
          locust -f tests/load/test_api_performance.py \
          --host=http://api:8000 \
          --users 10 \
          --spawn-rate 2 \
          --run-time 60s \
          --headless
```

## ✅ Step 8: Verification

### Run All Tests

```bash
# Code quality checks
poetry run black .
poetry run isort .
poetry run flake8 .
poetry run mypy app/
poetry run bandit -r app/
poetry run safety check

# Unit tests
poetry run pytest tests/unit/ -v

# Integration tests
poetry run pytest tests/integration/ -v

# API tests
poetry run pytest tests/api/ -v

# All tests with coverage
poetry run pytest --cov=app --cov-report=html

# Load tests
locust -f tests/load/test_api_performance.py --host=http://localhost:8000
```

### Check Coverage

```bash
# Run tests with coverage
poetry run pytest --cov=app --cov-report=term-missing

# View HTML coverage report
open coverage-report/index.html

# Coverage should be > 70%
```

### Verify Allure Integration

```bash
# Generate and view report
allure generate allure-results -o allure-report --clean
allure serve allure-results

# Upload to dashboard
./upload-results.sh your-fastapi-project
# Visit https://allure.projectassistant.ai/your-fastapi-project
```

## 🎯 Advanced Testing Patterns

### Background Task Testing

```python
# tests/integration/test_background_tasks.py
import pytest
from unittest.mock import AsyncMock
from httpx import AsyncClient

@pytest.mark.integration
async def test_send_email_task(
    authenticated_client: AsyncClient,
    mock_email_service: AsyncMock
):
    """Test background email sending task."""
    response = await authenticated_client.post("/send-welcome-email")
    
    assert response.status_code == 202
    
    # Verify background task was called
    mock_email_service.send_email.assert_called_once()
```

### WebSocket Testing

```python
# tests/api/test_websocket.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.mark.api
def test_websocket_connection():
    """Test WebSocket connection."""
    client = TestClient(app)
    
    with client.websocket_connect("/ws") as websocket:
        websocket.send_text("Hello")
        data = websocket.receive_text()
        assert data == "Hello"
```

### Dependency Override Testing

```python
# tests/api/test_dependencies.py
import pytest
from unittest.mock import AsyncMock
from httpx import AsyncClient
from app.main import app
from app.dependencies import get_current_user

@pytest.mark.api
async def test_protected_endpoint_with_mock_user(async_client: AsyncClient):
    """Test protected endpoint with mocked user dependency."""
    
    # Mock user
    mock_user = AsyncMock()
    mock_user.id = 1
    mock_user.email = "test@example.com"
    
    # Override dependency
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    try:
        response = await async_client.get("/protected-endpoint")
        assert response.status_code == 200
    finally:
        # Clean up
        app.dependency_overrides.clear()
```

## 🆘 Troubleshooting

### Common Issues

**Async test issues**
```python
# Make sure to use pytest-asyncio and mark tests properly
@pytest.mark.asyncio
async def test_async_function():
    result = await some_async_function()
    assert result is not None
```

**Database connection issues**
```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.test.yml ps postgres

# Reset database
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d postgres
```

**Import errors**
```bash
# Ensure PYTHONPATH includes src
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or use editable install
poetry install -e .
```

**Coverage too low**
```bash
# Run coverage report to see what's missing
poetry run pytest --cov=app --cov-report=html
open coverage-report/index.html

# Add tests for uncovered lines
```

### Get Help

- **Documentation**: `/docs/troubleshooting/common-issues.md`
- **Examples**: `/project-types/api-services/fastapi/tests/`
- **Community**: Join our Slack #fastapi-testing channel
- **Issues**: Create issue in PA-QA repository

## 📚 Additional Resources

- [PA-QA Best Practices](/docs/best-practices/testing-patterns.md)
- [Docker Testing Setup](/docs/setup-guides/docker-testing-setup.md)
- [FastAPI Testing Documentation](https://fastapi.tiangolo.com/tutorial/testing/)
- [Pytest Documentation](https://docs.pytest.org/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

---

**🎉 Congratulations!** Your FastAPI project now has comprehensive testing setup with the PA-QA framework. You're ready to build high-quality, well-tested APIs with confidence.