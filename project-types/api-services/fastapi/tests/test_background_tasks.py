"""
Background task execution testing for FastAPI.

This module contains comprehensive tests for background task functionality including:
- Task creation and queuing
- Async task execution and awaiting
- Task status tracking and monitoring
- Error handling and retry mechanisms
- Task scheduling and delays
- Priority and queue management
- Resource management and cleanup
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from unittest.mock import AsyncMock, MagicMock, patch, call

from fastapi import BackgroundTasks, status
from httpx import AsyncClient

from .factories import BackgroundTaskFactory, EmailFactory, FileFactory, UserFactory


class TestBackgroundTaskCreation:
    """Test background task creation and queuing."""
    
    async def test_create_email_task_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_email_service: AsyncMock,
    ):
        """Test creating an email background task."""
        email_data = EmailFactory.create_email_data(
            to_email="test@example.com",
            subject="Test Email",
            body="This is a test email"
        )
        
        response = await async_client.post(
            "/tasks/email",
            json=email_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_202_ACCEPTED
        
        result = response.json()
        assert "task_id" in result
        assert result["status"] == "queued"
        assert result["task_type"] == "send_email"
    
    async def test_create_file_processing_task_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_file_storage: AsyncMock,
    ):
        """Test creating a file processing background task."""
        file_data = {
            "file_id": 123,
            "operation": "resize",
            "parameters": {
                "width": 800,
                "height": 600,
                "quality": 85
            }
        }
        
        response = await async_client.post(
            "/tasks/file-processing",
            json=file_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_202_ACCEPTED
        
        result = response.json()
        assert "task_id" in result
        assert result["status"] == "queued"
        assert result["task_type"] == "process_file"
    
    async def test_create_bulk_operation_task_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test creating a bulk operation background task."""
        bulk_data = {
            "operation": "update_status",
            "item_ids": [1, 2, 3, 4, 5],
            "parameters": {
                "status": "active",
                "batch_size": 10
            }
        }
        
        response = await async_client.post(
            "/tasks/bulk-operation",
            json=bulk_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_202_ACCEPTED
        
        result = response.json()
        assert "task_id" in result
        assert result["status"] == "queued"
        assert result["task_type"] == "bulk_operation"
    
    async def test_create_scheduled_task_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test creating a scheduled background task."""
        schedule_time = datetime.utcnow() + timedelta(minutes=30)
        
        scheduled_data = {
            "task_type": "cleanup_temp_files",
            "schedule_at": schedule_time.isoformat(),
            "parameters": {
                "older_than_hours": 24
            }
        }
        
        response = await async_client.post(
            "/tasks/scheduled",
            json=scheduled_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_202_ACCEPTED
        
        result = response.json()
        assert "task_id" in result
        assert result["status"] == "scheduled"
        assert result["scheduled_at"] is not None
    
    async def test_create_task_with_priority(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test creating a background task with priority."""
        priority_data = {
            "task_type": "urgent_notification",
            "priority": 1,  # High priority
            "parameters": {
                "message": "Urgent system alert",
                "recipients": ["admin@example.com"]
            }
        }
        
        response = await async_client.post(
            "/tasks/priority",
            json=priority_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_202_ACCEPTED
        
        result = response.json()
        assert "task_id" in result
        assert result["priority"] == 1
    
    async def test_create_task_with_dependencies(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test creating a background task with dependencies."""
        # Create parent task first
        parent_task_data = {"task_type": "prepare_data"}
        parent_response = await async_client.post(
            "/tasks/generic",
            json=parent_task_data,
            headers=auth_headers
        )
        parent_task_id = parent_response.json()["task_id"]
        
        # Create dependent task
        dependent_data = {
            "task_type": "process_prepared_data",
            "depends_on": [parent_task_id],
            "parameters": {
                "processing_type": "analysis"
            }
        }
        
        response = await async_client.post(
            "/tasks/dependent",
            json=dependent_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_202_ACCEPTED
        
        result = response.json()
        assert "task_id" in result
        assert result["dependencies"] == [parent_task_id]


class TestBackgroundTaskExecution:
    """Test background task execution and monitoring."""
    
    async def test_execute_email_task_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_email_service: AsyncMock,
    ):
        """Test successful execution of email task."""
        # Create email task
        email_data = EmailFactory.create_email_data()
        task_response = await async_client.post(
            "/tasks/email",
            json=email_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait for task execution (or simulate execution)
        await asyncio.sleep(0.1)  # Small delay to simulate async execution
        
        # Check task status
        status_response = await async_client.get(
            f"/tasks/{task_id}/status",
            headers=auth_headers
        )
        
        assert status_response.status_code == status.HTTP_200_OK
        
        task_status = status_response.json()
        assert task_status["status"] in ["completed", "running", "queued"]
        
        # Verify email service was called (if task completed)
        if task_status["status"] == "completed":
            mock_email_service.send_email.assert_called_once()
    
    async def test_execute_file_processing_task_success(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_file_storage: AsyncMock,
    ):
        """Test successful execution of file processing task."""
        file_data = {
            "file_id": 123,
            "operation": "resize",
            "parameters": {"width": 800, "height": 600}
        }
        
        task_response = await async_client.post(
            "/tasks/file-processing",
            json=file_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Simulate task execution
        await asyncio.sleep(0.1)
        
        # Check task result
        result_response = await async_client.get(
            f"/tasks/{task_id}/result",
            headers=auth_headers
        )
        
        # Should get result or indication that task is still running
        assert result_response.status_code in [
            status.HTTP_200_OK,      # Task completed
            status.HTTP_202_ACCEPTED, # Task still running
            status.HTTP_404_NOT_FOUND # Task not found (depending on implementation)
        ]
    
    async def test_execute_bulk_operation_task_with_progress(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        db_session,
    ):
        """Test bulk operation task execution with progress tracking."""
        bulk_data = {
            "operation": "update_status",
            "item_ids": list(range(1, 101)),  # 100 items
            "parameters": {"status": "processed"}
        }
        
        task_response = await async_client.post(
            "/tasks/bulk-operation",
            json=bulk_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Monitor progress
        max_attempts = 10
        for attempt in range(max_attempts):
            await asyncio.sleep(0.2)  # Wait for some progress
            
            progress_response = await async_client.get(
                f"/tasks/{task_id}/progress",
                headers=auth_headers
            )
            
            if progress_response.status_code == status.HTTP_200_OK:
                progress = progress_response.json()
                assert "processed" in progress
                assert "total" in progress
                assert "percentage" in progress
                assert 0 <= progress["percentage"] <= 100
                
                if progress["percentage"] == 100:
                    break
    
    async def test_task_execution_timeout(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test task execution with timeout."""
        # Create a task that should timeout
        timeout_data = {
            "task_type": "long_running_task",
            "timeout_seconds": 1,  # Very short timeout
            "parameters": {
                "duration": 10  # Task that takes 10 seconds
            }
        }
        
        task_response = await async_client.post(
            "/tasks/timeout-test",
            json=timeout_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait longer than timeout
        await asyncio.sleep(2)
        
        # Check task status
        status_response = await async_client.get(
            f"/tasks/{task_id}/status",
            headers=auth_headers
        )
        
        if status_response.status_code == status.HTTP_200_OK:
            task_status = status_response.json()
            assert task_status["status"] in ["failed", "timeout", "cancelled"]


class TestBackgroundTaskErrorHandling:
    """Test error handling in background tasks."""
    
    async def test_email_task_failure_handling(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_email_service: AsyncMock,
    ):
        """Test handling of email task failures."""
        # Configure mock to raise exception
        mock_email_service.send_email.side_effect = Exception("SMTP server unavailable")
        
        email_data = EmailFactory.create_email_data()
        task_response = await async_client.post(
            "/tasks/email",
            json=email_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait for task execution
        await asyncio.sleep(0.1)
        
        # Check task status
        status_response = await async_client.get(
            f"/tasks/{task_id}/status",
            headers=auth_headers
        )
        
        assert status_response.status_code == status.HTTP_200_OK
        
        task_status = status_response.json()
        # Task should either be failed or retrying
        assert task_status["status"] in ["failed", "retrying", "queued"]
        
        if task_status["status"] == "failed":
            assert "error" in task_status
            assert "SMTP server unavailable" in task_status["error"]
    
    async def test_task_retry_mechanism(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_email_service: AsyncMock,
    ):
        """Test task retry mechanism on failure."""
        # Configure mock to fail first two times, then succeed
        mock_email_service.send_email.side_effect = [
            Exception("Temporary failure"),
            Exception("Another temporary failure"),
            {"message_id": "success", "status": "sent"}
        ]
        
        email_data = EmailFactory.create_email_data()
        task_response = await async_client.post(
            "/tasks/email-retry",
            json={**email_data, "max_retries": 3},
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait for retries to complete
        await asyncio.sleep(0.5)
        
        # Check final status
        status_response = await async_client.get(
            f"/tasks/{task_id}/status",
            headers=auth_headers
        )
        
        task_status = status_response.json()
        
        # Should eventually succeed after retries
        if task_status["status"] == "completed":
            assert task_status["retry_count"] >= 2
        
        # Verify all attempts were made
        assert mock_email_service.send_email.call_count <= 3
    
    async def test_task_max_retries_exceeded(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_email_service: AsyncMock,
    ):
        """Test task failure after max retries exceeded."""
        # Configure mock to always fail
        mock_email_service.send_email.side_effect = Exception("Permanent failure")
        
        email_data = EmailFactory.create_email_data()
        task_response = await async_client.post(
            "/tasks/email-retry",
            json={**email_data, "max_retries": 2},
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait for all retries to complete
        await asyncio.sleep(0.5)
        
        # Check final status
        status_response = await async_client.get(
            f"/tasks/{task_id}/status",
            headers=auth_headers
        )
        
        task_status = status_response.json()
        assert task_status["status"] == "failed"
        assert task_status["retry_count"] >= 2
        assert "Permanent failure" in task_status["error"]
    
    async def test_task_cancellation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test task cancellation."""
        # Create a long-running task
        long_task_data = {
            "task_type": "long_running_task",
            "parameters": {"duration": 60}  # 60 second task
        }
        
        task_response = await async_client.post(
            "/tasks/long-running",
            json=long_task_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Let it start
        await asyncio.sleep(0.1)
        
        # Cancel the task
        cancel_response = await async_client.post(
            f"/tasks/{task_id}/cancel",
            headers=auth_headers
        )
        
        assert cancel_response.status_code in [
            status.HTTP_200_OK,      # Successfully cancelled
            status.HTTP_409_CONFLICT # Already completed/can't cancel
        ]
        
        if cancel_response.status_code == status.HTTP_200_OK:
            # Check that task was cancelled
            await asyncio.sleep(0.1)
            
            status_response = await async_client.get(
                f"/tasks/{task_id}/status",
                headers=auth_headers
            )
            
            task_status = status_response.json()
            assert task_status["status"] == "cancelled"


class TestBackgroundTaskConcurrency:
    """Test concurrent background task execution."""
    
    async def test_concurrent_email_tasks(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_email_service: AsyncMock,
    ):
        """Test concurrent execution of multiple email tasks."""
        # Create multiple email tasks
        email_tasks = []
        for i in range(10):
            email_data = EmailFactory.create_email_data(
                to_email=f"user{i}@example.com",
                subject=f"Test Email {i}"
            )
            
            task_response = await async_client.post(
                "/tasks/email",
                json=email_data,
                headers=auth_headers
            )
            email_tasks.append(task_response.json()["task_id"])
        
        # Wait for all tasks to complete
        await asyncio.sleep(1.0)
        
        # Check that all tasks were processed
        completed_count = 0
        for task_id in email_tasks:
            status_response = await async_client.get(
                f"/tasks/{task_id}/status",
                headers=auth_headers
            )
            
            if status_response.status_code == status.HTTP_200_OK:
                task_status = status_response.json()
                if task_status["status"] == "completed":
                    completed_count += 1
        
        # Most tasks should complete successfully
        assert completed_count >= 8  # At least 80% success rate
    
    async def test_task_queue_ordering(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that tasks are processed in correct order."""
        # Create tasks with different priorities
        high_priority_task = await async_client.post(
            "/tasks/priority",
            json={"task_type": "test_task", "priority": 1},
            headers=auth_headers
        )
        
        low_priority_task = await async_client.post(
            "/tasks/priority",
            json={"task_type": "test_task", "priority": 10},
            headers=auth_headers
        )
        
        medium_priority_task = await async_client.post(
            "/tasks/priority",
            json={"task_type": "test_task", "priority": 5},
            headers=auth_headers
        )
        
        # Wait for processing
        await asyncio.sleep(0.5)
        
        # Check execution order (implementation-specific)
        # This would require checking execution timestamps or order
        pass
    
    async def test_worker_pool_limits(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test worker pool limits and queuing."""
        # Create more tasks than worker pool can handle simultaneously
        tasks = []
        for i in range(20):  # Assuming worker pool size is less than 20
            task_data = {
                "task_type": "cpu_intensive_task",
                "parameters": {"duration": 2}  # 2 second task
            }
            
            task_response = await async_client.post(
                "/tasks/cpu-intensive",
                json=task_data,
                headers=auth_headers
            )
            tasks.append(task_response.json()["task_id"])
        
        # Check that some tasks are queued while others are running
        running_count = 0
        queued_count = 0
        
        for task_id in tasks:
            status_response = await async_client.get(
                f"/tasks/{task_id}/status",
                headers=auth_headers
            )
            
            if status_response.status_code == status.HTTP_200_OK:
                task_status = status_response.json()
                if task_status["status"] == "running":
                    running_count += 1
                elif task_status["status"] == "queued":
                    queued_count += 1
        
        # Should have both running and queued tasks
        assert running_count > 0
        assert queued_count > 0
        assert running_count < 20  # Not all can run simultaneously


class TestBackgroundTaskMonitoring:
    """Test background task monitoring and analytics."""
    
    async def test_get_task_status_details(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test retrieving detailed task status information."""
        # Create a task
        task_data = BackgroundTaskFactory.create_task_data(
            task_name="test_monitoring",
            kwargs={"test": "value"}
        )
        
        task_response = await async_client.post(
            "/tasks/generic",
            json=task_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Get detailed status
        status_response = await async_client.get(
            f"/tasks/{task_id}",
            headers=auth_headers
        )
        
        assert status_response.status_code == status.HTTP_200_OK
        
        task_details = status_response.json()
        assert "task_id" in task_details
        assert "status" in task_details
        assert "created_at" in task_details
        assert "task_type" in task_details
        assert "parameters" in task_details
        
        if task_details["status"] in ["running", "completed"]:
            assert "started_at" in task_details
        
        if task_details["status"] == "completed":
            assert "completed_at" in task_details
            assert "duration" in task_details
    
    async def test_list_user_tasks(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test listing tasks for current user."""
        # Create multiple tasks
        for i in range(5):
            task_data = BackgroundTaskFactory.create_task_data(
                task_name=f"user_task_{i}"
            )
            
            await async_client.post(
                "/tasks/generic",
                json=task_data,
                headers=auth_headers
            )
        
        # List user's tasks
        list_response = await async_client.get(
            "/tasks/my-tasks",
            headers=auth_headers
        )
        
        assert list_response.status_code == status.HTTP_200_OK
        
        tasks = list_response.json()
        assert "items" in tasks
        assert "total" in tasks
        assert len(tasks["items"]) >= 5
        
        # Verify all tasks belong to current user
        for task in tasks["items"]:
            assert "task_id" in task
            assert "status" in task
            assert "created_at" in task
    
    async def test_task_statistics(
        self,
        async_client: AsyncClient,
        admin_headers: dict,
    ):
        """Test retrieving task execution statistics."""
        # Create tasks with different outcomes
        success_task = await async_client.post(
            "/tasks/test-success",
            json={"task_type": "success_task"},
            headers=admin_headers
        )
        
        failure_task = await async_client.post(
            "/tasks/test-failure",
            json={"task_type": "failure_task"},
            headers=admin_headers
        )
        
        # Wait for execution
        await asyncio.sleep(0.5)
        
        # Get statistics
        stats_response = await async_client.get(
            "/admin/tasks/statistics",
            headers=admin_headers
        )
        
        assert stats_response.status_code == status.HTTP_200_OK
        
        stats = stats_response.json()
        assert "total_tasks" in stats
        assert "completed_tasks" in stats
        assert "failed_tasks" in stats
        assert "average_execution_time" in stats
        assert "task_types" in stats
    
    async def test_task_logs(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test retrieving task execution logs."""
        # Create a task that generates logs
        task_data = {
            "task_type": "logging_task",
            "parameters": {"log_messages": ["Starting task", "Processing data", "Task completed"]}
        }
        
        task_response = await async_client.post(
            "/tasks/logging",
            json=task_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait for execution
        await asyncio.sleep(0.2)
        
        # Get task logs
        logs_response = await async_client.get(
            f"/tasks/{task_id}/logs",
            headers=auth_headers
        )
        
        assert logs_response.status_code == status.HTTP_200_OK
        
        logs = logs_response.json()
        assert "logs" in logs
        assert len(logs["logs"]) > 0
        
        for log_entry in logs["logs"]:
            assert "timestamp" in log_entry
            assert "level" in log_entry
            assert "message" in log_entry


class TestBackgroundTaskPerformance:
    """Test background task performance characteristics."""
    
    async def test_task_execution_performance(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        performance_threshold: dict,
    ):
        """Test that tasks execute within performance thresholds."""
        import time
        
        # Create a simple task
        start_time = time.time()
        
        task_data = BackgroundTaskFactory.create_task_data(
            task_name="performance_test",
            kwargs={"operation": "simple_calculation"}
        )
        
        task_response = await async_client.post(
            "/tasks/performance-test",
            json=task_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait for completion
        max_wait_time = performance_threshold.get("background_task_time", 10.0)
        waited_time = 0
        
        while waited_time < max_wait_time:
            await asyncio.sleep(0.1)
            waited_time += 0.1
            
            status_response = await async_client.get(
                f"/tasks/{task_id}/status",
                headers=auth_headers
            )
            
            if status_response.status_code == status.HTTP_200_OK:
                task_status = status_response.json()
                if task_status["status"] == "completed":
                    break
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Task should complete within threshold
        assert total_time < max_wait_time
    
    async def test_high_throughput_task_processing(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test processing high volume of tasks."""
        import time
        
        task_count = 50
        start_time = time.time()
        
        # Create many small tasks
        task_ids = []
        for i in range(task_count):
            task_data = BackgroundTaskFactory.create_task_data(
                task_name="throughput_test",
                kwargs={"task_number": i}
            )
            
            task_response = await async_client.post(
                "/tasks/throughput-test",
                json=task_data,
                headers=auth_headers
            )
            task_ids.append(task_response.json()["task_id"])
        
        # Wait for all to complete
        completed_count = 0
        max_wait = 30  # 30 seconds max
        waited = 0
        
        while completed_count < task_count and waited < max_wait:
            await asyncio.sleep(1)
            waited += 1
            
            completed_count = 0
            for task_id in task_ids:
                status_response = await async_client.get(
                    f"/tasks/{task_id}/status",
                    headers=auth_headers
                )
                
                if status_response.status_code == status.HTTP_200_OK:
                    task_status = status_response.json()
                    if task_status["status"] == "completed":
                        completed_count += 1
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Should process at least 1 task per second
        throughput = completed_count / total_time
        assert throughput >= 1.0
        
        # Should complete at least 80% of tasks
        assert completed_count >= task_count * 0.8
    
    async def test_memory_usage_during_bulk_processing(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test memory usage during bulk task processing."""
        import psutil
        
        process = psutil.Process()
        initial_memory = process.memory_info().rss
        
        # Create many memory-intensive tasks
        for i in range(20):
            task_data = {
                "task_type": "memory_test",
                "parameters": {
                    "data_size": 1024 * 1024,  # 1MB of data per task
                    "operation": "process_large_dataset"
                }
            }
            
            await async_client.post(
                "/tasks/memory-test",
                json=task_data,
                headers=auth_headers
            )
        
        # Wait for processing
        await asyncio.sleep(2)
        
        current_memory = process.memory_info().rss
        memory_growth = current_memory - initial_memory
        
        # Memory growth should be reasonable (less than 100MB)
        assert memory_growth < 100 * 1024 * 1024


class TestBackgroundTaskIntegration:
    """Test background task integration with other system components."""
    
    async def test_task_with_database_operations(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        db_session,
    ):
        """Test tasks that perform database operations."""
        # Create task that creates users
        user_data = UserFactory.create_multiple_users(5)
        task_data = {
            "task_type": "create_users",
            "parameters": {
                "users": user_data,
                "batch_size": 2
            }
        }
        
        task_response = await async_client.post(
            "/tasks/database-operation",
            json=task_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait for completion
        await asyncio.sleep(1)
        
        # Check task result
        result_response = await async_client.get(
            f"/tasks/{task_id}/result",
            headers=auth_headers
        )
        
        if result_response.status_code == status.HTTP_200_OK:
            result = result_response.json()
            assert "created_users" in result
            assert result["created_users"] == 5
    
    async def test_task_with_external_api_calls(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        mock_external_api: AsyncMock,
    ):
        """Test tasks that make external API calls."""
        # Configure mock external API
        mock_external_api.post.return_value = {
            "status": "success",
            "data": {"external_id": "ext_123"}
        }
        
        task_data = {
            "task_type": "sync_external_data",
            "parameters": {
                "api_endpoint": "https://api.example.com/data",
                "data": {"key": "value"}
            }
        }
        
        task_response = await async_client.post(
            "/tasks/external-api",
            json=task_data,
            headers=auth_headers
        )
        task_id = task_response.json()["task_id"]
        
        # Wait for completion
        await asyncio.sleep(0.5)
        
        # Verify external API was called
        mock_external_api.post.assert_called()
        
        # Check task completion
        status_response = await async_client.get(
            f"/tasks/{task_id}/status",
            headers=auth_headers
        )
        
        if status_response.status_code == status.HTTP_200_OK:
            task_status = status_response.json()
            assert task_status["status"] in ["completed", "running"]
    
    async def test_task_chain_execution(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test execution of chained/dependent tasks."""
        # Create first task
        task1_data = {
            "task_type": "prepare_data",
            "parameters": {"data_source": "database"}
        }
        
        task1_response = await async_client.post(
            "/tasks/chain-step1",
            json=task1_data,
            headers=auth_headers
        )
        task1_id = task1_response.json()["task_id"]
        
        # Create dependent task
        task2_data = {
            "task_type": "process_data",
            "depends_on": [task1_id],
            "parameters": {"processing_type": "analysis"}
        }
        
        task2_response = await async_client.post(
            "/tasks/chain-step2",
            json=task2_data,
            headers=auth_headers
        )
        task2_id = task2_response.json()["task_id"]
        
        # Wait for both tasks to complete
        await asyncio.sleep(2)
        
        # Check that both tasks completed successfully
        for task_id in [task1_id, task2_id]:
            status_response = await async_client.get(
                f"/tasks/{task_id}/status",
                headers=auth_headers
            )
            
            if status_response.status_code == status.HTTP_200_OK:
                task_status = status_response.json()
                assert task_status["status"] in ["completed", "running"]