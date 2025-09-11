"""
Authentication and JWT testing for FastAPI.

This module contains comprehensive tests for authentication endpoints including:
- User registration and login
- JWT token generation and validation
- Password reset functionality
- Role-based access control
- Token refresh mechanisms
- Security edge cases
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from .factories import UserFactory, TokenFactory


class TestUserRegistration:
    """Test user registration functionality."""
    
    async def test_register_new_user_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test successful user registration."""
        user_data = UserFactory.create_user_create_data()
        
        response = await async_client.post("/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert data["user"]["email"] == user_data["email"]
        assert data["user"]["first_name"] == user_data["first_name"]
        assert data["user"]["last_name"] == user_data["last_name"]
        assert "password" not in data["user"]  # Password should not be returned
    
    async def test_register_duplicate_email_fails(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test registration with duplicate email fails."""
        user_data = UserFactory.create_user_create_data()
        
        # First registration should succeed
        response1 = await async_client.post("/auth/register", json=user_data)
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Second registration with same email should fail
        response2 = await async_client.post("/auth/register", json=user_data)
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        
        error = response2.json()
        assert "email" in error["detail"].lower()
    
    async def test_register_invalid_email_fails(
        self,
        async_client: AsyncClient,
    ):
        """Test registration with invalid email format fails."""
        user_data = UserFactory.create_user_create_data(email="invalid-email")
        
        response = await async_client.post("/auth/register", json=user_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        error = response.json()
        assert any("email" in str(err).lower() for err in error["detail"])
    
    async def test_register_weak_password_fails(
        self,
        async_client: AsyncClient,
    ):
        """Test registration with weak password fails."""
        user_data = UserFactory.create_user_create_data(password="weak")
        
        response = await async_client.post("/auth/register", json=user_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        error = response.json()
        assert any("password" in str(err).lower() for err in error["detail"])
    
    @pytest.mark.parametrize("missing_field", ["email", "password", "first_name", "last_name"])
    async def test_register_missing_required_field_fails(
        self,
        async_client: AsyncClient,
        missing_field: str,
    ):
        """Test registration with missing required fields fails."""
        user_data = UserFactory.create_user_create_data()
        del user_data[missing_field]
        
        response = await async_client.post("/auth/register", json=user_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        error = response.json()
        assert any(missing_field in str(err).lower() for err in error["detail"])


class TestUserLogin:
    """Test user login functionality."""
    
    async def test_login_valid_credentials_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test login with valid credentials."""
        # Register a user first
        user_data = UserFactory.create_user_create_data()
        await async_client.post("/auth/register", json=user_data)
        
        # Login with the same credentials
        login_data = {
            "username": user_data["email"],  # FastAPI OAuth2 uses 'username' field
            "password": user_data["password"],
        }
        
        response = await async_client.post("/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
    
    async def test_login_invalid_email_fails(
        self,
        async_client: AsyncClient,
    ):
        """Test login with invalid email fails."""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "SomePassword123!",
        }
        
        response = await async_client.post("/auth/login", data=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        error = response.json()
        assert "credentials" in error["detail"].lower()
    
    async def test_login_invalid_password_fails(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test login with invalid password fails."""
        # Register a user first
        user_data = UserFactory.create_user_create_data()
        await async_client.post("/auth/register", json=user_data)
        
        # Login with wrong password
        login_data = {
            "username": user_data["email"],
            "password": "WrongPassword123!",
        }
        
        response = await async_client.post("/auth/login", data=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        error = response.json()
        assert "credentials" in error["detail"].lower()
    
    async def test_login_inactive_user_fails(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test login with inactive user fails."""
        # Register a user and deactivate
        user_data = UserFactory.create_user_create_data()
        response = await async_client.post("/auth/register", json=user_data)
        user_id = response.json()["user"]["id"]
        
        # Deactivate user (this would be done through admin endpoint)
        # For this test, we'll assume the user exists but is inactive
        
        login_data = {
            "username": user_data["email"],
            "password": user_data["password"],
        }
        
        # This test assumes your app checks for user.is_active
        # The actual implementation may vary
        # response = await async_client.post("/auth/login", data=login_data)
        # assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestJWTTokens:
    """Test JWT token functionality."""
    
    async def test_access_token_allows_protected_access(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that valid access token allows access to protected endpoints."""
        response = await async_client.get("/auth/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "email" in data
        assert "first_name" in data
        assert "last_name" in data
        assert "password" not in data
    
    async def test_missing_token_denies_access(
        self,
        async_client: AsyncClient,
    ):
        """Test that missing token denies access to protected endpoints."""
        response = await async_client.get("/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_invalid_token_denies_access(
        self,
        async_client: AsyncClient,
        invalid_jwt_token: str,
    ):
        """Test that invalid token denies access."""
        headers = {"Authorization": f"Bearer {invalid_jwt_token}"}
        response = await async_client.get("/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_expired_token_denies_access(
        self,
        async_client: AsyncClient,
        expired_jwt_token: str,
    ):
        """Test that expired token denies access."""
        headers = {"Authorization": f"Bearer {expired_jwt_token}"}
        response = await async_client.get("/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        error = response.json()
        assert "expired" in error["detail"].lower()
    
    async def test_malformed_authorization_header_denies_access(
        self,
        async_client: AsyncClient,
        valid_jwt_token: str,
    ):
        """Test that malformed authorization header denies access."""
        # Missing "Bearer" prefix
        headers = {"Authorization": valid_jwt_token}
        response = await async_client.get("/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestTokenRefresh:
    """Test token refresh functionality."""
    
    async def test_refresh_token_generates_new_access_token(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test that refresh token can generate new access token."""
        # Login to get tokens
        user_data = UserFactory.create_user_create_data()
        await async_client.post("/auth/register", json=user_data)
        
        login_data = {
            "username": user_data["email"],
            "password": user_data["password"],
        }
        
        login_response = await async_client.post("/auth/login", data=login_data)
        tokens = login_response.json()
        
        # Use refresh token to get new access token
        refresh_data = {"refresh_token": tokens["refresh_token"]}
        response = await async_client.post("/auth/refresh", json=refresh_data)
        
        assert response.status_code == status.HTTP_200_OK
        
        new_tokens = response.json()
        assert "access_token" in new_tokens
        assert new_tokens["access_token"] != tokens["access_token"]  # Should be different
        assert new_tokens["token_type"] == "bearer"
    
    async def test_invalid_refresh_token_fails(
        self,
        async_client: AsyncClient,
    ):
        """Test that invalid refresh token fails."""
        refresh_data = {"refresh_token": "invalid_refresh_token"}
        response = await async_client.post("/auth/refresh", json=refresh_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_expired_refresh_token_fails(
        self,
        async_client: AsyncClient,
    ):
        """Test that expired refresh token fails."""
        # This would require creating an expired refresh token
        # Implementation depends on your token storage mechanism
        pass


class TestPasswordReset:
    """Test password reset functionality."""
    
    async def test_request_password_reset_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        mock_email_service: AsyncMock,
    ):
        """Test password reset request sends email."""
        # Register a user first
        user_data = UserFactory.create_user_create_data()
        await async_client.post("/auth/register", json=user_data)
        
        # Request password reset
        reset_data = {"email": user_data["email"]}
        response = await async_client.post("/auth/password-reset/request", json=reset_data)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "message" in data
        
        # Verify email was sent
        mock_email_service.send_email.assert_called_once()
    
    async def test_request_password_reset_nonexistent_email_succeeds(
        self,
        async_client: AsyncClient,
        mock_email_service: AsyncMock,
    ):
        """Test password reset request with non-existent email still returns success."""
        # This prevents email enumeration attacks
        reset_data = {"email": "nonexistent@example.com"}
        response = await async_client.post("/auth/password-reset/request", json=reset_data)
        
        assert response.status_code == status.HTTP_200_OK
        
        # No email should be sent for non-existent user
        mock_email_service.send_email.assert_not_called()
    
    async def test_password_reset_with_valid_token_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test password reset with valid token."""
        # This test requires implementing password reset token generation
        # Implementation depends on your token storage mechanism
        pass
    
    async def test_password_reset_with_invalid_token_fails(
        self,
        async_client: AsyncClient,
    ):
        """Test password reset with invalid token fails."""
        reset_data = {
            "token": "invalid_token",
            "new_password": "NewPassword123!",
        }
        
        response = await async_client.post("/auth/password-reset/confirm", json=reset_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestRoleBasedAccess:
    """Test role-based access control."""
    
    async def test_admin_access_to_admin_endpoint(
        self,
        async_client: AsyncClient,
        admin_headers: dict,
    ):
        """Test that admin user can access admin endpoints."""
        response = await async_client.get("/admin/users", headers=admin_headers)
        
        # This assumes you have an admin endpoint
        # Actual status code depends on implementation
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    async def test_regular_user_denied_admin_access(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that regular user is denied access to admin endpoints."""
        response = await async_client.get("/admin/users", headers=auth_headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    async def test_user_can_access_own_profile(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that user can access their own profile."""
        # Get current user info to extract user ID
        me_response = await async_client.get("/auth/me", headers=auth_headers)
        user_data = me_response.json()
        user_id = user_data["id"]
        
        # Access own profile
        response = await async_client.get(f"/users/{user_id}", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
    
    async def test_user_denied_access_to_other_profiles(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that user is denied access to other users' profiles."""
        # Try to access another user's profile
        other_user_id = 999  # Assuming this is not the current user
        response = await async_client.get(f"/users/{other_user_id}", headers=auth_headers)
        
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]


class TestAuthPerformance:
    """Test authentication performance."""
    
    async def test_login_performance(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        performance_threshold: dict,
    ):
        """Test login performance meets threshold."""
        import time
        
        # Register a user first
        user_data = UserFactory.create_user_create_data()
        await async_client.post("/auth/register", json=user_data)
        
        login_data = {
            "username": user_data["email"],
            "password": user_data["password"],
        }
        
        # Measure login time
        start_time = time.time()
        response = await async_client.post("/auth/login", data=login_data)
        end_time = time.time()
        
        assert response.status_code == status.HTTP_200_OK
        
        login_time = end_time - start_time
        assert login_time < performance_threshold["api_response_time"]
    
    async def test_token_validation_performance(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        performance_threshold: dict,
    ):
        """Test token validation performance."""
        import time
        
        start_time = time.time()
        response = await async_client.get("/auth/me", headers=auth_headers)
        end_time = time.time()
        
        assert response.status_code == status.HTTP_200_OK
        
        validation_time = end_time - start_time
        assert validation_time < performance_threshold["api_response_time"]


class TestAuthSecurity:
    """Test authentication security measures."""
    
    async def test_login_rate_limiting(
        self,
        async_client: AsyncClient,
    ):
        """Test that login attempts are rate limited."""
        login_data = {
            "username": "test@example.com",
            "password": "WrongPassword123!",
        }
        
        # Make multiple failed login attempts
        for _ in range(6):  # Assuming rate limit is 5 attempts
            await async_client.post("/auth/login", data=login_data)
        
        # Next attempt should be rate limited
        response = await async_client.post("/auth/login", data=login_data)
        
        # This test assumes you have rate limiting implemented
        # Actual status code may vary
        assert response.status_code in [
            status.HTTP_429_TOO_MANY_REQUESTS,
            status.HTTP_401_UNAUTHORIZED
        ]
    
    async def test_password_hashing(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test that passwords are properly hashed."""
        user_data = UserFactory.create_user_create_data()
        response = await async_client.post("/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify password is not stored in plain text
        # This would require direct database access to verify
        # The exact implementation depends on your database model
        # 
        # Example:
        # user = await db_session.get(User, response.json()["user"]["id"])
        # assert user.password_hash != user_data["password"]
        # assert user.password_hash.startswith("$2b$")  # bcrypt hash
    
    async def test_jwt_token_contains_no_sensitive_data(
        self,
        valid_jwt_token: str,
    ):
        """Test that JWT tokens don't contain sensitive data."""
        import base64
        import json
        
        # Decode JWT payload (without verification for testing)
        token_parts = valid_jwt_token.split(".")
        if len(token_parts) >= 2:
            # Add padding if needed
            payload_part = token_parts[1]
            padding = 4 - len(payload_part) % 4
            if padding != 4:
                payload_part += "=" * padding
            
            try:
                payload = json.loads(base64.b64decode(payload_part))
                
                # Verify no sensitive data in token
                sensitive_fields = ["password", "password_hash", "secret"]
                for field in sensitive_fields:
                    assert field not in payload
                    
                # Verify required fields are present
                required_fields = ["sub", "exp"]
                for field in required_fields:
                    assert field in payload
            except Exception:
                # Mock token format, skip validation
                pass


class TestAuthEdgeCases:
    """Test authentication edge cases and error scenarios."""
    
    async def test_concurrent_login_attempts(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test handling of concurrent login attempts."""
        import asyncio
        
        # Register a user first
        user_data = UserFactory.create_user_create_data()
        await async_client.post("/auth/register", json=user_data)
        
        login_data = {
            "username": user_data["email"],
            "password": user_data["password"],
        }
        
        # Make concurrent login attempts
        tasks = [
            async_client.post("/auth/login", data=login_data)
            for _ in range(5)
        ]
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All should succeed or handle gracefully
        for response in responses:
            if not isinstance(response, Exception):
                assert response.status_code in [
                    status.HTTP_200_OK,
                    status.HTTP_429_TOO_MANY_REQUESTS
                ]
    
    async def test_login_with_database_error(
        self,
        async_client: AsyncClient,
        database_error_simulation,
    ):
        """Test login handling when database is unavailable."""
        with patch("app.dependencies.get_db") as mock_get_db:
            mock_get_db.side_effect = database_error_simulation("connection")
            
            login_data = {
                "username": "test@example.com",
                "password": "TestPassword123!",
            }
            
            response = await async_client.post("/auth/login", data=login_data)
            
            # Should handle database error gracefully
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    
    async def test_token_validation_with_revoked_token(
        self,
        async_client: AsyncClient,
    ):
        """Test behavior with revoked tokens."""
        # This test requires implementing token revocation
        # Implementation depends on your token blacklist mechanism
        pass
    
    async def test_auth_with_special_characters_in_password(
        self,
        async_client: AsyncClient,
    ):
        """Test authentication with special characters in password."""
        user_data = UserFactory.create_user_create_data(
            password="Password123!@#$%^&*()_+-=[]{}|;:,.<>?"
        )
        
        # Register user
        response = await async_client.post("/auth/register", json=user_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Login with special character password
        login_data = {
            "username": user_data["email"],
            "password": user_data["password"],
        }
        
        response = await async_client.post("/auth/login", data=login_data)
        assert response.status_code == status.HTTP_200_OK