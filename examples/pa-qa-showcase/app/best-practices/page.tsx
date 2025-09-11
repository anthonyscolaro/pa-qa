import Link from 'next/link';
import { 
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code2,
  FileText,
  GitBranch,
  Lightbulb,
  RefreshCw,
  Shield,
  Target,
  TestTube,
  Users,
  XCircle,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const principles = [
  {
    id: 'fast',
    title: 'Fast',
    description: 'Tests should run quickly to provide rapid feedback',
    icon: Zap,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    practices: [
      'Use unit tests for the majority of your test suite',
      'Mock external dependencies and slow operations',
      'Run tests in parallel when possible',
      'Use test databases or in-memory storage for speed'
    ]
  },
  {
    id: 'independent',
    title: 'Independent',
    description: 'Each test should be able to run in isolation',
    icon: Target,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    practices: [
      'Clean up test data between tests',
      'Avoid shared state between test cases',
      'Use fresh instances of components/services',
      'Make tests deterministic and repeatable'
    ]
  },
  {
    id: 'repeatable',
    title: 'Repeatable',
    description: 'Tests should produce consistent results across environments',
    icon: RefreshCw,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    practices: [
      'Use fixed test data instead of random values',
      'Control time and dates in tests',
      'Isolate tests from external systems',
      'Use consistent test environments'
    ]
  },
  {
    id: 'self-validating',
    title: 'Self-Validating',
    description: 'Tests should clearly indicate pass or fail without manual inspection',
    icon: CheckCircle,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    practices: [
      'Use clear assertions with descriptive messages',
      'Avoid manual verification steps',
      'Include both positive and negative test cases',
      'Test edge cases and error conditions'
    ]
  },
  {
    id: 'timely',
    title: 'Timely',
    description: 'Write tests at the right time in the development process',
    icon: Clock,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    practices: [
      'Write tests before or alongside production code',
      'Update tests when requirements change',
      'Remove obsolete tests promptly',
      'Maintain test coverage as code evolves'
    ]
  }
];

const guidelines = [
  {
    category: 'Test Structure',
    icon: Code2,
    practices: [
      {
        title: 'Use the AAA Pattern',
        description: 'Arrange, Act, Assert - structure tests for clarity',
        example: 'Arrange test data → Act on the system → Assert expected outcome',
        type: 'good'
      },
      {
        title: 'One Assertion Per Test',
        description: 'Focus each test on a single behavior or outcome',
        example: 'Test user creation separately from user validation',
        type: 'good'
      },
      {
        title: 'Descriptive Test Names',
        description: 'Test names should describe the expected behavior',
        example: 'should_return_error_when_email_is_invalid()',
        type: 'good'
      },
      {
        title: 'Avoid Test Interdependence',
        description: 'Tests should not rely on other tests to run first',
        example: 'Each test sets up its own required data',
        type: 'avoid'
      }
    ]
  },
  {
    category: 'Test Data Management',
    icon: FileText,
    practices: [
      {
        title: 'Use Test Factories',
        description: 'Create reusable functions for generating test data',
        example: 'UserFactory.create({ role: "admin" })',
        type: 'good'
      },
      {
        title: 'Isolate Test Data',
        description: 'Each test should use its own data set',
        example: 'Create fresh data for each test case',
        type: 'good'
      },
      {
        title: 'Meaningful Test Data',
        description: 'Use realistic data that represents actual use cases',
        example: 'Use proper email formats, valid phone numbers',
        type: 'good'
      },
      {
        title: 'Hardcoded Magic Values',
        description: 'Avoid mysterious numbers and strings in tests',
        example: 'const VALID_USER_AGE = 25 instead of just 25',
        type: 'avoid'
      }
    ]
  },
  {
    category: 'Mocking Strategy',
    icon: Shield,
    practices: [
      {
        title: 'Mock External Dependencies',
        description: 'Replace external services with predictable mocks',
        example: 'Mock payment gateways, email services, APIs',
        type: 'good'
      },
      {
        title: 'Test Real Integration Points',
        description: 'Use integration tests for critical external interactions',
        example: 'Test actual database operations in integration tests',
        type: 'good'
      },
      {
        title: 'Verify Mock Interactions',
        description: 'Assert that mocks were called with expected parameters',
        example: 'expect(emailService.send).toHaveBeenCalledWith(email)',
        type: 'good'
      },
      {
        title: 'Over-Mocking',
        description: 'Don\'t mock everything - test real behavior when safe',
        example: 'Test pure functions without mocks',
        type: 'avoid'
      }
    ]
  },
  {
    category: 'Error Handling',
    icon: AlertTriangle,
    practices: [
      {
        title: 'Test Error Conditions',
        description: 'Verify your application handles errors gracefully',
        example: 'Test invalid input, network failures, timeouts',
        type: 'good'
      },
      {
        title: 'Test Edge Cases',
        description: 'Cover boundary conditions and unusual scenarios',
        example: 'Empty arrays, null values, maximum limits',
        type: 'good'
      },
      {
        title: 'Validate Error Messages',
        description: 'Ensure error messages are helpful and consistent',
        example: 'Assert specific error messages, not just error presence',
        type: 'good'
      },
      {
        title: 'Ignoring Error Paths',
        description: 'Don\'t only test the happy path scenarios',
        example: 'Test what happens when services are unavailable',
        type: 'avoid'
      }
    ]
  }
];

const antiPatterns = [
  {
    title: 'Fragile Tests',
    description: 'Tests that break with minor changes to implementation',
    problems: [
      'Testing implementation details instead of behavior',
      'Over-specific assertions about internal state',
      'Tight coupling between tests and code structure'
    ],
    solutions: [
      'Focus on testing public interfaces and observable behavior',
      'Use behavioral assertions rather than implementation-specific ones',
      'Mock at the service boundary, not internal methods'
    ]
  },
  {
    title: 'Slow Test Suites',
    description: 'Test suites that take too long to run, discouraging frequent execution',
    problems: [
      'Too many end-to-end tests in the test pyramid',
      'Real database operations in unit tests',
      'Unnecessary network calls or file system operations'
    ],
    solutions: [
      'Follow the test pyramid: many unit tests, some integration, few E2E',
      'Use in-memory databases or mocks for unit tests',
      'Parallel test execution and efficient test organization'
    ]
  },
  {
    title: 'Test Code Duplication',
    description: 'Repeated setup code and logic across multiple tests',
    problems: [
      'Copy-pasted test setup in every test',
      'Repeated assertions and helper logic',
      'Inconsistent test data creation'
    ],
    solutions: [
      'Create reusable setup functions and test utilities',
      'Use before/after hooks for common setup and teardown',
      'Implement test data factories and builders'
    ]
  },
  {
    title: 'Unclear Test Failures',
    description: 'Test failures that don\'t clearly indicate what went wrong',
    problems: [
      'Generic assertion messages that don\'t explain the failure',
      'Testing multiple behaviors in a single test',
      'Poor test naming that doesn\'t describe expected behavior'
    ],
    solutions: [
      'Use descriptive assertion messages',
      'Write focused tests that verify single behaviors',
      'Name tests to clearly describe the expected outcome'
    ]
  }
];

const coverageGuidelines = [
  {
    title: 'Statement Coverage',
    target: '80%+',
    description: 'Percentage of code statements executed during tests',
    priority: 'high'
  },
  {
    title: 'Branch Coverage',
    target: '70%+',
    description: 'Percentage of code branches (if/else, switch) tested',
    priority: 'high'
  },
  {
    title: 'Function Coverage',
    target: '90%+',
    description: 'Percentage of functions called during tests',
    priority: 'medium'
  },
  {
    title: 'Line Coverage',
    target: '85%+',
    description: 'Percentage of code lines executed during tests',
    priority: 'medium'
  }
];

export default function BestPracticesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Testing
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {' '}Best Practices
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Follow industry-proven practices to create maintainable, reliable, and effective test suites. 
              Learn from common mistakes and implement patterns that lead to successful testing strategies.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="#principles"
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                Learn Principles
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/testing-patterns"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors"
              >
                <TestTube className="h-4 w-4" />
                Testing Patterns
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FIRST Principles */}
      <section id="principles" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
              Core Principles
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              FIRST Principles of Testing
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Follow these fundamental principles to create effective and maintainable tests.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle, index) => (
              <div
                key={principle.id}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900/50"
              >
                <div className={clsx(
                  'inline-flex h-12 w-12 items-center justify-center rounded-lg',
                  principle.bgColor
                )}>
                  <principle.icon className={clsx('h-6 w-6', principle.color)} />
                </div>
                
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {principle.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {principle.description}
                </p>
                
                <ul className="mt-4 space-y-2">
                  {principle.practices.map((practice, practiceIndex) => (
                    <li key={practiceIndex} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {practice}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Practical Guidelines
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Actionable guidelines organized by testing concern area.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {guidelines.map((guideline) => (
              <div
                key={guideline.category}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <guideline.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {guideline.category}
                    </h3>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {guideline.practices.map((practice, index) => (
                      <div
                        key={index}
                        className={clsx(
                          'rounded-lg border p-4',
                          practice.type === 'good'
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {practice.type === 'good' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h4 className={clsx(
                              'text-sm font-semibold',
                              practice.type === 'good'
                                ? 'text-green-900 dark:text-green-100'
                                : 'text-red-900 dark:text-red-100'
                            )}>
                              {practice.type === 'avoid' ? '❌ ' : '✅ '}{practice.title}
                            </h4>
                            <p className={clsx(
                              'mt-1 text-sm',
                              practice.type === 'good'
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            )}>
                              {practice.description}
                            </p>
                            <p className={clsx(
                              'mt-2 text-xs font-mono',
                              practice.type === 'good'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            )}>
                              {practice.example}
                            </p>
                          </div>
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

      {/* Anti-Patterns */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Common Anti-Patterns
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Learn from common mistakes and understand how to avoid or fix these testing anti-patterns.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {antiPatterns.map((antiPattern) => (
              <div
                key={antiPattern.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {antiPattern.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {antiPattern.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                      Problems:
                    </h4>
                    <ul className="space-y-1">
                      {antiPattern.problems.map((problem, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          {problem}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      Solutions:
                    </h4>
                    <ul className="space-y-1">
                      {antiPattern.solutions.map((solution, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Guidelines */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Code Coverage Guidelines
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Understand different types of coverage and target thresholds for quality assurance.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {coverageGuidelines.map((guideline) => (
              <div
                key={guideline.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {guideline.title}
                  </h3>
                  <span className={clsx(
                    'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                    guideline.priority === 'high'
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                  )}>
                    {guideline.priority}
                  </span>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {guideline.target}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Target Coverage
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {guideline.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                    Remember: Coverage is a Guide, Not a Goal
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    High coverage doesn't guarantee quality tests. Focus on testing critical business logic, 
                    edge cases, and user workflows. Use coverage metrics to identify untested code, but 
                    prioritize meaningful tests over reaching arbitrary percentage targets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Put It Into Practice
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Apply these best practices using our tools and templates.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/utilities"
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                Explore Utilities
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/ci-cd"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors"
              >
                <GitBranch className="h-4 w-4" />
                CI/CD Setup
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}