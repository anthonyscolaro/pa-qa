/**
 * Test Data Generators and Fixtures
 * 
 * This file provides comprehensive test data generators using Faker.js
 * for creating realistic test data for the PA-QA Showcase application.
 * It includes factories for users, posts, comments, and other entities.
 */

import { faker } from '@faker-js/faker'

// Seed faker for consistent test data
faker.seed(12345)

// Type definitions for test data
export interface TestUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'editor'
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface TestPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: TestUser
  tags: string[]
  categories: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
  isPublished: boolean
  featuredImage?: string
  readingTime: number
}

export interface TestComment {
  id: string
  content: string
  author: TestUser
  postId: string
  parentId?: string
  createdAt: string
  updatedAt: string
  isApproved: boolean
}

export interface TestAPIResponse<T = any> {
  data: T
  message: string
  status: 'success' | 'error'
  timestamp: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    pages?: number
  }
}

export interface TestError {
  code: string
  message: string
  details?: string
  timestamp: string
}

/**
 * User data generators
 */
export const userFactory = {
  /**
   * Generate a single user
   */
  create: (overrides: Partial<TestUser> = {}): TestUser => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    role: faker.helpers.arrayElement(['admin', 'user', 'editor']),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    isActive: faker.datatype.boolean({ probability: 0.8 }),
    ...overrides
  }),

  /**
   * Generate multiple users
   */
  createMany: (count: number, overrides: Partial<TestUser> = {}): TestUser[] => {
    return Array.from({ length: count }, () => userFactory.create(overrides))
  },

  /**
   * Generate specific user types
   */
  admin: (overrides: Partial<TestUser> = {}): TestUser => 
    userFactory.create({ role: 'admin', ...overrides }),

  editor: (overrides: Partial<TestUser> = {}): TestUser => 
    userFactory.create({ role: 'editor', ...overrides }),

  regularUser: (overrides: Partial<TestUser> = {}): TestUser => 
    userFactory.create({ role: 'user', ...overrides })
}

/**
 * Post data generators
 */
export const postFactory = {
  /**
   * Generate a single post
   */
  create: (overrides: Partial<TestPost> = {}): TestPost => {
    const title = faker.lorem.sentence()
    const content = faker.lorem.paragraphs(5, '\n\n')
    
    return {
      id: faker.string.uuid(),
      title,
      slug: faker.helpers.slugify(title).toLowerCase(),
      content,
      excerpt: faker.lorem.paragraph(),
      author: userFactory.create(),
      tags: faker.helpers.arrayElements([
        'react', 'nextjs', 'typescript', 'testing', 'vitest', 'playwright',
        'javascript', 'css', 'html', 'web-development', 'frontend', 'backend'
      ], { min: 1, max: 5 }),
      categories: faker.helpers.arrayElements([
        'Technology', 'Tutorial', 'News', 'Review', 'Guide', 'Tips'
      ], { min: 1, max: 3 }),
      publishedAt: faker.date.past().toISOString(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      isPublished: faker.datatype.boolean({ probability: 0.7 }),
      featuredImage: faker.image.url({ width: 1200, height: 630 }),
      readingTime: faker.number.int({ min: 1, max: 15 }),
      ...overrides
    }
  },

  /**
   * Generate multiple posts
   */
  createMany: (count: number, overrides: Partial<TestPost> = {}): TestPost[] => {
    return Array.from({ length: count }, () => postFactory.create(overrides))
  },

  /**
   * Generate published posts
   */
  published: (overrides: Partial<TestPost> = {}): TestPost => 
    postFactory.create({ isPublished: true, ...overrides }),

  /**
   * Generate draft posts
   */
  draft: (overrides: Partial<TestPost> = {}): TestPost => 
    postFactory.create({ isPublished: false, ...overrides })
}

/**
 * Comment data generators
 */
export const commentFactory = {
  /**
   * Generate a single comment
   */
  create: (overrides: Partial<TestComment> = {}): TestComment => ({
    id: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    author: userFactory.create(),
    postId: faker.string.uuid(),
    parentId: faker.datatype.boolean({ probability: 0.3 }) ? faker.string.uuid() : undefined,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    isApproved: faker.datatype.boolean({ probability: 0.9 }),
    ...overrides
  }),

  /**
   * Generate multiple comments
   */
  createMany: (count: number, overrides: Partial<TestComment> = {}): TestComment[] => {
    return Array.from({ length: count }, () => commentFactory.create(overrides))
  }
}

/**
 * API Response generators
 */
export const apiResponseFactory = {
  /**
   * Generate successful API response
   */
  success: <T>(data: T, message = 'Success'): TestAPIResponse<T> => ({
    data,
    message,
    status: 'success',
    timestamp: new Date().toISOString()
  }),

  /**
   * Generate paginated API response
   */
  paginated: <T>(
    data: T[],
    page = 1,
    limit = 10,
    total?: number
  ): TestAPIResponse<T[]> => {
    const totalCount = total || data.length
    const totalPages = Math.ceil(totalCount / limit)
    
    return {
      data,
      message: 'Success',
      status: 'success',
      timestamp: new Date().toISOString(),
      meta: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    }
  },

  /**
   * Generate error API response
   */
  error: (message = 'An error occurred', code = 'GENERIC_ERROR'): TestAPIResponse => ({
    data: null,
    message,
    status: 'error',
    timestamp: new Date().toISOString()
  })
}

/**
 * Error generators
 */
export const errorFactory = {
  /**
   * Generate generic error
   */
  generic: (overrides: Partial<TestError> = {}): TestError => ({
    code: 'GENERIC_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Generate validation error
   */
  validation: (field: string, message?: string): TestError => ({
    code: 'VALIDATION_ERROR',
    message: message || `Validation failed for field: ${field}`,
    details: `The field '${field}' is invalid`,
    timestamp: new Date().toISOString()
  }),

  /**
   * Generate network error
   */
  network: (): TestError => ({
    code: 'NETWORK_ERROR',
    message: 'Network request failed',
    details: 'Unable to connect to the server',
    timestamp: new Date().toISOString()
  }),

  /**
   * Generate authentication error
   */
  auth: (): TestError => ({
    code: 'AUTH_ERROR',
    message: 'Authentication required',
    details: 'Please log in to access this resource',
    timestamp: new Date().toISOString()
  }),

  /**
   * Generate authorization error
   */
  permission: (): TestError => ({
    code: 'PERMISSION_ERROR',
    message: 'Insufficient permissions',
    details: 'You do not have permission to perform this action',
    timestamp: new Date().toISOString()
  })
}

/**
 * Form data generators
 */
export const formDataFactory = {
  /**
   * Generate contact form data
   */
  contactForm: () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: faker.lorem.sentence(),
    message: faker.lorem.paragraphs(2)
  }),

  /**
   * Generate search form data
   */
  searchForm: () => ({
    query: faker.lorem.words(3),
    category: faker.helpers.arrayElement(['all', 'posts', 'pages', 'users']),
    sortBy: faker.helpers.arrayElement(['relevance', 'date', 'title'])
  }),

  /**
   * Generate newsletter subscription data
   */
  newsletterForm: () => ({
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    interests: faker.helpers.arrayElements([
      'web-development', 'react', 'typescript', 'testing', 'performance'
    ], { min: 1, max: 3 })
  })
}

/**
 * Test scenarios for different application states
 */
export const testScenarios = {
  /**
   * Empty state scenarios
   */
  emptyStates: {
    noPosts: () => ({ posts: [], total: 0 }),
    noComments: () => ({ comments: [], total: 0 }),
    noUsers: () => ({ users: [], total: 0 }),
    noSearchResults: () => ({ results: [], total: 0, query: faker.lorem.word() })
  },

  /**
   * Loading state scenarios
   */
  loadingStates: {
    posts: () => ({ isLoading: true, posts: [] }),
    comments: () => ({ isLoading: true, comments: [] }),
    user: () => ({ isLoading: true, user: null })
  },

  /**
   * Error state scenarios
   */
  errorStates: {
    networkError: () => ({ error: errorFactory.network(), data: null }),
    authError: () => ({ error: errorFactory.auth(), data: null }),
    validationError: () => ({ error: errorFactory.validation('email'), data: null })
  },

  /**
   * Success state scenarios
   */
  successStates: {
    postsList: (count = 10) => ({
      data: postFactory.createMany(count),
      total: count,
      isLoading: false,
      error: null
    }),
    userProfile: () => ({
      data: userFactory.create(),
      isLoading: false,
      error: null
    })
  }
}

/**
 * Mock API endpoints data
 */
export const mockAPIData = {
  // GET /api/posts
  posts: {
    list: () => apiResponseFactory.paginated(postFactory.createMany(10)),
    single: () => apiResponseFactory.success(postFactory.create()),
    empty: () => apiResponseFactory.paginated([])
  },

  // GET /api/users
  users: {
    list: () => apiResponseFactory.paginated(userFactory.createMany(5)),
    profile: () => apiResponseFactory.success(userFactory.create()),
    empty: () => apiResponseFactory.paginated([])
  },

  // GET /api/comments
  comments: {
    list: (postId: string) => apiResponseFactory.paginated(
      commentFactory.createMany(5, { postId })
    ),
    empty: () => apiResponseFactory.paginated([])
  }
}

// Export default data for quick access
export const defaultTestData = {
  user: userFactory.create(),
  admin: userFactory.admin(),
  post: postFactory.create(),
  publishedPost: postFactory.published(),
  draftPost: postFactory.draft(),
  comment: commentFactory.create(),
  posts: postFactory.createMany(10),
  users: userFactory.createMany(5),
  comments: commentFactory.createMany(8)
}