"""
Python/FastAPI Database Testing Helpers
Provides comprehensive database testing utilities for Python applications
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
from typing import Any, AsyncGenerator, Dict, Generator, List, Optional, Type, Union
from unittest.mock import AsyncMock, MagicMock

import pytest
from faker import Faker
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# FastAPI specific imports
try:
    from fastapi import Depends
    from fastapi.testclient import TestClient
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False

# Async database drivers
try:
    import asyncpg
    ASYNCPG_AVAILABLE = True
except ImportError:
    ASYNCPG_AVAILABLE = False

try:
    import aiomysql
    AIOMYSQL_AVAILABLE = True
except ImportError:
    AIOMYSQL_AVAILABLE = False

try:
    import motor.motor_asyncio
    MOTOR_AVAILABLE = True
except ImportError:
    MOTOR_AVAILABLE = False


@dataclass
class DatabaseConfig:
    """Database configuration for testing."""
    driver: str
    host: str = "localhost"
    port: int = 5432
    database: str = "test_db"
    username: str = "test_user"
    password: str = "test_password"
    schema: Optional[str] = None
    ssl: bool = False
    pool_size: int = 5
    max_overflow: int = 10
    echo: bool = False


@dataclass
class TransactionContext:
    """Context for database transactions in tests."""
    session: Union[Session, AsyncSession]
    savepoints: List[str]
    start_time: float
    is_async: bool


class DatabaseTestHelper:
    """Main helper class for database testing."""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.engine = None
        self.async_engine = None
        self.session_factory = None
        self.async_session_factory = None
        self.faker = Faker()
        self._active_transactions: Dict[str, TransactionContext] = {}
        
    def build_url(self, async_driver: bool = False) -> str:
        """Build database URL from config."""
        if self.config.driver == "postgresql":
            driver = "postgresql+asyncpg" if async_driver else "postgresql+psycopg2"
        elif self.config.driver == "mysql":
            driver = "mysql+aiomysql" if async_driver else "mysql+pymysql"
        elif self.config.driver == "sqlite":
            return "sqlite:///:memory:" if not async_driver else "sqlite+aiosqlite:///:memory:"
        else:
            raise ValueError(f"Unsupported driver: {self.config.driver}")
            
        return f"{driver}://{self.config.username}:{self.config.password}@{self.config.host}:{self.config.port}/{self.config.database}"
    
    def setup_sync_engine(self):
        """Set up synchronous SQLAlchemy engine."""
        url = self.build_url(async_driver=False)
        
        if self.config.driver == "sqlite":
            # Special handling for SQLite in-memory
            self.engine = create_engine(
                url,
                poolclass=StaticPool,
                connect_args={"check_same_thread": False},
                echo=self.config.echo
            )
        else:
            self.engine = create_engine(
                url,
                pool_size=self.config.pool_size,
                max_overflow=self.config.max_overflow,
                echo=self.config.echo
            )
            
        self.session_factory = sessionmaker(bind=self.engine)
        
    def setup_async_engine(self):
        """Set up asynchronous SQLAlchemy engine."""
        url = self.build_url(async_driver=True)
        
        if self.config.driver == "sqlite":
            self.async_engine = create_async_engine(
                url,
                poolclass=StaticPool,
                connect_args={"check_same_thread": False},
                echo=self.config.echo
            )
        else:
            self.async_engine = create_async_engine(
                url,
                pool_size=self.config.pool_size,
                max_overflow=self.config.max_overflow,
                echo=self.config.echo
            )
            
        self.async_session_factory = async_sessionmaker(bind=self.async_engine)
    
    @contextmanager
    def transaction(self, rollback: bool = True) -> Generator[Session, None, None]:
        """Context manager for database transactions."""
        if not self.session_factory:
            self.setup_sync_engine()
            
        session = self.session_factory()
        transaction_id = f"sync_{int(time.time() * 1000)}"
        
        try:
            session.begin()
            context = TransactionContext(
                session=session,
                savepoints=[],
                start_time=time.time(),
                is_async=False
            )
            self._active_transactions[transaction_id] = context
            
            yield session
            
            if rollback:
                session.rollback()
            else:
                session.commit()
                
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
            self._active_transactions.pop(transaction_id, None)
    
    @asynccontextmanager
    async def async_transaction(self, rollback: bool = True) -> AsyncGenerator[AsyncSession, None]:
        """Async context manager for database transactions."""
        if not self.async_session_factory:
            self.setup_async_engine()
            
        session = self.async_session_factory()
        transaction_id = f"async_{int(time.time() * 1000)}"
        
        try:
            await session.begin()
            context = TransactionContext(
                session=session,
                savepoints=[],
                start_time=time.time(),
                is_async=True
            )
            self._active_transactions[transaction_id] = context
            
            yield session
            
            if rollback:
                await session.rollback()
            else:
                await session.commit()
                
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
            self._active_transactions.pop(transaction_id, None)
    
    def create_savepoint(self, session: Union[Session, AsyncSession], name: str):
        """Create a savepoint within a transaction."""
        if isinstance(session, AsyncSession):
            return session.execute(text(f"SAVEPOINT {name}"))
        else:
            return session.execute(text(f"SAVEPOINT {name}"))
    
    def rollback_to_savepoint(self, session: Union[Session, AsyncSession], name: str):
        """Rollback to a specific savepoint."""
        if isinstance(session, AsyncSession):
            return session.execute(text(f"ROLLBACK TO SAVEPOINT {name}"))
        else:
            return session.execute(text(f"ROLLBACK TO SAVEPOINT {name}"))
    
    def cleanup_all_transactions(self):
        """Clean up all active transactions."""
        for context in self._active_transactions.values():
            try:
                if context.is_async:
                    # Can't clean up async transactions synchronously
                    logging.warning("Async transaction left open")
                else:
                    context.session.rollback()
                    context.session.close()
            except Exception as e:
                logging.error(f"Error cleaning up transaction: {e}")
        
        self._active_transactions.clear()


class DatabaseSeeder:
    """Database seeding utilities for tests."""
    
    def __init__(self, db_helper: DatabaseTestHelper):
        self.db_helper = db_helper
        self.faker = Faker()
        self.seeded_data: Dict[str, List[Any]] = {}
    
    def seed_users(self, count: int = 10, **overrides) -> List[Dict[str, Any]]:
        """Seed user data."""
        users = []
        for i in range(count):
            user = {
                "id": i + 1,
                "email": self.faker.unique.email(),
                "username": self.faker.unique.user_name(),
                "first_name": self.faker.first_name(),
                "last_name": self.faker.last_name(),
                "is_active": True,
                "is_verified": self.faker.boolean(),
                "created_at": self.faker.date_time_this_year(),
                "updated_at": self.faker.date_time_this_month(),
                **overrides
            }
            users.append(user)
        
        self.seeded_data["users"] = users
        return users
    
    def seed_posts(self, count: int = 20, user_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Seed post data."""
        if not user_ids and "users" in self.seeded_data:
            user_ids = [user["id"] for user in self.seeded_data["users"]]
        elif not user_ids:
            user_ids = [1]  # Default user ID
            
        posts = []
        for i in range(count):
            post = {
                "id": i + 1,
                "title": self.faker.sentence(),
                "slug": self.faker.slug(),
                "content": self.faker.text(max_nb_chars=2000),
                "excerpt": self.faker.text(max_nb_chars=200),
                "status": self.faker.random_element(["draft", "published", "archived"]),
                "user_id": self.faker.random_element(user_ids),
                "view_count": self.faker.random_int(min=0, max=10000),
                "created_at": self.faker.date_time_this_year(),
                "updated_at": self.faker.date_time_this_month(),
            }
            posts.append(post)
        
        self.seeded_data["posts"] = posts
        return posts
    
    def seed_comments(self, count: int = 50, post_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Seed comment data."""
        if not post_ids and "posts" in self.seeded_data:
            post_ids = [post["id"] for post in self.seeded_data["posts"]]
        elif not post_ids:
            post_ids = [1]  # Default post ID
            
        comments = []
        for i in range(count):
            comment = {
                "id": i + 1,
                "content": self.faker.paragraph(),
                "author_name": self.faker.name(),
                "author_email": self.faker.email(),
                "post_id": self.faker.random_element(post_ids),
                "is_approved": self.faker.boolean(),
                "created_at": self.faker.date_time_this_year(),
                "updated_at": self.faker.date_time_this_month(),
            }
            comments.append(comment)
        
        self.seeded_data["comments"] = comments
        return comments
    
    def insert_seed_data(self, session: Session, table_name: str, data: List[Dict[str, Any]]):
        """Insert seeded data into database."""
        for record in data:
            session.execute(text(f"""
                INSERT INTO {table_name} ({', '.join(record.keys())})
                VALUES ({', '.join([f':{key}' for key in record.keys()])})
            """), record)
    
    async def async_insert_seed_data(self, session: AsyncSession, table_name: str, data: List[Dict[str, Any]]):
        """Asynchronously insert seeded data into database."""
        for record in data:
            await session.execute(text(f"""
                INSERT INTO {table_name} ({', '.join(record.keys())})
                VALUES ({', '.join([f':{key}' for key in record.keys()])})
            """), record)
    
    def clear_seeded_data(self):
        """Clear all seeded data."""
        self.seeded_data.clear()


class DatabaseCleaner:
    """Database cleanup utilities for tests."""
    
    def __init__(self, db_helper: DatabaseTestHelper):
        self.db_helper = db_helper
    
    def truncate_tables(self, session: Session, table_names: List[str], cascade: bool = True):
        """Truncate specified tables."""
        if self.db_helper.config.driver == "postgresql":
            cascade_clause = "CASCADE" if cascade else ""
            for table in table_names:
                session.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY {cascade_clause}"))
        elif self.db_helper.config.driver == "mysql":
            session.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            for table in table_names:
                session.execute(text(f"TRUNCATE TABLE {table}"))
            session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        else:  # SQLite
            for table in table_names:
                session.execute(text(f"DELETE FROM {table}"))
    
    async def async_truncate_tables(self, session: AsyncSession, table_names: List[str], cascade: bool = True):
        """Asynchronously truncate specified tables."""
        if self.db_helper.config.driver == "postgresql":
            cascade_clause = "CASCADE" if cascade else ""
            for table in table_names:
                await session.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY {cascade_clause}"))
        elif self.db_helper.config.driver == "mysql":
            await session.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            for table in table_names:
                await session.execute(text(f"TRUNCATE TABLE {table}"))
            await session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        else:  # SQLite
            for table in table_names:
                await session.execute(text(f"DELETE FROM {table}"))
    
    def get_all_tables(self, session: Session) -> List[str]:
        """Get list of all tables in the database."""
        if self.db_helper.config.driver == "postgresql":
            result = session.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
            """))
        elif self.db_helper.config.driver == "mysql":
            result = session.execute(text("SHOW TABLES"))
        else:  # SQLite
            result = session.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            """))
        
        return [row[0] for row in result]


class PerformanceMonitor:
    """Database performance monitoring for tests."""
    
    def __init__(self, db_helper: DatabaseTestHelper):
        self.db_helper = db_helper
        self.query_times: List[float] = []
        self.slow_queries: List[Dict[str, Any]] = []
        self.slow_query_threshold = 1.0  # seconds
    
    def setup_query_monitoring(self):
        """Set up query performance monitoring."""
        if self.db_helper.engine:
            event.listen(self.db_helper.engine, "before_cursor_execute", self._before_cursor_execute)
            event.listen(self.db_helper.engine, "after_cursor_execute", self._after_cursor_execute)
    
    def _before_cursor_execute(self, conn, cursor, statement, parameters, context, executemany):
        """Record query start time."""
        context._query_start_time = time.time()
    
    def _after_cursor_execute(self, conn, cursor, statement, parameters, context, executemany):
        """Record query completion and duration."""
        duration = time.time() - context._query_start_time
        self.query_times.append(duration)
        
        if duration > self.slow_query_threshold:
            self.slow_queries.append({
                "statement": statement,
                "parameters": parameters,
                "duration": duration,
                "timestamp": time.time()
            })
    
    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics."""
        if not self.query_times:
            return {
                "total_queries": 0,
                "avg_query_time": 0,
                "max_query_time": 0,
                "slow_queries": 0
            }
        
        return {
            "total_queries": len(self.query_times),
            "avg_query_time": sum(self.query_times) / len(self.query_times),
            "max_query_time": max(self.query_times),
            "slow_queries": len(self.slow_queries),
            "slow_query_details": self.slow_queries[-5:]  # Last 5 slow queries
        }


class MockDatabaseHelper:
    """Helper for mocking database operations in tests."""
    
    @staticmethod
    def mock_session():
        """Create a mock database session."""
        session = MagicMock(spec=Session)
        session.query.return_value.filter.return_value.first.return_value = None
        session.query.return_value.filter.return_value.all.return_value = []
        session.query.return_value.count.return_value = 0
        return session
    
    @staticmethod
    def mock_async_session():
        """Create a mock async database session."""
        session = AsyncMock(spec=AsyncSession)
        session.execute.return_value.scalar.return_value = None
        session.execute.return_value.fetchall.return_value = []
        return session


# FastAPI specific helpers
if FASTAPI_AVAILABLE:
    class FastAPITestDatabase:
        """FastAPI-specific database testing utilities."""
        
        def __init__(self, db_helper: DatabaseTestHelper):
            self.db_helper = db_helper
        
        def override_get_db(self):
            """Override FastAPI database dependency for testing."""
            def get_test_db():
                with self.db_helper.transaction() as session:
                    yield session
            
            return get_test_db
        
        def override_get_async_db(self):
            """Override FastAPI async database dependency for testing."""
            async def get_test_async_db():
                async with self.db_helper.async_transaction() as session:
                    yield session
            
            return get_test_async_db


# Pytest fixtures
@pytest.fixture
def db_config():
    """Provide default database configuration for tests."""
    return DatabaseConfig(
        driver="sqlite",
        database=":memory:",
        echo=False
    )


@pytest.fixture
def db_helper(db_config):
    """Provide database helper instance."""
    helper = DatabaseTestHelper(db_config)
    yield helper
    helper.cleanup_all_transactions()


@pytest.fixture
def db_session(db_helper):
    """Provide database session for tests."""
    with db_helper.transaction() as session:
        yield session


@pytest.fixture
async def async_db_session(db_helper):
    """Provide async database session for tests."""
    async with db_helper.async_transaction() as session:
        yield session


@pytest.fixture
def db_seeder(db_helper):
    """Provide database seeder instance."""
    return DatabaseSeeder(db_helper)


@pytest.fixture
def db_cleaner(db_helper):
    """Provide database cleaner instance."""
    return DatabaseCleaner(db_helper)


# Utility functions
def assert_query_count(expected_count: int):
    """Decorator to assert number of database queries executed."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would need to be implemented with actual query counting
            # For now, it's a placeholder
            result = func(*args, **kwargs)
            # Assert query count here
            return result
        return wrapper
    return decorator


async def assert_async_query_count(expected_count: int):
    """Async version of query count assertion."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            # Assert async query count here
            return result
        return wrapper
    return decorator


def database_test(rollback: bool = True):
    """Decorator for database tests with automatic transaction management."""
    def decorator(func):
        def wrapper(db_helper, *args, **kwargs):
            with db_helper.transaction(rollback=rollback) as session:
                return func(session, *args, **kwargs)
        return wrapper
    return decorator


def async_database_test(rollback: bool = True):
    """Decorator for async database tests."""
    def decorator(func):
        async def wrapper(db_helper, *args, **kwargs):
            async with db_helper.async_transaction(rollback=rollback) as session:
                return await func(session, *args, **kwargs)
        return wrapper
    return decorator


# Example usage and test patterns
class ExampleDatabaseTests:
    """Example test patterns using the database helpers."""
    
    def test_user_creation(self, db_session, db_seeder):
        """Example test for user creation."""
        users = db_seeder.seed_users(count=5)
        db_seeder.insert_seed_data(db_session, "users", users)
        
        # Test user creation logic here
        result = db_session.execute(text("SELECT COUNT(*) FROM users"))
        assert result.scalar() == 5
    
    async def test_async_user_creation(self, async_db_session, db_seeder):
        """Example async test for user creation."""
        users = db_seeder.seed_users(count=3)
        await db_seeder.async_insert_seed_data(async_db_session, "users", users)
        
        # Test async user creation logic here
        result = await async_db_session.execute(text("SELECT COUNT(*) FROM users"))
        assert result.scalar() == 3
    
    def test_with_cleanup(self, db_session, db_cleaner):
        """Example test with cleanup."""
        # Insert some test data
        db_session.execute(text("INSERT INTO users (email) VALUES ('test@example.com')"))
        
        # Perform test logic
        result = db_session.execute(text("SELECT COUNT(*) FROM users"))
        assert result.scalar() == 1
        
        # Cleanup is automatic due to transaction rollback
    
    @database_test(rollback=True)
    def test_with_decorator(self, session):
        """Example test using the database test decorator."""
        session.execute(text("INSERT INTO users (email) VALUES ('decorated@example.com')"))
        result = session.execute(text("SELECT COUNT(*) FROM users"))
        assert result.scalar() == 1
        # Automatic rollback due to decorator