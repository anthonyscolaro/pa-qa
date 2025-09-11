<?php
/**
 * Testing helpers must-use plugin
 * 
 * This file provides helper functions and utilities
 * that are loaded during testing.
 * 
 * @package PA_QA_WordPress_Testing
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Helper function to create test data
 */
function create_test_data() {
    // Create test posts
    for ($i = 1; $i <= 5; $i++) {
        wp_insert_post([
            'post_title' => "Test Post {$i}",
            'post_content' => "This is test content for post {$i}",
            'post_status' => 'publish',
            'post_type' => 'post',
        ]);
    }
    
    // Create test pages
    wp_insert_post([
        'post_title' => 'Test Page',
        'post_content' => 'This is a test page',
        'post_status' => 'publish',
        'post_type' => 'page',
    ]);
    
    // Create test categories
    wp_insert_term('Test Category', 'category');
    wp_insert_term('Another Category', 'category');
    
    // Create test tags
    wp_insert_term('test-tag', 'post_tag');
    wp_insert_term('another-tag', 'post_tag');
}

/**
 * Clean up test data
 */
function cleanup_test_data() {
    // Remove test posts and pages
    $posts = get_posts([
        'post_type' => ['post', 'page'],
        'numberposts' => -1,
        'post_status' => 'any',
    ]);
    
    foreach ($posts as $post) {
        if (strpos($post->post_title, 'Test') === 0) {
            wp_delete_post($post->ID, true);
        }
    }
    
    // Remove test terms
    $categories = get_terms(['taxonomy' => 'category', 'hide_empty' => false]);
    foreach ($categories as $category) {
        if (strpos($category->name, 'Test') === 0 || strpos($category->name, 'Another') === 0) {
            wp_delete_term($category->term_id, 'category');
        }
    }
    
    $tags = get_terms(['taxonomy' => 'post_tag', 'hide_empty' => false]);
    foreach ($tags as $tag) {
        if (strpos($tag->name, 'test') === 0 || strpos($tag->name, 'another') === 0) {
            wp_delete_term($tag->term_id, 'post_tag');
        }
    }
}

/**
 * Load testing helpers during wp-env setup
 */
if (defined('WP_ENVIRONMENT_TYPE') && WP_ENVIRONMENT_TYPE === 'local') {
    add_action('init', 'create_test_data', 999);
}