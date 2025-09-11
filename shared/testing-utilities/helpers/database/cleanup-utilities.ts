/**
 * Database Cleanup Utilities for Test Teardown
 * Provides comprehensive cleanup mechanisms for maintaining test isolation
 */

import { DatabaseConnectionPool } from './connection-pool';
import { TransactionContext, TransactionManager } from './transaction-helpers';
import { DatabaseSeeder } from './seeders';

export interface CleanupConfig {
  truncateInOrder?: boolean;
  cascadeDeletes?: boolean;
  resetSequences?: boolean;
  preserveTables?: string[];
  preservePatterns?: RegExp[];
  cleanupTimeout?: number;
  verifyCleanup?: boolean;
}

export interface CleanupResult {
  success: boolean;
  tablesCleared: string[];
  errors: string[];
  duration: number;
  recordsDeleted: number;
}

export interface TableInfo {
  name: string;
  recordCount: number;
  dependencies: string[];
  hasAutoIncrement: boolean;
  hasTimestamps: boolean;
}

export class DatabaseCleaner {
  private pool: DatabaseConnectionPool;
  private config: CleanupConfig;
  private databaseType: 'postgres' | 'mysql' | 'mongodb';
  private tableCache: Map<string, TableInfo> = new Map();

  constructor(
    pool: DatabaseConnectionPool,
    databaseType: 'postgres' | 'mysql' | 'mongodb',
    config: CleanupConfig = {}
  ) {
    this.pool = pool;
    this.databaseType = databaseType;
    this.config = {
      truncateInOrder: true,
      cascadeDeletes: true,
      resetSequences: true,
      preserveTables: ['schema_migrations', 'ar_internal_metadata'],
      preservePatterns: [/^pg_/, /^information_schema/, /^sys/, /^mysql/],
      cleanupTimeout: 30000,
      verifyCleanup: true,
      ...config
    };
  }

  /**
   * Perform comprehensive database cleanup
   */
  async cleanup(): Promise<CleanupResult> {
    const startTime = Date.now();
    const result: CleanupResult = {
      success: false,
      tablesCleared: [],
      errors: [],
      duration: 0,
      recordsDeleted: 0
    };

    try {
      // Get list of tables to clean
      const tablesToClean = await this.getTablesToClear();
      
      // Order tables by dependencies if configured
      const orderedTables = this.config.truncateInOrder 
        ? await this.orderTablesByDependencies(tablesToClean)
        : tablesToClean;

      // Perform cleanup
      for (const table of orderedTables) {
        try {
          const recordsDeleted = await this.cleanTable(table);
          result.tablesCleared.push(table);
          result.recordsDeleted += recordsDeleted;
        } catch (error) {
          result.errors.push(`Failed to clean table ${table}: ${error.message}`);
        }
      }

      // Reset sequences if configured
      if (this.config.resetSequences) {
        await this.resetSequences(result.tablesCleared);
      }

      // Verify cleanup if configured
      if (this.config.verifyCleanup) {
        const verificationErrors = await this.verifyCleanup(result.tablesCleared);
        result.errors.push(...verificationErrors);
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Cleanup failed: ${error.message}`);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Clean specific tables
   */
  async cleanTables(tableNames: string[]): Promise<CleanupResult> {
    const startTime = Date.now();
    const result: CleanupResult = {
      success: false,
      tablesCleared: [],
      errors: [],
      duration: 0,
      recordsDeleted: 0
    };

    try {
      const orderedTables = this.config.truncateInOrder 
        ? await this.orderTablesByDependencies(tableNames)
        : tableNames;

      for (const table of orderedTables) {
        if (this.shouldPreserveTable(table)) {
          continue;
        }

        try {
          const recordsDeleted = await this.cleanTable(table);
          result.tablesCleared.push(table);
          result.recordsDeleted += recordsDeleted;
        } catch (error) {
          result.errors.push(`Failed to clean table ${table}: ${error.message}`);
        }
      }

      if (this.config.resetSequences) {
        await this.resetSequences(result.tablesCleared);
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Table cleanup failed: ${error.message}`);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Clean database using transaction rollback
   */
  async cleanupWithTransaction(
    transactionManager: TransactionManager,
    context: TransactionContext
  ): Promise<void> {
    // For transaction-based cleanup, we simply rollback
    await transactionManager.rollbackTransaction(context);
  }

  /**
   * Clean specific table with optimized strategy
   */
  async cleanTable(tableName: string): Promise<number> {
    if (this.shouldPreserveTable(tableName)) {
      return 0;
    }

    const connection = await this.pool.getConnection();
    
    try {
      // Get record count before cleanup
      const beforeCount = await this.getTableRecordCount(connection, tableName);
      
      if (beforeCount === 0) {
        return 0;
      }

      // Choose cleanup strategy based on database type and table size
      if (beforeCount > 10000) {
        // For large tables, use TRUNCATE if possible
        await this.truncateTable(connection, tableName);
      } else {
        // For smaller tables, use DELETE to avoid FK constraint issues
        await this.deleteAllRecords(connection, tableName);
      }

      return beforeCount;
    } finally {
      await this.pool.releaseConnection(connection);
    }
  }

  /**
   * Get table record count
   */
  async getTableRecordCount(connection: any, tableName: string): Promise<number> {
    try {
      switch (this.databaseType) {
        case 'postgres':
        case 'mysql':
          const result = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          return parseInt(result.rows?.[0]?.count || result[0]?.count || 0);
        case 'mongodb':
          return await connection.collection(tableName).countDocuments();
        default:
          return 0;
      }
    } catch (error) {
      // Table might not exist or be accessible
      return 0;
    }
  }

  /**
   * Truncate table
   */
  private async truncateTable(connection: any, tableName: string): Promise<void> {
    switch (this.databaseType) {
      case 'postgres':
        if (this.config.cascadeDeletes) {
          await connection.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
        } else {
          await connection.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY`);
        }
        break;
      case 'mysql':
        await connection.query(`TRUNCATE TABLE ${tableName}`);
        break;
      case 'mongodb':
        await connection.collection(tableName).deleteMany({});
        break;
    }
  }

  /**
   * Delete all records from table
   */
  private async deleteAllRecords(connection: any, tableName: string): Promise<void> {
    switch (this.databaseType) {
      case 'postgres':
      case 'mysql':
        await connection.query(`DELETE FROM ${tableName}`);
        break;
      case 'mongodb':
        await connection.collection(tableName).deleteMany({});
        break;
    }
  }

  /**
   * Get all tables that should be cleaned
   */
  private async getTablesToClear(): Promise<string[]> {
    const connection = await this.pool.getConnection();
    
    try {
      const allTables = await this.getAllTables(connection);
      return allTables.filter(table => !this.shouldPreserveTable(table));
    } finally {
      await this.pool.releaseConnection(connection);
    }
  }

  /**
   * Get all tables from database
   */
  private async getAllTables(connection: any): Promise<string[]> {
    let query: string;

    switch (this.databaseType) {
      case 'postgres':
        query = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        `;
        break;
      case 'mysql':
        query = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_type = 'BASE TABLE'
        `;
        break;
      case 'mongodb':
        // For MongoDB, get collection names
        const collections = await connection.listCollections().toArray();
        return collections.map(c => c.name);
      default:
        return [];
    }

    const result = await connection.query(query);
    return result.rows?.map((row: any) => row.table_name) || [];
  }

  /**
   * Check if table should be preserved
   */
  private shouldPreserveTable(tableName: string): boolean {
    // Check explicit preserve list
    if (this.config.preserveTables?.includes(tableName)) {
      return true;
    }

    // Check preserve patterns
    if (this.config.preservePatterns) {
      for (const pattern of this.config.preservePatterns) {
        if (pattern.test(tableName)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Order tables by dependencies to avoid FK constraint violations
   */
  private async orderTablesByDependencies(tables: string[]): Promise<string[]> {
    // Build dependency graph
    const dependencies = new Map<string, string[]>();
    
    for (const table of tables) {
      const deps = await this.getTableDependencies(table);
      dependencies.set(table, deps.filter(dep => tables.includes(dep)));
    }

    // Topological sort (reverse order for deletion)
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (table: string) => {
      if (visited.has(table)) return;
      if (visiting.has(table)) {
        // Circular dependency - add table anyway
        return;
      }

      visiting.add(table);
      const deps = dependencies.get(table) || [];
      
      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(table);
      visited.add(table);
      sorted.push(table);
    };

    for (const table of tables) {
      visit(table);
    }

    // Reverse for deletion order (delete dependents before dependencies)
    return sorted.reverse();
  }

  /**
   * Get table dependencies (simplified implementation)
   */
  private async getTableDependencies(tableName: string): Promise<string[]> {
    const connection = await this.pool.getConnection();
    
    try {
      let query: string;
      let params: any[];

      switch (this.databaseType) {
        case 'postgres':
          query = `
            SELECT 
              cl.relname as table_name
            FROM pg_constraint fk
            JOIN pg_class cl ON cl.oid = fk.confrelid
            JOIN pg_class cl2 ON cl2.oid = fk.conrelid
            WHERE cl2.relname = $1 
            AND fk.contype = 'f'
          `;
          params = [tableName];
          break;
        case 'mysql':
          query = `
            SELECT 
              referenced_table_name as table_name
            FROM information_schema.key_column_usage
            WHERE table_name = ? 
            AND referenced_table_name IS NOT NULL
            AND table_schema = DATABASE()
          `;
          params = [tableName];
          break;
        default:
          return [];
      }

      const result = await connection.query(query, params);
      return result.rows?.map((row: any) => row.table_name) || [];
    } catch (error) {
      // If we can't determine dependencies, return empty array
      return [];
    } finally {
      await this.pool.releaseConnection(connection);
    }
  }

  /**
   * Reset auto-increment sequences
   */
  private async resetSequences(tables: string[]): Promise<void> {
    if (this.databaseType === 'mongodb') {
      return; // MongoDB doesn't have sequences
    }

    const connection = await this.pool.getConnection();
    
    try {
      for (const table of tables) {
        try {
          switch (this.databaseType) {
            case 'postgres':
              // Reset all sequences for the table
              await connection.query(`
                SELECT setval(pg_get_serial_sequence($1, column_name), 1, false)
                FROM information_schema.columns 
                WHERE table_name = $1 
                AND column_default LIKE 'nextval%'
              `, [table]);
              break;
            case 'mysql':
              await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
              break;
          }
        } catch (error) {
          // Ignore errors for tables without sequences
        }
      }
    } finally {
      await this.pool.releaseConnection(connection);
    }
  }

  /**
   * Verify cleanup was successful
   */
  private async verifyCleanup(tables: string[]): Promise<string[]> {
    const errors: string[] = [];
    const connection = await this.pool.getConnection();

    try {
      for (const table of tables) {
        const count = await this.getTableRecordCount(connection, table);
        if (count > 0) {
          errors.push(`Table ${table} still contains ${count} records after cleanup`);
        }
      }
    } finally {
      await this.pool.releaseConnection(connection);
    }

    return errors;
  }
}

/**
 * Test-specific cleanup utilities
 */
export class TestDatabaseCleaner extends DatabaseCleaner {
  private seeder?: DatabaseSeeder;

  constructor(
    pool: DatabaseConnectionPool,
    databaseType: 'postgres' | 'mysql' | 'mongodb',
    config: CleanupConfig = {},
    seeder?: DatabaseSeeder
  ) {
    super(pool, databaseType, config);
    this.seeder = seeder;
  }

  /**
   * Clean and reseed database for next test
   */
  async cleanAndReseed(seeders?: string[]): Promise<CleanupResult> {
    const cleanupResult = await this.cleanup();
    
    if (this.seeder && cleanupResult.success) {
      try {
        // For test cleaning, we don't use transactions since we want permanent cleanup
        // This is a simplified approach - in practice you'd need proper transaction handling
        await this.seeder.clearSeededData();
        
        if (seeders) {
          // Would need transaction context - this is conceptual
          // await this.seeder.seed(context, seeders);
        }
      } catch (error) {
        cleanupResult.errors.push(`Reseeding failed: ${error.message}`);
        cleanupResult.success = false;
      }
    }

    return cleanupResult;
  }

  /**
   * Cleanup specific to test isolation patterns
   */
  async isolatedCleanup(testName: string): Promise<CleanupResult> {
    // Add test-specific cleanup logic here
    // For example, cleaning test-specific temporary tables
    const testTables = await this.getTestSpecificTables(testName);
    return await this.cleanTables(testTables);
  }

  private async getTestSpecificTables(testName: string): Promise<string[]> {
    // Logic to find tables created specifically for this test
    // This could be based on naming conventions, metadata, etc.
    const connection = await this.pool.getConnection();
    
    try {
      const allTables = await this.getAllTables(connection);
      return allTables.filter(table => 
        table.includes(`_test_${testName}`) || 
        table.startsWith('tmp_') ||
        table.startsWith('test_')
      );
    } finally {
      await this.pool.releaseConnection(connection);
    }
  }

  private async getAllTables(connection: any): Promise<string[]> {
    // Reuse the parent method
    return [];
  }
}

/**
 * Cleanup strategies for different test scenarios
 */
export class CleanupStrategies {
  /**
   * Fast cleanup strategy for unit tests
   */
  static createFastCleanup(
    pool: DatabaseConnectionPool,
    databaseType: 'postgres' | 'mysql' | 'mongodb'
  ): DatabaseCleaner {
    return new DatabaseCleaner(pool, databaseType, {
      truncateInOrder: false,
      cascadeDeletes: true,
      resetSequences: false,
      verifyCleanup: false,
      cleanupTimeout: 5000
    });
  }

  /**
   * Thorough cleanup strategy for integration tests
   */
  static createThoroughCleanup(
    pool: DatabaseConnectionPool,
    databaseType: 'postgres' | 'mysql' | 'mongodb'
  ): DatabaseCleaner {
    return new DatabaseCleaner(pool, databaseType, {
      truncateInOrder: true,
      cascadeDeletes: true,
      resetSequences: true,
      verifyCleanup: true,
      cleanupTimeout: 30000
    });
  }

  /**
   * Safe cleanup strategy for production-like tests
   */
  static createSafeCleanup(
    pool: DatabaseConnectionPool,
    databaseType: 'postgres' | 'mysql' | 'mongodb'
  ): DatabaseCleaner {
    return new DatabaseCleaner(pool, databaseType, {
      truncateInOrder: true,
      cascadeDeletes: false,
      resetSequences: true,
      verifyCleanup: true,
      preserveTables: [
        'schema_migrations',
        'ar_internal_metadata',
        'users', // Don't clean user data in safe mode
        'settings',
        'configurations'
      ],
      cleanupTimeout: 60000
    });
  }
}

/**
 * Utility functions
 */
export async function withCleanup<T>(
  cleaner: DatabaseCleaner,
  testFn: () => Promise<T>
): Promise<T> {
  try {
    const result = await testFn();
    return result;
  } finally {
    await cleaner.cleanup();
  }
}

export async function cleanupAfterTest(
  cleaner: DatabaseCleaner,
  testName?: string
): Promise<void> {
  const result = await cleaner.cleanup();
  
  if (!result.success) {
    console.warn(`Cleanup failed for test ${testName || 'unknown'}:`, result.errors);
  }
}

/**
 * Global cleanup registry for test frameworks
 */
export class GlobalCleanupRegistry {
  private static cleaners: DatabaseCleaner[] = [];

  static register(cleaner: DatabaseCleaner): void {
    this.cleaners.push(cleaner);
  }

  static async cleanupAll(): Promise<CleanupResult[]> {
    const results = await Promise.allSettled(
      this.cleaners.map(cleaner => cleaner.cleanup())
    );

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            success: false,
            tablesCleared: [],
            errors: [result.reason.message],
            duration: 0,
            recordsDeleted: 0
          }
    );
  }

  static clear(): void {
    this.cleaners = [];
  }
}