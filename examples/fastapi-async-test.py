"""
FastAPI async testing example with best practices (2024-2025)
Using pytest-asyncio, httpx AsyncClient, and SQLAlchemy 2.0
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import asyncio

# Assume these are your app imports
from app.main import app
from app.database import Base, get_db
from app.models import User, Item
from app.auth import get_current_user
from app.config import settings

# ============= Fixtures =============

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create async test database engine with isolation."""
    # Use separate test database
    TEST_DATABASE_URL = settings.DATABASE_URL.replace("/myapp", "/myapp_test")
    
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,  # Disable connection pooling for tests
        echo=False,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine):
    """Create isolated database session for each test."""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        async with session.begin():
            yield session
            await session.rollback()  # Rollback after each test


@pytest_asyncio.fixture
async def client(db_session):
    """Create async test client with database override."""
    
    # Override database dependency
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Create async client with ASGITransport
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    # Clear overrides
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(client, test_user):
    """Create authenticated client."""
    # Login and get token
    response = await client.post(
        "/auth/token",
        data={
            "username": test_user.email,
            "password": "testpassword"
        }
    )
    token = response.json()["access_token"]
    
    # Set authorization header
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest_asyncio.fixture
async def test_user(db_session):
    """Create test user fixture."""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="$2b$12$..." # Hashed "testpassword"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# ============= Test Examples =============

class TestUserEndpoints:
    """Test user-related endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_user(self, client: AsyncClient):
        """Test user registration."""
        response = await client.post(
            "/users/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "securepassword123"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert "password" not in data  # Password should not be returned
    
    @pytest.mark.asyncio
    async def test_get_user_profile(self, auth_client: AsyncClient, test_user):
        """Test getting user profile (authenticated)."""
        response = await auth_client.get(f"/users/{test_user.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["username"] == test_user.username
    
    @pytest.mark.asyncio
    async def test_update_user_profile(self, auth_client: AsyncClient, test_user):
        """Test updating user profile."""
        response = await auth_client.patch(
            f"/users/{test_user.id}",
            json={"username": "updatedname"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "updatedname"
    
    @pytest.mark.asyncio
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test unauthorized access to protected endpoint."""
        response = await client.get("/users/me")
        assert response.status_code == 401


class TestItemEndpoints:
    """Test item CRUD operations."""
    
    @pytest.mark.asyncio
    async def test_create_item(self, auth_client: AsyncClient):
        """Test creating an item."""
        response = await auth_client.post(
            "/items",
            json={
                "name": "Test Item",
                "description": "A test item",
                "price": 99.99
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Item"
        assert data["price"] == 99.99
    
    @pytest.mark.asyncio
    async def test_list_items_with_pagination(self, client: AsyncClient, db_session):
        """Test listing items with pagination."""
        # Create test items
        for i in range(25):
            item = Item(
                name=f"Item {i}",
                description=f"Description {i}",
                price=i * 10
            )
            db_session.add(item)
        await db_session.commit()
        
        # Test first page
        response = await client.get("/items?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["total"] == 25
        assert data["page"] == 1
        
        # Test second page
        response = await client.get("/items?page=2&limit=10")
        data = response.json()
        assert len(data["items"]) == 10
        assert data["page"] == 2
    
    @pytest.mark.asyncio
    async def test_search_items(self, client: AsyncClient, db_session):
        """Test searching items."""
        # Create test items
        items = [
            Item(name="Apple iPhone", description="Smartphone", price=999),
            Item(name="Apple Watch", description="Smartwatch", price=399),
            Item(name="Samsung Galaxy", description="Smartphone", price=899)
        ]
        db_session.add_all(items)
        await db_session.commit()
        
        # Search for Apple products
        response = await client.get("/items/search?q=Apple")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all("Apple" in item["name"] for item in data)


class TestWebSocketEndpoint:
    """Test WebSocket functionality."""
    
    @pytest.mark.asyncio
    async def test_websocket_connection(self, client: AsyncClient):
        """Test WebSocket connection and messaging."""
        from fastapi.testclient import TestClient
        
        # WebSocket testing requires TestClient (sync)
        with TestClient(app) as sync_client:
            with sync_client.websocket_connect("/ws") as websocket:
                # Send message
                websocket.send_json({"message": "Hello"})
                
                # Receive echo
                data = websocket.receive_json()
                assert data["message"] == "Echo: Hello"


class TestBackgroundTasks:
    """Test background task execution."""
    
    @pytest.mark.asyncio
    async def test_background_task_execution(self, auth_client: AsyncClient, mocker):
        """Test that background tasks are executed."""
        # Mock the background task function
        mock_send_email = mocker.patch("app.tasks.send_email_notification")
        
        # Trigger endpoint with background task
        response = await auth_client.post(
            "/items",
            json={
                "name": "New Item",
                "description": "Triggers email",
                "price": 100
            }
        )
        
        assert response.status_code == 201
        
        # Wait a bit for background task
        await asyncio.sleep(0.1)
        
        # Verify background task was called
        mock_send_email.assert_called_once()


class TestDatabaseTransactions:
    """Test database transaction handling."""
    
    @pytest.mark.asyncio
    async def test_transaction_rollback_on_error(self, auth_client: AsyncClient, db_session):
        """Test that transactions are rolled back on error."""
        initial_count = await db_session.execute("SELECT COUNT(*) FROM items")
        initial_count = initial_count.scalar()
        
        # Try to create item with invalid data that will cause error
        response = await auth_client.post(
            "/items",
            json={
                "name": "x" * 300,  # Exceeds max length
                "price": -100  # Invalid negative price
            }
        )
        
        assert response.status_code == 422
        
        # Verify no item was created
        final_count = await db_session.execute("SELECT COUNT(*) FROM items")
        final_count = final_count.scalar()
        assert final_count == initial_count


# ============= Parametrized Tests =============

@pytest.mark.asyncio
@pytest.mark.parametrize("email,expected_status", [
    ("valid@example.com", 201),
    ("invalid-email", 422),
    ("", 422),
    ("duplicate@example.com", 409)  # Assuming duplicate check
])
async def test_email_validation(client: AsyncClient, email: str, expected_status: int):
    """Test email validation with parametrized inputs."""
    response = await client.post(
        "/users/register",
        json={
            "email": email,
            "username": "testuser",
            "password": "password123"
        }
    )
    assert response.status_code == expected_status


# ============= Performance Tests =============

@pytest.mark.asyncio
@pytest.mark.slow
async def test_bulk_insert_performance(auth_client: AsyncClient):
    """Test bulk insert performance."""
    import time
    
    items = [
        {
            "name": f"Item {i}",
            "description": f"Description {i}",
            "price": i * 10
        }
        for i in range(100)
    ]
    
    start_time = time.time()
    response = await auth_client.post("/items/bulk", json=items)
    end_time = time.time()
    
    assert response.status_code == 201
    assert end_time - start_time < 2.0  # Should complete within 2 seconds