# WordPress Testing Setup Guide - PA-QA Framework

## 🚀 Quick Start

Set up comprehensive WordPress testing in under 10 minutes with PHPUnit, WP-CLI, database fixtures, and automated browser testing.

## 📋 Prerequisites

- WordPress 6.0+ (recommended: latest version)
- PHP 8.0+ with required extensions
- Composer package manager
- WP-CLI installed globally
- Docker (recommended for consistent testing environment)
- Node.js 18+ (for browser testing)

### Required PHP Extensions
```bash
php -m | grep -E "(mysqli|pdo_mysql|curl|gd|mbstring|xml|json|zip)"
```

## 🎯 What You'll Get

After following this guide, your WordPress project will have:

✅ **Unit Tests** with PHPUnit for PHP code  
✅ **Integration Tests** with WordPress Test Suite  
✅ **Database Tests** with fixtures and transactions  
✅ **Browser Tests** with Playwright/Selenium  
✅ **API Tests** for REST and GraphQL endpoints  
✅ **Security Tests** with WordPress security checks  
✅ **Performance Tests** with Query Monitor integration  
✅ **Multisite Testing** support  
✅ **Code Quality** with PHP_CodeSniffer, PHPStan  
✅ **Allure Reporting** integration  
✅ **CI/CD Ready** GitHub Actions workflow  

## 🔧 Step 1: Copy PA-QA Templates

### Option A: Manual Copy (Recommended for Learning)

```bash
# Navigate to your WordPress project/plugin/theme
cd your-wordpress-project

# Copy configuration files
cp /path/to/pa-qa/project-types/wordpress/plugin/composer.json ./
cp /path/to/pa-qa/project-types/wordpress/plugin/phpunit.xml ./
cp /path/to/pa-qa/project-types/wordpress/plugin/.wp-env.json ./

# Create tests directory structure
mkdir -p tests/{unit,integration,browser,fixtures,mocks}

# Copy test utilities and setup
cp -r /path/to/pa-qa/project-types/wordpress/plugin/tests/* ./tests/

# Copy configuration files
cp -r /path/to/pa-qa/project-types/wordpress/plugin/configs/* ./configs/
```

### Option B: Multi-Agent Setup (Advanced)

```bash
# Use PA-QA multi-agent command to generate custom test suite
cd your-wordpress-project
pa-qa generate-test-suite wordpress plugin --with-multisite --with-rest-api --project-name="your-plugin"
```

## 🔧 Step 2: Install Dependencies

### Composer Dependencies

Merge these dependencies into your `composer.json`:

```json
{
  "require-dev": {
    "phpunit/phpunit": "^9.6",
    "yoast/phpunit-polyfills": "^2.0",
    "wp-phpunit/wp-phpunit": "^6.4",
    "brain/monkey": "^2.6",
    "mockery/mockery": "^1.6",
    "fakerphp/faker": "^1.23",
    "phpstan/phpstan": "^1.10",
    "squizlabs/php_codesniffer": "^3.7",
    "wp-coding-standards/wpcs": "^3.0",
    "dealerdirect/phpcodesniffer-composer-installer": "^1.0",
    "allure-framework/allure-phpunit": "^2.3"
  },
  "scripts": {
    "test": "phpunit",
    "test:unit": "phpunit --testsuite=unit",
    "test:integration": "phpunit --testsuite=integration",
    "test:multisite": "phpunit --testsuite=multisite",
    "test:coverage": "phpunit --coverage-html coverage-report",
    "phpcs": "phpcs --standard=WordPress src/ tests/",
    "phpcs:fix": "phpcbf --standard=WordPress src/ tests/",
    "phpstan": "phpstan analyse src/ --level=8",
    "test:all": "composer phpcs && composer phpstan && composer test"
  }
}
```

### Install Dependencies

```bash
composer install
```

### Node.js Dependencies (for browser testing)

Create `package.json`:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "allure-playwright": "^2.4.0"
  },
  "scripts": {
    "test:browser": "playwright test",
    "test:browser:headed": "playwright test --headed",
    "playwright:install": "playwright install"
  }
}
```

```bash
npm install
npm run playwright:install
```

## 🔧 Step 3: Configure Testing Environment

### PHPUnit Configuration (phpunit.xml)

```xml
<?xml version="1.0"?>
<phpunit
    bootstrap="tests/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true"
    processIsolation="false"
    stopOnFailure="false"
    testdox="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory prefix="test-" suffix=".php">./tests/unit/</directory>
        </testsuite>
        <testsuite name="integration">
            <directory prefix="test-" suffix=".php">./tests/integration/</directory>
        </testsuite>
        <testsuite name="multisite">
            <directory prefix="test-" suffix=".php">./tests/multisite/</directory>
        </testsuite>
    </testsuites>
    
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">./src/</directory>
        </include>
        <exclude>
            <directory>./vendor/</directory>
            <directory>./tests/</directory>
            <file>./src/bootstrap.php</file>
        </exclude>
        <report>
            <html outputDirectory="coverage-report"/>
            <text outputFile="php://stdout"/>
        </report>
    </coverage>
    
    <logging>
        <log type="junit" target="tests/_output/junit.xml"/>
    </logging>
    
    <extensions>
        <extension class="Qameta\Allure\Phpunit\AllureExtension">
            <arguments>
                <string>tests/_output/allure-results</string>
            </arguments>
        </extension>
    </extensions>
</phpunit>
```

### Test Bootstrap (tests/bootstrap.php)

```php
<?php
/**
 * PHPUnit test bootstrap for WordPress testing
 */

// Composer autoloader
require_once dirname(__DIR__) . '/vendor/autoload.php';

// Test environment variables
define('WP_TESTS_DOMAIN', getenv('WP_TESTS_DOMAIN') ?: 'example.org');
define('WP_TESTS_EMAIL', getenv('WP_TESTS_EMAIL') ?: 'admin@example.org');
define('WP_TESTS_TITLE', getenv('WP_TESTS_TITLE') ?: 'Test Site');
define('WP_PHP_BINARY', getenv('WP_PHP_BINARY') ?: 'php');

// Database configuration for tests
define('DB_NAME', getenv('WP_TESTS_DB_NAME') ?: 'wordpress_test');
define('DB_USER', getenv('WP_TESTS_DB_USER') ?: 'root');
define('DB_PASSWORD', getenv('WP_TESTS_DB_PASSWORD') ?: '');
define('DB_HOST', getenv('WP_TESTS_DB_HOST') ?: 'localhost');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');

// WordPress test configuration
define('WP_TESTS_FORCE_KNOWN_BUGS', true);
define('WP_TESTS_MULTISITE', false);

// Security keys (use different ones for testing)
define('AUTH_KEY',         'testing-key-1');
define('SECURE_AUTH_KEY',  'testing-key-2');
define('LOGGED_IN_KEY',    'testing-key-3');
define('NONCE_KEY',        'testing-key-4');
define('AUTH_SALT',        'testing-salt-1');
define('SECURE_AUTH_SALT', 'testing-salt-2');
define('LOGGED_IN_SALT',   'testing-salt-3');
define('NONCE_SALT',       'testing-salt-4');

// WordPress table prefix for tests
$table_prefix = 'wp_tests_';

// WordPress debug mode for tests
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);

// Load WordPress test environment
require_once getenv('WP_TESTS_DIR') . '/includes/bootstrap.php';

// Load plugin for testing
if (file_exists(dirname(__DIR__) . '/your-plugin.php')) {
    require_once dirname(__DIR__) . '/your-plugin.php';
}

// Test utilities
require_once __DIR__ . '/utilities/test-helpers.php';
require_once __DIR__ . '/utilities/factory-helpers.php';
```

### WordPress Environment (.wp-env.json)

```json
{
  "core": "WordPress/WordPress#6.4",
  "plugins": [
    "."
  ],
  "themes": [
    "https://downloads.wordpress.org/theme/twentytwentyfour.zip"
  ],
  "env": {
    "tests": {
      "mappings": {
        "wp-content/mu-plugins": "./tests/mu-plugins"
      }
    }
  },
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "WP_DEBUG_DISPLAY": false,
    "SCRIPT_DEBUG": true
  }
}
```

## 🔧 Step 4: Create Test Utilities

### Test Helpers (tests/utilities/test-helpers.php)

```php
<?php
/**
 * Common test helper functions
 */

class WP_Test_Helpers {
    
    /**
     * Create a test user with specific role
     */
    public static function create_user($role = 'subscriber', $meta = []) {
        $user_id = wp_insert_user([
            'user_login' => 'test_user_' . uniqid(),
            'user_email' => 'test' . uniqid() . '@example.com',
            'user_pass' => 'password123',
            'role' => $role
        ]);
        
        if (!is_wp_error($user_id)) {
            foreach ($meta as $key => $value) {
                update_user_meta($user_id, $key, $value);
            }
        }
        
        return $user_id;
    }
    
    /**
     * Create a test post with specific type and meta
     */
    public static function create_post($type = 'post', $meta = [], $taxonomy_terms = []) {
        $post_id = wp_insert_post([
            'post_title' => 'Test Post ' . uniqid(),
            'post_content' => 'Test post content for testing purposes.',
            'post_status' => 'publish',
            'post_type' => $type,
            'post_author' => 1
        ]);
        
        if (!is_wp_error($post_id)) {
            // Add post meta
            foreach ($meta as $key => $value) {
                update_post_meta($post_id, $key, $value);
            }
            
            // Add taxonomy terms
            foreach ($taxonomy_terms as $taxonomy => $terms) {
                wp_set_object_terms($post_id, $terms, $taxonomy);
            }
        }
        
        return $post_id;
    }
    
    /**
     * Mock WordPress HTTP requests
     */
    public static function mock_http_request($url, $response_body = '', $response_code = 200) {
        add_filter('pre_http_request', function($preempt, $args, $request_url) use ($url, $response_body, $response_code) {
            if (strpos($request_url, $url) !== false) {
                return [
                    'response' => ['code' => $response_code],
                    'body' => $response_body
                ];
            }
            return $preempt;
        }, 10, 3);
    }
    
    /**
     * Clean up test data
     */
    public static function cleanup_test_data() {
        global $wpdb;
        
        // Remove test posts
        $test_posts = get_posts([
            'post_type' => 'any',
            'meta_query' => [
                [
                    'key' => '_test_post',
                    'value' => '1'
                ]
            ],
            'numberposts' => -1
        ]);
        
        foreach ($test_posts as $post) {
            wp_delete_post($post->ID, true);
        }
        
        // Remove test users
        $test_users = get_users(['meta_key' => '_test_user', 'meta_value' => '1']);
        foreach ($test_users as $user) {
            wp_delete_user($user->ID);
        }
    }
}
```

### Factory Helpers (tests/utilities/factory-helpers.php)

```php
<?php
/**
 * Factory helpers for creating test data
 */

use Faker\Factory as Faker;

class WP_Test_Factory_Helpers {
    
    private static $faker;
    
    public static function init() {
        if (!self::$faker) {
            self::$faker = Faker::create();
        }
    }
    
    /**
     * Create realistic user data
     */
    public static function user_data($role = 'subscriber') {
        self::init();
        
        return [
            'user_login' => self::$faker->userName,
            'user_email' => self::$faker->email,
            'user_pass' => 'password123',
            'first_name' => self::$faker->firstName,
            'last_name' => self::$faker->lastName,
            'display_name' => self::$faker->name,
            'role' => $role
        ];
    }
    
    /**
     * Create realistic post data
     */
    public static function post_data($type = 'post') {
        self::init();
        
        return [
            'post_title' => self::$faker->sentence,
            'post_content' => self::$faker->paragraphs(3, true),
            'post_excerpt' => self::$faker->text(150),
            'post_status' => 'publish',
            'post_type' => $type,
            'post_author' => 1
        ];
    }
    
    /**
     * Create test comment data
     */
    public static function comment_data($post_id) {
        self::init();
        
        return [
            'comment_post_ID' => $post_id,
            'comment_content' => self::$faker->paragraph,
            'comment_author' => self::$faker->name,
            'comment_author_email' => self::$faker->email,
            'comment_approved' => 1
        ];
    }
}
```

## 🔧 Step 5: Write Your First Tests

### Unit Test Example (tests/unit/test-utility-functions.php)

```php
<?php
/**
 * Unit tests for utility functions
 */

use PHPUnit\Framework\TestCase;
use Qameta\Allure\Attribute\Feature;
use Qameta\Allure\Attribute\Story;

#[Feature("Utility Functions")]
class Test_Utility_Functions extends WP_UnitTestCase {
    
    #[Story("String formatting")]
    public function test_format_price() {
        $this->assertEquals('$10.99', format_price(10.99));
        $this->assertEquals('$0.00', format_price(0));
        $this->assertEquals('$1,234.56', format_price(1234.56));
    }
    
    #[Story("Data validation")]
    public function test_validate_email() {
        $this->assertTrue(validate_email('test@example.com'));
        $this->assertFalse(validate_email('invalid-email'));
        $this->assertFalse(validate_email(''));
    }
    
    #[Story("URL generation")]
    public function test_generate_download_url() {
        $post_id = $this->factory->post->create();
        $url = generate_download_url($post_id);
        
        $this->assertStringContainsString('download', $url);
        $this->assertStringContainsString((string)$post_id, $url);
        $this->assertTrue(wp_verify_nonce(
            parse_url($url, PHP_URL_QUERY), 
            'download_' . $post_id
        ));
    }
}
```

### Integration Test Example (tests/integration/test-custom-post-type.php)

```php
<?php
/**
 * Integration tests for custom post type
 */

use Qameta\Allure\Attribute\Feature;
use Qameta\Allure\Attribute\Story;

#[Feature("Custom Post Type")]
class Test_Custom_Post_Type extends WP_UnitTestCase {
    
    public function setUp(): void {
        parent::setUp();
        // Ensure custom post type is registered
        register_my_custom_post_type();
    }
    
    #[Story("Post type registration")]
    public function test_custom_post_type_exists() {
        $this->assertTrue(post_type_exists('my_custom_type'));
        
        $post_type = get_post_type_object('my_custom_type');
        $this->assertEquals('My Custom Type', $post_type->labels->name);
        $this->assertTrue($post_type->public);
    }
    
    #[Story("Custom fields")]
    public function test_custom_fields_save_correctly() {
        $post_id = $this->factory->post->create([
            'post_type' => 'my_custom_type'
        ]);
        
        // Simulate saving custom fields
        $_POST['my_custom_field'] = 'test_value';
        $_POST['my_custom_field_nonce'] = wp_create_nonce('save_custom_fields');
        
        do_action('save_post', $post_id);
        
        $this->assertEquals('test_value', get_post_meta($post_id, 'my_custom_field', true));
    }
    
    #[Story("REST API integration")]
    public function test_custom_post_type_in_rest_api() {
        $post_id = $this->factory->post->create([
            'post_type' => 'my_custom_type',
            'post_status' => 'publish'
        ]);
        
        $request = new WP_REST_Request('GET', '/wp/v2/my_custom_type');
        $response = rest_get_server()->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        $this->assertNotEmpty($response->get_data());
    }
}
```

### Database Test Example (tests/integration/test-database-operations.php)

```php
<?php
/**
 * Database integration tests
 */

use Qameta\Allure\Attribute\Feature;
use Qameta\Allure\Attribute\Story;

#[Feature("Database Operations")]
class Test_Database_Operations extends WP_UnitTestCase {
    
    private $table_name;
    
    public function setUp(): void {
        parent::setUp();
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'custom_table';
        
        // Create test table
        $wpdb->query("
            CREATE TABLE IF NOT EXISTS {$this->table_name} (
                id int(11) NOT NULL AUTO_INCREMENT,
                name varchar(255) NOT NULL,
                value text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            )
        ");
    }
    
    public function tearDown(): void {
        global $wpdb;
        $wpdb->query("DROP TABLE IF EXISTS {$this->table_name}");
        parent::tearDown();
    }
    
    #[Story("CRUD operations")]
    public function test_database_crud_operations() {
        global $wpdb;
        
        // Create
        $result = $wpdb->insert($this->table_name, [
            'name' => 'test_name',
            'value' => 'test_value'
        ]);
        $this->assertNotFalse($result);
        $insert_id = $wpdb->insert_id;
        
        // Read
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $insert_id
        ));
        $this->assertEquals('test_name', $row->name);
        $this->assertEquals('test_value', $row->value);
        
        // Update
        $wpdb->update($this->table_name, 
            ['value' => 'updated_value'],
            ['id' => $insert_id]
        );
        
        $updated_row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $insert_id
        ));
        $this->assertEquals('updated_value', $updated_row->value);
        
        // Delete
        $wpdb->delete($this->table_name, ['id' => $insert_id]);
        $deleted_row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $insert_id
        ));
        $this->assertNull($deleted_row);
    }
}
```

### Browser Test Example (tests/browser/authentication.spec.js)

```javascript
// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('WordPress Authentication', () => {
  test('admin can login to WordPress dashboard', async ({ page }) => {
    await page.goto('/wp-admin');
    
    // Fill login form
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password');
    await page.click('#wp-submit');
    
    // Verify successful login
    await expect(page).toHaveURL(/wp-admin/);
    await expect(page.locator('#wpadminbar')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
  
  test('can create a new post', async ({ page }) => {
    // Login first
    await page.goto('/wp-admin');
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password');
    await page.click('#wp-submit');
    
    // Navigate to new post
    await page.click('text=Posts');
    await page.click('text=Add New');
    
    // Fill post details
    await page.fill('[placeholder="Add title"]', 'Test Post Title');
    await page.click('[aria-label="Add default block"]');
    await page.fill('[data-type="core/paragraph"] p', 'This is test content.');
    
    // Publish post
    await page.click('text=Publish');
    await page.click('text=Publish', { nth: 1 }); // Confirm publish
    
    // Verify post was created
    await expect(page.locator('text=Post published')).toBeVisible();
  });
  
  test('displays correct frontend content', async ({ page }) => {
    // Create a post via API first
    await page.request.post('/wp-json/wp/v2/posts', {
      data: {
        title: 'Frontend Test Post',
        content: 'Test content for frontend display',
        status: 'publish'
      },
      headers: {
        'Authorization': 'Basic ' + btoa('admin:password')
      }
    });
    
    // Visit frontend
    await page.goto('/');
    await expect(page.locator('text=Frontend Test Post')).toBeVisible();
    await expect(page.locator('text=Test content for frontend display')).toBeVisible();
  });
});
```

## 🔧 Step 6: Set Up Code Quality Tools

### PHP_CodeSniffer Configuration

Create `.phpcs.xml`:

```xml
<?xml version="1.0"?>
<ruleset name="WordPress Coding Standards">
    <description>WordPress coding standards for the project</description>
    
    <file>./src</file>
    <file>./tests</file>
    
    <exclude-pattern>./vendor/*</exclude-pattern>
    <exclude-pattern>./node_modules/*</exclude-pattern>
    
    <rule ref="WordPress">
        <exclude name="WordPress.Files.FileName"/>
        <exclude name="WordPress.NamingConventions.ValidVariableName"/>
    </rule>
    
    <rule ref="WordPress.WhiteSpace.ControlStructureSpacing">
        <properties>
            <property name="blank_line_check" value="true"/>
        </properties>
    </rule>
</ruleset>
```

### PHPStan Configuration

Create `phpstan.neon`:

```neon
parameters:
    level: 8
    paths:
        - src/
    excludePaths:
        - vendor/
        - tests/
    bootstrapFiles:
        - tests/bootstrap.php
    ignoreErrors:
        - '#Function wp_[a-z_]+ not found#'
        - '#Constant [A-Z_]+ not found#'
```

## 🔧 Step 7: Set Up Allure Reporting

### Install Allure CLI

```bash
# macOS
brew install allure

# Ubuntu/Debian
sudo apt-get install allure

# Manual installation
wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz
tar -zxvf allure-2.24.0.tgz
sudo mv allure-2.24.0 /opt/allure
echo 'export PATH="/opt/allure/bin:$PATH"' >> ~/.bashrc
```

### Generate Reports

```bash
# Run tests and generate results
composer test

# Generate Allure report
allure generate tests/_output/allure-results -o allure-report --clean

# Serve report locally
allure serve tests/_output/allure-results
```

### Upload to PA-QA Dashboard

```bash
# Copy upload script
cp /path/to/pa-qa/shared/allure-config/upload-results.sh ./

# Upload results
./upload-results.sh your-wordpress-project
```

## 🔧 Step 8: Docker Integration

### WordPress Test Environment

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  wordpress:
    image: wordpress:6.4-php8.1
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_NAME: wordpress_test
      WORDPRESS_DB_USER: root
      WORDPRESS_DB_PASSWORD: password
      WORDPRESS_DEBUG: 1
    ports:
      - "8080:80"
    volumes:
      - .:/var/www/html/wp-content/plugins/your-plugin
      - ./tests/mu-plugins:/var/www/html/wp-content/mu-plugins
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: wordpress_test
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  php-tests:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      DB_HOST: mysql
      DB_NAME: wordpress_test
      DB_USER: root
      DB_PASSWORD: password
      WP_TESTS_DIR: /tmp/wordpress-tests-lib
    volumes:
      - .:/app
    depends_on:
      - mysql
    command: composer test

volumes:
  mysql_data:
```

### Test Dockerfile

Create `Dockerfile.test`:

```dockerfile
FROM php:8.1-cli

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    mysql-client \
    && docker-php-ext-install zip pdo_mysql mysqli

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install WordPress test suite
RUN git clone https://github.com/WordPress/wordpress-develop.git /tmp/wordpress-tests-lib --depth=1

# Set working directory
WORKDIR /app

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-interaction --prefer-dist

# Copy source code
COPY . .

# Install WordPress test database
RUN bash /tmp/wordpress-tests-lib/bin/install-wp-tests.sh wordpress_test root password mysql latest

CMD ["composer", "test"]
```

## 🔧 Step 9: CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/wordpress-test.yml`:

```yaml
name: WordPress Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  ALLURE_PROJECT_NAME: your-wordpress-project

jobs:
  php-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        php-version: [8.0, 8.1, 8.2]
        wordpress-version: [6.3, 6.4, latest]
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: wordpress_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: ${{ matrix.php-version }}
        extensions: mysqli, pdo_mysql, zip
        tools: composer, phpunit
    
    - name: Cache Composer dependencies
      uses: actions/cache@v3
      with:
        path: vendor
        key: composer-${{ hashFiles('composer.lock') }}
    
    - name: Install dependencies
      run: composer install --prefer-dist --no-interaction
    
    - name: Install WordPress test suite
      run: |
        bash bin/install-wp-tests.sh wordpress_test root password 127.0.0.1:3306 ${{ matrix.wordpress-version }}
    
    - name: Run PHP_CodeSniffer
      run: composer phpcs
    
    - name: Run PHPStan
      run: composer phpstan
    
    - name: Run PHPUnit tests
      run: composer test
    
    - name: Upload test results to Allure
      if: always()
      run: ./upload-results.sh ${{ env.ALLURE_PROJECT_NAME }}

  browser-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Start WordPress environment
      run: docker-compose -f docker-compose.test.yml up -d
    
    - name: Wait for WordPress
      run: |
        while ! curl -f http://localhost:8080; do
          sleep 5
        done
    
    - name: Run Playwright tests
      run: npm run test:browser
    
    - name: Upload browser test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
```

## ✅ Step 10: Verification

### Run All Tests

```bash
# PHP code quality
composer phpcs
composer phpstan

# Unit and integration tests
composer test

# Browser tests
npm run test:browser

# Generate coverage report
composer test:coverage

# Generate Allure report
allure generate tests/_output/allure-results -o allure-report --clean
allure serve tests/_output/allure-results
```

### Check Test Coverage

```bash
# View coverage report
open coverage-report/index.html

# Check coverage meets 70% threshold
composer test:coverage | grep "Lines:"
```

### Verify WordPress Integration

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Access WordPress admin
open http://localhost:8080/wp-admin

# Run tests against live environment
composer test:integration
```

## 🎯 Advanced Testing Patterns

### Multisite Testing

```php
// tests/multisite/test-multisite-functionality.php
class Test_Multisite_Functionality extends WP_UnitTestCase {
    
    public function setUp(): void {
        if (!is_multisite()) {
            $this->markTestSkipped('Multisite not enabled');
        }
        parent::setUp();
    }
    
    public function test_plugin_works_across_sites() {
        $site_id = $this->factory->blog->create();
        switch_to_blog($site_id);
        
        // Test plugin functionality on new site
        $this->assertTrue(is_plugin_active('your-plugin/your-plugin.php'));
        
        restore_current_blog();
    }
}
```

### REST API Testing

```php
// tests/integration/test-rest-api.php
class Test_REST_API extends WP_Test_REST_TestCase {
    
    public function test_custom_endpoint_returns_data() {
        $request = new WP_REST_Request('GET', '/your-plugin/v1/data');
        $response = rest_get_server()->dispatch($request);
        
        $this->assertEquals(200, $response->get_status());
        $this->assertArrayHasKey('data', $response->get_data());
    }
    
    public function test_endpoint_requires_authentication() {
        $request = new WP_REST_Request('POST', '/your-plugin/v1/protected');
        $response = rest_get_server()->dispatch($request);
        
        $this->assertEquals(401, $response->get_status());
    }
}
```

## 🆘 Troubleshooting

### Common Issues

**Database connection fails**
```bash
# Check MySQL service is running
docker-compose -f docker-compose.test.yml ps mysql

# Reset database
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
```

**Tests timing out**
```xml
<!-- Increase timeout in phpunit.xml -->
<phpunit processIsolation="false" timeoutForSmallTests="10">
```

**Memory issues**
```bash
# Increase PHP memory limit
php -d memory_limit=512M vendor/bin/phpunit
```

**WordPress not loading**
```bash
# Check WordPress installation
ls /tmp/wordpress-tests-lib/
bash bin/install-wp-tests.sh wordpress_test root password localhost latest true
```

### Get Help

- **Documentation**: `/docs/troubleshooting/common-issues.md`
- **Examples**: `/project-types/wordpress/plugin/tests/`
- **Community**: Join our Slack #wordpress-testing channel
- **Issues**: Create issue in PA-QA repository

## 📚 Additional Resources

- [PA-QA Best Practices](/docs/best-practices/testing-patterns.md)
- [Docker Testing Setup](/docs/setup-guides/docker-testing-setup.md)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- [WordPress Testing Handbook](https://make.wordpress.org/core/handbook/testing/)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)

---

**🎉 Congratulations!** Your WordPress project now has comprehensive testing setup with the PA-QA framework. You're ready to build high-quality, well-tested WordPress plugins and themes with confidence.