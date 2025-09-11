// Mock Service Worker (MSW) handlers for demo purposes
// These handlers simulate API responses for testing components

export interface MockResponse {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  status: number;
  delay?: number;
  response: any;
  headers?: Record<string, string>;
}

export interface MockHandler {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  method: string;
  path: string;
  status: number;
  delay: number;
  response: any;
  headers: Record<string, string>;
}

// Default mock handlers for common API patterns
export const defaultMockHandlers: MockHandler[] = [
  {
    id: 'get-users',
    name: 'Get Users',
    description: 'Fetch list of users',
    enabled: true,
    method: 'GET',
    path: '/api/users',
    status: 200,
    delay: 500,
    response: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        createdAt: '2024-01-15T10:30:00Z',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'user',
        createdAt: '2024-01-16T14:20:00Z',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'moderator',
        createdAt: '2024-01-17T09:45:00Z',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      }
    ],
    headers: {
      'Content-Type': 'application/json',
      'X-Total-Count': '3'
    }
  },
  {
    id: 'get-user-by-id',
    name: 'Get User by ID',
    description: 'Fetch a specific user by their ID',
    enabled: true,
    method: 'GET',
    path: '/api/users/:id',
    status: 200,
    delay: 300,
    response: {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
      createdAt: '2024-01-15T10:30:00Z',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      profile: {
        bio: 'Full-stack developer with 10+ years of experience',
        location: 'San Francisco, CA',
        website: 'https://johndoe.dev',
        social: {
          twitter: '@johndoe',
          github: 'johndoe',
          linkedin: 'johndoe'
        }
      },
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      }
    },
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    id: 'create-user',
    name: 'Create User',
    description: 'Create a new user account',
    enabled: true,
    method: 'POST',
    path: '/api/users',
    status: 201,
    delay: 800,
    response: {
      id: 4,
      name: 'New User',
      email: 'new.user@example.com',
      role: 'user',
      createdAt: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
    },
    headers: {
      'Content-Type': 'application/json',
      'Location': '/api/users/4'
    }
  },
  {
    id: 'update-user',
    name: 'Update User',
    description: 'Update an existing user',
    enabled: true,
    method: 'PUT',
    path: '/api/users/:id',
    status: 200,
    delay: 600,
    response: {
      id: 1,
      name: 'John Doe Updated',
      email: 'john.doe.updated@example.com',
      role: 'admin',
      updatedAt: new Date().toISOString()
    },
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    id: 'delete-user',
    name: 'Delete User',
    description: 'Delete a user account',
    enabled: false,
    method: 'DELETE',
    path: '/api/users/:id',
    status: 204,
    delay: 400,
    response: null,
    headers: {}
  },
  {
    id: 'get-posts',
    name: 'Get Posts',
    description: 'Fetch blog posts or articles',
    enabled: true,
    method: 'GET',
    path: '/api/posts',
    status: 200,
    delay: 700,
    response: [
      {
        id: 1,
        title: 'Getting Started with Testing',
        slug: 'getting-started-with-testing',
        excerpt: 'Learn the fundamentals of software testing and quality assurance.',
        content: 'Testing is a crucial part of software development...',
        author: {
          id: 1,
          name: 'John Doe',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        publishedAt: '2024-01-15T10:30:00Z',
        tags: ['testing', 'qa', 'beginner'],
        status: 'published'
      },
      {
        id: 2,
        title: 'Advanced Test Automation Strategies',
        slug: 'advanced-test-automation-strategies',
        excerpt: 'Explore advanced techniques for automated testing workflows.',
        content: 'As your application grows, so does the complexity...',
        author: {
          id: 2,
          name: 'Jane Smith',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
        },
        publishedAt: '2024-01-16T14:20:00Z',
        tags: ['automation', 'ci-cd', 'advanced'],
        status: 'published'
      }
    ],
    headers: {
      'Content-Type': 'application/json',
      'X-Total-Count': '2'
    }
  },
  {
    id: 'auth-login',
    name: 'User Login',
    description: 'Authenticate user credentials',
    enabled: true,
    method: 'POST',
    path: '/api/auth/login',
    status: 200,
    delay: 1000,
    response: {
      success: true,
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin'
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresIn: 3600
    },
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure'
    }
  },
  {
    id: 'auth-logout',
    name: 'User Logout',
    description: 'Logout current user session',
    enabled: true,
    method: 'POST',
    path: '/api/auth/logout',
    status: 200,
    delay: 300,
    response: {
      success: true,
      message: 'Logged out successfully'
    },
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    id: 'error-server',
    name: 'Server Error',
    description: 'Simulate a server error for testing error handling',
    enabled: false,
    method: 'GET',
    path: '/api/error',
    status: 500,
    delay: 200,
    response: {
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    },
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    id: 'error-not-found',
    name: 'Not Found Error',
    description: 'Simulate a 404 error for testing',
    enabled: false,
    method: 'GET',
    path: '/api/not-found',
    status: 404,
    delay: 100,
    response: {
      error: 'Not Found',
      message: 'The requested resource was not found.',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    },
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    id: 'upload-file',
    name: 'File Upload',
    description: 'Handle file upload with progress simulation',
    enabled: true,
    method: 'POST',
    path: '/api/upload',
    status: 200,
    delay: 2000,
    response: {
      success: true,
      file: {
        id: 'file-123',
        name: 'example.pdf',
        size: 1024576,
        type: 'application/pdf',
        url: 'https://example.com/files/example.pdf',
        uploadedAt: new Date().toISOString()
      }
    },
    headers: {
      'Content-Type': 'application/json'
    }
  }
];

// Utility functions for working with mock handlers

export function createMockHandler(
  method: string,
  path: string,
  response: any,
  options: {
    status?: number;
    delay?: number;
    headers?: Record<string, string>;
    name?: string;
    description?: string;
    enabled?: boolean;
  } = {}
): MockHandler {
  return {
    id: `${method.toLowerCase()}-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name: options.name || `${method} ${path}`,
    description: options.description || `Handle ${method} requests to ${path}`,
    enabled: options.enabled ?? true,
    method,
    path,
    status: options.status || 200,
    delay: options.delay || 500,
    response,
    headers: options.headers || { 'Content-Type': 'application/json' }
  };
}

export function matchPath(pattern: string, path: string): boolean {
  // Convert path pattern to regex (simple implementation)
  const regexPattern = pattern
    .replace(/:\w+/g, '([^/]+)') // Replace :param with capture group
    .replace(/\*/g, '.*'); // Replace * with any characters
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

export function extractPathParams(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  if (patternParts.length !== pathParts.length) {
    return params;
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    
    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    }
  }
  
  return params;
}

export function findMatchingHandler(
  handlers: MockHandler[],
  method: string,
  path: string
): MockHandler | null {
  return handlers.find(handler => 
    handler.enabled &&
    handler.method === method &&
    matchPath(handler.path, path)
  ) || null;
}

export function simulateRequest(
  handler: MockHandler,
  requestPath: string,
  requestBody?: any
): Promise<{
  status: number;
  headers: Record<string, string>;
  data: any;
  params: Record<string, string>;
}> {
  return new Promise((resolve) => {
    const params = extractPathParams(handler.path, requestPath);
    
    // Simulate network delay
    setTimeout(() => {
      let responseData = handler.response;
      
      // For dynamic responses, you could modify the response based on request
      if (typeof responseData === 'function') {
        responseData = responseData({ params, body: requestBody });
      }
      
      // Add timestamps to responses that have them
      if (responseData && typeof responseData === 'object' && responseData.timestamp) {
        responseData = {
          ...responseData,
          timestamp: new Date().toISOString()
        };
      }
      
      resolve({
        status: handler.status,
        headers: handler.headers,
        data: responseData,
        params
      });
    }, handler.delay);
  });
}

// Preset handler collections for different scenarios

export const authHandlers = defaultMockHandlers.filter(h => 
  h.path.includes('/auth')
);

export const userHandlers = defaultMockHandlers.filter(h => 
  h.path.includes('/users')
);

export const contentHandlers = defaultMockHandlers.filter(h => 
  h.path.includes('/posts') || h.path.includes('/articles')
);

export const errorHandlers = defaultMockHandlers.filter(h => 
  h.path.includes('/error') || h.status >= 400
);

export const uploadHandlers = defaultMockHandlers.filter(h => 
  h.path.includes('/upload')
);

// Configuration presets

export const mockConfigurations = {
  development: {
    name: 'Development',
    description: 'Standard development API responses',
    handlers: defaultMockHandlers.filter(h => !h.path.includes('/error'))
  },
  
  testing: {
    name: 'Testing',
    description: 'Responses optimized for testing scenarios',
    handlers: defaultMockHandlers.map(h => ({ ...h, delay: 100 })) // Faster responses
  },
  
  errorScenarios: {
    name: 'Error Scenarios',
    description: 'Test error handling and edge cases',
    handlers: [
      ...errorHandlers.map(h => ({ ...h, enabled: true })),
      ...defaultMockHandlers.filter(h => h.status >= 400)
    ]
  },
  
  slowNetwork: {
    name: 'Slow Network',
    description: 'Simulate slow network conditions',
    handlers: defaultMockHandlers.map(h => ({ ...h, delay: h.delay * 5 }))
  },
  
  minimal: {
    name: 'Minimal',
    description: 'Essential endpoints only',
    handlers: [
      ...authHandlers,
      ...userHandlers.slice(0, 2) // Only get users and get user by id
    ]
  }
};

export default {
  defaultMockHandlers,
  createMockHandler,
  matchPath,
  extractPathParams,
  findMatchingHandler,
  simulateRequest,
  mockConfigurations,
  authHandlers,
  userHandlers,
  contentHandlers,
  errorHandlers,
  uploadHandlers
};