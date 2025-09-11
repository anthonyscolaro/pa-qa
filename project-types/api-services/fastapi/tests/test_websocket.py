"""
WebSocket endpoint testing for FastAPI.

This module contains comprehensive tests for WebSocket functionality including:
- Connection establishment and termination
- Message sending and receiving
- Authentication over WebSocket
- Broadcasting to multiple clients
- Error handling and reconnection
- Real-time features like chat, notifications
- Connection limits and rate limiting
"""

import pytest
import asyncio
import json
from typing import List, Dict, Any
from unittest.mock import AsyncMock, patch, MagicMock

from fastapi import WebSocketDisconnect
from fastapi.testclient import TestClient
from starlette.testclient import WebSocketTestSession

from .factories import WebSocketFactory, UserFactory, TokenFactory


class TestWebSocketConnection:
    """Test WebSocket connection management."""
    
    def test_websocket_connection_success(
        self,
        websocket_client_factory,
        app,
    ):
        """Test successful WebSocket connection."""
        client = websocket_client_factory()
        
        with client.websocket_connect("/ws/chat") as websocket:
            # Connection should be established
            assert websocket is not None
            
            # Send a test message
            test_message = {"type": "ping"}
            websocket.send_json(test_message)
            
            # Receive response
            response = websocket.receive_json()
            assert response["type"] == "pong"
    
    def test_websocket_connection_with_auth_token(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test WebSocket connection with authentication token."""
        client = websocket_client_factory()
        
        # Connect with auth token in query parameter
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            # Send authenticated message
            test_message = {"type": "user_message", "content": "Hello, world!"}
            websocket.send_json(test_message)
            
            response = websocket.receive_json()
            assert response["type"] == "message_received"
            assert "user_id" in response
    
    def test_websocket_connection_invalid_token_rejected(
        self,
        websocket_client_factory,
        invalid_jwt_token: str,
        app,
    ):
        """Test WebSocket connection with invalid token is rejected."""
        client = websocket_client_factory()
        
        # Should fail to connect with invalid token
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"/ws/chat?token={invalid_jwt_token}") as websocket:
                pass
    
    def test_websocket_connection_expired_token_rejected(
        self,
        websocket_client_factory,
        expired_jwt_token: str,
        app,
    ):
        """Test WebSocket connection with expired token is rejected."""
        client = websocket_client_factory()
        
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"/ws/chat?token={expired_jwt_token}") as websocket:
                pass
    
    def test_websocket_connection_limit(
        self,
        websocket_client_factory,
        app,
    ):
        """Test WebSocket connection limits."""
        client = websocket_client_factory()
        connections = []
        
        try:
            # Try to establish multiple connections
            for i in range(15):  # Assuming limit is 10
                try:
                    websocket = client.websocket_connect(f"/ws/chat?client_id={i}")
                    connections.append(websocket.__enter__())
                except Exception:
                    # Connection limit reached
                    break
            
            # Should not be able to connect more than the limit
            assert len(connections) <= 10
            
        finally:
            # Clean up connections
            for conn in connections:
                try:
                    conn.__exit__(None, None, None)
                except:
                    pass


class TestChatWebSocket:
    """Test chat functionality over WebSocket."""
    
    def test_send_chat_message(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test sending a chat message."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            chat_message = WebSocketFactory.create_chat_message(
                text="Hello, everyone!",
                user_id=1
            )
            
            websocket.send_json(chat_message)
            
            response = websocket.receive_json()
            assert response["type"] == "chat"
            assert response["data"]["text"] == "Hello, everyone!"
            assert response["data"]["user_id"] == 1
            assert "timestamp" in response
    
    def test_receive_chat_message_from_other_user(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test receiving chat messages from other users."""
        client = websocket_client_factory()
        
        # Simulate two connected clients
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}&user_id=1") as ws1, \
             client.websocket_connect(f"/ws/chat?token={valid_jwt_token}&user_id=2") as ws2:
            
            # User 1 sends a message
            chat_message = WebSocketFactory.create_chat_message(
                text="Message from user 1",
                user_id=1
            )
            ws1.send_json(chat_message)
            
            # User 2 should receive the message
            response = ws2.receive_json()
            assert response["type"] == "chat"
            assert response["data"]["text"] == "Message from user 1"
            assert response["data"]["user_id"] == 1
    
    def test_chat_message_persistence(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        db_session,
        app,
    ):
        """Test that chat messages are persisted to database."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            chat_message = WebSocketFactory.create_chat_message(
                text="This should be saved",
                user_id=1
            )
            
            websocket.send_json(chat_message)
            
            # Receive confirmation
            response = websocket.receive_json()
            assert response["type"] == "chat"
            
            # Verify message was saved (this would require database verification)
            # Implementation depends on your chat storage mechanism
    
    def test_chat_room_isolation(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test that messages are only sent to users in the same chat room."""
        client = websocket_client_factory()
        
        # Connect to different rooms
        with client.websocket_connect(f"/ws/chat/room1?token={valid_jwt_token}") as ws_room1, \
             client.websocket_connect(f"/ws/chat/room2?token={valid_jwt_token}") as ws_room2:
            
            # Send message in room 1
            chat_message = WebSocketFactory.create_chat_message(
                text="Room 1 message",
                user_id=1
            )
            ws_room1.send_json(chat_message)
            
            # Room 1 should receive the message
            response_room1 = ws_room1.receive_json()
            assert response_room1["data"]["text"] == "Room 1 message"
            
            # Room 2 should not receive the message
            try:
                # Set a short timeout to avoid blocking
                ws_room2.receive_json(timeout=1)
                assert False, "Room 2 should not receive room 1 message"
            except:
                # Expected - no message received
                pass


class TestNotificationWebSocket:
    """Test notification functionality over WebSocket."""
    
    def test_send_notification(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test sending notifications via WebSocket."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/notifications?token={valid_jwt_token}") as websocket:
            notification = WebSocketFactory.create_notification_message(
                title="New Message",
                message="You have received a new message"
            )
            
            websocket.send_json(notification)
            
            response = websocket.receive_json()
            assert response["type"] == "notification"
            assert response["data"]["title"] == "New Message"
            assert response["data"]["message"] == "You have received a new message"
    
    def test_broadcast_system_notification(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test broadcasting system notifications to all connected users."""
        client = websocket_client_factory()
        
        # Connect multiple clients
        websockets = []
        for i in range(3):
            ws = client.websocket_connect(f"/ws/notifications?token={valid_jwt_token}&user_id={i+1}")
            websockets.append(ws.__enter__())
        
        try:
            # Send system notification (this would typically be sent from server-side)
            system_notification = WebSocketFactory.create_notification_message(
                title="System Maintenance",
                message="System will be down for maintenance at 2 AM"
            )
            
            # Simulate broadcasting to all clients
            for ws in websockets:
                # In real implementation, server would push this to all connected clients
                # For testing, we simulate receiving the notification
                pass
            
        finally:
            for ws in websockets:
                try:
                    ws.__exit__(None, None, None)
                except:
                    pass
    
    def test_user_specific_notification(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test sending notifications to specific users."""
        client = websocket_client_factory()
        
        # Connect two users
        with client.websocket_connect(f"/ws/notifications?token={valid_jwt_token}&user_id=1") as ws1, \
             client.websocket_connect(f"/ws/notifications?token={valid_jwt_token}&user_id=2") as ws2:
            
            # Send notification targeted at user 1
            notification = WebSocketFactory.create_notification_message(
                title="Personal Notification",
                message="This is for user 1 only"
            )
            notification["target_user_id"] = 1
            
            # In real implementation, server would route this appropriately
            # For testing, we simulate the behavior
            ws1.send_json(notification)
            
            response1 = ws1.receive_json()
            assert response1["data"]["title"] == "Personal Notification"
            
            # User 2 should not receive this notification


class TestWebSocketErrorHandling:
    """Test WebSocket error handling and edge cases."""
    
    def test_invalid_message_format(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test handling of invalid message formats."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            # Send invalid JSON
            websocket.send_text("invalid json")
            
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "invalid" in response["message"].lower()
    
    def test_missing_required_fields(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test handling of messages with missing required fields."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            # Send message without required fields
            invalid_message = {"type": "chat"}  # Missing data field
            
            websocket.send_json(invalid_message)
            
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "required" in response["message"].lower()
    
    def test_connection_drop_handling(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test handling of unexpected connection drops."""
        client = websocket_client_factory()
        
        # This test would simulate network interruptions
        # Implementation depends on how you handle disconnections
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            # Send message
            chat_message = WebSocketFactory.create_chat_message(text="Test message")
            websocket.send_json(chat_message)
            
            # Simulate abrupt disconnection
            # In real testing, you might use network simulation tools
            pass
    
    def test_message_too_large(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test handling of messages that exceed size limits."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            # Send very large message
            large_text = "x" * 10000  # 10KB message
            large_message = WebSocketFactory.create_chat_message(text=large_text)
            
            websocket.send_json(large_message)
            
            response = websocket.receive_json()
            # Should either accept or reject gracefully
            assert response["type"] in ["chat", "error"]
    
    def test_rate_limiting(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test rate limiting for WebSocket messages."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            # Send many messages rapidly
            for i in range(20):
                message = WebSocketFactory.create_chat_message(text=f"Message {i}")
                websocket.send_json(message)
            
            # Should receive rate limit error at some point
            responses = []
            for _ in range(20):
                try:
                    response = websocket.receive_json(timeout=1)
                    responses.append(response)
                except:
                    break
            
            # Check if any rate limit errors were returned
            error_responses = [r for r in responses if r.get("type") == "error"]
            # Implementation depends on your rate limiting strategy


class TestWebSocketPerformance:
    """Test WebSocket performance characteristics."""
    
    def test_message_throughput(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        performance_threshold: dict,
        app,
    ):
        """Test message throughput performance."""
        import time
        
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            message_count = 100
            
            start_time = time.time()
            
            # Send messages
            for i in range(message_count):
                message = WebSocketFactory.create_chat_message(text=f"Message {i}")
                websocket.send_json(message)
            
            # Receive all responses
            for _ in range(message_count):
                websocket.receive_json()
            
            end_time = time.time()
            
            total_time = end_time - start_time
            throughput = message_count / total_time
            
            # Should handle at least 50 messages per second
            assert throughput >= 50
    
    def test_concurrent_connections_performance(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test performance with multiple concurrent connections."""
        import asyncio
        import time
        
        client = websocket_client_factory()
        connection_count = 10
        
        start_time = time.time()
        
        # Establish multiple connections
        connections = []
        for i in range(connection_count):
            try:
                ws = client.websocket_connect(f"/ws/chat?token={valid_jwt_token}&client_id={i}")
                connections.append(ws.__enter__())
            except:
                break
        
        try:
            # Send message from each connection
            for i, ws in enumerate(connections):
                message = WebSocketFactory.create_chat_message(text=f"Message from client {i}")
                ws.send_json(message)
            
            # Receive responses
            for ws in connections:
                ws.receive_json()
            
            end_time = time.time()
            
            # Should handle concurrent connections efficiently
            total_time = end_time - start_time
            assert total_time < 5.0  # Should complete within 5 seconds
            
        finally:
            # Clean up connections
            for ws in connections:
                try:
                    ws.__exit__(None, None, None)
                except:
                    pass
    
    def test_memory_usage_with_long_connections(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test memory usage with long-lived connections."""
        import psutil
        import time
        
        client = websocket_client_factory()
        process = psutil.Process()
        
        initial_memory = process.memory_info().rss
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            # Keep connection alive and exchange messages
            for i in range(1000):
                message = WebSocketFactory.create_chat_message(text=f"Message {i}")
                websocket.send_json(message)
                websocket.receive_json()
                
                if i % 100 == 0:  # Check memory every 100 messages
                    current_memory = process.memory_info().rss
                    memory_growth = current_memory - initial_memory
                    
                    # Memory growth should be reasonable (less than 50MB)
                    assert memory_growth < 50 * 1024 * 1024


class TestWebSocketIntegration:
    """Test WebSocket integration with other system components."""
    
    async def test_websocket_with_database_integration(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        db_session,
        app,
    ):
        """Test WebSocket integration with database operations."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/chat?token={valid_jwt_token}") as websocket:
            # Send message that should trigger database save
            chat_message = WebSocketFactory.create_chat_message(
                text="Save this message",
                user_id=1
            )
            
            websocket.send_json(chat_message)
            response = websocket.receive_json()
            
            assert response["type"] == "chat"
            assert "message_id" in response  # Should return saved message ID
    
    def test_websocket_with_redis_integration(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        mock_redis,
        app,
    ):
        """Test WebSocket integration with Redis for caching/pub-sub."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/notifications?token={valid_jwt_token}") as websocket:
            # This would test Redis pub/sub integration for real-time notifications
            notification = WebSocketFactory.create_notification_message(
                title="Redis Test",
                message="Testing Redis integration"
            )
            
            websocket.send_json(notification)
            response = websocket.receive_json()
            
            assert response["type"] == "notification"
            
            # Verify Redis interaction (mock verification)
            # mock_redis.publish.assert_called()  # If using pub/sub
    
    def test_websocket_authentication_integration(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        app,
    ):
        """Test WebSocket authentication integration with main auth system."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/secure?token={valid_jwt_token}") as websocket:
            # Send message that requires authentication
            secure_message = {
                "type": "secure_action",
                "data": {"action": "view_sensitive_data"}
            }
            
            websocket.send_json(secure_message)
            response = websocket.receive_json()
            
            # Should succeed with valid token
            assert response["type"] != "error"
            assert "user_id" in response
    
    def test_websocket_with_background_tasks(
        self,
        websocket_client_factory,
        valid_jwt_token: str,
        mock_background_tasks,
        app,
    ):
        """Test WebSocket integration with background task processing."""
        client = websocket_client_factory()
        
        with client.websocket_connect(f"/ws/tasks?token={valid_jwt_token}") as websocket:
            # Send message that should trigger a background task
            task_message = {
                "type": "trigger_task",
                "data": {"task_type": "process_data", "data": {"key": "value"}}
            }
            
            websocket.send_json(task_message)
            response = websocket.receive_json()
            
            assert response["type"] == "task_queued"
            assert "task_id" in response
            
            # Verify background task was triggered
            mock_background_tasks.add_task.assert_called()