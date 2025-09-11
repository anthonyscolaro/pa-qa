# Multi-stage Python test runner optimized for FastAPI and other Python projects
# Includes pytest, async testing, performance monitoring, and Allure reporting

# Stage 1: Base Python environment
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_VERSION=1.7.1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libpq-dev \
    libssl-dev \
    libffi-dev \
    libjpeg-dev \
    libpng-dev \
    zlib1g-dev \
    chromium \
    chromium-driver \
    firefox-esr \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
WORKDIR /app

# Stage 2: Dependencies installation
FROM base AS deps

# Install Poetry
RUN pip install poetry==$POETRY_VERSION

# Copy dependency files
COPY pyproject.toml poetry.lock* requirements*.txt ./

# Install dependencies based on available files
RUN if [ -f "poetry.lock" ]; then \
        poetry config virtualenvs.create false && \
        poetry install --no-dev; \
    elif [ -f "requirements.txt" ]; then \
        pip install -r requirements.txt; \
    else \
        echo "No dependency file found"; \
    fi

# Install common test dependencies
RUN pip install \
    pytest==7.4.3 \
    pytest-asyncio==0.21.1 \
    pytest-cov==4.1.0 \
    pytest-mock==3.12.0 \
    pytest-xdist==3.5.0 \
    pytest-html==4.1.1 \
    pytest-benchmark==4.0.0 \
    httpx==0.25.2 \
    faker==20.1.0 \
    factory-boy==3.3.0 \
    allure-pytest==2.13.2 \
    selenium==4.15.2 \
    playwright==1.40.0

# Stage 3: Test environment
FROM deps AS test-env

# Install Playwright browsers
RUN playwright install chromium firefox webkit

# Copy application code
COPY . .

# Create test output directories
RUN mkdir -p \
    /app/test-results \
    /app/allure-results \
    /app/coverage \
    /app/reports \
    /app/logs \
    /app/screenshots

# Stage 4: Unit test runner
FROM test-env AS unit-runner

# Health check for unit tests
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import pytest; print('pytest ready')" || exit 1

# Set proper permissions
RUN chown -R app:app /app
USER app

# Default command for unit tests
CMD ["pytest", "tests/unit/", "-v", "--cov=.", "--cov-report=html:coverage/", "--cov-report=xml", "--junit-xml=test-results/junit.xml"]

# Stage 5: Integration test runner
FROM test-env AS integration-runner

# Install additional dependencies for integration tests
RUN pip install \
    testcontainers==3.7.1 \
    docker==6.1.3 \
    psycopg2-binary==2.9.9 \
    redis==5.0.1 \
    pymongo==4.6.0

# Health check for integration tests
HEALTHCHECK --interval=30s --timeout=20s --start-period=10s --retries=3 \
    CMD python -c "import pytest, docker; print('integration test environment ready')" || exit 1

# Set proper permissions
RUN chown -R app:app /app
USER app

# Default command for integration tests
CMD ["pytest", "tests/integration/", "-v", "--junit-xml=test-results/integration-junit.xml"]

# Stage 6: E2E test runner
FROM test-env AS e2e-runner

# Install additional E2E testing tools
RUN pip install \
    selenium==4.15.2 \
    playwright==1.40.0 \
    requests==2.31.0

# Set browser environment variables
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/app/browsers

# Health check for E2E tests
HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=3 \
    CMD python -c "import playwright; print('E2E environment ready')" && \
        curl -f http://localhost:8000/health || exit 1

# Set proper permissions
RUN chown -R app:app /app
USER app

# Default command for E2E tests
CMD ["pytest", "tests/e2e/", "-v", "--headed", "--junit-xml=test-results/e2e-junit.xml"]

# Stage 7: Performance test runner
FROM test-env AS perf-runner

# Install performance testing tools
RUN pip install \
    locust==2.17.0 \
    pytest-benchmark==4.0.0 \
    memory-profiler==0.61.0 \
    py-spy==0.3.14

# Install system monitoring tools
RUN apt-get update && apt-get install -y \
    htop \
    iotop \
    nethogs \
    && rm -rf /var/lib/apt/lists/*

# Health check for performance tests
HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=3 \
    CMD python -c "import locust; print('performance testing ready')" || exit 1

# Set proper permissions
RUN chown -R app:app /app
USER app

# Default command for performance tests
CMD ["pytest", "tests/performance/", "-v", "--benchmark-json=test-results/benchmark.json"]

# Stage 8: Load test runner (Locust)
FROM perf-runner AS load-runner

# Expose Locust web interface port
EXPOSE 8089

# Health check for load tests
HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8089/ || exit 1

# Default command for load tests
CMD ["locust", "--host=http://app:8000", "--web-host=0.0.0.0"]

# Stage 9: Full test suite runner
FROM test-env AS full-suite

# Install all testing dependencies
RUN pip install \
    testcontainers==3.7.1 \
    docker==6.1.3 \
    psycopg2-binary==2.9.9 \
    redis==5.0.1 \
    pymongo==4.6.0 \
    selenium==4.15.2 \
    playwright==1.40.0 \
    locust==2.17.0 \
    pytest-benchmark==4.0.0 \
    memory-profiler==0.61.0 \
    py-spy==0.3.14

# Install system monitoring tools
RUN apt-get update && apt-get install -y \
    htop \
    iotop \
    nethogs \
    && rm -rf /var/lib/apt/lists/*

# Create comprehensive test output directories
RUN mkdir -p \
    /app/test-results/unit \
    /app/test-results/integration \
    /app/test-results/e2e \
    /app/test-results/performance \
    /app/allure-results \
    /app/coverage \
    /app/reports \
    /app/logs \
    /app/screenshots \
    /app/videos \
    /app/profiles

# Comprehensive health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=20s --retries=3 \
    CMD python -c "import pytest, playwright, locust, docker; print('full test suite ready')" || exit 1

# Set proper permissions
RUN chown -R app:app /app
USER app

# Default command runs full test suite
CMD ["pytest", "tests/", "-v", "--cov=.", "--cov-report=html:coverage/", "--cov-report=xml", "--junit-xml=test-results/all-tests-junit.xml", "--alluredir=allure-results"]

# Stage 10: Security test runner
FROM test-env AS security-runner

# Install security testing tools
RUN pip install \
    bandit==1.7.5 \
    safety==2.3.5 \
    semgrep==1.50.0 \
    pip-audit==2.6.1

# Health check for security tests
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD python -c "import bandit; print('security testing ready')" || exit 1

# Set proper permissions
RUN chown -R app:app /app
USER app

# Default command for security tests
CMD ["sh", "-c", "bandit -r . -f json -o test-results/bandit.json && safety check --json --output test-results/safety.json && pip-audit --format=json --output=test-results/pip-audit.json"]

# Labels for container management
LABEL maintainer="PA-QA Framework"
LABEL version="2.0.0"
LABEL description="Multi-stage Python test runner with FastAPI support and comprehensive testing tools"
LABEL org.opencontainers.image.source="https://github.com/projectassistant/pa-qa"