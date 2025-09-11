"""
Test data factories for FastAPI testing.

This module provides factory functions and classes for generating test data
using Factory Boy pattern and Faker for realistic data generation.
"""

import random
import string
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

from faker import Faker

# Initialize Faker instance
fake = Faker()


class UserFactory:
    """Factory for creating user test data."""
    
    @staticmethod
    def create_user_data(
        email: Optional[str] = None,
        password: str = "TestPassword123!",
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        is_active: bool = True,
        is_verified: bool = True,
        is_superuser: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Create user data dictionary."""
        return {
            "email": email or fake.email(),
            "password": password,
            "first_name": first_name or fake.first_name(),
            "last_name": last_name or fake.last_name(),
            "is_active": is_active,
            "is_verified": is_verified,
            "is_superuser": is_superuser,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            **kwargs
        }
    
    @staticmethod
    def create_user_create_data(
        email: Optional[str] = None,
        password: str = "TestPassword123!",
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create user creation data (without internal fields)."""
        return {
            "email": email or fake.email(),
            "password": password,
            "first_name": first_name or fake.first_name(),
            "last_name": last_name or fake.last_name(),
            **kwargs
        }
    
    @staticmethod
    def create_user_update_data(
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create user update data."""
        return {
            "first_name": first_name or fake.first_name(),
            "last_name": last_name or fake.last_name(),
            **kwargs
        }
    
    @staticmethod
    def create_admin_user_data(**kwargs) -> Dict[str, Any]:
        """Create admin user data."""
        return UserFactory.create_user_data(
            email="admin@example.com",
            is_superuser=True,
            **kwargs
        )
    
    @staticmethod
    def create_multiple_users(count: int = 5) -> List[Dict[str, Any]]:
        """Create multiple user data objects."""
        return [UserFactory.create_user_data() for _ in range(count)]


class PostFactory:
    """Factory for creating post test data."""
    
    @staticmethod
    def create_post_data(
        title: Optional[str] = None,
        content: Optional[str] = None,
        author_id: Optional[int] = None,
        is_published: bool = True,
        tags: Optional[List[str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create post data dictionary."""
        return {
            "title": title or fake.sentence(nb_words=6)[:-1],  # Remove trailing period
            "content": content or fake.text(max_nb_chars=2000),
            "author_id": author_id or random.randint(1, 100),
            "is_published": is_published,
            "tags": tags or [fake.word() for _ in range(random.randint(1, 5))],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "published_at": datetime.utcnow() if is_published else None,
            "views": random.randint(0, 10000),
            "likes": random.randint(0, 1000),
            **kwargs
        }
    
    @staticmethod
    def create_post_create_data(
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[List[str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create post creation data."""
        return {
            "title": title or fake.sentence(nb_words=6)[:-1],
            "content": content or fake.text(max_nb_chars=2000),
            "tags": tags or [fake.word() for _ in range(random.randint(1, 5))],
            **kwargs
        }
    
    @staticmethod
    def create_post_update_data(
        title: Optional[str] = None,
        content: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create post update data."""
        return {
            "title": title or fake.sentence(nb_words=6)[:-1],
            "content": content or fake.text(max_nb_chars=2000),
            **kwargs
        }
    
    @staticmethod
    def create_multiple_posts(count: int = 10, author_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Create multiple post data objects."""
        return [PostFactory.create_post_data(author_id=author_id) for _ in range(count)]


class CommentFactory:
    """Factory for creating comment test data."""
    
    @staticmethod
    def create_comment_data(
        content: Optional[str] = None,
        author_id: Optional[int] = None,
        post_id: Optional[int] = None,
        parent_id: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create comment data dictionary."""
        return {
            "content": content or fake.text(max_nb_chars=500),
            "author_id": author_id or random.randint(1, 100),
            "post_id": post_id or random.randint(1, 100),
            "parent_id": parent_id,
            "is_approved": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "likes": random.randint(0, 100),
            **kwargs
        }
    
    @staticmethod
    def create_comment_create_data(
        content: Optional[str] = None,
        post_id: Optional[int] = None,
        parent_id: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create comment creation data."""
        return {
            "content": content or fake.text(max_nb_chars=500),
            "post_id": post_id or random.randint(1, 100),
            "parent_id": parent_id,
            **kwargs
        }
    
    @staticmethod
    def create_multiple_comments(
        count: int = 5,
        post_id: Optional[int] = None,
        author_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Create multiple comment data objects."""
        return [
            CommentFactory.create_comment_data(post_id=post_id, author_id=author_id)
            for _ in range(count)
        ]


class FileFactory:
    """Factory for creating file test data."""
    
    @staticmethod
    def create_file_data(
        filename: Optional[str] = None,
        content_type: str = "image/jpeg",
        size: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create file data dictionary."""
        return {
            "filename": filename or f"{fake.word()}.jpg",
            "content_type": content_type,
            "size": size or random.randint(1024, 10485760),  # 1KB to 10MB
            "url": f"https://example.com/files/{uuid4()}",
            "key": f"files/{uuid4()}",
            "uploaded_at": datetime.utcnow(),
            "is_public": random.choice([True, False]),
            **kwargs
        }
    
    @staticmethod
    def create_image_file_data(**kwargs) -> Dict[str, Any]:
        """Create image file data."""
        return FileFactory.create_file_data(
            filename=f"{fake.word()}.jpg",
            content_type="image/jpeg",
            **kwargs
        )
    
    @staticmethod
    def create_document_file_data(**kwargs) -> Dict[str, Any]:
        """Create document file data."""
        return FileFactory.create_file_data(
            filename=f"{fake.word()}.pdf",
            content_type="application/pdf",
            **kwargs
        )
    
    @staticmethod
    def create_multiple_files(count: int = 3) -> List[Dict[str, Any]]:
        """Create multiple file data objects."""
        return [FileFactory.create_file_data() for _ in range(count)]


class TokenFactory:
    """Factory for creating token test data."""
    
    @staticmethod
    def create_token_payload(
        user_id: int = 1,
        email: str = "test@example.com",
        role: str = "user",
        **kwargs
    ) -> Dict[str, Any]:
        """Create JWT token payload."""
        return {
            "sub": email,
            "user_id": user_id,
            "role": role,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=24),
            **kwargs
        }
    
    @staticmethod
    def create_admin_token_payload(**kwargs) -> Dict[str, Any]:
        """Create admin JWT token payload."""
        return TokenFactory.create_token_payload(
            user_id=1,
            email="admin@example.com",
            role="admin",
            **kwargs
        )
    
    @staticmethod
    def create_expired_token_payload(**kwargs) -> Dict[str, Any]:
        """Create expired JWT token payload."""
        return TokenFactory.create_token_payload(
            exp=datetime.utcnow() - timedelta(hours=1),
            **kwargs
        )
    
    @staticmethod
    def create_refresh_token_data(
        user_id: int = 1,
        expires_at: Optional[datetime] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create refresh token data."""
        return {
            "token": "".join(random.choices(string.ascii_letters + string.digits, k=32)),
            "user_id": user_id,
            "expires_at": expires_at or datetime.utcnow() + timedelta(days=30),
            "created_at": datetime.utcnow(),
            "is_active": True,
            **kwargs
        }


class EmailFactory:
    """Factory for creating email test data."""
    
    @staticmethod
    def create_email_data(
        to_email: Optional[str] = None,
        subject: Optional[str] = None,
        body: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create email data dictionary."""
        return {
            "to_email": to_email or fake.email(),
            "subject": subject or fake.sentence(nb_words=8)[:-1],
            "body": body or fake.text(max_nb_chars=1000),
            "from_email": "noreply@example.com",
            "template": "default",
            "sent_at": datetime.utcnow(),
            "status": "sent",
            **kwargs
        }
    
    @staticmethod
    def create_welcome_email_data(user_email: str, **kwargs) -> Dict[str, Any]:
        """Create welcome email data."""
        return EmailFactory.create_email_data(
            to_email=user_email,
            subject="Welcome to our platform!",
            template="welcome",
            **kwargs
        )
    
    @staticmethod
    def create_password_reset_email_data(user_email: str, **kwargs) -> Dict[str, Any]:
        """Create password reset email data."""
        return EmailFactory.create_email_data(
            to_email=user_email,
            subject="Password Reset Request",
            template="password_reset",
            **kwargs
        )


class WebSocketFactory:
    """Factory for creating WebSocket test data."""
    
    @staticmethod
    def create_websocket_message(
        message_type: str = "chat",
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create WebSocket message data."""
        return {
            "type": message_type,
            "data": data or {"text": fake.text(max_nb_chars=200)},
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": random.randint(1, 100),
            **kwargs
        }
    
    @staticmethod
    def create_chat_message(
        text: Optional[str] = None,
        user_id: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create chat message data."""
        return WebSocketFactory.create_websocket_message(
            message_type="chat",
            data={
                "text": text or fake.text(max_nb_chars=200),
                "user_id": user_id or random.randint(1, 100),
            },
            **kwargs
        )
    
    @staticmethod
    def create_notification_message(
        title: Optional[str] = None,
        message: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create notification message data."""
        return WebSocketFactory.create_websocket_message(
            message_type="notification",
            data={
                "title": title or fake.sentence(nb_words=4)[:-1],
                "message": message or fake.text(max_nb_chars=100),
                "level": random.choice(["info", "warning", "error", "success"]),
            },
            **kwargs
        )


class BackgroundTaskFactory:
    """Factory for creating background task test data."""
    
    @staticmethod
    def create_task_data(
        task_name: Optional[str] = None,
        args: Optional[List[Any]] = None,
        kwargs: Optional[Dict[str, Any]] = None,
        **extra_kwargs
    ) -> Dict[str, Any]:
        """Create background task data."""
        return {
            "task_name": task_name or "test_task",
            "args": args or [],
            "kwargs": kwargs or {},
            "created_at": datetime.utcnow(),
            "status": "pending",
            "priority": random.randint(1, 10),
            "retry_count": 0,
            "max_retries": 3,
            **extra_kwargs
        }
    
    @staticmethod
    def create_email_task_data(
        to_email: str,
        subject: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Create email sending task data."""
        return BackgroundTaskFactory.create_task_data(
            task_name="send_email",
            kwargs={
                "to_email": to_email,
                "subject": subject,
                "template": "default",
                "context": {},
            },
            **kwargs
        )
    
    @staticmethod
    def create_file_processing_task_data(
        file_id: int,
        operation: str = "resize",
        **kwargs
    ) -> Dict[str, Any]:
        """Create file processing task data."""
        return BackgroundTaskFactory.create_task_data(
            task_name="process_file",
            args=[file_id],
            kwargs={"operation": operation},
            **kwargs
        )
    
    @staticmethod
    def create_bulk_operation_task_data(
        operation: str,
        item_ids: List[int],
        **kwargs
    ) -> Dict[str, Any]:
        """Create bulk operation task data."""
        return BackgroundTaskFactory.create_task_data(
            task_name="bulk_operation",
            kwargs={
                "operation": operation,
                "item_ids": item_ids,
                "batch_size": 100,
            },
            **kwargs
        )


class ValidationFactory:
    """Factory for creating validation test data."""
    
    @staticmethod
    def create_valid_data(model_type: str) -> Dict[str, Any]:
        """Create valid data for different model types."""
        if model_type == "user":
            return UserFactory.create_user_create_data()
        elif model_type == "post":
            return PostFactory.create_post_create_data()
        elif model_type == "comment":
            return CommentFactory.create_comment_create_data()
        else:
            raise ValueError(f"Unknown model type: {model_type}")
    
    @staticmethod
    def create_invalid_data(model_type: str, field: str) -> Dict[str, Any]:
        """Create invalid data for testing validation errors."""
        valid_data = ValidationFactory.create_valid_data(model_type)
        
        if field == "email":
            valid_data["email"] = "invalid-email"
        elif field == "password":
            valid_data["password"] = "weak"  # Too short
        elif field == "required":
            # Remove a required field
            if "email" in valid_data:
                del valid_data["email"]
            elif "title" in valid_data:
                del valid_data["title"]
            elif "content" in valid_data:
                del valid_data["content"]
        elif field == "length":
            # Make a field too long
            if "title" in valid_data:
                valid_data["title"] = "x" * 1000  # Assuming max length is less
            elif "content" in valid_data:
                valid_data["content"] = "x" * 100000  # Very long content
        elif field == "type":
            # Wrong data type
            if "is_published" in valid_data:
                valid_data["is_published"] = "not_boolean"
            elif "author_id" in valid_data:
                valid_data["author_id"] = "not_integer"
        
        return valid_data
    
    @staticmethod
    def create_boundary_data(model_type: str) -> Dict[str, List[Dict[str, Any]]]:
        """Create boundary test cases for validation."""
        base_data = ValidationFactory.create_valid_data(model_type)
        
        boundary_cases = {
            "minimum": base_data.copy(),
            "maximum": base_data.copy(),
        }
        
        # Modify based on model type
        if model_type == "user":
            boundary_cases["minimum"]["password"] = "Pass123!"  # Minimum valid
            boundary_cases["maximum"]["first_name"] = "x" * 50  # Maximum length
            boundary_cases["maximum"]["last_name"] = "y" * 50
        elif model_type == "post":
            boundary_cases["minimum"]["title"] = "x" * 3  # Minimum length
            boundary_cases["minimum"]["content"] = "y" * 10
            boundary_cases["maximum"]["title"] = "x" * 200  # Maximum length
            boundary_cases["maximum"]["content"] = "y" * 10000
        
        return boundary_cases


# Utility functions for test data generation
def generate_random_string(length: int = 10) -> str:
    """Generate random string of specified length."""
    return "".join(random.choices(string.ascii_letters, k=length))


def generate_random_email(domain: str = "example.com") -> str:
    """Generate random email address."""
    return f"{generate_random_string(8).lower()}@{domain}"


def generate_test_image_data() -> bytes:
    """Generate test image data."""
    # Simple 1x1 pixel PNG
    return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'


def generate_test_csv_data(rows: int = 10) -> str:
    """Generate test CSV data."""
    lines = ["name,email,age"]
    for _ in range(rows):
        lines.append(f"{fake.name()},{fake.email()},{random.randint(18, 80)}")
    return "\n".join(lines)


def generate_test_json_data(count: int = 5) -> List[Dict[str, Any]]:
    """Generate test JSON data."""
    return [
        {
            "id": i + 1,
            "name": fake.name(),
            "email": fake.email(),
            "address": fake.address(),
            "created_at": fake.date_time().isoformat(),
        }
        for i in range(count)
    ]


# Export all factories
__all__ = [
    "UserFactory",
    "PostFactory",
    "CommentFactory",
    "FileFactory",
    "TokenFactory",
    "EmailFactory",
    "WebSocketFactory",
    "BackgroundTaskFactory",
    "ValidationFactory",
    "generate_random_string",
    "generate_random_email",
    "generate_test_image_data",
    "generate_test_csv_data",
    "generate_test_json_data",
]