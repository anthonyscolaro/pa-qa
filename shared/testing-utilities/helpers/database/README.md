# Database Testing Utilities

A comprehensive collection of database testing utilities for the PA-QA framework, supporting multiple database systems with transaction isolation, seeding, performance monitoring, and cleanup mechanisms.

## 🎯 Overview

This collection provides database testing utilities that work across PostgreSQL, MySQL, and MongoDB, with support for both synchronous and asynchronous operations. The utilities ensure test isolation, provide realistic test data generation, and include performance monitoring capabilities.

## 📦 Components

### Core Utilities

- **`transaction-helpers.ts`** - Database transaction management and isolation
- **`seeders.ts`** - Data seeding with relationship management
- **`migration-helpers.ts`** - Migration testing and validation
- **`connection-pool.ts`** - Connection pool management and monitoring
- **`cleanup-utilities.ts`** - Test cleanup and teardown mechanisms
- **`performance-monitor.ts`** - Performance tracking and analysis
- **`db-factories.ts`** - Factory patterns for test data generation

### Database-Specific Helpers

- **`postgres-helpers.ts`** - PostgreSQL-specific utilities
- **`mysql-helpers.ts`** - MySQL-specific utilities  
- **`mongodb-helpers.ts`** - MongoDB-specific utilities

### Language-Specific Implementations

- **`database_helpers.py`** - Python/FastAPI database utilities
- **`wp-db-helpers.php`** - WordPress database testing helpers

## 🚀 Quick Start

### TypeScript/Node.js

```typescript
import { TransactionManager, DatabaseConfig } from './transaction-helpers';
import { DatabaseSeeder } from './seeders';
import { DatabaseConnectionPool } from './connection-pool';

// Setup database configuration
const config: DatabaseConfig = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'test_db',
  username: 'test_user',
  password: 'test_password'
};

// Initialize transaction manager
const transactionManager = new TransactionManager(config);

// Create a test with transaction isolation
const context = await transactionManager.startTransaction('test_user_creation');

try {
  // Your test code here
  // All database operations will be rolled back automatically
} finally {
  await transactionManager.rollbackTransaction(context);
}
```

### Python/FastAPI

```python
from database_helpers import DatabaseTestHelper, DatabaseConfig

# Setup configuration
config = DatabaseConfig(
    driver="postgresql",
    host="localhost",
    port=5432,
    database="test_db",
    username="test_user",
    password="test_password"
)

# Initialize helper
db_helper = DatabaseTestHelper(config)

# Use transaction context
async with db_helper.async_transaction() as session:
    # Your test code here
    # Transaction will rollback automatically
    pass
```

### WordPress/PHP

```php
use PAQAFramework\Database\WPDatabaseTestHelper;
use PAQAFramework\Database\WPTestDataFactory;

// Initialize helpers
$db_helper = new WPDatabaseTestHelper();
$factory = new WPTestDataFactory($db_helper);

// Start transaction
$db_helper->start_transaction();

try {
    // Create test data
    $user = $factory->create_user(['role' => 'editor']);
    $post = $factory->create_post(['post_author' => $user->ID]);
    
    // Your test assertions here
    
} finally {
    // Rollback transaction
    $db_helper->rollback_transaction();
}
```

## 🔧 Core Features

### 1. Transaction Management

Provides automatic transaction isolation for tests with support for savepoints and nested transactions.

```typescript
// Automatic rollback decorator
@withTransaction(config)
async function testUserCreation(context: TransactionContext) {
  // Test code here - will rollback automatically
}

// Manual transaction management
const context = await transactionManager.startTransaction('test_id');
await transactionManager.createSavepoint(context, 'before_user');
// ... test operations
await transactionManager.rollbackToSavepoint(context, 'before_user');
await transactionManager.rollbackTransaction(context);
```

### 2. Data Seeding

Factory-based data generation with relationship management.

```typescript
import { DatabaseSeeder, TestDataFactory } from './seeders';

const seeder = new DatabaseSeeder(transactionManager);

// Register seeders
seeder.register('users', {
  table: 'users',
  count: 10,
  data: TestDataFactory.user,
  relationships: [
    { table: 'posts', foreignKey: 'user_id', localKey: 'id', type: 'hasMany' }
  ]
});

// Seed data
const seededData = await seeder.seed(context, ['users', 'posts']);
const randomUser = seeder.getRandomRecord('users');
```

### 3. Performance Monitoring

Track query performance and database operations.

```typescript
import { DatabasePerformanceMonitor } from './performance-monitor';

const monitor = new DatabasePerformanceMonitor({
  slowQueryTime: 1000, // 1 second threshold
  maxConcurrentConnections: 100
});

monitor.startMonitoring(connectionPool);

// Monitor specific operations
const queryId = monitor.recordQuery('SELECT * FROM users', [], 'postgres');
// ... execute query
monitor.completeQuery(queryId, 50); // 50 rows affected

// Get performance report
const report = monitor.getPerformanceSummary(60); // Last 60 minutes
console.log(`Average query time: ${report.summary.avgQueryTime}ms`);
```

### 4. Connection Pool Management

Efficient connection pooling with health monitoring.

```typescript
import { DatabaseConnectionPool, PoolManager } from './connection-pool';

const pool = new DatabaseConnectionPool({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'test_db',
  min: 2,
  max: 10,
  testOnBorrow: true
});

await pool.initialize();

// Execute queries with automatic connection management
const users = await pool.query('SELECT * FROM users WHERE active = $1', [true]);

// Get pool statistics
const stats = pool.getStats();
console.log(`Active connections: ${stats.active}`);
```

### 5. Database Factories

Generate realistic test data with relationships.

```typescript
import { DatabaseFactory, CommonFactories, factory } from './db-factories';

// Register common factories
CommonFactories.registerAll();

// Use fluent interface
const users = await factory('user')
  .count(5)
  .traits('admin', 'verified')
  .with({ isActive: true })
  .create();

// Create with relationships
const posts = await factory('post')
  .count(10)
  .create();

await DatabaseFactory.buildRelationships('post');
```

## 🗄️ Database-Specific Features

### PostgreSQL

```typescript
import { PostgresTestHelper, PostgresTestUtils } from './postgres-helpers';

const helper = new PostgresTestHelper(config);

// Test PostgreSQL-specific features
await helper.installExtensions([
  { name: 'uuid-ossp' },
  { name: 'pgcrypto' }
]);

// Test JSONB operations
const result = await helper.testJsonOperations('products', 'metadata', {
  categories: ['electronics', 'phones'],
  specs: { ram: '8GB', storage: '256GB' }
});

// Performance testing
const stats = await helper.explainQuery('SELECT * FROM users WHERE email = $1', ['user@example.com']);
```

### MySQL

```typescript
import { MySQLTestHelper, MySQLTestUtils } from './mysql-helpers';

const helper = new MySQLTestHelper(config);

// Test storage engines
await helper.testWithStorageEngine('test_table', 'InnoDB');

// Test full-text search
const results = await helper.testFullTextSearch('posts', 'content', 'search term');

// Monitor performance
const status = await helper.getInnoDBStatus();
```

### MongoDB

```typescript
import { MongoTestHelper, MongoTestUtils } from './mongodb-helpers';

const helper = new MongoTestHelper(config);

// Test aggregation pipelines
const pipeline = [
  { $match: { status: 'active' } },
  { $group: { _id: '$category', count: { $sum: 1 } } }
];

const results = await helper.testAggregation('users', pipeline);

// Test geospatial queries
const location = { type: 'Point', coordinates: [-73.856077, 40.848447] };
const nearby = await helper.testGeospatialOperations('locations', location, 1000);

// Test transactions (requires replica set)
await helper.testTransaction(async (session) => {
  // Transactional operations here
});
```

## 🐍 Python/FastAPI Integration

```python
import pytest
from database_helpers import DatabaseTestHelper, DatabaseSeeder

@pytest.fixture
async def db_session(db_helper):
    """Provide async database session for tests."""
    async with db_helper.async_transaction() as session:
        yield session

@database_test(rollback=True)
def test_user_creation(session):
    """Test with automatic transaction management."""
    # Test code here
    pass

# FastAPI dependency override
app.dependency_overrides[get_db] = lambda: db_helper.override_get_db()
```

## 🎯 WordPress Integration

```php
class UserManagementTest extends WPDatabaseTestCase
{
    public function test_user_creation_with_roles()
    {
        // Create test users with different roles
        $editor = $this->factory->create_user(['role' => 'editor']);
        $subscriber = $this->factory->create_user(['role' => 'subscriber']);
        
        // Test role assignments
        WPDatabaseAssertions::assertUserHasRole($editor->ID, 'editor');
        WPDatabaseAssertions::assertUserHasRole($subscriber->ID, 'subscriber');
        
        // Test performance constraints
        $this->assertPerformanceConstraints(max_queries: 10, max_time: 0.5);
    }
    
    public function test_post_creation_with_relationships()
    {
        // Create related data
        $posts = $this->factory->create_posts_with_relationships(5);
        
        // Verify relationships
        foreach ($posts as $post) {
            WPDatabaseAssertions::assertPostExists($post->ID);
            $this->assertGreaterThan(0, wp_count_comments($post->ID)['approved']);
        }
    }
}
```

## 📊 Migration Testing

```typescript
import { MigrationTester, findMigrationFiles } from './migration-helpers';

const tester = new MigrationTester(transactionManager, './migrations', 'postgres');

// Test all migrations
const migrationFiles = await findMigrationFiles('./migrations');
const context = await transactionManager.startTransaction('migration_test');

try {
  const results = await tester.testMigrationSequence(context, migrationFiles);
  
  for (const result of results) {
    if (!result.success) {
      console.error(`Migration failed: ${result.error}`);
    }
  }
  
  // Generate test report
  const report = await tester.generateTestReport(results);
  console.log(report);
  
} finally {
  await transactionManager.rollbackTransaction(context);
}
```

## 🧹 Cleanup Strategies

```typescript
import { CleanupStrategies, DatabaseCleaner } from './cleanup-utilities';

// Different cleanup strategies for different test types
const fastCleaner = CleanupStrategies.createFastCleanup(pool, 'postgres');
const thoroughCleaner = CleanupStrategies.createThoroughCleanup(pool, 'postgres');
const safeCleaner = CleanupStrategies.createSafeCleanup(pool, 'postgres');

// Use with test wrapper
await withCleanup(fastCleaner, async () => {
  // Test code here
  // Cleanup happens automatically
});

// Manual cleanup
const result = await cleaner.cleanup();
console.log(`Cleaned ${result.tablesCleared.length} tables in ${result.duration}ms`);
```

## 🚨 Best Practices

### 1. Test Isolation

- Always use transactions for test isolation
- Use separate test databases
- Clean up after each test

```typescript
// Good: Isolated test
await runInTransaction(config, async (context) => {
  // Test operations
}, 'test_name');

// Bad: Shared state
const session = await pool.getConnection();
// Operations without transaction isolation
```

### 2. Performance Testing

- Monitor query counts and execution times
- Set performance thresholds
- Use realistic data volumes

```typescript
// Monitor performance during tests
monitor.setupAlerts();
monitor.on('slowQuery', (query) => {
  console.warn(`Slow query detected: ${query.duration}ms`);
});
```

### 3. Data Management

- Use factories for consistent test data
- Build relationships properly
- Clean up created data

```typescript
// Good: Use factories
const users = await factory('user').count(10).create();

// Bad: Manual data creation
const user = { id: 1, email: 'test@example.com' }; // Incomplete, inconsistent
```

### 4. Error Handling

- Handle database errors gracefully
- Provide meaningful error messages
- Clean up on failures

```typescript
try {
  await testDatabaseOperation();
} catch (error) {
  await cleaner.cleanup(); // Ensure cleanup on error
  throw new Error(`Database test failed: ${error.message}`);
}
```

## 📈 Performance Monitoring

### Real-time Metrics

```typescript
// Get current performance metrics
const metrics = monitor.getRealTimeMetrics();
console.log(`
  Active queries: ${metrics.activeQueries}
  Queries/sec: ${metrics.queriesPerSecond}
  Avg response time: ${metrics.avgResponseTime}ms
  Error rate: ${metrics.errorRate * 100}%
  Pool usage: ${metrics.connectionPoolUsage * 100}%
`);
```

### Query Analysis

```typescript
// Analyze query patterns
const patterns = monitor.getQueryPatterns(60); // Last 60 minutes

console.log('Top queries by frequency:');
patterns.topQueries.forEach(query => {
  console.log(`${query.count}x: ${query.query.substring(0, 50)}...`);
});

console.log('Most accessed tables:');
patterns.topTables.forEach(table => {
  console.log(`${table.table}: ${table.operations} operations`);
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Database configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_db
DB_USER=test_user
DB_PASSWORD=test_password

# Pool configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=60000

# Performance monitoring
DB_SLOW_QUERY_THRESHOLD=1000
DB_ENABLE_QUERY_LOGGING=true
```

### Config Files

```json
{
  "database": {
    "default": {
      "type": "postgres",
      "host": "localhost",
      "port": 5432,
      "database": "test_db",
      "username": "test_user",
      "password": "test_password"
    },
    "pool": {
      "min": 2,
      "max": 10,
      "acquireTimeoutMillis": 60000,
      "testOnBorrow": true
    },
    "monitoring": {
      "slowQueryTime": 1000,
      "enableLogging": true,
      "maxHistorySize": 1000
    }
  }
}
```

## 🧪 Example Test Suites

### Integration Test Example

```typescript
describe('User Management Integration', () => {
  let transactionManager: TransactionManager;
  let seeder: DatabaseSeeder;
  let monitor: DatabasePerformanceMonitor;

  beforeEach(async () => {
    transactionManager = new TransactionManager(config);
    seeder = new DatabaseSeeder(transactionManager);
    monitor = new DatabasePerformanceMonitor();
    monitor.startMonitoring(pool);
  });

  afterEach(async () => {
    await transactionManager.cleanupAllTransactions();
    monitor.stopMonitoring();
  });

  it('should create user with relationships', async () => {
    await runInTransaction(config, async (context) => {
      // Seed initial data
      const users = await seeder.seed(context, ['users']);
      const posts = await seeder.seed(context, ['posts']);
      
      // Test user creation with posts
      const user = seeder.getRandomRecord('users');
      const userPosts = posts.filter(p => p.user_id === user.id);
      
      expect(userPosts.length).toBeGreaterThan(0);
      
      // Check performance
      const stats = monitor.getRealTimeMetrics();
      expect(stats.avgResponseTime).toBeLessThan(100); // 100ms
      
    }, 'user_relationship_test');
  });
});
```

### Performance Test Example

```typescript
describe('Database Performance', () => {
  it('should handle large dataset efficiently', async () => {
    const benchmark = await withPerformanceMonitoring(
      monitor,
      async (queryId) => {
        // Create large dataset
        const users = await factory('user').count(10000).create();
        
        // Query with various filters
        const activeUsers = await pool.query(
          'SELECT * FROM users WHERE is_active = $1 AND created_at > $2',
          [true, new Date('2023-01-01')]
        );
        
        return activeUsers;
      },
      'SELECT * FROM users WHERE is_active = ? AND created_at > ?',
      [true, new Date('2023-01-01')],
      'postgres'
    );

    // Assert performance requirements
    expect(benchmark.length).toBeGreaterThan(0);
    
    const stats = monitor.getPerformanceSummary(1);
    expect(stats.summary.avgQueryTime).toBeLessThan(50); // 50ms average
    expect(stats.summary.slowQueries).toBe(0); // No slow queries
  });
});
```

## 🔗 Integration with CI/CD

### GitHub Actions

```yaml
name: Database Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: test_user
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database tests
        run: npm run test:db
        env:
          DB_TYPE: postgres
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: test_db
          DB_USER: test_user
          DB_PASSWORD: test_password
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## 📚 Additional Resources

- [Transaction Isolation Levels](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Database Testing Best Practices](https://martinfowler.com/articles/nonDeterminism.html)
- [Performance Testing Guidelines](https://www.sql-performance-explained.com/)
- [Factory Pattern in Testing](https://thoughtbot.com/blog/factory_bot)

## 🤝 Contributing

When adding new database utilities:

1. Follow the established patterns for transaction management
2. Include comprehensive tests with performance benchmarks
3. Add database-specific optimizations where appropriate
4. Update documentation with examples
5. Ensure compatibility across supported database systems

## 📄 License

Part of the PA-QA Framework - see main project license.