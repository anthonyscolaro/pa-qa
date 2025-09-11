/**
 * Database Transaction Testing Helpers
 * Provides transaction isolation and rollback mechanisms for test cases
 */

import { Pool, PoolClient, Client } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient, ClientSession } from 'mongodb';

export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

export interface TransactionContext {
  id: string;
  startTime: number;
  client?: any;
  session?: ClientSession;
  isActive: boolean;
  savepoints: string[];
}

export class TransactionManager {
  private connections: Map<string, any> = new Map();
  private activeTransactions: Map<string, TransactionContext> = new Map();
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Start a new transaction for testing
   */
  async startTransaction(testId: string): Promise<TransactionContext> {
    const transactionId = `${testId}_${Date.now()}`;
    const context: TransactionContext = {
      id: transactionId,
      startTime: Date.now(),
      isActive: true,
      savepoints: []
    };

    try {
      switch (this.config.type) {
        case 'postgres':
          context.client = await this.startPostgresTransaction(context);
          break;
        case 'mysql':
          context.client = await this.startMysqlTransaction(context);
          break;
        case 'mongodb':
          context.session = await this.startMongoTransaction(context);
          break;
        default:
          throw new Error(`Unsupported database type: ${this.config.type}`);
      }

      this.activeTransactions.set(transactionId, context);
      return context;
    } catch (error) {
      throw new Error(`Failed to start transaction: ${error.message}`);
    }
  }

  /**
   * Create a savepoint within a transaction
   */
  async createSavepoint(context: TransactionContext, name: string): Promise<void> {
    if (!context.isActive) {
      throw new Error('Transaction is not active');
    }

    try {
      switch (this.config.type) {
        case 'postgres':
          await context.client.query(`SAVEPOINT ${name}`);
          break;
        case 'mysql':
          await context.client.query(`SAVEPOINT ${name}`);
          break;
        case 'mongodb':
          // MongoDB doesn't support savepoints, but we can track state
          context.savepoints.push(name);
          break;
      }
      
      context.savepoints.push(name);
    } catch (error) {
      throw new Error(`Failed to create savepoint ${name}: ${error.message}`);
    }
  }

  /**
   * Rollback to a savepoint
   */
  async rollbackToSavepoint(context: TransactionContext, name: string): Promise<void> {
    if (!context.isActive) {
      throw new Error('Transaction is not active');
    }

    const savepointIndex = context.savepoints.indexOf(name);
    if (savepointIndex === -1) {
      throw new Error(`Savepoint ${name} not found`);
    }

    try {
      switch (this.config.type) {
        case 'postgres':
          await context.client.query(`ROLLBACK TO SAVEPOINT ${name}`);
          break;
        case 'mysql':
          await context.client.query(`ROLLBACK TO SAVEPOINT ${name}`);
          break;
        case 'mongodb':
          // For MongoDB, abort and restart transaction
          await context.session.abortTransaction();
          await context.session.startTransaction();
          break;
      }

      // Remove savepoints after the rollback point
      context.savepoints = context.savepoints.slice(0, savepointIndex + 1);
    } catch (error) {
      throw new Error(`Failed to rollback to savepoint ${name}: ${error.message}`);
    }
  }

  /**
   * Rollback and end transaction
   */
  async rollbackTransaction(context: TransactionContext): Promise<void> {
    if (!context.isActive) {
      return; // Already rolled back
    }

    try {
      switch (this.config.type) {
        case 'postgres':
          await context.client.query('ROLLBACK');
          context.client.release();
          break;
        case 'mysql':
          await context.client.rollback();
          await context.client.end();
          break;
        case 'mongodb':
          await context.session.abortTransaction();
          await context.session.endSession();
          break;
      }

      context.isActive = false;
      this.activeTransactions.delete(context.id);
    } catch (error) {
      console.error(`Error rolling back transaction ${context.id}:`, error);
      // Force cleanup even if rollback fails
      context.isActive = false;
      this.activeTransactions.delete(context.id);
    }
  }

  /**
   * Commit transaction (rarely used in testing)
   */
  async commitTransaction(context: TransactionContext): Promise<void> {
    if (!context.isActive) {
      throw new Error('Transaction is not active');
    }

    try {
      switch (this.config.type) {
        case 'postgres':
          await context.client.query('COMMIT');
          context.client.release();
          break;
        case 'mysql':
          await context.client.commit();
          await context.client.end();
          break;
        case 'mongodb':
          await context.session.commitTransaction();
          await context.session.endSession();
          break;
      }

      context.isActive = false;
      this.activeTransactions.delete(context.id);
    } catch (error) {
      throw new Error(`Failed to commit transaction: ${error.message}`);
    }
  }

  /**
   * Get client/session for executing queries within transaction
   */
  getTransactionClient(context: TransactionContext): any {
    if (!context.isActive) {
      throw new Error('Transaction is not active');
    }

    return this.config.type === 'mongodb' ? context.session : context.client;
  }

  /**
   * Cleanup all active transactions (for test teardown)
   */
  async cleanupAllTransactions(): Promise<void> {
    const cleanupPromises = Array.from(this.activeTransactions.values())
      .map(context => this.rollbackTransaction(context));

    await Promise.allSettled(cleanupPromises);
    this.activeTransactions.clear();
  }

  /**
   * Private methods for database-specific transaction handling
   */
  private async startPostgresTransaction(context: TransactionContext): Promise<PoolClient> {
    let pool = this.connections.get('postgres');
    if (!pool) {
      pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl
      });
      this.connections.set('postgres', pool);
    }

    const client = await pool.connect();
    await client.query('BEGIN');
    return client;
  }

  private async startMysqlTransaction(context: TransactionContext): Promise<mysql.Connection> {
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl
    });

    await connection.beginTransaction();
    return connection;
  }

  private async startMongoTransaction(context: TransactionContext): Promise<ClientSession> {
    let client = this.connections.get('mongodb');
    if (!client) {
      const uri = `mongodb://${this.config.host}:${this.config.port}/${this.config.database}`;
      client = new MongoClient(uri);
      await client.connect();
      this.connections.set('mongodb', client);
    }

    const session = client.startSession();
    session.startTransaction();
    return session;
  }

  /**
   * Close all database connections
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = [];

    for (const [type, connection] of this.connections.entries()) {
      if (type === 'postgres') {
        closePromises.push(connection.end());
      } else if (type === 'mysql') {
        closePromises.push(connection.end());
      } else if (type === 'mongodb') {
        closePromises.push(connection.close());
      }
    }

    await Promise.allSettled(closePromises);
    this.connections.clear();
  }
}

/**
 * Decorator for automatic transaction management in tests
 */
export function withTransaction(config: DatabaseConfig) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const transactionManager = new TransactionManager(config);

    descriptor.value = async function (...args: any[]) {
      const testId = `${target.constructor.name}_${propertyName}`;
      const context = await transactionManager.startTransaction(testId);

      try {
        // Pass transaction context as first argument
        const result = await method.apply(this, [context, ...args]);
        return result;
      } finally {
        await transactionManager.rollbackTransaction(context);
      }
    };

    return descriptor;
  };
}

/**
 * Utility function for wrapping test functions with transactions
 */
export async function runInTransaction<T>(
  config: DatabaseConfig,
  testFn: (context: TransactionContext) => Promise<T>,
  testId: string = 'anonymous'
): Promise<T> {
  const transactionManager = new TransactionManager(config);
  const context = await transactionManager.startTransaction(testId);

  try {
    const result = await testFn(context);
    return result;
  } finally {
    await transactionManager.rollbackTransaction(context);
    await transactionManager.closeAllConnections();
  }
}

/**
 * Global transaction manager instance for sharing across tests
 */
let globalTransactionManager: TransactionManager | null = null;

export function getGlobalTransactionManager(config?: DatabaseConfig): TransactionManager {
  if (!globalTransactionManager && config) {
    globalTransactionManager = new TransactionManager(config);
  }
  
  if (!globalTransactionManager) {
    throw new Error('Global transaction manager not initialized. Provide config on first call.');
  }

  return globalTransactionManager;
}

export async function setupGlobalTransactions(config: DatabaseConfig): Promise<void> {
  globalTransactionManager = new TransactionManager(config);
}

export async function teardownGlobalTransactions(): Promise<void> {
  if (globalTransactionManager) {
    await globalTransactionManager.cleanupAllTransactions();
    await globalTransactionManager.closeAllConnections();
    globalTransactionManager = null;
  }
}