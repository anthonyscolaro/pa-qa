/**
 * MySQL-Specific Database Testing Helpers
 * Provides MySQL-optimized utilities for testing scenarios
 */

import mysql from 'mysql2/promise';
import { TransactionContext } from './transaction-helpers';

export interface MySQLConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | any;
  charset?: string;
  timezone?: string;
}

export interface MySQLEngine {
  name: string;
  support: string;
  comment: string;
  transactions: string;
  xa: string;
  savepoints: string;
}

export interface MySQLConstraint {
  name: string;
  table: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onDelete?: string;
  onUpdate?: string;
}

export interface MySQLIndex {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type: 'BTREE' | 'HASH' | 'RTREE' | 'FULLTEXT';
  cardinality: number;
}

export interface MySQLVariable {
  name: string;
  value: string;
  description?: string;
}

export class MySQLTestHelper {
  private connection: mysql.Connection | null = null;
  private pool: mysql.Pool;
  private config: MySQLConfig;

  constructor(config: MySQLConfig) {
    this.config = {
      charset: 'utf8mb4',
      timezone: '+00:00',
      ...config
    };

    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl,
      charset: this.config.charset,
      timezone: this.config.timezone,
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000
    });
  }

  /**
   * Create a test database
   */
  async createTestDatabase(dbName: string, charset: string = 'utf8mb4'): Promise<void> {
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl
    });

    try {
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET ${charset} COLLATE ${charset}_unicode_ci`);
    } finally {
      await connection.end();
    }
  }

  /**
   * Drop a test database
   */
  async dropTestDatabase(dbName: string): Promise<void> {
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl
    });

    try {
      await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    } finally {
      await connection.end();
    }
  }

  /**
   * Get storage engines
   */
  async getStorageEngines(): Promise<MySQLEngine[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute('SHOW ENGINES');
      return (rows as any[]).map(row => ({
        name: row.Engine,
        support: row.Support,
        comment: row.Comment,
        transactions: row.Transactions,
        xa: row.XA,
        savepoints: row.Savepoints
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Test table with specific storage engine
   */
  async testWithStorageEngine(tableName: string, engine: string = 'InnoDB'): Promise<void> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.execute(`ALTER TABLE \`${tableName}\` ENGINE = ${engine}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Get table information
   */
  async getTableInfo(tableName: string): Promise<any> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          table_name,
          engine,
          table_rows,
          avg_row_length,
          data_length,
          index_length,
          auto_increment,
          create_time,
          update_time,
          table_collation,
          table_comment
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
      `, [this.config.database, tableName]);

      return (rows as any[])[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Get table columns with details
   */
  async getTableColumns(tableName: string): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          column_type,
          column_key,
          extra,
          column_comment
        FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = ?
        ORDER BY ordinal_position
      `, [this.config.database, tableName]);

      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Test foreign key constraints
   */
  async getForeignKeys(tableName: string): Promise<MySQLConstraint[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          kcu.constraint_name as name,
          kcu.table_name as table_name,
          'FOREIGN KEY' as type,
          GROUP_CONCAT(kcu.column_name ORDER BY kcu.ordinal_position) as columns,
          kcu.referenced_table_name as referenced_table,
          GROUP_CONCAT(kcu.referenced_column_name ORDER BY kcu.ordinal_position) as referenced_columns,
          rc.delete_rule as on_delete,
          rc.update_rule as on_update
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.referential_constraints rc 
          ON kcu.constraint_name = rc.constraint_name
          AND kcu.table_schema = rc.constraint_schema
        WHERE kcu.table_schema = ? AND kcu.table_name = ?
          AND kcu.referenced_table_name IS NOT NULL
        GROUP BY kcu.constraint_name, kcu.table_name, kcu.referenced_table_name, rc.delete_rule, rc.update_rule
      `, [this.config.database, tableName]);

      return (rows as any[]).map(row => ({
        name: row.name,
        table: row.table_name,
        type: 'FOREIGN KEY' as const,
        columns: row.columns.split(','),
        referencedTable: row.referenced_table,
        referencedColumns: row.referenced_columns.split(','),
        onDelete: row.on_delete,
        onUpdate: row.on_update
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Get table indexes
   */
  async getTableIndexes(tableName: string): Promise<MySQLIndex[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          index_name as name,
          table_name,
          GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns,
          CASE WHEN non_unique = 0 THEN true ELSE false END as is_unique,
          index_type as type,
          SUM(cardinality) as cardinality
        FROM information_schema.statistics
        WHERE table_schema = ? AND table_name = ?
        GROUP BY index_name, table_name, non_unique, index_type
      `, [this.config.database, tableName]);

      return (rows as any[]).map(row => ({
        name: row.name,
        table: row.table_name,
        columns: row.columns.split(','),
        unique: row.is_unique,
        type: row.type,
        cardinality: row.cardinality || 0
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Test MySQL functions and procedures
   */
  async callStoredProcedure(procName: string, args: any[] = []): Promise<any> {
    const connection = await this.pool.getConnection();
    
    try {
      const placeholders = args.map(() => '?').join(', ');
      const [rows] = await connection.execute(`CALL ${procName}(${placeholders})`, args);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get stored procedures and functions
   */
  async getStoredRoutines(): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          routine_name,
          routine_type,
          data_type,
          routine_definition,
          is_deterministic,
          sql_data_access,
          security_type,
          created,
          last_altered
        FROM information_schema.routines
        WHERE routine_schema = ?
      `, [this.config.database]);

      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Test MySQL triggers
   */
  async getTriggers(tableName?: string): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      let query = `
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_timing,
          action_statement,
          created
        FROM information_schema.triggers
        WHERE trigger_schema = ?
      `;
      
      const params = [this.config.database];
      
      if (tableName) {
        query += ' AND event_object_table = ?';
        params.push(tableName);
      }

      const [rows] = await connection.execute(query, params);
      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Monitor database processes
   */
  async getProcessList(): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute('SHOW FULL PROCESSLIST');
      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Get MySQL variables
   */
  async getVariables(pattern?: string): Promise<MySQLVariable[]> {
    const connection = await this.pool.getConnection();
    
    try {
      let query = 'SHOW VARIABLES';
      const params: string[] = [];
      
      if (pattern) {
        query += ' LIKE ?';
        params.push(pattern);
      }

      const [rows] = await connection.execute(query, params);
      return (rows as any[]).map(row => ({
        name: row.Variable_name,
        value: row.Value
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Get database status
   */
  async getStatus(pattern?: string): Promise<MySQLVariable[]> {
    const connection = await this.pool.getConnection();
    
    try {
      let query = 'SHOW STATUS';
      const params: string[] = [];
      
      if (pattern) {
        query += ' LIKE ?';
        params.push(pattern);
      }

      const [rows] = await connection.execute(query, params);
      return (rows as any[]).map(row => ({
        name: row.Variable_name,
        value: row.Value
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Test query execution plan
   */
  async explainQuery(query: string, params?: any[]): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`EXPLAIN ${query}`, params || []);
      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Test JSON operations (MySQL 5.7+)
   */
  async testJsonOperations(tableName: string, jsonColumn: string, testData: any): Promise<any> {
    const connection = await this.pool.getConnection();
    
    try {
      // Insert test JSON data
      await connection.execute(
        `INSERT INTO \`${tableName}\` (\`${jsonColumn}\`) VALUES (?)`,
        [JSON.stringify(testData)]
      );

      // Test various JSON operations
      const [rows] = await connection.execute(`
        SELECT 
          \`${jsonColumn}\`,
          JSON_EXTRACT(\`${jsonColumn}\`, '$.name') as name_value,
          JSON_TYPE(\`${jsonColumn}\`) as json_type,
          JSON_VALID(\`${jsonColumn}\`) as is_valid_json,
          JSON_LENGTH(\`${jsonColumn}\`) as json_length
        FROM \`${tableName}\`
        WHERE \`${jsonColumn}\` IS NOT NULL
        LIMIT 1
      `);

      return (rows as any[])[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Test full-text search
   */
  async testFullTextSearch(tableName: string, searchColumn: string, searchTerm: string): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          *,
          MATCH(\`${searchColumn}\`) AGAINST (? IN NATURAL LANGUAGE MODE) as relevance_score
        FROM \`${tableName}\`
        WHERE MATCH(\`${searchColumn}\`) AGAINST (? IN NATURAL LANGUAGE MODE)
        ORDER BY relevance_score DESC
      `, [searchTerm, searchTerm]);

      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Test partitioning
   */
  async getPartitionInfo(tableName: string): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          partition_name,
          partition_ordinal_position,
          partition_method,
          partition_expression,
          partition_description,
          table_rows,
          avg_row_length,
          data_length,
          index_length
        FROM information_schema.partitions
        WHERE table_schema = ? AND table_name = ?
          AND partition_name IS NOT NULL
      `, [this.config.database, tableName]);

      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Test table optimization
   */
  async optimizeTable(tableName: string): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`OPTIMIZE TABLE \`${tableName}\``);
      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Test table analysis
   */
  async analyzeTable(tableName: string): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`ANALYZE TABLE \`${tableName}\``);
      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Test table checksum
   */
  async checksumTable(tableName: string): Promise<any[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(`CHECKSUM TABLE \`${tableName}\``);
      return rows as any[];
    } finally {
      connection.release();
    }
  }

  /**
   * Monitor InnoDB status
   */
  async getInnoDBStatus(): Promise<string> {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute('SHOW ENGINE INNODB STATUS');
      return (rows as any[])[0].Status;
    } finally {
      connection.release();
    }
  }

  /**
   * Test deadlock detection
   */
  async simulateDeadlock(): Promise<any> {
    const connection1 = await this.pool.getConnection();
    const connection2 = await this.pool.getConnection();
    
    try {
      // Start transactions
      await connection1.execute('START TRANSACTION');
      await connection2.execute('START TRANSACTION');

      // Create deadlock scenario (simplified example)
      await connection1.execute('SELECT * FROM users WHERE id = 1 FOR UPDATE');
      await connection2.execute('SELECT * FROM posts WHERE id = 1 FOR UPDATE');
      
      // This should cause a deadlock
      const promise1 = connection1.execute('SELECT * FROM posts WHERE id = 1 FOR UPDATE');
      const promise2 = connection2.execute('SELECT * FROM users WHERE id = 1 FOR UPDATE');

      try {
        await Promise.all([promise1, promise2]);
      } catch (error) {
        return { deadlockDetected: true, error: error.message };
      }

      return { deadlockDetected: false };
    } finally {
      await connection1.execute('ROLLBACK').catch(() => {});
      await connection2.execute('ROLLBACK').catch(() => {});
      connection1.release();
      connection2.release();
    }
  }

  /**
   * Create temporary table for testing
   */
  async createTempTable(tableName: string, columns: string): Promise<void> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.execute(`
        CREATE TEMPORARY TABLE \`${tableName}\` (
          ${columns}
        )
      `);
    } finally {
      connection.release();
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * MySQL-specific test utilities
 */
export class MySQLTestUtils {
  /**
   * Generate MySQL test configuration
   */
  static createTestConfig(overrides: Partial<MySQLConfig> = {}): MySQLConfig {
    return {
      host: 'localhost',
      port: 3306,
      database: 'test_db',
      user: 'test_user',
      password: 'test_password',
      ssl: false,
      charset: 'utf8mb4',
      timezone: '+00:00',
      ...overrides
    };
  }

  /**
   * Common MySQL data types for testing
   */
  static getDataTypes() {
    return {
      // Numeric types
      tinyint: (unsigned = false) => `TINYINT${unsigned ? ' UNSIGNED' : ''}`,
      smallint: (unsigned = false) => `SMALLINT${unsigned ? ' UNSIGNED' : ''}`,
      mediumint: (unsigned = false) => `MEDIUMINT${unsigned ? ' UNSIGNED' : ''}`,
      int: (unsigned = false) => `INT${unsigned ? ' UNSIGNED' : ''}`,
      bigint: (unsigned = false) => `BIGINT${unsigned ? ' UNSIGNED' : ''}`,
      decimal: (precision = 10, scale = 2) => `DECIMAL(${precision},${scale})`,
      float: (precision?: number) => precision ? `FLOAT(${precision})` : 'FLOAT',
      double: () => 'DOUBLE',
      
      // String types
      char: (length = 1) => `CHAR(${length})`,
      varchar: (length = 255) => `VARCHAR(${length})`,
      text: () => 'TEXT',
      mediumtext: () => 'MEDIUMTEXT',
      longtext: () => 'LONGTEXT',
      
      // Binary types
      binary: (length = 1) => `BINARY(${length})`,
      varbinary: (length = 255) => `VARBINARY(${length})`,
      blob: () => 'BLOB',
      mediumblob: () => 'MEDIUMBLOB',
      longblob: () => 'LONGBLOB',
      
      // Date and time types
      date: () => 'DATE',
      time: () => 'TIME',
      datetime: () => 'DATETIME',
      timestamp: () => 'TIMESTAMP',
      year: () => 'YEAR',
      
      // JSON type (MySQL 5.7+)
      json: () => 'JSON',
      
      // Spatial types
      geometry: () => 'GEOMETRY',
      point: () => 'POINT',
      linestring: () => 'LINESTRING',
      polygon: () => 'POLYGON'
    };
  }

  /**
   * Generate test data for MySQL specific types
   */
  static generateTestData() {
    return {
      date: () => '2023-12-25',
      time: () => '14:30:00',
      datetime: () => '2023-12-25 14:30:00',
      timestamp: () => '2023-12-25 14:30:00',
      year: () => 2023,
      json: () => ({ name: 'test', value: 123, array: [1, 2, 3] }),
      point: () => 'POINT(1.5 2.5)',
      geometry: () => 'POLYGON((0 0,1 0,1 1,0 1,0 0))',
      set: () => 'option1,option3',
      enum: () => 'small'
    };
  }

  /**
   * Common MySQL storage engines
   */
  static getStorageEngines() {
    return ['InnoDB', 'MyISAM', 'Memory', 'Archive', 'CSV'];
  }
}

/**
 * MySQL performance testing utilities
 */
export class MySQLPerformanceHelper {
  private helper: MySQLTestHelper;

  constructor(helper: MySQLTestHelper) {
    this.helper = helper;
  }

  /**
   * Benchmark query performance
   */
  async benchmarkQuery(query: string, params: any[] = [], iterations: number = 100): Promise<{
    avgTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
    executionPlan: any[];
  }> {
    const times: number[] = [];
    
    // Get execution plan first
    const executionPlan = await this.helper.explainQuery(query, params);
    
    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      await this.helper.pool.query(query, params);
      const endTime = process.hrtime.bigint();
      
      times.push(Number(endTime - startTime) / 1000000); // Convert to milliseconds
    }

    return {
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((a, b) => a + b, 0),
      executionPlan
    };
  }

  /**
   * Monitor query cache performance
   */
  async getQueryCacheStats(): Promise<any> {
    const variables = await this.helper.getVariables('query_cache%');
    const status = await this.helper.getStatus('Qcache%');
    
    return {
      variables: variables.reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {}),
      status: status.reduce((acc, s) => ({ ...acc, [s.name]: s.value }), {})
    };
  }

  /**
   * Monitor InnoDB buffer pool
   */
  async getBufferPoolStats(): Promise<any> {
    const status = await this.helper.getStatus('Innodb_buffer_pool%');
    return status.reduce((acc, s) => ({ ...acc, [s.name]: s.value }), {});
  }
}