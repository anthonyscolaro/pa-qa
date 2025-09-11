/**
 * PostgreSQL-Specific Database Testing Helpers
 * Provides PostgreSQL-optimized utilities for testing scenarios
 */

import { Pool, PoolClient, Client } from 'pg';
import { TransactionContext } from './transaction-helpers';
import { DatabaseConnectionPool } from './connection-pool';

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | any;
  schema?: string;
}

export interface PostgresExtension {
  name: string;
  version?: string;
  schema?: string;
}

export interface PostgresConstraint {
  name: string;
  table: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'EXCLUDE';
  definition: string;
  isValid: boolean;
  isDeferrable: boolean;
  isDeferred: boolean;
}

export interface PostgresIndex {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  partial: boolean;
  concurrent: boolean;
  method: 'btree' | 'hash' | 'gist' | 'gin' | 'spgist' | 'brin';
  definition: string;
}

export interface PostgresFunction {
  name: string;
  schema: string;
  language: string;
  returnType: string;
  arguments: string[];
  definition: string;
}

export class PostgresTestHelper {
  private pool: Pool;
  private config: PostgresConfig;

  constructor(config: PostgresConfig) {
    this.config = config;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl
    });
  }

  /**
   * Create a test database
   */
  async createTestDatabase(dbName: string): Promise<void> {
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      database: 'postgres', // Connect to default database
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl
    });

    await client.connect();
    
    try {
      // Check if database exists
      const result = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );

      if (result.rows.length === 0) {
        await client.query(`CREATE DATABASE "${dbName}"`);
      }
    } finally {
      await client.end();
    }
  }

  /**
   * Drop a test database
   */
  async dropTestDatabase(dbName: string): Promise<void> {
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      database: 'postgres',
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl
    });

    await client.connect();
    
    try {
      // Terminate active connections to the database
      await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `, [dbName]);

      // Drop the database
      await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    } finally {
      await client.end();
    }
  }

  /**
   * Create a test schema
   */
  async createTestSchema(schemaName: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      await client.query(`GRANT ALL ON SCHEMA "${schemaName}" TO "${this.config.user}"`);
    } finally {
      client.release();
    }
  }

  /**
   * Drop a test schema
   */
  async dropTestSchema(schemaName: string, cascade: boolean = true): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const cascadeClause = cascade ? 'CASCADE' : 'RESTRICT';
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" ${cascadeClause}`);
    } finally {
      client.release();
    }
  }

  /**
   * Install PostgreSQL extensions for testing
   */
  async installExtensions(extensions: PostgresExtension[]): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      for (const ext of extensions) {
        const schemaClause = ext.schema ? `WITH SCHEMA "${ext.schema}"` : '';
        const versionClause = ext.version ? `VERSION '${ext.version}'` : '';
        
        await client.query(`
          CREATE EXTENSION IF NOT EXISTS "${ext.name}" 
          ${versionClause} ${schemaClause}
        `);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get table statistics for analysis
   */
  async getTableStats(tableName: string, schemaName: string = 'public'): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          most_common_vals,
          most_common_freqs,
          histogram_bounds
        FROM pg_stats 
        WHERE schemaname = $1 AND tablename = $2
      `, [schemaName, tableName]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Analyze table for better query planning
   */
  async analyzeTable(tableName: string, schemaName: string = 'public'): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`ANALYZE "${schemaName}"."${tableName}"`);
    } finally {
      client.release();
    }
  }

  /**
   * Get query execution plan
   */
  async explainQuery(query: string, params?: any[], analyze: boolean = false): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      const explainType = analyze ? 'EXPLAIN ANALYZE' : 'EXPLAIN';
      const result = await client.query(`${explainType} ${query}`, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Test database constraints
   */
  async testConstraints(tableName: string, schemaName: string = 'public'): Promise<PostgresConstraint[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          con.conname as name,
          rel.relname as table,
          CASE con.contype
            WHEN 'p' THEN 'PRIMARY KEY'
            WHEN 'f' THEN 'FOREIGN KEY'
            WHEN 'u' THEN 'UNIQUE'
            WHEN 'c' THEN 'CHECK'
            WHEN 'x' THEN 'EXCLUDE'
          END as type,
          pg_get_constraintdef(con.oid) as definition,
          con.convalidated as is_valid,
          con.condeferrable as is_deferrable,
          con.condeferred as is_deferred
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = $1 AND rel.relname = $2
      `, [schemaName, tableName]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get table indexes
   */
  async getTableIndexes(tableName: string, schemaName: string = 'public'): Promise<PostgresIndex[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          i.relname as name,
          t.relname as table,
          array_agg(a.attname ORDER BY a.attnum) as columns,
          ix.indisunique as unique,
          ix.indpred IS NOT NULL as partial,
          false as concurrent, -- Can't determine from catalog
          am.amname as method,
          pg_get_indexdef(i.oid) as definition
        FROM pg_class i
        JOIN pg_index ix ON i.oid = ix.indexrelid
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        JOIN pg_am am ON am.oid = i.relam
        WHERE n.nspname = $1 AND t.relname = $2 AND i.relkind = 'i'
        GROUP BY i.relname, t.relname, ix.indisunique, ix.indpred, am.amname, i.oid
      `, [schemaName, tableName]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Test database functions
   */
  async testFunction(functionName: string, args: any[] = [], schemaName: string = 'public'): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const argPlaceholders = args.map((_, i) => `$${i + 1}`).join(', ');
      const result = await client.query(
        `SELECT "${schemaName}"."${functionName}"(${argPlaceholders}) as result`,
        args
      );
      
      return result.rows[0]?.result;
    } finally {
      client.release();
    }
  }

  /**
   * Get stored functions for testing
   */
  async getFunctions(schemaName: string = 'public'): Promise<PostgresFunction[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          p.proname as name,
          n.nspname as schema,
          l.lanname as language,
          pg_get_function_result(p.oid) as return_type,
          pg_get_function_arguments(p.oid) as arguments,
          p.prosrc as definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_language l ON l.oid = p.prolang
        WHERE n.nspname = $1 AND p.prokind = 'f'
      `, [schemaName]);

      return result.rows.map(row => ({
        ...row,
        arguments: row.arguments ? row.arguments.split(', ') : []
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Test database triggers
   */
  async getTriggers(tableName: string, schemaName: string = 'public'): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          t.tgname as name,
          t.tgenabled as enabled,
          t.tgtype as type,
          p.proname as function_name,
          pg_get_triggerdef(t.oid) as definition
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_proc p ON p.oid = t.tgfoid
        WHERE n.nspname = $1 AND c.relname = $2 AND NOT t.tgisinternal
      `, [schemaName, tableName]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Monitor database locks during tests
   */
  async getCurrentLocks(): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          l.locktype,
          l.database,
          l.relation::regclass as relation,
          l.page,
          l.tuple,
          l.virtualxid,
          l.transactionid,
          l.classid,
          l.objid,
          l.objsubid,
          l.virtualtransaction,
          l.pid,
          l.mode,
          l.granted,
          a.query
        FROM pg_locks l
        LEFT JOIN pg_stat_activity a ON a.pid = l.pid
        WHERE l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
      `);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats(): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_connections,
          COUNT(*) FILTER (WHERE state = 'active') as active_connections,
          COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
          COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          MAX(now() - query_start) as longest_query_time,
          MAX(now() - state_change) as longest_idle_time
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Test VACUUM and ANALYZE operations
   */
  async vacuumAnalyze(tableName?: string, schemaName: string = 'public'): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      if (tableName) {
        await client.query(`VACUUM ANALYZE "${schemaName}"."${tableName}"`);
      } else {
        await client.query('VACUUM ANALYZE');
      }
    } finally {
      client.release();
    }
  }

  /**
   * Test database replication status (if applicable)
   */
  async getReplicationStatus(): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          client_addr,
          client_hostname,
          client_port,
          state,
          sent_lsn,
          write_lsn,
          flush_lsn,
          replay_lsn,
          write_lag,
          flush_lag,
          replay_lag,
          sync_state
        FROM pg_stat_replication
      `);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Create temporary test table
   */
  async createTempTable(tableName: string, columns: string, onCommitAction: 'DELETE ROWS' | 'DROP' = 'DROP'): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TEMPORARY TABLE ${tableName} (
          ${columns}
        ) ON COMMIT ${onCommitAction}
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Test JSON/JSONB operations
   */
  async testJsonOperations(tableName: string, jsonColumn: string, testData: any): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      // Insert test JSON data
      await client.query(
        `INSERT INTO ${tableName} (${jsonColumn}) VALUES ($1)`,
        [JSON.stringify(testData)]
      );

      // Test various JSON operations
      const results = await client.query(`
        SELECT 
          ${jsonColumn},
          ${jsonColumn}->>'name' as name_text,
          ${jsonColumn}->'address' as address_json,
          jsonb_typeof(${jsonColumn}) as json_type,
          ${jsonColumn} ? 'name' as has_name_key
        FROM ${tableName}
        WHERE ${jsonColumn} IS NOT NULL
        LIMIT 1
      `);

      return results.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Test array operations
   */
  async testArrayOperations(tableName: string, arrayColumn: string, testArray: any[]): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query(
        `INSERT INTO ${tableName} (${arrayColumn}) VALUES ($1)`,
        [testArray]
      );

      const results = await client.query(`
        SELECT 
          ${arrayColumn},
          array_length(${arrayColumn}, 1) as array_length,
          ${arrayColumn}[1] as first_element,
          ${arrayColumn} @> ARRAY[$1] as contains_element
        FROM ${tableName}
        WHERE ${arrayColumn} IS NOT NULL
        LIMIT 1
      `, [testArray[0]]);

      return results.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * PostgreSQL-specific test utilities
 */
export class PostgresTestUtils {
  /**
   * Generate PostgreSQL test configuration
   */
  static createTestConfig(overrides: Partial<PostgresConfig> = {}): PostgresConfig {
    return {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test_user',
      password: 'test_password',
      ssl: false,
      ...overrides
    };
  }

  /**
   * Common PostgreSQL extensions for testing
   */
  static getCommonExtensions(): PostgresExtension[] {
    return [
      { name: 'uuid-ossp' },
      { name: 'pgcrypto' },
      { name: 'hstore' },
      { name: 'citext' },
      { name: 'pg_trgm' },
      { name: 'btree_gin' },
      { name: 'btree_gist' }
    ];
  }

  /**
   * Generate test data for PostgreSQL specific types
   */
  static generateTestData() {
    return {
      uuid: () => '550e8400-e29b-41d4-a716-446655440000',
      jsonb: () => ({ name: 'test', value: 123, nested: { key: 'value' } }),
      array: () => ['item1', 'item2', 'item3'],
      hstore: () => '"key1"=>"value1","key2"=>"value2"',
      daterange: () => '[2023-01-01,2023-12-31)',
      inet: () => '192.168.1.1/24',
      macaddr: () => '08:00:2b:01:02:03',
      point: () => '(1.5, 2.5)',
      polygon: () => '((0,0),(1,0),(1,1),(0,1))',
      tsvector: () => "'test':1 'document':2"
    };
  }
}

/**
 * PostgreSQL performance testing utilities
 */
export class PostgresPerformanceHelper {
  private helper: PostgresTestHelper;

  constructor(helper: PostgresTestHelper) {
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
    const executionPlan = await this.helper.explainQuery(query, params, true);
    
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
   * Monitor table bloat
   */
  async checkTableBloat(tableName: string, schemaName: string = 'public'): Promise<any> {
    const client = await this.helper.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = $1 AND tablename = $2
      `, [schemaName, tableName]);

      return result.rows;
    } finally {
      client.release();
    }
  }
}