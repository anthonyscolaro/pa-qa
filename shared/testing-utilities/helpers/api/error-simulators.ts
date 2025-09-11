/**
 * Network and API Error Simulation Utilities
 * 
 * Comprehensive utilities for simulating various network conditions,
 * API failures, and error scenarios for robust testing.
 */

import { EventEmitter } from 'events';

export interface NetworkCondition {
  name: string;
  latency: { min: number; max: number }; // milliseconds
  bandwidth: number; // bytes per second
  packetLoss: number; // percentage (0-100)
  jitter: number; // milliseconds
  connectionDropRate: number; // percentage (0-100)
}

export interface ErrorScenario {
  name: string;
  description: string;
  probability: number; // 0-1
  errorType: 'network' | 'timeout' | 'server' | 'client' | 'custom';
  statusCode?: number;
  delay?: number;
  message?: string;
  retryable?: boolean;
  customError?: Error;
}

export interface SimulationConfig {
  enabled: boolean;
  scenarios: ErrorScenario[];
  networkCondition?: NetworkCondition;
  globalErrorRate?: number; // 0-1
  logErrors?: boolean;
  retryConfig?: {
    maxRetries: number;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
    baseDelay: number;
  };
}

export interface ErrorLog {
  timestamp: Date;
  scenario: string;
  errorType: string;
  statusCode?: number;
  url: string;
  method: string;
  attempt: number;
  duration: number;
}

export interface SimulationStats {
  totalRequests: number;
  simulatedErrors: number;
  networkErrors: number;
  timeouts: number;
  serverErrors: number;
  clientErrors: number;
  retriedRequests: number;
  averageLatency: number;
  errorRate: number;
}

/**
 * Predefined network conditions
 */
export const NetworkConditions: Record<string, NetworkCondition> = {
  PERFECT: {
    name: 'Perfect Connection',
    latency: { min: 1, max: 5 },
    bandwidth: 1024 * 1024 * 100, // 100 MB/s
    packetLoss: 0,
    jitter: 0,
    connectionDropRate: 0,
  },
  
  WIFI: {
    name: 'Good WiFi',
    latency: { min: 10, max: 50 },
    bandwidth: 1024 * 1024 * 50, // 50 MB/s
    packetLoss: 0.1,
    jitter: 5,
    connectionDropRate: 0.01,
  },
  
  MOBILE_4G: {
    name: '4G Mobile',
    latency: { min: 20, max: 100 },
    bandwidth: 1024 * 1024 * 25, // 25 MB/s
    packetLoss: 0.5,
    jitter: 15,
    connectionDropRate: 0.1,
  },
  
  MOBILE_3G: {
    name: '3G Mobile',
    latency: { min: 100, max: 300 },
    bandwidth: 1024 * 384, // 384 KB/s
    packetLoss: 1,
    jitter: 50,
    connectionDropRate: 0.5,
  },
  
  MOBILE_2G: {
    name: '2G Mobile',
    latency: { min: 300, max: 1000 },
    bandwidth: 1024 * 64, // 64 KB/s
    packetLoss: 2,
    jitter: 100,
    connectionDropRate: 1,
  },
  
  SATELLITE: {
    name: 'Satellite Connection',
    latency: { min: 500, max: 800 },
    bandwidth: 1024 * 1024 * 5, // 5 MB/s
    packetLoss: 0.5,
    jitter: 200,
    connectionDropRate: 0.2,
  },
  
  FLAKY_WIFI: {
    name: 'Unstable WiFi',
    latency: { min: 50, max: 500 },
    bandwidth: 1024 * 1024 * 10, // 10 MB/s
    packetLoss: 5,
    jitter: 200,
    connectionDropRate: 2,
  },
  
  DIAL_UP: {
    name: 'Dial-up Connection',
    latency: { min: 100, max: 400 },
    bandwidth: 1024 * 56 / 8, // 56K modem
    packetLoss: 1,
    jitter: 50,
    connectionDropRate: 0.5,
  },
};

/**
 * Predefined error scenarios
 */
export const ErrorScenarios: Record<string, ErrorScenario> = {
  NETWORK_ERROR: {
    name: 'Network Error',
    description: 'Connection failed due to network issues',
    probability: 0.05,
    errorType: 'network',
    retryable: true,
    customError: new Error('Network error: Connection failed'),
  },
  
  TIMEOUT: {
    name: 'Request Timeout',
    description: 'Request timed out',
    probability: 0.03,
    errorType: 'timeout',
    delay: 30000,
    retryable: true,
    customError: new Error('Request timeout'),
  },
  
  SERVER_ERROR_500: {
    name: 'Internal Server Error',
    description: 'Server encountered an internal error',
    probability: 0.02,
    errorType: 'server',
    statusCode: 500,
    message: 'Internal server error occurred',
    retryable: true,
  },
  
  SERVER_ERROR_502: {
    name: 'Bad Gateway',
    description: 'Bad gateway error',
    probability: 0.015,
    errorType: 'server',
    statusCode: 502,
    message: 'Bad gateway',
    retryable: true,
  },
  
  SERVER_ERROR_503: {
    name: 'Service Unavailable',
    description: 'Service temporarily unavailable',
    probability: 0.01,
    errorType: 'server',
    statusCode: 503,
    message: 'Service unavailable',
    retryable: true,
  },
  
  CLIENT_ERROR_400: {
    name: 'Bad Request',
    description: 'Client sent invalid request',
    probability: 0.005,
    errorType: 'client',
    statusCode: 400,
    message: 'Bad request',
    retryable: false,
  },
  
  CLIENT_ERROR_401: {
    name: 'Unauthorized',
    description: 'Authentication required',
    probability: 0.008,
    errorType: 'client',
    statusCode: 401,
    message: 'Unauthorized access',
    retryable: false,
  },
  
  CLIENT_ERROR_403: {
    name: 'Forbidden',
    description: 'Access forbidden',
    probability: 0.003,
    errorType: 'client',
    statusCode: 403,
    message: 'Forbidden',
    retryable: false,
  },
  
  CLIENT_ERROR_404: {
    name: 'Not Found',
    description: 'Resource not found',
    probability: 0.01,
    errorType: 'client',
    statusCode: 404,
    message: 'Resource not found',
    retryable: false,
  },
  
  RATE_LIMITED: {
    name: 'Rate Limited',
    description: 'Too many requests',
    probability: 0.02,
    errorType: 'client',
    statusCode: 429,
    message: 'Rate limit exceeded',
    retryable: true,
    delay: 1000,
  },
};

/**
 * Error Simulator Class
 */
export class ErrorSimulator extends EventEmitter {
  private config: SimulationConfig;
  private stats: SimulationStats;
  private errorLogs: ErrorLog[] = [];
  private originalFetch: typeof fetch;

  constructor(config: Partial<SimulationConfig> = {}) {
    super();
    
    this.config = {
      enabled: false,
      scenarios: [],
      globalErrorRate: 0,
      logErrors: true,
      retryConfig: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelay: 1000,
      },
      ...config,
    };

    this.stats = this.initStats();
    this.originalFetch = global.fetch;
  }

  /**
   * Start error simulation
   */
  start(): void {
    if (this.config.enabled) {
      return;
    }

    this.config.enabled = true;
    this.stats = this.initStats();
    this.errorLogs = [];

    // Override global fetch
    global.fetch = this.simulatedFetch.bind(this);
    
    this.emit('started');
  }

  /**
   * Stop error simulation
   */
  stop(): void {
    if (!this.config.enabled) {
      return;
    }

    this.config.enabled = false;
    
    // Restore original fetch
    global.fetch = this.originalFetch;
    
    this.emit('stopped', this.getStats());
  }

  /**
   * Update simulation configuration
   */
  updateConfig(updates: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
  }

  /**
   * Add error scenario
   */
  addScenario(scenario: ErrorScenario): void {
    this.config.scenarios.push(scenario);
  }

  /**
   * Remove error scenario
   */
  removeScenario(scenarioName: string): void {
    this.config.scenarios = this.config.scenarios.filter(s => s.name !== scenarioName);
  }

  /**
   * Set network condition
   */
  setNetworkCondition(condition: NetworkCondition): void {
    this.config.networkCondition = condition;
    this.emit('networkConditionChanged', condition);
  }

  /**
   * Simulated fetch function
   */
  private async simulatedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (!this.config.enabled) {
      return this.originalFetch(input, init);
    }

    const startTime = performance.now();
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    this.stats.totalRequests++;

    try {
      // Apply network conditions
      if (this.config.networkCondition) {
        await this.simulateNetworkConditions(this.config.networkCondition, url);
      }

      // Check for error scenarios
      const errorScenario = this.shouldSimulateError();
      
      if (errorScenario) {
        return await this.simulateError(errorScenario, url, method, startTime);
      }

      // Proceed with normal request
      const response = await this.originalFetch(input, init);
      
      const endTime = performance.now();
      this.updateStats(endTime - startTime);
      
      return response;

    } catch (error) {
      const endTime = performance.now();
      this.logError({
        timestamp: new Date(),
        scenario: 'REAL_ERROR',
        errorType: 'network',
        url,
        method,
        attempt: 1,
        duration: endTime - startTime,
      });
      
      throw error;
    }
  }

  /**
   * Simulate network conditions
   */
  private async simulateNetworkConditions(
    condition: NetworkCondition,
    url: string
  ): Promise<void> {
    // Simulate latency with jitter
    const baseLatency = Math.random() * (condition.latency.max - condition.latency.min) + condition.latency.min;
    const jitter = (Math.random() - 0.5) * condition.jitter * 2;
    const totalLatency = Math.max(0, baseLatency + jitter);
    
    await this.delay(totalLatency);

    // Simulate packet loss
    if (Math.random() * 100 < condition.packetLoss) {
      throw new Error(`Packet loss simulated for ${url}`);
    }

    // Simulate connection drops
    if (Math.random() * 100 < condition.connectionDropRate) {
      throw new Error(`Connection dropped for ${url}`);
    }

    // TODO: Simulate bandwidth limitations (would require chunked processing)
  }

  /**
   * Check if an error should be simulated
   */
  private shouldSimulateError(): ErrorScenario | null {
    // Check global error rate first
    if (this.config.globalErrorRate && Math.random() < this.config.globalErrorRate) {
      const scenarios = this.config.scenarios.filter(s => s.retryable !== false);
      if (scenarios.length > 0) {
        return scenarios[Math.floor(Math.random() * scenarios.length)];
      }
    }

    // Check individual scenario probabilities
    for (const scenario of this.config.scenarios) {
      if (Math.random() < scenario.probability) {
        return scenario;
      }
    }

    return null;
  }

  /**
   * Simulate an error scenario
   */
  private async simulateError(
    scenario: ErrorScenario,
    url: string,
    method: string,
    startTime: number
  ): Promise<Response> {
    this.stats.simulatedErrors++;

    // Apply delay if specified
    if (scenario.delay) {
      await this.delay(scenario.delay);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log the error
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      scenario: scenario.name,
      errorType: scenario.errorType,
      statusCode: scenario.statusCode,
      url,
      method,
      attempt: 1,
      duration,
    };

    this.logError(errorLog);

    // Update stats by error type
    switch (scenario.errorType) {
      case 'network':
        this.stats.networkErrors++;
        break;
      case 'timeout':
        this.stats.timeouts++;
        break;
      case 'server':
        this.stats.serverErrors++;
        break;
      case 'client':
        this.stats.clientErrors++;
        break;
    }

    // Handle different error types
    if (scenario.customError) {
      throw scenario.customError;
    }

    if (scenario.statusCode) {
      const response = new Response(
        JSON.stringify({
          error: scenario.message || 'Simulated error',
          code: scenario.name.toUpperCase().replace(/\s+/g, '_'),
          timestamp: new Date().toISOString(),
        }),
        {
          status: scenario.statusCode,
          statusText: scenario.message || 'Simulated Error',
          headers: {
            'Content-Type': 'application/json',
            'X-Simulated-Error': 'true',
            'X-Error-Scenario': scenario.name,
          },
        }
      );

      return response;
    }

    // Default to throwing an error
    throw new Error(scenario.message || `Simulated ${scenario.errorType} error`);
  }

  /**
   * Log an error
   */
  private logError(errorLog: ErrorLog): void {
    if (this.config.logErrors) {
      this.errorLogs.push(errorLog);
      this.emit('error', errorLog);
    }
  }

  /**
   * Update statistics
   */
  private updateStats(duration: number): void {
    const count = this.stats.totalRequests - this.stats.simulatedErrors;
    this.stats.averageLatency = 
      (this.stats.averageLatency * (count - 1) + duration) / count;
  }

  /**
   * Get simulation statistics
   */
  getStats(): SimulationStats {
    this.stats.errorRate = this.stats.totalRequests > 0 
      ? this.stats.simulatedErrors / this.stats.totalRequests 
      : 0;
    
    return { ...this.stats };
  }

  /**
   * Get error logs
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Clear error logs
   */
  clearLogs(): void {
    this.errorLogs = [];
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initStats();
    this.errorLogs = [];
  }

  /**
   * Initialize statistics
   */
  private initStats(): SimulationStats {
    return {
      totalRequests: 0,
      simulatedErrors: 0,
      networkErrors: 0,
      timeouts: 0,
      serverErrors: 0,
      clientErrors: 0,
      retriedRequests: 0,
      averageLatency: 0,
      errorRate: 0,
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Retry Simulator for testing retry logic
 */
export class RetrySimulator extends EventEmitter {
  private attempts: Map<string, number> = new Map();
  private maxAttempts: number;
  private backoffStrategy: 'exponential' | 'linear' | 'fixed';
  private baseDelay: number;

  constructor(
    maxAttempts: number = 3,
    backoffStrategy: 'exponential' | 'linear' | 'fixed' = 'exponential',
    baseDelay: number = 1000
  ) {
    super();
    this.maxAttempts = maxAttempts;
    this.backoffStrategy = backoffStrategy;
    this.baseDelay = baseDelay;
  }

  /**
   * Simulate retry logic
   */
  async retry<T>(
    operation: () => Promise<T>,
    key: string = 'default'
  ): Promise<T> {
    const currentAttempt = (this.attempts.get(key) || 0) + 1;
    this.attempts.set(key, currentAttempt);

    this.emit('attempt', { key, attempt: currentAttempt });

    try {
      const result = await operation();
      this.attempts.delete(key);
      this.emit('success', { key, attempt: currentAttempt });
      return result;
    } catch (error) {
      if (currentAttempt >= this.maxAttempts) {
        this.attempts.delete(key);
        this.emit('failed', { key, attempt: currentAttempt, error });
        throw error;
      }

      const delay = this.calculateDelay(currentAttempt);
      this.emit('retry', { key, attempt: currentAttempt, delay, error });

      await this.delay(delay);
      return this.retry(operation, key);
    }
  }

  /**
   * Calculate delay based on backoff strategy
   */
  private calculateDelay(attempt: number): number {
    switch (this.backoffStrategy) {
      case 'exponential':
        return this.baseDelay * Math.pow(2, attempt - 1);
      case 'linear':
        return this.baseDelay * attempt;
      case 'fixed':
        return this.baseDelay;
      default:
        return this.baseDelay;
    }
  }

  /**
   * Reset retry state
   */
  reset(key?: string): void {
    if (key) {
      this.attempts.delete(key);
    } else {
      this.attempts.clear();
    }
  }

  /**
   * Get current attempt count
   */
  getAttemptCount(key: string): number {
    return this.attempts.get(key) || 0;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory functions for common simulation scenarios
 */
export const createErrorSimulator = (scenarios: ErrorScenario[] = []): ErrorSimulator => {
  return new ErrorSimulator({
    enabled: false,
    scenarios,
  });
};

export const createUnstableNetworkSimulator = (): ErrorSimulator => {
  return new ErrorSimulator({
    enabled: false,
    scenarios: [
      ErrorScenarios.NETWORK_ERROR,
      ErrorScenarios.TIMEOUT,
      ErrorScenarios.SERVER_ERROR_500,
      ErrorScenarios.SERVER_ERROR_502,
    ],
    networkCondition: NetworkConditions.FLAKY_WIFI,
    globalErrorRate: 0.1,
  });
};

export const createMobileNetworkSimulator = (): ErrorSimulator => {
  return new ErrorSimulator({
    enabled: false,
    scenarios: [
      ErrorScenarios.NETWORK_ERROR,
      ErrorScenarios.TIMEOUT,
    ],
    networkCondition: NetworkConditions.MOBILE_3G,
    globalErrorRate: 0.05,
  });
};

export const createHighErrorRateSimulator = (): ErrorSimulator => {
  return new ErrorSimulator({
    enabled: false,
    scenarios: Object.values(ErrorScenarios),
    globalErrorRate: 0.3,
  });
};

/**
 * Testing utilities for error scenarios
 */
export const testWithErrorSimulation = async <T>(
  operation: () => Promise<T>,
  simulator: ErrorSimulator,
  duration: number = 30000
): Promise<{
  result?: T;
  error?: Error;
  stats: SimulationStats;
  logs: ErrorLog[];
}> => {
  simulator.start();

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Test timeout')), duration);
  });

  try {
    const result = await Promise.race([operation(), timeout]);
    return {
      result,
      stats: simulator.getStats(),
      logs: simulator.getErrorLogs(),
    };
  } catch (error) {
    return {
      error: error as Error,
      stats: simulator.getStats(),
      logs: simulator.getErrorLogs(),
    };
  } finally {
    simulator.stop();
  }
};

/**
 * Performance testing with error simulation
 */
export const performanceTestWithErrors = async (
  operation: () => Promise<any>,
  options: {
    concurrency: number;
    duration: number;
    errorSimulator?: ErrorSimulator;
  }
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errorStats?: SimulationStats;
}> => {
  const { concurrency, duration, errorSimulator } = options;
  
  if (errorSimulator) {
    errorSimulator.start();
  }

  const startTime = performance.now();
  const endTime = startTime + duration;
  
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [] as number[],
  };

  // Create concurrent workers
  const workers = Array.from({ length: concurrency }, async () => {
    while (performance.now() < endTime) {
      const requestStart = performance.now();
      results.totalRequests++;

      try {
        await operation();
        const requestEnd = performance.now();
        results.responseTimes.push(requestEnd - requestStart);
        results.successfulRequests++;
      } catch (error) {
        results.failedRequests++;
      }
    }
  });

  await Promise.all(workers);

  if (errorSimulator) {
    errorSimulator.stop();
  }

  const actualDuration = performance.now() - startTime;
  const averageResponseTime = results.responseTimes.length > 0
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
    : 0;

  return {
    totalRequests: results.totalRequests,
    successfulRequests: results.successfulRequests,
    failedRequests: results.failedRequests,
    averageResponseTime,
    requestsPerSecond: results.totalRequests / (actualDuration / 1000),
    errorStats: errorSimulator?.getStats(),
  };
};