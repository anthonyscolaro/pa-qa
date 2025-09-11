import Link from 'next/link';
import { 
  ArrowRight,
  CheckCircle,
  Clock,
  Code2,
  Copy,
  Download,
  GitBranch,
  Globe,
  Play,
  Settings,
  Shield,
  TestTube,
  Upload,
  Workflow,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const cicdPlatforms = [
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    description: 'Native CI/CD for GitHub repositories with powerful workflow automation',
    icon: GitBranch,
    color: 'text-gray-900 dark:text-gray-100',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    features: [
      'Native GitHub integration',
      'Matrix builds for multiple environments',
      'Extensive marketplace of actions',
      'Built-in secret management'
    ],
    useCases: ['Open source projects', 'GitHub-hosted repositories', 'Complex workflows']
  },
  {
    id: 'gitlab-ci',
    name: 'GitLab CI/CD',
    description: 'Integrated CI/CD platform with GitLab repositories',
    icon: Workflow,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    features: [
      'Built into GitLab platform',
      'Auto DevOps capabilities',
      'Container registry integration',
      'Kubernetes deployment support'
    ],
    useCases: ['GitLab repositories', 'Enterprise environments', 'Kubernetes deployments']
  },
  {
    id: 'bitbucket-pipelines',
    name: 'Bitbucket Pipelines',
    description: 'Atlassian\'s CI/CD service integrated with Bitbucket',
    icon: Settings,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    features: [
      'Docker-based builds',
      'Atlassian tool integration',
      'Branch and deployment models',
      'Built-in deployment environments'
    ],
    useCases: ['Bitbucket repositories', 'Atlassian ecosystems', 'Docker workflows']
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    description: 'Self-hosted automation server with extensive plugin ecosystem',
    icon: Zap,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    features: [
      'Self-hosted and customizable',
      'Thousands of plugins available',
      'Distributed builds',
      'Pipeline as code support'
    ],
    useCases: ['Self-hosted solutions', 'Legacy systems', 'Complex custom requirements']
  }
];

const pipelineStages = [
  {
    stage: 'Source',
    description: 'Code checkout and preparation',
    icon: Code2,
    color: 'text-blue-600 dark:text-blue-400',
    activities: [
      'Clone repository',
      'Checkout specific branch/commit',
      'Download dependencies cache',
      'Set up environment variables'
    ]
  },
  {
    stage: 'Build',
    description: 'Compile and prepare application',
    icon: Settings,
    color: 'text-orange-600 dark:text-orange-400',
    activities: [
      'Install dependencies',
      'Compile TypeScript/code',
      'Bundle assets',
      'Generate build artifacts'
    ]
  },
  {
    stage: 'Test',
    description: 'Run comprehensive test suite',
    icon: TestTube,
    color: 'text-green-600 dark:text-green-400',
    activities: [
      'Unit tests',
      'Integration tests',
      'End-to-end tests',
      'Security scans'
    ]
  },
  {
    stage: 'Quality',
    description: 'Code quality and coverage analysis',
    icon: Shield,
    color: 'text-purple-600 dark:text-purple-400',
    activities: [
      'Coverage reporting',
      'Linting and formatting',
      'Code quality metrics',
      'Vulnerability scanning'
    ]
  },
  {
    stage: 'Deploy',
    description: 'Deploy to target environments',
    icon: Upload,
    color: 'text-red-600 dark:text-red-400',
    activities: [
      'Build Docker images',
      'Deploy to staging',
      'Run smoke tests',
      'Deploy to production'
    ]
  }
];

const workflowExamples = [
  {
    title: 'Next.js Application',
    description: 'GitHub Actions workflow for Next.js with TypeScript',
    platform: 'GitHub Actions',
    code: `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        token: \${{ secrets.CODECOV_TOKEN }}
    
    - name: Upload test results to Allure
      if: always()
      run: |
        npm run allure:generate
        ./scripts/upload-allure-results.sh
      env:
        ALLURE_PROJECT_ID: \${{ secrets.ALLURE_PROJECT_ID }}

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.ORG_ID }}
        vercel-project-id: \${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'`
  },
  {
    title: 'FastAPI Service',
    description: 'Docker-based pipeline for Python FastAPI application',
    platform: 'GitLab CI',
    code: `stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

services:
  - docker:dind
  - postgres:13
  - redis:6

before_script:
  - python -m pip install --upgrade pip
  - pip install -r requirements-dev.txt

test:
  stage: test
  script:
    - pytest tests/unit --cov=app --cov-report=xml
    - pytest tests/integration
    - pytest tests/e2e
    - python -m mypy app/
    - python -m flake8 app/
    - python -m black --check app/
    - safety check
  coverage: '/TOTAL.+?(\d+\%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - htmlcov/
    expire_in: 1 week

build:
  stage: build
  only:
    - main
    - develop
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:latest

deploy:staging:
  stage: deploy
  only:
    - develop
  script:
    - kubectl set image deployment/api-staging api=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - kubectl rollout status deployment/api-staging
  environment:
    name: staging
    url: https://api-staging.example.com

deploy:production:
  stage: deploy
  only:
    - main
  when: manual
  script:
    - kubectl set image deployment/api-production api=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - kubectl rollout status deployment/api-production
  environment:
    name: production
    url: https://api.example.com`
  },
  {
    title: 'WordPress Plugin',
    description: 'PHP testing pipeline for WordPress plugin development',
    platform: 'Bitbucket Pipelines',
    code: `image: php:8.1

definitions:
  services:
    mysql:
      image: mysql:8.0
      environment:
        MYSQL_DATABASE: wordpress_test
        MYSQL_ROOT_PASSWORD: root

pipelines:
  default:
    - step:
        name: Test
        services:
          - mysql
        script:
          # Install dependencies
          - apt-get update && apt-get install -y git unzip
          - curl -sS https://getcomposer.org/installer | php
          - mv composer.phar /usr/local/bin/composer
          - composer install
          
          # Install WordPress test environment
          - bash bin/install-wp-tests.sh wordpress_test root root mysql latest
          
          # Run PHP linting
          - composer run-script phpcs
          - composer run-script phpstan
          - composer run-script phpmd
          
          # Run PHPUnit tests
          - composer run-script test
          - composer run-script test:integration
          
          # Security checks
          - composer audit
        artifacts:
          - coverage/**
          - logs/**
    
    - step:
        name: Build Plugin
        script:
          - apt-get update && apt-get install -y zip
          - composer install --no-dev --optimize-autoloader
          - zip -r plugin.zip . -x "tests/*" "bin/*" "vendor/*/tests/*"
        artifacts:
          - plugin.zip
  
  branches:
    main:
      - step:
          name: Test
          services:
            - mysql
          script:
            - composer install
            - bash bin/install-wp-tests.sh wordpress_test root root mysql latest
            - composer run-script test
            - composer run-script test:integration
      
      - step:
          name: Deploy to WordPress.org
          deployment: production
          script:
            - composer install --no-dev --optimize-autoloader
            - ./deploy-to-wp-org.sh
          trigger: manual`
  }
];

const qualityGates = [
  {
    name: 'Code Coverage',
    threshold: '80%',
    description: 'Minimum test coverage required to pass',
    action: 'Block deployment if coverage drops below threshold'
  },
  {
    name: 'Test Success Rate',
    threshold: '100%',
    description: 'All tests must pass before deployment',
    action: 'Fail pipeline if any test fails'
  },
  {
    name: 'Security Vulnerabilities',
    threshold: '0 High/Critical',
    description: 'No high or critical security issues allowed',
    action: 'Block deployment until vulnerabilities are fixed'
  },
  {
    name: 'Code Quality Score',
    threshold: 'A Grade',
    description: 'Maintain high code quality standards',
    action: 'Warning for B grade, fail for C or below'
  },
  {
    name: 'Performance Budget',
    threshold: 'LCP < 2.5s',
    description: 'Core Web Vitals must meet standards',
    action: 'Performance regression check'
  }
];

export default function CiCdPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              CI/CD
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {' '}Pipelines
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Automate your testing workflow with robust CI/CD pipelines. Deploy with confidence using 
              automated testing, quality gates, and comprehensive reporting across multiple platforms.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="#platforms"
                className="rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors"
              >
                Explore Platforms
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="#examples"
                className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-green-600 transition-colors"
              >
                <Code2 className="h-4 w-4" />
                View Examples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CI/CD Platforms */}
      <section id="platforms" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-green-600 dark:text-green-400">
              Platform Support
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              CI/CD Platforms
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Pre-configured templates for popular CI/CD platforms with testing automation.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {cicdPlatforms.map((platform) => (
              <div
                key={platform.id}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900/50"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={clsx(
                    'inline-flex h-12 w-12 items-center justify-center rounded-lg',
                    platform.bgColor
                  )}>
                    <platform.icon className={clsx('h-6 w-6', platform.color)} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {platform.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Key Features:
                    </h4>
                    <ul className="space-y-1">
                      {platform.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Best For:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {platform.useCases.map((useCase) => (
                        <span
                          key={useCase}
                          className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Stages */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Pipeline Stages
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Understand the standard stages of a comprehensive CI/CD pipeline.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-5">
              {pipelineStages.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  {/* Connector line */}
                  {index < pipelineStages.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
                  )}
                  
                  <div className="relative z-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 mb-4">
                      <stage.icon className={clsx('h-6 w-6', stage.color)} />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {stage.stage}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {stage.description}
                    </p>
                    
                    <ul className="space-y-1">
                      {stage.activities.map((activity, activityIndex) => (
                        <li key={activityIndex} className="text-xs text-gray-500 dark:text-gray-400">
                          • {activity}
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

      {/* Workflow Examples */}
      <section id="examples" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Workflow Examples
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Ready-to-use CI/CD configurations for different project types and platforms.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {workflowExamples.map((example) => (
              <div
                key={example.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Workflow className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {example.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {example.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        {example.platform}
                      </span>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                    </div>
                  </div>
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

      {/* Quality Gates */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Quality Gates
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Automated quality checks that prevent low-quality code from reaching production.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {qualityGates.map((gate) => (
              <div
                key={gate.name}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {gate.name}
                    </h3>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        {gate.threshold}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {gate.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Action:</strong> {gate.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Points */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Integration Points
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Connect your CI/CD pipeline with essential tools and services.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Globe className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Allure Reports
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Centralized test reporting at allure.projectassistant.ai
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Shield className="mx-auto h-8 w-8 text-green-600 dark:text-green-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Security Scanning
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Automated vulnerability detection and dependency auditing
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Zap className="mx-auto h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Performance Testing
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Lighthouse CI, Core Web Vitals, and load testing integration
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Upload className="mx-auto h-8 w-8 text-purple-600 dark:text-purple-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Deployment
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Automated deployment to staging and production environments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="bg-gray-50 py-24 dark:bg-gray-900/50 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Ready to Automate?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Download CI/CD templates or explore our comprehensive testing framework.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/templates"
                className="rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors"
              >
                <Download className="mr-2 inline h-4 w-4" />
                Download Templates
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