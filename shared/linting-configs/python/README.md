# Python Code Quality Configuration - PA-QA Framework

This directory contains comprehensive Python code quality configurations for the PA-QA testing framework, featuring modern tooling and best practices for professional Python development.

## 🚀 Quick Start

```bash
# Copy configuration files to your project
cp /path/to/pa-qa/shared/linting-configs/python/* ./

# Install development dependencies
pip install -r requirements-dev.txt

# Setup development environment
make setup-dev

# Run all quality checks
make check-all
```

## 📋 Included Configurations

### Core Configuration Files

| File | Purpose | Tool Support |
|------|---------|--------------|
| `pyproject.toml` | Modern Python project configuration | Ruff, Black, MyPy, Pytest, Coverage |
| `ruff.toml` | Standalone Ruff configuration | Fast linting, import sorting |
| `.pre-commit-config.yaml` | Pre-commit hooks | Code quality automation |
| `mypy.ini` | Type checking configuration | Static analysis |
| `pytest.ini` | Testing configuration | Test execution, coverage |
| `requirements-dev.txt` | Development dependencies | All tools and frameworks |
| `setup.cfg` | Legacy tool configuration | Backward compatibility |
| `Makefile` | Development commands | Workflow automation |
| `vscode-python.json` | VS Code settings | IDE integration |

## 🛠️ Tool Stack

### Primary Tools (Modern)
- **Ruff** - Ultra-fast Python linter (replaces Flake8, isort, pyupgrade)
- **Black** - Code formatter
- **MyPy** - Static type checking
- **Pytest** - Testing framework
- **Pre-commit** - Git hook automation

### Security & Quality
- **Bandit** - Security vulnerability detection
- **Safety** - Dependency vulnerability scanning
- **Coverage** - Code coverage measurement

## 🎯 Framework Support

### FastAPI Projects
```python
# Optimized for FastAPI development
# - Pydantic model validation
# - Async/await patterns
# - API endpoint testing
# - Dependency injection
```

### Django Projects
```python
# Comprehensive Django support
# - Model and admin configuration
# - Migration handling
# - DRF integration
# - Test fixtures and factories
```

## 📁 Project Structure

```
your-project/
├── src/                    # Source code
├── tests/                  # Test files
├── pyproject.toml         # Main configuration
├── ruff.toml             # Ruff-specific config
├── .pre-commit-config.yaml # Git hooks
├── mypy.ini              # Type checking
├── pytest.ini           # Test configuration
├── requirements-dev.txt   # Development deps
└── Makefile             # Development commands
```

## 🚀 Available Commands

### Setup and Installation
```bash
make install          # Install production dependencies
make install-dev      # Install development dependencies
make setup-dev        # Complete development setup
```

### Code Quality
```bash
make lint            # Run all linting tools
make format          # Format code with Black and Ruff
make type-check      # Run MyPy static type checking
make security        # Run security analysis
```

### Testing
```bash
make test           # Run all tests with coverage
make test-unit      # Run unit tests only
make test-integration # Run integration tests
make test-e2e       # Run end-to-end tests
make test-parallel  # Run tests in parallel
```

### Development Workflow
```bash
make check-all      # Run all quality checks
make fix-all        # Apply all auto-fixes
make ci            # Simulate CI/CD pipeline
make clean         # Clean build artifacts
```

## ⚙️ Configuration Details

### Ruff Configuration

```toml
# Modern Python linting with 50+ rule categories
select = [
    "E", "W",    # pycodestyle
    "F",         # pyflakes  
    "I",         # isort
    "B",         # flake8-bugbear
    "S",         # flake8-bandit
    "UP",        # pyupgrade
    "N",         # pep8-naming
    # ... and many more
]

# Framework-specific per-file ignores
[per-file-ignores]
"**/api/**/*" = ["B008"]     # FastAPI dependencies
"**/models.py" = ["A003"]    # Django model fields
"tests/**/*" = ["S101"]      # Allow assert in tests
```

### Black Formatting

```toml
[tool.black]
line-length = 88
target-version = ['py39', 'py310', 'py311', 'py312']
include = '\.pyi?$'
```

### MyPy Type Checking

```ini
[mypy]
python_version = 3.9
strict = true
show_error_codes = true
# Comprehensive type checking with framework support
```

### Pytest Testing

```ini
[tool:pytest]
addopts = --cov=src --cov-report=html --tb=short
markers = 
    unit: Unit tests
    integration: Integration tests
    fastapi: FastAPI specific tests
    django: Django specific tests
```

## 🔧 IDE Integration

### VS Code Setup

1. Copy `vscode-python.json` content to `.vscode/settings.json`
2. Install recommended extensions:
   - Python (ms-python.python)
   - Pylance (ms-python.vscode-pylance)
   - Ruff (charliermarsh.ruff)
   - Black Formatter (ms-python.black-formatter)

### PyCharm/IntelliJ

1. Configure external tools for Ruff and Black
2. Set up code style to match Black formatting
3. Enable MyPy plugin for type checking

## 🔍 Pre-commit Hooks

Automatic code quality enforcement:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    hooks:
      - id: ruff          # Linting
      - id: ruff-format   # Import sorting
  
  - repo: https://github.com/psf/black
    hooks:
      - id: black         # Code formatting
  
  - repo: https://github.com/pre-commit/mirrors-mypy
    hooks:
      - id: mypy          # Type checking
```

## 📊 Coverage and Reporting

### Coverage Configuration
```bash
# Minimum 80% coverage required
--cov-fail-under=80

# Multiple report formats
--cov-report=html      # Interactive HTML report
--cov-report=xml       # CI/CD integration
--cov-report=term-missing  # Terminal output
```

### Allure Integration
```bash
# Generate Allure reports (configured in pytest.ini)
pytest --alluredir=allure-results
allure serve allure-results
```

## 🚀 Framework-Specific Examples

### FastAPI Setup

```python
# pyproject.toml
[project.dependencies]
fastapi = ">=0.100.0"
uvicorn = {extras = ["standard"], version = ">=0.23.0"}
pydantic = ">=2.0.0"

# Example test
def test_api_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
```

### Django Setup

```python
# pyproject.toml
[project.dependencies]
django = ">=4.2.0"
djangorestframework = ">=3.14.0"

# settings.py integration
DJANGO_SETTINGS_MODULE = "config.settings.test"
```

## 🔒 Security Features

### Bandit Security Scanning
```bash
# Scan for security vulnerabilities
bandit -r src/ -f json -o bandit-report.json
```

### Dependency Vulnerability Checking
```bash
# Check for known vulnerabilities
safety check --json --output safety-report.json
```

### Semgrep Static Analysis
```bash
# Advanced security analysis
semgrep --config=auto src/ --json
```

## 📈 Performance Optimization

### Parallel Testing
```bash
# Run tests in parallel for faster execution
pytest -n auto --dist=loadfile
```

### Caching
```bash
# Efficient caching for tools
.mypy_cache/     # MyPy incremental checking
.ruff_cache/     # Ruff fast linting
.pytest_cache/   # Pytest discovery cache
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Code Quality
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: make setup-dev
      - run: make check-all
      - run: make test
```

### Docker Integration

```dockerfile
# Multi-stage build with quality checks
FROM python:3.11-slim as quality
COPY requirements-dev.txt .
RUN pip install -r requirements-dev.txt
COPY . .
RUN make check-all

FROM python:3.11-slim as production
# Production image without dev dependencies
```

## 🎯 Best Practices

### Code Organization
```python
# Recommended project structure
src/
├── __init__.py
├── main.py           # Application entry point
├── api/             # API routes (FastAPI)
├── models/          # Data models
├── services/        # Business logic
├── utils/           # Utilities
└── config/          # Configuration
```

### Type Annotations
```python
# Use comprehensive type hints
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

def process_data(
    items: List[Dict[str, Any]], 
    limit: Optional[int] = None
) -> List[ProcessedItem]:
    """Process data with proper typing."""
    pass
```

### Test Organization
```python
# Use pytest markers for test categorization
@pytest.mark.unit
def test_user_model():
    """Unit test for user model."""
    pass

@pytest.mark.integration  
def test_api_integration():
    """Integration test for API."""
    pass
```

## 🐛 Troubleshooting

### Common Issues

1. **Import errors with relative imports**
   ```python
   # Solution: Use absolute imports or update PYTHONPATH
   export PYTHONPATH="${PYTHONPATH}:${PWD}/src"
   ```

2. **MyPy errors with third-party libraries**
   ```ini
   # Add to mypy.ini
   [mypy-problematic_library.*]
   ignore_missing_imports = true
   ```

3. **Ruff conflicts with existing code**
   ```bash
   # Gradually introduce rules
   ruff check --select E,W,F src/
   ```

### Performance Issues

1. **Slow MyPy checking**
   ```ini
   # Enable incremental mode
   incremental = true
   cache_dir = .mypy_cache
   ```

2. **Slow test execution**
   ```bash
   # Use parallel execution
   pytest -n auto
   ```

## 📚 Resources

### Documentation
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Black Documentation](https://black.readthedocs.io/)
- [MyPy Documentation](https://mypy.readthedocs.io/)
- [Pytest Documentation](https://docs.pytest.org/)

### PA-QA Framework
- [Main Repository](https://github.com/project-assistant/pa-qa)
- [Allure Dashboard](https://allure.projectassistant.ai)
- [Team Guidelines](../../docs/guidelines/)

## 🤝 Contributing

When updating these configurations:

1. Test with multiple Python versions (3.9-3.12)
2. Validate with both FastAPI and Django projects
3. Ensure backward compatibility
4. Update documentation
5. Run full test suite: `make check-all test`

## 📄 License

These configurations are part of the PA-QA framework and are available under the MIT License.

---

**PA-QA Framework** - Elevating Python code quality through modern tooling and best practices.