<?php
/**
 * WordPress Authentication Testing Utilities
 * Provides comprehensive authentication helpers for WordPress testing
 */

declare(strict_types=1);

class WPAuthTestHelper
{
    private string $secret;
    private int $tokenExpiry;
    private int $sessionExpiry;
    private bool $enableMfa;
    private array $users = [];
    private array $sessions = [];

    public function __construct(array $config = [])
    {
        $this->secret = $config['secret'] ?? 'test-wp-secret-key-for-testing-only';
        $this->tokenExpiry = $config['token_expiry'] ?? 3600; // 1 hour
        $this->sessionExpiry = $config['session_expiry'] ?? 86400; // 24 hours
        $this->enableMfa = $config['enable_mfa'] ?? false;
    }

    /**
     * Hash password for testing
     */
    public function hashPassword(string $password, ?string $salt = null): array
    {
        $actualSalt = $salt ?? bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha256', $password, $actualSalt, 1000, 64);
        
        return [
            'hash' => $hash,
            'salt' => $actualSalt
        ];
    }

    /**
     * Verify password against hash
     */
    public function verifyPassword(string $password, string $hash, string $salt): bool
    {
        $hashedPassword = hash_pbkdf2('sha256', $password, $salt, 1000, 64);
        return hash_equals($hashedPassword, $hash);
    }

    /**
     * Generate WordPress-style password hash
     */
    public function wpHashPassword(string $password): string
    {
        // Simplified WordPress password hash for testing
        $salt = bin2hex(random_bytes(8));
        return '$WP$' . base64_encode(hash('sha256', $password . $salt, true)) . '$' . $salt;
    }

    /**
     * Verify WordPress-style password hash
     */
    public function wpVerifyPassword(string $password, string $hash): bool
    {
        if (!str_starts_with($hash, '$WP$')) {
            return false;
        }

        $parts = explode('$', $hash);
        if (count($parts) !== 4) {
            return false;
        }

        $salt = $parts[3];
        $expectedHash = '$WP$' . base64_encode(hash('sha256', $password . $salt, true)) . '$' . $salt;
        
        return hash_equals($expectedHash, $hash);
    }

    /**
     * Generate authentication cookie
     */
    public function generateAuthCookie(int $userId, int $expiration = null): string
    {
        $expiration = $expiration ?? (time() + $this->sessionExpiry);
        $username = "test_user_{$userId}";
        $token = $this->generateSessionToken();
        
        $cookie = base64_encode(json_encode([
            'user_id' => $userId,
            'username' => $username,
            'token' => $token,
            'expiration' => $expiration
        ]));

        return $cookie;
    }

    /**
     * Parse authentication cookie
     */
    public function parseAuthCookie(string $cookie): ?array
    {
        $decoded = base64_decode($cookie);
        if (!$decoded) {
            return null;
        }

        $data = json_decode($decoded, true);
        if (!$data || !isset($data['user_id'], $data['token'], $data['expiration'])) {
            return null;
        }

        return $data;
    }

    /**
     * Generate session token
     */
    public function generateSessionToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Generate WordPress nonce
     */
    public function generateNonce(string $action = '', int $userId = 0): string
    {
        $time = time();
        $tick = ceil($time / 43200); // 12 hours
        $nonce = hash('sha256', $tick . $action . $userId . $this->secret);
        
        return substr($nonce, 0, 10);
    }

    /**
     * Verify WordPress nonce
     */
    public function verifyNonce(string $nonce, string $action = '', int $userId = 0): bool
    {
        $time = time();
        
        // Check current and previous tick (24-hour window)
        for ($i = 0; $i <= 1; $i++) {
            $tick = ceil(($time - ($i * 43200)) / 43200);
            $expectedNonce = hash('sha256', $tick . $action . $userId . $this->secret);
            
            if (hash_equals(substr($expectedNonce, 0, 10), $nonce)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Create test user
     */
    public function createTestUser(array $userData = []): array
    {
        $userId = $userData['ID'] ?? rand(1000, 9999);
        $username = $userData['user_login'] ?? "test_user_{$userId}";
        $email = $userData['user_email'] ?? "{$username}@test.com";
        
        $user = [
            'ID' => $userId,
            'user_login' => $username,
            'user_email' => $email,
            'user_pass' => $userData['user_pass'] ?? 'test_password_123',
            'user_nicename' => $userData['user_nicename'] ?? $username,
            'display_name' => $userData['display_name'] ?? ucfirst(str_replace('_', ' ', $username)),
            'first_name' => $userData['first_name'] ?? 'Test',
            'last_name' => $userData['last_name'] ?? 'User',
            'user_registered' => $userData['user_registered'] ?? date('Y-m-d H:i:s'),
            'user_status' => $userData['user_status'] ?? 0,
            'user_activation_key' => $userData['user_activation_key'] ?? '',
            'user_url' => $userData['user_url'] ?? '',
            'roles' => $userData['roles'] ?? ['subscriber'],
            'allcaps' => $this->getRoleCaps($userData['roles'] ?? ['subscriber']),
            'meta' => $userData['meta'] ?? []
        ];

        $this->users[$userId] = $user;
        return $user;
    }

    /**
     * Get capabilities for roles
     */
    private function getRoleCaps(array $roles): array
    {
        $allCaps = [];
        
        foreach ($roles as $role) {
            switch ($role) {
                case 'administrator':
                    $allCaps = array_merge($allCaps, [
                        'switch_themes' => true,
                        'edit_themes' => true,
                        'activate_plugins' => true,
                        'edit_plugins' => true,
                        'edit_users' => true,
                        'edit_files' => true,
                        'manage_options' => true,
                        'moderate_comments' => true,
                        'manage_categories' => true,
                        'manage_links' => true,
                        'upload_files' => true,
                        'import' => true,
                        'unfiltered_html' => true,
                        'edit_posts' => true,
                        'edit_others_posts' => true,
                        'edit_published_posts' => true,
                        'publish_posts' => true,
                        'edit_pages' => true,
                        'read' => true,
                        'delete_posts' => true,
                        'delete_others_posts' => true,
                        'delete_published_posts' => true,
                        'delete_pages' => true,
                        'delete_others_pages' => true,
                        'delete_published_pages' => true,
                        'delete_private_posts' => true,
                        'edit_private_posts' => true,
                        'read_private_posts' => true,
                        'delete_private_pages' => true,
                        'edit_private_pages' => true,
                        'read_private_pages' => true,
                        'delete_users' => true,
                        'create_users' => true,
                        'unfiltered_upload' => true,
                        'edit_dashboard' => true,
                        'update_plugins' => true,
                        'delete_plugins' => true,
                        'install_plugins' => true,
                        'update_themes' => true,
                        'install_themes' => true,
                        'update_core' => true,
                        'list_users' => true,
                        'remove_users' => true,
                        'promote_users' => true,
                        'edit_theme_options' => true,
                        'delete_themes' => true,
                        'export' => true
                    ]);
                    break;
                    
                case 'editor':
                    $allCaps = array_merge($allCaps, [
                        'moderate_comments' => true,
                        'manage_categories' => true,
                        'manage_links' => true,
                        'upload_files' => true,
                        'unfiltered_html' => true,
                        'edit_posts' => true,
                        'edit_others_posts' => true,
                        'edit_published_posts' => true,
                        'publish_posts' => true,
                        'edit_pages' => true,
                        'read' => true,
                        'delete_posts' => true,
                        'delete_others_posts' => true,
                        'delete_published_posts' => true,
                        'delete_pages' => true,
                        'delete_others_pages' => true,
                        'delete_published_pages' => true,
                        'delete_private_posts' => true,
                        'edit_private_posts' => true,
                        'read_private_posts' => true,
                        'delete_private_pages' => true,
                        'edit_private_pages' => true,
                        'read_private_pages' => true
                    ]);
                    break;
                    
                case 'author':
                    $allCaps = array_merge($allCaps, [
                        'upload_files' => true,
                        'edit_posts' => true,
                        'edit_published_posts' => true,
                        'publish_posts' => true,
                        'read' => true,
                        'delete_posts' => true,
                        'delete_published_posts' => true
                    ]);
                    break;
                    
                case 'contributor':
                    $allCaps = array_merge($allCaps, [
                        'edit_posts' => true,
                        'read' => true,
                        'delete_posts' => true
                    ]);
                    break;
                    
                case 'subscriber':
                default:
                    $allCaps = array_merge($allCaps, [
                        'read' => true
                    ]);
                    break;
            }
        }
        
        return $allCaps;
    }

    /**
     * Create test user with specific role
     */
    public function createUserWithRole(string $role, array $userData = []): array
    {
        $userData['roles'] = [$role];
        return $this->createTestUser($userData);
    }

    /**
     * Create multiple test users
     */
    public function createTestUsers(int $count, array $baseData = []): array
    {
        $users = [];
        
        for ($i = 0; $i < $count; $i++) {
            $users[] = $this->createTestUser($baseData);
        }
        
        return $users;
    }

    /**
     * Check if user has capability
     */
    public function userCan(array $user, string $capability): bool
    {
        return isset($user['allcaps'][$capability]) && $user['allcaps'][$capability];
    }

    /**
     * Check if user has role
     */
    public function userHasRole(array $user, string $role): bool
    {
        return in_array($role, $user['roles']);
    }

    /**
     * Generate WordPress REST API nonce
     */
    public function generateRestNonce(): string
    {
        return $this->generateNonce('wp_rest');
    }

    /**
     * Generate AJAX nonce
     */
    public function generateAjaxNonce(string $action): string
    {
        return $this->generateNonce($action);
    }

    /**
     * Create WordPress error object
     */
    public function createWPError(string $code, string $message, $data = null): array
    {
        return [
            'error_code' => $code,
            'error_message' => $message,
            'error_data' => $data
        ];
    }

    /**
     * Simulate user login
     */
    public function simulateUserLogin(array $user): array
    {
        $sessionToken = $this->generateSessionToken();
        $expiration = time() + $this->sessionExpiry;
        
        $session = [
            'user_id' => $user['ID'],
            'token' => $sessionToken,
            'expiration' => $expiration,
            'ip' => '127.0.0.1',
            'ua' => 'Test User Agent',
            'login_time' => time()
        ];
        
        $this->sessions[$sessionToken] = $session;
        
        return [
            'user' => $user,
            'session_token' => $sessionToken,
            'expiration' => $expiration,
            'auth_cookie' => $this->generateAuthCookie($user['ID'], $expiration)
        ];
    }

    /**
     * Validate session token
     */
    public function validateSessionToken(string $token): ?array
    {
        if (!isset($this->sessions[$token])) {
            return null;
        }
        
        $session = $this->sessions[$token];
        
        if (time() > $session['expiration']) {
            unset($this->sessions[$token]);
            return null;
        }
        
        return $session;
    }

    /**
     * Generate activation key
     */
    public function generateActivationKey(): string
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Generate password reset key
     */
    public function generatePasswordResetKey(): string
    {
        return bin2hex(random_bytes(20));
    }

    /**
     * Create WordPress transient
     */
    public function createTransient(string $name, $value, int $expiration = 0): void
    {
        // Simplified transient storage for testing
        $expiration = $expiration ?: (time() + 3600);
        // In a real implementation, this would interact with WordPress transient API
    }

    /**
     * Mock WordPress user metadata
     */
    public function addUserMeta(int $userId, string $metaKey, $metaValue): void
    {
        if (!isset($this->users[$userId])) {
            return;
        }
        
        if (!isset($this->users[$userId]['meta'])) {
            $this->users[$userId]['meta'] = [];
        }
        
        $this->users[$userId]['meta'][$metaKey] = $metaValue;
    }

    /**
     * Get WordPress user metadata
     */
    public function getUserMeta(int $userId, string $metaKey = ''): mixed
    {
        if (!isset($this->users[$userId]['meta'])) {
            return $metaKey ? '' : [];
        }
        
        if ($metaKey) {
            return $this->users[$userId]['meta'][$metaKey] ?? '';
        }
        
        return $this->users[$userId]['meta'];
    }

    /**
     * Create WordPress multisite scenarios
     */
    public function createMultisiteScenario(): array
    {
        return [
            'network_admin' => $this->createUserWithRole('administrator', [
                'user_login' => 'network_admin',
                'user_email' => 'network@test.com',
                'meta' => ['wp_capabilities' => serialize(['super_admin' => true])]
            ]),
            'site_admins' => [
                $this->createUserWithRole('administrator', [
                    'user_login' => 'site1_admin',
                    'user_email' => 'site1@test.com'
                ]),
                $this->createUserWithRole('administrator', [
                    'user_login' => 'site2_admin',
                    'user_email' => 'site2@test.com'
                ])
            ],
            'regular_users' => $this->createTestUsers(5)
        ];
    }

    /**
     * Reset helper state
     */
    public function reset(): void
    {
        $this->users = [];
        $this->sessions = [];
    }

    /**
     * Get all created users
     */
    public function getUsers(): array
    {
        return $this->users;
    }

    /**
     * Get user by ID
     */
    public function getUser(int $userId): ?array
    {
        return $this->users[$userId] ?? null;
    }
}

// WordPress-specific test scenarios
class WPAuthScenarios
{
    private WPAuthTestHelper $helper;

    public function __construct(WPAuthTestHelper $helper)
    {
        $this->helper = $helper;
    }

    /**
     * Valid authentication scenarios
     */
    public function validAuth(): array
    {
        return [
            'subscriber' => $this->helper->createUserWithRole('subscriber'),
            'contributor' => $this->helper->createUserWithRole('contributor'),
            'author' => $this->helper->createUserWithRole('author'),
            'editor' => $this->helper->createUserWithRole('editor'),
            'administrator' => $this->helper->createUserWithRole('administrator')
        ];
    }

    /**
     * Invalid authentication scenarios
     */
    public function invalidAuth(): array
    {
        return [
            'inactive_user' => $this->helper->createTestUser([
                'user_status' => 1 // Inactive
            ]),
            'pending_activation' => $this->helper->createTestUser([
                'user_activation_key' => $this->helper->generateActivationKey()
            ]),
            'no_capabilities' => $this->helper->createTestUser([
                'roles' => [],
                'allcaps' => []
            ])
        ];
    }

    /**
     * Permission-based scenarios
     */
    public function permissionScenarios(): array
    {
        return [
            'can_edit_posts' => $this->helper->createUserWithRole('author'),
            'can_manage_options' => $this->helper->createUserWithRole('administrator'),
            'can_moderate_comments' => $this->helper->createUserWithRole('editor'),
            'read_only' => $this->helper->createUserWithRole('subscriber')
        ];
    }

    /**
     * WordPress-specific edge cases
     */
    public function edgeCases(): array
    {
        return [
            'multisite_super_admin' => $this->helper->createUserWithRole('administrator', [
                'meta' => ['wp_capabilities' => serialize(['super_admin' => true])]
            ]),
            'user_with_custom_role' => $this->helper->createTestUser([
                'roles' => ['custom_role'],
                'allcaps' => ['custom_capability' => true, 'read' => true]
            ]),
            'user_multiple_roles' => $this->helper->createTestUser([
                'roles' => ['author', 'editor']
            ])
        ];
    }
}

// Global helper instance for convenience
$wpAuthHelper = new WPAuthTestHelper();
$wpAuthScenarios = new WPAuthScenarios($wpAuthHelper);

// Convenience functions for WordPress testing
if (!function_exists('create_test_user')) {
    function create_test_user(array $userData = []): array
    {
        global $wpAuthHelper;
        return $wpAuthHelper->createTestUser($userData);
    }
}

if (!function_exists('create_user_with_role')) {
    function create_user_with_role(string $role, array $userData = []): array
    {
        global $wpAuthHelper;
        return $wpAuthHelper->createUserWithRole($role, $userData);
    }
}

if (!function_exists('generate_wp_nonce')) {
    function generate_wp_nonce(string $action = ''): string
    {
        global $wpAuthHelper;
        return $wpAuthHelper->generateNonce($action);
    }
}

if (!function_exists('simulate_user_login')) {
    function simulate_user_login(array $user): array
    {
        global $wpAuthHelper;
        return $wpAuthHelper->simulateUserLogin($user);
    }
}
?>