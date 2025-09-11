import Link from 'next/link';
import { 
  ArrowRight,
  CheckCircle,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  Play,
  Settings,
  TestTube,
  Users,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const exampleCategories = [
  {
    id: 'unit-testing',
    title: 'Unit Testing',
    description: 'Component and function testing examples with various frameworks',
    icon: TestTube,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    examples: [
      {
        title: 'React Component Testing',
        description: 'Testing React components with React Testing Library',
        framework: 'Jest + RTL',
        complexity: 'Beginner',
        liveDemo: '/showcase/react-component-test',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/react-component'
      },
      {
        title: 'Vue Component Testing',
        description: 'Vue 3 component testing with Vue Test Utils',
        framework: 'Vitest + VTU',
        complexity: 'Beginner',
        liveDemo: '/showcase/vue-component-test',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/vue-component'
      },
      {
        title: 'Pure Function Testing',
        description: 'Testing utility functions and business logic',
        framework: 'Jest/Vitest',
        complexity: 'Beginner',
        liveDemo: '/showcase/function-test',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/pure-functions'
      },
      {
        title: 'Custom Hook Testing',
        description: 'Testing React custom hooks with act and renderHook',
        framework: 'Jest + RTL',
        complexity: 'Intermediate',
        liveDemo: '/showcase/hook-test',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/custom-hooks'
      }
    ]
  },
  {
    id: 'integration-testing',
    title: 'Integration Testing',
    description: 'Testing component interactions and API integrations',
    icon: Settings,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    examples: [
      {
        title: 'API Integration Testing',
        description: 'Testing API calls with MSW (Mock Service Worker)',
        framework: 'MSW + Jest',
        complexity: 'Intermediate',
        liveDemo: '/showcase/api-integration',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/api-integration'
      },
      {
        title: 'Database Testing',
        description: 'Testing database operations with test containers',
        framework: 'TestContainers',
        complexity: 'Advanced',
        liveDemo: '/showcase/database-test',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/database-testing'
      },
      {
        title: 'Form Submission Testing',
        description: 'End-to-end form testing with validation',
        framework: 'RTL + MSW',
        complexity: 'Intermediate',
        liveDemo: '/showcase/form-test',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/form-testing'
      },
      {
        title: 'Authentication Flow',
        description: 'Testing login, logout, and protected routes',
        framework: 'Playwright',
        complexity: 'Advanced',
        liveDemo: '/showcase/auth-flow',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/auth-testing'
      }
    ]
  },
  {
    id: 'e2e-testing',
    title: 'End-to-End Testing',
    description: 'Full user journey testing with browser automation',
    icon: Globe,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    examples: [
      {
        title: 'E-commerce Checkout',
        description: 'Complete purchase flow from product selection to payment',
        framework: 'Playwright',
        complexity: 'Advanced',
        liveDemo: '/showcase/ecommerce-checkout',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/ecommerce-e2e'
      },
      {
        title: 'User Registration',
        description: 'Multi-step user registration with email verification',
        framework: 'Cypress',
        complexity: 'Intermediate',
        liveDemo: '/showcase/user-registration',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/registration-e2e'
      },
      {
        title: 'Cross-browser Testing',
        description: 'Testing across different browsers and devices',
        framework: 'Playwright',
        complexity: 'Advanced',
        liveDemo: '/showcase/cross-browser',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/cross-browser'
      },
      {
        title: 'Mobile App Testing',
        description: 'React Native app testing with Detox',
        framework: 'Detox',
        complexity: 'Advanced',
        liveDemo: '/showcase/mobile-app',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/mobile-testing'
      }
    ]
  },
  {
    id: 'performance-testing',
    title: 'Performance Testing',
    description: 'Load testing, stress testing, and performance monitoring',
    icon: Zap,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    examples: [
      {
        title: 'Load Testing with K6',
        description: 'API load testing with realistic user scenarios',
        framework: 'K6',
        complexity: 'Intermediate',
        liveDemo: '/showcase/load-testing',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/k6-load-testing'
      },
      {
        title: 'Lighthouse CI Integration',
        description: 'Automated performance testing in CI/CD',
        framework: 'Lighthouse CI',
        complexity: 'Intermediate',
        liveDemo: '/showcase/lighthouse-ci',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/lighthouse-ci'
      },
      {
        title: 'Core Web Vitals',
        description: 'Monitoring and testing Core Web Vitals metrics',
        framework: 'Web Vitals',
        complexity: 'Beginner',
        liveDemo: '/showcase/web-vitals',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/web-vitals'
      },
      {
        title: 'Memory Leak Detection',
        description: 'Detecting and preventing memory leaks in web apps',
        framework: 'Playwright + DevTools',
        complexity: 'Advanced',
        liveDemo: '/showcase/memory-leaks',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/memory-testing'
      }
    ]
  },
  {
    id: 'accessibility-testing',
    title: 'Accessibility Testing',
    description: 'Ensuring web applications are accessible to all users',
    icon: Users,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    examples: [
      {
        title: 'axe-core Integration',
        description: 'Automated accessibility testing with axe-core',
        framework: 'Jest + axe',
        complexity: 'Beginner',
        liveDemo: '/showcase/axe-testing',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/axe-accessibility'
      },
      {
        title: 'Keyboard Navigation',
        description: 'Testing keyboard navigation and focus management',
        framework: 'Playwright',
        complexity: 'Intermediate',
        liveDemo: '/showcase/keyboard-nav',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/keyboard-testing'
      },
      {
        title: 'Screen Reader Testing',
        description: 'Testing with assistive technologies',
        framework: 'NVDA + Playwright',
        complexity: 'Advanced',
        liveDemo: '/showcase/screen-reader',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/screen-reader'
      },
      {
        title: 'Color Contrast Testing',
        description: 'Automated color contrast validation',
        framework: 'Pa11y',
        complexity: 'Beginner',
        liveDemo: '/showcase/color-contrast',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/color-contrast'
      }
    ]
  },
  {
    id: 'visual-testing',
    title: 'Visual Testing',
    description: 'Screenshot comparison and visual regression testing',
    icon: Code2,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    examples: [
      {
        title: 'Visual Regression Testing',
        description: 'Catch visual changes with screenshot comparison',
        framework: 'Playwright Visual',
        complexity: 'Intermediate',
        liveDemo: '/showcase/visual-regression',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/visual-testing'
      },
      {
        title: 'Storybook Visual Testing',
        description: 'Component visual testing with Storybook',
        framework: 'Storybook + Chromatic',
        complexity: 'Intermediate',
        liveDemo: '/showcase/storybook-visual',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/storybook-visual'
      },
      {
        title: 'Cross-device Screenshots',
        description: 'Visual testing across different screen sizes',
        framework: 'BackstopJS',
        complexity: 'Intermediate',
        liveDemo: '/showcase/cross-device',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/cross-device'
      },
      {
        title: 'PDF Generation Testing',
        description: 'Testing dynamically generated PDF documents',
        framework: 'Puppeteer',
        complexity: 'Advanced',
        liveDemo: '/showcase/pdf-testing',
        codeUrl: 'https://github.com/pa-qa/examples/tree/main/pdf-testing'
      }
    ]
  }
];

const liveExamples = [
  {
    title: 'React Testing Playground',
    description: 'Interactive examples of React component testing patterns',
    image: '/examples/react-playground.png',
    demoUrl: '/showcase/react-playground',
    features: ['Component Testing', 'Custom Hooks', 'Context Testing', 'Async Operations'],
    difficulty: 'Beginner to Intermediate'
  },
  {
    title: 'API Testing Dashboard',
    description: 'Real-time API testing with various scenarios and edge cases',
    image: '/examples/api-dashboard.png',
    demoUrl: '/showcase/api-dashboard',
    features: ['REST API Testing', 'GraphQL Testing', 'Error Handling', 'Mock Servers'],
    difficulty: 'Intermediate'
  },
  {
    title: 'E2E Testing Suite',
    description: 'Complete e-commerce application with full test coverage',
    image: '/examples/e2e-suite.png',
    demoUrl: '/showcase/e2e-suite',
    features: ['User Journeys', 'Payment Flow', 'Multi-browser', 'Mobile Testing'],
    difficulty: 'Advanced'
  }
];

const codeSnippets = [
  {
    title: 'React Component Test',
    description: 'Testing a button component with user interactions',
    language: 'typescript',
    code: `import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  test('renders with correct text and handles click', async () => {
    const handleClick = jest.fn();
    
    render(
      <Button onClick={handleClick} variant="primary">
        Click me
      </Button>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-primary');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state when disabled', () => {
    render(<Button loading disabled>Submit</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});`
  },
  {
    title: 'API Integration Test',
    description: 'Testing API calls with Mock Service Worker',
    language: 'typescript',
    code: `import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { UserService } from './UserService';

const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'error') {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    }
    
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
  test('fetches user successfully', async () => {
    const user = await UserService.getUser('123');
    
    expect(user).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    });
  });

  test('handles server errors gracefully', async () => {
    await expect(UserService.getUser('error'))
      .rejects
      .toThrow('Failed to fetch user');
  });
});`
  },
  {
    title: 'E2E Test with Playwright',
    description: 'Complete user journey testing',
    language: 'typescript',
    code: `import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Flow', () => {
  test('user can add items and complete purchase', async ({ page }) => {
    // Navigate to product page
    await page.goto('/products/laptop');
    
    // Add product to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('.cart-notification')).toContainText('Added to cart');
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL(/.*cart/);
    
    // Verify product in cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    await expect(page.locator('.cart-total')).toContainText('$999.99');
    
    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    // Fill shipping information
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="address"]', '123 Main St');
    
    // Submit order
    await page.click('[data-testid="place-order"]');
    
    // Verify success
    await expect(page.locator('.order-confirmation')).toBeVisible();
    await expect(page).toHaveURL(/.*order-confirmation/);
  });
});`
  }
];

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Live
              <span className="bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Examples
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Explore interactive examples and code samples demonstrating real-world testing scenarios. 
              From unit tests to end-to-end workflows, see PA-QA patterns in action.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="#live-examples"
                className="rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors"
              >
                Try Live Examples
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="#code-samples"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-green-600 transition-colors"
              >
                <Code2 className="h-4 w-4" />
                Browse Code
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Examples */}
      <section id="live-examples" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-green-600 dark:text-green-400">
              Interactive Demos
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Live Examples
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Experience our testing framework with fully interactive examples and demonstrations.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {liveExamples.map((example) => (
              <div
                key={example.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900/50"
              >
                <div className="aspect-video rounded-t-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Interactive Demo
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {example.title}
                    </h3>
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      {example.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {example.description}
                  </p>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Features:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {example.features.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <Link
                    href={example.demoUrl}
                    className="inline-flex items-center gap-2 w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    Launch Demo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Categories */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Example Categories
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Browse examples organized by testing type and complexity level.
            </p>
          </div>

          <div className="mt-16 space-y-16">
            {exampleCategories.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-4 mb-8">
                  <div className={clsx(
                    'inline-flex h-12 w-12 items-center justify-center rounded-lg',
                    category.bgColor
                  )}>
                    <category.icon className={clsx('h-6 w-6', category.color)} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {category.examples.map((example) => (
                    <div
                      key={example.title}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {example.title}
                        </h4>
                        <span className={clsx(
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                          example.complexity === 'Beginner'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : example.complexity === 'Intermediate'
                            ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        )}>
                          {example.complexity}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {example.description}
                      </p>

                      <div className="mb-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                          {example.framework}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={example.liveDemo}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          Demo
                        </Link>
                        <a
                          href={example.codeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                        >
                          <GitBranch className="h-3 w-3" />
                          Code
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Samples */}
      <section id="code-samples" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Code Samples
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Copy and adapt these code examples for your own testing scenarios.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {codeSnippets.map((snippet) => (
              <div
                key={snippet.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Code2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {snippet.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {snippet.description}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                </div>
                <div className="p-0">
                  <div className="rounded-b-2xl bg-gray-900 p-6 dark:bg-gray-950">
                    <pre className="text-sm text-gray-100 overflow-x-auto">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Examples */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Community Contributions
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Examples and patterns contributed by the PA-QA community.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Users className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Community Hub
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Join our community to share examples and learn from other developers.
              </p>
              <Link
                href="https://github.com/pa-qa/community-examples"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ExternalLink className="h-4 w-4" />
                View Community Examples
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <GitBranch className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Contribute Examples
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Share your testing patterns and help grow the community knowledge base.
              </p>
              <Link
                href="https://github.com/pa-qa/examples/contributing"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                <ExternalLink className="h-4 w-4" />
                Contribution Guide
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <FileText className="mx-auto h-12 w-12 text-purple-600 dark:text-purple-400" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Request Examples
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Need help with a specific testing scenario? Request examples from the community.
              </p>
              <Link
                href="https://github.com/pa-qa/examples/issues/new"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                <ExternalLink className="h-4 w-4" />
                Request Example
              </Link>
            </div>
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
              Use these examples as a foundation for your own testing implementation.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/templates"
                className="rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors"
              >
                Download Templates
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/getting-started"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-green-600 transition-colors"
              >
                <Play className="h-4 w-4" />
                Getting Started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}