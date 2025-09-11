/**
 * MSW (Mock Service Worker) v2.0 Testing Utilities
 * 
 * Comprehensive utilities for mocking API responses using MSW v2.0+,
 * including REST, GraphQL, and advanced mocking scenarios.
 */

import { http, HttpResponse, HttpHandler, graphql, GraphQLHandler, RequestHandler } from 'msw';
import { setupWorker, SetupWorker } from 'msw/browser';
import { setupServer, SetupServer } from 'msw/node';

export interface MockConfig {
  baseUrl?: string;
  delay?: number | 'real' | 'infinite';
  status?: number;
  headers?: Record<string, string>;
  once?: boolean;
  networkError?: boolean;
  timeout?: boolean;
}

export interface MockResponse<T = any> {
  data: T;
  status?: number;
  headers?: Record<string, string>;
  delay?: number;
}

export interface MockEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  path: string;
  response: MockResponse | ((req: any) => MockResponse | Promise<MockResponse>);
  config?: MockConfig;
}

export interface GraphQLMock {
  operationType: 'query' | 'mutation' | 'subscription';
  operationName?: string;
  response: MockResponse | ((req: any) => MockResponse | Promise<MockResponse>);
  config?: MockConfig;
}

export interface MockScenario {
  name: string;
  description: string;
  endpoints: MockEndpoint[];
  graphql?: GraphQLMock[];
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
}

export interface MockDataGenerator<T = any> {
  generate(): T;
  generateMany(count: number): T[];
  generatePaginated(page: number, limit: number, total?: number): {
    data: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

/**
 * MSW Test Helper
 */
export class MSWTestHelper {
  private worker?: SetupWorker;
  private server?: SetupServer;
  private handlers: RequestHandler[] = [];
  private isNode: boolean;
  private activeScenario?: MockScenario;

  constructor(environment: 'browser' | 'node' = 'node') {
    this.isNode = environment === 'node';
  }

  /**
   * Start MSW with initial handlers
   */
  async start(handlers: RequestHandler[] = []): Promise<void> {
    this.handlers = [...handlers];

    if (this.isNode) {
      const { setupServer } = await import('msw/node');
      this.server = setupServer(...this.handlers);
      this.server.listen({
        onUnhandledRequest: 'warn',
      });
    } else {
      const { setupWorker } = await import('msw/browser');
      this.worker = setupWorker(...this.handlers);
      await this.worker.start({
        onUnhandledRequest: 'warn',
      });
    }
  }

  /**
   * Stop MSW
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    if (this.worker) {
      this.worker.stop();
    }
  }

  /**
   * Reset all handlers
   */
  reset(): void {
    if (this.server) {
      this.server.resetHandlers();
    }
    if (this.worker) {
      this.worker.resetHandlers();
    }
    this.handlers = [];
  }

  /**
   * Add new handlers
   */
  use(...handlers: RequestHandler[]): void {
    if (this.server) {
      this.server.use(...handlers);
    }
    if (this.worker) {
      this.worker.use(...handlers);
    }
    this.handlers.push(...handlers);
  }

  /**
   * Create REST API handlers
   */
  createRestHandlers(endpoints: MockEndpoint[]): HttpHandler[] {
    return endpoints.map(endpoint => {
      const method = endpoint.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
      
      return http[method](endpoint.path, async ({ request, params, cookies }) => {
        const config = endpoint.config || {};

        // Handle network errors
        if (config.networkError) {
          throw new Error('Network error');
        }

        // Handle timeouts
        if (config.timeout) {
          await new Promise(() => {}); // Never resolves
        }

        // Calculate delay
        let delay = config.delay;
        if (typeof delay === 'string') {
          delay = delay === 'real' ? Math.random() * 1000 : Infinity;
        }
        if (typeof delay === 'number' && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Generate response
        let response: MockResponse;
        if (typeof endpoint.response === 'function') {
          response = await endpoint.response({ request, params, cookies });
        } else {
          response = endpoint.response;
        }

        // Return MSW response
        return HttpResponse.json(response.data, {
          status: response.status || config.status || 200,
          headers: {
            ...config.headers,
            ...response.headers,
          },
        });
      });
    });
  }

  /**
   * Create GraphQL handlers
   */
  createGraphQLHandlers(mocks: GraphQLMock[], endpoint: string = '/graphql'): GraphQLHandler[] {
    return mocks.map(mock => {
      const handler = mock.operationType === 'query' ? graphql.query :
                     mock.operationType === 'mutation' ? graphql.mutation :
                     graphql.subscription;

      return handler(mock.operationName || '*', async ({ request, variables, cookies }) => {
        const config = mock.config || {};

        // Handle network errors
        if (config.networkError) {
          throw new Error('Network error');
        }

        // Handle delays
        let delay = config.delay;
        if (typeof delay === 'string') {
          delay = delay === 'real' ? Math.random() * 1000 : Infinity;
        }
        if (typeof delay === 'number' && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Generate response
        let response: MockResponse;
        if (typeof mock.response === 'function') {
          response = await mock.response({ request, variables, cookies });
        } else {
          response = mock.response;
        }

        // Return GraphQL response
        return HttpResponse.json({
          data: response.data,
        }, {
          status: response.status || config.status || 200,
          headers: {
            ...config.headers,
            ...response.headers,
          },
        });
      });
    });
  }

  /**
   * Load a mock scenario
   */
  async loadScenario(scenario: MockScenario): Promise<void> {
    // Run setup if provided
    if (scenario.setup) {
      await scenario.setup();
    }

    // Create handlers for the scenario
    const restHandlers = this.createRestHandlers(scenario.endpoints);
    const graphqlHandlers = scenario.graphql ? this.createGraphQLHandlers(scenario.graphql) : [];
    
    // Use the new handlers
    this.use(...restHandlers, ...graphqlHandlers);
    
    this.activeScenario = scenario;
  }

  /**
   * Unload current scenario
   */
  async unloadScenario(): Promise<void> {
    if (this.activeScenario?.teardown) {
      await this.activeScenario.teardown();
    }
    
    this.reset();
    this.activeScenario = undefined;
  }

  /**
   * Create mock data generators
   */
  createDataGenerator<T>(factory: () => T): MockDataGenerator<T> {
    return {
      generate(): T {
        return factory();
      },

      generateMany(count: number): T[] {
        return Array.from({ length: count }, () => factory());
      },

      generatePaginated(page: number, limit: number, total: number = 100) {
        const offset = (page - 1) * limit;
        const data = Array.from({ length: Math.min(limit, total - offset) }, () => factory());
        
        return {
          data,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: offset + limit < total,
            hasPrev: page > 1,
          },
        };
      },
    };
  }

  /**
   * Create common REST endpoints
   */
  createCRUDEndpoints<T>(
    resource: string,
    generator: MockDataGenerator<T>,
    baseUrl: string = '/api'
  ): MockEndpoint[] {
    const items = generator.generateMany(100);
    let nextId = items.length + 1;

    return [
      // GET /api/resource - List with pagination
      {
        method: 'GET',
        path: `${baseUrl}/${resource}`,
        response: ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          
          return {
            data: generator.generatePaginated(page, limit, items.length),
          };
        },
      },

      // GET /api/resource/:id - Get single item
      {
        method: 'GET',
        path: `${baseUrl}/${resource}/:id`,
        response: ({ params }) => {
          const id = params.id as string;
          const item = items.find((item: any) => item.id === id);
          
          if (!item) {
            return {
              data: { error: 'Not found' },
              status: 404,
            };
          }
          
          return { data: item };
        },
      },

      // POST /api/resource - Create new item
      {
        method: 'POST',
        path: `${baseUrl}/${resource}`,
        response: async ({ request }) => {
          const body = await request.json();
          const newItem = { ...generator.generate(), ...body, id: nextId++ };
          items.push(newItem);
          
          return {
            data: newItem,
            status: 201,
          };
        },
      },

      // PUT /api/resource/:id - Update item
      {
        method: 'PUT',
        path: `${baseUrl}/${resource}/:id`,
        response: async ({ request, params }) => {
          const id = params.id as string;
          const body = await request.json();
          const index = items.findIndex((item: any) => item.id === id);
          
          if (index === -1) {
            return {
              data: { error: 'Not found' },
              status: 404,
            };
          }
          
          items[index] = { ...items[index], ...body };
          return { data: items[index] };
        },
      },

      // DELETE /api/resource/:id - Delete item
      {
        method: 'DELETE',
        path: `${baseUrl}/${resource}/:id`,
        response: ({ params }) => {
          const id = params.id as string;
          const index = items.findIndex((item: any) => item.id === id);
          
          if (index === -1) {
            return {
              data: { error: 'Not found' },
              status: 404,
            };
          }
          
          items.splice(index, 1);
          return {
            data: { message: 'Deleted successfully' },
            status: 204,
          };
        },
      },
    ];
  }

  /**
   * Create error simulation endpoints
   */
  createErrorEndpoints(baseUrl: string = '/api/test'): MockEndpoint[] {
    return [
      {
        method: 'GET',
        path: `${baseUrl}/error/400`,
        response: () => ({
          data: { error: 'Bad Request', code: 'INVALID_INPUT' },
          status: 400,
        }),
      },
      {
        method: 'GET',
        path: `${baseUrl}/error/401`,
        response: () => ({
          data: { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          status: 401,
        }),
      },
      {
        method: 'GET',
        path: `${baseUrl}/error/403`,
        response: () => ({
          data: { error: 'Forbidden', code: 'INSUFFICIENT_PERMISSIONS' },
          status: 403,
        }),
      },
      {
        method: 'GET',
        path: `${baseUrl}/error/404`,
        response: () => ({
          data: { error: 'Not Found', code: 'RESOURCE_NOT_FOUND' },
          status: 404,
        }),
      },
      {
        method: 'GET',
        path: `${baseUrl}/error/429`,
        response: () => ({
          data: { error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' },
          status: 429,
          headers: { 'Retry-After': '60' },
        }),
      },
      {
        method: 'GET',
        path: `${baseUrl}/error/500`,
        response: () => ({
          data: { error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
          status: 500,
        }),
      },
      {
        method: 'GET',
        path: `${baseUrl}/network-error`,
        config: { networkError: true },
        response: () => ({ data: null }),
      },
      {
        method: 'GET',
        path: `${baseUrl}/timeout`,
        config: { timeout: true },
        response: () => ({ data: null }),
      },
      {
        method: 'GET',
        path: `${baseUrl}/slow`,
        config: { delay: 5000 },
        response: () => ({ data: { message: 'This was slow' } }),
      },
    ];
  }

  /**
   * Create authentication mock endpoints
   */
  createAuthEndpoints(baseUrl: string = '/api/auth'): MockEndpoint[] {
    const users = [
      { id: 1, email: 'admin@example.com', password: 'admin123', role: 'admin' },
      { id: 2, email: 'user@example.com', password: 'user123', role: 'user' },
    ];

    return [
      {
        method: 'POST',
        path: `${baseUrl}/login`,
        response: async ({ request }) => {
          const { email, password } = await request.json();
          const user = users.find(u => u.email === email && u.password === password);
          
          if (!user) {
            return {
              data: { error: 'Invalid credentials' },
              status: 401,
            };
          }
          
          return {
            data: {
              user: { id: user.id, email: user.email, role: user.role },
              token: `mock-jwt-token-${user.id}`,
              expiresIn: 3600,
            },
          };
        },
      },
      
      {
        method: 'POST',
        path: `${baseUrl}/logout`,
        response: () => ({
          data: { message: 'Logged out successfully' },
        }),
      },
      
      {
        method: 'GET',
        path: `${baseUrl}/me`,
        response: ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
              data: { error: 'Missing or invalid authorization header' },
              status: 401,
            };
          }
          
          const token = authHeader.split(' ')[1];
          const userId = token.split('-').pop();
          const user = users.find(u => u.id.toString() === userId);
          
          if (!user) {
            return {
              data: { error: 'Invalid token' },
              status: 401,
            };
          }
          
          return {
            data: { id: user.id, email: user.email, role: user.role },
          };
        },
      },
    ];
  }

  /**
   * Create file upload mock endpoints
   */
  createFileUploadEndpoints(baseUrl: string = '/api/upload'): MockEndpoint[] {
    return [
      {
        method: 'POST',
        path: `${baseUrl}/single`,
        response: async ({ request }) => {
          // Simulate file processing time
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return {
            data: {
              id: Math.random().toString(36).substr(2, 9),
              filename: 'uploaded-file.jpg',
              size: 1024000,
              url: 'https://example.com/uploads/uploaded-file.jpg',
              mimetype: 'image/jpeg',
            },
            status: 201,
          };
        },
      },
      
      {
        method: 'POST',
        path: `${baseUrl}/multiple`,
        response: async ({ request }) => {
          // Simulate processing multiple files
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const files = [
            {
              id: Math.random().toString(36).substr(2, 9),
              filename: 'file1.jpg',
              size: 1024000,
              url: 'https://example.com/uploads/file1.jpg',
              mimetype: 'image/jpeg',
            },
            {
              id: Math.random().toString(36).substr(2, 9),
              filename: 'file2.png',
              size: 2048000,
              url: 'https://example.com/uploads/file2.png',
              mimetype: 'image/png',
            },
          ];
          
          return {
            data: { files },
            status: 201,
          };
        },
      },
    ];
  }
}

/**
 * Factory functions for common mock scenarios
 */
export const createMSWHelper = (environment: 'browser' | 'node' = 'node'): MSWTestHelper => {
  return new MSWTestHelper(environment);
};

export const createSuccessScenario = (endpoints: MockEndpoint[]): MockScenario => ({
  name: 'Success Scenario',
  description: 'All requests succeed with expected responses',
  endpoints,
});

export const createErrorScenario = (endpoints: MockEndpoint[]): MockScenario => ({
  name: 'Error Scenario',
  description: 'Requests fail with various error conditions',
  endpoints: endpoints.map(endpoint => ({
    ...endpoint,
    response: () => ({
      data: { error: 'Something went wrong' },
      status: 500,
    }),
  })),
});

export const createSlowScenario = (endpoints: MockEndpoint[], delay: number = 3000): MockScenario => ({
  name: 'Slow Response Scenario',
  description: 'All requests are artificially slowed down',
  endpoints: endpoints.map(endpoint => ({
    ...endpoint,
    config: { ...endpoint.config, delay },
  })),
});

export const createNetworkErrorScenario = (endpoints: MockEndpoint[]): MockScenario => ({
  name: 'Network Error Scenario',
  description: 'All requests fail with network errors',
  endpoints: endpoints.map(endpoint => ({
    ...endpoint,
    config: { ...endpoint.config, networkError: true },
  })),
});

/**
 * Common data generators
 */
export const createUserGenerator = (): MockDataGenerator<any> => {
  const generator = new MSWTestHelper().createDataGenerator(() => ({
    id: Math.floor(Math.random() * 10000),
    name: `User ${Math.floor(Math.random() * 1000)}`,
    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
    createdAt: new Date().toISOString(),
    isActive: Math.random() > 0.5,
  }));
  
  return generator;
};

export const createProductGenerator = (): MockDataGenerator<any> => {
  const generator = new MSWTestHelper().createDataGenerator(() => ({
    id: Math.floor(Math.random() * 10000),
    name: `Product ${Math.floor(Math.random() * 1000)}`,
    price: Math.floor(Math.random() * 1000) + 10,
    category: ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)],
    inStock: Math.random() > 0.3,
    createdAt: new Date().toISOString(),
  }));
  
  return generator;
};

export const createOrderGenerator = (): MockDataGenerator<any> => {
  const generator = new MSWTestHelper().createDataGenerator(() => ({
    id: Math.floor(Math.random() * 10000),
    userId: Math.floor(Math.random() * 100),
    total: Math.floor(Math.random() * 500) + 20,
    status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
    items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
      productId: Math.floor(Math.random() * 1000),
      quantity: Math.floor(Math.random() * 3) + 1,
      price: Math.floor(Math.random() * 100) + 10,
    })),
    createdAt: new Date().toISOString(),
  }));
  
  return generator;
};