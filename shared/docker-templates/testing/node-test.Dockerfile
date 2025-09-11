# Multi-stage Node.js test runner with browsers and Allure reporting
# Optimized for React, Vue, and other JavaScript/TypeScript projects

# Stage 1: Base dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies for browsers
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    wget \
    xvfb \
    dbus \
    fontconfig

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Stage 2: Dependencies installation
FROM base AS deps
COPY package*.json yarn.lock* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Stage 3: Test environment
FROM base AS test-env
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install additional test dependencies
RUN npm install -g @playwright/test allure-commandline

# Install Playwright browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/app/browsers
RUN npx playwright install chromium firefox webkit --with-deps

# Set environment variables for headless browsers
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/bin/chromium-browser
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Stage 4: Test runner
FROM test-env AS test-runner

# Create directories for test outputs
RUN mkdir -p /app/test-results /app/allure-results /app/coverage /app/reports

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set proper permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Default command runs all tests
CMD ["npm", "run", "test:ci"]

# Stage 5: E2E test runner (specialized for end-to-end tests)
FROM test-env AS e2e-runner

# Install additional E2E dependencies
RUN npm install -g wait-on concurrently

# Create E2E specific directories
RUN mkdir -p /app/e2e-results /app/screenshots /app/videos

# E2E health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD npx playwright --version && curl -f http://localhost:3000 || exit 1

# Set proper permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Default command for E2E tests
CMD ["npm", "run", "test:e2e:ci"]

# Stage 6: Performance test runner
FROM test-env AS perf-runner

# Install Lighthouse and performance testing tools
RUN npm install -g lighthouse lighthouse-ci @lhci/cli web-vitals-cli

# Create performance test directories
RUN mkdir -p /app/lighthouse-results /app/performance-reports

# Performance health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD lighthouse --version && curl -f http://localhost:3000 || exit 1

# Set proper permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Default command for performance tests
CMD ["npm", "run", "test:performance"]

# Stage 7: All-in-one test suite runner
FROM test-env AS full-suite

# Install all testing tools
RUN npm install -g \
    @playwright/test \
    allure-commandline \
    lighthouse \
    lighthouse-ci \
    @lhci/cli \
    web-vitals-cli \
    wait-on \
    concurrently

# Create all test output directories
RUN mkdir -p \
    /app/test-results \
    /app/allure-results \
    /app/coverage \
    /app/reports \
    /app/e2e-results \
    /app/screenshots \
    /app/videos \
    /app/lighthouse-results \
    /app/performance-reports

# Comprehensive health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=3 \
    CMD npx playwright --version && \
        lighthouse --version && \
        curl -f http://localhost:3000 || exit 1

# Set proper permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Default command runs full test suite
CMD ["npm", "run", "test:all"]

# Labels for container management
LABEL maintainer="PA-QA Framework"
LABEL version="2.0.0"
LABEL description="Multi-stage Node.js test runner with browsers and performance testing"
LABEL org.opencontainers.image.source="https://github.com/projectassistant/pa-qa"