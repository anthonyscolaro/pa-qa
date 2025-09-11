<?php
/**
 * Multisite functionality tests
 * 
 * Tests multisite-specific functionality, network activation,
 * site switching, and network-wide operations.
 * 
 * @package PA_QA_WordPress_Testing
 * @since 1.0.0
 */

namespace PA_QA\WordPress\Testing\Unit;

use PA_QA\WordPress\Testing\TestCase;

/**
 * Multisite functionality tests
 */
class MultisiteTest extends TestCase {
    
    /**
     * Network option name for testing
     * 
     * @var string
     */
    private $network_option = 'test_network_option';
    
    /**
     * Test blog IDs
     * 
     * @var array
     */
    private $test_blog_ids = [];
    
    /**
     * Set up test environment
     */
    public function setUp(): void {
        parent::setUp();
        
        // Skip tests if not multisite
        if (!is_multisite()) {
            $this->markTestSkipped('Multisite tests require multisite installation');
        }
        
        // Create test blogs for multisite testing
        $this->create_test_blogs();
    }
    
    /**
     * Clean up after test
     */
    public function tearDown(): void {
        // Clean up test blogs
        $this->cleanup_test_blogs();
        
        // Clean up network options
        delete_site_option($this->network_option);
        
        parent::tearDown();
    }
    
    /**
     * Create test blogs for multisite testing
     */
    private function create_test_blogs(): void {
        if (!is_multisite()) {
            return;
        }
        
        // Create a test subsite
        $blog_id = $this->factory()->blog->create([
            'domain' => 'testblog.example.org',
            'path' => '/testblog/',
            'title' => 'Test Blog',
            'user_id' => 1,
        ]);
        
        if ($blog_id && !is_wp_error($blog_id)) {
            $this->test_blog_ids[] = $blog_id;
        }
        
        // Create another test subsite
        $blog_id2 = $this->factory()->blog->create([
            'domain' => 'testblog2.example.org',
            'path' => '/testblog2/',
            'title' => 'Test Blog 2',
            'user_id' => 1,
        ]);
        
        if ($blog_id2 && !is_wp_error($blog_id2)) {
            $this->test_blog_ids[] = $blog_id2;
        }
    }
    
    /**
     * Clean up test blogs
     */
    private function cleanup_test_blogs(): void {
        foreach ($this->test_blog_ids as $blog_id) {
            if (function_exists('wpmu_delete_blog')) {
                wpmu_delete_blog($blog_id, true);
            }
        }
        $this->test_blog_ids = [];
    }
    
    /**
     * Test multisite detection
     */
    public function test_multisite_detection(): void {
        $this->assertTrue(is_multisite(), 'Should detect multisite installation');
        $this->assertTrue(function_exists('is_multisite'), 'is_multisite function should exist');
        $this->assertTrue(function_exists('get_sites'), 'get_sites function should exist');
    }
    
    /**
     * Test network options
     */
    public function test_network_options(): void {
        // Test adding network option
        $test_value = ['network' => 'setting', 'multisite' => true];
        $result = add_site_option($this->network_option, $test_value);
        
        $this->assertTrue($result, 'Network option should be added');
        
        // Test retrieving network option
        $retrieved_value = get_site_option($this->network_option);
        $this->assertEquals($test_value, $retrieved_value, 'Network option should be retrieved correctly');
        
        // Test updating network option
        $updated_value = ['network' => 'updated', 'multisite' => false];
        $update_result = update_site_option($this->network_option, $updated_value);
        
        $this->assertTrue($update_result, 'Network option should be updated');
        $this->assertEquals($updated_value, get_site_option($this->network_option));
        
        // Test deleting network option
        $delete_result = delete_site_option($this->network_option);
        $this->assertTrue($delete_result, 'Network option should be deleted');
        $this->assertFalse(get_site_option($this->network_option), 'Deleted network option should return false');
    }
    
    /**
     * Test site switching functionality
     */
    public function test_site_switching(): void {
        if (empty($this->test_blog_ids)) {
            $this->markTestSkipped('No test blogs available for site switching');
        }
        
        $original_blog_id = get_current_blog_id();
        $test_blog_id = $this->test_blog_ids[0];
        
        // Test switching to different site
        switch_to_blog($test_blog_id);
        
        $this->assertEquals($test_blog_id, get_current_blog_id(), 'Should switch to test blog');
        
        // Test site-specific options
        update_option('test_site_option', 'site_specific_value');
        $site_option = get_option('test_site_option');
        $this->assertEquals('site_specific_value', $site_option);
        
        // Test restoring original site
        restore_current_blog();
        
        $this->assertEquals($original_blog_id, get_current_blog_id(), 'Should restore original blog');
        
        // Test that site-specific option doesn't exist on original site
        $original_site_option = get_option('test_site_option', 'not_found');
        $this->assertEquals('not_found', $original_site_option, 'Site-specific option should not exist on original site');
    }
    
    /**
     * Test network-wide plugin activation
     */
    public function test_network_plugin_activation(): void {
        $this->act_as_user($this->create_user('administrator'));
        
        // Grant network admin capabilities
        $user = wp_get_current_user();
        $user->add_cap('manage_network');
        $user->add_cap('manage_network_plugins');
        
        $this->assertUserHasCapability('manage_network_plugins', 'User should have network plugin management capability');
        
        // Test network activation hook
        $network_activation_fired = false;
        $this->add_test_action('activate_plugin', function($plugin, $network_wide) use (&$network_activation_fired) {
            if ($network_wide) {
                $network_activation_fired = true;
            }
        }, 10, 2);
        
        // Simulate network-wide activation
        do_action('activate_plugin', 'test-plugin/test-plugin.php', true);
        
        $this->assertTrue($network_activation_fired, 'Network activation hook should fire');
    }
    
    /**
     * Test user management across network
     */
    public function test_network_user_management(): void {
        // Create network user
        $user = $this->create_user('administrator');
        
        // Test user exists on main site
        $this->assertTrue(user_can($user->ID, 'manage_options'), 'User should have admin capabilities on main site');
        
        // Test adding user to another site
        if (!empty($this->test_blog_ids)) {
            $test_blog_id = $this->test_blog_ids[0];
            
            add_user_to_blog($test_blog_id, $user->ID, 'editor');
            
            // Switch to test blog and verify user role
            switch_to_blog($test_blog_id);
            
            $user_roles = get_userdata($user->ID)->roles;
            $this->assertContains('editor', $user_roles, 'User should have editor role on test blog');
            
            restore_current_blog();
        }
        
        // Test super admin functionality
        if (function_exists('grant_super_admin')) {
            grant_super_admin($user->ID);
            $this->assertTrue(is_super_admin($user->ID), 'User should be super admin');
            
            revoke_super_admin($user->ID);
            $this->assertFalse(is_super_admin($user->ID), 'User should not be super admin after revocation');
        }
    }
    
    /**
     * Test network sites management
     */
    public function test_network_sites_management(): void {
        // Test getting all sites
        $sites = get_sites(['number' => 100]);
        $this->assertIsArray($sites, 'get_sites should return array');
        $this->assertNotEmpty($sites, 'Network should have sites');
        
        // Test main site detection
        $main_site_id = get_main_site_id();
        $this->assertIsInt($main_site_id, 'Main site ID should be integer');
        $this->assertGreaterThan(0, $main_site_id, 'Main site ID should be positive');
        
        // Test site details
        foreach ($this->test_blog_ids as $blog_id) {
            $site = get_site($blog_id);
            
            $this->assertNotNull($site, 'Site object should exist');
            $this->assertEquals($blog_id, $site->blog_id, 'Blog ID should match');
            $this->assertNotEmpty($site->domain, 'Site should have domain');
            $this->assertNotEmpty($site->path, 'Site should have path');
        }
        
        // Test site counting
        $site_count = get_blog_count();
        $this->assertIsInt($site_count, 'Site count should be integer');
        $this->assertGreaterThanOrEqual(count($this->test_blog_ids) + 1, $site_count, 'Site count should include test blogs');
    }
    
    /**
     * Test network themes and plugins
     */
    public function test_network_themes_plugins(): void {
        $this->act_as_user($this->create_user('administrator'));
        
        // Grant network admin capabilities
        $user = wp_get_current_user();
        $user->add_cap('manage_network_themes');
        $user->add_cap('manage_network_plugins');
        
        // Test network theme functions
        $this->assertTrue(function_exists('wp_get_themes'), 'wp_get_themes function should exist');
        
        $themes = wp_get_themes(['allowed' => 'network']);
        $this->assertIsArray($themes, 'Network themes should be array');
        
        // Test network plugin functions
        $this->assertTrue(function_exists('get_plugins'), 'get_plugins function should exist');
        
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $plugins = get_plugins();
        $this->assertIsArray($plugins, 'Plugins should be array');
        
        // Test network active plugins
        $network_plugins = get_site_option('active_sitewide_plugins', []);
        $this->assertIsArray($network_plugins, 'Network active plugins should be array');
    }
    
    /**
     * Test multisite content sharing
     */
    public function test_multisite_content_sharing(): void {
        if (empty($this->test_blog_ids)) {
            $this->markTestSkipped('No test blogs available for content sharing tests');
        }
        
        $original_blog_id = get_current_blog_id();
        $test_blog_id = $this->test_blog_ids[0];
        
        // Create post on main site
        $main_post = $this->create_post([
            'post_title' => 'Main Site Post',
            'post_content' => 'Content from main site',
            'post_status' => 'publish',
        ]);
        
        // Switch to test blog
        switch_to_blog($test_blog_id);
        
        // Create post on test blog
        $test_post = $this->create_post([
            'post_title' => 'Test Blog Post',
            'post_content' => 'Content from test blog',
            'post_status' => 'publish',
        ]);
        
        // Verify posts are site-specific
        $test_blog_posts = get_posts(['numberposts' => -1]);
        $test_blog_post_ids = wp_list_pluck($test_blog_posts, 'ID');
        
        $this->assertContains($test_post->ID, $test_blog_post_ids, 'Test blog should contain its own post');
        $this->assertNotContains($main_post->ID, $test_blog_post_ids, 'Test blog should not contain main site post');
        
        restore_current_blog();
        
        // Verify main site posts
        $main_site_posts = get_posts(['numberposts' => -1]);
        $main_site_post_ids = wp_list_pluck($main_site_posts, 'ID');
        
        $this->assertContains($main_post->ID, $main_site_post_ids, 'Main site should contain its own post');
        $this->assertNotContains($test_post->ID, $main_site_post_ids, 'Main site should not contain test blog post');
    }
    
    /**
     * Test multisite upload directories
     */
    public function test_multisite_upload_directories(): void {
        if (empty($this->test_blog_ids)) {
            $this->markTestSkipped('No test blogs available for upload directory tests');
        }
        
        // Test main site upload directory
        $main_upload_dir = wp_upload_dir();
        $this->assertArrayHasKey('basedir', $main_upload_dir);
        $this->assertArrayHasKey('baseurl', $main_upload_dir);
        
        // Switch to test blog
        switch_to_blog($this->test_blog_ids[0]);
        
        $test_upload_dir = wp_upload_dir();
        $this->assertArrayHasKey('basedir', $test_upload_dir);
        $this->assertArrayHasKey('baseurl', $test_upload_dir);
        
        // Upload directories should be different for different sites
        $this->assertNotEquals($main_upload_dir['basedir'], $test_upload_dir['basedir'], 'Upload directories should be site-specific');
        $this->assertNotEquals($main_upload_dir['baseurl'], $test_upload_dir['baseurl'], 'Upload URLs should be site-specific');
        
        restore_current_blog();
    }
    
    /**
     * Test network admin capabilities
     */
    public function test_network_admin_capabilities(): void {
        // Create super admin user
        $super_admin = $this->create_user('administrator');
        grant_super_admin($super_admin->ID);
        
        $this->act_as_user($super_admin);
        
        // Test super admin capabilities
        $this->assertTrue(is_super_admin(), 'User should be super admin');
        $this->assertUserHasCapability('manage_network');
        $this->assertUserHasCapability('manage_sites');
        $this->assertUserHasCapability('manage_network_users');
        $this->assertUserHasCapability('manage_network_themes');
        $this->assertUserHasCapability('manage_network_plugins');
        
        // Test regular admin on sub-site
        $regular_admin = $this->create_user('administrator');
        $this->act_as_user($regular_admin);
        
        $this->assertFalse(is_super_admin(), 'Regular admin should not be super admin');
        $this->assertUserDoesNotHaveCapability('manage_network');
        $this->assertUserDoesNotHaveCapability('manage_sites');
        $this->assertUserHasCapability('manage_options'); // Site-level capability
    }
    
    /**
     * Test multisite database tables
     */
    public function test_multisite_database_tables(): void {
        global $wpdb;
        
        // Test network-specific tables exist
        $network_tables = [
            $wpdb->blogs,
            $wpdb->blogmeta,
            $wpdb->site,
            $wpdb->sitemeta,
            $wpdb->registration_log,
            $wpdb->signups,
        ];
        
        foreach ($network_tables as $table) {
            if ($table) { // Some tables might not be defined in all setups
                $table_exists = $wpdb->get_var($wpdb->prepare(
                    "SHOW TABLES LIKE %s",
                    $table
                ));
                
                $this->assertEquals($table, $table_exists, "Network table {$table} should exist");
            }
        }
        
        // Test site-specific table prefixes
        if (!empty($this->test_blog_ids)) {
            foreach ($this->test_blog_ids as $blog_id) {
                switch_to_blog($blog_id);
                
                $site_prefix = $wpdb->get_blog_prefix($blog_id);
                $this->assertNotEmpty($site_prefix, "Site {$blog_id} should have table prefix");
                $this->assertStringContainsString((string)$blog_id, $site_prefix, "Site prefix should contain blog ID");
                
                restore_current_blog();
            }
        }
    }
    
    /**
     * Test network hooks and filters
     */
    public function test_network_hooks(): void {
        // Test network admin hooks
        $hooks_fired = [];
        
        $network_hooks = [
            'network_admin_menu',
            'network_admin_notices',
            'network_site_new_form',
            'network_site_users_form',
        ];
        
        foreach ($network_hooks as $hook) {
            $this->add_test_action($hook, function() use (&$hooks_fired, $hook) {
                $hooks_fired[] = $hook;
            });
        }
        
        // Fire network admin hooks
        foreach ($network_hooks as $hook) {
            do_action($hook);
        }
        
        foreach ($network_hooks as $hook) {
            $this->assertContains($hook, $hooks_fired, "Network hook {$hook} should fire");
        }
    }
    
    /**
     * Test cross-site data queries
     */
    public function test_cross_site_queries(): void {
        if (empty($this->test_blog_ids)) {
            $this->markTestSkipped('No test blogs available for cross-site queries');
        }
        
        $original_blog_id = get_current_blog_id();
        
        // Create posts on different sites
        $post_data = [];
        
        // Main site post
        $main_post = $this->create_post([
            'post_title' => 'Main Site Cross-Site Post',
            'post_status' => 'publish',
        ]);
        $post_data[$original_blog_id] = $main_post->ID;
        
        // Test blog posts
        foreach ($this->test_blog_ids as $blog_id) {
            switch_to_blog($blog_id);
            
            $test_post = $this->create_post([
                'post_title' => "Blog {$blog_id} Cross-Site Post",
                'post_status' => 'publish',
            ]);
            $post_data[$blog_id] = $test_post->ID;
            
            restore_current_blog();
        }
        
        // Test cross-site queries using get_sites
        $all_posts = [];
        $sites = get_sites();
        
        foreach ($sites as $site) {
            switch_to_blog($site->blog_id);
            
            $site_posts = get_posts(['numberposts' => -1]);
            foreach ($site_posts as $post) {
                $all_posts[] = [
                    'blog_id' => $site->blog_id,
                    'post_id' => $post->ID,
                    'title' => $post->post_title,
                ];
            }
            
            restore_current_blog();
        }
        
        $this->assertNotEmpty($all_posts, 'Should find posts across sites');
        
        // Verify we found posts from different sites
        $found_blog_ids = array_unique(wp_list_pluck($all_posts, 'blog_id'));
        $this->assertGreaterThanOrEqual(count($this->test_blog_ids) + 1, count($found_blog_ids), 'Should find posts from multiple sites');
    }
}