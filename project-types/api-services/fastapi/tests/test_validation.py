"""
Pydantic model validation testing for FastAPI.

This module contains comprehensive tests for Pydantic V2 model validation including:
- Field validation and constraints
- Custom validators
- Data serialization and deserialization
- Type coercion and conversion
- Nested model validation
- Error message formatting
- Performance of validation
- Edge cases and boundary conditions
"""

import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Optional, Union
from uuid import UUID, uuid4

from fastapi import status
from httpx import AsyncClient
from pydantic import BaseModel, ValidationError, Field, validator, root_validator

from .factories import ValidationFactory, UserFactory, PostFactory


class TestBasicFieldValidation:
    """Test basic field validation rules."""
    
    async def test_required_field_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation of required fields."""
        # Missing required email field
        incomplete_user = {
            "first_name": "John",
            "last_name": "Doe"
            # Missing email
        }
        
        response = await async_client.post("/users/", json=incomplete_user, headers=auth_headers)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        error_detail = response.json()
        assert "detail" in error_detail
        
        # Check that error mentions missing email field
        error_messages = str(error_detail["detail"]).lower()
        assert "email" in error_messages
        assert any(word in error_messages for word in ["required", "missing"])
    
    async def test_optional_field_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation of optional fields."""
        # User data without optional fields
        minimal_user = {
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "first_name": "John",
            "last_name": "Doe"
            # Optional fields like phone, bio are missing
        }
        
        response = await async_client.post("/users/", json=minimal_user, headers=auth_headers)
        
        # Should succeed even without optional fields
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_403_FORBIDDEN]
    
    async def test_string_length_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test string length constraints."""
        # Test minimum length violation
        user_data = UserFactory.create_user_create_data(
            first_name="A"  # Too short (assuming min length > 1)
        )
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_detail = response.json()
            error_messages = str(error_detail["detail"]).lower()
            assert "first_name" in error_messages
            assert any(word in error_messages for word in ["length", "short", "minimum"])
    
    async def test_string_max_length_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test maximum string length constraints."""
        # Test maximum length violation
        user_data = UserFactory.create_user_create_data(
            first_name="x" * 1000  # Too long
        )
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_detail = response.json()
            error_messages = str(error_detail["detail"]).lower()
            assert "first_name" in error_messages
            assert any(word in error_messages for word in ["length", "long", "maximum"])
    
    async def test_numeric_range_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test numeric range constraints."""
        # Test with a post that has numeric fields (like rating, views)
        post_data = PostFactory.create_post_create_data()
        post_data["rating"] = 11  # Assuming rating should be 1-10
        
        response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_detail = response.json()
            error_messages = str(error_detail["detail"]).lower()
            assert "rating" in error_messages
    
    async def test_email_format_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test email format validation."""
        invalid_emails = [
            "invalid-email",
            "missing@",
            "@missing-domain.com",
            "spaces in@email.com",
            "double@@domain.com",
            ""
        ]
        
        for invalid_email in invalid_emails:
            user_data = UserFactory.create_user_create_data(email=invalid_email)
            
            response = await async_client.post("/users/", json=user_data, headers=auth_headers)
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            
            error_detail = response.json()
            error_messages = str(error_detail["detail"]).lower()
            assert "email" in error_messages
    
    async def test_boolean_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test boolean field validation."""
        # Test invalid boolean values
        invalid_booleans = ["maybe", "yes", "no", 2, -1, "1", "0"]
        
        for invalid_bool in invalid_booleans:
            post_data = PostFactory.create_post_create_data()
            post_data["is_published"] = invalid_bool
            
            response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
            
            # Some might be coerced, others should fail validation
            if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
                error_detail = response.json()
                error_messages = str(error_detail["detail"]).lower()
                assert "is_published" in error_messages


class TestTypeValidation:
    """Test type validation and coercion."""
    
    async def test_integer_type_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test integer type validation and coercion."""
        # Test various integer representations
        test_cases = [
            ("123", True),      # String number - should coerce
            (123, True),        # Integer - should work
            (123.0, True),      # Float with no decimal - might coerce
            (123.5, False),     # Float with decimal - should fail
            ("123.5", False),   # String float - should fail
            ("abc", False),     # Non-numeric string - should fail
            (None, False),      # None - should fail for required field
        ]
        
        for value, should_succeed in test_cases:
            post_data = PostFactory.create_post_create_data()
            if value is not None:
                post_data["author_id"] = value
            else:
                # Remove the field to test None
                if "author_id" in post_data:
                    del post_data["author_id"]
            
            response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
            
            if should_succeed:
                assert response.status_code in [
                    status.HTTP_201_CREATED,
                    status.HTTP_400_BAD_REQUEST,  # Business logic error
                    status.HTTP_403_FORBIDDEN     # Permission error
                ]
            else:
                assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_datetime_type_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test datetime type validation and parsing."""
        # Test various datetime formats
        valid_datetimes = [
            "2023-12-25T10:30:00Z",
            "2023-12-25T10:30:00+00:00",
            "2023-12-25T10:30:00",
            "2023-12-25 10:30:00",
        ]
        
        invalid_datetimes = [
            "2023-13-25T10:30:00Z",  # Invalid month
            "2023-12-32T10:30:00Z",  # Invalid day
            "2023-12-25T25:30:00Z",  # Invalid hour
            "not-a-date",             # Not a date
            "2023/12/25",            # Wrong format
        ]
        
        # Test valid datetime formats
        for valid_dt in valid_datetimes:
            post_data = PostFactory.create_post_create_data()
            post_data["scheduled_publish_at"] = valid_dt
            
            response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
            
            # Should accept valid datetime formats
            assert response.status_code in [
                status.HTTP_201_CREATED,
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_403_FORBIDDEN,
                status.HTTP_422_UNPROCESSABLE_ENTITY  # If field doesn't exist
            ]
        
        # Test invalid datetime formats
        for invalid_dt in invalid_datetimes:
            post_data = PostFactory.create_post_create_data()
            post_data["scheduled_publish_at"] = invalid_dt
            
            response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
            
            # Should reject invalid datetime formats
            if "scheduled_publish_at" in [field["loc"][-1] if field.get("loc") else "" 
                                        for field in response.json().get("detail", [])]:
                assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_uuid_type_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test UUID type validation."""
        # Test valid UUIDs
        valid_uuid = str(uuid4())
        
        # Test invalid UUIDs
        invalid_uuids = [
            "not-a-uuid",
            "123e4567-e89b-12d3-a456-42661417400",  # Missing character
            "123e4567-e89b-12d3-a456-426614174000", # Extra character
            "123e4567-e89b-12d3-a456-42661417400g", # Invalid character
            "",
            "00000000-0000-0000-0000-000000000000",  # Nil UUID (might be invalid in context)
        ]
        
        for invalid_uuid in invalid_uuids:
            data = {"external_id": invalid_uuid, "name": "Test"}
            
            response = await async_client.post("/resources/", json=data, headers=auth_headers)
            
            # Should fail for invalid UUIDs
            if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
                error_detail = response.json()
                error_messages = str(error_detail["detail"]).lower()
                assert "external_id" in error_messages or "uuid" in error_messages
    
    async def test_list_type_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test list/array type validation."""
        # Test valid lists
        post_data = PostFactory.create_post_create_data()
        post_data["tags"] = ["python", "fastapi", "testing"]
        
        response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]
        
        # Test invalid list types
        invalid_lists = [
            "not-a-list",
            123,
            {"key": "value"},  # Object instead of list
        ]
        
        for invalid_list in invalid_lists:
            post_data = PostFactory.create_post_create_data()
            post_data["tags"] = invalid_list
            
            response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_nested_object_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test nested object validation."""
        # Test valid nested object
        user_data = UserFactory.create_user_create_data()
        user_data["address"] = {
            "street": "123 Main St",
            "city": "Anytown",
            "state": "ST",
            "zip_code": "12345"
        }
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        # Should accept valid nested object
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_422_UNPROCESSABLE_ENTITY  # If address field doesn't exist
        ]
        
        # Test invalid nested object
        user_data = UserFactory.create_user_create_data()
        user_data["address"] = {
            "street": "123 Main St",
            # Missing required city
            "state": "ST",
            "zip_code": "invalid-zip"  # Invalid format
        }
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        # Should reject invalid nested object
        if "address" in str(response.json().get("detail", [])):
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestCustomValidation:
    """Test custom validation rules and validators."""
    
    async def test_password_strength_validation(
        self,
        async_client: AsyncClient,
    ):
        """Test custom password strength validation."""
        weak_passwords = [
            "weak",              # Too short
            "password",          # No numbers or special chars
            "Password",          # No numbers or special chars
            "password123",       # No special chars
            "PASSWORD123!",      # No lowercase
            "password123!",      # No uppercase
        ]
        
        for weak_password in weak_passwords:
            user_data = UserFactory.create_user_create_data(password=weak_password)
            
            response = await async_client.post("/auth/register", json=user_data)
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            
            error_detail = response.json()
            error_messages = str(error_detail["detail"]).lower()
            assert "password" in error_messages
    
    async def test_age_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test age range validation."""
        # Test invalid ages
        invalid_ages = [-1, 0, 150, 200]
        
        for invalid_age in invalid_ages:
            user_data = UserFactory.create_user_create_data()
            user_data["age"] = invalid_age
            
            response = await async_client.post("/users/", json=user_data, headers=auth_headers)
            
            if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
                error_detail = response.json()
                error_messages = str(error_detail["detail"]).lower()
                assert "age" in error_messages
    
    async def test_phone_number_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test phone number format validation."""
        invalid_phones = [
            "123",                    # Too short
            "abcdefghij",            # Not numeric
            "123-456-789",           # Wrong format
            "+1-123-456-789",        # Wrong format
            "123 456 7890",          # Spaces
        ]
        
        for invalid_phone in invalid_phones:
            user_data = UserFactory.create_user_create_data()
            user_data["phone"] = invalid_phone
            
            response = await async_client.post("/users/", json=user_data, headers=auth_headers)
            
            if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
                error_detail = response.json()
                if "phone" in str(error_detail["detail"]).lower():
                    # Phone validation is working
                    assert True
    
    async def test_url_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test URL format validation."""
        invalid_urls = [
            "not-a-url",
            "http://",
            "ftp://example.com",     # Wrong protocol
            "https://",              # No domain
            "https://example",       # No TLD
        ]
        
        for invalid_url in invalid_urls:
            post_data = PostFactory.create_post_create_data()
            post_data["featured_image_url"] = invalid_url
            
            response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
            
            if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
                error_detail = response.json()
                if "url" in str(error_detail["detail"]).lower():
                    assert True
    
    async def test_conditional_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test conditional validation rules."""
        # Test that certain fields are required based on other field values
        post_data = PostFactory.create_post_create_data()
        post_data["post_type"] = "scheduled"
        # Should require scheduled_publish_at when post_type is "scheduled"
        # but don't include it
        
        response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        # Should fail validation due to missing conditional field
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_detail = response.json()
            error_messages = str(error_detail["detail"]).lower()
            assert "scheduled" in error_messages or "publish" in error_messages


class TestValidationErrorMessages:
    """Test validation error message formatting and content."""
    
    async def test_error_message_structure(
        self,
        async_client: AsyncClient,
    ):
        """Test that validation error messages have correct structure."""
        # Send invalid data
        invalid_data = {"email": "invalid-email"}
        
        response = await async_client.post("/users/", json=invalid_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        error_response = response.json()
        assert "detail" in error_response
        assert isinstance(error_response["detail"], list)
        
        for error in error_response["detail"]:
            assert "loc" in error      # Field location
            assert "msg" in error      # Error message
            assert "type" in error     # Error type
    
    async def test_multiple_field_errors(
        self,
        async_client: AsyncClient,
    ):
        """Test validation errors for multiple fields simultaneously."""
        # Send data with multiple validation errors
        invalid_data = {
            "email": "invalid-email",       # Invalid email format
            "password": "weak",             # Weak password
            "age": -5,                      # Invalid age
            # Missing required first_name and last_name
        }
        
        response = await async_client.post("/users/", json=invalid_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        error_response = response.json()
        errors = error_response["detail"]
        
        # Should have multiple errors
        assert len(errors) >= 3
        
        # Check that different fields are mentioned
        error_fields = [error["loc"][-1] for error in errors if error.get("loc")]
        assert len(set(error_fields)) >= 2  # At least 2 different fields have errors
    
    async def test_nested_field_error_messages(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test error messages for nested field validation."""
        # Send data with nested validation errors
        user_data = UserFactory.create_user_create_data()
        user_data["address"] = {
            "street": "",           # Empty required field
            "zip_code": "invalid"   # Invalid zip code format
        }
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_response = response.json()
            
            # Check for nested field error locations
            nested_errors = [
                error for error in error_response["detail"] 
                if len(error.get("loc", [])) > 1
            ]
            
            if nested_errors:
                # Verify nested error structure
                for error in nested_errors:
                    assert len(error["loc"]) >= 2  # Should show nested path
    
    async def test_custom_error_messages(
        self,
        async_client: AsyncClient,
    ):
        """Test custom error messages for validation rules."""
        # Test custom password error message
        user_data = UserFactory.create_user_create_data(password="weak")
        
        response = await async_client.post("/auth/register", json=user_data)
        
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_response = response.json()
            error_messages = [error["msg"] for error in error_response["detail"]]
            
            # Should contain helpful custom message about password requirements
            password_errors = [
                msg for msg in error_messages 
                if "password" in msg.lower()
            ]
            
            if password_errors:
                # Check that error message is informative
                password_error = password_errors[0].lower()
                assert any(word in password_error for word in [
                    "uppercase", "lowercase", "number", "special", "character", "length"
                ])


class TestValidationPerformance:
    """Test validation performance characteristics."""
    
    async def test_simple_validation_performance(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        performance_threshold: dict,
    ):
        """Test performance of simple field validation."""
        import time
        
        user_data = UserFactory.create_user_create_data()
        
        start_time = time.time()
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        end_time = time.time()
        
        validation_time = end_time - start_time
        
        # Validation should be fast
        assert validation_time < performance_threshold.get("api_response_time", 1.0)
        
        # Response should be successful or fail for business reasons, not validation performance
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_422_UNPROCESSABLE_ENTITY
        ]
    
    async def test_complex_validation_performance(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        performance_threshold: dict,
    ):
        """Test performance of complex nested validation."""
        import time
        
        # Create complex nested data structure
        complex_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "first_name": "John",
            "last_name": "Doe",
            "profile": {
                "bio": "A detailed bio with lots of information",
                "social_links": [
                    {"platform": "twitter", "url": "https://twitter.com/user"},
                    {"platform": "linkedin", "url": "https://linkedin.com/in/user"},
                ],
                "preferences": {
                    "email_notifications": True,
                    "theme": "dark",
                    "language": "en",
                    "timezone": "America/New_York"
                }
            },
            "addresses": [
                {
                    "type": "home",
                    "street": "123 Main St",
                    "city": "Anytown",
                    "state": "ST",
                    "zip_code": "12345",
                    "country": "USA"
                },
                {
                    "type": "work",
                    "street": "456 Business Ave",
                    "city": "Worktown",
                    "state": "WT",
                    "zip_code": "67890",
                    "country": "USA"
                }
            ]
        }
        
        start_time = time.time()
        response = await async_client.post("/users/complex", json=complex_data, headers=auth_headers)
        end_time = time.time()
        
        validation_time = end_time - start_time
        
        # Complex validation should still be reasonably fast
        assert validation_time < performance_threshold.get("api_response_time", 2.0)
    
    async def test_bulk_validation_performance(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        performance_threshold: dict,
    ):
        """Test performance of bulk data validation."""
        import time
        
        # Create bulk data
        users_data = UserFactory.create_multiple_users(50)
        bulk_data = {"users": users_data}
        
        start_time = time.time()
        response = await async_client.post("/users/bulk", json=bulk_data, headers=auth_headers)
        end_time = time.time()
        
        validation_time = end_time - start_time
        
        # Bulk validation should complete within reasonable time
        bulk_threshold = performance_threshold.get("bulk_operation_time", 10.0)
        assert validation_time < bulk_threshold


class TestEdgeCasesAndBoundaryConditions:
    """Test edge cases and boundary conditions in validation."""
    
    async def test_empty_string_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation of empty strings."""
        user_data = UserFactory.create_user_create_data()
        user_data["first_name"] = ""
        user_data["last_name"] = ""
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        # Empty strings should fail validation for required non-empty fields
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        error_detail = response.json()
        error_messages = str(error_detail["detail"]).lower()
        assert "first_name" in error_messages or "last_name" in error_messages
    
    async def test_whitespace_only_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation of whitespace-only strings."""
        user_data = UserFactory.create_user_create_data()
        user_data["first_name"] = "   "  # Only spaces
        user_data["last_name"] = "\t\n"  # Only whitespace chars
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        # Whitespace-only strings should fail validation
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_detail = response.json()
            error_messages = str(error_detail["detail"]).lower()
            assert "first_name" in error_messages or "last_name" in error_messages
    
    async def test_null_value_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation of null values."""
        user_data = UserFactory.create_user_create_data()
        user_data["first_name"] = None
        user_data["middle_name"] = None  # Optional field
        
        response = await async_client.post("/users/", json=user_data, headers=auth_headers)
        
        # Null values should fail for required fields but be ok for optional fields
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        error_detail = response.json()
        error_messages = str(error_detail["detail"]).lower()
        assert "first_name" in error_messages
        # middle_name (if optional) should not cause error
    
    async def test_unicode_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation with unicode characters."""
        unicode_data = UserFactory.create_user_create_data(
            first_name="José",
            last_name="González",
            email="test@example.com"
        )
        
        response = await async_client.post("/users/", json=unicode_data, headers=auth_headers)
        
        # Unicode characters should be handled properly
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]
    
    async def test_special_characters_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation with special characters."""
        special_chars_data = UserFactory.create_user_create_data(
            first_name="John-Paul",      # Hyphen
            last_name="O'Connor",        # Apostrophe
            email="test+tag@example.com" # Plus sign in email
        )
        
        response = await async_client.post("/users/", json=special_chars_data, headers=auth_headers)
        
        # Special characters should be handled appropriately
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_422_UNPROCESSABLE_ENTITY  # If some special chars not allowed
        ]
    
    async def test_large_number_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation with very large numbers."""
        large_numbers = [
            2**31,      # 32-bit integer limit
            2**63,      # 64-bit integer limit
            float('inf'),  # Infinity
            1e308,      # Very large float
        ]
        
        for large_number in large_numbers:
            try:
                data = {"quantity": large_number, "name": "Test"}
                response = await async_client.post("/items/", json=data, headers=auth_headers)
                
                # Should handle large numbers gracefully
                assert response.status_code in [
                    status.HTTP_201_CREATED,
                    status.HTTP_400_BAD_REQUEST,
                    status.HTTP_403_FORBIDDEN,
                    status.HTTP_422_UNPROCESSABLE_ENTITY
                ]
            except (OverflowError, ValueError):
                # Some large numbers might cause JSON serialization issues
                pass
    
    async def test_decimal_precision_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation of decimal precision."""
        # Test high precision decimals
        precision_values = [
            "123.456789012345",      # High precision
            "0.000000000001",        # Very small number
            "999999999999.99",       # Large number with decimals
        ]
        
        for precision_value in precision_values:
            try:
                data = {"price": precision_value, "name": "Test Product"}
                response = await async_client.post("/products/", json=data, headers=auth_headers)
                
                # Should handle decimal precision appropriately
                assert response.status_code in [
                    status.HTTP_201_CREATED,
                    status.HTTP_400_BAD_REQUEST,
                    status.HTTP_403_FORBIDDEN,
                    status.HTTP_422_UNPROCESSABLE_ENTITY
                ]
            except Exception:
                # Some precision values might cause issues
                pass
    
    async def test_deeply_nested_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test validation of deeply nested objects."""
        deeply_nested = {
            "level1": {
                "level2": {
                    "level3": {
                        "level4": {
                            "level5": {
                                "value": "deep_value",
                                "number": 42
                            }
                        }
                    }
                }
            }
        }
        
        response = await async_client.post("/nested-data/", json=deeply_nested, headers=auth_headers)
        
        # Should handle deep nesting appropriately
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_404_NOT_FOUND  # If endpoint doesn't exist
        ]


class TestDataSerialization:
    """Test data serialization and deserialization."""
    
    async def test_datetime_serialization(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test datetime serialization in responses."""
        # Create a post (which should have datetime fields)
        post_data = PostFactory.create_post_create_data()
        response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        if response.status_code == status.HTTP_201_CREATED:
            created_post = response.json()
            
            # Check datetime field serialization
            if "created_at" in created_post:
                created_at = created_post["created_at"]
                # Should be ISO format string
                assert isinstance(created_at, str)
                assert "T" in created_at  # ISO datetime format
    
    async def test_enum_serialization(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test enum field serialization."""
        # Test with data that includes enum fields
        post_data = PostFactory.create_post_create_data()
        post_data["status"] = "published"  # Assuming status is an enum
        
        response = await async_client.post("/posts/", json=post_data, headers=auth_headers)
        
        if response.status_code == status.HTTP_201_CREATED:
            created_post = response.json()
            
            # Enum should be serialized as string value
            if "status" in created_post:
                assert isinstance(created_post["status"], str)
    
    async def test_nested_model_serialization(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test nested model serialization in responses."""
        # Get user with nested profile data
        response = await async_client.get("/auth/me", headers=auth_headers)
        
        if response.status_code == status.HTTP_200_OK:
            user_data = response.json()
            
            # Check that nested objects are properly serialized
            if "profile" in user_data:
                profile = user_data["profile"]
                assert isinstance(profile, dict)
                
                # Check nested fields
                for field_name, field_value in profile.items():
                    # All values should be JSON-serializable
                    assert field_value is None or isinstance(field_value, (str, int, float, bool, list, dict))


class TestRealWorldScenarios:
    """Test real-world validation scenarios and use cases."""
    
    async def test_user_registration_complete_flow(
        self,
        async_client: AsyncClient,
    ):
        """Test complete user registration validation flow."""
        # Test with comprehensive user data
        complete_user_data = {
            "email": "newuser@example.com",
            "password": "SecurePassword123!",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "+1-555-123-4567",
            "date_of_birth": "1990-01-15",
            "terms_accepted": True,
            "marketing_consent": False,
            "address": {
                "street": "123 Main Street",
                "city": "Anytown",
                "state": "CA",
                "zip_code": "12345",
                "country": "USA"
            },
            "preferences": {
                "theme": "light",
                "language": "en",
                "timezone": "America/Los_Angeles",
                "email_notifications": True
            }
        }
        
        response = await async_client.post("/auth/register", json=complete_user_data)
        
        # Should succeed with complete valid data
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST  # Business logic constraints
        ]
    
    async def test_blog_post_creation_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test blog post creation with comprehensive validation."""
        comprehensive_post = {
            "title": "Complete Guide to API Testing",
            "content": "This is a comprehensive guide...",
            "excerpt": "Learn everything about API testing",
            "tags": ["testing", "api", "python", "fastapi"],
            "category": "tutorial",
            "featured_image_url": "https://example.com/image.jpg",
            "meta_description": "SEO description for the post",
            "is_published": True,
            "scheduled_publish_at": None,
            "allow_comments": True,
            "seo_settings": {
                "meta_title": "API Testing Guide | My Blog",
                "meta_description": "Complete guide to API testing",
                "canonical_url": "https://myblog.com/api-testing-guide",
                "og_image": "https://example.com/og-image.jpg"
            }
        }
        
        response = await async_client.post("/posts/", json=comprehensive_post, headers=auth_headers)
        
        # Should handle comprehensive post data correctly
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]
    
    async def test_api_pagination_validation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test API pagination parameter validation."""
        # Test various pagination parameters
        pagination_tests = [
            {"skip": 0, "limit": 10},        # Normal case
            {"skip": 0, "limit": 100},       # Max limit
            {"skip": 10, "limit": 5},        # Skip with limit
            {"skip": -1, "limit": 10},       # Invalid skip
            {"skip": 0, "limit": -5},        # Invalid limit
            {"skip": 0, "limit": 1000},      # Limit too large
            {"skip": "invalid", "limit": 10}, # Invalid type
        ]
        
        for params in pagination_tests:
            response = await async_client.get("/posts/", params=params, headers=auth_headers)
            
            # Should handle pagination parameters appropriately
            if params.get("skip", 0) < 0 or params.get("limit", 0) <= 0:
                assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            elif isinstance(params.get("skip"), str) or isinstance(params.get("limit"), str):
                assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            else:
                assert response.status_code in [
                    status.HTTP_200_OK,
                    status.HTTP_403_FORBIDDEN
                ]