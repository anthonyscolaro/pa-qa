# PA-QA Playwright E2E Testing Docker Image
# Optimized for CI/CD environments and consistent cross-platform testing

FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Install additional system dependencies
RUN apt-get update && apt-get install -y \
    # Additional fonts for better text rendering
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    # Image processing tools
    imagemagick \
    # PDF manipulation tools  
    poppler-utils \
    # Network tools for debugging
    curl \
    wget \
    # Process monitoring
    htop \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -r app && useradd -r -g app -G audio,video app \
    && mkdir -p /home/app/Downloads \
    && chown -R app:app /home/app \
    && chown -R app:app /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy test files
COPY . .

# Set proper permissions
RUN chown -R app:app /app

# Switch to app user
USER app

# Create directories for test results
RUN mkdir -p \
    test-results \
    allure-results \
    allure-report \
    results/screenshots \
    results/videos \
    results/traces \
    results/performance \
    .auth

# Environment variables
ENV NODE_ENV=test
ENV CI=true
ENV PWTEST_SKIP_TEST_OUTPUT=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["npm", "run", "test"]

# Labels for metadata
LABEL maintainer="PA-QA Team"
LABEL description="Playwright E2E testing environment for React applications"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/your-org/pa-qa"