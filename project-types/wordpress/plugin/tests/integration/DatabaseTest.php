<?php
/**
 * Database operations and transaction tests
 * 
 * Tests database operations, custom tables,
 * transactions, and data integrity.
 * 
 * @package PA_QA_WordPress_Testing
 * @since 1.0.0
 */

namespace PA_QA\WordPress\Testing\Integration;

use PA_QA\WordPress\Testing\TestCase;

/**
 * Database operations tests
 */
class DatabaseTest extends TestCase {
    
    /**
     * Test table name
     * 
     * @var string
     */
    private $test_table;
    
    /**
     * WordPress database instance
     * 
     * @var \wpdb
     */
    private $wpdb;
    
    /**
     * Set up test environment
     */
    public function setUp(): void {
        parent::setUp();
        
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->test_table = $this->wpdb->prefix . 'test_plugin_data';
        
        // Create test table
        $this->create_test_table();
    }
    
    /**
     * Clean up after test
     */
    public function tearDown(): void {
        // Drop test table
        $this->drop_test_table();
        
        parent::tearDown();
    }
    
    /**
     * Create test table for database operations
     */
    private function create_test_table(): void {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE {$this->test_table} (
            id int(11) NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            content text,
            status varchar(20) DEFAULT 'active',
            created_by int(11) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            meta_data longtext,
            PRIMARY KEY (id),
            KEY created_by (created_by),
            KEY status (status),
            KEY created_at (created_at)
        ) {$charset_collate};";
        
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
        
        // Verify table was created
        $this->assertTrue($this->table_exists($this->test_table));
    }
    
    /**
     * Drop test table
     */
    private function drop_test_table(): void {
        $this->wpdb->query("DROP TABLE IF EXISTS {$this->test_table}");
    }
    
    /**
     * Check if table exists
     * 
     * @param string $table_name Table name
     * @return bool
     */
    private function table_exists($table_name): bool {
        $result = $this->wpdb->get_var($this->wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_name
        ));
        
        return $result === $table_name;
    }
    
    /**
     * Test database connection
     */
    public function test_database_connection(): void {
        $this->assertNotNull($this->wpdb, 'WordPress database object should exist');
        $this->assertNotEmpty($this->wpdb->dbname, 'Database name should be set');
        $this->assertNotEmpty($this->wpdb->prefix, 'Table prefix should be set');
        
        // Test basic query
        $result = $this->wpdb->get_var("SELECT 1");
        $this->assertEquals('1', $result, 'Basic database query should work');
    }
    
    /**
     * Test table creation and schema
     */
    public function test_table_creation(): void {
        $this->assertTrue($this->table_exists($this->test_table));
        
        // Test table structure
        $columns = $this->wpdb->get_results("DESCRIBE {$this->test_table}");
        $column_names = wp_list_pluck($columns, 'Field');
        
        $expected_columns = ['id', 'title', 'content', 'status', 'created_by', 'created_at', 'updated_at', 'meta_data'];
        
        foreach ($expected_columns as $column) {
            $this->assertContains($column, $column_names, "Table should have {$column} column");
        }
        
        // Test indexes
        $indexes = $this->wpdb->get_results("SHOW INDEX FROM {$this->test_table}");
        $index_columns = wp_list_pluck($indexes, 'Column_name');
        
        $expected_indexes = ['id', 'created_by', 'status', 'created_at'];
        foreach ($expected_indexes as $index) {
            $this->assertContains($index, $index_columns, "Table should have index on {$index}");
        }
    }
    
    /**
     * Test basic insert operation
     */
    public function test_insert_data(): void {
        $user = $this->create_user('editor');
        
        $data = [
            'title' => 'Test Record',
            'content' => 'This is test content',
            'status' => 'active',
            'created_by' => $user->ID,
            'meta_data' => wp_json_encode(['key' => 'value']),
        ];
        
        $result = $this->wpdb->insert($this->test_table, $data);
        
        $this->assertNotFalse($result, 'Insert operation should succeed');
        $this->assertGreaterThan(0, $this->wpdb->insert_id, 'Insert ID should be generated');
        
        // Verify data was inserted
        $inserted_record = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE id = %d",
            $this->wpdb->insert_id
        ));
        
        $this->assertNotNull($inserted_record);
        $this->assertEquals('Test Record', $inserted_record->title);
        $this->assertEquals('This is test content', $inserted_record->content);
        $this->assertEquals('active', $inserted_record->status);
        $this->assertEquals($user->ID, $inserted_record->created_by);
    }
    
    /**
     * Test data update operation
     */
    public function test_update_data(): void {
        $user = $this->create_user('editor');
        
        // Insert test record
        $this->wpdb->insert($this->test_table, [
            'title' => 'Original Title',
            'content' => 'Original content',
            'created_by' => $user->ID,
        ]);
        
        $record_id = $this->wpdb->insert_id;
        
        // Update record
        $result = $this->wpdb->update(
            $this->test_table,
            [
                'title' => 'Updated Title',
                'content' => 'Updated content',
                'status' => 'inactive',
            ],
            ['id' => $record_id],
            ['%s', '%s', '%s'],
            ['%d']
        );
        
        $this->assertNotFalse($result, 'Update operation should succeed');
        $this->assertEquals(1, $result, 'One row should be updated');
        
        // Verify update
        $updated_record = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE id = %d",
            $record_id
        ));
        
        $this->assertEquals('Updated Title', $updated_record->title);
        $this->assertEquals('Updated content', $updated_record->content);
        $this->assertEquals('inactive', $updated_record->status);
    }
    
    /**
     * Test data deletion
     */
    public function test_delete_data(): void {
        $user = $this->create_user('editor');
        
        // Insert test record
        $this->wpdb->insert($this->test_table, [
            'title' => 'To Be Deleted',
            'content' => 'This will be deleted',
            'created_by' => $user->ID,
        ]);
        
        $record_id = $this->wpdb->insert_id;
        
        // Delete record
        $result = $this->wpdb->delete(
            $this->test_table,
            ['id' => $record_id],
            ['%d']
        );
        
        $this->assertNotFalse($result, 'Delete operation should succeed');
        $this->assertEquals(1, $result, 'One row should be deleted');
        
        // Verify deletion
        $deleted_record = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE id = %d",
            $record_id
        ));
        
        $this->assertNull($deleted_record, 'Record should be deleted');
    }
    
    /**
     * Test prepared statements for security
     */
    public function test_prepared_statements(): void {
        $user = $this->create_user('editor');
        
        // Insert test data
        $this->wpdb->insert($this->test_table, [
            'title' => 'Test Record',
            'content' => 'Content with "quotes" and \'apostrophes\'',
            'created_by' => $user->ID,
        ]);
        
        $record_id = $this->wpdb->insert_id;
        
        // Test prepared SELECT
        $record = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE id = %d AND created_by = %d",
            $record_id,
            $user->ID
        ));
        
        $this->assertNotNull($record);
        $this->assertEquals('Test Record', $record->title);
        
        // Test prepared UPDATE with string parameters
        $result = $this->wpdb->query($this->wpdb->prepare(
            "UPDATE {$this->test_table} SET title = %s WHERE id = %d",
            'Updated via prepared statement',
            $record_id
        ));
        
        $this->assertNotFalse($result);
        
        // Verify update
        $updated_record = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT title FROM {$this->test_table} WHERE id = %d",
            $record_id
        ));
        
        $this->assertEquals('Updated via prepared statement', $updated_record);
    }
    
    /**
     * Test database transactions (if supported)
     */
    public function test_database_transactions(): void {
        // Check if transactions are supported
        $autocommit = $this->wpdb->get_var("SELECT @@autocommit");
        
        if ($autocommit === '0' || $this->wpdb->get_var("SELECT @@transaction_isolation") !== null) {
            $user = $this->create_user('editor');
            
            // Start transaction
            $this->wpdb->query('START TRANSACTION');
            
            // Insert data
            $this->wpdb->insert($this->test_table, [
                'title' => 'Transaction Test',
                'content' => 'This should be rolled back',
                'created_by' => $user->ID,
            ]);
            
            $record_id = $this->wpdb->insert_id;
            $this->assertGreaterThan(0, $record_id);
            
            // Verify data exists within transaction
            $record = $this->wpdb->get_row($this->wpdb->prepare(
                "SELECT * FROM {$this->test_table} WHERE id = %d",
                $record_id
            ));
            $this->assertNotNull($record);
            
            // Rollback transaction
            $this->wpdb->query('ROLLBACK');
            
            // Verify data was rolled back
            $record_after_rollback = $this->wpdb->get_row($this->wpdb->prepare(
                "SELECT * FROM {$this->test_table} WHERE id = %d",
                $record_id
            ));
            $this->assertNull($record_after_rollback, 'Record should be rolled back');
        } else {
            $this->markTestSkipped('Database transactions not supported');
        }
    }
    
    /**
     * Test bulk operations
     */
    public function test_bulk_operations(): void {
        $user = $this->create_user('editor');
        
        // Prepare bulk data
        $bulk_data = [];
        for ($i = 1; $i <= 10; $i++) {
            $bulk_data[] = [
                'title' => "Bulk Record {$i}",
                'content' => "Content for record {$i}",
                'created_by' => $user->ID,
                'status' => $i % 2 === 0 ? 'active' : 'inactive',
            ];
        }
        
        // Insert bulk data
        foreach ($bulk_data as $data) {
            $result = $this->wpdb->insert($this->test_table, $data);
            $this->assertNotFalse($result);
        }
        
        // Test bulk SELECT
        $records = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE created_by = %d ORDER BY id",
            $user->ID
        ));
        
        $this->assertCount(10, $records);
        
        // Test bulk UPDATE
        $updated_count = $this->wpdb->query($this->wpdb->prepare(
            "UPDATE {$this->test_table} SET status = 'archived' WHERE created_by = %d AND status = 'inactive'",
            $user->ID
        ));
        
        $this->assertEquals(5, $updated_count);
        
        // Test bulk DELETE
        $deleted_count = $this->wpdb->query($this->wpdb->prepare(
            "DELETE FROM {$this->test_table} WHERE created_by = %d AND status = 'archived'",
            $user->ID
        ));
        
        $this->assertEquals(5, $deleted_count);
        
        // Verify remaining records
        $remaining_count = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->test_table} WHERE created_by = %d",
            $user->ID
        ));
        
        $this->assertEquals('5', $remaining_count);
    }
    
    /**
     * Test database errors and error handling
     */
    public function test_database_error_handling(): void {
        // Test insert with invalid data
        $result = $this->wpdb->insert($this->test_table, [
            'title' => str_repeat('x', 300), // Exceeds VARCHAR(255) limit
            'created_by' => 'invalid_user_id', // Should be int
        ]);
        
        $this->assertFalse($result, 'Insert with invalid data should fail');
        $this->assertNotEmpty($this->wpdb->last_error, 'Database error should be recorded');
        
        // Test query with invalid syntax
        $result = $this->wpdb->query("INVALID SQL SYNTAX");
        $this->assertFalse($result);
        $this->assertNotEmpty($this->wpdb->last_error);
    }
    
    /**
     * Test data sanitization
     */
    public function test_data_sanitization(): void {
        $user = $this->create_user('editor');
        
        // Test with potentially dangerous input
        $dangerous_data = [
            'title' => '<script>alert("xss")</script>',
            'content' => "'; DROP TABLE users; --",
            'created_by' => $user->ID,
        ];
        
        $result = $this->wpdb->insert($this->test_table, $dangerous_data);
        $this->assertNotFalse($result);
        
        $record_id = $this->wpdb->insert_id;
        
        // Retrieve and verify data is stored safely
        $record = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE id = %d",
            $record_id
        ));
        
        $this->assertNotNull($record);
        $this->assertEquals('<script>alert("xss")</script>', $record->title);
        $this->assertEquals("'; DROP TABLE users; --", $record->content);
        
        // Verify table still exists (wasn't dropped by SQL injection)
        $this->assertTrue($this->table_exists($this->test_table));
    }
    
    /**
     * Test JSON data handling
     */
    public function test_json_data_handling(): void {
        $user = $this->create_user('editor');
        
        $json_data = [
            'settings' => [
                'color' => 'blue',
                'size' => 'large',
                'options' => ['opt1', 'opt2', 'opt3'],
            ],
            'metadata' => [
                'version' => '1.0',
                'last_updated' => '2024-01-01',
            ],
        ];
        
        $this->wpdb->insert($this->test_table, [
            'title' => 'JSON Test',
            'content' => 'Record with JSON metadata',
            'created_by' => $user->ID,
            'meta_data' => wp_json_encode($json_data),
        ]);
        
        $record_id = $this->wpdb->insert_id;
        
        // Retrieve and decode JSON
        $record = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE id = %d",
            $record_id
        ));
        
        $decoded_data = json_decode($record->meta_data, true);
        
        $this->assertIsArray($decoded_data);
        $this->assertEquals('blue', $decoded_data['settings']['color']);
        $this->assertEquals('large', $decoded_data['settings']['size']);
        $this->assertCount(3, $decoded_data['settings']['options']);
    }
    
    /**
     * Test database charset and collation
     */
    public function test_charset_and_collation(): void {
        $charset_collate = $this->wpdb->get_charset_collate();
        $this->assertNotEmpty($charset_collate);
        
        // Test UTF-8 support
        $user = $this->create_user('editor');
        
        $unicode_data = [
            'title' => 'Unicode Test: 你好世界 🌍 العالم',
            'content' => 'Emojis: 😀 🎉 🚀 and special chars: ñáéíóú',
            'created_by' => $user->ID,
        ];
        
        $result = $this->wpdb->insert($this->test_table, $unicode_data);
        $this->assertNotFalse($result);
        
        $record = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE id = %d",
            $this->wpdb->insert_id
        ));
        
        $this->assertEquals($unicode_data['title'], $record->title);
        $this->assertEquals($unicode_data['content'], $record->content);
    }
    
    /**
     * Test database performance with large datasets
     */
    public function test_database_performance(): void {
        $user = $this->create_user('editor');
        
        $start_time = microtime(true);
        
        // Insert 100 records
        for ($i = 1; $i <= 100; $i++) {
            $this->wpdb->insert($this->test_table, [
                'title' => "Performance Test {$i}",
                'content' => "Content for performance test record {$i}",
                'created_by' => $user->ID,
                'status' => $i % 3 === 0 ? 'inactive' : 'active',
            ]);
        }
        
        $insert_time = microtime(true) - $start_time;
        
        // Test query performance
        $start_time = microtime(true);
        
        $results = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM {$this->test_table} WHERE created_by = %d AND status = 'active' ORDER BY created_at DESC LIMIT 20",
            $user->ID
        ));
        
        $query_time = microtime(true) - $start_time;
        
        $this->assertLessThan(5.0, $insert_time, 'Insert operations should complete within 5 seconds');
        $this->assertLessThan(1.0, $query_time, 'Query should complete within 1 second');
        $this->assertNotEmpty($results, 'Query should return results');
    }
    
    /**
     * Test foreign key relationships (if supported)
     */
    public function test_foreign_key_relationships(): void {
        // Create test user
        $user = $this->create_user('editor');
        
        // Insert record
        $this->wpdb->insert($this->test_table, [
            'title' => 'FK Test',
            'content' => 'Testing foreign key relationship',
            'created_by' => $user->ID,
        ]);
        
        $record_id = $this->wpdb->insert_id;
        
        // Verify relationship
        $result = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT t.*, u.user_login 
             FROM {$this->test_table} t 
             JOIN {$this->wpdb->users} u ON t.created_by = u.ID 
             WHERE t.id = %d",
            $record_id
        ));
        
        $this->assertNotNull($result);
        $this->assertEquals($user->user_login, $result->user_login);
        
        // Test with non-existent user
        $result = $this->wpdb->insert($this->test_table, [
            'title' => 'Invalid FK Test',
            'content' => 'Testing with invalid user ID',
            'created_by' => 999999, // Non-existent user
        ]);
        
        // Should succeed (WordPress doesn't enforce FK constraints by default)
        $this->assertNotFalse($result);
    }
}