"""
FastAPI HTTPX Mock Testing Utilities

Comprehensive utilities for testing FastAPI applications using httpx-mock
with support for async/await patterns and advanced mocking scenarios.
"""

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Union, Callable, Awaitable
from dataclasses import dataclass, field
from unittest.mock import AsyncMock, MagicMock
import httpx
from httpx_mock import HTTPXMock
import pytest
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.testclient import TestClient


@dataclass
class MockResponse:
    """Configuration for a mock HTTP response."""
    status_code: int = 200
    content: Union[str, bytes, Dict[str, Any]] = None
    json: Optional[Dict[str, Any]] = None
    headers: Dict[str, str] = field(default_factory=dict)
    delay: Optional[float] = None
    raise_exception: Optional[Exception] = None


@dataclass
class MockEndpoint:
    """Configuration for a mock API endpoint."""
    method: str
    url: str
    response: MockResponse
    match_content: Optional[Union[str, bytes, Dict[str, Any]]] = None
    match_headers: Optional[Dict[str, str]] = None
    call_count: int = 0
    max_calls: Optional[int] = None


class HTTPXTestHelper:
    """Helper class for testing with HTTPX mock."""
    
    def __init__(self, base_url: str = "https://api.example.com"):
        self.base_url = base_url
        self.mock_endpoints: List[MockEndpoint] = []
        self.request_history: List[Dict[str, Any]] = []
        
    def add_mock(
        self,
        method: str,
        url: str,
        response: MockResponse,
        match_content: Optional[Union[str, bytes, Dict[str, Any]]] = None,
        match_headers: Optional[Dict[str, str]] = None,
        max_calls: Optional[int] = None
    ) -> None:
        """Add a mock endpoint configuration."""
        endpoint = MockEndpoint(
            method=method.upper(),
            url=url,
            response=response,
            match_content=match_content,
            match_headers=match_headers,
            max_calls=max_calls
        )
        self.mock_endpoints.append(endpoint)
    
    def setup_mocks(self, httpx_mock: HTTPXMock) -> None:
        """Setup all configured mocks with HTTPXMock."""
        for endpoint in self.mock_endpoints:
            self._add_single_mock(httpx_mock, endpoint)
    
    def _add_single_mock(self, httpx_mock: HTTPXMock, endpoint: MockEndpoint) -> None:
        """Add a single mock endpoint to HTTPXMock."""
        
        def response_callback(request: httpx.Request) -> httpx.Response:
            # Track request
            self.request_history.append({
                "method": request.method,
                "url": str(request.url),
                "headers": dict(request.headers),
                "content": request.content,
                "timestamp": time.time()
            })
            
            # Update call count
            endpoint.call_count += 1
            
            # Check max calls
            if endpoint.max_calls and endpoint.call_count > endpoint.max_calls:
                raise Exception(f"Endpoint {endpoint.url} called more than {endpoint.max_calls} times")
            
            # Handle delays
            if endpoint.response.delay:
                time.sleep(endpoint.response.delay)
            
            # Handle exceptions
            if endpoint.response.raise_exception:
                raise endpoint.response.raise_exception
            
            # Prepare response content
            content = endpoint.response.content
            if endpoint.response.json:
                content = json.dumps(endpoint.response.json)
                endpoint.response.headers.setdefault("content-type", "application/json")
            elif isinstance(content, dict):
                content = json.dumps(content)
                endpoint.response.headers.setdefault("content-type", "application/json")
            elif content is None:
                content = ""
            
            return httpx.Response(
                status_code=endpoint.response.status_code,
                content=content,
                headers=endpoint.response.headers
            )
        
        # Setup the mock
        httpx_mock.add_callback(
            callback=response_callback,
            method=endpoint.method,
            url=endpoint.url,
            match_content=endpoint.match_content,
            match_headers=endpoint.match_headers
        )
    
    def get_request_history(self) -> List[Dict[str, Any]]:
        """Get history of all requests made."""
        return self.request_history
    
    def get_requests_for_url(self, url: str) -> List[Dict[str, Any]]:
        """Get history of requests for a specific URL."""
        return [req for req in self.request_history if req["url"] == url]
    
    def assert_called(self, method: str, url: str, times: Optional[int] = None) -> None:
        """Assert that an endpoint was called."""
        requests = [
            req for req in self.request_history 
            if req["method"] == method.upper() and req["url"] == url
        ]
        
        if times is not None:
            assert len(requests) == times, f"Expected {times} calls to {method} {url}, got {len(requests)}"
        else:
            assert len(requests) > 0, f"Expected at least one call to {method} {url}, got none"
    
    def assert_not_called(self, method: str, url: str) -> None:
        """Assert that an endpoint was not called."""
        requests = [
            req for req in self.request_history 
            if req["method"] == method.upper() and req["url"] == url
        ]
        assert len(requests) == 0, f"Expected no calls to {method} {url}, got {len(requests)}"
    
    def reset(self) -> None:
        """Reset all mocks and history."""
        self.mock_endpoints.clear()
        self.request_history.clear()


class FastAPITestHelper:
    """Helper class for testing FastAPI applications."""
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.client = TestClient(app)
        
    def test_endpoint(
        self,
        method: str,
        url: str,
        data: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        auth: Optional[tuple] = None,
        expected_status: int = 200,
        expected_json: Optional[Dict[str, Any]] = None,
        expected_headers: Optional[Dict[str, str]] = None
    ) -> httpx.Response:
        """Test a FastAPI endpoint with comprehensive validation."""
        
        # Prepare request kwargs
        kwargs = {}
        if data:
            kwargs["data"] = data
        if json_data:
            kwargs["json"] = json_data
        if headers:
            kwargs["headers"] = headers
        if params:
            kwargs["params"] = params
        if auth:
            kwargs["auth"] = auth
        
        # Make request
        response = self.client.request(method, url, **kwargs)
        
        # Validate status code
        assert response.status_code == expected_status, (
            f"Expected status {expected_status}, got {response.status_code}. "
            f"Response: {response.text}"
        )
        
        # Validate JSON response
        if expected_json:
            actual_json = response.json()
            assert actual_json == expected_json, (
                f"Expected JSON {expected_json}, got {actual_json}"
            )
        
        # Validate headers
        if expected_headers:
            for key, value in expected_headers.items():
                assert response.headers.get(key) == value, (
                    f"Expected header {key}={value}, got {response.headers.get(key)}"
                )
        
        return response
    
    def test_crud_operations(
        self,
        resource_name: str,
        create_data: Dict[str, Any],
        update_data: Dict[str, Any],
        base_url: str = "/api",
        auth_headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Test full CRUD operations for a resource."""
        results = {}
        
        # CREATE
        create_response = self.test_endpoint(
            "POST",
            f"{base_url}/{resource_name}",
            json_data=create_data,
            headers=auth_headers,
            expected_status=201
        )
        created_item = create_response.json()
        item_id = created_item.get("id")
        results["create"] = created_item
        
        # READ (single)
        read_response = self.test_endpoint(
            "GET",
            f"{base_url}/{resource_name}/{item_id}",
            headers=auth_headers,
            expected_status=200
        )
        results["read"] = read_response.json()
        
        # READ (list)
        list_response = self.test_endpoint(
            "GET",
            f"{base_url}/{resource_name}",
            headers=auth_headers,
            expected_status=200
        )
        results["list"] = list_response.json()
        
        # UPDATE
        update_response = self.test_endpoint(
            "PUT",
            f"{base_url}/{resource_name}/{item_id}",
            json_data=update_data,
            headers=auth_headers,
            expected_status=200
        )
        results["update"] = update_response.json()
        
        # DELETE
        delete_response = self.test_endpoint(
            "DELETE",
            f"{base_url}/{resource_name}/{item_id}",
            headers=auth_headers,
            expected_status=204
        )
        results["delete"] = delete_response
        
        # Verify deletion
        self.test_endpoint(
            "GET",
            f"{base_url}/{resource_name}/{item_id}",
            headers=auth_headers,
            expected_status=404
        )
        
        return results
    
    def test_pagination(
        self,
        url: str,
        total_items: int,
        page_size: int = 10,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Test pagination functionality."""
        results = {
            "pages": [],
            "total_fetched": 0,
            "errors": []
        }
        
        page = 1
        while True:
            try:
                response = self.test_endpoint(
                    "GET",
                    url,
                    params={"page": page, "limit": page_size},
                    headers=headers,
                    expected_status=200
                )
                
                data = response.json()
                items = data.get("data", [])
                meta = data.get("meta", {})
                
                results["pages"].append({
                    "page": page,
                    "items": len(items),
                    "meta": meta
                })
                
                results["total_fetched"] += len(items)
                
                # Check if this is the last page
                if not meta.get("has_next", False) or len(items) < page_size:
                    break
                
                page += 1
                
            except Exception as e:
                results["errors"].append(f"Page {page}: {str(e)}")
                break
        
        return results


class AsyncHTTPXTestHelper:
    """Helper class for testing async HTTPX operations."""
    
    def __init__(self, base_url: str = "https://api.example.com"):
        self.base_url = base_url
        
    async def test_async_endpoint(
        self,
        client: httpx.AsyncClient,
        method: str,
        url: str,
        **kwargs
    ) -> httpx.Response:
        """Test an async endpoint."""
        response = await client.request(method, url, **kwargs)
        return response
    
    async def test_concurrent_requests(
        self,
        client: httpx.AsyncClient,
        requests: List[Dict[str, Any]],
        max_concurrent: int = 10
    ) -> List[httpx.Response]:
        """Test multiple concurrent requests."""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def make_request(request_config: Dict[str, Any]) -> httpx.Response:
            async with semaphore:
                return await self.test_async_endpoint(client, **request_config)
        
        tasks = [make_request(req) for req in requests]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        return responses
    
    async def test_rate_limiting(
        self,
        client: httpx.AsyncClient,
        url: str,
        requests_per_second: int,
        duration_seconds: int,
        expected_rate_limit_status: int = 429
    ) -> Dict[str, Any]:
        """Test rate limiting behavior."""
        results = {
            "total_requests": 0,
            "successful_requests": 0,
            "rate_limited_requests": 0,
            "error_requests": 0,
            "response_times": []
        }
        
        interval = 1.0 / requests_per_second
        end_time = time.time() + duration_seconds
        
        while time.time() < end_time:
            start_time = time.time()
            
            try:
                response = await client.get(url)
                request_time = time.time() - start_time
                
                results["total_requests"] += 1
                results["response_times"].append(request_time)
                
                if response.status_code == expected_rate_limit_status:
                    results["rate_limited_requests"] += 1
                elif 200 <= response.status_code < 300:
                    results["successful_requests"] += 1
                else:
                    results["error_requests"] += 1
                    
            except Exception:
                results["error_requests"] += 1
                results["total_requests"] += 1
            
            # Wait for the next request
            await asyncio.sleep(max(0, interval - (time.time() - start_time)))
        
        if results["response_times"]:
            results["avg_response_time"] = sum(results["response_times"]) / len(results["response_times"])
            results["max_response_time"] = max(results["response_times"])
            results["min_response_time"] = min(results["response_times"])
        
        return results


class MockDataGenerator:
    """Utility class for generating mock data."""
    
    @staticmethod
    def user(id: Optional[int] = None, **overrides) -> Dict[str, Any]:
        """Generate mock user data."""
        data = {
            "id": id or 1,
            "email": f"user{id or 1}@example.com",
            "name": f"User {id or 1}",
            "is_active": True,
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def product(id: Optional[int] = None, **overrides) -> Dict[str, Any]:
        """Generate mock product data."""
        data = {
            "id": id or 1,
            "name": f"Product {id or 1}",
            "description": f"Description for product {id or 1}",
            "price": 99.99,
            "category": "Electronics",
            "in_stock": True,
            "created_at": "2023-01-01T00:00:00Z"
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def order(id: Optional[int] = None, **overrides) -> Dict[str, Any]:
        """Generate mock order data."""
        data = {
            "id": id or 1,
            "user_id": 1,
            "total": 199.98,
            "status": "pending",
            "items": [
                {"product_id": 1, "quantity": 2, "price": 99.99}
            ],
            "created_at": "2023-01-01T00:00:00Z"
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def paginated_response(
        items: List[Dict[str, Any]], 
        page: int = 1, 
        limit: int = 10, 
        total: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate paginated response structure."""
        if total is None:
            total = len(items)
        
        total_pages = (total + limit - 1) // limit
        
        return {
            "data": items,
            "meta": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    
    @staticmethod
    def error_response(
        message: str, 
        code: str, 
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate error response structure."""
        response = {
            "error": {
                "message": message,
                "code": code,
                "status_code": status_code
            }
        }
        
        if details:
            response["error"]["details"] = details
        
        return response


# Pytest fixtures
@pytest.fixture
def httpx_helper():
    """Pytest fixture for HTTPXTestHelper."""
    return HTTPXTestHelper()


@pytest.fixture
def fastapi_helper(app):
    """Pytest fixture for FastAPITestHelper."""
    return FastAPITestHelper(app)


@pytest.fixture
def async_httpx_helper():
    """Pytest fixture for AsyncHTTPXTestHelper."""
    return AsyncHTTPXTestHelper()


@pytest.fixture
def mock_data():
    """Pytest fixture for MockDataGenerator."""
    return MockDataGenerator()


# Common test scenarios
def create_success_scenario(httpx_helper: HTTPXTestHelper, base_url: str = "https://api.example.com"):
    """Create a successful API response scenario."""
    httpx_helper.add_mock(
        "GET", f"{base_url}/users",
        MockResponse(
            status_code=200,
            json=MockDataGenerator.paginated_response([
                MockDataGenerator.user(1),
                MockDataGenerator.user(2)
            ])
        )
    )
    
    httpx_helper.add_mock(
        "GET", f"{base_url}/users/1",
        MockResponse(
            status_code=200,
            json=MockDataGenerator.user(1)
        )
    )
    
    httpx_helper.add_mock(
        "POST", f"{base_url}/users",
        MockResponse(
            status_code=201,
            json=MockDataGenerator.user(3)
        )
    )


def create_error_scenario(httpx_helper: HTTPXTestHelper, base_url: str = "https://api.example.com"):
    """Create an error response scenario."""
    httpx_helper.add_mock(
        "GET", f"{base_url}/users",
        MockResponse(
            status_code=500,
            json=MockDataGenerator.error_response(
                "Internal server error", 
                "INTERNAL_ERROR", 
                500
            )
        )
    )
    
    httpx_helper.add_mock(
        "GET", f"{base_url}/users/999",
        MockResponse(
            status_code=404,
            json=MockDataGenerator.error_response(
                "User not found", 
                "NOT_FOUND", 
                404
            )
        )
    )


def create_rate_limit_scenario(httpx_helper: HTTPXTestHelper, base_url: str = "https://api.example.com"):
    """Create a rate limiting scenario."""
    httpx_helper.add_mock(
        "GET", f"{base_url}/limited",
        MockResponse(
            status_code=429,
            json=MockDataGenerator.error_response(
                "Rate limit exceeded", 
                "RATE_LIMIT_EXCEEDED", 
                429
            ),
            headers={"Retry-After": "60"}
        ),
        max_calls=3
    )


def create_timeout_scenario(httpx_helper: HTTPXTestHelper, base_url: str = "https://api.example.com"):
    """Create a timeout scenario."""
    httpx_helper.add_mock(
        "GET", f"{base_url}/slow",
        MockResponse(
            status_code=200,
            json={"message": "This was slow"},
            delay=5.0  # 5 second delay
        )
    )


# Example usage functions
async def example_async_test():
    """Example of testing async operations."""
    helper = AsyncHTTPXTestHelper()
    
    async with httpx.AsyncClient() as client:
        # Test concurrent requests
        requests = [
            {"method": "GET", "url": "https://api.example.com/users/1"},
            {"method": "GET", "url": "https://api.example.com/users/2"},
            {"method": "GET", "url": "https://api.example.com/users/3"},
        ]
        
        responses = await helper.test_concurrent_requests(client, requests)
        
        for response in responses:
            if isinstance(response, httpx.Response):
                print(f"Status: {response.status_code}")
            else:
                print(f"Error: {response}")


def example_fastapi_test(app: FastAPI):
    """Example of testing FastAPI application."""
    helper = FastAPITestHelper(app)
    
    # Test CRUD operations
    results = helper.test_crud_operations(
        resource_name="users",
        create_data={"name": "John Doe", "email": "john@example.com"},
        update_data={"name": "Jane Doe"}
    )
    
    print("CRUD test results:", results)
    
    # Test pagination
    pagination_results = helper.test_pagination(
        url="/api/users",
        total_items=100,
        page_size=10
    )
    
    print("Pagination test results:", pagination_results)


def example_httpx_mock_test():
    """Example of using HTTPXMock for testing."""
    helper = HTTPXTestHelper()
    
    # Setup mocks
    create_success_scenario(helper)
    
    # In a real test, you would use pytest and httpx_mock fixture
    # This is just to show the structure
    print("Mock endpoints configured:", len(helper.mock_endpoints))