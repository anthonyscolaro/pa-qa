<?php
/**
 * WordPress Database Testing Helpers
 * Provides comprehensive database testing utilities for WordPress applications
 */

namespace PAQAFramework\Database;

use WP_UnitTestCase;
use WP_User;
use WP_Post;
use WP_Term;
use wpdb;
use Exception;

/**
 * WordPress Database Test Helper
 */
class WPDatabaseTestHelper
{
    /**
     * @var wpdb WordPress database instance
     */
    private $wpdb;

    /**
     * @var array Cleanup tasks to run after tests
     */
    private $cleanup_tasks = [];

    /**
     * @var array Created objects to track for cleanup
     */
    private $created_objects = [
        'posts' => [],
        'users' => [],
        'terms' => [],
        'comments' => [],
        'attachments' => [],
        'options' => [],
    ];

    /**
     * @var bool Whether to use transactions
     */
    private $use_transactions;

    public function __construct($use_transactions = true)
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->use_transactions = $use_transactions;
    }

    /**
     * Start a database transaction
     */
    public function start_transaction(): void
    {
        if ($this->use_transactions) {
            $this->wpdb->query('START TRANSACTION');
        }
    }

    /**
     * Rollback database transaction
     */
    public function rollback_transaction(): void
    {
        if ($this->use_transactions) {
            $this->wpdb->query('ROLLBACK');
        }
    }

    /**
     * Commit database transaction
     */
    public function commit_transaction(): void
    {
        if ($this->use_transactions) {
            $this->wpdb->query('COMMIT');
        }
    }

    /**
     * Create a savepoint
     */
    public function create_savepoint(string $name): void
    {
        $this->wpdb->query($this->wpdb->prepare('SAVEPOINT %i', $name));
    }

    /**
     * Rollback to savepoint
     */
    public function rollback_to_savepoint(string $name): void
    {
        $this->wpdb->query($this->wpdb->prepare('ROLLBACK TO SAVEPOINT %i', $name));
    }

    /**
     * Get table prefix
     */
    public function get_table_prefix(): string
    {
        return $this->wpdb->prefix;
    }

    /**
     * Truncate WordPress tables
     */
    public function truncate_tables(array $tables = []): void
    {
        if (empty($tables)) {
            $tables = $this->get_core_tables();
        }

        $this->wpdb->query('SET FOREIGN_KEY_CHECKS = 0');
        
        foreach ($tables as $table) {
            $this->wpdb->query("TRUNCATE TABLE {$table}");
        }
        
        $this->wpdb->query('SET FOREIGN_KEY_CHECKS = 1');
    }

    /**
     * Get WordPress core tables
     */
    public function get_core_tables(): array
    {
        return [
            $this->wpdb->posts,
            $this->wpdb->postmeta,
            $this->wpdb->comments,
            $this->wpdb->commentmeta,
            $this->wpdb->terms,
            $this->wpdb->termmeta,
            $this->wpdb->term_taxonomy,
            $this->wpdb->term_relationships,
            $this->wpdb->users,
            $this->wpdb->usermeta,
            $this->wpdb->options,
        ];
    }

    /**
     * Reset WordPress to clean state
     */
    public function reset_wordpress(): void
    {
        // Clean up created objects
        $this->cleanup_created_objects();
        
        // Reset global post
        global $post;
        $post = null;
        
        // Reset current user
        wp_set_current_user(0);
        
        // Clear object cache
        wp_cache_flush();
        
        // Reset query vars
        global $wp_query;
        if ($wp_query) {
            $wp_query->init();
        }
    }

    /**
     * Clean up all created objects
     */
    public function cleanup_created_objects(): void
    {
        // Delete posts
        foreach ($this->created_objects['posts'] as $post_id) {
            wp_delete_post($post_id, true);
        }

        // Delete users (except admin)
        foreach ($this->created_objects['users'] as $user_id) {
            if ($user_id !== 1) {
                wp_delete_user($user_id);
            }
        }

        // Delete terms
        foreach ($this->created_objects['terms'] as $term_data) {
            wp_delete_term($term_data['term_id'], $term_data['taxonomy']);
        }

        // Delete comments
        foreach ($this->created_objects['comments'] as $comment_id) {
            wp_delete_comment($comment_id, true);
        }

        // Delete attachments
        foreach ($this->created_objects['attachments'] as $attachment_id) {
            wp_delete_attachment($attachment_id, true);
        }

        // Delete options
        foreach ($this->created_objects['options'] as $option_name) {
            delete_option($option_name);
        }

        // Clear arrays
        $this->created_objects = [
            'posts' => [],
            'users' => [],
            'terms' => [],
            'comments' => [],
            'attachments' => [],
            'options' => [],
        ];
    }
}

/**
 * WordPress Factory for creating test data
 */
class WPTestDataFactory
{
    /**
     * @var WPDatabaseTestHelper
     */
    private $db_helper;

    public function __construct(WPDatabaseTestHelper $db_helper)
    {
        $this->db_helper = $db_helper;
    }

    /**
     * Create test user
     */
    public function create_user(array $args = []): WP_User
    {
        $defaults = [
            'user_login' => 'testuser_' . wp_generate_password(8, false),
            'user_email' => 'test_' . wp_generate_password(8, false) . '@example.com',
            'user_pass' => wp_generate_password(12, false),
            'first_name' => 'Test',
            'last_name' => 'User',
            'display_name' => 'Test User',
            'role' => 'subscriber',
        ];

        $user_data = wp_parse_args($args, $defaults);
        $user_id = wp_insert_user($user_data);

        if (is_wp_error($user_id)) {
            throw new Exception('Failed to create user: ' . $user_id->get_error_message());
        }

        $this->db_helper->created_objects['users'][] = $user_id;
        return get_user_by('id', $user_id);
    }

    /**
     * Create test post
     */
    public function create_post(array $args = []): WP_Post
    {
        $defaults = [
            'post_title' => 'Test Post ' . wp_generate_password(8, false),
            'post_content' => 'This is test content for the post.',
            'post_status' => 'publish',
            'post_type' => 'post',
            'post_author' => 1,
        ];

        $post_data = wp_parse_args($args, $defaults);
        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            throw new Exception('Failed to create post: ' . $post_id->get_error_message());
        }

        $this->db_helper->created_objects['posts'][] = $post_id;
        return get_post($post_id);
    }

    /**
     * Create test page
     */
    public function create_page(array $args = []): WP_Post
    {
        $defaults = [
            'post_type' => 'page',
            'post_title' => 'Test Page ' . wp_generate_password(8, false),
            'post_content' => 'This is test content for the page.',
            'post_status' => 'publish',
        ];

        return $this->create_post(wp_parse_args($args, $defaults));
    }

    /**
     * Create test category
     */
    public function create_category(array $args = []): WP_Term
    {
        $defaults = [
            'name' => 'Test Category ' . wp_generate_password(8, false),
            'slug' => 'test-category-' . wp_generate_password(8, false),
            'description' => 'Test category description',
        ];

        $term_data = wp_parse_args($args, $defaults);
        $result = wp_insert_term($term_data['name'], 'category', $term_data);

        if (is_wp_error($result)) {
            throw new Exception('Failed to create category: ' . $result->get_error_message());
        }

        $this->db_helper->created_objects['terms'][] = [
            'term_id' => $result['term_id'],
            'taxonomy' => 'category'
        ];

        return get_term($result['term_id'], 'category');
    }

    /**
     * Create test tag
     */
    public function create_tag(array $args = []): WP_Term
    {
        $defaults = [
            'name' => 'Test Tag ' . wp_generate_password(8, false),
            'slug' => 'test-tag-' . wp_generate_password(8, false),
        ];

        $term_data = wp_parse_args($args, $defaults);
        $result = wp_insert_term($term_data['name'], 'post_tag', $term_data);

        if (is_wp_error($result)) {
            throw new Exception('Failed to create tag: ' . $result->get_error_message());
        }

        $this->db_helper->created_objects['terms'][] = [
            'term_id' => $result['term_id'],
            'taxonomy' => 'post_tag'
        ];

        return get_term($result['term_id'], 'post_tag');
    }

    /**
     * Create test comment
     */
    public function create_comment(array $args = []): object
    {
        if (!isset($args['comment_post_ID'])) {
            $post = $this->create_post();
            $args['comment_post_ID'] = $post->ID;
        }

        $defaults = [
            'comment_content' => 'This is a test comment.',
            'comment_author' => 'Test Commenter',
            'comment_author_email' => 'test@example.com',
            'comment_approved' => 1,
        ];

        $comment_data = wp_parse_args($args, $defaults);
        $comment_id = wp_insert_comment($comment_data);

        if (!$comment_id) {
            throw new Exception('Failed to create comment');
        }

        $this->db_helper->created_objects['comments'][] = $comment_id;
        return get_comment($comment_id);
    }

    /**
     * Create test attachment
     */
    public function create_attachment(array $args = []): WP_Post
    {
        $defaults = [
            'post_title' => 'Test Attachment ' . wp_generate_password(8, false),
            'post_content' => '',
            'post_status' => 'inherit',
            'post_type' => 'attachment',
            'post_mime_type' => 'image/jpeg',
        ];

        $attachment_data = wp_parse_args($args, $defaults);
        $attachment_id = wp_insert_post($attachment_data);

        if (is_wp_error($attachment_id)) {
            throw new Exception('Failed to create attachment: ' . $attachment_id->get_error_message());
        }

        $this->db_helper->created_objects['attachments'][] = $attachment_id;
        return get_post($attachment_id);
    }

    /**
     * Create multiple posts with relationships
     */
    public function create_posts_with_relationships(int $count = 5): array
    {
        $posts = [];
        $category = $this->create_category();
        $tags = [];

        // Create some tags
        for ($i = 0; $i < 3; $i++) {
            $tags[] = $this->create_tag();
        }

        // Create posts
        for ($i = 0; $i < $count; $i++) {
            $post = $this->create_post([
                'post_title' => "Test Post {$i}",
                'post_content' => "This is test content for post {$i}.",
            ]);

            // Assign category
            wp_set_post_categories($post->ID, [$category->term_id]);

            // Assign random tags
            $post_tags = array_rand($tags, rand(1, count($tags)));
            if (!is_array($post_tags)) {
                $post_tags = [$post_tags];
            }
            
            $tag_ids = array_map(function($index) use ($tags) {
                return $tags[$index]->term_id;
            }, $post_tags);
            
            wp_set_post_tags($post->ID, $tag_ids);

            // Create some comments
            for ($j = 0; $j < rand(1, 3); $j++) {
                $this->create_comment([
                    'comment_post_ID' => $post->ID,
                    'comment_content' => "Comment {$j} on post {$i}",
                ]);
            }

            $posts[] = $post;
        }

        return $posts;
    }

    /**
     * Set test option
     */
    public function set_option(string $option_name, $option_value): void
    {
        update_option($option_name, $option_value);
        $this->db_helper->created_objects['options'][] = $option_name;
    }
}

/**
 * WordPress Performance Monitor
 */
class WPPerformanceMonitor
{
    /**
     * @var array Query log
     */
    private $queries = [];

    /**
     * @var float Start time
     */
    private $start_time;

    /**
     * @var bool Whether monitoring is active
     */
    private $monitoring = false;

    public function start_monitoring(): void
    {
        if (!defined('SAVEQUERIES')) {
            define('SAVEQUERIES', true);
        }

        $this->monitoring = true;
        $this->start_time = microtime(true);
        $this->queries = [];

        // Hook into WordPress query logging
        add_action('wp_footer', [$this, 'log_queries']);
        add_action('admin_footer', [$this, 'log_queries']);
    }

    public function stop_monitoring(): array
    {
        $this->monitoring = false;
        $end_time = microtime(true);
        
        return [
            'total_time' => $end_time - $this->start_time,
            'query_count' => count($this->queries),
            'queries' => $this->queries,
            'slow_queries' => $this->get_slow_queries(),
        ];
    }

    public function log_queries(): void
    {
        if (!$this->monitoring) {
            return;
        }

        global $wpdb;
        
        if (!empty($wpdb->queries)) {
            foreach ($wpdb->queries as $query) {
                $this->queries[] = [
                    'sql' => $query[0],
                    'time' => $query[1],
                    'stack' => $query[2] ?? '',
                ];
            }
        }
    }

    public function get_slow_queries(float $threshold = 0.01): array
    {
        return array_filter($this->queries, function($query) use ($threshold) {
            return $query['time'] > $threshold;
        });
    }

    public function get_duplicate_queries(): array
    {
        $query_counts = [];
        $duplicates = [];

        foreach ($this->queries as $query) {
            $sql = $query['sql'];
            if (!isset($query_counts[$sql])) {
                $query_counts[$sql] = 0;
            }
            $query_counts[$sql]++;
        }

        foreach ($query_counts as $sql => $count) {
            if ($count > 1) {
                $duplicates[] = [
                    'sql' => $sql,
                    'count' => $count,
                ];
            }
        }

        return $duplicates;
    }
}

/**
 * WordPress Multisite Test Helper
 */
class WPMultisiteTestHelper extends WPDatabaseTestHelper
{
    /**
     * Create test site
     */
    public function create_site(array $args = []): int
    {
        if (!is_multisite()) {
            throw new Exception('WordPress multisite is not enabled');
        }

        $defaults = [
            'domain' => 'testsite' . wp_generate_password(8, false) . '.example.com',
            'path' => '/',
            'title' => 'Test Site',
            'user_id' => 1,
        ];

        $site_data = wp_parse_args($args, $defaults);
        $site_id = wp_insert_site($site_data);

        if (is_wp_error($site_id)) {
            throw new Exception('Failed to create site: ' . $site_id->get_error_message());
        }

        return $site_id;
    }

    /**
     * Switch to test site
     */
    public function switch_to_site(int $site_id): void
    {
        switch_to_blog($site_id);
    }

    /**
     * Restore current site
     */
    public function restore_current_site(): void
    {
        restore_current_blog();
    }

    /**
     * Delete test site
     */
    public function delete_site(int $site_id): bool
    {
        return wp_delete_site($site_id);
    }
}

/**
 * WordPress Database Assertions
 */
class WPDatabaseAssertions
{
    /**
     * Assert post exists
     */
    public static function assertPostExists(int $post_id, string $message = ''): void
    {
        $post = get_post($post_id);
        if (!$post) {
            throw new Exception($message ?: "Post with ID {$post_id} does not exist");
        }
    }

    /**
     * Assert post has status
     */
    public static function assertPostHasStatus(int $post_id, string $status, string $message = ''): void
    {
        $post = get_post($post_id);
        if (!$post || $post->post_status !== $status) {
            throw new Exception($message ?: "Post {$post_id} does not have status '{$status}'");
        }
    }

    /**
     * Assert user exists
     */
    public static function assertUserExists(int $user_id, string $message = ''): void
    {
        $user = get_user_by('id', $user_id);
        if (!$user) {
            throw new Exception($message ?: "User with ID {$user_id} does not exist");
        }
    }

    /**
     * Assert user has role
     */
    public static function assertUserHasRole(int $user_id, string $role, string $message = ''): void
    {
        $user = get_user_by('id', $user_id);
        if (!$user || !in_array($role, $user->roles)) {
            throw new Exception($message ?: "User {$user_id} does not have role '{$role}'");
        }
    }

    /**
     * Assert term exists
     */
    public static function assertTermExists(int $term_id, string $taxonomy = '', string $message = ''): void
    {
        $term = get_term($term_id, $taxonomy);
        if (!$term || is_wp_error($term)) {
            throw new Exception($message ?: "Term with ID {$term_id} does not exist");
        }
    }

    /**
     * Assert option value
     */
    public static function assertOptionValue(string $option_name, $expected_value, string $message = ''): void
    {
        $actual_value = get_option($option_name);
        if ($actual_value !== $expected_value) {
            throw new Exception($message ?: "Option '{$option_name}' value mismatch");
        }
    }

    /**
     * Assert query count
     */
    public static function assertQueryCount(int $expected_count, string $message = ''): void
    {
        global $wpdb;
        $actual_count = $wpdb->num_queries;
        
        if ($actual_count !== $expected_count) {
            throw new Exception($message ?: "Expected {$expected_count} queries, got {$actual_count}");
        }
    }

    /**
     * Assert no slow queries
     */
    public static function assertNoSlowQueries(float $threshold = 0.01, string $message = ''): void
    {
        global $wpdb;
        
        if (!defined('SAVEQUERIES') || !SAVEQUERIES) {
            throw new Exception('SAVEQUERIES must be enabled to check query performance');
        }

        $slow_queries = array_filter($wpdb->queries, function($query) use ($threshold) {
            return $query[1] > $threshold;
        });

        if (!empty($slow_queries)) {
            throw new Exception($message ?: 'Slow queries detected: ' . count($slow_queries));
        }
    }
}

/**
 * WordPress Test Case Base Class
 */
abstract class WPDatabaseTestCase extends WP_UnitTestCase
{
    /**
     * @var WPDatabaseTestHelper
     */
    protected $db_helper;

    /**
     * @var WPTestDataFactory
     */
    protected $factory;

    /**
     * @var WPPerformanceMonitor
     */
    protected $performance_monitor;

    public function setUp(): void
    {
        parent::setUp();
        
        $this->db_helper = new WPDatabaseTestHelper();
        $this->factory = new WPTestDataFactory($this->db_helper);
        $this->performance_monitor = new WPPerformanceMonitor();
        
        $this->db_helper->start_transaction();
        $this->performance_monitor->start_monitoring();
    }

    public function tearDown(): void
    {
        $this->performance_monitor->stop_monitoring();
        $this->db_helper->rollback_transaction();
        $this->db_helper->cleanup_created_objects();
        
        parent::tearDown();
    }

    /**
     * Get performance stats for the test
     */
    protected function getPerformanceStats(): array
    {
        return $this->performance_monitor->stop_monitoring();
    }

    /**
     * Assert performance constraints
     */
    protected function assertPerformanceConstraints(int $max_queries = 50, float $max_time = 1.0): void
    {
        $stats = $this->getPerformanceStats();
        
        if ($stats['query_count'] > $max_queries) {
            $this->fail("Too many queries: {$stats['query_count']} (max: {$max_queries})");
        }
        
        if ($stats['total_time'] > $max_time) {
            $this->fail("Test took too long: {$stats['total_time']}s (max: {$max_time}s)");
        }
    }
}

/**
 * WordPress Custom Table Helper
 */
class WPCustomTableHelper
{
    /**
     * @var wpdb
     */
    private $wpdb;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
    }

    /**
     * Create custom table for testing
     */
    public function create_test_table(string $table_name, string $schema): bool
    {
        $table_name = $this->wpdb->prefix . $table_name;
        
        $sql = "CREATE TABLE {$table_name} ({$schema})";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        return $this->table_exists($table_name);
    }

    /**
     * Drop test table
     */
    public function drop_test_table(string $table_name): bool
    {
        $table_name = $this->wpdb->prefix . $table_name;
        $result = $this->wpdb->query("DROP TABLE IF EXISTS {$table_name}");
        
        return $result !== false;
    }

    /**
     * Check if table exists
     */
    public function table_exists(string $table_name): bool
    {
        $table_name = $this->wpdb->prefix . $table_name;
        $query = $this->wpdb->prepare("SHOW TABLES LIKE %s", $table_name);
        
        return $this->wpdb->get_var($query) === $table_name;
    }

    /**
     * Insert test data into custom table
     */
    public function insert_test_data(string $table_name, array $data): int
    {
        $table_name = $this->wpdb->prefix . $table_name;
        $result = $this->wpdb->insert($table_name, $data);
        
        if ($result === false) {
            throw new Exception('Failed to insert test data: ' . $this->wpdb->last_error);
        }
        
        return $this->wpdb->insert_id;
    }
}