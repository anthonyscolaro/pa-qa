<?php
/**
 * WordPress REST API Testing Helpers
 * 
 * Comprehensive utilities for testing WordPress REST API endpoints
 * with support for authentication, custom post types, and advanced scenarios.
 */

namespace PAQATesting\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use WP_User;
use WP_Post;

class WPRestTestHelper {
    
    private $server;
    private $request_history = [];
    private $mock_responses = [];
    private $test_users = [];
    private $test_posts = [];
    
    public function __construct() {
        global $wp_rest_server;
        $this->server = $wp_rest_server;
        
        if (!$this->server) {
            $this->server = new WP_REST_Server();
            do_action('rest_api_init');
        }
    }
    
    /**
     * Setup test environment
     */
    public function setup(): void {
        // Create test users with different roles
        $this->create_test_users();
        
        // Create test posts
        $this->create_test_posts();
        
        // Setup custom endpoints for testing
        $this->register_test_endpoints();
    }
    
    /**
     * Cleanup test environment
     */
    public function teardown(): void {
        // Remove test users
        foreach ($this->test_users as $user_id) {
            wp_delete_user($user_id);
        }
        
        // Remove test posts
        foreach ($this->test_posts as $post_id) {
            wp_delete_post($post_id, true);
        }
        
        // Clear history
        $this->request_history = [];
        $this->mock_responses = [];
        $this->test_users = [];
        $this->test_posts = [];
    }
    
    /**
     * Make a REST API request
     */
    public function request(
        string $method,
        string $route,
        array $params = [],
        array $headers = [],
        $body = null
    ): WP_REST_Response {
        $request = new WP_REST_Request($method, $route);
        
        // Set parameters
        foreach ($params as $key => $value) {
            $request->set_param($key, $value);
        }
        
        // Set headers
        foreach ($headers as $key => $value) {
            $request->set_header($key, $value);
        }
        
        // Set body
        if ($body !== null) {
            if (is_array($body) || is_object($body)) {
                $request->set_body(json_encode($body));
                $request->set_header('Content-Type', 'application/json');
            } else {
                $request->set_body($body);
            }
        }
        
        // Store request in history
        $this->request_history[] = [
            'method' => $method,
            'route' => $route,
            'params' => $params,
            'headers' => $headers,
            'body' => $body,
            'timestamp' => time()
        ];
        
        // Dispatch request
        $response = $this->server->dispatch($request);
        
        return $response;
    }
    
    /**
     * Test GET request
     */
    public function get(string $route, array $params = [], array $headers = []): WP_REST_Response {
        return $this->request('GET', $route, $params, $headers);
    }
    
    /**
     * Test POST request
     */
    public function post(string $route, $body = null, array $headers = []): WP_REST_Response {
        return $this->request('POST', $route, [], $headers, $body);
    }
    
    /**
     * Test PUT request
     */
    public function put(string $route, $body = null, array $headers = []): WP_REST_Response {
        return $this->request('PUT', $route, [], $headers, $body);
    }
    
    /**
     * Test PATCH request
     */
    public function patch(string $route, $body = null, array $headers = []): WP_REST_Response {
        return $this->request('PATCH', $route, [], $headers, $body);
    }
    
    /**
     * Test DELETE request
     */
    public function delete(string $route, array $headers = []): WP_REST_Response {
        return $this->request('DELETE', $route, [], $headers);
    }
    
    /**
     * Test endpoint with authentication
     */
    public function authenticated_request(
        string $method,
        string $route,
        $user_id_or_login,
        array $params = [],
        $body = null
    ): WP_REST_Response {
        // Set current user
        if (is_numeric($user_id_or_login)) {
            wp_set_current_user($user_id_or_login);
        } else {
            $user = get_user_by('login', $user_id_or_login);
            if ($user) {
                wp_set_current_user($user->ID);
            }
        }
        
        // Add authentication headers
        $headers = [
            'X-WP-Nonce' => wp_create_nonce('wp_rest')
        ];
        
        $response = $this->request($method, $route, $params, $headers, $body);
        
        // Reset current user
        wp_set_current_user(0);
        
        return $response;
    }
    
    /**
     * Test CRUD operations for a post type
     */
    public function test_post_type_crud(
        string $post_type,
        array $create_data,
        array $update_data,
        $user_id = null
    ): array {
        $results = [];
        $namespace = 'wp/v2';
        $route_base = $post_type === 'post' ? 'posts' : $post_type;
        
        // CREATE
        $create_response = $user_id 
            ? $this->authenticated_request('POST', "/{$namespace}/{$route_base}", $user_id, [], $create_data)
            : $this->post("/{$namespace}/{$route_base}", $create_data);
        
        $results['create'] = [
            'response' => $create_response,
            'status' => $create_response->get_status(),
            'data' => $create_response->get_data()
        ];
        
        if ($create_response->get_status() === 201) {
            $post_id = $create_response->get_data()['id'];
            
            // READ
            $read_response = $this->get("/{$namespace}/{$route_base}/{$post_id}");
            $results['read'] = [
                'response' => $read_response,
                'status' => $read_response->get_status(),
                'data' => $read_response->get_data()
            ];
            
            // UPDATE
            $update_response = $user_id
                ? $this->authenticated_request('PUT', "/{$namespace}/{$route_base}/{$post_id}", $user_id, [], $update_data)
                : $this->put("/{$namespace}/{$route_base}/{$post_id}", $update_data);
            
            $results['update'] = [
                'response' => $update_response,
                'status' => $update_response->get_status(),
                'data' => $update_response->get_data()
            ];
            
            // DELETE
            $delete_response = $user_id
                ? $this->authenticated_request('DELETE', "/{$namespace}/{$route_base}/{$post_id}", $user_id)
                : $this->delete("/{$namespace}/{$route_base}/{$post_id}");
            
            $results['delete'] = [
                'response' => $delete_response,
                'status' => $delete_response->get_status(),
                'data' => $delete_response->get_data()
            ];
        }
        
        return $results;
    }
    
    /**
     * Test pagination
     */
    public function test_pagination(
        string $route,
        int $total_expected = null,
        int $per_page = 10
    ): array {
        $results = [
            'pages' => [],
            'total_fetched' => 0,
            'errors' => []
        ];
        
        $page = 1;
        
        while (true) {
            $response = $this->get($route, [
                'page' => $page,
                'per_page' => $per_page
            ]);
            
            $status = $response->get_status();
            $data = $response->get_data();
            
            if ($status !== 200) {
                $results['errors'][] = "Page {$page}: Status {$status}";
                break;
            }
            
            $items_count = is_array($data) ? count($data) : 0;
            
            $results['pages'][] = [
                'page' => $page,
                'items' => $items_count,
                'headers' => $response->get_headers()
            ];
            
            $results['total_fetched'] += $items_count;
            
            // Check if this is the last page
            $total_pages = $response->get_header('X-WP-TotalPages');
            if ($total_pages && $page >= intval($total_pages)) {
                break;
            }
            
            if ($items_count < $per_page) {
                break;
            }
            
            $page++;
            
            // Safety break
            if ($page > 100) {
                $results['errors'][] = "Too many pages, stopping at page 100";
                break;
            }
        }
        
        return $results;
    }
    
    /**
     * Test search functionality
     */
    public function test_search(
        string $route,
        string $search_term,
        array $additional_params = []
    ): array {
        $params = array_merge(['search' => $search_term], $additional_params);
        $response = $this->get($route, $params);
        
        return [
            'search_term' => $search_term,
            'response' => $response,
            'status' => $response->get_status(),
            'data' => $response->get_data(),
            'total' => $response->get_header('X-WP-Total'),
            'found' => is_array($response->get_data()) ? count($response->get_data()) : 0
        ];
    }
    
    /**
     * Test filtering
     */
    public function test_filtering(
        string $route,
        array $filters
    ): array {
        $response = $this->get($route, $filters);
        
        return [
            'filters' => $filters,
            'response' => $response,
            'status' => $response->get_status(),
            'data' => $response->get_data(),
            'total' => $response->get_header('X-WP-Total'),
            'found' => is_array($response->get_data()) ? count($response->get_data()) : 0
        ];
    }
    
    /**
     * Test user permissions
     */
    public function test_permissions(
        string $route,
        string $method = 'GET',
        array $roles_to_test = ['administrator', 'editor', 'author', 'contributor', 'subscriber'],
        $body = null
    ): array {
        $results = [];
        
        // Test unauthenticated access
        $response = $this->request($method, $route, [], [], $body);
        $results['unauthenticated'] = [
            'status' => $response->get_status(),
            'can_access' => !in_array($response->get_status(), [401, 403])
        ];
        
        // Test each role
        foreach ($roles_to_test as $role) {
            $user_id = $this->get_test_user_by_role($role);
            if ($user_id) {
                $response = $this->authenticated_request($method, $route, $user_id, [], $body);
                $results[$role] = [
                    'status' => $response->get_status(),
                    'can_access' => !in_array($response->get_status(), [401, 403])
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Test rate limiting (if implemented)
     */
    public function test_rate_limiting(
        string $route,
        int $requests_count = 100,
        int $time_window = 60
    ): array {
        $results = [
            'total_requests' => 0,
            'successful_requests' => 0,
            'rate_limited_requests' => 0,
            'error_requests' => 0,
            'response_times' => []
        ];
        
        $start_time = time();
        
        for ($i = 0; $i < $requests_count; $i++) {
            $request_start = microtime(true);
            $response = $this->get($route);
            $request_end = microtime(true);
            
            $results['total_requests']++;
            $results['response_times'][] = $request_end - $request_start;
            
            $status = $response->get_status();
            
            if ($status === 429) {
                $results['rate_limited_requests']++;
            } elseif ($status >= 200 && $status < 300) {
                $results['successful_requests']++;
            } else {
                $results['error_requests']++;
            }
            
            // Break if time window exceeded
            if (time() - $start_time > $time_window) {
                break;
            }
            
            // Small delay to avoid overwhelming the server
            usleep(10000); // 10ms
        }
        
        if (!empty($results['response_times'])) {
            $results['avg_response_time'] = array_sum($results['response_times']) / count($results['response_times']);
            $results['max_response_time'] = max($results['response_times']);
            $results['min_response_time'] = min($results['response_times']);
        }
        
        return $results;
    }
    
    /**
     * Assert response status
     */
    public function assert_response_status(WP_REST_Response $response, int $expected_status): void {
        $actual_status = $response->get_status();
        if ($actual_status !== $expected_status) {
            throw new \Exception("Expected status {$expected_status}, got {$actual_status}");
        }
    }
    
    /**
     * Assert response has data
     */
    public function assert_response_has_data(WP_REST_Response $response, string $key = null): void {
        $data = $response->get_data();
        
        if ($key === null) {
            if (empty($data)) {
                throw new \Exception("Response data is empty");
            }
        } else {
            if (!isset($data[$key])) {
                throw new \Exception("Response data missing key: {$key}");
            }
        }
    }
    
    /**
     * Assert response data equals
     */
    public function assert_response_data_equals(WP_REST_Response $response, $expected, string $key = null): void {
        $data = $response->get_data();
        
        if ($key !== null) {
            $data = $data[$key] ?? null;
        }
        
        if ($data !== $expected) {
            throw new \Exception("Response data mismatch. Expected: " . json_encode($expected) . ", Got: " . json_encode($data));
        }
    }
    
    /**
     * Assert response has header
     */
    public function assert_response_has_header(WP_REST_Response $response, string $header): void {
        if (!$response->get_header($header)) {
            throw new \Exception("Response missing header: {$header}");
        }
    }
    
    /**
     * Get request history
     */
    public function get_request_history(): array {
        return $this->request_history;
    }
    
    /**
     * Get requests for specific route
     */
    public function get_requests_for_route(string $route): array {
        return array_filter($this->request_history, function($request) use ($route) {
            return $request['route'] === $route;
        });
    }
    
    /**
     * Create test users with different roles
     */
    private function create_test_users(): void {
        $roles = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];
        
        foreach ($roles as $role) {
            $user_id = wp_create_user(
                "test_{$role}",
                'test_password_123',
                "test_{$role}@example.com"
            );
            
            if (!is_wp_error($user_id)) {
                $user = new WP_User($user_id);
                $user->set_role($role);
                $this->test_users[$role] = $user_id;
            }
        }
    }
    
    /**
     * Create test posts
     */
    private function create_test_posts(): void {
        $post_types = ['post', 'page'];
        
        foreach ($post_types as $post_type) {
            for ($i = 1; $i <= 5; $i++) {
                $post_id = wp_insert_post([
                    'post_title' => "Test {$post_type} {$i}",
                    'post_content' => "This is test {$post_type} content {$i}",
                    'post_status' => 'publish',
                    'post_type' => $post_type,
                    'post_author' => $this->test_users['administrator'] ?? 1
                ]);
                
                if (!is_wp_error($post_id)) {
                    $this->test_posts[] = $post_id;
                }
            }
        }
    }
    
    /**
     * Register test endpoints
     */
    private function register_test_endpoints(): void {
        register_rest_route('test/v1', '/echo', [
            'methods' => ['GET', 'POST'],
            'callback' => function(WP_REST_Request $request) {
                return new WP_REST_Response([
                    'method' => $request->get_method(),
                    'params' => $request->get_params(),
                    'body' => $request->get_body(),
                    'headers' => $request->get_headers(),
                    'timestamp' => time()
                ]);
            },
            'permission_callback' => '__return_true'
        ]);
        
        register_rest_route('test/v1', '/protected', [
            'methods' => 'GET',
            'callback' => function() {
                return new WP_REST_Response(['message' => 'Protected endpoint accessed']);
            },
            'permission_callback' => function() {
                return current_user_can('read');
            }
        ]);
        
        register_rest_route('test/v1', '/error', [
            'methods' => 'GET',
            'callback' => function() {
                return new WP_Error('test_error', 'This is a test error', ['status' => 400]);
            },
            'permission_callback' => '__return_true'
        ]);
    }
    
    /**
     * Get test user by role
     */
    private function get_test_user_by_role(string $role): ?int {
        return $this->test_users[$role] ?? null;
    }
}

/**
 * WordPress REST API Test Suite
 */
class WPRestTestSuite {
    
    private $helper;
    private $results = [];
    
    public function __construct(WPRestTestHelper $helper) {
        $this->helper = $helper;
    }
    
    /**
     * Run comprehensive WordPress REST API tests
     */
    public function run_comprehensive_tests(): array {
        $this->results = [];
        
        // Test core endpoints
        $this->test_core_endpoints();
        
        // Test authentication
        $this->test_authentication();
        
        // Test permissions
        $this->test_permissions();
        
        // Test CRUD operations
        $this->test_crud_operations();
        
        // Test pagination
        $this->test_pagination();
        
        // Test search and filtering
        $this->test_search_and_filtering();
        
        return $this->results;
    }
    
    /**
     * Test core WordPress REST API endpoints
     */
    private function test_core_endpoints(): void {
        $endpoints = [
            '/wp/v2/posts',
            '/wp/v2/pages',
            '/wp/v2/users',
            '/wp/v2/comments',
            '/wp/v2/categories',
            '/wp/v2/tags',
            '/wp/v2/media'
        ];
        
        $results = [];
        
        foreach ($endpoints as $endpoint) {
            $response = $this->helper->get($endpoint);
            $results[$endpoint] = [
                'status' => $response->get_status(),
                'accessible' => $response->get_status() === 200,
                'has_data' => !empty($response->get_data())
            ];
        }
        
        $this->results['core_endpoints'] = $results;
    }
    
    /**
     * Test authentication mechanisms
     */
    private function test_authentication(): void {
        $results = [];
        
        // Test protected endpoint without auth
        $response = $this->helper->get('/test/v1/protected');
        $results['no_auth'] = [
            'status' => $response->get_status(),
            'blocked' => $response->get_status() === 401
        ];
        
        // Test with authentication
        $response = $this->helper->authenticated_request('GET', '/test/v1/protected', 'test_administrator');
        $results['with_auth'] = [
            'status' => $response->get_status(),
            'allowed' => $response->get_status() === 200
        ];
        
        $this->results['authentication'] = $results;
    }
    
    /**
     * Test permission system
     */
    private function test_permissions(): void {
        $results = $this->helper->test_permissions('/wp/v2/posts', 'POST', 
            ['administrator', 'editor', 'author'], 
            ['title' => 'Test Post', 'content' => 'Test content']
        );
        
        $this->results['permissions'] = $results;
    }
    
    /**
     * Test CRUD operations
     */
    private function test_crud_operations(): void {
        $results = $this->helper->test_post_type_crud(
            'post',
            [
                'title' => 'Test CRUD Post',
                'content' => 'Test CRUD content',
                'status' => 'publish'
            ],
            [
                'title' => 'Updated CRUD Post',
                'content' => 'Updated CRUD content'
            ],
            'test_administrator'
        );
        
        $this->results['crud_operations'] = $results;
    }
    
    /**
     * Test pagination
     */
    private function test_pagination(): void {
        $results = $this->helper->test_pagination('/wp/v2/posts', null, 2);
        $this->results['pagination'] = $results;
    }
    
    /**
     * Test search and filtering
     */
    private function test_search_and_filtering(): void {
        $results = [];
        
        // Test search
        $search_results = $this->helper->test_search('/wp/v2/posts', 'test');
        $results['search'] = $search_results;
        
        // Test filtering
        $filter_results = $this->helper->test_filtering('/wp/v2/posts', [
            'status' => 'publish',
            'orderby' => 'date',
            'order' => 'desc'
        ]);
        $results['filtering'] = $filter_results;
        
        $this->results['search_and_filtering'] = $results;
    }
}

/**
 * Mock data generators for WordPress
 */
class WPMockDataGenerator {
    
    /**
     * Generate mock post data
     */
    public static function post(array $overrides = []): array {
        $defaults = [
            'title' => 'Test Post ' . rand(1, 1000),
            'content' => 'This is test post content.',
            'excerpt' => 'This is a test excerpt.',
            'status' => 'publish',
            'author' => 1,
            'date' => current_time('mysql'),
            'featured_media' => 0,
            'comment_status' => 'open',
            'ping_status' => 'open',
            'sticky' => false,
            'format' => 'standard',
            'categories' => [1],
            'tags' => []
        ];
        
        return array_merge($defaults, $overrides);
    }
    
    /**
     * Generate mock user data
     */
    public static function user(array $overrides = []): array {
        $defaults = [
            'username' => 'testuser' . rand(1, 1000),
            'email' => 'test' . rand(1, 1000) . '@example.com',
            'first_name' => 'Test',
            'last_name' => 'User',
            'nickname' => 'testuser',
            'description' => 'This is a test user.',
            'roles' => ['subscriber']
        ];
        
        return array_merge($defaults, $overrides);
    }
    
    /**
     * Generate mock comment data
     */
    public static function comment(int $post_id, array $overrides = []): array {
        $defaults = [
            'post' => $post_id,
            'author_name' => 'Test Commenter',
            'author_email' => 'commenter@example.com',
            'author_url' => 'https://example.com',
            'content' => 'This is a test comment.',
            'status' => 'approved',
            'type' => 'comment',
            'parent' => 0
        ];
        
        return array_merge($defaults, $overrides);
    }
}

// Example usage functions

/**
 * Example: Test WordPress REST API
 */
function example_wp_rest_test() {
    $helper = new WPRestTestHelper();
    $helper->setup();
    
    try {
        // Test getting posts
        $response = $helper->get('/wp/v2/posts');
        $helper->assert_response_status($response, 200);
        $helper->assert_response_has_data($response);
        
        // Test creating a post
        $post_data = WPMockDataGenerator::post([
            'title' => 'API Test Post',
            'content' => 'Content created via API test'
        ]);
        
        $create_response = $helper->authenticated_request(
            'POST', 
            '/wp/v2/posts', 
            'test_administrator', 
            [], 
            $post_data
        );
        
        $helper->assert_response_status($create_response, 201);
        
        echo "WordPress REST API test completed successfully!\n";
        
    } catch (Exception $e) {
        echo "Test failed: " . $e->getMessage() . "\n";
    } finally {
        $helper->teardown();
    }
}

/**
 * Example: Run comprehensive test suite
 */
function example_comprehensive_test() {
    $helper = new WPRestTestHelper();
    $suite = new WPRestTestSuite($helper);
    
    $helper->setup();
    
    try {
        $results = $suite->run_comprehensive_tests();
        
        echo "Comprehensive test results:\n";
        echo json_encode($results, JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo "Test suite failed: " . $e->getMessage() . "\n";
    } finally {
        $helper->teardown();
    }
}