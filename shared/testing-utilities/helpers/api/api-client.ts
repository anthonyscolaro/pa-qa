/**
 * Universal API Client for Testing
 * 
 * A comprehensive testing utility that provides standardized request building,
 * authentication, and response handling across different API types.
 */

import { EventEmitter } from 'events';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  defaultHeaders?: Record<string, string>;
  authentication?: AuthConfig;
  performanceTracking?: boolean;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}

export interface AuthConfig {
  type: 'bearer' | 'basic' | 'oauth2' | 'api-key' | 'custom';
  token?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  customAuth?: (request: RequestInit) => RequestInit | Promise<RequestInit>;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
  validateStatus?: (status: number) => boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  url: string;
  timing: {
    start: number;
    end: number;
    duration: number;
    dns?: number;
    tcp?: number;
    tls?: number;
    request?: number;
    response?: number;
  };
  metadata?: Record<string, any>;
}

export interface RequestInterceptor {
  (request: Request): Request | Promise<Request>;
}

export interface ResponseInterceptor {
  (response: ApiResponse): ApiResponse | Promise<ApiResponse>;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  timeouts: number;
  retries: number;
}

export class ApiClient extends EventEmitter {
  private config: Required<ApiClientConfig>;
  private performanceData: number[] = [];
  private requestCount = 0;
  private successCount = 0;
  private failureCount = 0;
  private timeoutCount = 0;
  private retryCount = 0;

  constructor(config: ApiClientConfig) {
    super();
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      performanceTracking: true,
      requestInterceptors: [],
      responseInterceptors: [],
      ...config,
      authentication: config.authentication || { type: 'bearer' },
    };
  }

  /**
   * Perform a GET request
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Perform a POST request
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', data });
  }

  /**
   * Perform a PUT request
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', data });
  }

  /**
   * Perform a PATCH request
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', data });
  }

  /**
   * Perform a DELETE request
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Perform a HEAD request
   */
  async head(url: string, options: RequestOptions = {}): Promise<ApiResponse<null>> {
    return this.request<null>(url, { ...options, method: 'HEAD' });
  }

  /**
   * Perform an OPTIONS request
   */
  async options<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'OPTIONS' });
  }

  /**
   * Perform a request with full control
   */
  async request<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    this.requestCount++;

    try {
      const request = await this.buildRequest(url, options);
      const response = await this.executeRequest(request, options);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (this.config.performanceTracking) {
        this.performanceData.push(duration);
      }

      const apiResponse: ApiResponse<T> = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.url,
        timing: {
          start: startTime,
          end: endTime,
          duration,
        },
        metadata: options.metadata,
      };

      // Apply response interceptors
      let finalResponse = apiResponse;
      for (const interceptor of this.config.responseInterceptors) {
        finalResponse = await interceptor(finalResponse);
      }

      this.successCount++;
      this.emit('response', finalResponse);
      
      return finalResponse;
    } catch (error) {
      this.failureCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Build a request with authentication and headers
   */
  private async buildRequest(url: string, options: RequestOptions): Promise<Request> {
    const fullUrl = this.buildUrl(url, options.params);
    
    const headers = new Headers({
      ...this.config.defaultHeaders,
      ...options.headers,
    });

    // Apply authentication
    await this.applyAuthentication(headers, options);

    const requestInit: RequestInit = {
      method: options.method || 'GET',
      headers,
      ...options,
    };

    // Handle request body
    if (options.data !== undefined && options.method !== 'GET' && options.method !== 'HEAD') {
      requestInit.body = this.serializeBody(options.data, headers);
    }

    let request = new Request(fullUrl, requestInit);

    // Apply request interceptors
    for (const interceptor of this.config.requestInterceptors) {
      request = await interceptor(request);
    }

    return request;
  }

  /**
   * Execute the request with retries and timeout
   */
  private async executeRequest(request: Request, options: RequestOptions): Promise<Response & { data: any }> {
    const timeout = options.timeout || this.config.timeout;
    const retries = options.retries ?? this.config.retries;
    const validateStatus = options.validateStatus || ((status: number) => status >= 200 && status < 300);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          this.timeoutCount++;
        }, timeout);

        const response = await fetch(request.clone(), {
          ...request,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!validateStatus(response.status)) {
          throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
        }

        const data = await this.parseResponse(response, options.responseType || 'json');
        
        return {
          ...response,
          data,
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          this.retryCount++;
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
          continue;
        }
        
        break;
      }
    }

    throw lastError;
  }

  /**
   * Apply authentication to request headers
   */
  private async applyAuthentication(headers: Headers, options: RequestOptions): Promise<void> {
    const auth = this.config.authentication;

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          headers.set('Authorization', `Bearer ${auth.token}`);
        }
        break;

      case 'basic':
        if (auth.username && auth.password) {
          const encoded = btoa(`${auth.username}:${auth.password}`);
          headers.set('Authorization', `Basic ${encoded}`);
        }
        break;

      case 'oauth2':
        if (auth.token) {
          headers.set('Authorization', `Bearer ${auth.token}`);
        }
        break;

      case 'api-key':
        if (auth.apiKey && auth.apiKeyHeader) {
          headers.set(auth.apiKeyHeader, auth.apiKey);
        }
        break;

      case 'custom':
        if (auth.customAuth) {
          // Custom auth can modify the entire request
          break;
        }
        break;
    }
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const urlObj = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => urlObj.searchParams.append(key, String(v)));
        } else {
          urlObj.searchParams.append(key, String(value));
        }
      }
    });

    return urlObj.toString();
  }

  /**
   * Serialize request body based on content type
   */
  private serializeBody(data: any, headers: Headers): string | FormData | Blob {
    const contentType = headers.get('Content-Type') || '';

    if (data instanceof FormData || data instanceof Blob) {
      return data;
    }

    if (contentType.includes('application/json')) {
      return JSON.stringify(data);
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      return params.toString();
    }

    return String(data);
  }

  /**
   * Parse response based on response type
   */
  private async parseResponse(response: Response, responseType: string): Promise<any> {
    switch (responseType) {
      case 'json':
        return response.json();
      case 'text':
        return response.text();
      case 'blob':
        return response.blob();
      case 'arrayBuffer':
        return response.arrayBuffer();
      case 'stream':
        return response.body;
      default:
        return response.json();
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const responseTimes = this.performanceData.sort((a, b) => a - b);
    const total = responseTimes.length;
    
    return {
      totalRequests: this.requestCount,
      successfulRequests: this.successCount,
      failedRequests: this.failureCount,
      averageResponseTime: total > 0 ? responseTimes.reduce((a, b) => a + b, 0) / total : 0,
      minResponseTime: total > 0 ? responseTimes[0] : 0,
      maxResponseTime: total > 0 ? responseTimes[total - 1] : 0,
      p95ResponseTime: total > 0 ? responseTimes[Math.floor(total * 0.95)] : 0,
      requestsPerSecond: this.requestCount / (this.performanceData.length > 0 ? 
        (Math.max(...this.performanceData) - Math.min(...this.performanceData)) / 1000 : 1),
      errorRate: this.requestCount > 0 ? this.failureCount / this.requestCount : 0,
      timeouts: this.timeoutCount,
      retries: this.retryCount,
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceData = [];
    this.requestCount = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.timeoutCount = 0;
    this.retryCount = 0;
  }

  /**
   * Create a new client instance with updated config
   */
  withConfig(updates: Partial<ApiClientConfig>): ApiClient {
    return new ApiClient({ ...this.config, ...updates });
  }

  /**
   * Create a new client instance with different authentication
   */
  withAuth(auth: AuthConfig): ApiClient {
    return new ApiClient({ ...this.config, authentication: auth });
  }

  /**
   * Create a new client instance with additional headers
   */
  withHeaders(headers: Record<string, string>): ApiClient {
    return new ApiClient({
      ...this.config,
      defaultHeaders: { ...this.config.defaultHeaders, ...headers },
    });
  }
}

/**
 * Factory function for creating API clients
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

/**
 * Pre-configured clients for common scenarios
 */
export const createJWTClient = (baseURL: string, token: string): ApiClient => {
  return new ApiClient({
    baseURL,
    authentication: { type: 'bearer', token },
  });
};

export const createBasicAuthClient = (baseURL: string, username: string, password: string): ApiClient => {
  return new ApiClient({
    baseURL,
    authentication: { type: 'basic', username, password },
  });
};

export const createApiKeyClient = (baseURL: string, apiKey: string, header = 'X-API-Key'): ApiClient => {
  return new ApiClient({
    baseURL,
    authentication: { type: 'api-key', apiKey, apiKeyHeader: header },
  });
};

/**
 * Testing utilities
 */
export interface TestScenario {
  name: string;
  requests: Array<{
    method: string;
    url: string;
    data?: any;
    expected: {
      status?: number;
      responseTime?: number;
      headers?: Record<string, string>;
      data?: any;
    };
  }>;
}

export class ApiTestRunner {
  constructor(private client: ApiClient) {}

  async runScenario(scenario: TestScenario): Promise<{
    name: string;
    results: Array<{
      passed: boolean;
      request: any;
      response?: ApiResponse;
      error?: Error;
      assertions: Array<{ name: string; passed: boolean; message?: string }>;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      duration: number;
    };
  }> {
    const startTime = performance.now();
    const results = [];

    for (const request of scenario.requests) {
      const result = await this.runSingleTest(request);
      results.push(result);
    }

    const endTime = performance.now();
    const passed = results.filter(r => r.passed).length;

    return {
      name: scenario.name,
      results,
      summary: {
        total: results.length,
        passed,
        failed: results.length - passed,
        duration: endTime - startTime,
      },
    };
  }

  private async runSingleTest(testRequest: any): Promise<any> {
    try {
      const response = await this.client.request(testRequest.url, {
        method: testRequest.method,
        data: testRequest.data,
      });

      const assertions = [];
      let passed = true;

      // Check status code
      if (testRequest.expected.status !== undefined) {
        const statusPassed = response.status === testRequest.expected.status;
        assertions.push({
          name: 'status_code',
          passed: statusPassed,
          message: statusPassed ? undefined : `Expected ${testRequest.expected.status}, got ${response.status}`,
        });
        passed = passed && statusPassed;
      }

      // Check response time
      if (testRequest.expected.responseTime !== undefined) {
        const timePassed = response.timing.duration <= testRequest.expected.responseTime;
        assertions.push({
          name: 'response_time',
          passed: timePassed,
          message: timePassed ? undefined : `Expected <= ${testRequest.expected.responseTime}ms, got ${response.timing.duration}ms`,
        });
        passed = passed && timePassed;
      }

      // Check headers
      if (testRequest.expected.headers) {
        for (const [key, value] of Object.entries(testRequest.expected.headers)) {
          const headerPassed = response.headers.get(key) === value;
          assertions.push({
            name: `header_${key}`,
            passed: headerPassed,
            message: headerPassed ? undefined : `Expected header ${key}=${value}, got ${response.headers.get(key)}`,
          });
          passed = passed && headerPassed;
        }
      }

      return {
        passed,
        request: testRequest,
        response,
        assertions,
      };
    } catch (error) {
      return {
        passed: false,
        request: testRequest,
        error: error as Error,
        assertions: [
          {
            name: 'request_success',
            passed: false,
            message: (error as Error).message,
          },
        ],
      };
    }
  }
}