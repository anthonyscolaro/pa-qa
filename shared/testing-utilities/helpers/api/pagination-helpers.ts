/**
 * Pagination Testing Utilities
 * 
 * Comprehensive utilities for testing paginated API endpoints with support
 * for various pagination strategies and performance testing.
 */

import { ApiClient, ApiResponse } from './api-client';

export interface PaginationConfig {
  strategy: 'offset' | 'cursor' | 'page' | 'seek' | 'time';
  defaultPageSize?: number;
  maxPageSize?: number;
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';
  paramNames?: PaginationParamNames;
}

export interface PaginationParamNames {
  page?: string;
  limit?: string;
  offset?: string;
  cursor?: string;
  sort?: string;
  order?: string;
  before?: string;
  after?: string;
  since?: string;
  until?: string;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  before?: string;
  after?: string;
  since?: string | Date;
  until?: string | Date;
  filters?: Record<string, any>;
}

export interface PaginationMeta {
  page?: number;
  limit?: number;
  offset?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextCursor?: string;
  prevCursor?: string;
  nextPage?: number;
  prevPage?: number;
  firstPage?: number;
  lastPage?: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
    self?: string;
  };
}

export interface PaginationTestResult {
  strategy: string;
  totalItems: number;
  totalPages: number;
  pagesFetched: number;
  itemsFetched: number;
  duration: number;
  averageResponseTime: number;
  errors: Array<{
    page: number;
    error: string;
    timestamp: Date;
  }>;
  performance: {
    slowestPage: { page: number; duration: number };
    fastestPage: { page: number; duration: number };
    throughput: number; // items per second
  };
  consistency: {
    duplicates: number;
    missing: number;
    unexpectedItems: any[];
  };
}

export interface PaginationTestOptions {
  maxPages?: number;
  maxItems?: number;
  concurrency?: number;
  validateConsistency?: boolean;
  trackPerformance?: boolean;
  stopOnError?: boolean;
  delayBetweenRequests?: number;
  randomizeOrder?: boolean;
}

/**
 * Pagination Test Runner
 */
export class PaginationTester {
  private client: ApiClient;
  private config: PaginationConfig;

  constructor(client: ApiClient, config: PaginationConfig) {
    this.client = client;
    this.config = {
      defaultPageSize: 20,
      maxPageSize: 100,
      defaultSortField: 'id',
      defaultSortOrder: 'asc',
      paramNames: {
        page: 'page',
        limit: 'limit',
        offset: 'offset',
        cursor: 'cursor',
        sort: 'sort',
        order: 'order',
        before: 'before',
        after: 'after',
        since: 'since',
        until: 'until',
      },
      ...config,
    };
  }

  /**
   * Test pagination by fetching all pages
   */
  async testFullPagination(
    endpoint: string,
    request: PaginationRequest = {},
    options: PaginationTestOptions = {}
  ): Promise<PaginationTestResult> {
    const startTime = performance.now();
    const opts = {
      maxPages: 100,
      maxItems: 10000,
      concurrency: 1,
      validateConsistency: true,
      trackPerformance: true,
      stopOnError: false,
      delayBetweenRequests: 0,
      randomizeOrder: false,
      ...options,
    };

    const errors: Array<{ page: number; error: string; timestamp: Date }> = [];
    const pageResponses: Array<{ page: number; response: ApiResponse<PaginatedResponse>; duration: number }> = [];
    const allItems: any[] = [];
    let currentRequest = { ...request };
    let pageCount = 0;
    let hasMore = true;

    // Strategy-specific pagination logic
    while (hasMore && pageCount < opts.maxPages && allItems.length < opts.maxItems) {
      try {
        const pageStartTime = performance.now();
        const response = await this.fetchPage(endpoint, currentRequest);
        const pageEndTime = performance.now();
        const duration = pageEndTime - pageStartTime;

        pageResponses.push({
          page: pageCount + 1,
          response,
          duration,
        });

        const paginatedData = response.data as PaginatedResponse;
        allItems.push(...paginatedData.data);

        // Update pagination state based on strategy
        const nextRequest = this.getNextPageRequest(currentRequest, paginatedData, pageCount + 1);
        if (!nextRequest) {
          hasMore = false;
        } else {
          currentRequest = nextRequest;
        }

        pageCount++;

        // Delay between requests if specified
        if (opts.delayBetweenRequests > 0) {
          await this.delay(opts.delayBetweenRequests);
        }

      } catch (error) {
        const errorInfo = {
          page: pageCount + 1,
          error: (error as Error).message,
          timestamp: new Date(),
        };
        errors.push(errorInfo);

        if (opts.stopOnError) {
          break;
        }

        pageCount++;
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Calculate performance metrics
    const responseTimes = pageResponses.map(p => p.duration);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const slowestPage = pageResponses.reduce((prev, curr) => 
      prev.duration > curr.duration ? prev : curr
    , pageResponses[0] || { page: 0, duration: 0 });

    const fastestPage = pageResponses.reduce((prev, curr) => 
      prev.duration < curr.duration ? prev : curr
    , pageResponses[0] || { page: 0, duration: 0 });

    // Validate consistency if requested
    let consistency = { duplicates: 0, missing: 0, unexpectedItems: [] };
    if (opts.validateConsistency) {
      consistency = this.validateConsistency(allItems);
    }

    const firstPageMeta = pageResponses[0]?.response.data.meta;

    return {
      strategy: this.config.strategy,
      totalItems: allItems.length,
      totalPages: firstPageMeta?.totalPages || pageCount,
      pagesFetched: pageCount,
      itemsFetched: allItems.length,
      duration: totalDuration,
      averageResponseTime,
      errors,
      performance: {
        slowestPage: { page: slowestPage.page, duration: slowestPage.duration },
        fastestPage: { page: fastestPage.page, duration: fastestPage.duration },
        throughput: allItems.length / (totalDuration / 1000),
      },
      consistency,
    };
  }

  /**
   * Test specific pagination scenarios
   */
  async testPaginationScenarios(endpoint: string): Promise<{
    scenarios: Array<{
      name: string;
      result: PaginationTestResult;
      success: boolean;
    }>;
    summary: {
      totalScenarios: number;
      passed: number;
      failed: number;
    };
  }> {
    const scenarios = [
      {
        name: 'Default pagination',
        request: {},
      },
      {
        name: 'Small page size',
        request: { limit: 5 },
      },
      {
        name: 'Large page size',
        request: { limit: this.config.maxPageSize },
      },
      {
        name: 'With sorting (ascending)',
        request: { sort: this.config.defaultSortField, order: 'asc' as const },
      },
      {
        name: 'With sorting (descending)',
        request: { sort: this.config.defaultSortField, order: 'desc' as const },
      },
      {
        name: 'Empty result set',
        request: { filters: { nonExistentField: 'impossible-value-xyz' } },
      },
    ];

    const results = [];
    let passed = 0;

    for (const scenario of scenarios) {
      try {
        const result = await this.testFullPagination(
          endpoint,
          scenario.request,
          { maxPages: 5, validateConsistency: true }
        );

        const success = result.errors.length === 0;
        if (success) passed++;

        results.push({
          name: scenario.name,
          result,
          success,
        });
      } catch (error) {
        results.push({
          name: scenario.name,
          result: {
            strategy: this.config.strategy,
            totalItems: 0,
            totalPages: 0,
            pagesFetched: 0,
            itemsFetched: 0,
            duration: 0,
            averageResponseTime: 0,
            errors: [{ page: 1, error: (error as Error).message, timestamp: new Date() }],
            performance: {
              slowestPage: { page: 0, duration: 0 },
              fastestPage: { page: 0, duration: 0 },
              throughput: 0,
            },
            consistency: { duplicates: 0, missing: 0, unexpectedItems: [] },
          } as PaginationTestResult,
          success: false,
        });
      }
    }

    return {
      scenarios: results,
      summary: {
        totalScenarios: scenarios.length,
        passed,
        failed: scenarios.length - passed,
      },
    };
  }

  /**
   * Stress test pagination with concurrent requests
   */
  async stressTestPagination(
    endpoint: string,
    request: PaginationRequest = {},
    options: { concurrency: number; duration: number; maxPages: number } = {
      concurrency: 10,
      duration: 30000,
      maxPages: 50,
    }
  ): Promise<{
    duration: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsPerSecond: number;
    errors: string[];
  }> {
    const startTime = performance.now();
    const endTime = startTime + options.duration;
    const errors: string[] = [];
    const responseTimes: number[] = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    // Create concurrent workers
    const workers = Array.from({ length: options.concurrency }, async () => {
      while (performance.now() < endTime) {
        const page = Math.floor(Math.random() * options.maxPages) + 1;
        const pageRequest = this.buildPageRequest(request, page);

        try {
          const requestStart = performance.now();
          await this.fetchPage(endpoint, pageRequest);
          const requestEnd = performance.now();

          responseTimes.push(requestEnd - requestStart);
          successfulRequests++;
        } catch (error) {
          errors.push(`Page ${page}: ${(error as Error).message}`);
          failedRequests++;
        }

        totalRequests++;
      }
    });

    await Promise.all(workers);

    const actualDuration = performance.now() - startTime;
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    return {
      duration: actualDuration,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      requestsPerSecond: totalRequests / (actualDuration / 1000),
      errors: errors.slice(0, 100), // Limit error list
    };
  }

  /**
   * Fetch a single page
   */
  private async fetchPage(
    endpoint: string, 
    request: PaginationRequest
  ): Promise<ApiResponse<PaginatedResponse>> {
    const params = this.buildRequestParams(request);
    return this.client.get<PaginatedResponse>(endpoint, { params });
  }

  /**
   * Build request parameters based on pagination strategy
   */
  private buildRequestParams(request: PaginationRequest): Record<string, any> {
    const params: Record<string, any> = {};
    const paramNames = this.config.paramNames!;

    switch (this.config.strategy) {
      case 'offset':
        if (request.offset !== undefined) {
          params[paramNames.offset!] = request.offset;
        }
        if (request.limit !== undefined) {
          params[paramNames.limit!] = request.limit;
        }
        break;

      case 'page':
        if (request.page !== undefined) {
          params[paramNames.page!] = request.page;
        }
        if (request.limit !== undefined) {
          params[paramNames.limit!] = request.limit;
        }
        break;

      case 'cursor':
        if (request.cursor) {
          params[paramNames.cursor!] = request.cursor;
        }
        if (request.limit !== undefined) {
          params[paramNames.limit!] = request.limit;
        }
        if (request.before) {
          params[paramNames.before!] = request.before;
        }
        if (request.after) {
          params[paramNames.after!] = request.after;
        }
        break;

      case 'seek':
        if (request.since) {
          params[paramNames.since!] = request.since instanceof Date 
            ? request.since.toISOString() 
            : request.since;
        }
        if (request.until) {
          params[paramNames.until!] = request.until instanceof Date 
            ? request.until.toISOString() 
            : request.until;
        }
        if (request.limit !== undefined) {
          params[paramNames.limit!] = request.limit;
        }
        break;

      case 'time':
        if (request.since) {
          params[paramNames.since!] = request.since instanceof Date 
            ? request.since.toISOString() 
            : request.since;
        }
        if (request.until) {
          params[paramNames.until!] = request.until instanceof Date 
            ? request.until.toISOString() 
            : request.until;
        }
        if (request.limit !== undefined) {
          params[paramNames.limit!] = request.limit;
        }
        break;
    }

    // Common parameters
    if (request.sort) {
      params[paramNames.sort!] = request.sort;
    }
    if (request.order) {
      params[paramNames.order!] = request.order;
    }

    // Add filters
    if (request.filters) {
      Object.assign(params, request.filters);
    }

    return params;
  }

  /**
   * Get next page request based on current response
   */
  private getNextPageRequest(
    currentRequest: PaginationRequest,
    response: PaginatedResponse,
    currentPage: number
  ): PaginationRequest | null {
    const meta = response.meta;

    // Check if there are more pages
    if (meta.hasNext === false || (meta.total !== undefined && response.data.length < (currentRequest.limit || this.config.defaultPageSize!))) {
      return null;
    }

    const nextRequest = { ...currentRequest };

    switch (this.config.strategy) {
      case 'offset':
        const currentOffset = currentRequest.offset || 0;
        const limit = currentRequest.limit || this.config.defaultPageSize!;
        nextRequest.offset = currentOffset + limit;
        break;

      case 'page':
        nextRequest.page = (currentRequest.page || 1) + 1;
        break;

      case 'cursor':
        if (meta.nextCursor) {
          nextRequest.cursor = meta.nextCursor;
        } else {
          return null;
        }
        break;

      case 'seek':
        // For seek pagination, use the last item's timestamp/id
        if (response.data.length > 0) {
          const lastItem = response.data[response.data.length - 1];
          if (lastItem.createdAt) {
            nextRequest.since = lastItem.createdAt;
          } else if (lastItem.id) {
            nextRequest.since = lastItem.id;
          }
        } else {
          return null;
        }
        break;

      case 'time':
        // Similar to seek but for time-based pagination
        if (response.data.length > 0) {
          const lastItem = response.data[response.data.length - 1];
          if (lastItem.timestamp || lastItem.createdAt) {
            nextRequest.since = lastItem.timestamp || lastItem.createdAt;
          }
        } else {
          return null;
        }
        break;
    }

    return nextRequest;
  }

  /**
   * Build page request for a specific page number
   */
  private buildPageRequest(baseRequest: PaginationRequest, page: number): PaginationRequest {
    const request = { ...baseRequest };

    switch (this.config.strategy) {
      case 'page':
        request.page = page;
        break;

      case 'offset':
        const limit = request.limit || this.config.defaultPageSize!;
        request.offset = (page - 1) * limit;
        break;

      default:
        request.page = page;
    }

    return request;
  }

  /**
   * Validate consistency of paginated data
   */
  private validateConsistency(items: any[]): {
    duplicates: number;
    missing: number;
    unexpectedItems: any[];
  } {
    const seen = new Set();
    let duplicates = 0;
    const unexpectedItems = [];

    for (const item of items) {
      // Check for duplicates based on ID
      const id = item.id || item._id || JSON.stringify(item);
      if (seen.has(id)) {
        duplicates++;
      } else {
        seen.add(id);
      }

      // Check for unexpected items (null, undefined, malformed)
      if (!item || typeof item !== 'object' || (!item.id && !item._id)) {
        unexpectedItems.push(item);
      }
    }

    return {
      duplicates,
      missing: 0, // Would need specific business logic to determine missing items
      unexpectedItems,
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory functions for common pagination strategies
 */
export const createOffsetPaginationTester = (client: ApiClient): PaginationTester => {
  return new PaginationTester(client, {
    strategy: 'offset',
    paramNames: {
      offset: 'offset',
      limit: 'limit',
    },
  });
};

export const createPagePaginationTester = (client: ApiClient): PaginationTester => {
  return new PaginationTester(client, {
    strategy: 'page',
    paramNames: {
      page: 'page',
      limit: 'per_page',
    },
  });
};

export const createCursorPaginationTester = (client: ApiClient): PaginationTester => {
  return new PaginationTester(client, {
    strategy: 'cursor',
    paramNames: {
      cursor: 'cursor',
      limit: 'limit',
      after: 'after',
      before: 'before',
    },
  });
};

export const createTimePaginationTester = (client: ApiClient): PaginationTester => {
  return new PaginationTester(client, {
    strategy: 'time',
    paramNames: {
      since: 'since',
      until: 'until',
      limit: 'limit',
    },
  });
};

/**
 * Utility functions for pagination testing
 */
export const validatePaginationMeta = (meta: PaginationMeta): boolean => {
  // Basic validation rules
  if (meta.page !== undefined && meta.page < 1) return false;
  if (meta.limit !== undefined && meta.limit < 1) return false;
  if (meta.offset !== undefined && meta.offset < 0) return false;
  if (meta.total !== undefined && meta.total < 0) return false;
  if (meta.totalPages !== undefined && meta.totalPages < 0) return false;

  // Consistency checks
  if (meta.page !== undefined && meta.totalPages !== undefined) {
    if (meta.page > meta.totalPages && meta.totalPages > 0) return false;
  }

  if (meta.offset !== undefined && meta.limit !== undefined && meta.total !== undefined) {
    if (meta.offset >= meta.total && meta.total > 0) return false;
  }

  return true;
};

export const calculateExpectedPages = (total: number, pageSize: number): number => {
  return Math.ceil(total / pageSize);
};

export const calculatePageOffset = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
};