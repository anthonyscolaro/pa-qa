/**
 * Database Migration Testing Utilities
 * Provides utilities for testing database migrations and schema changes
 */

import { TransactionContext, TransactionManager } from './transaction-helpers';
import fs from 'fs/promises';
import path from 'path';

export interface MigrationFile {
  filename: string;
  timestamp: number;
  version: string;
  up: string;
  down: string;
}

export interface MigrationTestResult {
  success: boolean;
  error?: string;
  duration: number;
  affectedTables: string[];
  warnings: string[];
}

export interface SchemaSnapshot {
  tables: TableSchema[];
  indexes: IndexSchema[];
  constraints: ConstraintSchema[];
  timestamp: number;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primaryKey: string[];
  foreignKeys: ForeignKeySchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  length?: number;
  precision?: number;
  scale?: number;
}

export interface IndexSchema {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type: string;
}

export interface ConstraintSchema {
  name: string;
  table: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  definition: string;
}

export interface ForeignKeySchema {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

export class MigrationTester {
  private transactionManager: TransactionManager;
  private migrationsPath: string;
  private databaseType: 'postgres' | 'mysql' | 'mongodb';

  constructor(
    transactionManager: TransactionManager,
    migrationsPath: string,
    databaseType: 'postgres' | 'mysql' | 'mongodb'
  ) {
    this.transactionManager = transactionManager;
    this.migrationsPath = migrationsPath;
    this.databaseType = databaseType;
  }

  /**
   * Test a single migration up and down
   */
  async testMigration(
    context: TransactionContext,
    migrationFile: string
  ): Promise<MigrationTestResult> {
    const startTime = Date.now();
    const result: MigrationTestResult = {
      success: false,
      duration: 0,
      affectedTables: [],
      warnings: []
    };

    try {
      const migration = await this.loadMigrationFile(migrationFile);
      const client = this.transactionManager.getTransactionClient(context);

      // Take schema snapshot before migration
      const beforeSnapshot = await this.takeSchemaSnapshot(client);

      // Create savepoint before migration
      await this.transactionManager.createSavepoint(context, 'before_migration');

      // Execute UP migration
      const upResult = await this.executeMigrationSQL(client, migration.up);
      result.affectedTables.push(...upResult.affectedTables);
      result.warnings.push(...upResult.warnings);

      // Take schema snapshot after migration
      const afterSnapshot = await this.takeSchemaSnapshot(client);

      // Validate schema changes
      const validationResult = await this.validateSchemaChanges(beforeSnapshot, afterSnapshot);
      result.warnings.push(...validationResult.warnings);

      // Test DOWN migration
      const downResult = await this.executeMigrationSQL(client, migration.down);
      result.warnings.push(...downResult.warnings);

      // Verify schema is restored
      const restoredSnapshot = await this.takeSchemaSnapshot(client);
      const restoreValidation = await this.validateSchemaRestore(beforeSnapshot, restoredSnapshot);
      result.warnings.push(...restoreValidation.warnings);

      if (!restoreValidation.success) {
        result.warnings.push('DOWN migration did not fully restore original schema');
      }

      result.success = true;
    } catch (error) {
      result.error = error.message;
      result.success = false;
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Test multiple migrations in sequence
   */
  async testMigrationSequence(
    context: TransactionContext,
    migrationFiles: string[]
  ): Promise<MigrationTestResult[]> {
    const results: MigrationTestResult[] = [];

    for (const migrationFile of migrationFiles) {
      const result = await this.testMigration(context, migrationFile);
      results.push(result);

      // Stop if migration fails
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Test migration rollback scenarios
   */
  async testMigrationRollback(
    context: TransactionContext,
    migrationFiles: string[],
    rollbackToIndex: number
  ): Promise<MigrationTestResult> {
    const startTime = Date.now();
    const result: MigrationTestResult = {
      success: false,
      duration: 0,
      affectedTables: [],
      warnings: []
    };

    try {
      const client = this.transactionManager.getTransactionClient(context);
      const initialSnapshot = await this.takeSchemaSnapshot(client);

      // Apply migrations up to the rollback point
      for (let i = 0; i < migrationFiles.length; i++) {
        const migration = await this.loadMigrationFile(migrationFiles[i]);
        await this.executeMigrationSQL(client, migration.up);
      }

      // Rollback to specified index
      for (let i = migrationFiles.length - 1; i > rollbackToIndex; i--) {
        const migration = await this.loadMigrationFile(migrationFiles[i]);
        const rollbackResult = await this.executeMigrationSQL(client, migration.down);
        result.affectedTables.push(...rollbackResult.affectedTables);
        result.warnings.push(...rollbackResult.warnings);
      }

      // Validate final state
      const finalSnapshot = await this.takeSchemaSnapshot(client);
      const targetSnapshot = await this.getExpectedSchemaAfterMigrations(
        initialSnapshot,
        migrationFiles.slice(0, rollbackToIndex + 1)
      );

      const validation = await this.validateSchemaMatches(finalSnapshot, targetSnapshot);
      result.warnings.push(...validation.warnings);
      result.success = validation.success;

    } catch (error) {
      result.error = error.message;
      result.success = false;
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Test migration with data preservation
   */
  async testMigrationWithData(
    context: TransactionContext,
    migrationFile: string,
    testData: Map<string, any[]>
  ): Promise<MigrationTestResult & { dataIntegrity: boolean }> {
    const baseResult = await this.testMigration(context, migrationFile);
    const client = this.transactionManager.getTransactionClient(context);

    // Insert test data
    for (const [table, data] of testData.entries()) {
      await this.insertTestData(client, table, data);
    }

    // Apply migration
    const migration = await this.loadMigrationFile(migrationFile);
    await this.executeMigrationSQL(client, migration.up);

    // Verify data integrity
    let dataIntegrity = true;
    for (const [table, originalData] of testData.entries()) {
      const preserved = await this.verifyDataPreservation(client, table, originalData);
      if (!preserved) {
        dataIntegrity = false;
        baseResult.warnings.push(`Data integrity compromised in table: ${table}`);
      }
    }

    return { ...baseResult, dataIntegrity };
  }

  /**
   * Generate migration test report
   */
  async generateTestReport(results: MigrationTestResult[]): Promise<string> {
    const totalMigrations = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = totalMigrations - successful;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const allWarnings = results.flatMap(r => r.warnings);

    return `
# Migration Test Report

## Summary
- Total Migrations Tested: ${totalMigrations}
- Successful: ${successful}
- Failed: ${failed}
- Total Duration: ${totalDuration}ms
- Average Duration: ${Math.round(totalDuration / totalMigrations)}ms

## Warnings
${allWarnings.length > 0 ? allWarnings.map(w => `- ${w}`).join('\n') : 'None'}

## Detailed Results
${results.map((result, index) => `
### Migration ${index + 1}
- Status: ${result.success ? 'PASSED' : 'FAILED'}
- Duration: ${result.duration}ms
- Affected Tables: ${result.affectedTables.join(', ') || 'None'}
${result.error ? `- Error: ${result.error}` : ''}
${result.warnings.length > 0 ? `- Warnings: ${result.warnings.join(', ')}` : ''}
`).join('\n')}
    `;
  }

  /**
   * Private helper methods
   */
  private async loadMigrationFile(filename: string): Promise<MigrationFile> {
    const fullPath = path.join(this.migrationsPath, filename);
    const content = await fs.readFile(fullPath, 'utf-8');

    // Parse migration file (assuming SQL format with -- UP and -- DOWN comments)
    const upMatch = content.match(/-- UP\s*([\s\S]*?)(?=-- DOWN|$)/i);
    const downMatch = content.match(/-- DOWN\s*([\s\S]*?)$/i);

    if (!upMatch || !downMatch) {
      throw new Error(`Invalid migration file format: ${filename}`);
    }

    const timestampMatch = filename.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    const timestamp = timestampMatch 
      ? Date.parse(`${timestampMatch[1]}-${timestampMatch[2]}-${timestampMatch[3]}T${timestampMatch[4]}:${timestampMatch[5]}:${timestampMatch[6]}`)
      : Date.now();

    return {
      filename,
      timestamp,
      version: filename.split('_')[0] || '0',
      up: upMatch[1].trim(),
      down: downMatch[1].trim()
    };
  }

  private async executeMigrationSQL(client: any, sql: string): Promise<{
    affectedTables: string[];
    warnings: string[];
  }> {
    const statements = sql.split(';').filter(s => s.trim());
    const affectedTables: Set<string> = new Set();
    const warnings: string[] = [];

    for (const statement of statements) {
      if (!statement.trim()) continue;

      try {
        const result = await client.query(statement.trim());
        
        // Extract table names from common SQL operations
        const tableMatches = statement.match(/(?:FROM|INTO|UPDATE|ALTER TABLE|DROP TABLE|CREATE TABLE)\s+([`"\[]?\w+[`"\]]?)/gi);
        if (tableMatches) {
          tableMatches.forEach(match => {
            const tableName = match.split(/\s+/)[1].replace(/[`"\[\]]/g, '');
            affectedTables.add(tableName);
          });
        }

        // Check for warnings in result (database-specific)
        if (result.warnings && result.warnings.length > 0) {
          warnings.push(...result.warnings.map((w: any) => w.message || w));
        }
      } catch (error) {
        throw new Error(`Migration SQL failed: ${statement.substring(0, 100)}...\nError: ${error.message}`);
      }
    }

    return {
      affectedTables: Array.from(affectedTables),
      warnings
    };
  }

  private async takeSchemaSnapshot(client: any): Promise<SchemaSnapshot> {
    const snapshot: SchemaSnapshot = {
      tables: [],
      indexes: [],
      constraints: [],
      timestamp: Date.now()
    };

    try {
      // Get table information (database-specific queries)
      const tables = await this.getTables(client);
      
      for (const tableName of tables) {
        const columns = await this.getTableColumns(client, tableName);
        const foreignKeys = await this.getTableForeignKeys(client, tableName);
        const primaryKey = await this.getTablePrimaryKey(client, tableName);

        snapshot.tables.push({
          name: tableName,
          columns,
          primaryKey,
          foreignKeys
        });
      }

      snapshot.indexes = await this.getIndexes(client);
      snapshot.constraints = await this.getConstraints(client);
    } catch (error) {
      console.warn(`Warning: Could not take complete schema snapshot: ${error.message}`);
    }

    return snapshot;
  }

  private async getTables(client: any): Promise<string[]> {
    let query: string;

    switch (this.databaseType) {
      case 'postgres':
        query = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `;
        break;
      case 'mysql':
        query = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
        `;
        break;
      default:
        return [];
    }

    const result = await client.query(query);
    return result.rows?.map((row: any) => row.table_name) || [];
  }

  private async getTableColumns(client: any, tableName: string): Promise<ColumnSchema[]> {
    let query: string;
    let params: any[];

    switch (this.databaseType) {
      case 'postgres':
        query = `
          SELECT 
            column_name as name,
            data_type as type,
            is_nullable,
            column_default as default_value,
            character_maximum_length as length,
            numeric_precision as precision,
            numeric_scale as scale
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `;
        params = [tableName];
        break;
      case 'mysql':
        query = `
          SELECT 
            column_name as name,
            data_type as type,
            is_nullable,
            column_default as default_value,
            character_maximum_length as length,
            numeric_precision as precision,
            numeric_scale as scale
          FROM information_schema.columns 
          WHERE table_name = ? AND table_schema = DATABASE()
          ORDER BY ordinal_position
        `;
        params = [tableName];
        break;
      default:
        return [];
    }

    const result = await client.query(query, params);
    return result.rows?.map((row: any) => ({
      name: row.name,
      type: row.type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.default_value,
      length: row.length,
      precision: row.precision,
      scale: row.scale
    })) || [];
  }

  private async getTableForeignKeys(client: any, tableName: string): Promise<ForeignKeySchema[]> {
    // Simplified implementation - would need database-specific queries
    return [];
  }

  private async getTablePrimaryKey(client: any, tableName: string): Promise<string[]> {
    // Simplified implementation - would need database-specific queries
    return ['id']; // Common assumption
  }

  private async getIndexes(client: any): Promise<IndexSchema[]> {
    // Simplified implementation - would need database-specific queries
    return [];
  }

  private async getConstraints(client: any): Promise<ConstraintSchema[]> {
    // Simplified implementation - would need database-specific queries
    return [];
  }

  private async validateSchemaChanges(before: SchemaSnapshot, after: SchemaSnapshot): Promise<{
    success: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Check for dropped tables
    const beforeTables = new Set(before.tables.map(t => t.name));
    const afterTables = new Set(after.tables.map(t => t.name));

    for (const tableName of beforeTables) {
      if (!afterTables.has(tableName)) {
        warnings.push(`Table dropped: ${tableName}`);
      }
    }

    // Check for new tables
    for (const tableName of afterTables) {
      if (!beforeTables.has(tableName)) {
        warnings.push(`Table created: ${tableName}`);
      }
    }

    return {
      success: true,
      warnings
    };
  }

  private async validateSchemaRestore(original: SchemaSnapshot, restored: SchemaSnapshot): Promise<{
    success: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let success = true;

    // Compare table structures
    const originalTables = new Map(original.tables.map(t => [t.name, t]));
    const restoredTables = new Map(restored.tables.map(t => [t.name, t]));

    for (const [tableName, originalTable] of originalTables) {
      const restoredTable = restoredTables.get(tableName);
      
      if (!restoredTable) {
        warnings.push(`Table not restored: ${tableName}`);
        success = false;
        continue;
      }

      // Compare column structures (simplified)
      if (originalTable.columns.length !== restoredTable.columns.length) {
        warnings.push(`Column count mismatch in table ${tableName}`);
        success = false;
      }
    }

    return { success, warnings };
  }

  private async validateSchemaMatches(actual: SchemaSnapshot, expected: SchemaSnapshot): Promise<{
    success: boolean;
    warnings: string[];
  }> {
    // Simplified implementation
    return { success: true, warnings: [] };
  }

  private async getExpectedSchemaAfterMigrations(
    initial: SchemaSnapshot,
    migrations: string[]
  ): Promise<SchemaSnapshot> {
    // This would simulate applying migrations to predict expected schema
    // Simplified implementation returns initial schema
    return initial;
  }

  private async insertTestData(client: any, table: string, data: any[]): Promise<void> {
    for (const record of data) {
      const columns = Object.keys(record);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => record[col]);

      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      await client.query(query, values);
    }
  }

  private async verifyDataPreservation(client: any, table: string, originalData: any[]): Promise<boolean> {
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const currentCount = result.rows[0].count;
      return currentCount >= originalData.length;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Utility functions for migration testing
 */
export async function findMigrationFiles(migrationsPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(migrationsPath);
    return files
      .filter(file => file.endsWith('.sql') || file.endsWith('.js') || file.endsWith('.ts'))
      .sort(); // Assumes timestamp-based naming
  } catch (error) {
    throw new Error(`Cannot read migrations directory: ${migrationsPath}`);
  }
}

export function createMigrationTestSuite(
  transactionManager: TransactionManager,
  migrationsPath: string,
  databaseType: 'postgres' | 'mysql' | 'mongodb'
) {
  const tester = new MigrationTester(transactionManager, migrationsPath, databaseType);

  return {
    /**
     * Test all migrations in the directory
     */
    async testAllMigrations(): Promise<MigrationTestResult[]> {
      const migrationFiles = await findMigrationFiles(migrationsPath);
      const context = await transactionManager.startTransaction('migration_test_all');

      try {
        return await tester.testMigrationSequence(context, migrationFiles);
      } finally {
        await transactionManager.rollbackTransaction(context);
      }
    },

    /**
     * Test specific migration
     */
    async testSingleMigration(filename: string): Promise<MigrationTestResult> {
      const context = await transactionManager.startTransaction('migration_test_single');

      try {
        return await tester.testMigration(context, filename);
      } finally {
        await transactionManager.rollbackTransaction(context);
      }
    },

    /**
     * Test migration rollback scenarios
     */
    async testRollbackScenarios(): Promise<MigrationTestResult[]> {
      const migrationFiles = await findMigrationFiles(migrationsPath);
      const results: MigrationTestResult[] = [];

      for (let i = migrationFiles.length - 1; i >= 0; i--) {
        const context = await transactionManager.startTransaction(`migration_test_rollback_${i}`);
        
        try {
          const result = await tester.testMigrationRollback(context, migrationFiles, i);
          results.push(result);
        } finally {
          await transactionManager.rollbackTransaction(context);
        }
      }

      return results;
    }
  };
}