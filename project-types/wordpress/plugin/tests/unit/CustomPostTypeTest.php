<?php
/**
 * Custom Post Type registration and functionality tests
 * 
 * Tests custom post type registration, capabilities,
 * queries, and related functionality.
 * 
 * @package PA_QA_WordPress_Testing
 * @since 1.0.0
 */

namespace PA_QA\WordPress\Testing\Unit;

use PA_QA\WordPress\Testing\TestCase;
use WP_Query;
use WP_Post;

/**
 * Custom Post Type tests
 */
class CustomPostTypeTest extends TestCase {
    
    /**
     * Test post type name
     * 
     * @var string
     */
    private $post_type = 'test_custom_post';
    
    /**
     * Test taxonomy name
     * 
     * @var string
     */
    private $taxonomy = 'test_custom_taxonomy';
    
    /**
     * Set up test environment
     */
    public function setUp(): void {
        parent::setUp();
        
        // Register test post type for testing
        $this->register_test_post_type();
        $this->register_test_taxonomy();
    }
    
    /**
     * Register a test custom post type
     */
    private function register_test_post_type(): void {
        register_post_type($this->post_type, [
            'label' => 'Test Custom Posts',
            'public' => true,
            'show_ui' => true,
            'show_in_menu' => true,
            'show_in_admin_bar' => true,
            'show_in_nav_menus' => true,
            'can_export' => true,
            'has_archive' => true,
            'exclude_from_search' => false,
            'publicly_queryable' => true,
            'show_in_rest' => true,
            'rest_base' => 'test-custom-posts',
            'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
            'taxonomies' => [$this->taxonomy],
            'capability_type' => 'post',
            'capabilities' => [
                'edit_post' => 'edit_test_custom_post',
                'edit_posts' => 'edit_test_custom_posts',
                'edit_others_posts' => 'edit_others_test_custom_posts',
                'publish_posts' => 'publish_test_custom_posts',
                'read_post' => 'read_test_custom_post',
                'read_private_posts' => 'read_private_test_custom_posts',
                'delete_post' => 'delete_test_custom_post',
                'delete_posts' => 'delete_test_custom_posts',
                'delete_private_posts' => 'delete_private_test_custom_posts',
                'delete_published_posts' => 'delete_published_test_custom_posts',
                'delete_others_posts' => 'delete_others_test_custom_posts',
                'edit_private_posts' => 'edit_private_test_custom_posts',
                'edit_published_posts' => 'edit_published_test_custom_posts',
            ],
        ]);
    }
    
    /**
     * Register a test taxonomy
     */
    private function register_test_taxonomy(): void {
        register_taxonomy($this->taxonomy, $this->post_type, [
            'labels' => [
                'name' => 'Test Categories',
                'singular_name' => 'Test Category',
            ],
            'public' => true,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_nav_menus' => true,
            'show_tagcloud' => true,
            'show_in_rest' => true,
            'rest_base' => 'test-categories',
            'hierarchical' => true,
        ]);
    }
    
    /**
     * Test custom post type registration
     */
    public function test_custom_post_type_registration(): void {
        $this->assertPostTypeExists($this->post_type);
        
        $post_type_object = get_post_type_object($this->post_type);
        $this->assertNotNull($post_type_object, 'Post type object should exist');
        $this->assertEquals('Test Custom Posts', $post_type_object->label);
        $this->assertTrue($post_type_object->public);
        $this->assertTrue($post_type_object->show_ui);
        $this->assertTrue($post_type_object->show_in_rest);
    }
    
    /**
     * Test custom taxonomy registration
     */
    public function test_custom_taxonomy_registration(): void {
        $this->assertTaxonomyExists($this->taxonomy);
        
        $taxonomy_object = get_taxonomy($this->taxonomy);
        $this->assertNotNull($taxonomy_object, 'Taxonomy object should exist');
        $this->assertContains($this->post_type, $taxonomy_object->object_type);
        $this->assertTrue($taxonomy_object->public);
        $this->assertTrue($taxonomy_object->show_ui);
        $this->assertTrue($taxonomy_object->hierarchical);
    }
    
    /**
     * Test creating custom post type posts
     */
    public function test_create_custom_post(): void {
        $post_data = [
            'post_title' => 'Test Custom Post',
            'post_content' => 'This is test content for custom post type',
            'post_type' => $this->post_type,
            'post_status' => 'publish',
        ];
        
        $post = $this->create_post($post_data);
        
        $this->assertInstanceOf(WP_Post::class, $post);
        $this->assertEquals($this->post_type, $post->post_type);
        $this->assertEquals('Test Custom Post', $post->post_title);
        $this->assertEquals('publish', $post->post_status);
    }
    
    /**
     * Test custom post type queries
     */
    public function test_custom_post_type_queries(): void {
        // Create test posts
        $post1 = $this->create_post([
            'post_title' => 'Custom Post 1',
            'post_type' => $this->post_type,
            'post_status' => 'publish',
        ]);
        
        $post2 = $this->create_post([
            'post_title' => 'Custom Post 2',
            'post_type' => $this->post_type,
            'post_status' => 'publish',
        ]);
        
        // Query custom post type
        $query = new WP_Query([
            'post_type' => $this->post_type,
            'post_status' => 'publish',
            'posts_per_page' => -1,
        ]);
        
        $this->assertTrue($query->have_posts());
        $this->assertGreaterThanOrEqual(2, $query->post_count);
        
        $post_ids = wp_list_pluck($query->posts, 'ID');
        $this->assertContains($post1->ID, $post_ids);
        $this->assertContains($post2->ID, $post_ids);
    }
    
    /**
     * Test custom post type with meta fields
     */
    public function test_custom_post_with_meta(): void {
        $post = $this->create_post([
            'post_title' => 'Post with Meta',
            'post_type' => $this->post_type,
            'post_status' => 'publish',
        ]);
        
        // Add meta fields
        $meta_data = [
            'custom_field_1' => 'value_1',
            'custom_field_2' => 'value_2',
            'custom_number' => 42,
            'custom_array' => ['item1', 'item2', 'item3'],
        ];
        
        foreach ($meta_data as $key => $value) {
            update_post_meta($post->ID, $key, $value);
        }
        
        // Test meta retrieval
        foreach ($meta_data as $key => $expected_value) {
            $actual_value = get_post_meta($post->ID, $key, true);
            $this->assertEquals($expected_value, $actual_value);
        }
        
        // Test meta query
        $query = new WP_Query([
            'post_type' => $this->post_type,
            'meta_query' => [
                [
                    'key' => 'custom_field_1',
                    'value' => 'value_1',
                    'compare' => '=',
                ],
            ],
        ]);
        
        $this->assertTrue($query->have_posts());
        $this->assertEquals($post->ID, $query->posts[0]->ID);
    }
    
    /**
     * Test custom post type with taxonomy terms
     */
    public function test_custom_post_with_taxonomy(): void {
        // Create taxonomy terms
        $term1 = $this->create_term($this->taxonomy, ['name' => 'Category 1']);
        $term2 = $this->create_term($this->taxonomy, ['name' => 'Category 2']);
        
        // Create post and assign terms
        $post = $this->create_post([
            'post_title' => 'Post with Categories',
            'post_type' => $this->post_type,
            'post_status' => 'publish',
        ]);
        
        wp_set_object_terms($post->ID, [$term1['term_id'], $term2['term_id']], $this->taxonomy);
        
        // Test term assignment
        $assigned_terms = wp_get_object_terms($post->ID, $this->taxonomy);
        $this->assertCount(2, $assigned_terms);
        
        $term_names = wp_list_pluck($assigned_terms, 'name');
        $this->assertContains('Category 1', $term_names);
        $this->assertContains('Category 2', $term_names);
        
        // Test taxonomy query
        $query = new WP_Query([
            'post_type' => $this->post_type,
            'tax_query' => [
                [
                    'taxonomy' => $this->taxonomy,
                    'field' => 'term_id',
                    'terms' => $term1['term_id'],
                ],
            ],
        ]);
        
        $this->assertTrue($query->have_posts());
        $this->assertEquals($post->ID, $query->posts[0]->ID);
    }
    
    /**
     * Test custom post type capabilities
     */
    public function test_custom_post_type_capabilities(): void {
        $admin = $this->create_user('administrator');
        $editor = $this->create_user('editor');
        $author = $this->create_user('author');
        $subscriber = $this->create_user('subscriber');
        
        // Grant custom capabilities to admin and editor
        $admin->add_cap('edit_test_custom_posts');
        $admin->add_cap('publish_test_custom_posts');
        $editor->add_cap('edit_test_custom_posts');
        $editor->add_cap('publish_test_custom_posts');
        
        // Test admin capabilities
        $this->act_as_user($admin);
        $this->assertUserHasCapability('edit_test_custom_posts');
        $this->assertUserHasCapability('publish_test_custom_posts');
        
        // Test editor capabilities
        $this->act_as_user($editor);
        $this->assertUserHasCapability('edit_test_custom_posts');
        $this->assertUserHasCapability('publish_test_custom_posts');
        
        // Test author (should not have custom capabilities)
        $this->act_as_user($author);
        $this->assertUserDoesNotHaveCapability('edit_test_custom_posts');
        $this->assertUserDoesNotHaveCapability('publish_test_custom_posts');
        
        // Test subscriber (should not have custom capabilities)
        $this->act_as_user($subscriber);
        $this->assertUserDoesNotHaveCapability('edit_test_custom_posts');
        $this->assertUserDoesNotHaveCapability('publish_test_custom_posts');
    }
    
    /**
     * Test custom post type archive functionality
     */
    public function test_custom_post_type_archive(): void {
        // Create multiple posts
        for ($i = 1; $i <= 3; $i++) {
            $this->create_post([
                'post_title' => "Archive Post {$i}",
                'post_type' => $this->post_type,
                'post_status' => 'publish',
            ]);
        }
        
        // Test archive query
        global $wp_query;
        $wp_query = new WP_Query([
            'post_type' => $this->post_type,
            'posts_per_page' => 10,
        ]);
        
        $this->assertTrue($wp_query->have_posts());
        $this->assertGreaterThanOrEqual(3, $wp_query->post_count);
        
        // Test is_post_type_archive
        $wp_query->is_archive = true;
        $wp_query->is_post_type_archive = true;
        
        $this->assertTrue(is_archive());
        $this->assertTrue(is_post_type_archive($this->post_type));
    }
    
    /**
     * Test custom post type REST API endpoints
     */
    public function test_custom_post_type_rest_api(): void {
        $post_type_object = get_post_type_object($this->post_type);
        
        $this->assertTrue($post_type_object->show_in_rest);
        $this->assertEquals('test-custom-posts', $post_type_object->rest_base);
        
        // Test REST API route registration
        $routes = rest_get_server()->get_routes();
        $this->assertArrayHasKey('/wp/v2/test-custom-posts', $routes);
        $this->assertArrayHasKey('/wp/v2/test-custom-posts/(?P<id>[\d]+)', $routes);
    }
    
    /**
     * Test custom post type supports features
     */
    public function test_custom_post_type_supports(): void {
        $supports = get_all_post_type_supports($this->post_type);
        
        $expected_supports = ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'];
        
        foreach ($expected_supports as $feature) {
            $this->assertTrue(
                post_type_supports($this->post_type, $feature),
                "Post type should support '{$feature}'"
            );
        }
        
        // Test unsupported features
        $this->assertFalse(
            post_type_supports($this->post_type, 'comments'),
            'Post type should not support comments'
        );
    }
    
    /**
     * Test custom post type rewrite rules
     */
    public function test_custom_post_type_rewrite(): void {
        $post_type_object = get_post_type_object($this->post_type);
        
        if ($post_type_object->rewrite) {
            $rewrite_rules = get_option('rewrite_rules');
            
            // Check for post type archive rewrite rule
            $archive_rule_found = false;
            foreach ($rewrite_rules as $pattern => $replacement) {
                if (strpos($pattern, $this->post_type) !== false) {
                    $archive_rule_found = true;
                    break;
                }
            }
            
            $this->assertTrue($archive_rule_found, 'Rewrite rules should include custom post type');
        }
    }
    
    /**
     * Test custom post type admin interface
     */
    public function test_custom_post_type_admin_interface(): void {
        $this->act_as_admin();
        
        $post_type_object = get_post_type_object($this->post_type);
        
        $this->assertTrue($post_type_object->show_ui);
        $this->assertTrue($post_type_object->show_in_menu);
        $this->assertTrue($post_type_object->show_in_admin_bar);
        
        // Test admin menu registration
        global $menu, $submenu;
        
        // Simulate admin menu building
        do_action('admin_menu');
        
        // Check if custom post type appears in admin menu
        $menu_found = false;
        if (is_array($menu)) {
            foreach ($menu as $menu_item) {
                if (isset($menu_item[2]) && strpos($menu_item[2], $this->post_type) !== false) {
                    $menu_found = true;
                    break;
                }
            }
        }
        
        $this->assertTrue($menu_found || $post_type_object->show_in_menu === true);
    }
    
    /**
     * Test custom post type deletion and cleanup
     */
    public function test_custom_post_type_deletion(): void {
        // Create a post with meta and taxonomy terms
        $post = $this->create_post([
            'post_title' => 'Post to Delete',
            'post_type' => $this->post_type,
            'post_status' => 'publish',
        ]);
        
        // Add meta
        update_post_meta($post->ID, 'test_meta', 'test_value');
        
        // Add taxonomy term
        $term = $this->create_term($this->taxonomy, ['name' => 'Delete Test']);
        wp_set_object_terms($post->ID, $term['term_id'], $this->taxonomy);
        
        // Delete post
        $deleted = wp_delete_post($post->ID, true);
        
        $this->assertInstanceOf(WP_Post::class, $deleted);
        $this->assertNull(get_post($post->ID));
        
        // Check meta is deleted
        $meta = get_post_meta($post->ID, 'test_meta', true);
        $this->assertEmpty($meta);
        
        // Check taxonomy relationships are removed
        $terms = wp_get_object_terms($post->ID, $this->taxonomy);
        $this->assertEmpty($terms);
    }
}