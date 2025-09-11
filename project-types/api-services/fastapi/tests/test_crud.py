"""
CRUD operations testing with async database for FastAPI.

This module contains comprehensive tests for CRUD operations including:
- Create, Read, Update, Delete operations
- Database transaction handling
- Query optimization and performance
- Data validation and constraints
- Bulk operations
- Search and filtering
- Pagination
- Relationship handling
"""

import pytest
from datetime import datetime, timedelta
from typing import List, Dict, Any
from unittest.mock import AsyncMock, patch

from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from .factories import UserFactory, PostFactory, CommentFactory


class TestUserCRUD:
    """Test User CRUD operations."""
    
    async def test_create_user_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test creating a new user."""
        user_data = UserFactory.create_user_create_data()
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_201_CREATED
        
        created_user = response.json()
        assert created_user["email"] == user_data["email"]
        assert created_user["first_name"] == user_data["first_name"]
        assert created_user["last_name"] == user_data["last_name"]
        assert "password" not in created_user
        assert "id" in created_user
        assert "created_at" in created_user
    
    async def test_get_user_by_id_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test retrieving user by ID."""
        # Create a user first
        user_data = UserFactory.create_user_create_data()
        create_response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        created_user = create_response.json()
        user_id = created_user["id"]
        
        # Retrieve the user
        response = await async_client.get(f"/users/{user_id}", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        retrieved_user = response.json()
        assert retrieved_user["id"] == user_id
        assert retrieved_user["email"] == user_data["email"]
        assert "password" not in retrieved_user
    
    async def test_get_user_nonexistent_id_fails(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test retrieving non-existent user returns 404."""
        response = await async_client.get("/users/99999", headers=auth_headers)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    async def test_update_user_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test updating user information."""
        # Create a user first
        user_data = UserFactory.create_user_create_data()
        create_response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        created_user = create_response.json()
        user_id = created_user["id"]
        
        # Update the user
        update_data = UserFactory.create_user_update_data(
            first_name="Updated",
            last_name="Name"
        )
        
        response = await async_client.put(
            f"/users/{user_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        updated_user = response.json()
        assert updated_user["id"] == user_id
        assert updated_user["first_name"] == "Updated"
        assert updated_user["last_name"] == "Name"
        assert updated_user["email"] == user_data["email"]  # Unchanged
    
    async def test_delete_user_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test deleting a user."""
        # Create a user first
        user_data = UserFactory.create_user_create_data()
        create_response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        created_user = create_response.json()
        user_id = created_user["id"]
        
        # Delete the user
        response = await async_client.delete(f"/users/{user_id}", headers=auth_headers)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify user is deleted
        get_response = await async_client.get(f"/users/{user_id}", headers=auth_headers)
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    async def test_list_users_with_pagination(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test listing users with pagination."""
        # Create multiple users
        users_data = UserFactory.create_multiple_users(15)
        for user_data in users_data:
            await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        # Test pagination
        response = await async_client.get(
            "/users/?skip=0&limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        result = response.json()
        assert "items" in result
        assert "total" in result
        assert "page" in result
        assert "size" in result
        
        assert len(result["items"]) <= 10
        assert result["total"] >= 15
    
    async def test_search_users_by_email(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test searching users by email."""
        # Create users with specific emails
        user1_data = UserFactory.create_user_create_data(email="john.doe@example.com")
        user2_data = UserFactory.create_user_create_data(email="jane.smith@example.com")
        user3_data = UserFactory.create_user_create_data(email="bob.jones@test.com")
        
        await async_client.post("/users/", json=user1_data, headers=auth_headers)
        await async_client.post("/users/", json=user2_data, headers=auth_headers)
        await async_client.post("/users/", json=user3_data, headers=auth_headers)
        
        # Search for users with "example.com" domain
        response = await async_client.get(
            "/users/search?q=example.com",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        results = response.json()
        assert len(results["items"]) == 2
        
        emails = [user["email"] for user in results["items"]]
        assert "john.doe@example.com" in emails
        assert "jane.smith@example.com" in emails
        assert "bob.jones@test.com" not in emails


class TestPostCRUD:
    """Test Post CRUD operations."""
    
    async def test_create_post_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test creating a new post."""
        post_data = PostFactory.create_post_create_data()
        
        response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_201_CREATED
        
        created_post = response.json()
        assert created_post["title"] == post_data["title"]
        assert created_post["content"] == post_data["content"]
        assert created_post["tags"] == post_data["tags"]
        assert "id" in created_post
        assert "created_at" in created_post
        assert "author_id" in created_post
    
    async def test_get_published_posts_only(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test retrieving only published posts for public endpoint."""
        # Create published and unpublished posts
        published_post = PostFactory.create_post_create_data()
        unpublished_post = PostFactory.create_post_create_data()
        
        # Create posts
        await async_client.post("/posts/", json=published_post, headers=auth_headers)
        
        # Create unpublished post (this would require admin/author access)
        response = await async_client.post("/posts/", json=unpublished_post, headers=auth_headers)
        unpublished_id = response.json()["id"]
        
        # Update to unpublished
        await async_client.put(
            f"/posts/{unpublished_id}",
            json={"is_published": False},
            headers=auth_headers
        )
        
        # Get public posts (should only return published)
        response = await async_client.get("/posts/")
        
        assert response.status_code == status.HTTP_200_OK
        
        posts = response.json()
        published_titles = [post["title"] for post in posts["items"]]
        
        assert published_post["title"] in published_titles
        assert unpublished_post["title"] not in published_titles
    
    async def test_update_post_with_tags(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test updating post with new tags."""
        # Create a post
        post_data = PostFactory.create_post_create_data(tags=["python", "fastapi"])
        create_response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        created_post = create_response.json()
        post_id = created_post["id"]
        
        # Update with new tags
        update_data = {
            "title": "Updated Title",
            "tags": ["python", "fastapi", "testing", "async"]
        }
        
        response = await async_client.put(
            f"/posts/{post_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        updated_post = response.json()
        assert updated_post["title"] == "Updated Title"
        assert set(updated_post["tags"]) == {"python", "fastapi", "testing", "async"}
    
    async def test_delete_post_cascade_comments(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test that deleting a post also deletes associated comments."""
        # Create a post
        post_data = PostFactory.create_post_create_data()
        create_response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        created_post = create_response.json()
        post_id = created_post["id"]
        
        # Create comments for the post
        comment1 = CommentFactory.create_comment_create_data(post_id=post_id)
        comment2 = CommentFactory.create_comment_create_data(post_id=post_id)
        
        await async_client.post("/comments/", json=comment1, headers=auth_headers)
        await async_client.post("/comments/", json=comment2, headers=auth_headers)
        
        # Delete the post
        response = await async_client.delete(f"/posts/{post_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify comments are also deleted (or marked as orphaned)
        comments_response = await async_client.get(f"/posts/{post_id}/comments")
        assert comments_response.status_code == status.HTTP_404_NOT_FOUND
    
    async def test_filter_posts_by_author(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test filtering posts by author."""
        # Create posts with different authors
        author1_posts = PostFactory.create_multiple_posts(3, author_id=1)
        author2_posts = PostFactory.create_multiple_posts(2, author_id=2)
        
        for post_data in author1_posts + author2_posts:
            await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        # Filter by author 1
        response = await async_client.get("/posts/?author_id=1", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        result = response.json()
        assert len(result["items"]) == 3
        
        for post in result["items"]:
            assert post["author_id"] == 1
    
    async def test_filter_posts_by_date_range(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test filtering posts by date range."""
        # This test would require creating posts with specific dates
        # Implementation depends on your API design for date filtering
        
        from_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
        to_date = datetime.utcnow().isoformat()
        
        response = await async_client.get(
            f"/posts/?created_from={from_date}&created_to={to_date}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK


class TestBulkOperations:
    """Test bulk CRUD operations."""
    
    async def test_bulk_create_users(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test bulk creating multiple users."""
        users_data = UserFactory.create_multiple_users(10)
        bulk_data = {"users": users_data}
        
        response = await async_client.post(
            "/users/bulk",
            json=bulk_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        
        result = response.json()
        assert "created" in result
        assert result["created"] == 10
        assert "users" in result
        assert len(result["users"]) == 10
    
    async def test_bulk_update_posts(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test bulk updating multiple posts."""
        # Create multiple posts first
        posts_data = PostFactory.create_multiple_posts(5)
        created_posts = []
        
        for post_data in posts_data:
            response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
            created_posts.append(response.json())
        
        # Bulk update
        update_data = {
            "post_ids": [post["id"] for post in created_posts],
            "updates": {"is_published": True}
        }
        
        response = await async_client.put(
            "/posts/bulk",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        result = response.json()
        assert "updated" in result
        assert result["updated"] == 5
    
    async def test_bulk_delete_with_transaction_rollback(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test bulk delete with transaction rollback on partial failure."""
        # Create multiple posts
        posts_data = PostFactory.create_multiple_posts(3)
        created_posts = []
        
        for post_data in posts_data:
            response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
            created_posts.append(response.json())
        
        # Include one non-existent ID to cause partial failure
        delete_ids = [post["id"] for post in created_posts] + [99999]
        
        response = await async_client.delete(
            "/posts/bulk",
            json={"post_ids": delete_ids},
            headers=auth_headers
        )
        
        # Should handle partial failure gracefully
        # Implementation depends on your business logic
        assert response.status_code in [
            status.HTTP_207_MULTI_STATUS,  # Partial success
            status.HTTP_400_BAD_REQUEST,   # Complete failure
            status.HTTP_200_OK             # Success (ignore non-existent)
        ]


class TestDatabaseConstraints:
    """Test database constraints and validation."""
    
    async def test_unique_constraint_violation(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test handling of unique constraint violations."""
        email = "unique@example.com"
        user1_data = UserFactory.create_user_create_data(email=email)
        user2_data = UserFactory.create_user_create_data(email=email)
        
        # First user should be created successfully
        response1 = await async_client.post("/users/", json=user1_data, headers=auth_headers)
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Second user with same email should fail
        response2 = await async_client.post("/users/", json=user2_data, headers=auth_headers)
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        
        error = response2.json()
        assert "email" in error["detail"].lower()
    
    async def test_foreign_key_constraint(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test foreign key constraint validation."""
        # Try to create a post with non-existent author
        post_data = PostFactory.create_post_create_data()
        post_data["author_id"] = 99999  # Non-existent user
        
        response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        error = response.json()
        assert "author" in error["detail"].lower() or "foreign" in error["detail"].lower()
    
    async def test_not_null_constraint(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test NOT NULL constraint validation."""
        # Try to create user without required field
        incomplete_user = {"email": "test@example.com"}  # Missing other required fields
        
        response = await async_client.post("/users/", json=incomplete_user, headers=auth_headers)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestConcurrency:
    """Test concurrent CRUD operations."""
    
    async def test_concurrent_user_creation(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test concurrent creation of users."""
        import asyncio
        
        users_data = UserFactory.create_multiple_users(10)
        
        # Create users concurrently
        tasks = [
            async_client.post("/users/", json=user_data, headers=auth_headers)
            for user_data in users_data
        ]
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Count successful creations
        successful = [
            r for r in responses 
            if not isinstance(r, Exception) and r.status_code == status.HTTP_201_CREATED
        ]
        
        # Should handle concurrency gracefully
        assert len(successful) <= 10  # At most 10 successful
        assert len(successful) > 0    # At least some successful
    
    async def test_concurrent_post_updates(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test concurrent updates to the same post."""
        import asyncio
        
        # Create a post
        post_data = PostFactory.create_post_create_data()
        create_response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        created_post = create_response.json()
        post_id = created_post["id"]
        
        # Concurrent updates
        update_tasks = []
        for i in range(5):
            update_data = {"title": f"Concurrent Update {i}"}
            task = async_client.put(
                f"/posts/{post_id}",
                json=update_data,
                headers=auth_headers
            )
            update_tasks.append(task)
        
        responses = await asyncio.gather(*update_tasks, return_exceptions=True)
        
        # At least one should succeed
        successful = [
            r for r in responses 
            if not isinstance(r, Exception) and r.status_code == status.HTTP_200_OK
        ]
        
        assert len(successful) >= 1


class TestPerformance:
    """Test CRUD operation performance."""
    
    async def test_large_result_set_performance(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
        performance_threshold: dict,
    ):
        """Test performance with large result sets."""
        import time
        
        # Create many posts
        posts_data = PostFactory.create_multiple_posts(100)
        for post_data in posts_data:
            await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        # Measure query performance
        start_time = time.time()
        response = await async_client.get("/posts/?limit=100", headers=auth_headers)
        end_time = time.time()
        
        assert response.status_code == status.HTTP_200_OK
        
        query_time = end_time - start_time
        assert query_time < performance_threshold["database_query_time"]
    
    async def test_bulk_operation_performance(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
        performance_threshold: dict,
    ):
        """Test bulk operation performance."""
        import time
        
        # Bulk create many users
        users_data = UserFactory.create_multiple_users(50)
        bulk_data = {"users": users_data}
        
        start_time = time.time()
        response = await async_client.post(
            "/users/bulk",
            json=bulk_data,
            headers=auth_headers
        )
        end_time = time.time()
        
        assert response.status_code == status.HTTP_201_CREATED
        
        bulk_time = end_time - start_time
        assert bulk_time < performance_threshold["bulk_operation_time"]
    
    async def test_database_connection_pooling(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test database connection pooling under load."""
        import asyncio
        
        # Make many concurrent requests
        tasks = []
        for _ in range(20):
            task = async_client.get("/users/?limit=10", headers=auth_headers)
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All should succeed or handle connection limits gracefully
        successful = [
            r for r in responses 
            if not isinstance(r, Exception) and r.status_code == status.HTTP_200_OK
        ]
        
        # Most should succeed with proper connection pooling
        assert len(successful) >= 15


class TestErrorHandling:
    """Test error handling in CRUD operations."""
    
    async def test_database_connection_error(
        self,
        async_client: AsyncClient,
        database_error_simulation,
        auth_headers: dict,
    ):
        """Test handling of database connection errors."""
        with patch("app.dependencies.get_db") as mock_get_db:
            mock_get_db.side_effect = database_error_simulation("connection")
            
            response = await async_client.get("/users/", headers=auth_headers)
            
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    
    async def test_database_timeout_error(
        self,
        async_client: AsyncClient,
        database_error_simulation,
        auth_headers: dict,
    ):
        """Test handling of database timeout errors."""
        with patch("app.dependencies.get_db") as mock_get_db:
            mock_get_db.side_effect = database_error_simulation("timeout")
            
            response = await async_client.get("/users/", headers=auth_headers)
            
            assert response.status_code in [
                status.HTTP_503_SERVICE_UNAVAILABLE,
                status.HTTP_504_GATEWAY_TIMEOUT
            ]
    
    async def test_transaction_rollback_on_error(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict,
    ):
        """Test transaction rollback when operation fails."""
        # This test requires implementing a scenario where
        # part of a multi-step operation fails
        
        # Create user data that will cause a constraint violation
        # after some operations succeed
        user_data = UserFactory.create_user_create_data()
        
        # This would test a complex operation that should rollback
        # Implementation depends on your specific business logic
        pass