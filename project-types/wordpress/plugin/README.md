# WordPress Plugin Testing Template

A comprehensive PHPUnit 9.x testing template for WordPress plugins using `@wordpress/env` for local development and testing.

## Features

- **PHPUnit 9.x** with WordPress polyfills for modern PHP testing
- **@wordpress/env** integration for consistent development environments
- **Database transactions** for fast, isolated tests
- **WordPress factory methods** for creating test data
- **Multisite testing** support
- **REST API testing** utilities
- **Admin functionality testing** helpers
- **Code coverage** reporting
- **Allure reporting** integration
- **CI/CD ready** configurations

## Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- PHP 7.4+ with required extensions
- Docker and Docker Compose
- Composer

### Installation

1. **Clone or copy this template to your plugin directory**

2. **Install dependencies:**
   ```bash
   npm install
   composer install
   ```

3. **Start WordPress environment:**
   ```bash
   npm run setup
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Project Structure

```
plugin/
├── .wp-env.json              # WordPress environment configuration
├── composer.json             # PHP dependencies and scripts
├── package.json              # Node.js dependencies and scripts
├── configs/
│   └── phpunit.xml           # PHPUnit configuration
├── tests/
│   ├── bootstrap.php         # Test bootstrap file
│   ├── TestCase.php          # Base test case class
│   ├── unit/                 # Unit tests
│   │   ├── PluginTest.php
│   │   ├── CustomPostTypeTest.php
│   │   ├── AdminTest.php
│   │   └── MultisiteTest.php
│   ├── integration/          # Integration tests
│   │   ├── RestApiTest.php
│   │   └── DatabaseTest.php
│   └── fixtures/             # Test fixtures and helpers
│       └── mu-plugins/
│           └── testing-helpers.php
```

## Testing Commands

### Basic Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only  
npm run test:integration

# Run with code coverage
npm run test:coverage

# Run multisite tests
npm run test:multisite
```

### WordPress Environment
```bash
# Start WordPress environment
npm run env:start

# Stop environment
npm run env:stop

# Reset environment (clean slate)
npm run env:reset

# Access WP-CLI
npm run env:cli -- plugin list

# Access test environment WP-CLI
npm run env:tests-cli -- user list
```

### Code Quality
```bash
# Check code style
npm run cs:check

# Fix code style issues
npm run cs:fix

# Run all quality checks
npm run quality
```

## Test Types and Examples

### Unit Tests

Test individual functions and classes in isolation:

```php
public function test_custom_function(): void {
    $result = my_custom_function('input');
    $this->assertEquals('expected', $result);
}
```

### Integration Tests

Test how different parts work together:

```php
public function test_rest_api_endpoint(): void {
    $request = new WP_REST_Request('GET', '/my-plugin/v1/items');
    $response = $this->server->dispatch($request);
    
    $this->assertEquals(200, $response->get_status());
}
```

### Database Tests

Test database operations with automatic rollback:

```php
public function test_database_operations(): void {
    // Data is automatically cleaned up after test
    $post = $this->create_post(['post_title' => 'Test Post']);
    $this->assertInstanceOf(WP_Post::class, $post);
}
```

### Admin Tests

Test admin functionality and capabilities:

```php
public function test_admin_menu(): void {
    $this->act_as_admin();
    
    add_menu_page('Test', 'Test', 'manage_options', 'test');
    
    $this->assertNotEmpty($GLOBALS['menu']);
}
```

### Multisite Tests

Test multisite-specific functionality:

```php
public function test_network_options(): void {
    if (!is_multisite()) {
        $this->markTestSkipped('Requires multisite');
    }
    
    add_site_option('test_option', 'value');
    $this->assertEquals('value', get_site_option('test_option'));
}
```

## Configuration

### PHPUnit Configuration

The `configs/phpunit.xml` file includes:

- Test suites for unit and integration tests
- Code coverage configuration
- WordPress-specific environment variables
- Custom test groups and excludes

### WordPress Environment

The `.wp-env.json` file provides:

- WordPress core version specification
- Plugin and theme mappings
- Environment-specific configurations
- Multisite testing environment
- Database and PHP settings

### Composer Scripts

Key composer scripts available:

- `composer test` - Run all tests
- `composer test:coverage` - Generate coverage reports
- `composer cs:check` - Check coding standards
- `composer setup:wp-env` - Initialize WordPress environment

## WordPress Testing Utilities

### Base TestCase Class

The `TestCase` class provides:

- Database transaction support
- User creation and management
- Post and term creation helpers
- Hook management utilities
- Custom assertions for WordPress

### Factory Methods

Create test data easily:

```php
$user = $this->create_user('editor');
$post = $this->create_post(['post_title' => 'Test']);
$term = $this->create_term('category', ['name' => 'Test Cat']);
```

### WordPress Assertions

WordPress-specific test assertions:

```php
$this->assertPostTypeExists('custom_post_type');
$this->assertUserHasCapability('edit_posts', $user);
$this->assertHookHasCallback('init', 'my_init_function');
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: [7.4, 8.0, 8.1, 8.2]
        wordpress: [latest, trunk]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: mysqli, mbstring, gd
          
      - name: Install dependencies
        run: composer install --no-dev --optimize-autoloader
        
      - name: Setup WordPress test environment
        run: composer setup:ci
        
      - name: Run tests
        run: composer test:coverage
```

## Allure Reporting

Generate beautiful test reports:

```bash
# Generate Allure report
npm run allure:generate

# Serve report locally
npm run allure:serve
```

## Best Practices

### Test Organization

1. **Unit tests** in `tests/unit/` - Test individual functions/classes
2. **Integration tests** in `tests/integration/` - Test component interactions
3. **Use descriptive test names** - `test_user_can_create_post_with_valid_data()`
4. **Group related tests** - Use `@group` annotations

### Database Testing

1. **Use transactions** - Enable `$use_transactions = true` in test classes
2. **Create isolated data** - Use factory methods from base TestCase
3. **Clean up properly** - Let the framework handle cleanup automatically

### WordPress Testing

1. **Test hooks and filters** - Verify WordPress integration points
2. **Test capabilities** - Ensure proper permission checks
3. **Test multisite compatibility** - Use multisite test environment
4. **Mock external dependencies** - Use Brain Monkey for complex mocking

### Performance

1. **Keep tests fast** - Use database transactions
2. **Minimize external calls** - Mock HTTP requests and API calls
3. **Use appropriate test types** - Don't integration test unit functionality

## Troubleshooting

### Common Issues

**Tests not finding WordPress:**
- Ensure `WP_TESTS_DIR` environment variable is set
- Check that WordPress test library is installed
- Verify `@wordpress/env` is running

**Database connection errors:**
- Check database credentials in `phpunit.xml`
- Ensure test database exists and is accessible
- Verify database permissions

**Plugin not loading in tests:**
- Check plugin path in bootstrap.php
- Ensure plugin file exists and is syntactically correct
- Verify plugin activation in test environment

### Debug Mode

Run tests with debug output:

```bash
composer test:debug
```

View WordPress environment logs:

```bash
npm run env:logs
```

## License

GPL-2.0-or-later - Same as WordPress

## Support

- **Documentation**: https://docs.projectassistant.ai/testing/wordpress
- **Issues**: https://github.com/pa-qa/wordpress-plugin-testing/issues
- **Allure Dashboard**: https://allure.projectassistant.ai