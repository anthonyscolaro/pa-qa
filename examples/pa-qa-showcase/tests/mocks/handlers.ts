/**
 * MSW (Mock Service Worker) Handlers
 * 
 * This file defines mock API handlers for the PA-QA Showcase application.
 * It uses MSW v2.0 to intercept HTTP requests and return mock responses
 * for testing purposes.
 */

import { http, HttpResponse } from 'msw'
import { 
  postFactory, 
  userFactory, 
  commentFactory,
  apiResponseFactory,
  errorFactory,
  mockAPIData
} from '../fixtures/test-data'

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/**
 * Posts API Handlers
 */
const postsHandlers = [
  // GET /api/posts - List posts with pagination
  http.get(`${API_BASE_URL}/posts`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search')
    const category = url.searchParams.get('category')
    const published = url.searchParams.get('published')

    // Simulate search functionality
    let posts = postFactory.createMany(50)
    
    if (search) {
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.content.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category) {
      posts = posts.filter(post => 
        post.categories.includes(category)
      )
    }

    if (published !== null) {
      const isPublished = published === 'true'
      posts = posts.filter(post => post.isPublished === isPublished)
    }

    // Paginate results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPosts = posts.slice(startIndex, endIndex)

    return HttpResponse.json(
      apiResponseFactory.paginated(paginatedPosts, page, limit, posts.length)
    )
  }),

  // GET /api/posts/[id] - Get single post
  http.get(`${API_BASE_URL}/posts/:id`, ({ params }) => {
    const { id } = params
    
    if (id === 'not-found') {
      return HttpResponse.json(
        apiResponseFactory.error('Post not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    const post = postFactory.create({ id: id as string })
    return HttpResponse.json(apiResponseFactory.success(post))
  }),

  // POST /api/posts - Create new post
  http.post(`${API_BASE_URL}/posts`, async ({ request }) => {
    const body = await request.json()
    
    // Simulate validation errors
    if (!body.title) {
      return HttpResponse.json(
        apiResponseFactory.error('Title is required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    const newPost = postFactory.create({
      title: body.title,
      content: body.content,
      isPublished: body.isPublished || false
    })

    return HttpResponse.json(
      apiResponseFactory.success(newPost, 'Post created successfully'),
      { status: 201 }
    )
  }),

  // PUT /api/posts/[id] - Update post
  http.put(`${API_BASE_URL}/posts/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()

    const updatedPost = postFactory.create({
      id: id as string,
      ...body,
      updatedAt: new Date().toISOString()
    })

    return HttpResponse.json(
      apiResponseFactory.success(updatedPost, 'Post updated successfully')
    )
  }),

  // DELETE /api/posts/[id] - Delete post
  http.delete(`${API_BASE_URL}/posts/:id`, ({ params }) => {
    const { id } = params
    
    return HttpResponse.json(
      apiResponseFactory.success(
        { id, deleted: true },
        'Post deleted successfully'
      )
    )
  })
]

/**
 * Users API Handlers
 */
const usersHandlers = [
  // GET /api/users - List users
  http.get(`${API_BASE_URL}/users`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const role = url.searchParams.get('role')

    let users = userFactory.createMany(25)
    
    if (role) {
      users = users.filter(user => user.role === role)
    }

    // Paginate results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = users.slice(startIndex, endIndex)

    return HttpResponse.json(
      apiResponseFactory.paginated(paginatedUsers, page, limit, users.length)
    )
  }),

  // GET /api/users/[id] - Get single user
  http.get(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const { id } = params
    
    if (id === 'not-found') {
      return HttpResponse.json(
        apiResponseFactory.error('User not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    const user = userFactory.create({ id: id as string })
    return HttpResponse.json(apiResponseFactory.success(user))
  }),

  // GET /api/users/me - Get current user profile
  http.get(`${API_BASE_URL}/users/me`, () => {
    const currentUser = userFactory.create({
      id: 'current-user',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    })

    return HttpResponse.json(apiResponseFactory.success(currentUser))
  }),

  // PUT /api/users/[id] - Update user
  http.put(`${API_BASE_URL}/users/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()

    const updatedUser = userFactory.create({
      id: id as string,
      ...body,
      updatedAt: new Date().toISOString()
    })

    return HttpResponse.json(
      apiResponseFactory.success(updatedUser, 'User updated successfully')
    )
  })
]

/**
 * Comments API Handlers
 */
const commentsHandlers = [
  // GET /api/posts/[postId]/comments - Get comments for a post
  http.get(`${API_BASE_URL}/posts/:postId/comments`, ({ params, request }) => {
    const { postId } = params
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const comments = commentFactory.createMany(20, { postId: postId as string })
    
    // Paginate results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedComments = comments.slice(startIndex, endIndex)

    return HttpResponse.json(
      apiResponseFactory.paginated(paginatedComments, page, limit, comments.length)
    )
  }),

  // POST /api/posts/[postId]/comments - Create comment
  http.post(`${API_BASE_URL}/posts/:postId/comments`, async ({ params, request }) => {
    const { postId } = params
    const body = await request.json()
    
    if (!body.content) {
      return HttpResponse.json(
        apiResponseFactory.error('Comment content is required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    const newComment = commentFactory.create({
      postId: postId as string,
      content: body.content,
      parentId: body.parentId
    })

    return HttpResponse.json(
      apiResponseFactory.success(newComment, 'Comment created successfully'),
      { status: 201 }
    )
  }),

  // PUT /api/comments/[id] - Update comment
  http.put(`${API_BASE_URL}/comments/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()

    const updatedComment = commentFactory.create({
      id: id as string,
      ...body,
      updatedAt: new Date().toISOString()
    })

    return HttpResponse.json(
      apiResponseFactory.success(updatedComment, 'Comment updated successfully')
    )
  }),

  // DELETE /api/comments/[id] - Delete comment
  http.delete(`${API_BASE_URL}/comments/:id`, ({ params }) => {
    const { id } = params
    
    return HttpResponse.json(
      apiResponseFactory.success(
        { id, deleted: true },
        'Comment deleted successfully'
      )
    )
  })
]

/**
 * Authentication API Handlers
 */
const authHandlers = [
  // POST /api/auth/login - User login
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return HttpResponse.json(
        apiResponseFactory.error('Email and password are required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    if (email === 'wrong@example.com' || password === 'wrongpassword') {
      return HttpResponse.json(
        apiResponseFactory.error('Invalid credentials', 'AUTH_ERROR'),
        { status: 401 }
      )
    }

    const user = userFactory.create({ email })
    const token = 'mock-jwt-token-12345'

    return HttpResponse.json(
      apiResponseFactory.success({
        user,
        token,
        expiresIn: 3600
      }, 'Login successful')
    )
  }),

  // POST /api/auth/register - User registration
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return HttpResponse.json(
        apiResponseFactory.error('All fields are required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    if (email === 'taken@example.com') {
      return HttpResponse.json(
        apiResponseFactory.error('Email already exists', 'VALIDATION_ERROR'),
        { status: 409 }
      )
    }

    const newUser = userFactory.create({ name, email })
    const token = 'mock-jwt-token-67890'

    return HttpResponse.json(
      apiResponseFactory.success({
        user: newUser,
        token,
        expiresIn: 3600
      }, 'Registration successful'),
      { status: 201 }
    )
  }),

  // POST /api/auth/logout - User logout
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json(
      apiResponseFactory.success(null, 'Logout successful')
    )
  }),

  // POST /api/auth/refresh - Refresh token
  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    const token = 'mock-refreshed-jwt-token-99999'
    
    return HttpResponse.json(
      apiResponseFactory.success({
        token,
        expiresIn: 3600
      }, 'Token refreshed successfully')
    )
  })
]

/**
 * Search API Handlers
 */
const searchHandlers = [
  // GET /api/search - Global search
  http.get(`${API_BASE_URL}/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''
    const type = url.searchParams.get('type') || 'all'

    if (!query) {
      return HttpResponse.json(
        apiResponseFactory.error('Search query is required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    const results = {
      posts: type === 'all' || type === 'posts' 
        ? postFactory.createMany(5).map(post => ({ ...post, type: 'post' }))
        : [],
      users: type === 'all' || type === 'users'
        ? userFactory.createMany(3).map(user => ({ ...user, type: 'user' }))
        : []
    }

    const allResults = [...results.posts, ...results.users]

    return HttpResponse.json(
      apiResponseFactory.success({
        query,
        results: allResults,
        total: allResults.length,
        breakdown: {
          posts: results.posts.length,
          users: results.users.length
        }
      })
    )
  })
]

/**
 * Analytics API Handlers
 */
const analyticsHandlers = [
  // GET /api/analytics/overview - Get analytics overview
  http.get(`${API_BASE_URL}/analytics/overview`, () => {
    return HttpResponse.json(
      apiResponseFactory.success({
        totalPosts: 150,
        totalUsers: 1250,
        totalComments: 3450,
        totalViews: 45000,
        trends: {
          postsGrowth: 12.5,
          usersGrowth: 8.3,
          commentsGrowth: 15.7,
          viewsGrowth: 22.1
        }
      })
    )
  })
]

/**
 * Error Simulation Handlers
 */
const errorHandlers = [
  // Simulate network errors
  http.get(`${API_BASE_URL}/test/network-error`, () => {
    return HttpResponse.error()
  }),

  // Simulate server errors
  http.get(`${API_BASE_URL}/test/server-error`, () => {
    return HttpResponse.json(
      apiResponseFactory.error('Internal server error', 'SERVER_ERROR'),
      { status: 500 }
    )
  }),

  // Simulate timeout
  http.get(`${API_BASE_URL}/test/timeout`, async () => {
    await new Promise(resolve => setTimeout(resolve, 10000))
    return HttpResponse.json(apiResponseFactory.success({}))
  }),

  // Simulate slow response
  http.get(`${API_BASE_URL}/test/slow`, async () => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return HttpResponse.json(
      apiResponseFactory.success({ message: 'Slow response' })
    )
  })
]

/**
 * All handlers combined
 */
export const handlers = [
  ...postsHandlers,
  ...usersHandlers,
  ...commentsHandlers,
  ...authHandlers,
  ...searchHandlers,
  ...analyticsHandlers,
  ...errorHandlers
]