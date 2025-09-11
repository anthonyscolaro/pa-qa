# PA-QA Python Development Makefile
# Provides convenient commands for development workflow
# Usage: make <command>

.PHONY: help install install-dev test lint format type-check security clean build docs pre-commit setup-dev all

# Default target
.DEFAULT_GOAL := help

# Variables
PYTHON := python3
PIP := pip
PROJECT_NAME := pa-qa-python
SRC_DIR := src
TEST_DIR := tests
DOCS_DIR := docs

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
RESET := \033[0m

# Help target
help: ## Show this help message
	@echo "$(CYAN)PA-QA Python Development Commands$(RESET)"
	@echo ""
	@echo "$(GREEN)Setup and Installation:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Setup|Installation/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Code Quality:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Quality|Lint|Format|Type|Security/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Testing:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Test/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Development:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Development|Build|Clean|Doc/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Utilities:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Util|Check|Info/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Setup and Installation
install: ## Installation - Install production dependencies
	@echo "$(BLUE)Installing production dependencies...$(RESET)"
	$(PIP) install -e .

install-dev: ## Installation - Install development dependencies
	@echo "$(BLUE)Installing development dependencies...$(RESET)"
	$(PIP) install -e ".[dev]"
	$(PIP) install -r requirements-dev.txt

setup-dev: install-dev pre-commit-install ## Setup - Complete development environment setup
	@echo "$(GREEN)Development environment setup complete!$(RESET)"

# Code Quality
lint: ## Quality - Run all linting tools (Ruff, Bandit, PyDocStyle)
	@echo "$(BLUE)Running Ruff linting...$(RESET)"
	ruff check $(SRC_DIR) $(TEST_DIR) --fix
	@echo "$(BLUE)Running Bandit security checks...$(RESET)"
	bandit -r $(SRC_DIR) -f json -o bandit-report.json || true
	@echo "$(BLUE)Running PyDocStyle...$(RESET)"
	pydocstyle $(SRC_DIR) || true

lint-check: ## Quality - Run linting without auto-fixing
	@echo "$(BLUE)Running Ruff linting (check only)...$(RESET)"
	ruff check $(SRC_DIR) $(TEST_DIR)
	@echo "$(BLUE)Running Bandit security checks...$(RESET)"
	bandit -r $(SRC_DIR)
	@echo "$(BLUE)Running PyDocStyle...$(RESET)"
	pydocstyle $(SRC_DIR)

format: ## Quality - Format code with Black and Ruff
	@echo "$(BLUE)Formatting code with Black...$(RESET)"
	black $(SRC_DIR) $(TEST_DIR)
	@echo "$(BLUE)Formatting imports with Ruff...$(RESET)"
	ruff check $(SRC_DIR) $(TEST_DIR) --select I --fix
	@echo "$(GREEN)Code formatting complete!$(RESET)"

format-check: ## Quality - Check code formatting without changing files
	@echo "$(BLUE)Checking code formatting...$(RESET)"
	black --check $(SRC_DIR) $(TEST_DIR)
	ruff check $(SRC_DIR) $(TEST_DIR) --select I

type-check: ## Quality - Run static type checking with MyPy
	@echo "$(BLUE)Running MyPy type checking...$(RESET)"
	mypy $(SRC_DIR)

security: ## Security - Run security analysis tools
	@echo "$(BLUE)Running Bandit security analysis...$(RESET)"
	bandit -r $(SRC_DIR) -f json -o bandit-report.json
	@echo "$(BLUE)Running Safety vulnerability check...$(RESET)"
	safety check --json --output safety-report.json || true
	@echo "$(BLUE)Running Semgrep security analysis...$(RESET)"
	semgrep --config=auto $(SRC_DIR) --json --output=semgrep-report.json || true

# Testing
test: ## Test - Run all tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(RESET)"
	pytest $(TEST_DIR) --cov=$(SRC_DIR) --cov-report=html --cov-report=xml --cov-report=term-missing

test-unit: ## Test - Run unit tests only
	@echo "$(BLUE)Running unit tests...$(RESET)"
	pytest $(TEST_DIR) -m "unit" --cov=$(SRC_DIR)

test-integration: ## Test - Run integration tests only
	@echo "$(BLUE)Running integration tests...$(RESET)"
	pytest $(TEST_DIR) -m "integration" --cov=$(SRC_DIR)

test-e2e: ## Test - Run end-to-end tests only
	@echo "$(BLUE)Running e2e tests...$(RESET)"
	pytest $(TEST_DIR) -m "e2e"

test-fast: ## Test - Run tests without coverage (faster)
	@echo "$(BLUE)Running fast tests...$(RESET)"
	pytest $(TEST_DIR) --no-cov -x

test-verbose: ## Test - Run tests with verbose output
	@echo "$(BLUE)Running tests with verbose output...$(RESET)"
	pytest $(TEST_DIR) -v --cov=$(SRC_DIR) --cov-report=term-missing

test-parallel: ## Test - Run tests in parallel
	@echo "$(BLUE)Running tests in parallel...$(RESET)"
	pytest $(TEST_DIR) -n auto --cov=$(SRC_DIR)

test-watch: ## Test - Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(RESET)"
	pytest-watch $(TEST_DIR) --cov=$(SRC_DIR)

# Pre-commit
pre-commit-install: ## Setup - Install pre-commit hooks
	@echo "$(BLUE)Installing pre-commit hooks...$(RESET)"
	pre-commit install
	pre-commit install --hook-type commit-msg

pre-commit-run: ## Quality - Run all pre-commit hooks
	@echo "$(BLUE)Running pre-commit hooks...$(RESET)"
	pre-commit run --all-files

pre-commit-update: ## Setup - Update pre-commit hooks
	@echo "$(BLUE)Updating pre-commit hooks...$(RESET)"
	pre-commit autoupdate

# Development utilities
check-all: lint-check format-check type-check security test ## Quality - Run all quality checks
	@echo "$(GREEN)All quality checks completed!$(RESET)"

fix-all: format lint ## Quality - Apply all auto-fixes
	@echo "$(GREEN)All auto-fixes applied!$(RESET)"

clean: ## Development - Clean build artifacts and cache files
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf .ruff_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf coverage.xml
	rm -rf coverage.json
	rm -rf .tox/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type f -name "coverage.xml" -delete
	find . -name "*.orig" -delete

clean-reports: ## Development - Clean test and analysis reports
	@echo "$(BLUE)Cleaning reports...$(RESET)"
	rm -f bandit-report.json
	rm -f safety-report.json
	rm -f semgrep-report.json
	rm -f pytest-report.xml
	rm -f mypy-report.txt

# Build and distribution
build: clean ## Build - Build distribution packages
	@echo "$(BLUE)Building distribution packages...$(RESET)"
	$(PYTHON) -m build

build-wheel: ## Build - Build wheel package only
	@echo "$(BLUE)Building wheel package...$(RESET)"
	$(PYTHON) -m build --wheel

build-sdist: ## Build - Build source distribution only
	@echo "$(BLUE)Building source distribution...$(RESET)"
	$(PYTHON) -m build --sdist

# Documentation
docs: ## Documentation - Build documentation
	@echo "$(BLUE)Building documentation...$(RESET)"
	sphinx-build -b html $(DOCS_DIR) docs/_build/html

docs-serve: docs ## Documentation - Serve documentation locally
	@echo "$(BLUE)Serving documentation at http://localhost:8000$(RESET)"
	cd docs/_build/html && $(PYTHON) -m http.server 8000

docs-watch: ## Documentation - Build and serve docs with auto-reload
	@echo "$(BLUE)Building and serving documentation with auto-reload...$(RESET)"
	sphinx-autobuild $(DOCS_DIR) docs/_build/html --host 0.0.0.0 --port 8000

# Performance and profiling
benchmark: ## Test - Run performance benchmarks
	@echo "$(BLUE)Running performance benchmarks...$(RESET)"
	pytest $(TEST_DIR) -m "benchmark" --benchmark-only

profile: ## Development - Profile application performance
	@echo "$(BLUE)Profiling application...$(RESET)"
	py-spy record -o profile.svg -- $(PYTHON) -m pytest $(TEST_DIR)

memory-profile: ## Development - Profile memory usage
	@echo "$(BLUE)Profiling memory usage...$(RESET)"
	mprof run $(PYTHON) -m pytest $(TEST_DIR)
	mprof plot

# Database operations (for Django/SQLAlchemy projects)
migrate: ## Development - Run database migrations
	@echo "$(BLUE)Running database migrations...$(RESET)"
	@if [ -f "manage.py" ]; then \
		$(PYTHON) manage.py migrate; \
	elif [ -f "alembic.ini" ]; then \
		alembic upgrade head; \
	else \
		echo "$(YELLOW)No migration system detected$(RESET)"; \
	fi

makemigrations: ## Development - Create new database migrations
	@echo "$(BLUE)Creating database migrations...$(RESET)"
	@if [ -f "manage.py" ]; then \
		$(PYTHON) manage.py makemigrations; \
	elif [ -f "alembic.ini" ]; then \
		alembic revision --autogenerate; \
	else \
		echo "$(YELLOW)No migration system detected$(RESET)"; \
	fi

reset-db: ## Development - Reset database (Django only)
	@echo "$(RED)Resetting database...$(RESET)"
	@if [ -f "manage.py" ]; then \
		$(PYTHON) manage.py reset_db --noinput; \
		$(PYTHON) manage.py migrate; \
	else \
		echo "$(YELLOW)Database reset only available for Django projects$(RESET)"; \
	fi

# Environment and dependency management
deps-check: ## Utilities - Check for dependency updates
	@echo "$(BLUE)Checking for dependency updates...$(RESET)"
	pip list --outdated

deps-update: ## Utilities - Update development dependencies
	@echo "$(BLUE)Updating development dependencies...$(RESET)"
	pip install --upgrade -r requirements-dev.txt

deps-lock: ## Utilities - Generate requirements.txt from installed packages
	@echo "$(BLUE)Generating requirements.txt...$(RESET)"
	pip freeze > requirements.txt

# Information and debugging
info: ## Utilities - Show environment information
	@echo "$(CYAN)Environment Information:$(RESET)"
	@echo "Python: $$($(PYTHON) --version)"
	@echo "Pip: $$($(PIP) --version)"
	@echo "Virtual Environment: $$VIRTUAL_ENV"
	@echo "Working Directory: $$(pwd)"
	@echo "Git Branch: $$(git branch --show-current 2>/dev/null || echo 'Not a git repository')"
	@echo "Git Status: $$(git status --porcelain 2>/dev/null | wc -l || echo 'N/A') files changed"

check-tools: ## Utilities - Check if development tools are installed
	@echo "$(BLUE)Checking development tools...$(RESET)"
	@command -v ruff >/dev/null 2>&1 && echo "$(GREEN)✓ Ruff$(RESET)" || echo "$(RED)✗ Ruff$(RESET)"
	@command -v black >/dev/null 2>&1 && echo "$(GREEN)✓ Black$(RESET)" || echo "$(RED)✗ Black$(RESET)"
	@command -v mypy >/dev/null 2>&1 && echo "$(GREEN)✓ MyPy$(RESET)" || echo "$(RED)✗ MyPy$(RESET)"
	@command -v pytest >/dev/null 2>&1 && echo "$(GREEN)✓ Pytest$(RESET)" || echo "$(RED)✗ Pytest$(RESET)"
	@command -v bandit >/dev/null 2>&1 && echo "$(GREEN)✓ Bandit$(RESET)" || echo "$(RED)✗ Bandit$(RESET)"
	@command -v safety >/dev/null 2>&1 && echo "$(GREEN)✓ Safety$(RESET)" || echo "$(RED)✗ Safety$(RESET)"
	@command -v pre-commit >/dev/null 2>&1 && echo "$(GREEN)✓ Pre-commit$(RESET)" || echo "$(RED)✗ Pre-commit$(RESET)"

# CI/CD simulation
ci: check-all test ## Utilities - Simulate CI/CD pipeline locally
	@echo "$(GREEN)CI/CD simulation completed successfully!$(RESET)"

# Quick development workflow
dev: install-dev pre-commit-install ## Setup - Quick development setup
	@echo "$(GREEN)Development environment ready!$(RESET)"
	@echo "$(YELLOW)Next steps:$(RESET)"
	@echo "  - Run 'make test' to run tests"
	@echo "  - Run 'make lint' to check code quality"
	@echo "  - Run 'make format' to format code"

# All-in-one targets
all: setup-dev check-all test docs ## Setup - Complete setup and validation
	@echo "$(GREEN)Complete PA-QA Python setup finished!$(RESET)"

# FastAPI specific commands
run-fastapi: ## Development - Run FastAPI development server
	@echo "$(BLUE)Starting FastAPI development server...$(RESET)"
	@if [ -f "main.py" ]; then \
		uvicorn main:app --reload --host 0.0.0.0 --port 8000; \
	elif [ -f "app/main.py" ]; then \
		uvicorn app.main:app --reload --host 0.0.0.0 --port 8000; \
	elif [ -f "src/main.py" ]; then \
		uvicorn src.main:app --reload --host 0.0.0.0 --port 8000; \
	else \
		echo "$(RED)FastAPI main.py not found$(RESET)"; \
	fi

# Django specific commands
run-django: ## Development - Run Django development server
	@echo "$(BLUE)Starting Django development server...$(RESET)"
	@if [ -f "manage.py" ]; then \
		$(PYTHON) manage.py runserver 0.0.0.0:8000; \
	else \
		echo "$(RED)Django manage.py not found$(RESET)"; \
	fi

collectstatic: ## Development - Collect static files (Django)
	@echo "$(BLUE)Collecting static files...$(RESET)"
	@if [ -f "manage.py" ]; then \
		$(PYTHON) manage.py collectstatic --noinput; \
	else \
		echo "$(YELLOW)Django manage.py not found$(RESET)"; \
	fi