import Link from 'next/link';
import { 
  ArrowRight,
  CheckCircle,
  Code2,
  Database,
  Globe,
  Layers,
  RefreshCw,
  TestTube,
  Users,
  Zap,
  Target,
  Shield,
  Monitor,
  BookOpen
} from 'lucide-react';
import { clsx } from 'clsx';

const testingLevels = [
  {
    id: 'unit',
    title: 'Unit Testing',
    description: 'Test individual components and functions in isolation',
    icon: TestTube,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    coverage: '70%+',
    examples: [
      'Component rendering',
      'Function logic',
      'State management',
      'Props validation'
    ],
    tools: ['Jest', 'React Testing Library', 'Vitest', 'Mocha']
  },
  {
    id: 'integration',
    title: 'Integration Testing',
    description: 'Test how different parts of your application work together',
    icon: Layers,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    coverage: '50%+',
    examples: [
      'API endpoints',
      'Database operations',
      'Service interactions',
      'Component integration'
    ],
    tools: ['Supertest', 'Testing Library', 'MSW', 'Testcontainers']
  },
  {
    id: 'e2e',
    title: 'End-to-End Testing',
    description: 'Test complete user workflows from start to finish',
    icon: Globe,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    coverage: '20%+',
    examples: [
      'User journeys',
      'Critical paths',
      'Cross-browser testing',
      'Mobile workflows'
    ],
    tools: ['Playwright', 'Cypress', 'Selenium', 'Puppeteer']
  },
  {
    id: 'performance',
    title: 'Performance Testing',
    description: 'Ensure your application meets performance requirements',
    icon: Zap,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    coverage: 'Critical paths',
    examples: [
      'Load testing',
      'Stress testing',
      'Core Web Vitals',
      'API response times'
    ],
    tools: ['Lighthouse', 'K6', 'Artillery', 'WebPageTest']
  }
];

const testingPatterns = [
  {
    title: 'Test-Driven Development (TDD)',
    description: 'Write tests before implementation to drive design',
    icon: Target,
    benefits: [
      'Better design decisions',
      'Higher code quality',
      'Built-in documentation',
      'Reduced debugging time'
    ],
    process: [
      'Write a failing test',
      'Write minimal code to pass',
      'Refactor and improve',
      'Repeat the cycle'
    ]
  },
  {
    title: 'Behavior-Driven Development (BDD)',
    description: 'Focus on expected behavior from user perspective',
    icon: Users,
    benefits: [
      'Clear requirements',
      'Stakeholder collaboration',
      'Living documentation',
      'User-centric approach'
    ],
    process: [
      'Define user stories',
      'Write scenarios in plain language',
      'Implement step definitions',
      'Execute and validate'
    ]
  },
  {
    title: 'Test Pyramid',
    description: 'Balance different types of tests for optimal coverage',
    icon: Layers,
    benefits: [
      'Fast feedback loops',
      'Cost-effective testing',
      'Comprehensive coverage',
      'Maintainable test suite'
    ],
    process: [
      'Many unit tests (fast, cheap)',
      'Some integration tests',
      'Few E2E tests (slow, expensive)',
      'Continuous monitoring'
    ]
  },
  {
    title: 'Continuous Testing',
    description: 'Integrate testing throughout the development pipeline',
    icon: RefreshCw,
    benefits: [
      'Early bug detection',
      'Faster releases',
      'Quality assurance',
      'Risk mitigation'
    ],
    process: [
      'Automated test execution',
      'Continuous integration',
      'Feedback loops',
      'Quality gates'
    ]
  }
];

const advancedPatterns = [
  {
    title: 'Visual Testing',
    description: 'Catch UI regressions with pixel-perfect comparisons',
    icon: Monitor,
    techniques: [
      'Screenshot testing',
      'Visual regression detection',
      'Cross-browser comparison',
      'Responsive design validation'
    ],
    tools: ['Percy', 'Chromatic', 'BackstopJS', 'Playwright visual']
  },
  {
    title: 'Security Testing',
    description: 'Identify vulnerabilities and security flaws',
    icon: Shield,
    techniques: [
      'Input validation testing',
      'Authentication testing',
      'Authorization checks',
      'Dependency scanning'
    ],
    tools: ['OWASP ZAP', 'Snyk', 'SonarQube', 'npm audit']
  },
  {
    title: 'API Testing',
    description: 'Validate API contracts and behavior',
    icon: Database,
    techniques: [
      'Contract testing',
      'Schema validation',
      'Error handling',
      'Rate limiting'
    ],
    tools: ['Postman', 'Insomnia', 'Newman', 'Pact']
  },
  {
    title: 'Accessibility Testing',
    description: 'Ensure your app is usable by everyone',
    icon: Users,
    techniques: [
      'WCAG compliance testing',
      'Screen reader testing',
      'Keyboard navigation',
      'Color contrast validation'
    ],
    tools: ['axe-core', 'Pa11y', 'WAVE', 'Lighthouse']
  }
];

const codeExamples = [
  {
    title: 'Unit Test Example',
    language: 'typescript',
    description: 'Testing a React component with React Testing Library',
    code: `import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies correct CSS classes', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByText('Primary Button');
    expect(button).toHaveClass('btn-primary');
  });
});`
  },
  {
    title: 'Integration Test Example',
    language: 'typescript',
    description: 'Testing API integration with MSW (Mock Service Worker)',
    code: `import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { UserService } from '../services/UserService';

const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        id,
        name: 'John Doe',
        email: 'john@example.com'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserService', () => {
  test('fetches user data successfully', async () => {
    const user = await UserService.getUser('123');
    
    expect(user).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    });
  });
});`
  },
  {
    title: 'E2E Test Example',
    language: 'typescript',
    description: 'End-to-end test with Playwright',
    code: `import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('user can log in successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Check welcome message
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Invalid credentials');
  });
});`
  }
];

export default function TestingPatternsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Testing
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {' '}Patterns
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Discover proven testing patterns and methodologies used by successful development teams. 
              From unit tests to end-to-end testing, learn the best approaches for comprehensive test coverage.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="#testing-levels"
                className="rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors"
              >
                Explore Patterns
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-green-600 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                View Examples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testing Levels */}
      <section id="testing-levels" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-green-600 dark:text-green-400">
              Testing Pyramid
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Levels of Testing
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Understanding different types of tests and when to use them for optimal coverage and efficiency.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {testingLevels.map((level) => (
              <div
                key={level.id}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900/50"
              >
                <div className={clsx(
                  'inline-flex h-12 w-12 items-center justify-center rounded-lg',
                  level.bgColor
                )}>
                  <level.icon className={clsx('h-6 w-6', level.color)} />
                </div>
                
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {level.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {level.description}
                </p>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Coverage Target
                    </span>
                    <span className={clsx('text-sm font-semibold', level.color)}>
                      {level.coverage}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Examples:
                  </h4>
                  <ul className="space-y-1">
                    {level.examples.map((example, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {level.tools.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testing Methodologies */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Testing Methodologies
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Proven approaches to organize and structure your testing strategy.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {testingPatterns.map((pattern) => (
              <div
                key={pattern.title}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <pattern.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {pattern.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {pattern.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Benefits:
                    </h4>
                    <ul className="space-y-2">
                      {pattern.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Process:
                    </h4>
                    <ol className="space-y-2">
                      {pattern.process.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex-shrink-0">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Patterns */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Advanced Testing Patterns
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Specialized testing approaches for specific quality attributes and requirements.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {advancedPatterns.map((pattern) => (
              <div
                key={pattern.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900/50"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20 mb-4">
                  <pattern.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {pattern.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {pattern.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Techniques:
                  </h4>
                  <ul className="space-y-1">
                    {pattern.techniques.map((technique, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                        {technique}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {pattern.tools.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Code Examples
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              See testing patterns in action with practical code examples.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {codeExamples.map((example, index) => (
              <div
                key={example.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {example.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {example.description}
                  </p>
                </div>
                <div className="p-0">
                  <div className="rounded-b-2xl bg-gray-900 p-6 dark:bg-gray-950">
                    <pre className="text-sm text-gray-100 overflow-x-auto">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Ready to Implement?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Take your testing to the next level with our comprehensive resources.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/utilities"
                className="rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors"
              >
                Explore Utilities
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/best-practices"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-green-600 transition-colors"
              >
                Best Practices
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}