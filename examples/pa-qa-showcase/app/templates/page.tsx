import Link from 'next/link';
import { 
  ArrowRight,
  CheckCircle,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Folder,
  GitBranch,
  Globe,
  Package,
  Play,
  Star,
  TestTube,
  Users,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const templateCategories = [
  {
    id: 'web-apps',
    title: 'Web Applications',
    description: 'Modern web application templates with comprehensive testing setups',
    icon: Globe,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    templates: [
      {
        name: 'Next.js 14 App Router',
        description: 'Full-stack Next.js with TypeScript, Tailwind, and complete testing suite',
        features: ['App Router', 'TypeScript', 'Tailwind CSS', 'Jest', 'Playwright', 'Storybook'],
        coverage: '95%',
        downloads: '2.1k',
        github: 'https://github.com/pa-qa/nextjs-template',
        demo: '/templates/demo/next-app-router'
      },
      {
        name: 'React SPA Template',
        description: 'Single Page Application with Vite, React Router, and modern testing',
        features: ['Vite', 'React Router', 'TanStack Query', 'Vitest', 'Cypress', 'MSW'],
        coverage: '90%',
        downloads: '1.8k',
        github: 'https://github.com/pa-qa/react-spa-template',
        demo: '/templates/demo/react-spa-template'
      },
      {
        name: 'Vue 3 Composition API',
        description: 'Modern Vue 3 application with Composition API and comprehensive testing',
        features: ['Vue 3', 'Composition API', 'Pinia', 'Vitest', 'Playwright', 'Vue Test Utils'],
        coverage: '88%',
        downloads: '1.2k',
        github: 'https://github.com/pa-qa/vue3-template',
        demo: '/templates/demo/vue3-template'
      }
    ]
  },
  {
    id: 'api-services',
    title: 'API Services',
    description: 'Backend service templates with robust testing frameworks',
    icon: Zap,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    templates: [
      {
        name: 'FastAPI + SQLAlchemy',
        description: 'Modern Python API with async support and comprehensive testing',
        features: ['FastAPI', 'SQLAlchemy', 'Alembic', 'Pytest', 'TestContainers', 'Pydantic'],
        coverage: '92%',
        downloads: '3.5k',
        github: 'https://github.com/pa-qa/fastapi-template',
        demo: '/templates/demo/fastapi-sqlalchemy'
      },
      {
        name: 'Express.js + TypeScript',
        description: 'Node.js API with TypeScript and enterprise-grade testing',
        features: ['Express', 'TypeScript', 'Prisma', 'Jest', 'Supertest', 'OpenAPI'],
        coverage: '89%',
        downloads: '2.7k',
        github: 'https://github.com/pa-qa/express-ts-template',
        demo: '/templates/demo/express-typescript'
      },
      {
        name: 'NestJS Microservice',
        description: 'Scalable NestJS microservice with comprehensive testing strategy',
        features: ['NestJS', 'TypeORM', 'GraphQL', 'Jest', 'E2E Testing', 'Docker'],
        coverage: '94%',
        downloads: '1.9k',
        github: 'https://github.com/pa-qa/nestjs-template',
        demo: '/templates/demo/nestjs-graphql'
      }
    ]
  },
  {
    id: 'cms-plugins',
    title: 'CMS & Plugins',
    description: 'Content management system and plugin templates',
    icon: Package,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    templates: [
      {
        name: 'WordPress Plugin',
        description: 'Modern WordPress plugin with PHP testing and CI/CD integration',
        features: ['WordPress', 'PHPUnit', 'WP-CLI', 'Gutenberg', 'REST API', 'GitHub Actions'],
        coverage: '85%',
        downloads: '4.2k',
        github: 'https://github.com/pa-qa/wp-plugin-template',
        demo: '/templates/demo/wordpress-plugin'
      },
      {
        name: 'Drupal Module',
        description: 'Drupal 10 module with automated testing and deployment',
        features: ['Drupal 10', 'PHPUnit', 'Behat', 'Drupal Test Traits', 'Composer', 'GitLab CI'],
        coverage: '82%',
        downloads: '890',
        github: 'https://github.com/pa-qa/drupal-module-template',
        demo: '/templates/demo/drupal-module'
      },
      {
        name: 'Shopify App',
        description: 'Shopify app template with React frontend and testing suite',
        features: ['Shopify CLI', 'React', 'Node.js', 'GraphQL', 'Jest', 'Playwright'],
        coverage: '91%',
        downloads: '1.1k',
        github: 'https://github.com/pa-qa/shopify-app-template',
        demo: '/templates/demo/shopify-app'
      }
    ]
  },
  {
    id: 'mobile-apps',
    title: 'Mobile Applications',
    description: 'Cross-platform and native mobile app testing templates',
    icon: Users,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    templates: [
      {
        name: 'React Native Expo',
        description: 'Cross-platform mobile app with comprehensive testing setup',
        features: ['Expo', 'React Native', 'TypeScript', 'Jest', 'Detox', 'Maestro'],
        coverage: '87%',
        downloads: '2.3k',
        github: 'https://github.com/pa-qa/react-native-template',
        demo: '/templates/demo/react-native-expo'
      },
      {
        name: 'Flutter App',
        description: 'Flutter application with widget and integration testing',
        features: ['Flutter', 'Dart', 'BLoC', 'Widget Testing', 'Integration Tests', 'Golden Tests'],
        coverage: '90%',
        downloads: '1.7k',
        github: 'https://github.com/pa-qa/flutter-template',
        demo: '/templates/demo/flutter-app'
      }
    ]
  }
];

const quickStartOptions = [
  {
    title: 'Clone Repository',
    description: 'Get the full template with git history',
    icon: GitBranch,
    command: 'git clone https://github.com/pa-qa/template-name.git',
    benefits: ['Full git history', 'Easy updates', 'Branch management']
  },
  {
    title: 'Download ZIP',
    description: 'Quick download without git history',
    icon: Download,
    command: 'wget https://github.com/pa-qa/template-name/archive/main.zip',
    benefits: ['Instant download', 'No git required', 'Clean start']
  },
  {
    title: 'Use GitHub Template',
    description: 'Create a new repository from template',
    icon: Copy,
    command: 'Click "Use this template" on GitHub',
    benefits: ['New repository', 'Clean history', 'GitHub integration']
  },
  {
    title: 'CLI Generator',
    description: 'Interactive template generator',
    icon: Play,
    command: 'npx create-pa-qa-app my-app',
    benefits: ['Interactive setup', 'Customization options', 'Latest version']
  }
];

const featuredTemplates = [
  {
    name: 'Full-Stack Next.js',
    description: 'Production-ready Next.js application with authentication, database, and testing',
    tech: ['Next.js 14', 'TypeScript', 'Prisma', 'NextAuth', 'Tailwind CSS'],
    testing: ['Jest', 'Playwright', 'Storybook', 'MSW'],
    rating: 4.9,
    downloads: '12.5k',
    lastUpdated: '2 days ago',
    image: '/templates/nextjs-fullstack.png'
  },
  {
    name: 'Microservices Starter',
    description: 'Multi-service architecture with FastAPI, PostgreSQL, and Redis',
    tech: ['FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
    testing: ['Pytest', 'TestContainers', 'Locust', 'Contract Testing'],
    rating: 4.8,
    downloads: '8.7k',
    lastUpdated: '1 week ago',
    image: '/templates/microservices.png'
  },
  {
    name: 'E-commerce Platform',
    description: 'Complete e-commerce solution with admin dashboard and payment integration',
    tech: ['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS S3'],
    testing: ['Jest', 'Cypress', 'API Testing', 'Payment Testing'],
    rating: 4.7,
    downloads: '6.2k',
    lastUpdated: '3 days ago',
    image: '/templates/ecommerce.png'
  }
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Project
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {' '}Templates
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Jump-start your projects with production-ready templates featuring comprehensive testing setups, 
              CI/CD pipelines, and best practices. Download, customize, and deploy with confidence.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="#featured"
                className="rounded-md bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
              >
                Browse Templates
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="#quick-start"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-purple-600 transition-colors"
              >
                <Play className="h-4 w-4" />
                Quick Start Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Templates */}
      <section id="featured" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-purple-600 dark:text-purple-400">
              Most Popular
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Featured Templates
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Our most popular and comprehensive templates for rapid project development.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {featuredTemplates.map((template) => (
              <div
                key={template.name}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900/50"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={clsx(
                                'h-4 w-4',
                                i < Math.floor(template.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {template.rating}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {template.downloads}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        downloads
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {template.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        TECHNOLOGY STACK
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {template.tech.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        TESTING FRAMEWORK
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {template.testing.map((test) => (
                          <span
                            key={test}
                            className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          >
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Updated {template.lastUpdated}
                    </span>
                    <div className="flex gap-2">
                      <a
                        href={template.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                      {template.demo && (
                        <Link
                          href={template.demo}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Demo
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Categories */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              All Templates
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Comprehensive collection of templates organized by project type and technology stack.
            </p>
          </div>

          <div className="mt-16 space-y-16">
            {templateCategories.map((category) => (
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

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {category.templates.map((template) => (
                    <div
                      key={template.name}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            {template.coverage} coverage
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {template.description}
                      </p>

                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {template.features.map((feature) => (
                            <span
                              key={feature}
                              className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{template.downloads} downloads</span>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={template.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                          >
                            <GitBranch className="h-3 w-3" />
                            GitHub
                          </a>
                          {template.demo && (
                            <Link
                              href={template.demo}
                              className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Demo
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section id="quick-start" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Quick Start Guide
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Choose your preferred method to get started with PA-QA templates.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {quickStartOptions.map((option, index) => (
              <div
                key={option.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <option.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {option.description}
                </p>

                <div className="rounded-lg bg-gray-900 p-3 mb-4 dark:bg-gray-950">
                  <code className="text-xs text-gray-100">
                    {option.command}
                  </code>
                </div>

                <ul className="space-y-1">
                  {option.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Template Service */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Need a Custom Template?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Our team can create custom templates tailored to your specific requirements and technology stack.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Code2 className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Technology Integration
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                We'll integrate your preferred technologies and frameworks with comprehensive testing setups.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <TestTube className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Testing Strategy
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Custom testing strategies designed for your specific use cases and quality requirements.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <GitBranch className="mx-auto h-12 w-12 text-purple-600 dark:text-purple-400" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                CI/CD Pipeline
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Complete CI/CD setup tailored to your deployment infrastructure and workflow preferences.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/contact"
              className="rounded-md bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
            >
              Request Custom Template
              <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Ready to Build?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Explore our resources to get the most out of your PA-QA templates.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/getting-started"
                className="rounded-md bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
              >
                Getting Started
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-purple-600 transition-colors"
              >
                <FileText className="h-4 w-4" />
                View Examples
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}