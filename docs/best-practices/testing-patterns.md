# Testing Patterns & Best Practices - PA-QA Framework

## 🎯 Overview

This guide outlines proven testing patterns, best practices, and anti-patterns to follow when using the PA-QA framework. These practices ensure consistent, maintainable, and effective test suites across all project types.

## 📋 Core Testing Principles

### The Testing Pyramid

```
                    /\
                   /  \
                  /    \
                 /  E2E  \     <- Few (5-10%)
                /________\
               /          \
              /Integration \   <- Some (20-30%)
             /______________\
            /                \
           /       Unit       \  <- Many (60-70%)
          /____________________\
```

**Implementation Strategy:**
- **70% Unit Tests**: Fast, isolated, comprehensive
- **20% Integration Tests**: Component interactions, API contracts
- **10% E2E Tests**: Critical user journeys, smoke tests

### Test Quality Metrics

```typescript
// Quality thresholds for PA-QA projects
const QualityStandards = {
  coverage: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70
  },
  performance: {
    testExecutionTime: '<30s for unit tests',
    feedbackLoop: '<5min for full pipeline',
    e2eTestTime: '<10min per test suite'
  },
  reliability: {
    flakyTestTolerance: '<2%',
    testSuccessRate: '>95%',
    repeatability: '100%'
  }
}
```

## 🧪 Unit Testing Patterns

### 1. AAA Pattern (Arrange, Act, Assert)

```typescript
// ✅ Good: Clear AAA structure
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    }
    const mockRepository = createMockRepository()
    const userService = new UserService(mockRepository)
    
    // Act
    const result = await userService.createUser(userData)
    
    // Assert
    expect(result).toEqual({
      id: expect.any(Number),
      email: 'test@example.com',
      name: 'Test User',
      createdAt: expect.any(Date)
    })
    expect(mockRepository.save).toHaveBeenCalledWith(userData)
  })
})

// ❌ Bad: Mixed concerns, unclear structure
it('user creation', async () => {
  const user = await userService.createUser({email: 'test@example.com'})
  expect(user).toBeTruthy()
  expect(await userService.findById(user.id)).toEqual(user)
})
```

### 2. Test Data Builders

```typescript
// ✅ Good: Flexible test data creation
class UserBuilder {
  private userData: Partial<User> = {}
  
  withEmail(email: string): UserBuilder {
    this.userData.email = email
    return this
  }
  
  withRole(role: UserRole): UserBuilder {
    this.userData.role = role
    return this
  }
  
  withActive(active: boolean = true): UserBuilder {
    this.userData.isActive = active
    return this
  }
  
  build(): User {
    return {
      id: faker.number.int(),
      email: this.userData.email || faker.internet.email(),
      name: this.userData.name || faker.person.fullName(),
      role: this.userData.role || UserRole.USER,
      isActive: this.userData.isActive ?? true,
      createdAt: new Date(),
      ...this.userData
    }
  }
}

// Usage in tests
it('should handle admin users differently', () => {
  const adminUser = new UserBuilder()
    .withRole(UserRole.ADMIN)
    .withEmail('admin@company.com')
    .build()
  
  const result = userService.getPermissions(adminUser)
  
  expect(result).toContain('ADMIN_ACCESS')
})

// ❌ Bad: Hardcoded test data
it('admin test', () => {
  const user = {
    id: 1,
    email: 'admin@company.com',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2023-01-01')
  }
  // Test becomes brittle and hard to modify
})
```

### 3. Mock Strategies

```typescript
// ✅ Good: Strategic mocking with clear interfaces
interface PaymentGateway {
  processPayment(amount: number, token: string): Promise<PaymentResult>
}

class PaymentService {
  constructor(private gateway: PaymentGateway) {}
  
  async processOrder(order: Order): Promise<OrderResult> {
    try {
      const paymentResult = await this.gateway.processPayment(
        order.total,
        order.paymentToken
      )
      return { success: true, transactionId: paymentResult.id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Test with mock
it('should handle payment failures gracefully', async () => {
  // Arrange
  const mockGateway: jest.Mocked<PaymentGateway> = {
    processPayment: jest.fn().mockRejectedValue(new Error('Payment failed'))
  }
  const paymentService = new PaymentService(mockGateway)
  const order = new OrderBuilder().withTotal(100).build()
  
  // Act
  const result = await paymentService.processOrder(order)
  
  // Assert
  expect(result).toEqual({
    success: false,
    error: 'Payment failed'
  })
})

// ❌ Bad: Over-mocking internal implementation
it('bad mocking example', () => {
  jest.spyOn(userService, 'validateEmail')  // Mocking internal method
  jest.spyOn(userService, 'hashPassword')   // Too much implementation detail
  jest.spyOn(database, 'query')             // Mocking too low-level
})
```

### 4. Error Testing Patterns

```typescript
// ✅ Good: Comprehensive error scenario testing
describe('UserRegistration - Error Handling', () => {
  it('should throw ValidationError for invalid email', async () => {
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      '',
      null,
      undefined
    ]
    
    for (const email of invalidEmails) {
      await expect(
        userService.register({ email, password: 'validPassword123' })
      ).rejects.toThrow(ValidationError)
    }
  })
  
  it('should handle database connection failures', async () => {
    // Arrange
    const dbError = new Error('Connection timeout')
    mockRepository.save.mockRejectedValue(dbError)
    
    // Act & Assert
    await expect(
      userService.register(validUserData)
    ).rejects.toThrow('User registration failed')
    
    // Verify error logging
    expect(logger.error).toHaveBeenCalledWith(
      'Database error during user registration:',
      dbError
    )
  })
})

// ❌ Bad: Generic error testing
it('handles errors', async () => {
  expect(() => userService.register({})).toThrow()  // Too generic
})
```

## 🔗 Integration Testing Patterns

### 1. Database Testing with Transactions

```python
# ✅ Good: Clean database testing with transactions
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class TestUserRepository:
    @pytest.fixture(autouse=True)
    def setup_database(self, db_session):
        """Setup clean database state for each test."""
        self.session = db_session
        
        # Start transaction
        self.transaction = self.session.begin()
        
        yield
        
        # Rollback transaction
        self.transaction.rollback()
    
    async def test_create_user_persists_correctly(self):
        # Arrange
        user_data = UserFactory.build()
        repository = UserRepository(self.session)
        
        # Act
        created_user = await repository.create(user_data)
        await self.session.commit()
        
        # Assert
        retrieved_user = await repository.get_by_id(created_user.id)
        assert retrieved_user.email == user_data.email
        assert retrieved_user.created_at is not None
    
    async def test_user_relationships_are_loaded(self):
        # Arrange
        user = await UserFactory.create_async(self.session)
        profile = await ProfileFactory.create_async(
            self.session, 
            user_id=user.id
        )
        await self.session.commit()
        
        # Act
        user_with_profile = await repository.get_with_profile(user.id)
        
        # Assert
        assert user_with_profile.profile is not None
        assert user_with_profile.profile.id == profile.id

# ❌ Bad: No transaction management, test pollution
class BadTestExample:
    def test_user_creation(self):
        user = UserRepository().create({'email': 'test@example.com'})
        assert user.id is not None
        # User remains in database, affecting other tests
```

### 2. API Contract Testing

```typescript
// ✅ Good: Comprehensive API contract testing
describe('User API Contract', () => {
  let app: FastifyInstance
  let testDb: TestDatabase
  
  beforeAll(async () => {
    testDb = await createTestDatabase()
    app = await createTestApp({ database: testDb })
  })
  
  afterAll(async () => {
    await testDb.cleanup()
  })
  
  describe('POST /users', () => {
    it('should create user with valid schema', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        age: 25
      }
      
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: userData
      })
      
      // Assert
      expect(response.statusCode).toBe(201)
      
      const body = response.json()
      expect(body).toMatchSchema({
        type: 'object',
        required: ['id', 'email', 'name', 'createdAt'],
        properties: {
          id: { type: 'number' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1 },
          age: { type: 'number', minimum: 0 },
          createdAt: { type: 'string', format: 'date-time' }
        }
      })
    })
    
    it('should return 400 for invalid data', async () => {
      const invalidCases = [
        { data: {}, expectedErrors: ['email', 'name'] },
        { data: { email: 'invalid' }, expectedErrors: ['email', 'name'] },
        { data: { email: 'test@example.com', name: '' }, expectedErrors: ['name'] },
        { data: { email: 'test@example.com', name: 'Valid', age: -1 }, expectedErrors: ['age'] }
      ]
      
      for (const { data, expectedErrors } of invalidCases) {
        const response = await app.inject({
          method: 'POST',
          url: '/users',
          payload: data
        })
        
        expect(response.statusCode).toBe(400)
        
        const body = response.json()
        expectedErrors.forEach(field => {
          expect(body.errors).toContain(
            expect.objectContaining({ field })
          )
        })
      }
    })
  })
})

// ❌ Bad: Incomplete contract testing
describe('API Tests', () => {
  it('creates user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ email: 'test@example.com' })
    
    expect(response.status).toBe(200)  // Wrong status code
    // Missing schema validation, error cases, etc.
  })
})
```

### 3. Service Integration Testing

```python
# ✅ Good: Testing service interactions with proper mocking
class TestEmailNotificationService:
    @pytest.fixture
    def mock_email_client(self):
        return Mock(spec=EmailClient)
    
    @pytest.fixture
    def mock_template_service(self):
        return Mock(spec=TemplateService)
    
    @pytest.fixture
    def notification_service(self, mock_email_client, mock_template_service):
        return EmailNotificationService(
            email_client=mock_email_client,
            template_service=mock_template_service
        )
    
    async def test_send_welcome_email_integration(
        self, 
        notification_service, 
        mock_email_client,
        mock_template_service
    ):
        # Arrange
        user = UserFactory.build(email='new@example.com', name='New User')
        template_content = '<h1>Welcome {{name}}!</h1>'
        rendered_content = '<h1>Welcome New User!</h1>'
        
        mock_template_service.render.return_value = rendered_content
        mock_email_client.send.return_value = EmailResult(
            success=True, 
            message_id='msg-123'
        )
        
        # Act
        result = await notification_service.send_welcome_email(user)
        
        # Assert
        assert result.success is True
        assert result.message_id == 'msg-123'
        
        # Verify service interactions
        mock_template_service.render.assert_called_once_with(
            'welcome_email.html',
            context={'name': 'New User', 'email': 'new@example.com'}
        )
        
        mock_email_client.send.assert_called_once_with(
            to='new@example.com',
            subject='Welcome to Our Platform!',
            html_content=rendered_content
        )
    
    async def test_handles_email_service_failure(
        self,
        notification_service,
        mock_email_client,
        mock_template_service
    ):
        # Arrange
        user = UserFactory.build()
        mock_template_service.render.return_value = '<h1>Welcome!</h1>'
        mock_email_client.send.side_effect = EmailServiceError('SMTP timeout')
        
        # Act
        result = await notification_service.send_welcome_email(user)
        
        # Assert
        assert result.success is False
        assert 'SMTP timeout' in result.error
        
        # Verify retry logic was triggered
        assert mock_email_client.send.call_count == 3  # Original + 2 retries

# ❌ Bad: Testing implementation details, no proper mocking
class BadIntegrationTest:
    def test_email_sending(self):
        service = EmailNotificationService()
        # Testing against real email service
        result = service.send_email('test@example.com', 'Test')
        assert result  # Real email sent, affects external systems
```

## 🌐 End-to-End Testing Patterns

### 1. Page Object Model

```typescript
// ✅ Good: Well-structured Page Object Model
class LoginPage {
  constructor(private page: Page) {}
  
  // Locators
  private readonly emailInput = this.page.locator('[data-testid="email"]')
  private readonly passwordInput = this.page.locator('[data-testid="password"]')
  private readonly loginButton = this.page.locator('[data-testid="login-submit"]')
  private readonly errorMessage = this.page.locator('[data-testid="error-message"]')
  
  // Actions
  async navigateTo(): Promise<void> {
    await this.page.goto('/login')
    await this.waitForPageLoad()
  }
  
  async loginWith(credentials: LoginCredentials): Promise<void> {
    await this.emailInput.fill(credentials.email)
    await this.passwordInput.fill(credentials.password)
    await this.loginButton.click()
  }
  
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent()
    }
    return null
  }
  
  // Assertions
  async shouldShowError(expectedMessage: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible()
    await expect(this.errorMessage).toHaveText(expectedMessage)
  }
  
  async shouldRedirectToDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/dashboard/)
  }
  
  // Private helpers
  private async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
    await expect(this.loginButton).toBeVisible()
  }
}

// Usage in tests
test('successful login redirects to dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page)
  const dashboardPage = new DashboardPage(page)
  
  await loginPage.navigateTo()
  await loginPage.loginWith({
    email: 'user@example.com',
    password: 'validPassword123'
  })
  
  await loginPage.shouldRedirectToDashboard()
  await dashboardPage.shouldShowWelcomeMessage('Welcome back!')
})

// ❌ Bad: Direct locator usage in tests
test('bad login test', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'user@example.com')  // Fragile selectors
  await page.fill('#password', 'password')
  await page.click('button')  // Ambiguous selector
  await page.waitForSelector('.dashboard')  // Implementation detail
})
```

### 2. Test Data Management

```typescript
// ✅ Good: Proper test data management
class E2ETestDataManager {
  private static instance: E2ETestDataManager
  private testUsers: Map<string, TestUser> = new Map()
  
  static getInstance(): E2ETestDataManager {
    if (!this.instance) {
      this.instance = new E2ETestDataManager()
    }
    return this.instance
  }
  
  async createTestUser(userType: UserType = 'standard'): Promise<TestUser> {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: faker.person.fullName(),
      role: userType
    }
    
    // Create user via API
    const response = await apiClient.post('/users', userData)
    const user = { ...userData, id: response.data.id }
    
    this.testUsers.set(user.email, user)
    return user
  }
  
  async getOrCreateUser(userType: UserType): Promise<TestUser> {
    const existingUser = Array.from(this.testUsers.values())
      .find(user => user.role === userType)
    
    if (existingUser) {
      return existingUser
    }
    
    return await this.createTestUser(userType)
  }
  
  async cleanup(): Promise<void> {
    for (const user of this.testUsers.values()) {
      try {
        await apiClient.delete(`/users/${user.id}`)
      } catch (error) {
        console.warn(`Failed to cleanup user ${user.email}:`, error)
      }
    }
    this.testUsers.clear()
  }
}

// Test setup
test.beforeEach(async ({ page }) => {
  const dataManager = E2ETestDataManager.getInstance()
  const testUser = await dataManager.getOrCreateUser('standard')
  
  // Login user before each test
  await page.goto('/login')
  await page.fill('[data-testid="email"]', testUser.email)
  await page.fill('[data-testid="password"]', testUser.password)
  await page.click('[data-testid="login-submit"]')
  await page.waitForURL('**/dashboard')
})

test.afterAll(async () => {
  await E2ETestDataManager.getInstance().cleanup()
})

// ❌ Bad: Hardcoded test data, no cleanup
test('user workflow', async ({ page }) => {
  // Using hardcoded data
  await page.goto('/login')
  await page.fill('#email', 'hardcoded@example.com')  // May not exist
  await page.fill('#password', 'hardcoded123')
  // No cleanup, data persists between test runs
})
```

### 3. Visual Testing Patterns

```typescript
// ✅ Good: Strategic visual testing
class VisualTestHelper {
  constructor(private page: Page, private testInfo: TestInfo) {}
  
  async compareFullPage(
    name: string, 
    options: ScreenshotOptions = {}
  ): Promise<void> {
    // Wait for page to be stable
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForFunction(() => {
      const images = Array.from(document.images)
      return images.every(img => img.complete)
    })
    
    // Hide dynamic content
    await this.hideDynamicContent()
    
    // Take screenshot
    await expect(this.page).toHaveScreenshot(`${name}-full-page.png`, {
      fullPage: true,
      animations: 'disabled',
      ...options
    })
  }
  
  async compareComponent(
    selector: string, 
    name: string,
    options: ScreenshotOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector)
    await expect(element).toBeVisible()
    
    await expect(element).toHaveScreenshot(`${name}-component.png`, {
      animations: 'disabled',
      ...options
    })
  }
  
  private async hideDynamicContent(): Promise<void> {
    // Hide timestamps, random IDs, etc.
    await this.page.addStyleTag({
      content: `
        [data-testid="timestamp"],
        [data-testid="random-id"],
        .animation,
        .loading {
          visibility: hidden !important;
        }
      `
    })
  }
}

// Usage
test('product page visual regression', async ({ page }, testInfo) => {
  const visual = new VisualTestHelper(page, testInfo)
  
  await page.goto('/products/test-product')
  
  // Compare key components
  await visual.compareComponent('[data-testid="product-hero"]', 'product-hero')
  await visual.compareComponent('[data-testid="product-details"]', 'product-details')
  await visual.compareComponent('[data-testid="related-products"]', 'related-products')
  
  // Compare full page on desktop
  await visual.compareFullPage('product-page-desktop')
  
  // Compare mobile view
  await page.setViewportSize({ width: 375, height: 667 })
  await visual.compareFullPage('product-page-mobile')
})

// ❌ Bad: Screenshots without stability checks
test('bad visual test', async ({ page }) => {
  await page.goto('/products/1')
  await expect(page).toHaveScreenshot()  // May capture loading states
})
```

## 🔄 Test Maintenance Patterns

### 1. Test Organization

```typescript
// ✅ Good: Well-organized test structure
describe('UserManagement', () => {
  describe('User Creation', () => {
    describe('with valid data', () => {
      it('should create user successfully', () => {})
      it('should send welcome email', () => {})
      it('should assign default role', () => {})
    })
    
    describe('with invalid data', () => {
      it('should reject invalid email format', () => {})
      it('should reject weak passwords', () => {})
      it('should reject duplicate emails', () => {})
    })
    
    describe('with edge cases', () => {
      it('should handle very long names', () => {})
      it('should handle special characters in email', () => {})
      it('should handle database connection failures', () => {})
    })
  })
  
  describe('User Authentication', () => {
    // Authentication-specific tests
  })
  
  describe('User Profile Updates', () => {
    // Profile update tests
  })
})

// ❌ Bad: Flat, disorganized structure
describe('User Tests', () => {
  it('creates user', () => {})
  it('invalid email', () => {})
  it('login works', () => {})
  it('profile update', () => {})
  it('password reset', () => {})
  // Hard to understand test relationships
})
```

### 2. Test Helpers and Utilities

```typescript
// ✅ Good: Reusable test utilities
class TestUtils {
  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    
    throw new Error(`Condition not met within ${timeout}ms`)
  }
  
  static createMockResponse<T>(
    data: T,
    options: { status?: number; delay?: number } = {}
  ): Promise<MockResponse<T>> {
    const response = {
      data,
      status: options.status || 200,
      headers: {},
      ok: true
    }
    
    if (options.delay) {
      return new Promise(resolve => 
        setTimeout(() => resolve(response), options.delay)
      )
    }
    
    return Promise.resolve(response)
  }
  
  static async cleanupTestData(identifiers: string[]): Promise<void> {
    for (const id of identifiers) {
      try {
        await testDataManager.cleanup(id)
      } catch (error) {
        console.warn(`Failed to cleanup ${id}:`, error)
      }
    }
  }
}

// Usage
it('should handle async operations', async () => {
  const mockApi = jest.fn().mockResolvedValue(
    TestUtils.createMockResponse(userData, { delay: 100 })
  )
  
  const promise = userService.fetchUser('123')
  
  await TestUtils.waitForCondition(
    async () => mockApi.mock.calls.length > 0
  )
  
  const result = await promise
  expect(result).toBeDefined()
})

// ❌ Bad: Duplicate code in every test
it('waits for condition', async () => {
  let attempts = 0
  while (attempts < 50) {  // Duplicated waiting logic
    if (condition()) break
    await new Promise(r => setTimeout(r, 100))
    attempts++
  }
  // Repeated in many tests
})
```

### 3. Test Configuration Management

```typescript
// ✅ Good: Centralized test configuration
interface TestConfig {
  environment: 'local' | 'ci' | 'staging'
  database: DatabaseConfig
  api: ApiConfig
  browser: BrowserConfig
  timeouts: TimeoutConfig
}

class TestConfigManager {
  private static config: TestConfig
  
  static getConfig(): TestConfig {
    if (!this.config) {
      this.config = this.loadConfig()
    }
    return this.config
  }
  
  private static loadConfig(): TestConfig {
    const env = process.env.NODE_ENV || 'local'
    
    const baseConfig: TestConfig = {
      environment: env as any,
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'test_db'
      },
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.API_TIMEOUT || '5000')
      },
      browser: {
        headless: process.env.CI === 'true',
        viewport: { width: 1280, height: 720 },
        slowMo: env === 'local' ? 100 : 0
      },
      timeouts: {
        test: env === 'ci' ? 30000 : 10000,
        page: env === 'ci' ? 60000 : 30000,
        element: 5000
      }
    }
    
    // Environment-specific overrides
    if (env === 'ci') {
      baseConfig.browser.headless = true
      baseConfig.timeouts.test = 60000
    }
    
    return baseConfig
  }
}

// Usage in test setup
beforeAll(() => {
  const config = TestConfigManager.getConfig()
  jest.setTimeout(config.timeouts.test)
})

// ❌ Bad: Hardcoded values scattered throughout tests
it('api test', async () => {
  const response = await fetch('http://localhost:3000/api/users', {
    timeout: 5000  // Hardcoded, inconsistent across tests
  })
})
```

## 🚀 Performance Testing Patterns

### 1. Load Testing Strategy

```python
# ✅ Good: Structured load testing with Locust
from locust import HttpUser, task, between
import random

class UserBehaviorSimulation(HttpUser):
    wait_time = between(1, 3)  # Realistic user pauses
    
    def on_start(self):
        """Setup user session."""
        self.login()
        self.user_data = self.create_test_data()
    
    def login(self):
        """Authenticate user."""
        response = self.client.post("/auth/login", json={
            "email": f"loadtest{random.randint(1, 1000)}@example.com",
            "password": "LoadTest123!"
        })
        
        if response.status_code == 200:
            self.auth_token = response.json()["access_token"]
            self.client.headers.update({
                "Authorization": f"Bearer {self.auth_token}"
            })
    
    @task(3)  # 30% of user actions
    def browse_products(self):
        """Simulate product browsing."""
        with self.client.get("/products", catch_response=True) as response:
            if response.status_code == 200:
                products = response.json()
                if len(products) > 0:
                    # Browse to product detail
                    product_id = random.choice(products)["id"]
                    self.client.get(f"/products/{product_id}")
                response.success()
            else:
                response.failure(f"Failed to load products: {response.status_code}")
    
    @task(2)  # 20% of user actions
    def search_products(self):
        """Simulate product search."""
        search_terms = ["laptop", "phone", "tablet", "headphones"]
        term = random.choice(search_terms)
        
        with self.client.get(f"/search?q={term}", name="/search") as response:
            if response.elapsed.total_seconds() > 2.0:
                response.failure("Search took too long")
    
    @task(1)  # 10% of user actions
    def add_to_cart(self):
        """Simulate adding items to cart."""
        # Get random product
        products_response = self.client.get("/products")
        if products_response.status_code == 200:
            products = products_response.json()
            if products:
                product = random.choice(products)
                self.client.post("/cart/add", json={
                    "product_id": product["id"],
                    "quantity": random.randint(1, 3)
                })
    
    def create_test_data(self):
        """Create any test data needed for this user session."""
        return {
            "session_id": f"session_{random.randint(10000, 99999)}",
            "user_type": random.choice(["premium", "standard", "guest"])
        }

# Performance thresholds
class PerformanceThresholds:
    MAX_RESPONSE_TIME = 2000  # milliseconds
    MAX_95TH_PERCENTILE = 5000  # milliseconds
    MIN_REQUESTS_PER_SECOND = 100
    MAX_ERROR_RATE = 0.01  # 1%

# ❌ Bad: Unrealistic load testing
class BadLoadTest(HttpUser):
    @task
    def hit_endpoint(self):
        self.client.get("/")  # No realistic user behavior, no assertions
```

### 2. Database Performance Testing

```python
# ✅ Good: Database performance testing
import pytest
import time
from sqlalchemy import text

class TestDatabasePerformance:
    
    @pytest.mark.performance
    async def test_user_query_performance(self, db_session):
        """Test that user queries meet performance requirements."""
        # Create test data
        users = await self.create_test_users(db_session, count=10000)
        
        # Test simple lookup
        start_time = time.time()
        user = await db_session.get(User, users[0].id)
        lookup_time = time.time() - start_time
        
        assert lookup_time < 0.01, f"User lookup took {lookup_time:.3f}s, expected < 0.01s"
        
        # Test complex query
        start_time = time.time()
        active_users = await db_session.execute(
            text("""
                SELECT u.*, p.first_name, p.last_name 
                FROM users u 
                JOIN profiles p ON u.id = p.user_id 
                WHERE u.is_active = true 
                AND u.created_at > :date
                ORDER BY u.created_at DESC 
                LIMIT 100
            """),
            {"date": datetime.now() - timedelta(days=30)}
        )
        query_time = time.time() - start_time
        
        assert query_time < 0.1, f"Complex query took {query_time:.3f}s, expected < 0.1s"
    
    @pytest.mark.performance
    async def test_bulk_insert_performance(self, db_session):
        """Test bulk insert operations."""
        user_data = [
            UserFactory.build_dict() for _ in range(1000)
        ]
        
        start_time = time.time()
        await db_session.execute(
            insert(User),
            user_data
        )
        await db_session.commit()
        insert_time = time.time() - start_time
        
        # Should insert 1000 users in less than 1 second
        assert insert_time < 1.0, f"Bulk insert took {insert_time:.3f}s, expected < 1.0s"
        
        # Verify all users were inserted
        count = await db_session.scalar(
            select(func.count(User.id))
        )
        assert count >= 1000

# ❌ Bad: No performance assertions
def test_query():
    users = session.query(User).all()  # No timing, no thresholds
    assert len(users) > 0
```

## 🔒 Security Testing Patterns

### 1. Authentication Testing

```typescript
// ✅ Good: Comprehensive authentication testing
describe('Authentication Security', () => {
  describe('Password Security', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'admin',
        'password123',
        'abc123',
        '111111'
      ]
      
      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/auth/register')
          .send({
            email: 'test@example.com',
            password: password
          })
        
        expect(response.status).toBe(400)
        expect(response.body.errors).toContain(
          expect.objectContaining({
            field: 'password',
            code: 'WEAK_PASSWORD'
          })
        )
      }
    })
    
    it('should hash passwords properly', async () => {
      const plainPassword = 'SecurePassword123!'
      
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        })
      
      expect(response.status).toBe(201)
      
      // Verify password is not stored in plain text
      const user = await User.findOne({ email: 'test@example.com' })
      expect(user.hashedPassword).not.toBe(plainPassword)
      expect(user.hashedPassword).toMatch(/^\$2[aby]\$/)  // bcrypt format
    })
  })
  
  describe('JWT Token Security', () => {
    it('should include proper claims in JWT', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send(validCredentials)
      
      const token = loginResponse.body.accessToken
      const decoded = jwt.decode(token) as any
      
      // Verify required claims
      expect(decoded.sub).toBeDefined()  // Subject (user ID)
      expect(decoded.iat).toBeDefined()  // Issued at
      expect(decoded.exp).toBeDefined()  // Expiration
      expect(decoded.aud).toBe('your-app')  // Audience
      expect(decoded.iss).toBe('your-app-auth')  // Issuer
      
      // Verify expiration is reasonable (not too long)
      const now = Math.floor(Date.now() / 1000)
      const maxExpiration = now + (24 * 60 * 60)  // 24 hours
      expect(decoded.exp).toBeLessThanOrEqual(maxExpiration)
    })
    
    it('should reject tampered tokens', async () => {
      const validToken = await getValidToken()
      const tamperedToken = validToken.slice(0, -5) + 'XXXXX'
      
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
      
      expect(response.status).toBe(401)
      expect(response.body.error).toBe('INVALID_TOKEN')
    })
  })
  
  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
      
      // Make multiple failed login attempts
      const attempts = []
      for (let i = 0; i < 6; i++) {
        attempts.push(
          request(app)
            .post('/auth/login')
            .send(invalidCredentials)
        )
      }
      
      const responses = await Promise.all(attempts)
      
      // First 5 should return 401 (invalid credentials)
      responses.slice(0, 5).forEach(response => {
        expect(response.status).toBe(401)
      })
      
      // 6th should be rate limited
      expect(responses[5].status).toBe(429)
      expect(responses[5].body.error).toBe('RATE_LIMIT_EXCEEDED')
    })
  })
})

// ❌ Bad: Basic authentication testing without security focus
describe('Auth', () => {
  it('login works', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'password' })
    
    expect(response.status).toBe(200)
    // Missing security validations
  })
})
```

### 2. Input Validation Testing

```typescript
// ✅ Good: Comprehensive input validation testing
describe('Input Validation Security', () => {
  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in search', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'; UPDATE users SET password='hacked' --",
        "' OR '1'='1",
        "'; EXEC xp_cmdshell('cmd.exe') --"
      ]
      
      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .get('/search')
          .query({ q: payload })
        
        // Should not crash or return sensitive data
        expect(response.status).not.toBe(500)
        
        if (response.status === 200) {
          // Verify no sensitive information leaked
          const responseText = JSON.stringify(response.body).toLowerCase()
          expect(responseText).not.toContain('password')
          expect(responseText).not.toContain('hash')
          expect(responseText).not.toContain('token')
        }
      }
    })
  })
  
  describe('XSS Protection', () => {
    it('should sanitize user input', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        "javascript:alert('XSS')",
        '<img src="x" onerror="alert(\'XSS\')" />',
        '{{constructor.constructor("alert(\'XSS\')")()}}'
      ]
      
      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/comments')
          .send({
            content: payload,
            postId: testPost.id
          })
          .set('Authorization', `Bearer ${userToken}`)
        
        if (response.status === 201) {
          const comment = response.body
          
          // Verify script tags are escaped or removed
          expect(comment.content).not.toContain('<script>')
          expect(comment.content).not.toContain('javascript:')
          expect(comment.content).not.toContain('onerror=')
        }
      }
    })
  })
  
  describe('File Upload Security', () => {
    it('should validate file types', async () => {
      const maliciousFiles = [
        { name: 'malware.exe', type: 'application/octet-stream' },
        { name: 'script.php', type: 'application/x-php' },
        { name: 'shell.sh', type: 'application/x-sh' },
        { name: 'image.jpg.exe', type: 'image/jpeg' }  // Double extension
      ]
      
      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/upload')
          .attach('file', Buffer.from('malicious content'), file.name)
          .set('Authorization', `Bearer ${userToken}`)
        
        expect(response.status).toBe(400)
        expect(response.body.error).toContain('INVALID_FILE_TYPE')
      }
    })
    
    it('should limit file size', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024)  // 11MB
      
      const response = await request(app)
        .post('/upload')
        .attach('file', largeFile, 'large.jpg')
        .set('Authorization', `Bearer ${userToken}`)
      
      expect(response.status).toBe(413)  // Payload Too Large
      expect(response.body.error).toBe('FILE_TOO_LARGE')
    })
  })
})

// ❌ Bad: No security testing
describe('File Upload', () => {
  it('uploads file', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('file', 'test.jpg')
    
    expect(response.status).toBe(200)
    // No validation of file type, size, or content
  })
})
```

## 📊 Test Metrics and Reporting

### 1. Custom Test Reporters

```typescript
// ✅ Good: Custom test reporter for PA-QA metrics
class PAQATestReporter {
  private testResults: TestResult[] = []
  private startTime: number = Date.now()
  
  onTestStart(test: Test): void {
    console.log(`🔍 Starting: ${test.fullName}`)
  }
  
  onTestComplete(test: Test, result: TestResult): void {
    this.testResults.push(result)
    
    const status = result.status === 'passed' ? '✅' : '❌'
    const duration = result.duration || 0
    
    console.log(`${status} ${test.fullName} (${duration}ms)`)
    
    // Track slow tests
    if (duration > 1000) {
      console.warn(`⚠️ Slow test detected: ${test.fullName} took ${duration}ms`)
    }
  }
  
  onRunComplete(): void {
    const duration = Date.now() - this.startTime
    const stats = this.calculateStats()
    
    console.log('\n📊 PA-QA Test Summary:')
    console.log(`Total Tests: ${stats.total}`)
    console.log(`Passed: ${stats.passed} (${stats.passRate}%)`)
    console.log(`Failed: ${stats.failed}`)
    console.log(`Skipped: ${stats.skipped}`)
    console.log(`Duration: ${duration}ms`)
    console.log(`Average Test Time: ${stats.averageTime}ms`)
    console.log(`Slowest Test: ${stats.slowestTest.name} (${stats.slowestTest.duration}ms)`)
    
    // Generate detailed report
    this.generateDetailedReport(stats)
  }
  
  private calculateStats() {
    const total = this.testResults.length
    const passed = this.testResults.filter(r => r.status === 'passed').length
    const failed = this.testResults.filter(r => r.status === 'failed').length
    const skipped = this.testResults.filter(r => r.status === 'skipped').length
    
    const durations = this.testResults
      .map(r => r.duration || 0)
      .filter(d => d > 0)
    
    const averageTime = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0
    
    const slowestTest = this.testResults
      .reduce((slowest, current) => 
        (current.duration || 0) > (slowest.duration || 0) ? current : slowest
      )
    
    return {
      total,
      passed,
      failed,
      skipped,
      passRate: Math.round((passed / total) * 100),
      averageTime,
      slowestTest: {
        name: slowestTest.fullName,
        duration: slowestTest.duration || 0
      }
    }
  }
  
  private generateDetailedReport(stats: any): void {
    const report = {
      timestamp: new Date().toISOString(),
      framework: 'PA-QA',
      summary: stats,
      failedTests: this.testResults
        .filter(r => r.status === 'failed')
        .map(r => ({
          name: r.fullName,
          error: r.failureMessage,
          duration: r.duration
        })),
      slowTests: this.testResults
        .filter(r => (r.duration || 0) > 1000)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 10)
        .map(r => ({
          name: r.fullName,
          duration: r.duration
        }))
    }
    
    // Save to file for CI/CD consumption
    fs.writeFileSync('pa-qa-test-report.json', JSON.stringify(report, null, 2))
  }
}

// Usage in Jest config
module.exports = {
  reporters: [
    'default',
    ['<rootDir>/test-utils/PAQATestReporter.js', {}]
  ]
}

// ❌ Bad: No custom reporting, missing metrics
// Just using default Jest output without PA-QA specific insights
```

## 🎯 Framework-Specific Best Practices

### React Testing Best Practices

```typescript
// ✅ Good: React testing with proper patterns
describe('UserProfile Component', () => {
  it('should render user information correctly', () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg'
    }
    
    render(<UserProfile user={user} />)
    
    // Test what the user sees, not implementation details
    expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /john doe/i })).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    )
  })
  
  it('should handle user interactions correctly', async () => {
    const onEdit = jest.fn()
    const user = userFactory.build()
    
    render(<UserProfile user={user} onEdit={onEdit} />)
    
    const editButton = screen.getByRole('button', { name: /edit profile/i })
    await userEvent.click(editButton)
    
    expect(onEdit).toHaveBeenCalledWith(user.id)
  })
  
  it('should show loading state while fetching data', () => {
    render(<UserProfile user={null} loading={true} />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

// ❌ Bad: Testing implementation details
describe('Bad Component Test', () => {
  it('updates state', () => {
    const wrapper = shallow(<UserProfile />)
    wrapper.setState({ name: 'New Name' })  // Testing state directly
    expect(wrapper.state('name')).toBe('New Name')  // Implementation detail
  })
})
```

### FastAPI Testing Best Practices

```python
# ✅ Good: FastAPI testing with proper async handling
class TestUserAPI:
    @pytest.mark.asyncio
    async def test_create_user_endpoint(self, async_client: AsyncClient):
        # Arrange
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "SecurePassword123!"
        }
        
        # Act
        response = await async_client.post("/users", json=user_data)
        
        # Assert
        assert response.status_code == 201
        
        response_data = response.json()
        assert response_data["email"] == user_data["email"]
        assert response_data["name"] == user_data["name"]
        assert "password" not in response_data  # Security check
        assert "id" in response_data
        assert "created_at" in response_data
    
    @pytest.mark.asyncio
    async def test_get_user_by_id(self, async_client: AsyncClient, test_user: User):
        # Act
        response = await async_client.get(f"/users/{test_user.id}")
        
        # Assert
        assert response.status_code == 200
        
        user_data = response.json()
        assert user_data["id"] == test_user.id
        assert user_data["email"] == test_user.email
    
    @pytest.mark.asyncio
    async def test_authentication_required(self, async_client: AsyncClient):
        # Act
        response = await async_client.get("/users/me")
        
        # Assert
        assert response.status_code == 401
        assert response.json()["detail"] == "Not authenticated"

# ❌ Bad: Sync testing for async code
def test_bad_async():
    response = client.get("/users")  # Not awaiting async operations
    assert response.status_code == 200  # May not test actual async behavior
```

### WordPress Testing Best Practices

```php
// ✅ Good: WordPress testing with proper setup
class TestCustomPostType extends WP_UnitTestCase {
    
    public function setUp(): void {
        parent::setUp();
        
        // Register custom post type for testing
        register_post_type('test_product', [
            'public' => true,
            'supports' => ['title', 'editor', 'custom-fields']
        ]);
    }
    
    public function tearDown(): void {
        // Clean up custom posts
        $posts = get_posts(['post_type' => 'test_product', 'numberposts' => -1]);
        foreach ($posts as $post) {
            wp_delete_post($post->ID, true);
        }
        
        parent::tearDown();
    }
    
    public function test_custom_post_type_creation() {
        // Arrange
        $post_data = [
            'post_title' => 'Test Product',
            'post_content' => 'Product description',
            'post_type' => 'test_product',
            'post_status' => 'publish'
        ];
        
        // Act
        $post_id = wp_insert_post($post_data);
        
        // Assert
        $this->assertIsInt($post_id);
        $this->assertGreaterThan(0, $post_id);
        
        $created_post = get_post($post_id);
        $this->assertEquals('Test Product', $created_post->post_title);
        $this->assertEquals('test_product', $created_post->post_type);
        $this->assertEquals('publish', $created_post->post_status);
    }
    
    public function test_custom_meta_fields() {
        // Arrange
        $post_id = $this->factory()->post->create([
            'post_type' => 'test_product'
        ]);
        
        // Act
        add_post_meta($post_id, 'product_price', '99.99');
        add_post_meta($post_id, 'product_sku', 'TEST-SKU-001');
        
        // Assert
        $this->assertEquals('99.99', get_post_meta($post_id, 'product_price', true));
        $this->assertEquals('TEST-SKU-001', get_post_meta($post_id, 'product_sku', true));
    }
    
    public function test_wp_query_integration() {
        // Arrange
        $published_post = $this->factory()->post->create([
            'post_type' => 'test_product',
            'post_status' => 'publish'
        ]);
        
        $draft_post = $this->factory()->post->create([
            'post_type' => 'test_product',
            'post_status' => 'draft'
        ]);
        
        // Act
        $query = new WP_Query([
            'post_type' => 'test_product',
            'post_status' => 'publish'
        ]);
        
        // Assert
        $this->assertEquals(1, $query->found_posts);
        $this->assertEquals($published_post, $query->posts[0]->ID);
    }
}

// ❌ Bad: No proper setup/teardown, potential test pollution
class BadWordPressTest extends WP_UnitTestCase {
    public function test_post_creation() {
        $post_id = wp_insert_post(['post_title' => 'Test']);
        $this->assertGreaterThan(0, $post_id);
        // Post remains in database, affects other tests
    }
}
```

## 🎯 Anti-Patterns to Avoid

### 1. Common Testing Anti-Patterns

```typescript
// ❌ Bad: Testing implementation details
it('calls internal method', () => {
  const spy = jest.spyOn(userService, 'validateInput')
  userService.createUser(userData)
  expect(spy).toHaveBeenCalled()  // Testing how, not what
})

// ✅ Good: Testing behavior
it('rejects invalid user data', () => {
  expect(() => userService.createUser(invalidData))
    .toThrow('Invalid email format')  // Testing what happens
})

// ❌ Bad: Overly complex test setup
it('complex test', async () => {
  const mockA = jest.fn()
  const mockB = jest.fn()
  const mockC = jest.fn()
  // 50 lines of setup...
  const result = await service.method()
  expect(result).toBeDefined()  // Weak assertion
})

// ✅ Good: Focused, simple tests
it('calculates total correctly', () => {
  const items = [{ price: 10 }, { price: 20 }]
  const total = calculateTotal(items)
  expect(total).toBe(30)
})

// ❌ Bad: Testing multiple things at once
it('user workflow', async () => {
  // Creates user
  const user = await userService.create(userData)
  expect(user.id).toBeDefined()
  
  // Updates user
  const updated = await userService.update(user.id, updateData)
  expect(updated.name).toBe('New Name')
  
  // Deletes user
  await userService.delete(user.id)
  const deleted = await userService.findById(user.id)
  expect(deleted).toBeNull()
})

// ✅ Good: One responsibility per test
describe('UserService', () => {
  it('creates user with valid data', async () => {
    const user = await userService.create(userData)
    expect(user.id).toBeDefined()
  })
  
  it('updates user name', async () => {
    const user = await createTestUser()
    const updated = await userService.update(user.id, { name: 'New Name' })
    expect(updated.name).toBe('New Name')
  })
  
  it('deletes user', async () => {
    const user = await createTestUser()
    await userService.delete(user.id)
    const deleted = await userService.findById(user.id)
    expect(deleted).toBeNull()
  })
})

// ❌ Bad: Brittle selectors in E2E tests
await page.click('#content > div > form > div:nth-child(3) > button')

// ✅ Good: Semantic selectors
await page.click('[data-testid="submit-button"]')
// or
await page.click('button[type="submit"]')

// ❌ Bad: Hardcoded waits
await page.waitForTimeout(3000)  // Flaky timing

// ✅ Good: Conditional waits
await page.waitForSelector('[data-testid="success-message"]')
await page.waitForLoadState('networkidle')
```

### 2. Performance Anti-Patterns

```typescript
// ❌ Bad: Slow test setup in every test
describe('User Tests', () => {
  beforeEach(async () => {
    // Recreating entire database schema
    await recreateDatabase()
    await seedWithLargeDataset()  // Slow operation repeated
  })
})

// ✅ Good: Efficient test setup
describe('User Tests', () => {
  beforeAll(async () => {
    // One-time setup
    await ensureDatabaseSchema()
  })
  
  beforeEach(async () => {
    // Fast cleanup and minimal setup
    await cleanupTestData()
    await createMinimalTestData()
  })
})

// ❌ Bad: Excessive mocking that slows tests
beforeEach(() => {
  jest.clearAllMocks()
  // Mocking 50+ functions every test
  jest.mock('./service1')
  jest.mock('./service2')
  // ... many more mocks
})

// ✅ Good: Strategic mocking
beforeEach(() => {
  // Only mock external dependencies
  jest.clearAllMocks()
  mockEmailService.reset()
  mockPaymentGateway.reset()
})
```

## 📝 Summary

This testing patterns guide provides a comprehensive foundation for building maintainable, reliable, and effective test suites with the PA-QA framework. Key takeaways:

1. **Follow the Testing Pyramid**: Emphasize unit tests, supplement with integration tests, and use E2E tests sparingly
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
3. **Keep Tests Simple and Focused**: One responsibility per test, clear AAA structure
4. **Use Proper Test Data Management**: Builders, factories, and proper cleanup
5. **Implement Security Testing**: Authentication, input validation, and vulnerability scanning
6. **Monitor Test Performance**: Track metrics, identify slow tests, optimize execution
7. **Maintain Test Quality**: Regular refactoring, avoiding anti-patterns, proper organization

By following these patterns and best practices, your test suites will be more reliable, maintainable, and provide better confidence in your software quality.

## 📚 Additional Resources

- [PA-QA Setup Guides](/docs/setup-guides/)
- [Multi-Agent Workflow Guide](/docs/best-practices/multi-agent-workflow.md)
- [Troubleshooting Guide](/docs/troubleshooting/common-issues.md)
- [FAQ](/docs/faq.md)

---

**Remember**: Good tests are an investment in your codebase's future. They should give you confidence to refactor, deploy, and extend your application safely.