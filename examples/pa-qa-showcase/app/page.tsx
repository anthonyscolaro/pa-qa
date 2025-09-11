import Link from 'next/link';
import { 
  ArrowRight, 
  Code2, 
  TestTube, 
  Zap, 
  Shield, 
  Layers,
  Github,
  BookOpen,
  Rocket,
  CheckCircle
} from 'lucide-react';
import { clsx } from 'clsx';

const features = [
  {
    name: 'Next.js 15 App Router',
    description: 'Built with the latest Next.js 15.5 features including App Router, Server Components, and React 19.',
    icon: Rocket,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    name: 'TypeScript Strict Mode',
    description: 'Fully typed with TypeScript strict mode for maximum type safety and developer experience.',
    icon: Code2,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
  },
  {
    name: 'Comprehensive Testing',
    description: 'Complete testing setup with Jest, Testing Library, Playwright, and more.',
    icon: TestTube,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    name: 'Performance Optimized',
    description: 'Optimized for Core Web Vitals with bundle splitting, image optimization, and caching.',
    icon: Zap,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  {
    name: 'Security First',
    description: 'Built with security best practices including CSP, HTTPS, and input validation.',
    icon: Shield,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
  {
    name: 'Modern Stack',
    description: 'Tailwind CSS, MDX, ESLint, Prettier, and modern development tooling.',
    icon: Layers,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
  },
];

const quickStart = [
  'Clone the repository and install dependencies',
  'Configure your environment variables',
  'Run the development server',
  'Start building your application',
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              PA-QA Testing
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {' '}Showcase
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              A comprehensive testing framework showcase built with Next.js 15 and React 19, featuring modern testing patterns, 
              MDX documentation, and best practices for web development agencies.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/getting-started"
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <a
                href="https://github.com/pa-qa/testing-showcase"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Github className="h-4 w-4" />
                View on GitHub
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* Feature grid */}
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="group relative rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg dark:border-secondary-800 dark:bg-secondary-900/50 dark:hover:bg-secondary-900/80"
                >
                  <div className={clsx(
                    'inline-flex h-12 w-12 items-center justify-center rounded-lg',
                    feature.bgColor
                  )}>
                    <feature.icon className={clsx('h-6 w-6', feature.color)} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-secondary-900 dark:text-white">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600 dark:text-primary-400">
              Quick Start
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
              Get up and running in minutes
            </p>
            <p className="mt-6 text-lg leading-8 text-secondary-600 dark:text-secondary-300">
              Follow these simple steps to start using the PA-QA Testing Showcase in your next project.
            </p>
          </div>
          
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Steps */}
              <div className="space-y-6">
                {quickStart.map((step, index) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-secondary-900 dark:text-secondary-100">{step}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Code snippet */}
              <div className="rounded-lg bg-secondary-900 p-6 dark:bg-secondary-950">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-secondary-300">Terminal</span>
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <pre className="text-sm text-secondary-100">
                  <code>{`# Clone the repository
git clone https://github.com/pa-qa/testing-showcase.git

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3005`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section className="bg-secondary-50 py-24 dark:bg-secondary-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-4xl">
              Comprehensive Documentation
            </h2>
            <p className="mt-6 text-lg leading-8 text-secondary-600 dark:text-secondary-300">
              Everything you need to know to build robust, tested applications.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/docs"
              className="group relative rounded-2xl border border-secondary-200 bg-white p-8 transition-all hover:shadow-lg dark:border-secondary-800 dark:bg-secondary-900"
            >
              <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <h3 className="mt-4 text-lg font-semibold text-secondary-900 dark:text-white">
                Getting Started
              </h3>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">
                Learn the basics and set up your first project with our comprehensive guides.
              </p>
              <ArrowRight className="mt-4 h-4 w-4 text-secondary-400 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/examples"
              className="group relative rounded-2xl border border-secondary-200 bg-white p-8 transition-all hover:shadow-lg dark:border-secondary-800 dark:bg-secondary-900"
            >
              <Code2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <h3 className="mt-4 text-lg font-semibold text-secondary-900 dark:text-white">
                Examples
              </h3>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">
                Explore real-world examples and code samples for different testing scenarios.
              </p>
              <ArrowRight className="mt-4 h-4 w-4 text-secondary-400 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/best-practices"
              className="group relative rounded-2xl border border-secondary-200 bg-white p-8 transition-all hover:shadow-lg dark:border-secondary-800 dark:bg-secondary-900"
            >
              <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-4 text-lg font-semibold text-secondary-900 dark:text-white">
                Best Practices
              </h3>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">
                Industry best practices and patterns for building maintainable test suites.
              </p>
              <ArrowRight className="mt-4 h-4 w-4 text-secondary-400 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-950">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                <span className="text-sm font-bold text-white">PA</span>
              </div>
              <span className="text-lg font-bold text-secondary-900 dark:text-white">
                QA Showcase
              </span>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Built with ❤️ by the PA-QA Team
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}