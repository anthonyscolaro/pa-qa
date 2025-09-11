<?php

declare(strict_types=1);

/*
 * PHPStan Bootstrap File for PA-QA Framework
 * 
 * This file is loaded before PHPStan analysis to provide framework-specific
 * constants, functions, and class definitions that may not be available
 * during static analysis.
 */

// Ensure we're in the correct directory
if (!defined('PHPSTAN_BOOTSTRAP_LOADED')) {
    define('PHPSTAN_BOOTSTRAP_LOADED', true);

    // Check if Composer autoloader exists
    $possibleAutoloaderPaths = [
        __DIR__ . '/vendor/autoload.php',
        __DIR__ . '/../../../vendor/autoload.php',
        __DIR__ . '/../../../../vendor/autoload.php',
    ];

    foreach ($possibleAutoloaderPaths as $autoloaderPath) {
        if (file_exists($autoloaderPath)) {
            require_once $autoloaderPath;
            break;
        }
    }

    // WordPress Constants and Functions
    if (!defined('WP_DEBUG')) {
        define('WP_DEBUG', true);
        define('WP_DEBUG_LOG', true);
        define('WP_DEBUG_DISPLAY', false);
        define('ABSPATH', __DIR__ . '/');
        define('WP_CONTENT_DIR', ABSPATH . 'wp-content');
        define('WP_CONTENT_URL', 'http://localhost/wp-content');
        define('WP_PLUGIN_DIR', WP_CONTENT_DIR . '/plugins');
        define('WP_PLUGIN_URL', WP_CONTENT_URL . '/plugins');
        define('WPMU_PLUGIN_DIR', WP_CONTENT_DIR . '/mu-plugins');
        define('WPMU_PLUGIN_URL', WP_CONTENT_URL . '/mu-plugins');
        define('WP_THEME_DIR', WP_CONTENT_DIR . '/themes');
        define('WP_LANG_DIR', WP_CONTENT_DIR . '/languages');
        define('WP_UPLOADS_DIR', WP_CONTENT_DIR . '/uploads');
        define('COOKIEPATH', '/');
        define('SITECOOKIEPATH', '/');
        define('ADMIN_COOKIE_PATH', '/wp-admin');
        define('PLUGINS_COOKIE_PATH', COOKIEPATH . 'wp-content/plugins');
        define('TEMPLATEPATH', WP_THEME_DIR);
        define('STYLESHEETPATH', WP_THEME_DIR);
    }

    // WordPress Global Variables (for PHPStan understanding)
    if (!isset($GLOBALS['wpdb'])) {
        $GLOBALS['wpdb'] = new stdClass();
        $GLOBALS['wp_query'] = new stdClass();
        $GLOBALS['wp_rewrite'] = new stdClass();
        $GLOBALS['wp'] = new stdClass();
        $GLOBALS['wp_the_query'] = new stdClass();
        $GLOBALS['wp_scripts'] = new stdClass();
        $GLOBALS['wp_styles'] = new stdClass();
        $GLOBALS['current_user'] = new stdClass();
        $GLOBALS['authordata'] = new stdClass();
        $GLOBALS['currentday'] = '';
        $GLOBALS['currentmonth'] = '';
        $GLOBALS['page'] = 1;
        $GLOBALS['pages'] = [];
        $GLOBALS['multipage'] = false;
        $GLOBALS['more'] = true;
        $GLOBALS['numpages'] = 1;
    }

    // Common WordPress functions (stubs for PHPStan)
    if (!function_exists('wp_die')) {
        function wp_die(string $message = '', string $title = '', array $args = []): void
        {
            throw new Exception($message);
        }
    }

    if (!function_exists('esc_html')) {
        function esc_html(string $text): string
        {
            return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
        }
    }

    if (!function_exists('esc_attr')) {
        function esc_attr(string $text): string
        {
            return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
        }
    }

    if (!function_exists('esc_url')) {
        function esc_url(string $url): string
        {
            return filter_var($url, FILTER_SANITIZE_URL) ?: '';
        }
    }

    if (!function_exists('sanitize_text_field')) {
        function sanitize_text_field(string $str): string
        {
            return trim(strip_tags($str));
        }
    }

    if (!function_exists('wp_nonce_field')) {
        function wp_nonce_field(string $action = '', string $name = '', bool $referer = true, bool $echo = true): string
        {
            $nonce = '<input type="hidden" name="' . $name . '" value="' . wp_create_nonce($action) . '" />';
            if ($echo) {
                echo $nonce;
            }
            return $nonce;
        }
    }

    if (!function_exists('wp_create_nonce')) {
        function wp_create_nonce(string $action = ''): string
        {
            return hash('sha256', $action . time());
        }
    }

    if (!function_exists('wp_verify_nonce')) {
        function wp_verify_nonce(string $nonce, string $action = ''): bool|int
        {
            return true; // For testing purposes
        }
    }

    if (!function_exists('current_user_can')) {
        function current_user_can(string $capability): bool
        {
            return true; // For testing purposes
        }
    }

    if (!function_exists('get_option')) {
        function get_option(string $option, mixed $default = false): mixed
        {
            return $default;
        }
    }

    if (!function_exists('update_option')) {
        function update_option(string $option, mixed $value): bool
        {
            return true;
        }
    }

    if (!function_exists('add_action')) {
        function add_action(string $hook_name, callable $callback, int $priority = 10, int $accepted_args = 1): bool
        {
            return true;
        }
    }

    if (!function_exists('add_filter')) {
        function add_filter(string $hook_name, callable $callback, int $priority = 10, int $accepted_args = 1): bool
        {
            return true;
        }
    }

    if (!function_exists('remove_action')) {
        function remove_action(string $hook_name, callable $callback, int $priority = 10): bool
        {
            return true;
        }
    }

    if (!function_exists('remove_filter')) {
        function remove_filter(string $hook_name, callable $callback, int $priority = 10): bool
        {
            return true;
        }
    }

    if (!function_exists('do_action')) {
        function do_action(string $hook_name, ...$args): void
        {
            // No-op for static analysis
        }
    }

    if (!function_exists('apply_filters')) {
        function apply_filters(string $hook_name, mixed $value, ...$args): mixed
        {
            return $value;
        }
    }

    if (!function_exists('is_admin')) {
        function is_admin(): bool
        {
            return false;
        }
    }

    if (!function_exists('is_user_logged_in')) {
        function is_user_logged_in(): bool
        {
            return false;
        }
    }

    if (!function_exists('wp_enqueue_script')) {
        function wp_enqueue_script(string $handle, string $src = '', array $deps = [], string|bool $ver = false, bool $in_footer = false): void
        {
            // No-op for static analysis
        }
    }

    if (!function_exists('wp_enqueue_style')) {
        function wp_enqueue_style(string $handle, string $src = '', array $deps = [], string|bool $ver = false, string $media = 'all'): void
        {
            // No-op for static analysis
        }
    }

    // Laravel Constants and Helpers
    if (!defined('LARAVEL_START')) {
        define('LARAVEL_START', microtime(true));
    }

    // Laravel helper functions (stubs for PHPStan)
    if (!function_exists('app')) {
        function app(string $abstract = null, array $parameters = []): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('config')) {
        function config(string $key = null, mixed $default = null): mixed
        {
            return $default;
        }
    }

    if (!function_exists('env')) {
        function env(string $key, mixed $default = null): mixed
        {
            return $_ENV[$key] ?? $default;
        }
    }

    if (!function_exists('request')) {
        function request(string $key = null, mixed $default = null): mixed
        {
            return $default;
        }
    }

    if (!function_exists('response')) {
        function response(mixed $content = '', int $status = 200, array $headers = []): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('route')) {
        function route(string $name, array $parameters = [], bool $absolute = true): string
        {
            return 'http://localhost/' . $name;
        }
    }

    if (!function_exists('url')) {
        function url(string $path = null, array $parameters = [], bool $secure = null): string
        {
            return 'http://localhost/' . $path;
        }
    }

    if (!function_exists('asset')) {
        function asset(string $path, bool $secure = null): string
        {
            return 'http://localhost/' . $path;
        }
    }

    if (!function_exists('view')) {
        function view(string $view = null, array $data = [], array $mergeData = []): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('redirect')) {
        function redirect(string $to = null, int $status = 302, array $headers = [], bool $secure = null): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('session')) {
        function session(string $key = null, mixed $default = null): mixed
        {
            return $default;
        }
    }

    if (!function_exists('old')) {
        function old(string $key = null, mixed $default = null): mixed
        {
            return $default;
        }
    }

    if (!function_exists('csrf_token')) {
        function csrf_token(): string
        {
            return hash('sha256', 'csrf_token');
        }
    }

    if (!function_exists('csrf_field')) {
        function csrf_field(): string
        {
            return '<input type="hidden" name="_token" value="' . csrf_token() . '">';
        }
    }

    if (!function_exists('method_field')) {
        function method_field(string $method): string
        {
            return '<input type="hidden" name="_method" value="' . $method . '">';
        }
    }

    if (!function_exists('abort')) {
        function abort(int $code, string $message = '', array $headers = []): void
        {
            throw new Exception($message, $code);
        }
    }

    if (!function_exists('auth')) {
        function auth(string $guard = null): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('cache')) {
        function cache(string $key = null, mixed $value = null): mixed
        {
            return $value;
        }
    }

    if (!function_exists('collect')) {
        function collect(mixed $value = null): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('logger')) {
        function logger(string $message = null, array $context = []): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('now')) {
        function now(string $tz = null): mixed
        {
            return new DateTime();
        }
    }

    if (!function_exists('today')) {
        function today(string $tz = null): mixed
        {
            return new DateTime();
        }
    }

    if (!function_exists('optional')) {
        function optional(mixed $value = null, callable $callback = null): mixed
        {
            return $value;
        }
    }

    if (!function_exists('rescue')) {
        function rescue(callable $callback, mixed $rescue = null, bool $report = true): mixed
        {
            try {
                return $callback();
            } catch (Throwable $e) {
                return $rescue;
            }
        }
    }

    if (!function_exists('retry')) {
        function retry(int $times, callable $callback, int $sleep = 0): mixed
        {
            return $callback();
        }
    }

    if (!function_exists('tap')) {
        function tap(mixed $value, callable $callback = null): mixed
        {
            if ($callback) {
                $callback($value);
            }
            return $value;
        }
    }

    if (!function_exists('throw_if')) {
        function throw_if(bool $condition, string $exception, string $message = ''): void
        {
            if ($condition) {
                throw new Exception($message);
            }
        }
    }

    if (!function_exists('throw_unless')) {
        function throw_unless(bool $condition, string $exception, string $message = ''): void
        {
            if (!$condition) {
                throw new Exception($message);
            }
        }
    }

    if (!function_exists('validator')) {
        function validator(array $data = [], array $rules = [], array $messages = [], array $customAttributes = []): mixed
        {
            return new stdClass();
        }
    }

    // Generic PHP helper functions
    if (!function_exists('dd')) {
        function dd(...$vars): void
        {
            var_dump(...$vars);
            exit(1);
        }
    }

    if (!function_exists('dump')) {
        function dump(...$vars): void
        {
            var_dump(...$vars);
        }
    }

    // Common testing functions
    if (!function_exists('test')) {
        function test(string $description, callable $callback = null): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('it')) {
        function it(string $description, callable $callback = null): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('expect')) {
        function expect(mixed $value): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('mock')) {
        function mock(string $class): mixed
        {
            return new stdClass();
        }
    }

    if (!function_exists('spy')) {
        function spy(string $class): mixed
        {
            return new stdClass();
        }
    }
}

// Load framework-specific bootstrap files if they exist
$frameworkBootstrapFiles = [
    __DIR__ . '/bootstrap/laravel.php',
    __DIR__ . '/bootstrap/wordpress.php',
    __DIR__ . '/wp-config.php',
    __DIR__ . '/config/app.php',
];

foreach ($frameworkBootstrapFiles as $bootstrapFile) {
    if (file_exists($bootstrapFile)) {
        try {
            require_once $bootstrapFile;
        } catch (Throwable $e) {
            // Ignore errors during bootstrap - PHPStan will handle missing dependencies
        }
        break;
    }
}