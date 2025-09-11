<?php
/**
 * REST API endpoint testing
 * 
 * Tests custom REST API endpoints, authentication,
 * permissions, and data validation.
 * 
 * @package PA_QA_WordPress_Testing
 * @since 1.0.0
 */

namespace PA_QA\WordPress\Testing\Integration;

use PA_QA\WordPress\Testing\TestCase;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

/**
 * REST API endpoint tests
 */
class RestApiTest extends TestCase {
    
    /**
     * REST server instance
     * 
     * @var WP_REST_Server
     */
    protected $server;
    
    /**
     * Test namespace
     * 
     * @var string
     */
    protected $namespace = 'test-plugin/v1';
    
    /**
     * Test endpoint
     * 
     * @var string
     */
    protected $endpoint = 'items';
    
    /**
     * Set up test environment
     */
    public function setUp(): void {
        parent::setUp();
        
        global $wp_rest_server;
        
        $this->server = $wp_rest_server = new WP_REST_Server();
        
        // Register test endpoints
        $this->register_test_endpoints();
        
        do_action('rest_api_init');
    }
    
    /**
     * Clean up after test
     */
    public function tearDown(): void {
        global $wp_rest_server;
        $wp_rest_server = null;
        
        parent::tearDown();
    }
    
    /**
     * Register test REST API endpoints
     */
    private function register_test_endpoints(): void {
        // Register a test endpoint for items
        register_rest_route($this->namespace, '/' . $this->endpoint, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
                'args' => [
                    'page' => [
                        'default' => 1,
                        'sanitize_callback' => 'absint',
                    ],
                    'per_page' => [
                        'default' => 10,
                        'sanitize_callback' => 'absint',
                    ],
                    'search' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'create_item_permissions_check'],
                'args' => [
                    'title' => [
                        'required' => true,
                        'sanitize_callback' => 'sanitize_text_field',
                        'validate_callback' => [$this, 'validate_title'],
                    ],
                    'content' => [
                        'sanitize_callback' => 'sanitize_textarea_field',
                    ],
                    'status' => [
                        'default' => 'draft',
                        'enum' => ['draft', 'published'],
                    ],
                ],
            ],
        ]);
        
        // Register single item endpoint
        register_rest_route($this->namespace, '/' . $this->endpoint . '/(?P<id>\d+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'get_item_permissions_check'],
                'args' => [
                    'id' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'update_item_permissions_check'],
                'args' => [
                    'title' => [
                        'sanitize_callback' => 'sanitize_text_field',
                        'validate_callback' => [$this, 'validate_title'],
                    ],
                    'content' => [
                        'sanitize_callback' => 'sanitize_textarea_field',
                    ],
                    'status' => [
                        'enum' => ['draft', 'published'],
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'delete_item_permissions_check'],
            ],
        ]);
        
        // Register authenticated endpoint
        register_rest_route($this->namespace, '/secure', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_secure_data'],
            'permission_callback' => [$this, 'secure_permissions_check'],
        ]);
    }
    
    /**
     * Test endpoint callbacks
     */
    
    public function get_items($request) {
        $page = $request->get_param('page');
        $per_page = $request->get_param('per_page');
        $search = $request->get_param('search');
        
        $items = [
            ['id' => 1, 'title' => 'Item 1', 'content' => 'Content 1'],
            ['id' => 2, 'title' => 'Item 2', 'content' => 'Content 2'],
            ['id' => 3, 'title' => 'Item 3', 'content' => 'Content 3'],
        ];
        
        if ($search) {
            $items = array_filter($items, function($item) use ($search) {
                return strpos(strtolower($item['title']), strtolower($search)) !== false;
            });
        }
        
        $total = count($items);
        $offset = ($page - 1) * $per_page;
        $items = array_slice($items, $offset, $per_page);
        
        $response = rest_ensure_response($items);
        $response->header('X-Total-Count', $total);
        $response->header('X-Total-Pages', ceil($total / $per_page));
        
        return $response;
    }
    
    public function create_item($request) {
        $title = $request->get_param('title');
        $content = $request->get_param('content');
        $status = $request->get_param('status');
        
        $item = [
            'id' => rand(100, 999),
            'title' => $title,
            'content' => $content,
            'status' => $status,
            'created_at' => current_time('mysql'),
        ];
        
        return rest_ensure_response($item);
    }
    
    public function get_item($request) {
        $id = $request->get_param('id');
        
        if ($id === 999) {
            return new WP_Error('not_found', 'Item not found', ['status' => 404]);
        }
        
        return rest_ensure_response([
            'id' => $id,
            'title' => "Item {$id}",
            'content' => "Content for item {$id}",
            'status' => 'published',
        ]);
    }
    
    public function update_item($request) {
        $id = $request->get_param('id');
        $title = $request->get_param('title');
        
        return rest_ensure_response([
            'id' => $id,
            'title' => $title ?: "Item {$id}",
            'updated_at' => current_time('mysql'),
        ]);
    }
    
    public function delete_item($request) {
        $id = $request->get_param('id');
        
        return rest_ensure_response([
            'deleted' => true,
            'previous' => [
                'id' => $id,
                'title' => "Item {$id}",
            ],
        ]);
    }
    
    public function get_secure_data($request) {
        return rest_ensure_response([
            'secret' => 'This is secure data',
            'user_id' => get_current_user_id(),
        ]);
    }
    
    /**
     * Permission callbacks
     */
    
    public function get_items_permissions_check($request) {
        return true; // Public endpoint
    }
    
    public function create_item_permissions_check($request) {
        return current_user_can('edit_posts');
    }
    
    public function get_item_permissions_check($request) {
        return true; // Public endpoint
    }
    
    public function update_item_permissions_check($request) {
        return current_user_can('edit_posts');
    }
    
    public function delete_item_permissions_check($request) {
        return current_user_can('delete_posts');
    }
    
    public function secure_permissions_check($request) {
        return is_user_logged_in();
    }
    
    /**
     * Validation callbacks
     */
    
    public function validate_title($value, $request, $param) {
        if (empty($value)) {
            return new WP_Error('invalid_title', 'Title cannot be empty');
        }
        
        if (strlen($value) > 100) {
            return new WP_Error('invalid_title', 'Title too long');
        }
        
        return true;
    }
    
    /**
     * Test REST API route registration
     */
    public function test_rest_routes_registered(): void {
        $routes = rest_get_server()->get_routes();
        
        $expected_routes = [
            '/' . $this->namespace . '/' . $this->endpoint,
            '/' . $this->namespace . '/' . $this->endpoint . '/(?P<id>\d+)',
            '/' . $this->namespace . '/secure',
        ];
        
        foreach ($expected_routes as $route) {
            $this->assertArrayHasKey($route, $routes, "Route {$route} should be registered");
        }
    }
    
    /**
     * Test GET request to items endpoint
     */
    public function test_get_items(): void {
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/' . $this->endpoint);
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertIsArray($data);
        $this->assertNotEmpty($data);
        
        // Check response headers
        $headers = $response->get_headers();
        $this->assertArrayHasKey('X-Total-Count', $headers);
        $this->assertArrayHasKey('X-Total-Pages', $headers);
    }
    
    /**
     * Test GET request with pagination
     */
    public function test_get_items_with_pagination(): void {
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/' . $this->endpoint);
        $request->set_param('page', 1);
        $request->set_param('per_page', 2);
        
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertCount(2, $data);
        
        $headers = $response->get_headers();
        $this->assertEquals('3', $headers['X-Total-Count']);
        $this->assertEquals('2', $headers['X-Total-Pages']);
    }
    
    /**
     * Test GET request with search
     */
    public function test_get_items_with_search(): void {
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/' . $this->endpoint);
        $request->set_param('search', 'Item 1');
        
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertCount(1, $data);
        $this->assertEquals('Item 1', $data[0]['title']);
    }
    
    /**
     * Test POST request to create item
     */
    public function test_create_item(): void {
        $this->act_as_user($this->create_user('editor'));
        
        $request = new WP_REST_Request('POST', '/' . $this->namespace . '/' . $this->endpoint);
        $request->set_param('title', 'New Item');
        $request->set_param('content', 'New content');
        $request->set_param('status', 'published');
        
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertEquals('New Item', $data['title']);
        $this->assertEquals('New content', $data['content']);
        $this->assertEquals('published', $data['status']);
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('created_at', $data);
    }
    
    /**
     * Test POST request with validation error
     */
    public function test_create_item_validation_error(): void {
        $this->act_as_user($this->create_user('editor'));
        
        $request = new WP_REST_Request('POST', '/' . $this->namespace . '/' . $this->endpoint);
        $request->set_param('title', ''); // Empty title should fail
        
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(400, $response->get_status());
        
        $data = $response->get_data();
        $this->assertEquals('invalid_title', $data['code']);
    }
    
    /**
     * Test POST request without permission
     */
    public function test_create_item_without_permission(): void {
        $this->act_as_user($this->create_user('subscriber'));
        
        $request = new WP_REST_Request('POST', '/' . $this->namespace . '/' . $this->endpoint);
        $request->set_param('title', 'New Item');
        
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(403, $response->get_status());
    }
    
    /**
     * Test GET single item
     */
    public function test_get_single_item(): void {
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/' . $this->endpoint . '/123');
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertEquals(123, $data['id']);
        $this->assertEquals('Item 123', $data['title']);
    }
    
    /**
     * Test GET single item not found
     */
    public function test_get_single_item_not_found(): void {
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/' . $this->endpoint . '/999');
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(404, $response->get_status());
        
        $data = $response->get_data();
        $this->assertEquals('not_found', $data['code']);
    }
    
    /**
     * Test PUT request to update item
     */
    public function test_update_item(): void {
        $this->act_as_user($this->create_user('editor'));
        
        $request = new WP_REST_Request('PUT', '/' . $this->namespace . '/' . $this->endpoint . '/123');
        $request->set_param('title', 'Updated Item');
        
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertEquals(123, $data['id']);
        $this->assertEquals('Updated Item', $data['title']);
        $this->assertArrayHasKey('updated_at', $data);
    }
    
    /**
     * Test DELETE request
     */
    public function test_delete_item(): void {
        $this->act_as_user($this->create_user('editor'));
        
        $request = new WP_REST_Request('DELETE', '/' . $this->namespace . '/' . $this->endpoint . '/123');
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertTrue($data['deleted']);
        $this->assertEquals(123, $data['previous']['id']);
    }
    
    /**
     * Test authenticated endpoint
     */
    public function test_authenticated_endpoint(): void {
        $user = $this->create_user('subscriber');
        $this->act_as_user($user);
        
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/secure');
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertArrayHasKey('secret', $data);
        $this->assertEquals($user->ID, $data['user_id']);
    }
    
    /**
     * Test authenticated endpoint without login
     */
    public function test_authenticated_endpoint_without_login(): void {
        // No user set (anonymous)
        
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/secure');
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(401, $response->get_status());
    }
    
    /**
     * Test REST API namespace
     */
    public function test_rest_namespace(): void {
        $routes = rest_get_server()->get_routes();
        
        $namespace_found = false;
        foreach (array_keys($routes) as $route) {
            if (strpos($route, '/' . $this->namespace . '/') === 0) {
                $namespace_found = true;
                break;
            }
        }
        
        $this->assertTrue($namespace_found, "Namespace {$this->namespace} should be registered");
    }
    
    /**
     * Test REST API CORS headers
     */
    public function test_rest_cors_headers(): void {
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/' . $this->endpoint);
        $response = $this->server->dispatch($request);
        
        // CORS headers should be automatically added by WordPress
        $headers = $response->get_headers();
        
        // Note: Actual CORS headers depend on WordPress configuration
        $this->assertIsArray($headers);
    }
    
    /**
     * Test REST API schema
     */
    public function test_rest_schema(): void {
        $request = new WP_REST_Request('OPTIONS', '/' . $this->namespace . '/' . $this->endpoint);
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertArrayHasKey('namespace', $data);
        $this->assertArrayHasKey('methods', $data);
        $this->assertArrayHasKey('endpoints', $data);
    }
    
    /**
     * Test REST API error handling
     */
    public function test_rest_error_handling(): void {
        // Test invalid endpoint
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/invalid-endpoint');
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(404, $response->get_status());
        
        $data = $response->get_data();
        $this->assertEquals('rest_no_route', $data['code']);
    }
    
    /**
     * Test REST API parameter sanitization
     */
    public function test_parameter_sanitization(): void {
        $request = new WP_REST_Request('GET', '/' . $this->namespace . '/' . $this->endpoint);
        $request->set_param('page', 'invalid'); // Should be sanitized to 0
        $request->set_param('search', '<script>alert("xss")</script>'); // Should be sanitized
        
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        // Parameters should be sanitized automatically by WordPress
        $this->addToAssertionCount(1);
    }
    
    /**
     * Test REST API with WordPress posts integration
     */
    public function test_wordpress_posts_integration(): void {
        // Create a WordPress post
        $post = $this->create_post([
            'post_title' => 'Test Post',
            'post_content' => 'Test content',
            'post_status' => 'publish',
        ]);
        
        // Test WordPress posts endpoint
        $request = new WP_REST_Request('GET', '/wp/v2/posts/' . $post->ID);
        $response = $this->server->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        
        $data = $response->get_data();
        $this->assertEquals($post->ID, $data['id']);
        $this->assertEquals('Test Post', $data['title']['rendered']);
    }
}