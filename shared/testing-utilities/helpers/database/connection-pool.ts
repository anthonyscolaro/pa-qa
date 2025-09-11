/**
 * Database Connection Pool Management for Testing
 * Provides efficient connection pooling and management for test suites
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient, MongoClientOptions } from 'mongodb';
import { EventEmitter } from 'events';

export interface PoolConfiguration {
  type: 'postgres' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  
  // Pool-specific settings
  min?: number;
  max?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
  
  // Test-specific settings
  testOnBorrow?: boolean;
  testOnReturn?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface ConnectionStats {
  total: number;
  idle: number;
  active: number;
  pending: number;
  created: number;
  destroyed: number;
  borrowed: number;
  returned: number;
  failed: number;
}

export interface ConnectionMetrics {
  connectionTime: number[];
  queryTime: number[];
  errors: string[];
  lastActivity: number;
}

export class DatabaseConnectionPool extends EventEmitter {
  private config: PoolConfiguration;
  private pool: any;
  private isInitialized: boolean = false;
  private stats: ConnectionStats;
  private metrics: ConnectionMetrics;
  private healthCheckInterval?: NodeJS.Timer;

  constructor(config: PoolConfiguration) {
    super();
    this.config = {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      testOnBorrow: true,
      testOnReturn: false,
      maxRetries: 3,
      retryDelayMs: 1000,
      ...config
    };

    this.stats = {
      total: 0,
      idle: 0,
      active: 0,
      pending: 0,
      created: 0,
      destroyed: 0,
      borrowed: 0,
      returned: 0,
      failed: 0
    };

    this.metrics = {
      connectionTime: [],
      queryTime: [],
      errors: [],
      lastActivity: Date.now()
    };
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      switch (this.config.type) {
        case 'postgres':
          await this.initializePostgresPool();
          break;
        case 'mysql':
          await this.initializeMysqlPool();
          break;
        case 'mongodb':
          await this.initializeMongoPool();
          break;
        default:
          throw new Error(`Unsupported database type: ${this.config.type}`);
      }

      this.isInitialized = true;
      this.startHealthCheck();
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to initialize connection pool: ${error.message}`);
    }
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let retries = 0;

    while (retries < this.config.maxRetries!) {
      try {
        this.stats.pending++;
        const connection = await this.acquireConnection();
        
        this.stats.pending--;
        this.stats.borrowed++;
        this.stats.active++;
        this.metrics.connectionTime.push(Date.now() - startTime);
        this.metrics.lastActivity = Date.now();

        // Wrap connection with monitoring
        return this.wrapConnection(connection);
      } catch (error) {
        this.stats.pending--;
        this.stats.failed++;
        this.metrics.errors.push(error.message);
        
        if (retries === this.config.maxRetries! - 1) {
          this.emit('connectionError', error);
          throw error;
        }

        retries++;
        await this.delay(this.config.retryDelayMs!);
      }
    }
  }

  /**
   * Return a connection to the pool
   */
  async releaseConnection(connection: any): Promise<void> {
    try {
      if (this.config.testOnReturn) {
        await this.testConnection(connection);
      }

      await this.returnConnection(connection);
      
      this.stats.returned++;
      this.stats.active--;
      this.stats.idle++;
      this.metrics.lastActivity = Date.now();
    } catch (error) {
      this.stats.failed++;
      this.metrics.errors.push(error.message);
      await this.destroyConnection(connection);
      this.emit('connectionError', error);
    }
  }

  /**
   * Execute a query with automatic connection management
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const connection = await this.getConnection();
    const startTime = Date.now();

    try {
      const result = await this.executeQuery(connection, sql, params);
      this.metrics.queryTime.push(Date.now() - startTime);
      return result;
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    queries: Array<{ sql: string; params?: any[] }>,
    callback?: (connection: any) => Promise<T>
  ): Promise<T | any[]> {
    const connection = await this.getConnection();

    try {
      await this.beginTransaction(connection);

      if (callback) {
        const result = await callback(connection);
        await this.commitTransaction(connection);
        return result;
      } else {
        const results = [];
        for (const query of queries) {
          const result = await this.executeQuery(connection, query.sql, query.params);
          results.push(result);
        }
        await this.commitTransaction(connection);
        return results;
      }
    } catch (error) {
      await this.rollbackTransaction(connection);
      throw error;
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ConnectionMetrics & {
    avgConnectionTime: number;
    avgQueryTime: number;
    errorRate: number;
  } {
    const avgConnectionTime = this.metrics.connectionTime.length > 0
      ? this.metrics.connectionTime.reduce((a, b) => a + b, 0) / this.metrics.connectionTime.length
      : 0;

    const avgQueryTime = this.metrics.queryTime.length > 0
      ? this.metrics.queryTime.reduce((a, b) => a + b, 0) / this.metrics.queryTime.length
      : 0;

    const totalConnections = this.stats.borrowed + this.stats.failed;
    const errorRate = totalConnections > 0 ? this.stats.failed / totalConnections : 0;

    return {
      ...this.metrics,
      avgConnectionTime,
      avgQueryTime,
      errorRate
    };
  }

  /**
   * Health check for the pool
   */
  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      const isHealthy = await this.testConnection(connection);
      await this.releaseConnection(connection);
      return isHealthy;
    } catch (error) {
      this.emit('healthCheckFailed', error);
      return false;
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.pool) {
      try {
        await this.closePool();
        this.emit('closed');
      } catch (error) {
        this.emit('error', error);
        throw error;
      }
    }

    this.isInitialized = false;
  }

  /**
   * Drain and refill the pool (useful for test isolation)
   */
  async drain(): Promise<void> {
    try {
      await this.drainPool();
      this.stats.destroyed += this.stats.idle + this.stats.active;
      this.stats.idle = 0;
      this.stats.active = 0;
      this.emit('drained');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Database-specific initialization methods
   */
  private async initializePostgresPool(): Promise<void> {
    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      min: this.config.min,
      max: this.config.max,
      acquireTimeoutMillis: this.config.acquireTimeoutMillis,
      createTimeoutMillis: this.config.createTimeoutMillis,
      destroyTimeoutMillis: this.config.destroyTimeoutMillis,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      reapIntervalMillis: this.config.reapIntervalMillis,
      createRetryIntervalMillis: this.config.createRetryIntervalMillis
    };

    this.pool = new Pool(poolConfig);

    this.pool.on('connect', () => {
      this.stats.created++;
      this.stats.total++;
      this.stats.idle++;
    });

    this.pool.on('remove', () => {
      this.stats.destroyed++;
      this.stats.total--;
    });

    this.pool.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  private async initializeMysqlPool(): Promise<void> {
    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      connectionLimit: this.config.max,
      acquireTimeout: this.config.acquireTimeoutMillis,
      timeout: this.config.createTimeoutMillis,
      idleTimeout: this.config.idleTimeoutMillis
    });
  }

  private async initializeMongoPool(): Promise<void> {
    const uri = `mongodb://${this.config.username ? `${this.config.username}:${this.config.password}@` : ''}${this.config.host}:${this.config.port}/${this.config.database}`;
    
    const options: MongoClientOptions = {
      minPoolSize: this.config.min,
      maxPoolSize: this.config.max,
      maxIdleTimeMS: this.config.idleTimeoutMillis,
      serverSelectionTimeoutMS: this.config.acquireTimeoutMillis
    };

    this.pool = new MongoClient(uri, options);
    await this.pool.connect();
  }

  private async acquireConnection(): Promise<any> {
    switch (this.config.type) {
      case 'postgres':
        return await this.pool.connect();
      case 'mysql':
        return await this.pool.getConnection();
      case 'mongodb':
        return this.pool.db(this.config.database);
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  private async returnConnection(connection: any): Promise<void> {
    switch (this.config.type) {
      case 'postgres':
        connection.release();
        break;
      case 'mysql':
        connection.release();
        break;
      case 'mongodb':
        // MongoDB connections are managed automatically
        break;
    }
  }

  private async destroyConnection(connection: any): Promise<void> {
    try {
      switch (this.config.type) {
        case 'postgres':
          connection.release(true);
          break;
        case 'mysql':
          connection.destroy();
          break;
        case 'mongodb':
          // MongoDB connections are managed automatically
          break;
      }
      this.stats.destroyed++;
    } catch (error) {
      // Ignore destruction errors
    }
  }

  private async testConnection(connection: any): Promise<boolean> {
    try {
      switch (this.config.type) {
        case 'postgres':
          await connection.query('SELECT 1');
          break;
        case 'mysql':
          await connection.query('SELECT 1');
          break;
        case 'mongodb':
          await connection.admin().ping();
          break;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private wrapConnection(connection: any): any {
    if (this.config.type === 'mongodb') {
      return connection; // MongoDB doesn't need wrapping
    }

    // Wrap query method to track metrics
    const originalQuery = connection.query.bind(connection);
    connection.query = async (...args: any[]) => {
      const startTime = Date.now();
      try {
        const result = await originalQuery(...args);
        this.metrics.queryTime.push(Date.now() - startTime);
        return result;
      } catch (error) {
        this.metrics.errors.push(error.message);
        throw error;
      }
    };

    return connection;
  }

  private async executeQuery(connection: any, sql: string, params?: any[]): Promise<any> {
    switch (this.config.type) {
      case 'postgres':
        const pgResult = await connection.query(sql, params);
        return pgResult.rows;
      case 'mysql':
        const [mysqlResult] = await connection.query(sql, params);
        return mysqlResult;
      case 'mongodb':
        // For MongoDB, sql would be a collection name and params would be the operation
        throw new Error('Direct SQL queries not supported for MongoDB. Use specific MongoDB operations.');
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  private async beginTransaction(connection: any): Promise<void> {
    switch (this.config.type) {
      case 'postgres':
        await connection.query('BEGIN');
        break;
      case 'mysql':
        await connection.beginTransaction();
        break;
      case 'mongodb':
        // MongoDB transactions require sessions
        throw new Error('Use MongoDB session-based transactions');
    }
  }

  private async commitTransaction(connection: any): Promise<void> {
    switch (this.config.type) {
      case 'postgres':
        await connection.query('COMMIT');
        break;
      case 'mysql':
        await connection.commit();
        break;
      case 'mongodb':
        throw new Error('Use MongoDB session-based transactions');
    }
  }

  private async rollbackTransaction(connection: any): Promise<void> {
    switch (this.config.type) {
      case 'postgres':
        await connection.query('ROLLBACK');
        break;
      case 'mysql':
        await connection.rollback();
        break;
      case 'mongodb':
        throw new Error('Use MongoDB session-based transactions');
    }
  }

  private async closePool(): Promise<void> {
    switch (this.config.type) {
      case 'postgres':
        await this.pool.end();
        break;
      case 'mysql':
        await this.pool.end();
        break;
      case 'mongodb':
        await this.pool.close();
        break;
    }
  }

  private async drainPool(): Promise<void> {
    // Implementation depends on the underlying pool
    // This is a simplified version
    await this.closePool();
    await this.initialize();
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        this.emit('unhealthy');
      }
    }, 30000); // Check every 30 seconds
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Pool Manager for managing multiple database pools
 */
export class PoolManager {
  private pools: Map<string, DatabaseConnectionPool> = new Map();
  private defaultPoolName: string | null = null;

  /**
   * Create a new pool
   */
  createPool(name: string, config: PoolConfiguration): DatabaseConnectionPool {
    if (this.pools.has(name)) {
      throw new Error(`Pool with name ${name} already exists`);
    }

    const pool = new DatabaseConnectionPool(config);
    this.pools.set(name, pool);

    if (!this.defaultPoolName) {
      this.defaultPoolName = name;
    }

    return pool;
  }

  /**
   * Get a pool by name
   */
  getPool(name?: string): DatabaseConnectionPool {
    const poolName = name || this.defaultPoolName;
    if (!poolName) {
      throw new Error('No pool name provided and no default pool set');
    }

    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    return pool;
  }

  /**
   * Initialize all pools
   */
  async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.pools.values()).map(pool => pool.initialize());
    await Promise.all(initPromises);
  }

  /**
   * Close all pools
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.pools.values()).map(pool => pool.close());
    await Promise.all(closePromises);
    this.pools.clear();
    this.defaultPoolName = null;
  }

  /**
   * Get stats for all pools
   */
  getAllStats(): Map<string, ConnectionStats> {
    const stats = new Map<string, ConnectionStats>();
    for (const [name, pool] of this.pools) {
      stats.set(name, pool.getStats());
    }
    return stats;
  }

  /**
   * Health check for all pools
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const [name, pool] of this.pools) {
      try {
        const isHealthy = await pool.healthCheck();
        results.set(name, isHealthy);
      } catch (error) {
        results.set(name, false);
      }
    }

    return results;
  }
}

/**
 * Global pool manager instance
 */
export const globalPoolManager = new PoolManager();

/**
 * Utility functions
 */
export function createTestPool(config: PoolConfiguration): DatabaseConnectionPool {
  return new DatabaseConnectionPool({
    ...config,
    min: 1,
    max: 5,
    testOnBorrow: true,
    testOnReturn: true
  });
}

export async function withConnection<T>(
  pool: DatabaseConnectionPool,
  callback: (connection: any) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    return await callback(connection);
  } finally {
    await pool.releaseConnection(connection);
  }
}