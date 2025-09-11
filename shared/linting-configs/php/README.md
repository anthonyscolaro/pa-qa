# PHP Code Quality Tools - PA-QA Framework

This directory contains comprehensive PHP code quality tools and configurations for the PA-QA framework, supporting PHP 8.1+ with specialized configurations for WordPress and Laravel projects.

## 🛠️ Included Tools

### Static Analysis
- **PHPStan** (Level 8) - Maximum strictness static analysis
- **Psalm** (Error Level 1) - Advanced type checking with security focus
- **PHP Mess Detector** - Code complexity and design quality metrics
- **PHP Copy/Paste Detector** - Duplicate code detection
- **PHP Magic Number Detector** - Hardcoded values detection

### Code Style & Formatting
- **PHP_CodeSniffer** - PSR-12 + WordPress coding standards
- **PHP-CS-Fixer** - Automatic code formatting and style fixes
- **Rector** - Automated refactoring for PHP 8.1+ features

### Testing Integration
- **PHPUnit** - Unit/integration testing with coverage reporting
- **Allure Integration** - Advanced test reporting and analytics

### Security & Quality
- **Composer Audit** - Dependency vulnerability scanning
- **Pre-commit Hooks** - Automated quality checks before commits
- **CaptainHook** - Git hooks management

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Copy configuration files to your project
cp -r shared/linting-configs/php/* /path/to/your/project/

# Install PHP dependencies
composer install

# Setup Git hooks
make setup-hooks
```

### 2. Run Quality Checks

```bash
# Run all quality checks
make quality

# Fix automatically fixable issues
make quality-fix

# Run specific tools
make lint          # Code style checking
make analyze       # Static analysis
make test          # PHPUnit tests
make security      # Security audit
```

### 3. CI/CD Integration

```bash
# Run CI pipeline checks
make ci

# Check deployment readiness
make deploy-check
```

## 📋 Available Commands

### Quality Assurance
```bash
make quality        # Run all quality checks
make quality-fix    # Fix all auto-fixable issues
make lint          # Run linting (PHPCS + PHP-CS-Fixer)
make lint-fix      # Fix linting issues
make analyze       # Run static analysis (PHPStan + Psalm)
make metrics       # Run code quality metrics
make security      # Run security checks
make insights      # Run PHP Insights analysis
```

### Testing
```bash
make test              # Run all tests
make test-coverage     # Run tests with HTML coverage
make test-unit         # Run only unit tests
make test-feature      # Run only feature tests
make test-integration  # Run only integration tests
```

### Development
```bash
make refactor      # Check refactoring opportunities
make refactor-fix  # Apply automated refactoring
make clean         # Clean build artifacts
make docs          # Generate documentation
make benchmark     # Run performance benchmarks
```

### Framework Specific
```bash
# WordPress
make wp-install    # Install WordPress test environment
make wp-test       # Run WordPress tests

# Laravel  
make laravel-key   # Generate application key
make laravel-migrate # Run migrations
make laravel-test  # Run Laravel tests
```

## ⚙️ Configuration Files

### Core Configurations
- `composer.json` - Dependencies and scripts
- `phpcs.xml` - PHP_CodeSniffer rules (PSR-12 + WordPress)
- `phpstan.neon` - PHPStan static analysis (Level 8)
- `psalm.xml` - Psalm type checking (Error Level 1)
- `.php-cs-fixer.php` - PHP-CS-Fixer formatting rules
- `rector.php` - Automated refactoring rules
- `phpunit.xml` - PHPUnit testing configuration

### Integration Files
- `.pre-commit-config.yaml` - Pre-commit hooks
- `Makefile` - Development commands
- `phpmd.xml` - PHP Mess Detector rules (auto-generated)

## 🔧 Framework Support

### WordPress Projects
- WordPress Coding Standards (WPCS) integration
- WordPress VIP standards for high-performance sites
- WordPress-specific function and constant recognition
- Plugin and theme development patterns
- WordPress test environment setup

### Laravel Projects
- Laravel-specific PHPStan rules (Larastan)
- Eloquent model magic method support
- Laravel test database configuration
- Artisan command integration
- Service provider and middleware patterns

### Generic PHP Projects
- PSR-12 coding standards
- Modern PHP 8.1+ features
- Composer package development
- API development patterns
- Clean architecture support

## 📊 Quality Standards

### Code Coverage
- **Minimum**: 70% overall coverage
- **Unit Tests**: 80% coverage requirement
- **Critical Code**: 90% coverage requirement

### Static Analysis
- **PHPStan**: Level 8 (maximum strictness)
- **Psalm**: Error Level 1 (strict type checking)
- **Complexity**: Max 10 cyclomatic complexity
- **Nesting**: Max 5 nesting levels

### Code Style
- **Standard**: PSR-12 Extended
- **Line Length**: 120 characters (200 absolute max)
- **File Size**: Max 500 lines per class
- **Method Size**: Max 50 lines per method

## 🛡️ Security Features

### Automated Security Checks
- Dependency vulnerability scanning
- Hardcoded secret detection
- SQL injection pattern detection
- XSS vulnerability detection
- CSRF protection verification

### Security Rules
- Forbidden function detection (`eval`, `exec`, etc.)
- Unsafe string operations
- Unvalidated input patterns
- Weak cryptography detection
- File inclusion vulnerabilities

## 🚨 Error Reporting

### Allure Integration
```bash
# Configure Allure reporting
export ALLURE_PROJECT_NAME="your-project-name"
export ALLURE_ENDPOINT="https://allure.projectassistant.ai"

# Run tests with Allure reporting
make test
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run PHP Quality Checks
  run: make ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: build/coverage/clover.xml
```

## 🔄 Automated Refactoring

### PHP 8.1+ Features
- Constructor property promotion
- Readonly properties
- Enum implementation
- Match expressions
- Null coalescing assignment

### Code Improvements
- Type declarations
- Return type hints
- Early returns
- Dead code removal
- Performance optimizations

## 📈 Performance Monitoring

### Benchmarking
```bash
# Run performance benchmarks
make benchmark

# Monitor slow tests
make test  # Automatically reports tests >500ms
```

### Memory Usage
- Automatic memory usage reporting
- Memory leak detection
- Performance regression detection

## 🚀 Best Practices

### Development Workflow
1. **Setup**: `make install && make setup-hooks`
2. **Development**: Write code with type hints and documentation
3. **Quality**: `make quality` before committing
4. **Fix**: `make quality-fix` for auto-fixes
5. **Test**: `make test` with good coverage
6. **Commit**: Pre-commit hooks ensure quality
7. **Deploy**: `make deploy-check` before production

### Code Organization
- Use strict types: `declare(strict_types=1);`
- Type hint everything (parameters, returns, properties)
- Document complex logic with PHPDoc
- Keep methods small and focused
- Use meaningful variable names
- Follow SOLID principles

### Testing Strategy
- Unit tests for business logic
- Integration tests for database/API interactions
- Feature tests for user workflows
- Performance tests for critical paths
- Security tests for authentication/authorization

## 🆘 Troubleshooting

### Common Issues

**PHPStan Level 8 too strict?**
```bash
# Start with lower level and gradually increase
# Edit phpstan.neon: level: 6
make analyze
```

**WordPress functions not recognized?**
```bash
# Ensure WordPress stubs are installed
composer require --dev php-stubs/wordpress-stubs
```

**Laravel models failing type checking?**
```bash
# Install Laravel IDE helper
composer require --dev barryvdh/laravel-ide-helper
php artisan ide-helper:generate
```

**Memory issues during analysis?**
```bash
# Increase memory limit
php -d memory_limit=1G vendor/bin/phpstan analyse
```

### Getting Help
- Check the PA-QA documentation: `/docs/`
- Review tool-specific docs in comments
- Team Slack: `#qa-testing`
- Create issues in the PA-QA repository

## 📝 Customization

### Project-Specific Rules
```php
// Add to phpstan.neon
parameters:
    ignoreErrors:
        - '#Your specific error pattern#'

// Add to phpcs.xml
<rule ref="Generic.Files.LineLength">
    <properties>
        <property name="lineLimit" value="100"/>
    </properties>
</rule>
```

### Framework Detection
The tools automatically detect and configure for:
- Laravel (presence of `artisan` file)
- WordPress (presence of `wp-config.php` or WordPress functions)
- Generic PHP projects

## 🔄 Updates

### Keeping Tools Current
```bash
# Update dependencies
make update

# Check for outdated packages  
make update-dry

# Update configuration templates
git pull origin main
```

### Version Compatibility
- **PHP**: 8.1+ (8.2+ recommended)
- **PHPUnit**: 10.x
- **PHPStan**: 1.12+
- **Psalm**: 5.25+
- **PHP-CS-Fixer**: 3.40+

---

**Need help?** Check the [PA-QA documentation](../../docs/) or reach out to the team!

**Found a bug?** Please report it in the PA-QA repository with the `php-tools` label.