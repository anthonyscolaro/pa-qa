// MSW (Mock Service Worker) v2.0 handlers for API mocking
import { http, HttpResponse, delay } from 'msw';

// Example API base URL
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

// MSW v2.0 handlers with modern patterns
export const handlers = [
  // User authentication
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    // Simulate network delay
    await delay(100);
    
    // Mock successful login
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: body.email,
          name: 'Test User',
          role: 'user'
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      });
    }
    
    // Mock failed login
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),
  
  // Get user profile
  http.get(`${API_URL}/users/:id`, async ({ params }) => {
    const { id } = params;
    
    await delay(50);
    
    return HttpResponse.json({
      id,
      email: 'user@example.com',
      name: 'John Doe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg',
      createdAt: new Date().toISOString()
    });
  }),
  
  // List items with pagination
  http.get(`${API_URL}/items`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    await delay(100);
    
    const items = Array.from({ length: limit }, (_, i) => ({
      id: String((page - 1) * limit + i + 1),
      name: `Item ${(page - 1) * limit + i + 1}`,
      description: 'Lorem ipsum dolor sit amet',
      price: Math.random() * 100,
      createdAt: new Date().toISOString()
    }));
    
    return HttpResponse.json({
      items,
      pagination: {
        page,
        limit,
        total: 100,
        totalPages: 10
      }
    });
  }),
  
  // Create item
  http.post(`${API_URL}/items`, async ({ request }) => {
    const body = await request.json() as { name: string; description: string; price: number };
    
    await delay(150);
    
    // Simulate validation error
    if (!body.name || body.name.length < 3) {
      return HttpResponse.json(
        { 
          error: 'Validation failed',
          details: { name: 'Name must be at least 3 characters' }
        },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      id: String(Date.now()),
      ...body,
      createdAt: new Date().toISOString()
    }, { status: 201 });
  }),
  
  // Update item
  http.patch(`${API_URL}/items/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    
    await delay(100);
    
    return HttpResponse.json({
      id,
      ...body,
      updatedAt: new Date().toISOString()
    });
  }),
  
  // Delete item
  http.delete(`${API_URL}/items/:id`, async ({ params }) => {
    const { id } = params;
    
    await delay(100);
    
    // Simulate not found
    if (id === 'not-found') {
      return HttpResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return new HttpResponse(null, { status: 204 });
  }),
  
  // File upload
  http.post(`${API_URL}/upload`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    await delay(200);
    
    if (!file) {
      return HttpResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      url: `https://storage.example.com/${file.name}`,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    });
  }),
  
  // WebSocket-like endpoint (REST simulation)
  http.get(`${API_URL}/notifications`, async () => {
    await delay(50);
    
    return HttpResponse.json({
      notifications: [
        {
          id: '1',
          type: 'info',
          message: 'New message received',
          timestamp: new Date().toISOString()
        }
      ]
    });
  }),
  
  // Health check
  http.get(`${API_URL}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }),
  
  // Simulate network error
  http.get(`${API_URL}/error`, () => {
    return HttpResponse.error();
  }),
  
  // Simulate timeout
  http.get(`${API_URL}/timeout`, async () => {
    await delay(30000);
    return HttpResponse.json({ data: 'This will timeout' });
  })
];

// Handler for testing error scenarios
export const errorHandlers = [
  http.get(`${API_URL}/*`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),
  
  http.post(`${API_URL}/*`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  })
];