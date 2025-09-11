import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle,
  Code2, 
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Package,
  Play,
  Settings,
  Terminal,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const steps = [
  {
    id: 'install',
    title: 'Installation',
    description: 'Set up your development environment',
    icon: Package,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    content: [
      'Node.js 18.17 or later',
      'npm, yarn, or pnpm package manager',
      'Git for version control',
      'VS Code (recommended) with TypeScript extension'
    ]
  },
  {
    id: 'clone',
    title: 'Clone Repository',
    description: 'Get the PA-QA framework code',
    icon: GitBranch,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    content: [
      'Clone the repository to your local machine',
      'Navigate to your preferred project directory',
      'Initialize git submodules if needed',
      'Verify the project structure'
    ]
  },
  {
    id: 'setup',
    title: 'Project Setup',
    description: 'Configure your testing environment',
    icon: Settings,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    content: [
      'Install dependencies with your package manager',
      'Configure environment variables',
      'Set up database connections if needed',
      'Configure testing tools and frameworks'
    ]
  },
  {
    id: 'run',
    title: 'Run Tests',
    description: 'Start your testing journey',
    icon: Play,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    content: [
      'Run unit tests to verify setup',
      'Execute integration tests',
      'Launch E2E test suite',
      'Generate coverage reports'
    ]
  }
];

const quickCommands = [
  {
    title: 'Project Setup',
    description: 'Initial project setup and dependencies',
    commands: [
      '# Clone the repository',
      'git clone https://github.com/pa-qa/testing-showcase.git',
      '',
      '# Navigate to project directory',
      'cd testing-showcase',
      '',
      '# Install dependencies',
      'npm install',
      '',
      '# Copy environment variables',
      'cp .env.example .env.local'
    ]
  },
  {
    title: 'Development Commands',
    description: 'Common commands for development workflow',
    commands: [
      '# Start development server',
      'npm run dev',
      '',
      '# Run all tests',
      'npm test',
      '',
      '# Run tests in watch mode',
      'npm run test:watch',
      '',
      '# Generate coverage report',
      'npm run test:coverage'
    ]
  },
  {
    title: 'Testing Commands',
    description: 'Specific testing workflows',
    commands: [
      '# Run unit tests only',
      'npm run test:unit',
      '',
      '# Run integration tests',
      'npm run test:integration',
      '',
      '# Run E2E tests',
      'npm run test:e2e',
      '',
      '# Run performance tests',
      'npm run test:performance'
    ]
  }
];

const projectTypes = [
  {
    name: 'Next.js Web App',
    description: 'Modern React applications with App Router',
    icon: Code2,
    features: ['App Router', 'Server Components', 'TypeScript', 'Tailwind CSS'],
    link: '/templates?type=nextjs'
  },
  {
    name: 'WordPress Plugin',
    description: 'Custom WordPress plugins with PHP testing',
    icon: FileText,
    features: ['PHPUnit', 'WP-CLI', 'Gutenberg', 'REST API'],
    link: '/templates?type=wordpress'
  },
  {
    name: 'FastAPI Service',
    description: 'Python API services with async testing',
    icon: Zap,
    features: ['Async Testing', 'SQLAlchemy', 'Pydantic', 'OpenAPI'],
    link: '/templates?type=fastapi'
  }
];

const resources = [
  {
    name: 'Testing Patterns',
    description: 'Learn common testing patterns and approaches',
    icon: CheckCircle,
    href: '/testing-patterns'
  },
  {
    name: 'Utilities & Helpers',
    description: 'Discover testing utilities and helper functions',
    icon: Settings,
    href: '/utilities'
  },
  {
    name: 'Best Practices',
    description: 'Follow industry best practices for testing',
    icon: FileText,
    href: '/best-practices'
  },
  {
    name: 'CI/CD Setup',
    description: 'Configure continuous integration and deployment',
    icon: GitBranch,
    href: '/ci-cd'
  }
];

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Getting Started with
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {' '}PA-QA
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Set up comprehensive testing for your web projects in minutes. Follow our step-by-step guide 
              to implement industry-standard testing practices with our multi-agent framework.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="#installation"
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              >
                Start Installation
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                View Examples
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section id="installation" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
              Step by Step
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Setup Process
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Follow these steps to set up the PA-QA testing framework for your project.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="relative group"
                >
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
                  )}
                  
                  <div className="relative z-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50">
                    <div className={clsx(
                      'inline-flex h-12 w-12 items-center justify-center rounded-lg',
                      step.bgColor
                    )}>
                      <step.icon className={clsx('h-6 w-6', step.color)} />
                    </div>
                    
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {step.description}
                    </p>
                    
                    <ul className="mt-4 space-y-2">
                      {step.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Commands */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Quick Reference
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Copy and paste these commands to get started quickly.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {quickCommands.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {section.description}
                </p>
                <div className="rounded-lg bg-gray-900 p-4 dark:bg-gray-950">
                  <pre className="text-sm text-gray-100 overflow-x-auto">
                    <code>{section.commands.join('\n')}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Types */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Choose Your Project Type
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Select the template that matches your project to get started with pre-configured testing setups.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projectTypes.map((type) => (
              <Link
                key={type.name}
                href={type.link}
                className="group relative rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700"
              >
                <type.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {type.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {type.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {type.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                <ArrowRight className="mt-4 h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              What's Next?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Explore these resources to deepen your understanding of the PA-QA testing framework.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <Link
                key={resource.name}
                href={resource.href}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700"
              >
                <resource.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {resource.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {resource.description}
                </p>
                <ArrowRight className="mt-4 h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}