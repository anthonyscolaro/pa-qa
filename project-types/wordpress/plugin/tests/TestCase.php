<?php
/**
 * Base TestCase class for WordPress plugin testing
 * 
 * Extends WP_UnitTestCase with additional utilities for
 * database transactions, user management, and testing helpers.
 * 
 * @package PA_QA_WordPress_Testing
 * @since 1.0.0
 */

namespace PA_QA\WordPress\Testing;

use WP_UnitTestCase;
use WP_User;
use WP_Post;
use WP_Error;

/**
 * Base test case class with WordPress testing utilities
 */
abstract class TestCase extends WP_UnitTestCase {
    
    /**
     * Database transaction support
     * 
     * @var bool
     */
    protected $use_transactions = true;
    
    /**
     * Created users during test
     * 
     * @var array
     */
    protected $created_users = [];
    
    /**
     * Created posts during test
     * 
     * @var array
     */
    protected $created_posts = [];
    
    /**
     * Created terms during test
     * 
     * @var array
     */
    protected $created_terms = [];
    
    /**
     * Original user ID
     * 
     * @var int
     */
    protected $original_user_id;
    
    /**
     * Hook callbacks to remove after test
     * 
     * @var array
     */
    protected $hooks_to_remove = [];
    
    /**
     * Options to clean up after test
     * 
     * @var array
     */
    protected $options_to_clean = [];
    
    /**
     * Set up test environment
     */
    public function setUp(): void {
        parent::setUp();
        
        // Store original user
        $this->original_user_id = get_current_user_id();
        
        // Start database transaction if enabled
        if ($this->use_transactions) {
            $this->start_transaction();
        }
        
        // Reset arrays
        $this->created_users = [];
        $this->created_posts = [];
        $this->created_terms = [];
        $this->hooks_to_remove = [];
        $this->options_to_clean = [];
        
        // Clean any existing transients
        $this->clean_transients();
    }
    
    /**
     * Clean up after test
     */
    public function tearDown(): void {
        // Restore original user
        if ($this->original_user_id) {
            wp_set_current_user($this->original_user_id);
        }
        
        // Remove hooks
        $this->remove_test_hooks();
        
        // Clean up created content if not using transactions
        if (!$this->use_transactions) {
            $this->clean_up_created_content();
            $this->clean_up_options();
        }
        
        // Rollback transaction if enabled
        if ($this->use_transactions) {
            $this->rollback_transaction();
        }
        
        // Clean transients
        $this->clean_transients();
        
        parent::tearDown();
    }
    
    /**
     * Start database transaction
     */
    protected function start_transaction(): void {
        global $wpdb;
        $wpdb->query('START TRANSACTION');
    }
    
    /**
     * Rollback database transaction
     */
    protected function rollback_transaction(): void {
        global $wpdb;
        $wpdb->query('ROLLBACK');
    }
    
    /**
     * Create a test user
     * 
     * @param string $role User role
     * @param array $args Additional user arguments
     * @return WP_User
     */
    protected function create_user($role = 'subscriber', $args = []): WP_User {
        $defaults = [
            'user_login' => 'testuser_' . wp_generate_uuid4(),
            'user_email' => 'test_' . wp_generate_uuid4() . '@example.com',
            'user_pass' => 'password123',
            'role' => $role,
        ];
        
        $user_data = wp_parse_args($args, $defaults);
        $user_id = wp_insert_user($user_data);
        
        $this->assertIsInt($user_id, 'Failed to create test user');
        $this->created_users[] = $user_id;
        
        return get_user_by('id', $user_id);
    }
    
    /**
     * Create a test post
     * 
     * @param array $args Post arguments
     * @return WP_Post
     */
    protected function create_post($args = []): WP_Post {
        $defaults = [
            'post_title' => 'Test Post ' . wp_generate_uuid4(),
            'post_content' => 'Test content for post',
            'post_status' => 'publish',
            'post_type' => 'post',
            'post_author' => $this->factory()->user->create(),
        ];
        
        $post_data = wp_parse_args($args, $defaults);
        $post_id = wp_insert_post($post_data);
        
        $this->assertIsInt($post_id, 'Failed to create test post');
        $this->created_posts[] = $post_id;
        
        return get_post($post_id);
    }
    
    /**
     * Create a test term
     * 
     * @param string $taxonomy Taxonomy name
     * @param array $args Term arguments
     * @return array Term data
     */
    protected function create_term($taxonomy = 'category', $args = []): array {
        $defaults = [
            'name' => 'Test Term ' . wp_generate_uuid4(),
            'description' => 'Test term description',
        ];
        
        $term_data = wp_parse_args($args, $defaults);
        $term = wp_insert_term($term_data['name'], $taxonomy, $term_data);
        
        $this->assertIsArray($term, 'Failed to create test term');
        $this->created_terms[] = ['term_id' => $term['term_id'], 'taxonomy' => $taxonomy];
        
        return $term;
    }
    
    /**
     * Set current user
     * 
     * @param WP_User|int $user User object or ID
     */
    protected function act_as_user($user): void {
        $user_id = is_object($user) ? $user->ID : $user;
        wp_set_current_user($user_id);
    }
    
    /**
     * Set current user as admin
     * 
     * @return WP_User
     */
    protected function act_as_admin(): WP_User {
        $admin = $this->create_user('administrator');
        $this->act_as_user($admin);
        return $admin;
    }
    
    /**
     * Add a hook callback to be removed after test
     * 
     * @param string $hook Hook name
     * @param callable $callback Callback function
     * @param int $priority Priority
     * @param int $accepted_args Number of accepted arguments
     */
    protected function add_test_hook($hook, $callback, $priority = 10, $accepted_args = 1): void {
        add_action($hook, $callback, $priority, $accepted_args);
        $this->hooks_to_remove[] = [$hook, $callback, $priority];
    }
    
    /**
     * Add a filter callback to be removed after test
     * 
     * @param string $hook Hook name
     * @param callable $callback Callback function
     * @param int $priority Priority
     * @param int $accepted_args Number of accepted arguments
     */
    protected function add_test_filter($hook, $callback, $priority = 10, $accepted_args = 1): void {
        add_filter($hook, $callback, $priority, $accepted_args);
        $this->hooks_to_remove[] = [$hook, $callback, $priority];
    }
    
    /**
     * Remove test hooks
     */
    protected function remove_test_hooks(): void {
        foreach ($this->hooks_to_remove as $hook_data) {
            list($hook, $callback, $priority) = $hook_data;
            remove_all_actions($hook, $priority);
            remove_all_filters($hook, $priority);
        }
    }
    
    /**
     * Set an option to be cleaned up after test
     * 
     * @param string $option Option name
     * @param mixed $value Option value
     * @param bool $autoload Whether to autoload
     */
    protected function set_test_option($option, $value, $autoload = true): void {
        update_option($option, $value, $autoload);
        $this->options_to_clean[] = $option;
    }
    
    /**
     * Clean up created content
     */
    protected function clean_up_created_content(): void {
        // Delete created posts
        foreach ($this->created_posts as $post_id) {
            wp_delete_post($post_id, true);
        }
        
        // Delete created users
        foreach ($this->created_users as $user_id) {
            if ($user_id !== $this->original_user_id) {
                wp_delete_user($user_id);
            }
        }
        
        // Delete created terms
        foreach ($this->created_terms as $term_data) {
            wp_delete_term($term_data['term_id'], $term_data['taxonomy']);
        }
    }
    
    /**
     * Clean up test options
     */
    protected function clean_up_options(): void {
        foreach ($this->options_to_clean as $option) {
            delete_option($option);
        }
    }
    
    /**
     * Clean transients
     */
    protected function clean_transients(): void {
        global $wpdb;
        
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_site_transient_%'");
        
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
    }
    
    /**
     * Assert that a hook has a callback
     * 
     * @param string $hook Hook name
     * @param callable|string $callback Callback to check
     * @param int $priority Priority to check
     */
    protected function assertHookHasCallback($hook, $callback, $priority = 10): void {
        $this->assertTrue(
            has_action($hook, $callback),
            "Hook '{$hook}' does not have the expected callback"
        );
    }
    
    /**
     * Assert that a hook does not have a callback
     * 
     * @param string $hook Hook name
     * @param callable|string $callback Callback to check
     */
    protected function assertHookDoesNotHaveCallback($hook, $callback): void {
        $this->assertFalse(
            has_action($hook, $callback),
            "Hook '{$hook}' unexpectedly has the callback"
        );
    }
    
    /**
     * Assert that user has capability
     * 
     * @param string $capability Capability to check
     * @param WP_User|int|null $user User to check (null for current user)
     */
    protected function assertUserHasCapability($capability, $user = null): void {
        if ($user === null) {
            $user = wp_get_current_user();
        } elseif (is_int($user)) {
            $user = get_user_by('id', $user);
        }
        
        $this->assertTrue(
            $user->has_cap($capability),
            "User does not have capability '{$capability}'"
        );
    }
    
    /**
     * Assert that user does not have capability
     * 
     * @param string $capability Capability to check
     * @param WP_User|int|null $user User to check (null for current user)
     */
    protected function assertUserDoesNotHaveCapability($capability, $user = null): void {
        if ($user === null) {
            $user = wp_get_current_user();
        } elseif (is_int($user)) {
            $user = get_user_by('id', $user);
        }
        
        $this->assertFalse(
            $user->has_cap($capability),
            "User unexpectedly has capability '{$capability}'"
        );
    }
    
    /**
     * Assert that post type exists
     * 
     * @param string $post_type Post type name
     */
    protected function assertPostTypeExists($post_type): void {
        $this->assertTrue(
            post_type_exists($post_type),
            "Post type '{$post_type}' does not exist"
        );
    }
    
    /**
     * Assert that taxonomy exists
     * 
     * @param string $taxonomy Taxonomy name
     */
    protected function assertTaxonomyExists($taxonomy): void {
        $this->assertTrue(
            taxonomy_exists($taxonomy),
            "Taxonomy '{$taxonomy}' does not exist"
        );
    }
    
    /**
     * Mock WordPress HTTP request
     * 
     * @param string $url URL to mock
     * @param array $response Response data
     * @param int $status HTTP status code
     */
    protected function mock_http_request($url, $response = [], $status = 200): void {
        $this->add_test_filter('pre_http_request', function($preempt, $args, $request_url) use ($url, $response, $status) {
            if (strpos($request_url, $url) !== false) {
                return [
                    'headers' => [],
                    'body' => is_array($response) ? wp_json_encode($response) : $response,
                    'response' => [
                        'code' => $status,
                        'message' => 'OK'
                    ],
                    'cookies' => [],
                    'filename' => null,
                ];
            }
            return $preempt;
        }, 10, 3);
    }
}