<?php
/**
 * PHPUnit bootstrap file for WordPress plugin testing
 * 
 * This file sets up the WordPress test environment with @wordpress/env
 * and configures PHPUnit 9.x for WordPress plugin testing.
 * 
 * @package PA_QA_WordPress_Testing
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define testing constants
define('WP_TESTS_PHPUNIT_POLYFILLS_PATH', __DIR__ . '/../vendor/yoast/phpunit-polyfills');
define('WP_TESTS_CONFIG_FILE_PATH', __DIR__ . '/wp-tests-config.php');

// WordPress test environment detection
$_tests_dir = getenv('WP_TESTS_DIR');
if (!$_tests_dir) {
    $_tests_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress-tests-lib';
}

// Alternative paths for @wordpress/env setup
if (!file_exists($_tests_dir . '/includes/functions.php')) {
    $possible_paths = [
        '/tmp/wordpress-tests-lib',
        dirname(__FILE__) . '/../../../../../tests/phpunit',
        dirname(__FILE__) . '/../../../wordpress-develop/tests/phpunit',
    ];
    
    foreach ($possible_paths as $path) {
        if (file_exists($path . '/includes/functions.php')) {
            $_tests_dir = $path;
            break;
        }
    }
}

if (!file_exists($_tests_dir . '/includes/functions.php')) {
    die("Could not find WordPress tests directory. Please ensure @wordpress/env is properly set up.\n");
}

// Give access to tests_add_filter() function
require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 * 
 * This function is called before WordPress is loaded.
 * Use this to load your plugin or theme files.
 */
function _manually_load_plugin() {
    // Load your plugin here
    // require dirname(__FILE__) . '/../your-plugin.php';
    
    // Example: Load a sample plugin for testing
    if (file_exists(dirname(__FILE__) . '/../plugin.php')) {
        require dirname(__FILE__) . '/../plugin.php';
    }
}

// Hook plugin loading
tests_add_filter('muplugins_loaded', '_manually_load_plugin');

/**
 * Set up WordPress testing environment variables
 */
function _setup_test_environment() {
    // Enable WordPress debug mode for testing
    if (!defined('WP_DEBUG')) {
        define('WP_DEBUG', true);
    }
    
    if (!defined('WP_DEBUG_LOG')) {
        define('WP_DEBUG_LOG', true);
    }
    
    if (!defined('WP_DEBUG_DISPLAY')) {
        define('WP_DEBUG_DISPLAY', false);
    }
    
    // Set up test-specific constants
    if (!defined('WP_TESTS_DOMAIN')) {
        define('WP_TESTS_DOMAIN', 'example.org');
    }
    
    if (!defined('WP_TESTS_EMAIL')) {
        define('WP_TESTS_EMAIL', 'admin@example.org');
    }
    
    if (!defined('WP_TESTS_TITLE')) {
        define('WP_TESTS_TITLE', 'Test Blog');
    }
    
    // Enable multisite testing if needed
    if (getenv('WP_MULTISITE') === '1' || getenv('WP_TESTS_MULTISITE') === '1') {
        define('WP_TESTS_MULTISITE', true);
    }
}

// Set up test environment
tests_add_filter('setup_theme', '_setup_test_environment');

/**
 * Load PHPUnit Polyfills for PHPUnit 9.x compatibility
 */
if (file_exists(WP_TESTS_PHPUNIT_POLYFILLS_PATH . '/phpunitpolyfills-autoload.php')) {
    require_once WP_TESTS_PHPUNIT_POLYFILLS_PATH . '/phpunitpolyfills-autoload.php';
}

// Start up the WP testing environment
require $_tests_dir . '/includes/bootstrap.php';

// Load custom test utilities
require_once __DIR__ . '/TestCase.php';

/**
 * Clean up after tests
 */
register_shutdown_function(function() {
    // Clean up any test artifacts
    if (function_exists('wp_clear_scheduled_hooks')) {
        wp_clear_scheduled_hooks();
    }
});

/**
 * Global test helper functions
 */

/**
 * Create a test user with specific capabilities
 * 
 * @param string $role User role
 * @param array $meta Additional user meta
 * @return int User ID
 */
function create_test_user($role = 'subscriber', $meta = []) {
    $user_id = wp_insert_user([
        'user_login' => 'testuser_' . wp_generate_uuid4(),
        'user_email' => 'test_' . wp_generate_uuid4() . '@example.com',
        'user_pass' => 'password',
        'role' => $role,
    ]);
    
    if (is_wp_error($user_id)) {
        throw new Exception('Failed to create test user: ' . $user_id->get_error_message());
    }
    
    // Add user meta
    foreach ($meta as $key => $value) {
        update_user_meta($user_id, $key, $value);
    }
    
    return $user_id;
}

/**
 * Create a test post with specified parameters
 * 
 * @param array $args Post arguments
 * @return int Post ID
 */
function create_test_post($args = []) {
    $defaults = [
        'post_title' => 'Test Post',
        'post_content' => 'Test content',
        'post_status' => 'publish',
        'post_type' => 'post',
        'post_author' => 1,
    ];
    
    $args = wp_parse_args($args, $defaults);
    $post_id = wp_insert_post($args);
    
    if (is_wp_error($post_id)) {
        throw new Exception('Failed to create test post: ' . $post_id->get_error_message());
    }
    
    return $post_id;
}

/**
 * Clean WordPress transients
 */
function clean_test_transients() {
    global $wpdb;
    
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_site_transient_%'");
    
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
}

/**
 * Reset WordPress to clean state
 */
function reset_wordpress_state() {
    // Clear scheduled events
    wp_clear_scheduled_hooks();
    
    // Clean transients
    clean_test_transients();
    
    // Reset global variables
    global $wp_filter, $wp_actions, $wp_current_filter;
    $wp_filter = [];
    $wp_actions = [];
    $wp_current_filter = [];
    
    // Clear any output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }
}