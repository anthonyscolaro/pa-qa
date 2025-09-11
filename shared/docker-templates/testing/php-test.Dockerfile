# Multi-stage PHP test runner optimized for WordPress and general PHP projects
# Includes PHPUnit, WordPress Test Suite, Codeception, and quality tools

# Stage 1: Base PHP environment with extensions
FROM php:8.2-cli AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    zip \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libxml2-dev \
    libxslt-dev \
    libonig-dev \
    libicu-dev \
    mariadb-client \
    sqlite3 \
    chromium \
    chromium-driver \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        gd \
        zip \
        pdo \
        pdo_mysql \
        mysqli \
        mbstring \
        xml \
        xmlrpc \
        xsl \
        intl \
        bcmath \
        exif

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/v2.9.0/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Create non-root user
RUN useradd -ms /bin/bash wordpress
WORKDIR /var/www/html

# Stage 2: Dependencies installation
FROM base AS deps

# Copy composer files
COPY composer.json composer.lock* ./

# Install PHP dependencies
RUN if [ -f "composer.lock" ]; then \
        composer install --no-dev --optimize-autoloader; \
    else \
        composer install --no-dev --optimize-autoloader --no-scripts; \
    fi

# Install common test dependencies
RUN composer require --dev \
    phpunit/phpunit:^10.5 \
    codeception/codeception:^5.0 \
    squizlabs/php_codesniffer:^3.7 \
    phpstan/phpstan:^1.10 \
    phpmd/phpmd:^2.15 \
    infection/infection:^0.27 \
    allure-framework/allure-phpunit:^2.2 \
    wp-cli/wp-cli-bundle:^2.9

# Stage 3: WordPress test environment
FROM deps AS wp-test-env

# Set WordPress environment variables
ENV WP_VERSION=6.4.2 \
    WP_TESTS_DIR=/tmp/wordpress-tests-lib \
    WP_CORE_DIR=/tmp/wordpress

# Install WordPress test suite
RUN mkdir -p $WP_TESTS_DIR $WP_CORE_DIR \
    && wget -nv -O /tmp/install-wp-tests.sh https://raw.githubusercontent.com/wp-cli/scaffold-command/v2.0.19/templates/install-wp-tests.sh \
    && chmod +x /tmp/install-wp-tests.sh

# Copy application code
COPY . .

# Create test output directories
RUN mkdir -p \
    /var/www/html/test-results \
    /var/www/html/allure-results \
    /var/www/html/coverage \
    /var/www/html/reports \
    /var/www/html/logs \
    /var/www/html/screenshots

# Stage 4: Unit test runner
FROM wp-test-env AS unit-runner

# Configure PHPUnit
COPY phpunit.xml* ./

# Health check for unit tests
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD php -v && composer --version || exit 1

# Set proper permissions
RUN chown -R wordpress:wordpress /var/www/html
USER wordpress

# Default command for unit tests
CMD ["vendor/bin/phpunit", "--configuration=phpunit.xml", "--coverage-html=coverage/", "--coverage-clover=coverage/clover.xml", "--log-junit=test-results/junit.xml"]

# Stage 5: WordPress integration test runner
FROM wp-test-env AS wp-integration-runner

# Set up WordPress test database
ENV WP_DB_NAME=wordpress_test \
    WP_DB_USER=root \
    WP_DB_PASSWORD=password \
    WP_DB_HOST=mysql:3306

# Install WordPress for testing
RUN /tmp/install-wp-tests.sh $WP_DB_NAME $WP_DB_USER $WP_DB_PASSWORD $WP_DB_HOST $WP_VERSION

# Health check for WordPress integration tests
HEALTHCHECK --interval=30s --timeout=20s --start-period=15s --retries=3 \
    CMD wp --allow-root core version && mysql -h$WP_DB_HOST -u$WP_DB_USER -p$WP_DB_PASSWORD -e "SELECT 1" || exit 1

# Set proper permissions
RUN chown -R wordpress:wordpress /var/www/html
USER wordpress

# Default command for WordPress integration tests
CMD ["vendor/bin/phpunit", "--configuration=phpunit-integration.xml", "--log-junit=test-results/integration-junit.xml"]

# Stage 6: E2E test runner (Codeception)
FROM wp-test-env AS e2e-runner

# Install Codeception and Selenium dependencies
RUN composer require --dev \
    codeception/module-webdriver:^3.0 \
    codeception/module-rest:^3.0 \
    codeception/module-db:^3.0

# Set browser environment variables
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

# Initialize Codeception
RUN if [ ! -f "codeception.yml" ]; then \
        vendor/bin/codecept bootstrap; \
    fi

# Health check for E2E tests
HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=3 \
    CMD vendor/bin/codecept --version && curl -f http://localhost:80/ || exit 1

# Set proper permissions
RUN chown -R wordpress:wordpress /var/www/html
USER wordpress

# Default command for E2E tests
CMD ["vendor/bin/codecept", "run", "acceptance", "--xml=test-results/codeception.xml", "--html=test-results/codeception.html"]

# Stage 7: Code quality runner
FROM wp-test-env AS quality-runner

# Install additional quality tools
RUN composer require --dev \
    phpmetrics/phpmetrics:^2.8 \
    sebastian/phpcpd:^6.0 \
    pdepend/pdepend:^2.16

# Health check for code quality tests
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD vendor/bin/phpcs --version && vendor/bin/phpstan --version || exit 1

# Set proper permissions
RUN chown -R wordpress:wordpress /var/www/html
USER wordpress

# Default command for code quality analysis
CMD ["sh", "-c", "vendor/bin/phpcs --standard=PSR12 --report=junit --report-file=test-results/phpcs.xml src/ && vendor/bin/phpstan analyse --error-format=junit > test-results/phpstan.xml && vendor/bin/phpmd src/ xml cleancode,codesize,controversial,design,naming,unusedcode --reportfile test-results/phpmd.xml"]

# Stage 8: Security test runner
FROM wp-test-env AS security-runner

# Install security testing tools
RUN composer require --dev \
    roave/security-advisories:dev-latest \
    enlightn/security-checker:^1.10

# Health check for security tests
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD vendor/bin/security-checker --version || exit 1

# Set proper permissions
RUN chown -R wordpress:wordpress /var/www/html
USER wordpress

# Default command for security tests
CMD ["sh", "-c", "composer audit --format=plain > test-results/composer-audit.txt && vendor/bin/security-checker security:check --format=json > test-results/security-check.json"]

# Stage 9: Performance test runner
FROM wp-test-env AS perf-runner

# Install performance testing tools
RUN composer require --dev \
    phpbench/phpbench:^1.2 \
    blackfire/php-sdk:^1.33

# Install Apache Bench for load testing
RUN apt-get update && apt-get install -y apache2-utils && rm -rf /var/lib/apt/lists/*

# Health check for performance tests
HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=3 \
    CMD vendor/bin/phpbench --version && ab -V || exit 1

# Set proper permissions
RUN chown -R wordpress:wordpress /var/www/html
USER wordpress

# Default command for performance tests
CMD ["vendor/bin/phpbench", "run", "--report=default", "--dump-file=test-results/phpbench.xml"]

# Stage 10: Full test suite runner
FROM wp-test-env AS full-suite

# Install all testing dependencies
RUN composer require --dev \
    codeception/module-webdriver:^3.0 \
    codeception/module-rest:^3.0 \
    codeception/module-db:^3.0 \
    phpmetrics/phpmetrics:^2.8 \
    sebastian/phpcpd:^6.0 \
    pdepend/pdepend:^2.16 \
    roave/security-advisories:dev-latest \
    enlightn/security-checker:^1.10 \
    phpbench/phpbench:^1.2 \
    blackfire/php-sdk:^1.33

# Install system tools
RUN apt-get update && apt-get install -y apache2-utils && rm -rf /var/lib/apt/lists/*

# Set up WordPress test environment
ENV WP_DB_NAME=wordpress_test \
    WP_DB_USER=root \
    WP_DB_PASSWORD=password \
    WP_DB_HOST=mysql:3306

# Install WordPress for testing
RUN /tmp/install-wp-tests.sh $WP_DB_NAME $WP_DB_USER $WP_DB_PASSWORD $WP_DB_HOST $WP_VERSION

# Initialize Codeception if needed
RUN if [ ! -f "codeception.yml" ]; then \
        vendor/bin/codecept bootstrap; \
    fi

# Create comprehensive test output directories
RUN mkdir -p \
    /var/www/html/test-results/unit \
    /var/www/html/test-results/integration \
    /var/www/html/test-results/e2e \
    /var/www/html/test-results/quality \
    /var/www/html/test-results/security \
    /var/www/html/test-results/performance \
    /var/www/html/allure-results \
    /var/www/html/coverage \
    /var/www/html/reports \
    /var/www/html/logs \
    /var/www/html/screenshots

# Comprehensive health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=20s --retries=3 \
    CMD vendor/bin/phpunit --version && \
        vendor/bin/codecept --version && \
        vendor/bin/phpcs --version && \
        wp --allow-root core version || exit 1

# Set proper permissions
RUN chown -R wordpress:wordpress /var/www/html
USER wordpress

# Default command runs full test suite
CMD ["sh", "-c", "vendor/bin/phpunit --configuration=phpunit.xml --coverage-html=coverage/ --coverage-clover=coverage/clover.xml --log-junit=test-results/phpunit.xml && vendor/bin/codecept run --xml=test-results/codeception.xml"]

# Labels for container management
LABEL maintainer="PA-QA Framework"
LABEL version="2.0.0"
LABEL description="Multi-stage PHP test runner with WordPress support and comprehensive testing tools"
LABEL org.opencontainers.image.source="https://github.com/projectassistant/pa-qa"