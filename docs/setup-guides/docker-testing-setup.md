# Docker Testing Setup Guide - PA-QA Framework

## 🚀 Quick Start

Set up containerized testing environments in under 10 minutes with Docker, ensuring consistent, reproducible, and isolated test execution across all development environments.

## 📋 Prerequisites

- Docker 20.10+ (recommended: latest version)
- Docker Compose v2.0+
- 8GB+ RAM (for running multiple containers)
- Basic understanding of Docker concepts

### Verify Docker Installation

```bash
docker --version
docker-compose --version
docker run hello-world
```

## 🎯 What You'll Get

After following this guide, your projects will have:

✅ **Isolated Test Environments** for each project type  
✅ **Database Containers** with automatic fixtures  
✅ **Multi-Service Testing** with service dependencies  
✅ **Parallel Test Execution** across containers  
✅ **Consistent Environments** between local and CI/CD  
✅ **Resource Management** with proper cleanup  
✅ **Cross-Platform Compatibility** (Linux, macOS, Windows)  
✅ **Performance Optimization** with layered caching  
✅ **Security Isolation** with network segregation  
✅ **Allure Integration** with centralized reporting  

## 🔧 Architecture Overview

### Container Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    PA-QA Docker Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React     │  │  WordPress  │  │   FastAPI   │         │
│  │   Tests     │  │    Tests    │  │    Tests    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Shared Services Layer                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │PostgreSQL│ │  MySQL   │ │  Redis   │ │ Selenium │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Reporting Layer                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐               │ │
│  │  │  Allure  │ │Coverage  │ │   Logs   │               │ │
│  │  └──────────┘ └──────────┘ └──────────┘               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Step 1: Copy PA-QA Docker Templates

### Copy Base Templates

```bash
# Copy shared Docker templates
cp -r /path/to/pa-qa/shared/docker-templates/testing/* ./docker/

# Copy project-specific configurations
cp /path/to/pa-qa/shared/docker-templates/testing/docker-compose.test.yml ./
cp /path/to/pa-qa/shared/docker-templates/testing/cleanup.sh ./
```

### Directory Structure

```
your-project/
├── docker/
│   ├── Dockerfile.test-node          # Node.js testing
│   ├── Dockerfile.test-python        # Python testing  
│   ├── Dockerfile.test-php           # PHP testing
│   ├── docker-compose.services.yml   # Shared services
│   ├── docker-compose.test.yml       # Test orchestration
│   ├── test-runner.sh               # Test execution script
│   └── cleanup.sh                   # Environment cleanup
├── tests/
│   ├── docker/                      # Docker-specific tests
│   ├── fixtures/                    # Test data
│   └── reports/                     # Test outputs
└── .dockerignore                    # Docker ignore file
```

## 🔧 Step 2: Framework-Specific Dockerfiles

### React/Node.js Testing (docker/Dockerfile.test-node)

```dockerfile
# Multi-stage build for React testing
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Chrome path for Playwright
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci

# Copy source code
COPY . .

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Test stage
FROM development AS test

# Set test environment variables
ENV NODE_ENV=test
ENV CI=true

# Run tests
CMD ["npm", "run", "test:ci"]

# Coverage stage
FROM test AS coverage
CMD ["npm", "run", "test:coverage"]

# E2E stage
FROM test AS e2e
EXPOSE 3000
CMD ["npm", "run", "test:e2e"]
```

### FastAPI/Python Testing (docker/Dockerfile.test-python)

```dockerfile
# Multi-stage build for Python testing
FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install Poetry
RUN pip install poetry==1.6.1
RUN poetry config virtualenvs.create false

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --only=main

# Development stage
FROM base AS development
RUN poetry install --with dev,test

# Copy source code
COPY . .

# Test stage
FROM development AS test

# Set test environment variables
ENV ENVIRONMENT=test
ENV DATABASE_URL=postgresql+asyncpg://test:test@postgres:5432/test_db
ENV REDIS_URL=redis://redis:6379/0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run tests
CMD ["pytest", "-v", "--alluredir=allure-results"]

# Coverage stage
FROM test AS coverage
CMD ["pytest", "--cov=app", "--cov-report=html", "--cov-report=xml"]

# Load test stage
FROM test AS load
EXPOSE 8089
CMD ["locust", "-f", "tests/load/", "--host=http://api:8000"]
```

### WordPress/PHP Testing (docker/Dockerfile.test-php)

```dockerfile
# Multi-stage build for PHP testing
FROM php:8.1-cli AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    mysql-client \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        gd \
        zip \
        pdo_mysql \
        mysqli \
        exif

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/v2.8.1/utils/wp-completion.bash \
    && wget https://github.com/wp-cli/wp-cli/releases/download/v2.8.1/wp-cli-2.8.1.phar \
    && chmod +x wp-cli-2.8.1.phar \
    && mv wp-cli-2.8.1.phar /usr/local/bin/wp

# Set working directory
WORKDIR /app

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Development stage
FROM base AS development
RUN composer install --dev

# Install WordPress test suite
RUN git clone --depth=1 https://github.com/WordPress/wordpress-develop.git /tmp/wordpress-tests-lib

# Copy source code
COPY . .

# Test stage
FROM development AS test

# Set test environment variables
ENV WP_TESTS_DIR=/tmp/wordpress-tests-lib
ENV WP_TESTS_DB_NAME=wordpress_test
ENV WP_TESTS_DB_USER=root
ENV WP_TESTS_DB_PASSWORD=password
ENV WP_TESTS_DB_HOST=mysql

# Install test database
RUN bash /tmp/wordpress-tests-lib/bin/install-wp-tests.sh \
    wordpress_test root password mysql latest

# Run tests
CMD ["composer", "test"]

# Coverage stage
FROM test AS coverage
CMD ["composer", "test:coverage"]

# Browser test stage
FROM test AS browser
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

CMD ["composer", "test:browser"]
```

## 🔧 Step 3: Service Orchestration

### Shared Services (docker/docker-compose.services.yml)

```yaml
version: '3.8'

# Shared services for all project types
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test_db
      POSTGRES_INITDB_ARGS: "--encoding=UTF8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-scripts/postgres:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test -d test_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pa_qa_test

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: wordpress_test
      MYSQL_USER: test
      MYSQL_PASSWORD: test
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/init-scripts/mysql:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - pa_qa_test

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - pa_qa_test

  selenium:
    image: selenium/standalone-chrome:4.15.0
    ports:
      - "4444:4444"
      - "5900:5900"  # VNC port
    environment:
      - SE_VNC_NO_PASSWORD=1
      - SE_NODE_MAX_SESSIONS=3
    volumes:
      - /dev/shm:/dev/shm
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4444/wd/hub/status"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - pa_qa_test

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - pa_qa_test

  allure:
    image: frankescobar/allure-docker-service:latest
    ports:
      - "5050:5050"
    environment:
      CHECK_RESULTS_EVERY_SECONDS: 1
      KEEP_HISTORY: 25
    volumes:
      - allure_results:/app/allure-results
      - allure_reports:/app/default-reports
    networks:
      - pa_qa_test

volumes:
  postgres_data:
  mysql_data:
  redis_data:
  allure_results:
  allure_reports:

networks:
  pa_qa_test:
    driver: bridge
```

### Test Orchestration (docker-compose.test.yml)

```yaml
version: '3.8'

# Import shared services
include:
  - docker/docker-compose.services.yml

services:
  # React/Node.js Testing
  react-tests:
    build:
      context: .
      dockerfile: docker/Dockerfile.test-node
      target: test
    environment:
      - NODE_ENV=test
      - CI=true
    volumes:
      - .:/app
      - node_modules:/app/node_modules
      - test_results:/app/test-results
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - pa_qa_test
    profiles:
      - react
      - all

  react-e2e:
    build:
      context: .
      dockerfile: docker/Dockerfile.test-node
      target: e2e
    environment:
      - NODE_ENV=test
      - CI=true
      - PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
    volumes:
      - .:/app
      - playwright_cache:/ms-playwright
    depends_on:
      - react-tests
      - selenium
    ports:
      - "3000:3000"
    networks:
      - pa_qa_test
    profiles:
      - react
      - e2e
      - all

  # FastAPI/Python Testing
  fastapi-tests:
    build:
      context: .
      dockerfile: docker/Dockerfile.test-python
      target: test
    environment:
      - ENVIRONMENT=test
      - DATABASE_URL=postgresql+asyncpg://test:test@postgres:5432/test_db
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - .:/app
      - test_results:/app/allure-results
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - pa_qa_test
    profiles:
      - fastapi
      - all

  fastapi-load:
    build:
      context: .
      dockerfile: docker/Dockerfile.test-python
      target: load
    environment:
      - ENVIRONMENT=test
    volumes:
      - .:/app
    depends_on:
      - fastapi-tests
    ports:
      - "8089:8089"
    networks:
      - pa_qa_test
    profiles:
      - fastapi
      - load
      - all

  # WordPress/PHP Testing
  wordpress-tests:
    build:
      context: .
      dockerfile: docker/Dockerfile.test-php
      target: test
    environment:
      - WP_TESTS_DB_HOST=mysql
      - WP_TESTS_DB_NAME=wordpress_test
      - WP_TESTS_DB_USER=root
      - WP_TESTS_DB_PASSWORD=password
    volumes:
      - .:/app
      - test_results:/app/coverage-report
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - pa_qa_test
    profiles:
      - wordpress
      - all

  wordpress-browser:
    build:
      context: .
      dockerfile: docker/Dockerfile.test-php
      target: browser
    environment:
      - WP_TESTS_DB_HOST=mysql
      - SELENIUM_HOST=selenium
      - SELENIUM_PORT=4444
    volumes:
      - .:/app
    depends_on:
      - wordpress-tests
      - selenium
    networks:
      - pa_qa_test
    profiles:
      - wordpress
      - browser
      - all

volumes:
  node_modules:
  playwright_cache:
  test_results:

networks:
  pa_qa_test:
    external: true
```

## 🔧 Step 4: Test Execution Scripts

### Main Test Runner (docker/test-runner.sh)

```bash
#!/bin/bash

# PA-QA Docker Test Runner
# Usage: ./docker/test-runner.sh [framework] [test-type] [options]

set -e

# Configuration
COMPOSE_FILE="docker-compose.test.yml"
NETWORK_NAME="pa_qa_test"
CLEANUP_ON_EXIT=true
PARALLEL_EXECUTION=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
PA-QA Docker Test Runner

Usage: $0 [framework] [test-type] [options]

Frameworks:
  react       Run React/Node.js tests
  fastapi     Run FastAPI/Python tests
  wordpress   Run WordPress/PHP tests
  all         Run all framework tests

Test Types:
  unit        Unit tests only
  integration Integration tests only
  e2e         End-to-end tests only
  load        Load/performance tests
  coverage    Generate coverage reports
  all         All test types (default)

Options:
  --parallel      Run tests in parallel
  --no-cleanup    Don't cleanup containers after tests
  --verbose       Verbose output
  --help          Show this help message

Examples:
  $0 react unit                    # Run React unit tests
  $0 fastapi --parallel           # Run all FastAPI tests in parallel
  $0 all coverage --no-cleanup    # Run coverage for all frameworks, keep containers
  $0 wordpress e2e --verbose      # Run WordPress E2E tests with verbose output

EOF
}

# Parse arguments
FRAMEWORK=""
TEST_TYPE="all"
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        react|fastapi|wordpress|all)
            FRAMEWORK="$1"
            shift
            ;;
        unit|integration|e2e|load|coverage|all)
            TEST_TYPE="$1"
            shift
            ;;
        --parallel)
            PARALLEL_EXECUTION=true
            shift
            ;;
        --no-cleanup)
            CLEANUP_ON_EXIT=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate framework
if [[ -z "$FRAMEWORK" ]]; then
    log_error "Framework is required"
    show_help
    exit 1
fi

# Setup cleanup trap
cleanup() {
    if [[ "$CLEANUP_ON_EXIT" == "true" ]]; then
        log_info "Cleaning up containers..."
        docker-compose -f "$COMPOSE_FILE" down -v
        docker network prune -f
        docker volume prune -f
    fi
}

trap cleanup EXIT

# Setup function
setup_environment() {
    log_info "Setting up test environment..."
    
    # Create network if it doesn't exist
    if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
        log_info "Creating test network: $NETWORK_NAME"
        docker network create "$NETWORK_NAME"
    fi
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build test images
    log_info "Building test images..."
    if [[ "$FRAMEWORK" == "all" ]]; then
        docker-compose -f "$COMPOSE_FILE" build
    else
        docker-compose -f "$COMPOSE_FILE" build "${FRAMEWORK}-tests"
    fi
}

# Test execution functions
run_react_tests() {
    local test_type="$1"
    log_info "Running React tests: $test_type"
    
    case "$test_type" in
        unit)
            docker-compose -f "$COMPOSE_FILE" run --rm react-tests npm run test:unit
            ;;
        integration)
            docker-compose -f "$COMPOSE_FILE" run --rm react-tests npm run test:integration
            ;;
        e2e)
            docker-compose -f "$COMPOSE_FILE" --profile e2e up --abort-on-container-exit react-e2e
            ;;
        coverage)
            docker-compose -f "$COMPOSE_FILE" run --rm react-tests npm run test:coverage
            ;;
        all)
            docker-compose -f "$COMPOSE_FILE" run --rm react-tests npm run test:ci
            if [[ "$PARALLEL_EXECUTION" == "true" ]]; then
                docker-compose -f "$COMPOSE_FILE" --profile e2e up -d react-e2e
            else
                docker-compose -f "$COMPOSE_FILE" --profile e2e up --abort-on-container-exit react-e2e
            fi
            ;;
    esac
}

run_fastapi_tests() {
    local test_type="$1"
    log_info "Running FastAPI tests: $test_type"
    
    case "$test_type" in
        unit)
            docker-compose -f "$COMPOSE_FILE" run --rm fastapi-tests pytest tests/unit/ -v
            ;;
        integration)
            docker-compose -f "$COMPOSE_FILE" run --rm fastapi-tests pytest tests/integration/ -v
            ;;
        load)
            docker-compose -f "$COMPOSE_FILE" --profile load up --abort-on-container-exit fastapi-load
            ;;
        coverage)
            docker-compose -f "$COMPOSE_FILE" run --rm fastapi-tests pytest --cov=app --cov-report=html
            ;;
        all)
            docker-compose -f "$COMPOSE_FILE" run --rm fastapi-tests pytest -v
            ;;
    esac
}

run_wordpress_tests() {
    local test_type="$1"
    log_info "Running WordPress tests: $test_type"
    
    case "$test_type" in
        unit)
            docker-compose -f "$COMPOSE_FILE" run --rm wordpress-tests composer test:unit
            ;;
        integration)
            docker-compose -f "$COMPOSE_FILE" run --rm wordpress-tests composer test:integration
            ;;
        e2e)
            docker-compose -f "$COMPOSE_FILE" --profile browser up --abort-on-container-exit wordpress-browser
            ;;
        coverage)
            docker-compose -f "$COMPOSE_FILE" run --rm wordpress-tests composer test:coverage
            ;;
        all)
            docker-compose -f "$COMPOSE_FILE" run --rm wordpress-tests composer test
            ;;
    esac
}

# Main execution function
run_tests() {
    case "$FRAMEWORK" in
        react)
            run_react_tests "$TEST_TYPE"
            ;;
        fastapi)
            run_fastapi_tests "$TEST_TYPE"
            ;;
        wordpress)
            run_wordpress_tests "$TEST_TYPE"
            ;;
        all)
            if [[ "$PARALLEL_EXECUTION" == "true" ]]; then
                log_info "Running all tests in parallel..."
                run_react_tests "$TEST_TYPE" &
                run_fastapi_tests "$TEST_TYPE" &
                run_wordpress_tests "$TEST_TYPE" &
                wait
            else
                run_react_tests "$TEST_TYPE"
                run_fastapi_tests "$TEST_TYPE"
                run_wordpress_tests "$TEST_TYPE"
            fi
            ;;
    esac
}

# Check results function
check_results() {
    log_info "Checking test results..."
    
    # Copy results from containers
    mkdir -p ./test-results
    
    # Copy Allure results
    if docker volume inspect "$(basename "$PWD")_allure_results" >/dev/null 2>&1; then
        docker run --rm -v "$(basename "$PWD")_allure_results:/source" -v "$(pwd)/test-results:/dest" alpine \
            sh -c "cp -r /source/* /dest/ 2>/dev/null || true"
    fi
    
    # Copy coverage reports
    for framework in react fastapi wordpress; do
        if docker-compose -f "$COMPOSE_FILE" ps -q "${framework}-tests" >/dev/null 2>&1; then
            docker-compose -f "$COMPOSE_FILE" run --rm "${framework}-tests" \
                sh -c "cp -r coverage-report/* /app/test-results/ 2>/dev/null || true" || true
        fi
    done
    
    log_success "Test results copied to ./test-results/"
}

# Main execution
main() {
    log_info "Starting PA-QA Docker Test Runner"
    log_info "Framework: $FRAMEWORK, Test Type: $TEST_TYPE"
    
    setup_environment
    run_tests
    check_results
    
    log_success "Test execution completed!"
}

# Run main function
main "$@"
```

### Cleanup Script (docker/cleanup.sh)

```bash
#!/bin/bash

# PA-QA Docker Cleanup Script
# Removes all test containers, volumes, and networks

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${YELLOW}[CLEANUP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${RED}[WARNING]${NC} $1"
}

# Stop and remove all test containers
log_info "Stopping test containers..."
docker-compose -f docker-compose.test.yml down -v --remove-orphans

# Remove test images
log_info "Removing test images..."
docker images --filter "label=pa-qa-test" -q | xargs -r docker rmi -f

# Remove test volumes
log_info "Cleaning up test volumes..."
docker volume ls --filter "label=pa-qa-test" -q | xargs -r docker volume rm

# Remove test networks
log_info "Cleaning up test networks..."
docker network ls --filter "name=pa_qa_test" -q | xargs -r docker network rm

# Prune unused resources
log_info "Pruning unused Docker resources..."
docker system prune -f

# Clean up test results
log_info "Cleaning up local test results..."
rm -rf test-results/
rm -rf allure-results/
rm -rf coverage-report/

log_success "Docker cleanup completed!"
```

## 🔧 Step 5: Environment Configuration

### Docker Ignore (.dockerignore)

```
# PA-QA Docker Ignore File

# Version control
.git
.gitignore

# Dependencies
node_modules/
vendor/
.venv/
venv/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
target/
*.egg-info/

# Test outputs
coverage-report/
allure-results/
allure-report/
test-results/
.coverage
.pytest_cache/

# Environment files
.env
.env.local
.env.*.local

# Logs
*.log
logs/

# Runtime
*.pid
*.seed
*.pid.lock

# Cache
.npm
.cache/
__pycache__/
*.pyc
*.pyo

# Documentation
*.md
docs/
README*
LICENSE
```

### Environment Variables (.env.docker)

```bash
# PA-QA Docker Environment Configuration

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=test_db
POSTGRES_USER=test
POSTGRES_PASSWORD=test

MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=wordpress_test
MYSQL_USER=root
MYSQL_PASSWORD=password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Application Configuration
NODE_ENV=test
ENVIRONMENT=test
DEBUG=false

# Security
SECRET_KEY=test-secret-key-for-docker
JWT_SECRET=test-jwt-secret

# External Services
SELENIUM_HOST=selenium
SELENIUM_PORT=4444

MAILHOG_HOST=mailhog
MAILHOG_SMTP_PORT=1025

# Allure Configuration
ALLURE_RESULTS_DIR=/app/allure-results
ALLURE_PROJECT_NAME=pa-qa-docker-tests

# Performance
WORKERS=2
MAX_CONNECTIONS=100
TIMEOUT=30

# Feature Flags
ENABLE_METRICS=true
ENABLE_TRACING=true
ENABLE_LOGGING=true
```

## 🔧 Step 6: Multi-Framework Testing

### Unified Test Script (scripts/test-all.sh)

```bash
#!/bin/bash

# Run tests for all supported frameworks

set -e

FRAMEWORKS=("react" "fastapi" "wordpress")
TEST_TYPES=("unit" "integration" "coverage")
PARALLEL=${PARALLEL:-false}
CLEANUP=${CLEANUP:-true}

# Create results directory
mkdir -p test-results/combined

# Function to run framework tests
run_framework_tests() {
    local framework=$1
    echo "🚀 Running $framework tests..."
    
    for test_type in "${TEST_TYPES[@]}"; do
        echo "  📋 Running $test_type tests for $framework..."
        
        ./docker/test-runner.sh "$framework" "$test_type" --no-cleanup
        
        # Copy results
        mkdir -p "test-results/combined/$framework"
        cp -r "test-results/*" "test-results/combined/$framework/" 2>/dev/null || true
    done
    
    echo "✅ Completed $framework tests"
}

# Main execution
echo "🔥 Starting PA-QA Multi-Framework Testing"

if [[ "$PARALLEL" == "true" ]]; then
    echo "🔄 Running frameworks in parallel..."
    
    for framework in "${FRAMEWORKS[@]}"; do
        run_framework_tests "$framework" &
    done
    
    wait
else
    echo "📋 Running frameworks sequentially..."
    
    for framework in "${FRAMEWORKS[@]}"; do
        run_framework_tests "$framework"
    done
fi

# Generate combined report
echo "📊 Generating combined test report..."
./scripts/generate-combined-report.sh

# Cleanup if requested
if [[ "$CLEANUP" == "true" ]]; then
    echo "🧹 Cleaning up..."
    ./docker/cleanup.sh
fi

echo "🎉 Multi-framework testing completed!"
echo "📁 Results available in: test-results/combined/"
```

### Combined Report Generator (scripts/generate-combined-report.sh)

```bash
#!/bin/bash

# Generate combined test report from all frameworks

RESULTS_DIR="test-results/combined"
REPORT_DIR="test-results/combined-report"

mkdir -p "$REPORT_DIR"

# Combine Allure results
echo "🔄 Combining Allure results..."
mkdir -p "$REPORT_DIR/allure-results"

find "$RESULTS_DIR" -name "allure-results" -type d | while read -r dir; do
    cp -r "$dir"/* "$REPORT_DIR/allure-results/" 2>/dev/null || true
done

# Generate Allure report
if command -v allure &> /dev/null; then
    echo "📊 Generating Allure report..."
    allure generate "$REPORT_DIR/allure-results" -o "$REPORT_DIR/allure-report" --clean
fi

# Combine coverage reports
echo "📈 Combining coverage reports..."
mkdir -p "$REPORT_DIR/coverage"

find "$RESULTS_DIR" -name "coverage-*" -type d | while read -r dir; do
    framework=$(basename $(dirname "$dir"))
    cp -r "$dir" "$REPORT_DIR/coverage/$framework" 2>/dev/null || true
done

# Create summary report
echo "📋 Creating summary report..."
cat > "$REPORT_DIR/summary.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>PA-QA Combined Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .framework { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
    </style>
</head>
<body>
    <h1>PA-QA Combined Test Report</h1>
    <p>Generated: $(date)</p>
    
    <h2>Framework Results</h2>
EOF

# Add framework results to summary
for framework in react fastapi wordpress; do
    if [[ -d "$RESULTS_DIR/$framework" ]]; then
        echo "    <div class='framework'>" >> "$REPORT_DIR/summary.html"
        echo "        <h3>$framework</h3>" >> "$REPORT_DIR/summary.html"
        echo "        <p><a href='coverage/$framework/index.html'>Coverage Report</a></p>" >> "$REPORT_DIR/summary.html"
        echo "    </div>" >> "$REPORT_DIR/summary.html"
    fi
done

cat >> "$REPORT_DIR/summary.html" << EOF
    
    <h2>Combined Reports</h2>
    <div class='framework'>
        <h3>Allure Report</h3>
        <p><a href='allure-report/index.html'>View Combined Allure Report</a></p>
    </div>
</body>
</html>
EOF

echo "✅ Combined report generated: $REPORT_DIR/summary.html"
```

## 🔧 Step 7: CI/CD Integration

### GitHub Actions Workflow (.github/workflows/docker-tests.yml)

```yaml
name: PA-QA Docker Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  DOCKER_BUILDKIT: 1
  COMPOSE_DOCKER_CLI_BUILD: 1

jobs:
  docker-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        framework: [react, fastapi, wordpress]
        test-type: [unit, integration, coverage]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Cache Docker layers
      uses: actions/cache@v3
      with:
        path: /tmp/.buildx-cache
        key: ${{ runner.os }}-buildx-${{ matrix.framework }}-${{ github.sha }}
        restore-keys: |
          ${{ runner.os }}-buildx-${{ matrix.framework }}-
    
    - name: Create test network
      run: docker network create pa_qa_test
    
    - name: Start shared services
      run: |
        docker-compose -f docker/docker-compose.services.yml up -d
        sleep 30
    
    - name: Run ${{ matrix.framework }} ${{ matrix.test-type }} tests
      run: |
        chmod +x docker/test-runner.sh
        ./docker/test-runner.sh ${{ matrix.framework }} ${{ matrix.test-type }} --no-cleanup
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results-${{ matrix.framework }}-${{ matrix.test-type }}
        path: test-results/
    
    - name: Upload to Allure Dashboard
      if: always()
      run: |
        if [ -f upload-results.sh ]; then
          ./upload-results.sh pa-qa-${{ matrix.framework }}-${{ matrix.test-type }}
        fi
    
    - name: Cleanup
      if: always()
      run: |
        docker-compose -f docker-compose.test.yml down -v
        docker network rm pa_qa_test

  combined-report:
    needs: docker-tests
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Download all test results
      uses: actions/download-artifact@v3
      with:
        path: test-results/
    
    - name: Generate combined report
      run: |
        chmod +x scripts/generate-combined-report.sh
        ./scripts/generate-combined-report.sh
    
    - name: Upload combined report
      uses: actions/upload-artifact@v3
      with:
        name: combined-test-report
        path: test-results/combined-report/
```

## ✅ Step 8: Usage Examples

### Basic Usage

```bash
# Run all React tests
./docker/test-runner.sh react

# Run FastAPI unit tests only
./docker/test-runner.sh fastapi unit

# Run WordPress E2E tests with verbose output
./docker/test-runner.sh wordpress e2e --verbose

# Run all frameworks in parallel
./docker/test-runner.sh all --parallel

# Generate coverage for all frameworks
./docker/test-runner.sh all coverage
```

### Advanced Usage

```bash
# Custom test configuration
PARALLEL=true CLEANUP=false ./scripts/test-all.sh

# Run specific test suites
docker-compose -f docker-compose.test.yml run --rm react-tests npm run test -- --grep "Button"

# Debug mode with shell access
docker-compose -f docker-compose.test.yml run --rm fastapi-tests bash

# Monitor test execution
docker-compose -f docker-compose.test.yml logs -f react-tests

# Run load tests
docker-compose -f docker-compose.test.yml --profile load up fastapi-load
```

### Troubleshooting

```bash
# Check container status
docker-compose -f docker-compose.test.yml ps

# View container logs
docker-compose -f docker-compose.test.yml logs react-tests

# Clean up everything
./docker/cleanup.sh

# Rebuild images
docker-compose -f docker-compose.test.yml build --no-cache

# Check resource usage
docker stats
```

## 🎯 Performance Optimization

### Resource Limits

Add to your services in `docker-compose.test.yml`:

```yaml
services:
  react-tests:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Caching Strategies

```bash
# Multi-stage build with dependency caching
FROM node:18-alpine AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM deps AS dev-deps
RUN npm ci

FROM dev-deps AS test
# Copy source and run tests
```

### Parallel Execution

```bash
# Run tests in parallel with resource limits
docker-compose -f docker-compose.test.yml up --scale react-tests=3
```

## 🆘 Troubleshooting

### Common Issues

**Port conflicts**
```bash
# Check what's using ports
lsof -i :5432
lsof -i :3306

# Use different ports in compose file
ports:
  - "5433:5432"  # PostgreSQL
  - "3307:3306"  # MySQL
```

**Memory issues**
```bash
# Increase Docker memory limit
# Docker Desktop: Preferences > Resources > Advanced > Memory: 8GB

# Monitor container memory usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

**Network issues**
```bash
# Recreate network
docker network rm pa_qa_test
docker network create pa_qa_test

# Check network connectivity
docker run --rm --network pa_qa_test alpine ping postgres
```

**Volume permissions**
```bash
# Fix volume permissions
docker run --rm -v $(pwd):/app alpine chown -R $(id -u):$(id -g) /app
```

### Get Help

- **Documentation**: `/docs/troubleshooting/common-issues.md`
- **Examples**: `/shared/docker-templates/testing/`
- **Community**: Join our Slack #docker-testing channel
- **Issues**: Create issue in PA-QA repository

## 📚 Additional Resources

- [PA-QA Best Practices](/docs/best-practices/testing-patterns.md)
- [CI/CD Integration Guide](/docs/setup-guides/ci-cd-integration.md)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Docker](https://docs.docker.com/develop/best-practices/)

---

**🎉 Congratulations!** Your projects now have comprehensive Docker testing setup with the PA-QA framework. You're ready to run consistent, isolated, and scalable tests across all environments with confidence.