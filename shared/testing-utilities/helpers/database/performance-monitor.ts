/**
 * Database Performance Monitoring Utilities
 * Provides comprehensive performance tracking and analysis for database operations
 */

import { EventEmitter } from 'events';
import { DatabaseConnectionPool } from './connection-pool';

export interface PerformanceMetrics {
  queryTime: number;
  connectionTime: number;
  rowsAffected: number;
  memoryUsed: number;
  cpuTime: number;
  diskIO: number;
  cacheHitRatio: number;
  lockTime: number;
}

export interface QueryPerformanceData {
  id: string;
  query: string;
  params?: any[];
  startTime: number;
  endTime: number;
  duration: number;
  rowsAffected: number;
  executionPlan?: any;
  databaseType: 'postgres' | 'mysql' | 'mongodb';
  connectionId?: string;
  error?: string;
}

export interface PerformanceThresholds {
  slowQueryTime: number; // milliseconds
  highMemoryUsage: number; // bytes
  maxConcurrentConnections: number;
  lockTimeoutThreshold: number; // milliseconds
  cacheHitRatioMin: number; // percentage (0-1)
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  summary: {
    totalQueries: number;
    slowQueries: number;
    avgQueryTime: number;
    maxQueryTime: number;
    minQueryTime: number;
    totalErrors: number;
    cacheHitRatio: number;
    peakConnections: number;
  };
  slowQueries: QueryPerformanceData[];
  recommendations: string[];
  trends: {
    queryTimeHistory: number[];
    connectionHistory: number[];
    errorRateHistory: number[];
  };
}

export interface DatabaseLoad {
  timestamp: number;
  activeConnections: number;
  queuedQueries: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  queryThroughput: number; // queries per second
}

export class DatabasePerformanceMonitor extends EventEmitter {
  private queries: Map<string, QueryPerformanceData> = new Map();
  private metrics: PerformanceMetrics[] = [];
  private loadHistory: DatabaseLoad[] = [];
  private thresholds: PerformanceThresholds;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timer;
  private pool?: DatabaseConnectionPool;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    super();
    this.thresholds = {
      slowQueryTime: 1000,
      highMemoryUsage: 1024 * 1024 * 100, // 100MB
      maxConcurrentConnections: 100,
      lockTimeoutThreshold: 5000,
      cacheHitRatioMin: 0.8,
      ...thresholds
    };
  }

  /**
   * Start monitoring database performance
   */
  startMonitoring(pool: DatabaseConnectionPool, intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.pool = pool;
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);

    this.emit('monitoringStarted');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emit('monitoringStopped');
  }

  /**
   * Record query performance
   */
  recordQuery(
    query: string,
    params: any[] = [],
    databaseType: 'postgres' | 'mysql' | 'mongodb',
    connectionId?: string
  ): string {
    const queryId = this.generateQueryId();
    const performanceData: QueryPerformanceData = {
      id: queryId,
      query,
      params,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      rowsAffected: 0,
      databaseType,
      connectionId
    };

    this.queries.set(queryId, performanceData);
    return queryId;
  }

  /**
   * Complete query recording
   */
  completeQuery(
    queryId: string,
    rowsAffected: number = 0,
    executionPlan?: any,
    error?: string
  ): void {
    const queryData = this.queries.get(queryId);
    if (!queryData) {
      return;
    }

    queryData.endTime = Date.now();
    queryData.duration = queryData.endTime - queryData.startTime;
    queryData.rowsAffected = rowsAffected;
    queryData.executionPlan = executionPlan;
    queryData.error = error;

    // Check for slow query
    if (queryData.duration > this.thresholds.slowQueryTime) {
      this.emit('slowQuery', queryData);
    }

    // Check for errors
    if (error) {
      this.emit('queryError', queryData);
    }

    this.emit('queryCompleted', queryData);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(periodMinutes: number = 60): PerformanceReport {
    const now = Date.now();
    const periodMs = periodMinutes * 60 * 1000;
    const startTime = now - periodMs;

    const recentQueries = Array.from(this.queries.values())
      .filter(q => q.startTime >= startTime && q.endTime > 0);

    const slowQueries = recentQueries
      .filter(q => q.duration > this.thresholds.slowQueryTime)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const queryTimes = recentQueries.map(q => q.duration);
    const totalQueries = recentQueries.length;
    const avgQueryTime = totalQueries > 0 
      ? queryTimes.reduce((sum, time) => sum + time, 0) / totalQueries 
      : 0;

    const recentLoad = this.loadHistory
      .filter(load => load.timestamp >= startTime);

    const peakConnections = recentLoad.length > 0
      ? Math.max(...recentLoad.map(load => load.activeConnections))
      : 0;

    const recommendations = this.generateRecommendations(recentQueries, recentLoad);

    return {
      period: {
        start: new Date(startTime),
        end: new Date(now),
        duration: periodMs
      },
      summary: {
        totalQueries,
        slowQueries: slowQueries.length,
        avgQueryTime,
        maxQueryTime: totalQueries > 0 ? Math.max(...queryTimes) : 0,
        minQueryTime: totalQueries > 0 ? Math.min(...queryTimes) : 0,
        totalErrors: recentQueries.filter(q => q.error).length,
        cacheHitRatio: this.calculateCacheHitRatio(recentQueries),
        peakConnections
      },
      slowQueries,
      recommendations,
      trends: {
        queryTimeHistory: this.getQueryTimeTrend(recentQueries),
        connectionHistory: recentLoad.map(load => load.activeConnections),
        errorRateHistory: this.getErrorRateTrend(recentQueries)
      }
    };
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(): {
    activeQueries: number;
    queriesPerSecond: number;
    avgResponseTime: number;
    errorRate: number;
    connectionPoolUsage: number;
  } {
    const now = Date.now();
    const lastMinute = now - 60000;
    
    const recentQueries = Array.from(this.queries.values())
      .filter(q => q.startTime >= lastMinute);

    const activeQueries = recentQueries.filter(q => q.endTime === 0).length;
    const completedQueries = recentQueries.filter(q => q.endTime > 0);
    const queriesPerSecond = completedQueries.length / 60;
    
    const avgResponseTime = completedQueries.length > 0
      ? completedQueries.reduce((sum, q) => sum + q.duration, 0) / completedQueries.length
      : 0;

    const errorRate = completedQueries.length > 0
      ? completedQueries.filter(q => q.error).length / completedQueries.length
      : 0;

    const poolStats = this.pool?.getStats();
    const connectionPoolUsage = poolStats 
      ? poolStats.active / (poolStats.active + poolStats.idle)
      : 0;

    return {
      activeQueries,
      queriesPerSecond,
      avgResponseTime,
      errorRate,
      connectionPoolUsage
    };
  }

  /**
   * Get query patterns analysis
   */
  getQueryPatterns(periodMinutes: number = 60): {
    topQueries: Array<{ query: string; count: number; avgTime: number }>;
    topTables: Array<{ table: string; operations: number }>;
    queryTypes: Record<string, number>;
  } {
    const now = Date.now();
    const periodMs = periodMinutes * 60 * 1000;
    const startTime = now - periodMs;

    const recentQueries = Array.from(this.queries.values())
      .filter(q => q.startTime >= startTime && q.endTime > 0);

    // Normalize queries for pattern analysis
    const queryPatterns = new Map<string, { count: number; totalTime: number }>();
    const tableOperations = new Map<string, number>();
    const queryTypes = { SELECT: 0, INSERT: 0, UPDATE: 0, DELETE: 0, OTHER: 0 };

    for (const query of recentQueries) {
      // Normalize query by removing specific values
      const normalizedQuery = this.normalizeQuery(query.query);
      
      if (!queryPatterns.has(normalizedQuery)) {
        queryPatterns.set(normalizedQuery, { count: 0, totalTime: 0 });
      }
      
      const pattern = queryPatterns.get(normalizedQuery)!;
      pattern.count++;
      pattern.totalTime += query.duration;

      // Extract table names
      const tables = this.extractTableNames(query.query);
      tables.forEach(table => {
        tableOperations.set(table, (tableOperations.get(table) || 0) + 1);
      });

      // Categorize query type
      const queryType = this.getQueryType(query.query);
      queryTypes[queryType]++;
    }

    const topQueries = Array.from(queryPatterns.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topTables = Array.from(tableOperations.entries())
      .map(([table, operations]) => ({ table, operations }))
      .sort((a, b) => b.operations - a.operations)
      .slice(0, 10);

    return { topQueries, topTables, queryTypes };
  }

  /**
   * Set up automated alerts
   */
  setupAlerts(): void {
    this.on('slowQuery', (query: QueryPerformanceData) => {
      console.warn(`🐌 Slow query detected: ${query.duration}ms`, {
        query: query.query.substring(0, 100),
        duration: query.duration
      });
    });

    this.on('queryError', (query: QueryPerformanceData) => {
      console.error(`❌ Query error:`, {
        query: query.query.substring(0, 100),
        error: query.error
      });
    });

    // Monitor connection pool
    setInterval(() => {
      if (this.pool) {
        const stats = this.pool.getStats();
        const usageRatio = stats.active / (stats.active + stats.idle);
        
        if (usageRatio > 0.9) {
          this.emit('highConnectionUsage', stats);
          console.warn(`⚠️ High connection pool usage: ${Math.round(usageRatio * 100)}%`);
        }
      }
    }, 10000);
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      queries: Array.from(this.queries.values()),
      metrics: this.metrics,
      loadHistory: this.loadHistory,
      thresholds: this.thresholds
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for queries
      const headers = ['id', 'query', 'duration', 'rowsAffected', 'startTime', 'error'];
      const rows = data.queries.map(q => [
        q.id,
        q.query.replace(/,/g, ';'), // Escape commas
        q.duration,
        q.rowsAffected,
        new Date(q.startTime).toISOString(),
        q.error || ''
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
  }

  /**
   * Clear old data
   */
  clearOldData(olderThanHours: number = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    // Clear old queries
    for (const [id, query] of this.queries.entries()) {
      if (query.startTime < cutoff) {
        this.queries.delete(id);
      }
    }

    // Clear old load history
    this.loadHistory = this.loadHistory.filter(load => load.timestamp >= cutoff);
    
    // Clear old metrics
    this.metrics = this.metrics.filter((_, index) => {
      // Keep last 1000 metrics regardless of age
      return this.metrics.length - index <= 1000;
    });
  }

  /**
   * Private helper methods
   */
  private async collectMetrics(): Promise<void> {
    if (!this.pool) return;

    try {
      const poolStats = this.pool.getStats();
      const poolMetrics = this.pool.getMetrics();

      const load: DatabaseLoad = {
        timestamp: Date.now(),
        activeConnections: poolStats.active,
        queuedQueries: poolStats.pending,
        cpuUsage: process.cpuUsage().user / 1000, // Convert to ms
        memoryUsage: process.memoryUsage().heapUsed,
        diskUsage: 0, // Would need OS-specific implementation
        queryThroughput: this.calculateQueryThroughput()
      };

      this.loadHistory.push(load);

      // Keep only last hour of load history
      const hourAgo = Date.now() - (60 * 60 * 1000);
      this.loadHistory = this.loadHistory.filter(l => l.timestamp >= hourAgo);

      // Check thresholds
      this.checkThresholds(load, poolStats);

    } catch (error) {
      this.emit('monitoringError', error);
    }
  }

  private calculateQueryThroughput(): number {
    const now = Date.now();
    const lastSecond = now - 1000;
    
    const recentQueries = Array.from(this.queries.values())
      .filter(q => q.endTime >= lastSecond && q.endTime > 0);

    return recentQueries.length;
  }

  private checkThresholds(load: DatabaseLoad, poolStats: any): void {
    if (load.activeConnections > this.thresholds.maxConcurrentConnections) {
      this.emit('highConnectionCount', load);
    }

    if (load.memoryUsage > this.thresholds.highMemoryUsage) {
      this.emit('highMemoryUsage', load);
    }
  }

  private generateRecommendations(
    queries: QueryPerformanceData[],
    loadHistory: DatabaseLoad[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze slow queries
    const slowQueries = queries.filter(q => q.duration > this.thresholds.slowQueryTime);
    if (slowQueries.length > queries.length * 0.1) {
      recommendations.push('Consider optimizing queries - more than 10% are slow');
    }

    // Analyze error rate
    const errorRate = queries.filter(q => q.error).length / queries.length;
    if (errorRate > 0.05) {
      recommendations.push('High error rate detected - investigate query failures');
    }

    // Analyze connection usage
    const avgConnections = loadHistory.length > 0
      ? loadHistory.reduce((sum, load) => sum + load.activeConnections, 0) / loadHistory.length
      : 0;
    
    if (avgConnections > this.thresholds.maxConcurrentConnections * 0.8) {
      recommendations.push('Connection pool usage is high - consider increasing pool size');
    }

    // Analyze query patterns
    const patterns = this.getQueryPatterns();
    if (patterns.topQueries.some(q => q.avgTime > this.thresholds.slowQueryTime)) {
      recommendations.push('Frequently executed queries are slow - consider adding indexes');
    }

    return recommendations;
  }

  private calculateCacheHitRatio(queries: QueryPerformanceData[]): number {
    // This would need database-specific implementation
    // For now, return a placeholder
    return 0.85;
  }

  private getQueryTimeTrend(queries: QueryPerformanceData[]): number[] {
    // Group by time buckets and calculate average
    const buckets = new Map<number, number[]>();
    const bucketSize = 5 * 60 * 1000; // 5 minutes

    for (const query of queries) {
      const bucket = Math.floor(query.startTime / bucketSize) * bucketSize;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, []);
      }
      buckets.get(bucket)!.push(query.duration);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([, times]) => times.reduce((sum, time) => sum + time, 0) / times.length);
  }

  private getErrorRateTrend(queries: QueryPerformanceData[]): number[] {
    // Similar to query time trend but for error rates
    const buckets = new Map<number, { total: number; errors: number }>();
    const bucketSize = 5 * 60 * 1000;

    for (const query of queries) {
      const bucket = Math.floor(query.startTime / bucketSize) * bucketSize;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { total: 0, errors: 0 });
      }
      const bucketData = buckets.get(bucket)!;
      bucketData.total++;
      if (query.error) bucketData.errors++;
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([, data]) => data.total > 0 ? data.errors / data.total : 0);
  }

  private normalizeQuery(query: string): string {
    return query
      .replace(/\$\d+|\?/g, '?') // Replace parameters
      .replace(/\d+/g, 'N') // Replace numbers
      .replace(/'[^']*'/g, "'S'") // Replace strings
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toUpperCase();
  }

  private extractTableNames(query: string): string[] {
    const tables: string[] = [];
    const regex = /(?:FROM|JOIN|INTO|UPDATE)\s+([`"']?)(\w+)\1/gi;
    let match;

    while ((match = regex.exec(query)) !== null) {
      tables.push(match[2]);
    }

    return Array.from(new Set(tables));
  }

  private getQueryType(query: string): keyof typeof this.getQueryPatterns {
    const trimmed = query.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Wrapper function for monitoring database operations
 */
export function withPerformanceMonitoring<T>(
  monitor: DatabasePerformanceMonitor,
  operation: (queryId: string) => Promise<T>,
  query: string,
  params: any[] = [],
  databaseType: 'postgres' | 'mysql' | 'mongodb'
): Promise<T> {
  const queryId = monitor.recordQuery(query, params, databaseType);

  return operation(queryId)
    .then(result => {
      monitor.completeQuery(queryId, Array.isArray(result) ? result.length : 1);
      return result;
    })
    .catch(error => {
      monitor.completeQuery(queryId, 0, undefined, error.message);
      throw error;
    });
}

/**
 * Performance monitoring middleware for different database clients
 */
export class PerformanceMiddleware {
  static forPostgres(monitor: DatabasePerformanceMonitor) {
    return {
      before: (query: string, params?: any[]) => {
        return monitor.recordQuery(query, params, 'postgres');
      },
      after: (queryId: string, result: any, error?: Error) => {
        const rowCount = result?.rowCount || result?.rows?.length || 0;
        monitor.completeQuery(queryId, rowCount, undefined, error?.message);
      }
    };
  }

  static forMySQL(monitor: DatabasePerformanceMonitor) {
    return {
      before: (query: string, params?: any[]) => {
        return monitor.recordQuery(query, params, 'mysql');
      },
      after: (queryId: string, result: any, error?: Error) => {
        const rowCount = result?.affectedRows || result?.length || 0;
        monitor.completeQuery(queryId, rowCount, undefined, error?.message);
      }
    };
  }

  static forMongoDB(monitor: DatabasePerformanceMonitor) {
    return {
      before: (operation: string, collection: string, filter?: any) => {
        const query = `${operation} on ${collection}`;
        return monitor.recordQuery(query, [filter], 'mongodb');
      },
      after: (queryId: string, result: any, error?: Error) => {
        const count = result?.insertedCount || result?.modifiedCount || 
                     result?.deletedCount || (Array.isArray(result) ? result.length : 1);
        monitor.completeQuery(queryId, count, undefined, error?.message);
      }
    };
  }
}