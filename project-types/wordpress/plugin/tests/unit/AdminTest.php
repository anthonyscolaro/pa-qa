<?php
/**
 * Admin capabilities and settings tests
 * 
 * Tests admin interface functionality, settings,
 * capabilities, and security features.
 * 
 * @package PA_QA_WordPress_Testing
 * @since 1.0.0
 */

namespace PA_QA\WordPress\Testing\Unit;

use PA_QA\WordPress\Testing\TestCase;

/**
 * Admin functionality tests
 */
class AdminTest extends TestCase {
    
    /**
     * Test settings option name
     * 
     * @var string
     */
    private $settings_option = 'test_plugin_settings';
    
    /**
     * Test capability name
     * 
     * @var string
     */
    private $test_capability = 'manage_test_plugin';
    
    /**
     * Set up test environment
     */
    public function setUp(): void {
        parent::setUp();
        
        // Set admin environment
        set_current_screen('dashboard');
        $GLOBALS['current_screen']->set_current_screen();
        
        // Simulate admin context
        if (!defined('WP_ADMIN')) {
            define('WP_ADMIN', true);
        }
    }
    
    /**
     * Test admin initialization
     */
    public function test_admin_init(): void {
        $this->assertTrue(is_admin(), 'Should be in admin context');
        
        // Test admin_init hook
        $admin_init_fired = false;
        $this->add_test_action('admin_init', function() use (&$admin_init_fired) {
            $admin_init_fired = true;
        });
        
        do_action('admin_init');
        $this->assertTrue($admin_init_fired, 'admin_init hook should fire');
    }
    
    /**
     * Test admin menu registration
     */
    public function test_admin_menu_registration(): void {
        global $menu, $submenu, $admin_page_hooks;
        
        $this->act_as_admin();
        
        // Reset menu globals
        $menu = [];
        $submenu = [];
        $admin_page_hooks = [];
        
        // Test adding main menu page
        $hook = add_menu_page(
            'Test Plugin',
            'Test Plugin',
            'manage_options',
            'test-plugin',
            [$this, 'render_admin_page'],
            'dashicons-admin-plugins',
            30
        );
        
        $this->assertNotEmpty($hook, 'Menu page should be added');
        $this->assertNotEmpty($menu, 'Menu array should not be empty');
        
        // Test adding submenu page
        $sub_hook = add_submenu_page(
            'test-plugin',
            'Test Settings',
            'Settings',
            'manage_options',
            'test-settings',
            [$this, 'render_settings_page']
        );
        
        $this->assertNotEmpty($sub_hook, 'Submenu page should be added');
        $this->assertArrayHasKey('test-plugin', $submenu, 'Submenu should be registered');
    }
    
    /**
     * Test admin page rendering
     */
    public function test_admin_page_rendering(): void {
        $this->act_as_admin();
        
        // Test page rendering without errors
        ob_start();
        $this->render_admin_page();
        $output = ob_get_clean();
        
        $this->assertNotEmpty($output, 'Admin page should produce output');
        $this->assertStringContainsString('<div class="wrap">', $output, 'Should use WordPress admin wrapper');
    }
    
    /**
     * Test settings registration and validation
     */
    public function test_settings_registration(): void {
        $this->act_as_admin();
        
        // Register test setting
        register_setting('test-plugin-settings', $this->settings_option, [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_settings'],
            'default' => [],
        ]);
        
        // Add settings section
        add_settings_section(
            'test-section',
            'Test Settings Section',
            [$this, 'render_settings_section'],
            'test-plugin-settings'
        );
        
        // Add settings field
        add_settings_field(
            'test-field',
            'Test Field',
            [$this, 'render_settings_field'],
            'test-plugin-settings',
            'test-section'
        );
        
        // Test settings are registered
        global $wp_settings_sections, $wp_settings_fields;
        
        $this->assertArrayHasKey('test-plugin-settings', $wp_settings_sections);
        $this->assertArrayHasKey('test-plugin-settings', $wp_settings_fields);
    }
    
    /**
     * Test settings validation and sanitization
     */
    public function test_settings_validation(): void {
        // Test valid settings
        $valid_settings = [
            'text_field' => 'Valid text',
            'number_field' => 42,
            'boolean_field' => true,
            'array_field' => ['item1', 'item2'],
        ];
        
        $sanitized = $this->sanitize_settings($valid_settings);
        $this->assertEquals($valid_settings, $sanitized);
        
        // Test invalid settings
        $invalid_settings = [
            'text_field' => '<script>alert("xss")</script>',
            'number_field' => 'not-a-number',
            'boolean_field' => 'not-boolean',
            'array_field' => 'not-an-array',
        ];
        
        $sanitized = $this->sanitize_settings($invalid_settings);
        
        $this->assertEquals('alert("xss")', $sanitized['text_field']);
        $this->assertEquals(0, $sanitized['number_field']);
        $this->assertFalse($sanitized['boolean_field']);
        $this->assertEquals([], $sanitized['array_field']);
    }
    
    /**
     * Test admin notices functionality
     */
    public function test_admin_notices(): void {
        $this->act_as_admin();
        
        // Test success notice
        $success_notice_shown = false;
        $this->add_test_action('admin_notices', function() use (&$success_notice_shown) {
            echo '<div class="notice notice-success"><p>Success message</p></div>';
            $success_notice_shown = true;
        });
        
        ob_start();
        do_action('admin_notices');
        $output = ob_get_clean();
        
        $this->assertTrue($success_notice_shown, 'Success notice should be shown');
        $this->assertStringContainsString('notice-success', $output);
        $this->assertStringContainsString('Success message', $output);
        
        // Test error notice
        $error_notice_shown = false;
        $this->add_test_action('admin_notices', function() use (&$error_notice_shown) {
            echo '<div class="notice notice-error"><p>Error message</p></div>';
            $error_notice_shown = true;
        });
        
        ob_start();
        do_action('admin_notices');
        $output = ob_get_clean();
        
        $this->assertTrue($error_notice_shown, 'Error notice should be shown');
        $this->assertStringContainsString('notice-error', $output);
    }
    
    /**
     * Test user capabilities and permissions
     */
    public function test_user_capabilities(): void {
        // Test admin user
        $admin = $this->create_user('administrator');
        $this->act_as_user($admin);
        
        $this->assertUserHasCapability('manage_options');
        $this->assertUserHasCapability('edit_plugins');
        $this->assertUserHasCapability('activate_plugins');
        
        // Test editor user
        $editor = $this->create_user('editor');
        $this->act_as_user($editor);
        
        $this->assertUserDoesNotHaveCapability('manage_options');
        $this->assertUserDoesNotHaveCapability('edit_plugins');
        $this->assertUserHasCapability('edit_posts');
        $this->assertUserHasCapability('publish_posts');
        
        // Test custom capability
        $editor->add_cap($this->test_capability);
        $this->assertUserHasCapability($this->test_capability);
        
        // Test subscriber user
        $subscriber = $this->create_user('subscriber');
        $this->act_as_user($subscriber);
        
        $this->assertUserDoesNotHaveCapability('manage_options');
        $this->assertUserDoesNotHaveCapability('edit_posts');
        $this->assertUserDoesNotHaveCapability($this->test_capability);
    }
    
    /**
     * Test admin AJAX functionality
     */
    public function test_admin_ajax(): void {
        $this->act_as_admin();
        
        // Mock AJAX request
        $_POST['action'] = 'test_ajax_action';
        $_POST['_ajax_nonce'] = wp_create_nonce('test_ajax_nonce');
        $_POST['test_data'] = 'test_value';
        
        // Register AJAX handler
        $ajax_called = false;
        $this->add_test_action('wp_ajax_test_ajax_action', function() use (&$ajax_called) {
            // Verify nonce
            if (!wp_verify_nonce($_POST['_ajax_nonce'], 'test_ajax_nonce')) {
                wp_die('Security check failed');
            }
            
            $ajax_called = true;
            wp_send_json_success(['data' => $_POST['test_data']]);
        });
        
        // Simulate AJAX request
        try {
            do_action('wp_ajax_test_ajax_action');
        } catch (Exception $e) {
            // wp_send_json_success calls wp_die(), which throws in tests
            $this->assertStringContainsString('{"success":true', $e->getMessage());
        }
        
        $this->assertTrue($ajax_called, 'AJAX handler should be called');
    }
    
    /**
     * Test admin screen functionality
     */
    public function test_admin_screen(): void {
        // Test different admin screens
        $screens = ['dashboard', 'edit', 'edit-post', 'plugins', 'options-general'];
        
        foreach ($screens as $screen_id) {
            set_current_screen($screen_id);
            $screen = get_current_screen();
            
            $this->assertNotNull($screen, "Screen {$screen_id} should be available");
            $this->assertEquals($screen_id, $screen->id, "Screen ID should match {$screen_id}");
        }
        
        // Test screen-specific hooks
        set_current_screen('plugins');
        
        $hook_fired = false;
        $this->add_test_action('load-plugins.php', function() use (&$hook_fired) {
            $hook_fired = true;
        });
        
        do_action('load-plugins.php');
        $this->assertTrue($hook_fired, 'Screen-specific hook should fire');
    }
    
    /**
     * Test meta boxes functionality
     */
    public function test_meta_boxes(): void {
        global $wp_meta_boxes;
        
        $this->act_as_admin();
        
        // Test adding meta box
        add_meta_box(
            'test-meta-box',
            'Test Meta Box',
            [$this, 'render_meta_box'],
            'post',
            'normal',
            'high'
        );
        
        $this->assertArrayHasKey('post', $wp_meta_boxes);
        $this->assertArrayHasKey('normal', $wp_meta_boxes['post']);
        $this->assertArrayHasKey('high', $wp_meta_boxes['post']['normal']);
        $this->assertArrayHasKey('test-meta-box', $wp_meta_boxes['post']['normal']['high']);
        
        // Test meta box rendering
        ob_start();
        $this->render_meta_box();
        $output = ob_get_clean();
        
        $this->assertNotEmpty($output, 'Meta box should produce output');
    }
    
    /**
     * Test admin enqueue scripts and styles
     */
    public function test_admin_enqueue_scripts(): void {
        global $wp_scripts, $wp_styles;
        
        $this->act_as_admin();
        
        // Test enqueueing admin script
        wp_enqueue_script('test-admin-script', 'test-script.js', ['jquery'], '1.0', true);
        
        $this->assertTrue(wp_script_is('test-admin-script', 'enqueued'));
        $this->assertArrayHasKey('test-admin-script', $wp_scripts->registered);
        
        // Test enqueueing admin style
        wp_enqueue_style('test-admin-style', 'test-style.css', [], '1.0');
        
        $this->assertTrue(wp_style_is('test-admin-style', 'enqueued'));
        $this->assertArrayHasKey('test-admin-style', $wp_styles->registered);
        
        // Test conditional enqueuing
        $script_enqueued = false;
        $this->add_test_action('admin_enqueue_scripts', function($hook) use (&$script_enqueued) {
            if ($hook === 'plugins.php') {
                wp_enqueue_script('conditional-script', 'conditional.js');
                $script_enqueued = true;
            }
        });
        
        set_current_screen('plugins');
        do_action('admin_enqueue_scripts', 'plugins.php');
        
        $this->assertTrue($script_enqueued, 'Conditional script should be enqueued');
    }
    
    /**
     * Test admin form security
     */
    public function test_admin_form_security(): void {
        $this->act_as_admin();
        
        // Test nonce creation
        $nonce = wp_create_nonce('test_form_action');
        $this->assertNotEmpty($nonce, 'Nonce should be created');
        
        // Test nonce verification
        $_REQUEST['_wpnonce'] = $nonce;
        $this->assertTrue(wp_verify_nonce($nonce, 'test_form_action'), 'Nonce should verify');
        
        // Test invalid nonce
        $this->assertFalse(wp_verify_nonce('invalid_nonce', 'test_form_action'), 'Invalid nonce should not verify');
        
        // Test referer check
        $_SERVER['HTTP_REFERER'] = admin_url('admin.php?page=test-plugin');
        $this->assertTrue(check_admin_referer('test_form_action', '_wpnonce', false), 'Referer check should pass');
    }
    
    /**
     * Test admin settings import/export
     */
    public function test_settings_import_export(): void {
        $this->act_as_admin();
        
        // Set test settings
        $test_settings = [
            'option1' => 'value1',
            'option2' => 42,
            'option3' => ['array', 'values'],
        ];
        
        $this->set_test_option($this->settings_option, $test_settings);
        
        // Test export
        $exported_settings = get_option($this->settings_option);
        $this->assertEquals($test_settings, $exported_settings);
        
        // Test import (simulate importing to new option)
        $import_option = 'imported_' . $this->settings_option;
        update_option($import_option, $exported_settings);
        
        $imported_settings = get_option($import_option);
        $this->assertEquals($test_settings, $imported_settings);
        
        // Clean up
        delete_option($import_option);
    }
    
    /**
     * Test admin dashboard widgets
     */
    public function test_dashboard_widgets(): void {
        global $wp_dashboard_setup_done, $wp_meta_boxes;
        
        $this->act_as_admin();
        set_current_screen('dashboard');
        
        // Reset dashboard
        $wp_dashboard_setup_done = false;
        $wp_meta_boxes['dashboard'] = [];
        
        // Add test widget
        wp_add_dashboard_widget(
            'test-dashboard-widget',
            'Test Dashboard Widget',
            [$this, 'render_dashboard_widget']
        );
        
        // Setup dashboard
        do_action('wp_dashboard_setup');
        
        $this->assertArrayHasKey('dashboard', $wp_meta_boxes);
        $this->assertArrayHasKey('normal', $wp_meta_boxes['dashboard']);
        
        // Test widget rendering
        ob_start();
        $this->render_dashboard_widget();
        $output = ob_get_clean();
        
        $this->assertNotEmpty($output, 'Dashboard widget should produce output');
    }
    
    /**
     * Test admin role and capability management
     */
    public function test_role_management(): void {
        // Test adding custom role
        $result = add_role('test_role', 'Test Role', [
            'read' => true,
            $this->test_capability => true,
        ]);
        
        $this->assertNotNull($result, 'Custom role should be added');
        
        // Test role exists
        $role = get_role('test_role');
        $this->assertNotNull($role, 'Role should exist');
        $this->assertTrue($role->has_cap('read'), 'Role should have read capability');
        $this->assertTrue($role->has_cap($this->test_capability), 'Role should have custom capability');
        
        // Test user with custom role
        $test_user = $this->create_user('test_role');
        $this->act_as_user($test_user);
        
        $this->assertUserHasCapability('read');
        $this->assertUserHasCapability($this->test_capability);
        $this->assertUserDoesNotHaveCapability('manage_options');
        
        // Clean up
        remove_role('test_role');
        $this->assertNull(get_role('test_role'), 'Role should be removed');
    }
    
    /**
     * Callback methods for testing
     */
    
    public function render_admin_page(): void {
        echo '<div class="wrap">';
        echo '<h1>Test Plugin Admin Page</h1>';
        echo '<p>This is a test admin page.</p>';
        echo '</div>';
    }
    
    public function render_settings_page(): void {
        echo '<div class="wrap">';
        echo '<h1>Test Plugin Settings</h1>';
        echo '<form method="post" action="options.php">';
        settings_fields('test-plugin-settings');
        do_settings_sections('test-plugin-settings');
        submit_button();
        echo '</form>';
        echo '</div>';
    }
    
    public function render_settings_section(): void {
        echo '<p>This is the test settings section.</p>';
    }
    
    public function render_settings_field(): void {
        $value = get_option($this->settings_option, []);
        echo '<input type="text" name="' . $this->settings_option . '[test_field]" value="' . esc_attr($value['test_field'] ?? '') . '" />';
    }
    
    public function sanitize_settings($input): array {
        $output = [];
        
        if (isset($input['text_field'])) {
            $output['text_field'] = sanitize_text_field($input['text_field']);
        }
        
        if (isset($input['number_field'])) {
            $output['number_field'] = is_numeric($input['number_field']) ? (int) $input['number_field'] : 0;
        }
        
        if (isset($input['boolean_field'])) {
            $output['boolean_field'] = is_bool($input['boolean_field']) ? $input['boolean_field'] : false;
        }
        
        if (isset($input['array_field'])) {
            $output['array_field'] = is_array($input['array_field']) ? $input['array_field'] : [];
        }
        
        return $output;
    }
    
    public function render_meta_box(): void {
        echo '<p>This is a test meta box.</p>';
        echo '<input type="text" name="test_meta_field" placeholder="Test meta field" />';
    }
    
    public function render_dashboard_widget(): void {
        echo '<p>This is a test dashboard widget.</p>';
        echo '<ul>';
        echo '<li>Widget item 1</li>';
        echo '<li>Widget item 2</li>';
        echo '</ul>';
    }
}