import Link from 'next/link';
import { 
  ArrowRight,
  Box,
  Code2,
  Copy,
  Database,
  Download,
  FileText,
  Filter,
  Hammer,
  Package,
  Play,
  Settings,
  Shield,
  TestTube,
  Users,
  Wrench,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const utilityCategories = [
  {
    id: 'test-helpers',
    title: 'Test Helpers',
    description: 'Utility functions to simplify test writing and reduce boilerplate',
    icon: TestTube,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    utilities: [
      {
        name: 'createMockUser',
        description: 'Generate mock user objects with customizable properties',
        example: 'createMockUser({ role: "admin", email: "test@example.com" })'
      },
      {
        name: 'waitForLoadingToFinish',
        description: 'Wait for loading states to complete in async components',
        example: 'await waitForLoadingToFinish(container)'
      },
      {
        name: 'mockApiResponse',
        description: 'Create consistent mock API responses with proper typing',
        example: 'mockApiResponse<User[]>({ data: users, status: 200 })'
      },
      {
        name: 'createTestWrapper',
        description: 'HOC for wrapping components with providers and context',
        example: 'const Wrapper = createTestWrapper({ theme: "dark" })'
      }
    ]
  },
  {
    id: 'data-fixtures',
    title: 'Data Fixtures',
    description: 'Pre-defined test data and factory functions for consistent testing',
    icon: Database,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    utilities: [
      {
        name: 'UserFactory',
        description: 'Factory for creating user test data with various roles and permissions',
        example: 'UserFactory.create({ role: "admin" })'
      },
      {
        name: 'ProductFactory',
        description: 'Generate product data with categories, pricing, and inventory',
        example: 'ProductFactory.createList(5, { category: "electronics" })'
      },
      {
        name: 'OrderFactory',
        description: 'Create order objects with line items and payment information',
        example: 'OrderFactory.create({ status: "pending", items: 3 })'
      },
      {
        name: 'seedDatabase',
        description: 'Populate test database with consistent data sets',
        example: 'await seedDatabase({ users: 10, products: 50 })'
      }
    ]
  },
  {
    id: 'mock-services',
    title: 'Mock Services',
    description: 'Service mocks and stubs for external dependencies',
    icon: Settings,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    utilities: [
      {
        name: 'MockPaymentService',
        description: 'Simulate payment processing with various success/failure scenarios',
        example: 'MockPaymentService.simulateSuccess()'
      },
      {
        name: 'MockEmailService',
        description: 'Track email sending without actual delivery',
        example: 'MockEmailService.getLastEmail()'
      },
      {
        name: 'MockStorageService',
        description: 'In-memory file storage for testing uploads and downloads',
        example: 'MockStorageService.uploadFile(fileData)'
      },
      {
        name: 'MockNotificationService',
        description: 'Capture push notifications and SMS messages',
        example: 'MockNotificationService.getNotifications(userId)'
      }
    ]
  },
  {
    id: 'assertion-helpers',
    title: 'Assertion Helpers',
    description: 'Custom matchers and assertion utilities for better test readability',
    icon: Shield,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    utilities: [
      {
        name: 'toBeAccessible',
        description: 'Custom matcher for accessibility testing with axe-core',
        example: 'expect(component).toBeAccessible()'
      },
      {
        name: 'toHaveValidSchema',
        description: 'Validate API responses against JSON schemas',
        example: 'expect(response).toHaveValidSchema(userSchema)'
      },
      {
        name: 'toBeWithinTimeRange',
        description: 'Assert that operations complete within expected time',
        example: 'expect(asyncOperation).toBeWithinTimeRange(1000)'
      },
      {
        name: 'toMatchSnapshot',
        description: 'Enhanced snapshot testing with normalization',
        example: 'expect(component).toMatchSnapshot({ normalizeProps: true })'
      }
    ]
  }
];

const testingTools = [
  {
    category: 'Component Testing',
    icon: Box,
    tools: [
      {
        name: 'React Testing Library',
        description: 'Simple and complete testing utilities for React components',
        usage: 'Unit and integration testing of React components',
        link: 'https://testing-library.com/docs/react-testing-library/intro'
      },
      {
        name: 'Enzyme (Legacy)',
        description: 'JavaScript testing utility for React components',
        usage: 'Legacy component testing (consider migrating to RTL)',
        link: 'https://enzymejs.github.io/enzyme/'
      },
      {
        name: 'Vue Test Utils',
        description: 'Official testing utilities for Vue.js',
        usage: 'Unit testing Vue components and composables',
        link: 'https://vue-test-utils.vuejs.org/'
      }
    ]
  },
  {
    category: 'Mocking & Fixtures',
    icon: Package,
    tools: [
      {
        name: 'Mock Service Worker',
        description: 'API mocking library for browser and Node.js',
        usage: 'Mock REST and GraphQL APIs in tests',
        link: 'https://mswjs.io/'
      },
      {
        name: 'Faker.js',
        description: 'Generate massive amounts of fake data',
        usage: 'Create realistic test data and fixtures',
        link: 'https://fakerjs.dev/'
      },
      {
        name: 'Factory Bot',
        description: 'Test data builder pattern implementation',
        usage: 'Create complex object hierarchies for testing',
        link: 'https://github.com/aexmachina/factory-bot'
      }
    ]
  },
  {
    category: 'Performance Testing',
    icon: Zap,
    tools: [
      {
        name: 'Lighthouse CI',
        description: 'Automated performance testing in CI/CD',
        usage: 'Monitor Core Web Vitals and performance metrics',
        link: 'https://github.com/GoogleChrome/lighthouse-ci'
      },
      {
        name: 'K6',
        description: 'Modern load testing tool for developers',
        usage: 'Load testing APIs and web applications',
        link: 'https://k6.io/'
      },
      {
        name: 'Artillery',
        description: 'Modern performance testing toolkit',
        usage: 'Load testing with complex scenarios',
        link: 'https://artillery.io/'
      }
    ]
  },
  {
    category: 'Accessibility Testing',
    icon: Users,
    tools: [
      {
        name: 'axe-core',
        description: 'Accessibility testing engine',
        usage: 'Automated accessibility testing in unit tests',
        link: 'https://github.com/dequelabs/axe-core'
      },
      {
        name: 'Pa11y',
        description: 'Command-line accessibility testing',
        usage: 'CI/CD accessibility testing and reporting',
        link: 'https://pa11y.org/'
      },
      {
        name: 'Lighthouse Accessibility',
        description: 'Accessibility auditing as part of Lighthouse',
        usage: 'Comprehensive accessibility scoring',
        link: 'https://developers.google.com/web/tools/lighthouse'
      }
    ]
  }
];

const codeExamples = [
  {
    title: 'Test Helper Function',
    description: 'Reusable function for rendering components with providers',
    code: `// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from '../components/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface CustomRenderOptions extends RenderOptions {
  theme?: 'light' | 'dark';
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    theme = 'light',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}`
  },
  {
    title: 'Data Factory',
    description: 'Factory pattern for creating test data objects',
    code: `// factories/UserFactory.ts
import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: Date;
  isActive: boolean;
}

export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'user',
      createdAt: faker.date.recent(),
      isActive: true,
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createAdmin(overrides: Partial<User> = {}): User {
    return this.create({ role: 'admin', ...overrides });
  }
}`
  },
  {
    title: 'Custom Jest Matcher',
    description: 'Custom assertion for accessibility testing',
    code: `// matchers/accessibility.ts
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

export async function toBeAccessible(received: HTMLElement) {
  const results = await axe(received);
  
  const pass = results.violations.length === 0;
  
  if (pass) {
    return {
      message: () => 'Expected element to have accessibility violations',
      pass: true,
    };
  } else {
    const violationMessages = results.violations
      .map(violation => \`\${violation.id}: \${violation.description}\`)
      .join('\\n');
      
    return {
      message: () => \`Expected element to be accessible but found violations:\\n\${violationMessages}\`,
      pass: false,
    };
  }
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): Promise<R>;
    }
  }
}`
  }
];

export default function UtilitiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Testing
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {' '}Utilities
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Discover powerful utilities, helpers, and tools that make testing easier, faster, and more reliable. 
              From test data factories to custom assertions, streamline your testing workflow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="#utilities"
                className="rounded-md bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
              >
                Explore Utilities
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-purple-600 transition-colors"
              >
                <Code2 className="h-4 w-4" />
                View Code Examples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Utility Categories */}
      <section id="utilities" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-purple-600 dark:text-purple-400">
              Utility Library
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Testing Utilities
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Pre-built utilities organized by category to accelerate your testing workflow.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {utilityCategories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      'inline-flex h-12 w-12 items-center justify-center rounded-lg',
                      category.bgColor
                    )}>
                      <category.icon className={clsx('h-6 w-6', category.color)} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {category.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {category.utilities.map((utility) => (
                      <div
                        key={utility.name}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {utility.name}
                          </h4>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {utility.description}
                        </p>
                        <div className="rounded bg-gray-900 p-2 dark:bg-gray-950">
                          <code className="text-xs text-gray-100">
                            {utility.example}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testing Tools */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Recommended Tools
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Essential tools and libraries that complement the PA-QA testing framework.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {testingTools.map((category) => (
              <div
                key={category.category}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <category.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.category}
                  </h3>
                </div>

                <div className="space-y-4">
                  {category.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {tool.name}
                        </h4>
                        <a
                          href={tool.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Wrench className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {tool.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <strong>Use case:</strong> {tool.usage}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Implementation Examples
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              See how to implement these utilities in your own testing suite.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {codeExamples.map((example) => (
              <div
                key={example.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Code2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {example.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
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

      {/* Quick Actions */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Get Started Today
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Download utilities or explore more resources to enhance your testing workflow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/templates"
                className="rounded-md bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
              >
                <Download className="mr-2 inline h-4 w-4" />
                Download Templates
              </Link>
              <Link
                href="/best-practices"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-purple-600 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Best Practices
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}