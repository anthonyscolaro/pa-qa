# PA-QA PHP Development Makefile
# Provides convenient commands for PHP code quality and testing

.PHONY: help install test lint fix security analyze clean setup-hooks ci deploy-check

# Default target
help: ## Show this help message
	@echo 'Usage: make <target>'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and setup
install: ## Install dependencies
	composer install --prefer-dist --no-progress --no-suggest
	@echo "Dependencies installed successfully"

install-dev: ## Install development dependencies
	composer install --prefer-dist --no-progress --no-suggest --dev
	@echo "Development dependencies installed successfully"

setup-hooks: ## Install pre-commit hooks
	composer install-hooks
	pre-commit install
	@echo "Git hooks installed successfully"

# Code quality checks
lint: ## Run all linting checks
	@echo "Running PHP_CodeSniffer..."
	composer cs:check
	@echo "Running PHP-CS-Fixer (dry run)..."
	composer cs
	@echo "All linting checks passed"

lint-fix: ## Fix all automatically fixable linting issues
	@echo "Running PHP_CodeSniffer auto-fix..."
	composer cs:fix-phpcs
	@echo "Running PHP-CS-Fixer..."
	composer cs:fix
	@echo "Linting issues fixed"

# Static analysis
analyze: ## Run static analysis tools
	@echo "Running PHPStan..."
	composer stan
	@echo "Running Psalm..."
	composer psalm
	@echo "Static analysis completed"

# Code quality metrics
metrics: ## Run code quality metrics
	@echo "Running PHP Mess Detector..."
	composer md
	@echo "Running Copy-Paste Detector..."
	composer cpd
	@echo "Running Magic Number Detector..."
	composer mnd
	@echo "Code quality metrics completed"

insights: ## Run PHP Insights analysis
	composer insights

# Testing
test: ## Run PHPUnit tests
	composer test

test-coverage: ## Run tests with coverage report
	composer test:coverage

test-coverage-text: ## Run tests with text coverage output
	composer test:coverage-text

test-unit: ## Run only unit tests
	vendor/bin/phpunit --testsuite=Unit

test-feature: ## Run only feature tests
	vendor/bin/phpunit --testsuite=Feature

test-integration: ## Run only integration tests
	vendor/bin/phpunit --testsuite=Integration

# Refactoring
refactor: ## Check for automated refactoring opportunities
	composer rector

refactor-fix: ## Apply automated refactoring
	composer rector:fix

# Security
security: ## Run security checks
	@echo "Running Composer security audit..."
	composer audit
	@echo "Security checks completed"

security-full: ## Run comprehensive security checks
	@echo "Running Composer security audit..."
	composer audit
	@echo "Checking for hardcoded secrets..."
	@if command -v detect-secrets >/dev/null 2>&1; then \
		detect-secrets scan --baseline .secrets.baseline; \
	else \
		echo "detect-secrets not installed, skipping secret detection"; \
	fi
	@echo "Security checks completed"

# Combined quality checks
quality: ## Run all quality checks
	@echo "Running comprehensive quality checks..."
	composer quality

quality-fix: ## Fix all automatically fixable quality issues
	@echo "Fixing all automatically fixable issues..."
	composer quality:fix

# CI/CD
ci: ## Run CI pipeline checks
	@echo "Running CI pipeline..."
	composer ci

pre-commit: ## Run pre-commit checks
	@echo "Running pre-commit checks..."
	composer pre-commit

# Docker support
docker-build: ## Build Docker image for testing
	docker build -t pa-qa-php -f docker/Dockerfile.test .

docker-test: ## Run tests in Docker container
	docker run --rm -v $(PWD):/app pa-qa-php make test

docker-quality: ## Run quality checks in Docker container
	docker run --rm -v $(PWD):/app pa-qa-php make quality

# WordPress specific
wp-install: ## Install WordPress dependencies
	@if [ -f "wp-cli.yml" ]; then \
		wp core download --allow-root; \
		wp config create --dbname=wordpress_test --dbuser=root --dbpass=password --allow-root; \
		wp db create --allow-root; \
		wp core install --url=localhost --title="Test Site" --admin_user=admin --admin_password=password --admin_email=test@example.com --allow-root; \
	else \
		echo "Not a WordPress project"; \
	fi

wp-test: ## Run WordPress specific tests
	@if [ -f "wp-cli.yml" ]; then \
		vendor/bin/phpunit -c phpunit-wp.xml; \
	else \
		echo "Not a WordPress project, running regular tests"; \
		make test; \
	fi

# Laravel specific
laravel-key: ## Generate Laravel application key
	@if [ -f "artisan" ]; then \
		php artisan key:generate; \
	else \
		echo "Not a Laravel project"; \
	fi

laravel-migrate: ## Run Laravel migrations
	@if [ -f "artisan" ]; then \
		php artisan migrate:fresh --seed; \
	else \
		echo "Not a Laravel project"; \
	fi

laravel-test: ## Run Laravel specific tests
	@if [ -f "artisan" ]; then \
		php artisan test; \
	else \
		echo "Not a Laravel project, running regular tests"; \
		make test; \
	fi

# Cleanup
clean: ## Clean build artifacts and caches
	@echo "Cleaning build artifacts..."
	rm -rf build/
	rm -rf .phpunit.result.cache
	rm -rf .php-cs-fixer.cache
	@if [ -d "vendor" ]; then \
		rm -rf vendor/; \
	fi
	@echo "Cleanup completed"

clean-cache: ## Clean only caches (keep vendor)
	@echo "Cleaning caches..."
	rm -rf build/
	rm -rf .phpunit.result.cache
	rm -rf .php-cs-fixer.cache
	@if [ -d "storage/framework/cache" ]; then \
		rm -rf storage/framework/cache/*; \
	fi
	@echo "Cache cleanup completed"

# Development utilities
fix: ## Fix all automatically fixable issues (alias for quality-fix)
	make quality-fix

check: ## Run all checks (alias for quality)
	make quality

deploy-check: ## Check if code is ready for deployment
	@echo "Checking deployment readiness..."
	make quality
	make test
	make security
	@echo "Code is ready for deployment!"

# IDE integration
ide-setup: ## Setup IDE configuration files
	@echo "Setting up IDE configuration..."
	@if [ ! -f ".editorconfig" ]; then \
		cp shared/ide-configs/.editorconfig .editorconfig; \
	fi
	@if [ ! -d ".vscode" ] && [ -d "shared/ide-configs/vscode" ]; then \
		cp -r shared/ide-configs/vscode .vscode; \
	fi
	@echo "IDE configuration completed"

# Documentation
docs: ## Generate documentation
	@if command -v phpdoc >/dev/null 2>&1; then \
		phpdoc -d src -t docs/api; \
		echo "Documentation generated in docs/api"; \
	else \
		echo "phpDocumentor not installed"; \
	fi

# Environment setup
env: ## Setup environment file
	@if [ ! -f ".env" ] && [ -f ".env.example" ]; then \
		cp .env.example .env; \
		echo "Environment file created from .env.example"; \
	else \
		echo "Environment file already exists or .env.example not found"; \
	fi

# Performance
benchmark: ## Run performance benchmarks
	@if [ -f "vendor/bin/phpbench" ]; then \
		vendor/bin/phpbench run; \
	else \
		echo "PHPBench not installed"; \
	fi

# Monitoring
monitor: ## Start monitoring tools
	@echo "Starting PHP monitoring..."
	@if command -v tail >/dev/null 2>&1; then \
		tail -f storage/logs/laravel.log 2>/dev/null || echo "No Laravel logs found"; \
	fi

# Update dependencies
update: ## Update all dependencies
	composer update
	@echo "Dependencies updated"

update-dry: ## Show what would be updated
	composer outdated

# Validate configuration
validate: ## Validate all configuration files
	composer validate --strict
	@if [ -f "phpstan.neon" ]; then \
		vendor/bin/phpstan --no-progress --no-ansi analyse --configuration=phpstan.neon --dry-run || true; \
	fi
	@if [ -f "psalm.xml" ]; then \
		vendor/bin/psalm --config=psalm.xml --show-info=false --dry-run || true; \
	fi
	@echo "Configuration validation completed"