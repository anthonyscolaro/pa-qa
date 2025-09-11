# Troubleshooting Guide - PA-QA Framework

## 🚨 Quick Reference

This guide helps you diagnose and resolve common issues when using the PA-QA testing framework. Issues are organized by category with step-by-step solutions.

## 📋 Issue Categories

- [🔧 Setup and Installation Issues](#setup-and-installation-issues)
- [🧪 Test Execution Problems](#test-execution-problems)  
- [🐳 Docker and Container Issues](#docker-and-container-issues)
- [🔄 CI/CD Pipeline Failures](#cicd-pipeline-failures)
- [📊 Coverage and Reporting Issues](#coverage-and-reporting-issues)
- [🌐 Browser and E2E Test Problems](#browser-and-e2e-test-problems)
- [🗄️ Database and Integration Issues](#database-and-integration-issues)
- [⚡ Performance and Timeout Issues](#performance-and-timeout-issues)
- [🔒 Security and Authentication Problems](#security-and-authentication-problems)
- [🤖 Multi-Agent Workflow Issues](#multi-agent-workflow-issues)

## 🔧 Setup and Installation Issues

### Issue: PA-QA Templates Not Found

**Symptoms:**
```bash
cp: cannot stat '/path/to/pa-qa/project-types/react': No such file or directory
```

**Diagnosis:**
```bash
# Check if PA-QA repository is cloned
ls -la /path/to/pa-qa/

# Check current directory
pwd

# Check if you're in the right project directory
ls -la package.json pyproject.toml composer.json
```

**Solutions:**

1. **Clone PA-QA Repository**
```bash
git clone https://github.com/your-org/pa-qa.git
cd pa-qa
```

2. **Use Absolute Paths**
```bash
# Find PA-QA location
find / -name "pa-qa" -type d 2>/dev/null

# Use absolute path in copy commands
cp -r /absolute/path/to/pa-qa/project-types/react/* ./
```

3. **Use Environment Variables**
```bash
# Add to your shell profile
export PA_QA_PATH="/path/to/pa-qa"

# Use in commands
cp -r $PA_QA_PATH/project-types/react/* ./
```

### Issue: Node.js Version Compatibility

**Symptoms:**
```bash
Error: Unsupported engine node@14.x, required: >=18.0.0
```

**Diagnosis:**
```bash
# Check current Node version
node --version

# Check package.json requirements
cat package.json | grep -A 3 -B 3 engines
```

**Solutions:**

1. **Update Node.js with nvm**
```bash
# Install/update nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install and use Node 18+
nvm install 18
nvm use 18
nvm alias default 18
```

2. **Update Using Package Manager**
```bash
# macOS with Homebrew
brew update && brew upgrade node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows with Chocolatey
choco upgrade nodejs
```

### Issue: Python Version Incompatibility

**Symptoms:**
```bash
ERROR: Package requires a different Python: 3.7.0 not in '>=3.8'
```

**Diagnosis:**
```bash
# Check Python version
python --version
python3 --version

# Check pyproject.toml requirements
cat pyproject.toml | grep python
```

**Solutions:**

1. **Install Python 3.8+ with pyenv**
```bash
# Install pyenv
curl https://pyenv.run | bash

# Add to shell profile
echo 'export PATH="$HOME/.pyenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
source ~/.bashrc

# Install Python 3.11
pyenv install 3.11.0
pyenv global 3.11.0
```

2. **Use System Package Manager**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-pip

# macOS with Homebrew
brew install python@3.11

# CentOS/RHEL
sudo dnf install python3.11
```

### Issue: Poetry Installation Problems

**Symptoms:**
```bash
poetry: command not found
```

**Diagnosis:**
```bash
# Check if Poetry is installed
which poetry

# Check Python pip
pip --version
```

**Solutions:**

1. **Install Poetry**
```bash
# Official installer
curl -sSL https://install.python-poetry.org | python3 -

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
poetry --version
```

2. **Alternative Installation Methods**
```bash
# Using pip
pip install poetry

# Using conda
conda install poetry

# Using Homebrew (macOS)
brew install poetry
```

## 🧪 Test Execution Problems

### Issue: Tests Failing Due to Missing Dependencies

**Symptoms:**
```bash
ModuleNotFoundError: No module named 'pytest'
Cannot resolve module '@testing-library/react'
```

**Diagnosis:**
```bash
# Check installed packages
npm list
pip list
composer show

# Check lock files
ls -la package-lock.json yarn.lock poetry.lock composer.lock
```

**Solutions:**

1. **Reinstall Dependencies**
```bash
# Node.js projects
rm -rf node_modules package-lock.json
npm install

# or with yarn
rm -rf node_modules yarn.lock
yarn install

# Python projects
rm -rf .venv poetry.lock
poetry install

# PHP projects
rm -rf vendor composer.lock
composer install
```

2. **Clear Cache and Reinstall**
```bash
# npm cache
npm cache clean --force
npm install

# Poetry cache
poetry cache clear --all pypi
poetry install

# Composer cache
composer clear-cache
composer install
```

### Issue: Test Files Not Found

**Symptoms:**
```bash
No tests found matching pattern "**/*.test.{js,ts}"
collected 0 items
```

**Diagnosis:**
```bash
# Check test file patterns
find . -name "*.test.*" -type f
find . -name "*_test.*" -type f

# Check test configuration
cat vitest.config.ts | grep testMatch
cat pytest.ini | grep testpaths
cat phpunit.xml | grep testsuites
```

**Solutions:**

1. **Fix Test File Naming**
```bash
# Standard naming patterns
*.test.js    # JavaScript/TypeScript
*_test.py    # Python
*Test.php    # PHP

# Ensure files are in correct directories
mkdir -p tests/unit tests/integration tests/e2e
```

2. **Update Test Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      'src/**/*.{test,spec}.{js,ts}'
    ]
  }
})
```

```ini
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
```

### Issue: Async Test Timeouts

**Symptoms:**
```bash
Test timeout of 5000ms exceeded
asyncio.TimeoutError: Task timed out after 30 seconds
```

**Diagnosis:**
```bash
# Check for infinite loops
grep -r "while.*true" tests/
grep -r "setInterval\|setTimeout" tests/

# Check async operations
grep -r "await.*fetch\|await.*request" tests/
```

**Solutions:**

1. **Increase Timeout Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  }
})

// Individual test timeout
it('async operation', async () => {
  // Test code
}, { timeout: 10000 })
```

```python
# pytest.ini
[tool:pytest]
timeout = 300

# Individual test timeout
@pytest.mark.timeout(60)
async def test_async_operation():
    pass
```

2. **Fix Async Code Issues**
```typescript
// ✅ Good: Proper async handling
it('should fetch data', async () => {
  const mockFetch = vi.fn().mockResolvedValue({ data: 'test' })
  
  const result = await fetchData()
  
  expect(result).toBeDefined()
})

// ❌ Bad: Missing await
it('should fetch data', async () => {
  fetchData() // Missing await!
  expect(true).toBe(true)
})
```

### Issue: Flaky Tests

**Symptoms:**
```bash
Test passes sometimes, fails other times
Intermittent failures in CI/CD
```

**Diagnosis:**
```bash
# Run tests multiple times
for i in {1..10}; do npm test; done

# Check for timing dependencies
grep -r "setTimeout\|setInterval" tests/
grep -r "Date.now\|new Date" tests/

# Check for shared state
grep -r "global\|window\." tests/
```

**Solutions:**

1. **Fix Timing Issues**
```typescript
// ❌ Bad: Fixed delays
await new Promise(resolve => setTimeout(resolve, 1000))

// ✅ Good: Wait for conditions
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument()
})

// ✅ Good: Mock timers
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})
```

2. **Eliminate Shared State**
```typescript
// ✅ Good: Clean setup/teardown
beforeEach(() => {
  // Fresh state for each test
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

// ✅ Good: Isolated test data
it('should handle user data', () => {
  const testUser = createTestUser() // Fresh data each time
  // Test logic
})
```

## 🐳 Docker and Container Issues

### Issue: Docker Container Won't Start

**Symptoms:**
```bash
Error: Container exited with code 1
docker: Error response from daemon: pull access denied
```

**Diagnosis:**
```bash
# Check Docker status
docker --version
docker info

# Check container logs
docker logs container_name

# Check Dockerfile syntax
docker build --no-cache -t test-image .
```

**Solutions:**

1. **Fix Docker Installation**
```bash
# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Test Docker
docker run hello-world
```

2. **Fix Image Pull Issues**
```bash
# Login to Docker Hub
docker login

# Use specific image tags
# ❌ Bad: Using 'latest' tag
FROM node:latest

# ✅ Good: Specific version
FROM node:18-alpine

# Check available tags
docker search node
```

3. **Fix Dockerfile Issues**
```dockerfile
# ✅ Good: Complete Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Set proper permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start command
CMD ["npm", "start"]
```

### Issue: Docker Compose Services Not Communicating

**Symptoms:**
```bash
Connection refused to database
Unable to connect to redis://redis:6379
```

**Diagnosis:**
```bash
# Check service status
docker-compose ps

# Check networks
docker network ls
docker network inspect project_default

# Check service logs
docker-compose logs database
docker-compose logs redis
```

**Solutions:**

1. **Fix Service Dependencies**
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - DATABASE_HOST=database  # Use service name
      - REDIS_HOST=redis
    networks:
      - app_network

  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d testdb"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app_network

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - app_network

networks:
  app_network:
    driver: bridge
```

2. **Fix Connection Strings**
```bash
# ✅ Good: Use service names as hostnames
DATABASE_URL=postgresql://user:password@database:5432/testdb
REDIS_URL=redis://redis:6379

# ❌ Bad: Using localhost
DATABASE_URL=postgresql://user:password@localhost:5432/testdb
```

### Issue: Docker Build Performance Issues

**Symptoms:**
```bash
Docker build takes 10+ minutes
npm install running every build
```

**Diagnosis:**
```bash
# Check build context size
du -sh .

# Check .dockerignore
cat .dockerignore

# Analyze build layers
docker history image_name
```

**Solutions:**

1. **Optimize Dockerfile Layer Caching**
```dockerfile
# ✅ Good: Layer optimization
FROM node:18-alpine AS deps

# Copy dependency files first
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS dev-deps
COPY package*.json ./
RUN npm ci

FROM dev-deps AS build
COPY . .
RUN npm run build

FROM deps AS runtime
COPY --from=build /app/dist ./dist
CMD ["npm", "start"]
```

2. **Improve .dockerignore**
```dockerignore
# Dependencies
node_modules/
.npm/

# Version control
.git/
.gitignore

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
*.log

# Test files
tests/
*.test.*
coverage/

# Documentation
*.md
docs/
```

## 🔄 CI/CD Pipeline Failures

### Issue: GitHub Actions Workflow Failing

**Symptoms:**
```bash
Action failed with "Error: Process completed with exit code 1"
Workflow cancelled due to timeout
```

**Diagnosis:**
```bash
# Check workflow syntax
yamllint .github/workflows/test.yml

# Check action logs in GitHub UI
# Look for specific error messages

# Test locally with act
act -j test
```

**Solutions:**

1. **Fix Common Workflow Issues**
```yaml
# ✅ Good: Complete workflow
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:ci
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: matrix.node-version == '18'
      with:
        file: ./coverage/lcov.info
```

2. **Fix Secret and Environment Issues**
```yaml
# Set secrets in repository settings
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm run deploy
```

### Issue: Pipeline Timeout Issues

**Symptoms:**
```bash
The job running on runner has exceeded the maximum execution time of 360 minutes
```

**Diagnosis:**
```bash
# Check for infinite loops in tests
# Check for network timeouts
# Look for expensive operations
```

**Solutions:**

1. **Optimize Pipeline Performance**
```yaml
# Add timeouts
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
    - name: Install dependencies
      run: npm ci
      timeout-minutes: 10
    
    - name: Run tests
      run: npm test
      timeout-minutes: 15
```

2. **Use Parallel Execution**
```yaml
strategy:
  matrix:
    test-type: [unit, integration, e2e]
    
steps:
- name: Run ${{ matrix.test-type }} tests
  run: npm run test:${{ matrix.test-type }}
```

## 📊 Coverage and Reporting Issues

### Issue: Coverage Reports Not Generated

**Symptoms:**
```bash
No coverage information found
Coverage threshold not met
```

**Diagnosis:**
```bash
# Check coverage configuration
cat vitest.config.ts | grep coverage
cat pytest.ini | grep coverage

# Check for coverage files
ls -la coverage/ .coverage

# Check test execution
npm run test -- --coverage
pytest --cov=src
```

**Solutions:**

1. **Fix Coverage Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ],
      thresholds: {
        global: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70
        }
      }
    }
  }
})
```

```python
# pyproject.toml
[tool.coverage.run]
source = ["src"]
omit = [
    "*/tests/*",
    "*/venv/*",
    "*/__pycache__/*"
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise NotImplementedError"
]
```

2. **Generate Coverage Reports**
```bash
# JavaScript/TypeScript
npm run test -- --coverage
npx vitest run --coverage

# Python
pytest --cov=src --cov-report=html --cov-report=xml

# PHP
phpunit --coverage-html coverage-report
```

### Issue: Allure Reports Not Uploading

**Symptoms:**
```bash
Failed to upload allure results
allure-results directory not found
```

**Diagnosis:**
```bash
# Check allure results directory
ls -la allure-results/

# Check allure configuration
cat allure.config.js

# Check upload script
ls -la upload-results.sh
```

**Solutions:**

1. **Fix Allure Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    reporters: [
      'default',
      ['allure-vitest', { 
        resultsDir: 'allure-results',
        projectName: 'Your Project Name'
      }]
    ]
  }
})
```

```python
# pytest.ini
[tool:pytest]
addopts = --alluredir=allure-results
```

2. **Fix Upload Script**
```bash
#!/bin/bash
# upload-results.sh

PROJECT_NAME=${1:-"default-project"}
ALLURE_RESULTS_DIR=${2:-"allure-results"}

if [ ! -d "$ALLURE_RESULTS_DIR" ]; then
    echo "❌ Allure results directory not found: $ALLURE_RESULTS_DIR"
    exit 1
fi

if [ -z "$(ls -A $ALLURE_RESULTS_DIR)" ]; then
    echo "❌ Allure results directory is empty"
    exit 1
fi

echo "📤 Uploading results for project: $PROJECT_NAME"

# Upload to PA-QA Allure Dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALLURE_TOKEN" \
  -F "results=@$ALLURE_RESULTS_DIR" \
  "https://allure.projectassistant.ai/api/projects/$PROJECT_NAME/results"

echo "✅ Upload completed"
```

## 🌐 Browser and E2E Test Problems

### Issue: Playwright Browser Installation Fails

**Symptoms:**
```bash
browserType.launch: Browser installation failed
Executable doesn't exist at /path/to/browsers
```

**Diagnosis:**
```bash
# Check Playwright installation
npx playwright --version

# Check browser installation
npx playwright install --dry-run

# Check system dependencies
ldd $(npx playwright install chromium 2>&1 | grep -o '/.*chromium')
```

**Solutions:**

1. **Install Browsers Properly**
```bash
# Install all browsers
npx playwright install

# Install specific browser
npx playwright install chromium

# Install with dependencies (Linux)
npx playwright install-deps
npx playwright install
```

2. **Fix Permission Issues**
```bash
# Fix browser permissions
sudo chown -R $USER:$USER ~/.cache/ms-playwright

# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y \
  libnss3 \
  libnspr4 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgtk-3-0 \
  libgbm1
```

### Issue: E2E Tests Timing Out

**Symptoms:**
```bash
Test timeout of 30000ms exceeded
Page didn't navigate to expected URL
```

**Diagnosis:**
```bash
# Check test timing
grep -r "waitFor\|timeout" tests/e2e/

# Check for infinite loading states
# Look for missing await statements
```

**Solutions:**

1. **Fix Playwright Timeouts**
```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 5000 // 5 seconds for assertions
  },
  use: {
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 30000 // 30 seconds for navigation
  }
})
```

2. **Improve Wait Strategies**
```typescript
// ❌ Bad: Fixed delays
await page.waitForTimeout(5000)

// ✅ Good: Wait for conditions
await page.waitForLoadState('networkidle')
await page.waitForSelector('[data-testid="content"]')
await expect(page.locator('[data-testid="loading"]')).toHaveCount(0)

// ✅ Good: Wait for API responses
await page.waitForResponse(response => 
  response.url().includes('/api/users') && response.status() === 200
)
```

### Issue: E2E Tests Failing in CI but Passing Locally

**Symptoms:**
```bash
Tests pass on local machine but fail in GitHub Actions
Screenshots show different layout in CI
```

**Diagnosis:**
```bash
# Compare local vs CI screenshots
# Check viewport differences
# Look for font/rendering differences
```

**Solutions:**

1. **Standardize Test Environment**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Force specific browser channel in CI
        channel: process.env.CI ? 'chrome' : undefined
      }
    }
  ]
})
```

2. **Fix CI-Specific Issues**
```typescript
// Handle different environments
test.beforeEach(async ({ page }) => {
  // Wait for fonts to load
  await page.waitForLoadState('networkidle')
  
  // Hide dynamic content
  await page.addStyleTag({
    content: `
      .loading-animation,
      .timestamp {
        visibility: hidden !important;
      }
    `
  })
})
```

## 🗄️ Database and Integration Issues

### Issue: Database Connection Failures

**Symptoms:**
```bash
Connection refused to database
ECONNREFUSED 127.0.0.1:5432
```

**Diagnosis:**
```bash
# Check database service
docker-compose ps database
sudo systemctl status postgresql

# Check connection details
psql -h localhost -p 5432 -U testuser -d testdb

# Check network connectivity
telnet localhost 5432
```

**Solutions:**

1. **Fix Database Service**
```yaml
# docker-compose.yml
services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U testuser -d testdb"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. **Fix Connection Configuration**
```bash
# Environment variables
DATABASE_URL=postgresql://testuser:testpass@localhost:5432/testdb

# For Docker Compose
DATABASE_URL=postgresql://testuser:testpass@database:5432/testdb
```

### Issue: Database Fixtures Not Loading

**Symptoms:**
```bash
Table 'users' doesn't exist
IntegrityError: duplicate key value
```

**Diagnosis:**
```bash
# Check fixture files
ls -la tests/fixtures/

# Check database migrations
ls -la migrations/

# Check test database setup
cat tests/conftest.py | grep database
```

**Solutions:**

1. **Fix Database Setup in Tests**
```python
# conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine("postgresql://testuser:testpass@localhost/testdb")
    
    # Create all tables
    Base.metadata.create_all(engine)
    
    yield engine
    
    # Cleanup
    Base.metadata.drop_all(engine)

@pytest.fixture
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    
    Session = sessionmaker(bind=connection)
    session = Session()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
```

2. **Fix Fixture Loading**
```python
# Test with fixtures
@pytest.fixture
def sample_user(db_session):
    user = User(
        email="test@example.com",
        username="testuser"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

def test_user_creation(sample_user):
    assert sample_user.email == "test@example.com"
```

## ⚡ Performance and Timeout Issues

### Issue: Tests Running Too Slowly

**Symptoms:**
```bash
Test suite takes 10+ minutes to complete
Individual tests taking 30+ seconds
```

**Diagnosis:**
```bash
# Profile test execution time
npm run test -- --reporter=verbose
pytest --durations=10

# Check for expensive operations
grep -r "sleep\|setTimeout" tests/
grep -r "fetch\|axios\|request" tests/
```

**Solutions:**

1. **Optimize Test Performance**
```typescript
// ✅ Good: Mock expensive operations
beforeEach(() => {
  vi.mock('../services/api', () => ({
    fetchData: vi.fn().mockResolvedValue(mockData)
  }))
})

// ✅ Good: Use test utilities
const renderWithProviders = (ui, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false }
    }
  })
  
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...options
  })
}
```

2. **Parallelize Test Execution**
```bash
# Vitest parallel execution
npm run test -- --threads

# Jest parallel execution
npm run test -- --maxWorkers=4

# Pytest parallel execution
pip install pytest-xdist
pytest -n auto
```

### Issue: Memory Leaks in Tests

**Symptoms:**
```bash
JavaScript heap out of memory
Process killed (OOM)
```

**Diagnosis:**
```bash
# Monitor memory usage
node --max-old-space-size=4096 node_modules/.bin/jest

# Check for memory leaks
npm run test -- --detectOpenHandles --detectLeaks
```

**Solutions:**

1. **Fix Memory Leaks**
```typescript
// ✅ Good: Proper cleanup
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
  
  // Clear DOM
  document.body.innerHTML = ''
  
  // Clear global state
  Object.keys(window).forEach(key => {
    if (key.startsWith('__TEST_')) {
      delete window[key]
    }
  })
})

// ✅ Good: Cleanup async operations
afterEach(async () => {
  await new Promise(resolve => setImmediate(resolve))
  vi.useRealTimers()
})
```

2. **Optimize Memory Usage**
```typescript
// ✅ Good: Lazy loading test data
const createLargeDataset = () => {
  // Only create when needed
  return Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }))
}

// ✅ Good: Stream large data
const processLargeFile = async () => {
  const stream = fs.createReadStream('large-file.json')
  // Process in chunks
}
```

## 🔒 Security and Authentication Problems

### Issue: JWT Token Issues in Tests

**Symptoms:**
```bash
Invalid token signature
Token expired
Authorization header missing
```

**Diagnosis:**
```bash
# Check token generation
# Verify secret keys
# Check token expiration
```

**Solutions:**

1. **Fix Token Testing**
```typescript
// Test helper for JWT tokens
const createTestToken = (payload = {}, secret = 'test-secret') => {
  return jwt.sign(
    {
      sub: '123',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      ...payload
    },
    secret
  )
}

// Use in tests
it('should authenticate with valid token', async () => {
  const token = createTestToken()
  
  const response = await request(app)
    .get('/protected')
    .set('Authorization', `Bearer ${token}`)
  
  expect(response.status).toBe(200)
})
```

2. **Mock Authentication in Tests**
```typescript
// Mock auth middleware
beforeEach(() => {
  vi.mock('../middleware/auth', () => ({
    requireAuth: (req, res, next) => {
      req.user = { id: 1, email: 'test@example.com' }
      next()
    }
  }))
})
```

### Issue: CORS Errors in Tests

**Symptoms:**
```bash
Access to fetch blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

**Diagnosis:**
```bash
# Check CORS configuration
# Verify test server setup
# Check request origins
```

**Solutions:**

1. **Fix CORS in Test Environment**
```typescript
// Test server setup
const createTestServer = () => {
  const app = express()
  
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
  }))
  
  return app
}
```

2. **Mock API Calls to Avoid CORS**
```typescript
// Mock fetch requests
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockData)
  })
})
```

## 🤖 Multi-Agent Workflow Issues

### Issue: Multi-Agent Tasks Failing

**Symptoms:**
```bash
Agent task timeout
Invalid agent configuration
Agent output validation failed
```

**Diagnosis:**
```bash
# Check agent configuration
# Verify agent dependencies
# Check output formats
```

**Solutions:**

1. **Fix Agent Configuration**
```typescript
// ✅ Good: Proper agent configuration
const unitTestAgent = Task({
  subagent_type: "general-purpose",
  description: "Generate unit tests for user service",
  prompt: `
    Generate comprehensive unit tests for the user service module.
    
    REQUIREMENTS:
    - 70%+ code coverage
    - Include edge cases and error scenarios
    - Use proper mocking strategies
    - Follow testing best practices
    
    OUTPUT FORMAT:
    - Complete test files with proper structure
    - Test utilities and helpers
    - Clear documentation
    
    TARGET MODULE: ${moduleCode}
  `,
  timeout: 300000 // 5 minutes
})
```

2. **Add Error Handling and Retries**
```typescript
const executeAgentWithRetry = async (agentConfig, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Task(agentConfig)
      
      // Validate output
      if (validateAgentOutput(result)) {
        return result
      } else {
        throw new Error('Agent output validation failed')
      }
    } catch (error) {
      console.warn(`Agent attempt ${attempt} failed:`, error.message)
      
      if (attempt === maxRetries) {
        // Use fallback strategy
        return await fallbackTestGeneration(agentConfig)
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

## 🛠️ General Debugging Strategies

### Debug Test Execution

```bash
# Enable debug mode
DEBUG=* npm test
NODE_OPTIONS='--inspect' npm test

# Verbose output
npm test -- --verbose
pytest -v
phpunit --verbose

# Run single test
npm test -- --grep "specific test"
pytest tests/test_specific.py::test_function
phpunit --filter testSpecificMethod
```

### Debug Docker Issues

```bash
# Interactive container debugging
docker run -it --entrypoint /bin/sh image_name

# Check container logs
docker logs -f container_name

# Inspect container
docker inspect container_name

# Check container resources
docker stats container_name
```

### Debug CI/CD Issues

```bash
# Test GitHub Actions locally
act -j test-job

# Validate YAML syntax
yamllint .github/workflows/test.yml

# Check environment variables
env | grep -E "NODE_ENV|DATABASE_URL"
```

## 📞 Getting Additional Help

### Internal Resources

1. **PA-QA Documentation**
   - Setup guides: `/docs/setup-guides/`
   - Best practices: `/docs/best-practices/`
   - Examples: `/project-types/`

2. **Team Communication**
   - Slack: #qa-testing channel
   - Issues: Create GitHub issue with PA-QA repository
   - Team reviews: Request code review for testing patterns

### External Resources

1. **Framework Documentation**
   - [Vitest Docs](https://vitest.dev/)
   - [Playwright Docs](https://playwright.dev/)
   - [Pytest Docs](https://docs.pytest.org/)
   - [PHPUnit Docs](https://phpunit.de/)

2. **Tool-Specific Help**
   - [Docker Docs](https://docs.docker.com/)
   - [GitHub Actions Docs](https://docs.github.com/en/actions)
   - [Allure Docs](https://docs.qameta.io/allure/)

### Creating Support Tickets

When creating issues, include:

1. **Environment Information**
   ```bash
   # System info
   uname -a
   node --version
   python --version
   docker --version
   
   # Project info
   cat package.json
   cat pyproject.toml
   cat composer.json
   ```

2. **Error Details**
   - Complete error messages
   - Steps to reproduce
   - Expected vs actual behavior
   - Configuration files
   - Log outputs

3. **Context**
   - Framework being used
   - Test type (unit/integration/e2e)
   - Recent changes
   - Works in other environments?

---

**Remember**: Most testing issues have been encountered before. Check this guide first, then search existing issues, and finally create a new support ticket with detailed information.