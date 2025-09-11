/**
 * Rate Limiting Test Utilities
 * 
 * Comprehensive utilities for testing API rate limits, throttling behavior,
 * and backpressure handling across different rate limiting strategies.
 */

import { ApiClient, ApiResponse } from './api-client';
import { EventEmitter } from 'events';

export interface RateLimitConfig {
  strategy: 'fixed-window' | 'sliding-window' | 'token-bucket' | 'leaky-bucket' | 'adaptive';
  windowSize: number; // in milliseconds
  maxRequests: number;
  burstSize?: number;
  backoffStrategy?: 'exponential' | 'linear' | 'fixed' | 'fibonacci';
  retryAfterHeader?: string;
  rateLimitHeaders?: {
    limit?: string;
    remaining?: string;
    reset?: string;
    retryAfter?: string;
  };
}

export interface RateLimitTest {
  name: string;
  description: string;
  requestPattern: RequestPattern;
  expectedBehavior: ExpectedBehavior;
  timeout?: number;
}

export interface RequestPattern {
  type: 'burst' | 'sustained' | 'gradual' | 'spike' | 'custom';
  requestCount: number;
  timeframe: number; // milliseconds
  concurrency?: number;
  delay?: number; // delay between requests
  customPattern?: number[]; // array of delays between requests
}

export interface ExpectedBehavior {
  maxSuccessfulRequests: number;
  expectedStatus?: number | number[];
  shouldHitRateLimit: boolean;
  retryAfterExpected?: boolean;
  resetTimeExpected?: boolean;
  backoffExpected?: boolean;
}

export interface RateLimitTestResult {
  testName: string;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  firstRateLimitAt?: number;
  rateLimitResetTime?: number;
  retryAfterValues: number[];
  statusCodeDistribution: Record<number, number>;
  performance: {
    requestsPerSecond: number;
    successRate: number;
    rateLimitRate: number;
    throughput: number;
  };
  rateLimitHeaders: {
    detectedStrategy?: string;
    limitValues: number[];
    remainingValues: number[];
    resetValues: (number | string)[];
  };
  backoffAnalysis?: {
    strategy: string;
    avgBackoffTime: number;
    backoffProgression: number[];
  };
  passed: boolean;
  errors: string[];
}

export interface RateLimitResponse extends ApiResponse {
  rateLimitInfo: {
    limit?: number;
    remaining?: number;
    reset?: number | string;
    retryAfter?: number;
    strategy?: string;
  };
}

/**
 * Rate Limit Tester
 */
export class RateLimitTester extends EventEmitter {
  private client: ApiClient;
  private config: RateLimitConfig;

  constructor(client: ApiClient, config: RateLimitConfig) {
    super();
    this.client = client;
    this.config = {
      retryAfterHeader: 'Retry-After',
      rateLimitHeaders: {
        limit: 'X-RateLimit-Limit',
        remaining: 'X-RateLimit-Remaining',
        reset: 'X-RateLimit-Reset',
        retryAfter: 'Retry-After',
      },
      ...config,
    };
  }

  /**
   * Run a single rate limit test
   */
  async runTest(endpoint: string, test: RateLimitTest): Promise<RateLimitTestResult> {
    const startTime = performance.now();
    const requests: Array<{
      timestamp: number;
      response?: RateLimitResponse;
      error?: Error;
      duration: number;
    }> = [];

    const statusCounts: Record<number, number> = {};
    const retryAfterValues: number[] = [];
    const limitValues: number[] = [];
    const remainingValues: number[] = [];
    const resetValues: (number | string)[] = [];

    let firstRateLimitAt: number | undefined;
    let rateLimitResetTime: number | undefined;

    // Generate request schedule based on pattern
    const requestSchedule = this.generateRequestSchedule(test.requestPattern);
    
    this.emit('testStarted', { testName: test.name, totalRequests: requestSchedule.length });

    // Execute requests according to the schedule
    for (let i = 0; i < requestSchedule.length; i++) {
      const delay = requestSchedule[i];
      if (delay > 0) {
        await this.sleep(delay);
      }

      const requestStart = performance.now();
      
      try {
        const response = await this.makeRequest(endpoint);
        const requestEnd = performance.now();
        const duration = requestEnd - requestStart;

        requests.push({
          timestamp: requestStart,
          response,
          duration,
        });

        // Track status codes
        statusCounts[response.status] = (statusCounts[response.status] || 0) + 1;

        // Check for rate limit indicators
        if (this.isRateLimited(response)) {
          if (!firstRateLimitAt) {
            firstRateLimitAt = requestStart - startTime;
          }

          // Extract retry-after header
          const retryAfter = this.extractRetryAfter(response);
          if (retryAfter) {
            retryAfterValues.push(retryAfter);
          }
        }

        // Extract rate limit headers
        const rateLimitInfo = this.extractRateLimitInfo(response);
        if (rateLimitInfo.limit) limitValues.push(rateLimitInfo.limit);
        if (rateLimitInfo.remaining !== undefined) remainingValues.push(rateLimitInfo.remaining);
        if (rateLimitInfo.reset) resetValues.push(rateLimitInfo.reset);

        this.emit('requestCompleted', { 
          requestIndex: i + 1, 
          status: response.status, 
          rateLimited: this.isRateLimited(response) 
        });

      } catch (error) {
        const requestEnd = performance.now();
        const duration = requestEnd - requestStart;

        requests.push({
          timestamp: requestStart,
          error: error as Error,
          duration,
        });

        this.emit('requestFailed', { requestIndex: i + 1, error: (error as Error).message });
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Analyze results
    const result = this.analyzeResults(test, requests, totalDuration, {
      statusCounts,
      retryAfterValues,
      limitValues,
      remainingValues,
      resetValues,
      firstRateLimitAt,
      rateLimitResetTime,
    });

    this.emit('testCompleted', result);
    return result;
  }

  /**
   * Run multiple rate limit tests
   */
  async runTestSuite(
    endpoint: string, 
    tests: RateLimitTest[]
  ): Promise<{
    results: RateLimitTestResult[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      duration: number;
    };
  }> {
    const suiteStartTime = performance.now();
    const results: RateLimitTestResult[] = [];

    for (const test of tests) {
      try {
        const result = await this.runTest(endpoint, test);
        results.push(result);

        // Wait between tests to avoid interference
        await this.sleep(1000);
      } catch (error) {
        results.push({
          testName: test.name,
          duration: 0,
          totalRequests: 0,
          successfulRequests: 0,
          rateLimitedRequests: 0,
          errorRequests: 1,
          averageResponseTime: 0,
          retryAfterValues: [],
          statusCodeDistribution: {},
          performance: {
            requestsPerSecond: 0,
            successRate: 0,
            rateLimitRate: 0,
            throughput: 0,
          },
          rateLimitHeaders: {
            limitValues: [],
            remainingValues: [],
            resetValues: [],
          },
          passed: false,
          errors: [(error as Error).message],
        });
      }
    }

    const suiteEndTime = performance.now();
    const passed = results.filter(r => r.passed).length;

    return {
      results,
      summary: {
        totalTests: tests.length,
        passed,
        failed: tests.length - passed,
        duration: suiteEndTime - suiteStartTime,
      },
    };
  }

  /**
   * Test rate limit recovery behavior
   */
  async testRecovery(
    endpoint: string,
    options: {
      triggerRateLimit: boolean;
      waitTime: number;
      verifyRecovery: boolean;
    } = { triggerRateLimit: true, waitTime: 60000, verifyRecovery: true }
  ): Promise<{
    rateLimitTriggered: boolean;
    recoveryTime: number;
    recoverySuccessful: boolean;
    details: string;
  }> {
    let rateLimitTriggered = false;
    let recoveryTime = 0;
    let recoverySuccessful = false;
    let details = '';

    // Step 1: Trigger rate limit if requested
    if (options.triggerRateLimit) {
      try {
        // Send burst of requests to trigger rate limit
        const burstRequests = Math.max(this.config.maxRequests * 2, 50);
        for (let i = 0; i < burstRequests; i++) {
          const response = await this.makeRequest(endpoint);
          if (this.isRateLimited(response)) {
            rateLimitTriggered = true;
            details += `Rate limit triggered after ${i + 1} requests. `;
            break;
          }
        }
      } catch (error) {
        details += `Error triggering rate limit: ${(error as Error).message}. `;
      }
    }

    // Step 2: Wait for recovery
    if (rateLimitTriggered || !options.triggerRateLimit) {
      details += `Waiting ${options.waitTime}ms for recovery. `;
      await this.sleep(options.waitTime);
      recoveryTime = options.waitTime;
    }

    // Step 3: Verify recovery
    if (options.verifyRecovery) {
      try {
        const response = await this.makeRequest(endpoint);
        recoverySuccessful = !this.isRateLimited(response);
        details += recoverySuccessful 
          ? 'Recovery successful.' 
          : 'Recovery failed - still rate limited.';
      } catch (error) {
        details += `Error verifying recovery: ${(error as Error).message}`;
      }
    }

    return {
      rateLimitTriggered,
      recoveryTime,
      recoverySuccessful,
      details,
    };
  }

  /**
   * Stress test rate limiting under various loads
   */
  async stressTest(
    endpoint: string,
    scenarios: Array<{
      name: string;
      concurrency: number;
      duration: number; // milliseconds
      requestsPerSecond: number;
    }>
  ): Promise<Array<{
    scenario: string;
    results: {
      totalRequests: number;
      successfulRequests: number;
      rateLimitedRequests: number;
      averageResponseTime: number;
      maxResponseTime: number;
      rateLimitStrategy?: string;
    };
  }>> {
    const results = [];

    for (const scenario of scenarios) {
      const scenarioResults = await this.runStressScenario(endpoint, scenario);
      results.push({
        scenario: scenario.name,
        results: scenarioResults,
      });

      // Recovery time between scenarios
      await this.sleep(5000);
    }

    return results;
  }

  /**
   * Generate request schedule based on pattern
   */
  private generateRequestSchedule(pattern: RequestPattern): number[] {
    const schedule: number[] = [];

    switch (pattern.type) {
      case 'burst':
        // All requests at once
        schedule.push(0); // First request immediate
        for (let i = 1; i < pattern.requestCount; i++) {
          schedule.push(0); // No delay between requests
        }
        break;

      case 'sustained':
        // Even distribution over timeframe
        const interval = pattern.timeframe / pattern.requestCount;
        schedule.push(0); // First request immediate
        for (let i = 1; i < pattern.requestCount; i++) {
          schedule.push(interval);
        }
        break;

      case 'gradual':
        // Gradually increasing rate
        const maxDelay = pattern.timeframe / pattern.requestCount * 2;
        schedule.push(0);
        for (let i = 1; i < pattern.requestCount; i++) {
          const delay = maxDelay * (pattern.requestCount - i) / pattern.requestCount;
          schedule.push(delay);
        }
        break;

      case 'spike':
        // Initial burst, then gradual
        const burstCount = Math.floor(pattern.requestCount * 0.3);
        const remainingCount = pattern.requestCount - burstCount;
        
        // Burst phase
        schedule.push(0);
        for (let i = 1; i < burstCount; i++) {
          schedule.push(0);
        }
        
        // Gradual phase
        const gradualInterval = pattern.timeframe / remainingCount;
        for (let i = 0; i < remainingCount; i++) {
          schedule.push(gradualInterval);
        }
        break;

      case 'custom':
        if (pattern.customPattern) {
          schedule.push(...pattern.customPattern);
        }
        break;

      default:
        // Default to sustained
        const defaultInterval = pattern.timeframe / pattern.requestCount;
        schedule.push(0);
        for (let i = 1; i < pattern.requestCount; i++) {
          schedule.push(defaultInterval);
        }
    }

    return schedule.slice(0, pattern.requestCount);
  }

  /**
   * Make a request and extract rate limit information
   */
  private async makeRequest(endpoint: string): Promise<RateLimitResponse> {
    const response = await this.client.get(endpoint);
    const rateLimitInfo = this.extractRateLimitInfo(response);
    
    return {
      ...response,
      rateLimitInfo,
    };
  }

  /**
   * Extract rate limit information from response headers
   */
  private extractRateLimitInfo(response: ApiResponse): {
    limit?: number;
    remaining?: number;
    reset?: number | string;
    retryAfter?: number;
    strategy?: string;
  } {
    const headers = this.config.rateLimitHeaders!;
    const rateLimitInfo: any = {};

    // Extract standard rate limit headers
    if (headers.limit && response.headers.has(headers.limit)) {
      rateLimitInfo.limit = parseInt(response.headers.get(headers.limit)!, 10);
    }

    if (headers.remaining && response.headers.has(headers.remaining)) {
      rateLimitInfo.remaining = parseInt(response.headers.get(headers.remaining)!, 10);
    }

    if (headers.reset && response.headers.has(headers.reset)) {
      const resetValue = response.headers.get(headers.reset)!;
      rateLimitInfo.reset = isNaN(parseInt(resetValue)) ? resetValue : parseInt(resetValue, 10);
    }

    if (headers.retryAfter && response.headers.has(headers.retryAfter)) {
      rateLimitInfo.retryAfter = parseInt(response.headers.get(headers.retryAfter)!, 10);
    }

    // Try to detect rate limiting strategy
    rateLimitInfo.strategy = this.detectRateLimitStrategy(response.headers);

    return rateLimitInfo;
  }

  /**
   * Detect rate limiting strategy from headers
   */
  private detectRateLimitStrategy(headers: Headers): string {
    // Check for common rate limiting implementations
    if (headers.has('x-ratelimit-reset-time')) return 'sliding-window';
    if (headers.has('x-bucket-capacity')) return 'token-bucket';
    if (headers.has('x-ratelimit-window')) return 'fixed-window';
    
    return 'unknown';
  }

  /**
   * Check if response indicates rate limiting
   */
  private isRateLimited(response: ApiResponse): boolean {
    return response.status === 429 || 
           response.status === 503 || 
           response.headers.has(this.config.retryAfterHeader!);
  }

  /**
   * Extract retry-after value from response
   */
  private extractRetryAfter(response: ApiResponse): number | null {
    const retryAfterHeader = response.headers.get(this.config.retryAfterHeader!);
    if (retryAfterHeader) {
      const value = parseInt(retryAfterHeader, 10);
      return isNaN(value) ? null : value;
    }
    return null;
  }

  /**
   * Analyze test results
   */
  private analyzeResults(
    test: RateLimitTest,
    requests: Array<any>,
    totalDuration: number,
    metrics: any
  ): RateLimitTestResult {
    const successfulRequests = requests.filter(r => r.response && !this.isRateLimited(r.response)).length;
    const rateLimitedRequests = requests.filter(r => r.response && this.isRateLimited(r.response)).length;
    const errorRequests = requests.filter(r => r.error).length;

    const responseTimes = requests
      .filter(r => r.response)
      .map(r => r.duration);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const performance = {
      requestsPerSecond: requests.length / (totalDuration / 1000),
      successRate: successfulRequests / requests.length,
      rateLimitRate: rateLimitedRequests / requests.length,
      throughput: successfulRequests / (totalDuration / 1000),
    };

    // Validate against expected behavior
    const errors: string[] = [];
    let passed = true;

    if (test.expectedBehavior.shouldHitRateLimit && rateLimitedRequests === 0) {
      errors.push('Expected to hit rate limit but did not');
      passed = false;
    }

    if (!test.expectedBehavior.shouldHitRateLimit && rateLimitedRequests > 0) {
      errors.push('Did not expect to hit rate limit but did');
      passed = false;
    }

    if (successfulRequests > test.expectedBehavior.maxSuccessfulRequests) {
      errors.push(`Too many successful requests: ${successfulRequests} > ${test.expectedBehavior.maxSuccessfulRequests}`);
      passed = false;
    }

    return {
      testName: test.name,
      duration: totalDuration,
      totalRequests: requests.length,
      successfulRequests,
      rateLimitedRequests,
      errorRequests,
      averageResponseTime,
      firstRateLimitAt: metrics.firstRateLimitAt,
      rateLimitResetTime: metrics.rateLimitResetTime,
      retryAfterValues: metrics.retryAfterValues,
      statusCodeDistribution: metrics.statusCounts,
      performance,
      rateLimitHeaders: {
        detectedStrategy: this.detectStrategyFromResults(metrics),
        limitValues: metrics.limitValues,
        remainingValues: metrics.remainingValues,
        resetValues: metrics.resetValues,
      },
      passed,
      errors,
    };
  }

  /**
   * Detect rate limiting strategy from test results
   */
  private detectStrategyFromResults(metrics: any): string {
    // Analyze patterns in the rate limit headers to determine strategy
    if (metrics.resetValues.length > 0) {
      const resets = metrics.resetValues.filter((v: any) => typeof v === 'number');
      if (resets.length > 1) {
        const intervals = [];
        for (let i = 1; i < resets.length; i++) {
          intervals.push(resets[i] - resets[i - 1]);
        }
        
        // If reset intervals are consistent, likely fixed window
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        
        if (variance < avgInterval * 0.1) {
          return 'fixed-window';
        }
      }
    }

    return 'unknown';
  }

  /**
   * Run a single stress test scenario
   */
  private async runStressScenario(
    endpoint: string,
    scenario: { concurrency: number; duration: number; requestsPerSecond: number }
  ): Promise<any> {
    const endTime = Date.now() + scenario.duration;
    const workers = [];
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitedRequests: 0,
      responseTimes: [] as number[],
    };

    // Create concurrent workers
    for (let i = 0; i < scenario.concurrency; i++) {
      const worker = this.createStressWorker(endpoint, endTime, scenario.requestsPerSecond, results);
      workers.push(worker);
    }

    await Promise.all(workers);

    return {
      totalRequests: results.totalRequests,
      successfulRequests: results.successfulRequests,
      rateLimitedRequests: results.rateLimitedRequests,
      averageResponseTime: results.responseTimes.length > 0 
        ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
        : 0,
      maxResponseTime: results.responseTimes.length > 0 
        ? Math.max(...results.responseTimes) 
        : 0,
    };
  }

  /**
   * Create a stress test worker
   */
  private async createStressWorker(
    endpoint: string,
    endTime: number,
    requestsPerSecond: number,
    results: any
  ): Promise<void> {
    const interval = 1000 / requestsPerSecond;
    
    while (Date.now() < endTime) {
      const requestStart = performance.now();
      
      try {
        const response = await this.makeRequest(endpoint);
        const requestEnd = performance.now();
        
        results.totalRequests++;
        results.responseTimes.push(requestEnd - requestStart);
        
        if (this.isRateLimited(response)) {
          results.rateLimitedRequests++;
        } else {
          results.successfulRequests++;
        }
      } catch (error) {
        results.totalRequests++;
      }

      await this.sleep(interval);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory functions for common rate limit testing scenarios
 */
export const createBurstTest = (requestCount: number = 100): RateLimitTest => ({
  name: 'Burst Test',
  description: 'Send many requests as quickly as possible',
  requestPattern: {
    type: 'burst',
    requestCount,
    timeframe: 1000,
  },
  expectedBehavior: {
    maxSuccessfulRequests: 50,
    shouldHitRateLimit: true,
    retryAfterExpected: true,
  },
});

export const createSustainedLoadTest = (rps: number, duration: number = 60000): RateLimitTest => ({
  name: 'Sustained Load Test',
  description: `Maintain ${rps} requests per second`,
  requestPattern: {
    type: 'sustained',
    requestCount: Math.floor((rps * duration) / 1000),
    timeframe: duration,
  },
  expectedBehavior: {
    maxSuccessfulRequests: Math.floor((rps * duration) / 1000),
    shouldHitRateLimit: false,
  },
});

export const createGradualRampTest = (maxRequests: number = 200): RateLimitTest => ({
  name: 'Gradual Ramp Test',
  description: 'Gradually increase request rate',
  requestPattern: {
    type: 'gradual',
    requestCount: maxRequests,
    timeframe: 30000,
  },
  expectedBehavior: {
    maxSuccessfulRequests: 100,
    shouldHitRateLimit: true,
  },
});

export const createSpikeTest = (requestCount: number = 150): RateLimitTest => ({
  name: 'Spike Test',
  description: 'Initial burst followed by sustained load',
  requestPattern: {
    type: 'spike',
    requestCount,
    timeframe: 20000,
  },
  expectedBehavior: {
    maxSuccessfulRequests: 75,
    shouldHitRateLimit: true,
  },
});

/**
 * Create a rate limit tester with common configurations
 */
export const createRateLimitTester = (
  client: ApiClient,
  config: Partial<RateLimitConfig>
): RateLimitTester => {
  const defaultConfig: RateLimitConfig = {
    strategy: 'fixed-window',
    windowSize: 60000, // 1 minute
    maxRequests: 100,
    retryAfterHeader: 'Retry-After',
    rateLimitHeaders: {
      limit: 'X-RateLimit-Limit',
      remaining: 'X-RateLimit-Remaining',
      reset: 'X-RateLimit-Reset',
      retryAfter: 'Retry-After',
    },
  };

  return new RateLimitTester(client, { ...defaultConfig, ...config });
};