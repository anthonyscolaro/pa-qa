"use client"

import React, { useState, useEffect } from 'react'
import { Play, CheckCircle, XCircle, Clock, Download, ExternalLink } from 'lucide-react'
import { CodeDemo, TestRunner } from '../mdx'

interface FrameworkExample {
  name: string
  description: string
  setupCode: string
  testCode: string
  configFiles: { name: string; content: string }[]
  dependencies: string[]
  commands: string[]
}

interface IntegrationResult {
  framework: string
  status: 'success' | 'error' | 'running'
  coverage: number
  testsRun: number
  testsPassed: number
  duration: number
  output?: string
  error?: string
}

const FRAMEWORK_EXAMPLES: FrameworkExample[] = [
  {
    name: "React + TypeScript",
    description: "Modern React application with comprehensive testing setup",
    setupCode: `// src/components/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  loading = false 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={\`btn btn-\${variant} \${loading ? 'loading' : ''}\`}
      data-testid="button"
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}`,
    testCode: `// src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Loading...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies correct variant class', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});`,
    configFiles: [
      {
        name: "vitest.config.ts",
        content: `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})`
      }
    ],
    dependencies: [
      "@testing-library/react",
      "@testing-library/jest-dom", 
      "vitest",
      "jsdom",
      "@vitejs/plugin-react"
    ],
    commands: [
      "npm install",
      "npm run test:coverage",
      "npm run build"
    ]
  },
  {
    name: "FastAPI + Python",
    description: "Python REST API with async testing and comprehensive validation",
    setupCode: `# app/models/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    age: Optional[int] = None

class User(UserCreate):
    id: int
    created_at: datetime
    is_active: bool = True
    
    class Config:
        from_attributes = True

# app/services/user_service.py
from typing import List, Optional
from app.models.user import User, UserCreate
from app.database import get_db_session

class UserService:
    async def create_user(self, user_data: UserCreate) -> User:
        # Validate user data
        if user_data.age and user_data.age < 0:
            raise ValueError("Age must be positive")
            
        # Simulate database save
        user = User(
            id=1,
            **user_data.dict(),
            created_at=datetime.utcnow()
        )
        return user
    
    async def get_user(self, user_id: int) -> Optional[User]:
        # Simulate database query
        if user_id <= 0:
            return None
        return User(
            id=user_id,
            email="test@example.com",
            name="Test User",
            created_at=datetime.utcnow()
        )`,
    testCode: `# tests/test_user_service.py
import pytest
from datetime import datetime
from app.services.user_service import UserService
from app.models.user import UserCreate

@pytest.mark.asyncio
class TestUserService:
    async def test_create_user_success(self):
        service = UserService()
        user_data = UserCreate(
            email="test@example.com",
            name="Test User",
            age=25
        )
        
        user = await service.create_user(user_data)
        
        assert user.email == "test@example.com"
        assert user.name == "Test User"
        assert user.age == 25
        assert user.is_active is True
        assert isinstance(user.created_at, datetime)

    async def test_create_user_invalid_age(self):
        service = UserService()
        user_data = UserCreate(
            email="test@example.com",
            name="Test User",
            age=-5
        )
        
        with pytest.raises(ValueError, match="Age must be positive"):
            await service.create_user(user_data)

    async def test_get_user_exists(self):
        service = UserService()
        user = await service.get_user(1)
        
        assert user is not None
        assert user.id == 1
        assert user.email == "test@example.com"

    async def test_get_user_not_found(self):
        service = UserService()
        user = await service.get_user(-1)
        
        assert user is None`,
    configFiles: [
      {
        name: "pyproject.toml",
        content: `[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--strict-config",
    "--cov=app",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-fail-under=80"
]
asyncio_mode = "auto"

[tool.coverage.run]
source = ["app"]
omit = ["tests/*", "app/__pycache__/*"]

[tool.ruff]
target-version = "py39"
line-length = 88
select = ["E", "F", "I", "N", "W", "UP"]
ignore = ["E501"]`
      }
    ],
    dependencies: [
      "pytest",
      "pytest-asyncio", 
      "pytest-cov",
      "pydantic",
      "fastapi",
      "httpx"
    ],
    commands: [
      "pip install -r requirements-dev.txt",
      "pytest --cov=app --cov-report=html",
      "ruff check .",
      "mypy app/"
    ]
  },
  {
    name: "WordPress Plugin",
    description: "WordPress plugin with PHPUnit testing and modern PHP practices",
    setupCode: `<?php
// src/UserManager.php
class UserManager {
    
    public function createUser(array $userData): int {
        // Validate required fields
        if (empty($userData['user_email']) || !is_email($userData['user_email'])) {
            throw new InvalidArgumentException('Valid email is required');
        }
        
        if (empty($userData['user_login'])) {
            throw new InvalidArgumentException('Username is required');
        }
        
        // Set defaults
        $userData = wp_parse_args($userData, [
            'user_pass' => wp_generate_password(),
            'role' => 'subscriber',
            'display_name' => $userData['user_login'] ?? ''
        ]);
        
        // Create user
        $userId = wp_create_user(
            $userData['user_login'],
            $userData['user_pass'], 
            $userData['user_email']
        );
        
        if (is_wp_error($userId)) {
            throw new Exception($userId->get_error_message());
        }
        
        // Set additional user meta
        if (!empty($userData['display_name'])) {
            wp_update_user([
                'ID' => $userId,
                'display_name' => $userData['display_name']
            ]);
        }
        
        // Set user role
        $user = new WP_User($userId);
        $user->set_role($userData['role']);
        
        // Send welcome email
        $this->sendWelcomeEmail($userId);
        
        return $userId;
    }
    
    private function sendWelcomeEmail(int $userId): bool {
        $user = get_userdata($userId);
        
        return wp_mail(
            $user->user_email,
            'Welcome to Our Site',
            "Welcome {$user->display_name}! Your account has been created."
        );
    }
}`,
    testCode: `<?php
// tests/UserManagerTest.php
use PHPUnit\\Framework\\TestCase;
use Brain\\Monkey\\Functions;

class UserManagerTest extends WP_UnitTestCase {
    
    private $userManager;
    
    public function setUp(): void {
        parent::setUp();
        $this->userManager = new UserManager();
    }
    
    public function test_create_user_success(): void {
        $userData = [
            'user_login' => 'testuser',
            'user_email' => 'test@example.com',
            'display_name' => 'Test User'
        ];
        
        $userId = $this->userManager->createUser($userData);
        
        $this->assertIsInt($userId);
        $this->assertGreaterThan(0, $userId);
        
        $user = get_userdata($userId);
        $this->assertEquals('test@example.com', $user->user_email);
        $this->assertEquals('Test User', $user->display_name);
    }
    
    public function test_create_user_invalid_email(): void {
        $userData = [
            'user_login' => 'testuser',
            'user_email' => 'invalid-email'
        ];
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Valid email is required');
        
        $this->userManager->createUser($userData);
    }
    
    public function test_create_user_sends_welcome_email(): void {
        Functions\\expect('wp_mail')
            ->once()
            ->with(
                'test@example.com',
                'Welcome to Our Site',
                Mockery::type('string')
            )
            ->andReturn(true);
            
        $userData = [
            'user_login' => 'testuser',
            'user_email' => 'test@example.com'
        ];
        
        $userId = $this->userManager->createUser($userData);
        $this->assertGreaterThan(0, $userId);
    }
    
    public function tearDown(): void {
        // Cleanup test users
        $users = get_users(['meta_key' => 'test_user']);
        foreach ($users as $user) {
            wp_delete_user($user->ID);
        }
        
        parent::tearDown();
    }
}`,
    configFiles: [
      {
        name: "phpunit.xml",
        content: `<?xml version="1.0"?>
<phpunit
    bootstrap="tests/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true"
    stopOnFailure="false"
>
    <testsuites>
        <testsuite name="Plugin Tests">
            <directory>./tests/</directory>
        </testsuite>
    </testsuites>
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">./src/</directory>
        </include>
        <report>
            <html outputDirectory="coverage-html"/>
            <text outputFile="php://stdout"/>
        </report>
    </coverage>
    <logging>
        <junit outputFile="junit.xml"/>
    </logging>
</phpunit>`
      }
    ],
    dependencies: [
      "phpunit/phpunit",
      "brain/monkey",
      "mockery/mockery",
      "wp-cli/wp-cli-bundle"
    ],
    commands: [
      "composer install",
      "vendor/bin/phpunit --coverage-html=coverage",
      "vendor/bin/phpstan analyse src/",
      "vendor/bin/php-cs-fixer fix"
    ]
  }
]

export function FrameworkIntegration() {
  const [selectedFramework, setSelectedFramework] = useState<string>(FRAMEWORK_EXAMPLES[0].name)
  const [integrationResults, setIntegrationResults] = useState<Map<string, IntegrationResult>>(new Map())
  const [isRunning, setIsRunning] = useState<string | null>(null)

  const currentExample = FRAMEWORK_EXAMPLES.find(ex => ex.name === selectedFramework)!

  const simulateIntegration = async (framework: string): Promise<IntegrationResult> => {
    // Simulate realistic testing process
    const stages = [
      { name: 'Installing dependencies', duration: 2000 },
      { name: 'Running linting', duration: 1500 },
      { name: 'Type checking', duration: 1000 },
      { name: 'Running tests', duration: 3000 },
      { name: 'Generating coverage', duration: 1000 }
    ]

    let totalTests = Math.floor(Math.random() * 20) + 10
    let testsPassed = Math.floor(totalTests * (0.85 + Math.random() * 0.15))
    let coverage = Math.floor(75 + Math.random() * 20)

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, stage.duration))
    }

    // Simulate occasional failures
    const success = Math.random() > 0.1

    return {
      framework,
      status: success ? 'success' : 'error',
      coverage: success ? coverage : 0,
      testsRun: totalTests,
      testsPassed: success ? testsPassed : Math.floor(totalTests * 0.3),
      duration: stages.reduce((sum, stage) => sum + stage.duration, 0),
      output: success 
        ? `✅ All tests passed!\n📊 Coverage: ${coverage}%\n🎯 ${testsPassed}/${totalTests} tests passed`
        : `❌ Tests failed!\n💥 ${totalTests - testsPassed} tests failed\n📊 Coverage: 45%`,
      error: success ? undefined : 'Some tests failed due to missing dependencies'
    }
  }

  const runIntegration = async (framework: string) => {
    setIsRunning(framework)
    
    // Set initial running state
    setIntegrationResults(prev => new Map(prev).set(framework, {
      framework,
      status: 'running',
      coverage: 0,
      testsRun: 0,
      testsPassed: 0,
      duration: 0
    }))

    try {
      const result = await simulateIntegration(framework)
      setIntegrationResults(prev => new Map(prev).set(framework, result))
    } catch (error) {
      setIntegrationResults(prev => new Map(prev).set(framework, {
        framework,
        status: 'error',
        coverage: 0,
        testsRun: 0,
        testsPassed: 0,
        duration: 0,
        error: error instanceof Error ? error.message : String(error)
      }))
    } finally {
      setIsRunning(null)
    }
  }

  const downloadTemplate = (framework: string) => {
    const example = FRAMEWORK_EXAMPLES.find(ex => ex.name === framework)
    if (!example) return

    const files = [
      { name: 'setup.md', content: `# ${framework} Setup\n\n${example.description}\n\n## Dependencies\n${example.dependencies.map(dep => `- ${dep}`).join('\n')}\n\n## Commands\n${example.commands.map(cmd => `\`${cmd}\``).join('\n')}` },
      { name: 'setup-code.txt', content: example.setupCode },
      { name: 'test-code.txt', content: example.testCode },
      ...example.configFiles
    ]

    const zip = files.map(file => `=== ${file.name} ===\n${file.content}\n\n`).join('')
    
    const blob = new Blob([zip], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${framework.toLowerCase().replace(/[^a-z0-9]/g, '-')}-template.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          PA-QA Framework Integration
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore real-world examples of PA-QA testing implementations across different frameworks.
          Each example includes complete setup code, tests, and configuration files.
        </p>
      </div>

      {/* Framework Selector */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {FRAMEWORK_EXAMPLES.map((example) => {
            const result = integrationResults.get(example.name)
            return (
              <button
                key={example.name}
                onClick={() => setSelectedFramework(example.name)}
                className={`
                  relative px-4 py-3 rounded-lg border-2 transition-all
                  ${selectedFramework === example.name
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {/* Status Indicator */}
                {result && (
                  <div className="absolute -top-2 -right-2">
                    {result.status === 'running' && (
                      <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
                    )}
                    {result.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
                
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {example.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {example.dependencies.length} dependencies
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Code Examples */}
        <div className="space-y-6">
          <CodeDemo
            title={`${currentExample.name} - Setup Code`}
            language={currentExample.name.includes('Python') ? 'python' : 
                     currentExample.name.includes('WordPress') ? 'php' : 'typescript'}
            code={currentExample.setupCode}
            showLineNumbers={true}
            editable={false}
          />

          <CodeDemo
            title={`${currentExample.name} - Test Code`}
            language={currentExample.name.includes('Python') ? 'python' : 
                     currentExample.name.includes('WordPress') ? 'php' : 'typescript'}
            code={currentExample.testCode}
            showLineNumbers={true}
            editable={false}
          />

          {/* Configuration Files */}
          <div className="space-y-4">
            {currentExample.configFiles.map((file, index) => (
              <CodeDemo
                key={index}
                title={`Configuration - ${file.name}`}
                language={file.name.endsWith('.xml') ? 'xml' : 
                         file.name.endsWith('.toml') ? 'toml' : 
                         file.name.endsWith('.json') ? 'json' : 'typescript'}
                code={file.content}
                showLineNumbers={true}
                editable={false}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Integration & Results */}
        <div className="space-y-6">
          {/* Integration Controls */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Integration Testing
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {currentExample.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {currentExample.description}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => runIntegration(currentExample.name)}
                    disabled={isRunning === currentExample.name}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
                  >
                    {isRunning === currentExample.name ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isRunning === currentExample.name ? 'Running...' : 'Run Integration Test'}
                  </button>
                  
                  <button
                    onClick={() => downloadTemplate(currentExample.name)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Dependencies
                </h5>
                <div className="flex flex-wrap gap-2">
                  {currentExample.dependencies.map((dep, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>

              {/* Commands */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Commands
                </h5>
                <div className="space-y-1">
                  {currentExample.commands.map((cmd, index) => (
                    <code
                      key={index}
                      className="block px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Integration Results */}
          {integrationResults.size > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Integration Results
              </h3>
              
              <div className="space-y-4">
                {Array.from(integrationResults.entries()).map(([framework, result]) => (
                  <div
                    key={framework}
                    className={`
                      p-4 rounded-lg border-2
                      ${result.status === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
                        result.status === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                        'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {result.framework}
                      </h4>
                      <div className="flex items-center gap-2">
                        {result.status === 'running' && (
                          <Clock className="w-4 h-4 text-yellow-600 animate-spin" />
                        )}
                        {result.status === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {result.status === 'error' && (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    
                    {result.status !== 'running' && (
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Coverage:</span>
                          <span className="ml-2 font-medium">{result.coverage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="ml-2 font-medium">{(result.duration / 1000).toFixed(1)}s</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Tests:</span>
                          <span className="ml-2 font-medium">{result.testsPassed}/{result.testsRun}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`ml-2 font-medium ${
                            result.status === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.status === 'success' ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {result.output && (
                      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono whitespace-pre-wrap">
                        {result.output}
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="bg-red-900 text-red-100 p-3 rounded text-xs font-mono">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Links
            </h3>
            
            <div className="space-y-3">
              <a
                href="/docs"
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Documentation
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Complete setup guides and API reference
                  </div>
                </div>
              </a>
              
              <a
                href="/templates"
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Project Templates
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Ready-to-use templates for all frameworks
                  </div>
                </div>
              </a>
              
              <a
                href="/best-practices"
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Best Practices
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Testing guidelines and proven approaches
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}