"""
Pytest configuration and fixtures for FastAPI async testing.

This module provides comprehensive test fixtures for FastAPI applications including:
- Async database sessions with transaction isolation
- Test client with dependency overrides
- Authentication fixtures
- Mock external services
- Test data factories
"""

import asyncio
import os
import tempfile
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Configure pytest-asyncio
pytest_asyncio.DEFAULT_SCOPE = "session"
pytest.DEFAULT_SCOPE = "session"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_database_url() -> str:
    """Create a temporary SQLite database for testing."""
    # Use in-memory SQLite for testing
    return "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
async def async_engine(test_database_url: str):
    """Create async database engine for testing."""
    engine = create_async_engine(
        test_database_url,
        echo=False,
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,
        },
    )
    
    # Import your models here and create tables
    # from app.models import Base
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
async def async_session_factory(async_engine):
    """Create async session factory."""
    return async_sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


@pytest.fixture
async def db_session(async_session_factory) -> AsyncGenerator[AsyncSession, None]:
    """
    Create a database session with transaction rollback.
    
    This fixture creates a new database session for each test and rolls back
    all changes at the end, ensuring test isolation.
    """
    async with async_session_factory() as session:
        # Start a transaction
        transaction = await session.begin()
        
        try:
            yield session
        finally:
            # Rollback transaction to ensure test isolation
            await transaction.rollback()
            await session.close()


@pytest.fixture
def sync_engine(test_database_url: str):
    """Create synchronous database engine for sync operations."""
    # Convert async URL to sync URL
    sync_url = test_database_url.replace("sqlite+aiosqlite://", "sqlite://")
    engine = create_engine(
        sync_url,
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    
    # Create tables if needed
    # from app.models import Base
    # Base.metadata.create_all(bind=engine)
    
    yield engine
    engine.dispose()


@pytest.fixture
def sync_session(sync_engine):
    """Create synchronous database session."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
    session = SessionLocal()
    
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def mock_redis():
    """Mock Redis client for caching tests."""
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    mock_redis.set.return_value = True
    mock_redis.delete.return_value = 1
    mock_redis.exists.return_value = False
    mock_redis.expire.return_value = True
    mock_redis.ttl.return_value = -1
    return mock_redis


@pytest.fixture
def mock_email_service():
    """Mock email service for notification tests."""
    mock_service = AsyncMock()
    mock_service.send_email.return_value = {"message_id": "test-123", "status": "sent"}
    mock_service.send_bulk_email.return_value = {"sent": 5, "failed": 0}
    return mock_service


@pytest.fixture
def mock_file_storage():
    """Mock file storage service for upload tests."""
    mock_storage = AsyncMock()
    mock_storage.upload_file.return_value = {
        "url": "https://example.com/test-file.jpg",
        "key": "test-file-key",
        "size": 1024,
    }
    mock_storage.delete_file.return_value = True
    mock_storage.get_file_url.return_value = "https://example.com/test-file.jpg"
    return mock_storage


@pytest.fixture
def mock_external_api():
    """Mock external API service."""
    mock_api = AsyncMock()
    mock_api.get.return_value = {"status": "success", "data": {"test": "value"}}
    mock_api.post.return_value = {"status": "success", "id": "test-123"}
    mock_api.put.return_value = {"status": "success", "updated": True}
    mock_api.delete.return_value = {"status": "success", "deleted": True}
    return mock_api


@pytest.fixture
def mock_background_tasks():
    """Mock FastAPI BackgroundTasks."""
    mock_tasks = MagicMock()
    mock_tasks.add_task = MagicMock()
    return mock_tasks


def get_test_db_dependency(db_session: AsyncSession):
    """Dependency override for database session."""
    return db_session


@pytest.fixture
def app(
    db_session: AsyncSession,
    mock_redis,
    mock_email_service,
    mock_file_storage,
    mock_external_api,
) -> FastAPI:
    """
    Create FastAPI application with dependency overrides for testing.
    
    This fixture creates a FastAPI app instance with all dependencies
    overridden to use test doubles.
    """
    # Import your FastAPI app
    # from app.main import app
    
    # Create a test app instance
    from fastapi import FastAPI
    app = FastAPI(title="Test API", version="1.0.0")
    
    # Override dependencies
    # app.dependency_overrides[get_db] = lambda: db_session
    # app.dependency_overrides[get_redis] = lambda: mock_redis
    # app.dependency_overrides[get_email_service] = lambda: mock_email_service
    # app.dependency_overrides[get_file_storage] = lambda: mock_file_storage
    # app.dependency_overrides[get_external_api] = lambda: mock_external_api
    
    yield app
    
    # Clear overrides after test
    app.dependency_overrides.clear()


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """Create synchronous test client."""
    return TestClient(app)


@pytest.fixture
async def async_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Create asynchronous test client."""
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def auth_headers(valid_jwt_token: str) -> dict:
    """Create authentication headers with valid JWT token."""
    return {"Authorization": f"Bearer {valid_jwt_token}"}


@pytest.fixture
def admin_headers(admin_jwt_token: str) -> dict:
    """Create authentication headers with admin JWT token."""
    return {"Authorization": f"Bearer {admin_jwt_token}"}


@pytest.fixture
def valid_jwt_token() -> str:
    """Create a valid JWT token for testing."""
    # Import your JWT utilities
    # from app.core.security import create_access_token
    
    # Create test token with user data
    # token_data = {"sub": "test@example.com", "user_id": 1, "role": "user"}
    # return create_access_token(data=token_data)
    
    # Mock token for template
    return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6MSwicm9sZSI6InVzZXIifQ.test"


@pytest.fixture
def admin_jwt_token() -> str:
    """Create an admin JWT token for testing."""
    # Import your JWT utilities
    # from app.core.security import create_access_token
    
    # Create admin token
    # token_data = {"sub": "admin@example.com", "user_id": 1, "role": "admin"}
    # return create_access_token(data=token_data)
    
    # Mock admin token for template
    return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBleGFtcGxlLmNvbSIsInVzZXJfaWQiOjEsInJvbGUiOiJhZG1pbiJ9.test"


@pytest.fixture
def expired_jwt_token() -> str:
    """Create an expired JWT token for testing."""
    # Import your JWT utilities and create expired token
    # from app.core.security import create_access_token
    # from datetime import datetime, timedelta
    
    # token_data = {"sub": "test@example.com", "user_id": 1, "role": "user"}
    # return create_access_token(
    #     data=token_data,
    #     expires_delta=timedelta(seconds=-1)  # Already expired
    # )
    
    # Mock expired token for template
    return "expired.jwt.token"


@pytest.fixture
def invalid_jwt_token() -> str:
    """Create an invalid JWT token for testing."""
    return "invalid.jwt.token"


@pytest.fixture
def test_user_data() -> dict:
    """Create test user data."""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User",
        "is_active": True,
        "is_verified": True,
    }


@pytest.fixture
def test_admin_data() -> dict:
    """Create test admin user data."""
    return {
        "email": "admin@example.com",
        "password": "AdminPassword123!",
        "first_name": "Admin",
        "last_name": "User",
        "is_active": True,
        "is_verified": True,
        "is_superuser": True,
    }


@pytest.fixture
def test_files():
    """Create temporary test files."""
    files = {}
    
    # Create a test image file
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        f.write(b"fake image content")
        files["image"] = f.name
    
    # Create a test text file
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        f.write(b"test file content")
        files["text"] = f.name
    
    # Create a test PDF file
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(b"fake pdf content")
        files["pdf"] = f.name
    
    yield files
    
    # Cleanup
    for file_path in files.values():
        try:
            os.unlink(file_path)
        except FileNotFoundError:
            pass


@pytest.fixture
def performance_threshold() -> dict:
    """Define performance thresholds for tests."""
    return {
        "api_response_time": 1.0,  # seconds
        "database_query_time": 0.5,  # seconds
        "file_upload_time": 5.0,  # seconds
        "bulk_operation_time": 10.0,  # seconds
    }


# Async fixtures for background task testing
@pytest.fixture
async def background_task_queue():
    """Mock background task queue."""
    queue = AsyncMock()
    queue.put.return_value = None
    queue.get.return_value = {"task": "test_task", "args": [], "kwargs": {}}
    queue.empty.return_value = True
    queue.qsize.return_value = 0
    return queue


@pytest.fixture
def websocket_client_factory(app: FastAPI):
    """Factory for creating WebSocket test clients."""
    def _create_client():
        return TestClient(app)
    return _create_client


# Parametrize fixtures for comprehensive testing
@pytest.fixture(params=["application/json", "application/x-www-form-urlencoded"])
def content_type(request):
    """Parametrize content types for API tests."""
    return request.param


@pytest.fixture(params=[1, 10, 100])
def batch_size(request):
    """Parametrize batch sizes for bulk operation tests."""
    return request.param


@pytest.fixture(params=["user", "admin", "guest"])
def user_role(request):
    """Parametrize user roles for authorization tests."""
    return request.param


# Error simulation fixtures
@pytest.fixture
def database_error_simulation():
    """Simulate database errors for error handling tests."""
    def _simulate_error(error_type="connection"):
        if error_type == "connection":
            from sqlalchemy.exc import OperationalError
            return OperationalError("Connection failed", None, None)
        elif error_type == "timeout":
            from sqlalchemy.exc import TimeoutError
            return TimeoutError("Query timeout", None, None)
        elif error_type == "integrity":
            from sqlalchemy.exc import IntegrityError
            return IntegrityError("Constraint violation", None, None)
        else:
            from sqlalchemy.exc import SQLAlchemyError
            return SQLAlchemyError("Generic database error")
    
    return _simulate_error


@pytest.fixture
def network_error_simulation():
    """Simulate network errors for external service tests."""
    def _simulate_error(error_type="timeout"):
        if error_type == "timeout":
            from httpx import TimeoutException
            return TimeoutException("Request timeout")
        elif error_type == "connection":
            from httpx import ConnectError
            return ConnectError("Connection failed")
        elif error_type == "http":
            from httpx import HTTPStatusError
            class MockResponse:
                status_code = 500
                text = "Internal Server Error"
            return HTTPStatusError("HTTP error", request=None, response=MockResponse())
        else:
            from httpx import RequestError
            return RequestError("Generic request error")
    
    return _simulate_error


# Performance monitoring fixtures
@pytest.fixture
def performance_monitor():
    """Monitor performance metrics during tests."""
    import time
    import psutil
    
    class PerformanceMonitor:
        def __init__(self):
            self.start_time = None
            self.start_memory = None
            self.metrics = {}
        
        def start(self):
            self.start_time = time.time()
            self.start_memory = psutil.Process().memory_info().rss
        
        def stop(self):
            if self.start_time:
                duration = time.time() - self.start_time
                memory_used = psutil.Process().memory_info().rss - self.start_memory
                self.metrics = {
                    "duration": duration,
                    "memory_used": memory_used,
                    "memory_used_mb": memory_used / 1024 / 1024,
                }
                return self.metrics
            return {}
    
    return PerformanceMonitor()