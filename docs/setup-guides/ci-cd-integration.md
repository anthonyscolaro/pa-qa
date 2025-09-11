# CI/CD Integration Guide - PA-QA Framework

## 🚀 Quick Start

Integrate comprehensive automated testing into your CI/CD pipelines in under 15 minutes with GitHub Actions, GitLab CI, and Jenkins support.

## 📋 Prerequisites

- Git repository with PA-QA testing setup
- CI/CD platform access (GitHub Actions, GitLab CI, Jenkins, etc.)
- Docker support in CI environment
- Access to Allure dashboard (https://allure.projectassistant.ai)
- Basic understanding of YAML configuration

## 🎯 What You'll Get

After following this guide, your CI/CD pipelines will have:

✅ **Automated Test Execution** on every push and PR  
✅ **Multi-Framework Support** (React, FastAPI, WordPress)  
✅ **Parallel Test Execution** for faster feedback  
✅ **Quality Gates** with coverage thresholds  
✅ **Security Scanning** with automated vulnerability detection  
✅ **Performance Testing** with load test integration  
✅ **Allure Reporting** with centralized dashboard  
✅ **Artifact Management** for test results and reports  
✅ **Notification System** for test failures  
✅ **Deployment Automation** with test-driven releases  

## 🔧 GitHub Actions Integration

### Complete Workflow (.github/workflows/pa-qa-pipeline.yml)

```yaml
name: PA-QA Testing Pipeline

on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    # Run nightly tests at 2 AM UTC
    - cron: '0 2 * * *'

env:
  DOCKER_BUILDKIT: 1
  COMPOSE_DOCKER_CLI_BUILD: 1
  ALLURE_PROJECT_NAME: ${{ github.repository }}

jobs:
  # Pre-flight checks
  preflight:
    runs-on: ubuntu-latest
    outputs:
      frameworks: ${{ steps.detect.outputs.frameworks }}
      has-react: ${{ steps.detect.outputs.has-react }}
      has-fastapi: ${{ steps.detect.outputs.has-fastapi }}
      has-wordpress: ${{ steps.detect.outputs.has-wordpress }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Full history for better analysis
    
    - name: Detect frameworks
      id: detect
      run: |
        frameworks=""
        has_react="false"
        has_fastapi="false"
        has_wordpress="false"
        
        if [ -f "package.json" ] || [ -f "vite.config.ts" ] || [ -f "next.config.js" ]; then
          frameworks="$frameworks react"
          has_react="true"
        fi
        
        if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ] || [ -f "main.py" ]; then
          frameworks="$frameworks fastapi"
          has_fastapi="true"
        fi
        
        if [ -f "composer.json" ] || [ -f "wp-config.php" ] || [ -f "style.css" ]; then
          frameworks="$frameworks wordpress"
          has_wordpress="true"
        fi
        
        echo "frameworks=$frameworks" >> $GITHUB_OUTPUT
        echo "has-react=$has_react" >> $GITHUB_OUTPUT
        echo "has-fastapi=$has_fastapi" >> $GITHUB_OUTPUT
        echo "has-wordpress=$has_wordpress" >> $GITHUB_OUTPUT
    
    - name: Cache validation
      run: |
        echo "Detected frameworks: ${{ steps.detect.outputs.frameworks }}"
        echo "React: ${{ steps.detect.outputs.has-react }}"
        echo "FastAPI: ${{ steps.detect.outputs.has-fastapi }}"
        echo "WordPress: ${{ steps.detect.outputs.has-wordpress }}"

  # Code quality checks
  quality:
    runs-on: ubuntu-latest
    needs: preflight
    
    strategy:
      matrix:
        check: [lint, security, dependencies]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      if: needs.preflight.outputs.has-react == 'true'
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Setup Python
      if: needs.preflight.outputs.has-fastapi == 'true'
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Setup PHP
      if: needs.preflight.outputs.has-wordpress == 'true'
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.1'
        tools: composer
    
    - name: Run linting checks
      if: matrix.check == 'lint'
      run: |
        if [ "${{ needs.preflight.outputs.has-react }}" == "true" ]; then
          npm install
          npm run lint
          npm run type-check
        fi
        
        if [ "${{ needs.preflight.outputs.has-fastapi }}" == "true" ]; then
          pip install poetry
          poetry install --with dev
          poetry run black --check .
          poetry run isort --check-only .
          poetry run flake8 .
          poetry run mypy app/
        fi
        
        if [ "${{ needs.preflight.outputs.has-wordpress }}" == "true" ]; then
          composer install
          composer phpcs
          composer phpstan
        fi
    
    - name: Run security scanning
      if: matrix.check == 'security'
      run: |
        # Install security tools
        if [ "${{ needs.preflight.outputs.has-react }}" == "true" ]; then
          npm install
          npm audit --audit-level=high
          npx depcheck
        fi
        
        if [ "${{ needs.preflight.outputs.has-fastapi }}" == "true" ]; then
          pip install poetry safety bandit
          poetry install --with dev
          poetry run safety check
          poetry run bandit -r app/
        fi
        
        if [ "${{ needs.preflight.outputs.has-wordpress }}" == "true" ]; then
          composer install
          composer audit
        fi
    
    - name: Check dependencies
      if: matrix.check == 'dependencies'
      run: |
        if [ "${{ needs.preflight.outputs.has-react }}" == "true" ]; then
          npm install
          npm outdated || true
          npx npm-check-updates --interactive false
        fi
        
        if [ "${{ needs.preflight.outputs.has-fastapi }}" == "true" ]; then
          pip install poetry
          poetry show --outdated
        fi
        
        if [ "${{ needs.preflight.outputs.has-wordpress }}" == "true" ]; then
          composer install
          composer outdated
        fi

  # Unit and integration tests
  test:
    runs-on: ubuntu-latest
    needs: [preflight, quality]
    
    strategy:
      fail-fast: false
      matrix:
        framework: ${{ fromJson(needs.preflight.outputs.frameworks) }}
        test-type: [unit, integration]
        include:
          - framework: react
            node-version: '18'
          - framework: fastapi
            python-version: '3.11'
          - framework: wordpress
            php-version: '8.1'
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: wordpress_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Cache Docker layers
      uses: actions/cache@v3
      with:
        path: /tmp/.buildx-cache
        key: ${{ runner.os }}-buildx-${{ matrix.framework }}-${{ github.sha }}
        restore-keys: |
          ${{ runner.os }}-buildx-${{ matrix.framework }}-
    
    - name: Create test network
      run: docker network create pa_qa_test || true
    
    - name: Run ${{ matrix.framework }} ${{ matrix.test-type }} tests
      run: |
        chmod +x docker/test-runner.sh
        ./docker/test-runner.sh ${{ matrix.framework }} ${{ matrix.test-type }} --no-cleanup
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results-${{ matrix.framework }}-${{ matrix.test-type }}-${{ github.run_id }}
        path: |
          test-results/
          allure-results/
          coverage-report/
        retention-days: 30
    
    - name: Upload coverage to Codecov
      if: matrix.test-type == 'integration'
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        flags: ${{ matrix.framework }}
        name: codecov-${{ matrix.framework }}
        fail_ci_if_error: false

  # End-to-end tests
  e2e:
    runs-on: ubuntu-latest
    needs: [preflight, test]
    if: github.event_name != 'schedule'  # Skip E2E on scheduled runs
    
    strategy:
      matrix:
        framework: ${{ fromJson(needs.preflight.outputs.frameworks) }}
        browser: [chromium, firefox]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Run E2E tests
      run: |
        chmod +x docker/test-runner.sh
        ./docker/test-runner.sh ${{ matrix.framework }} e2e --no-cleanup
    
    - name: Upload E2E results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: e2e-results-${{ matrix.framework }}-${{ matrix.browser }}-${{ github.run_id }}
        path: |
          test-results/
          playwright-report/
          screenshots/
        retention-days: 14

  # Performance tests
  performance:
    runs-on: ubuntu-latest
    needs: [preflight, test]
    if: github.ref == 'refs/heads/main' || github.event_name == 'schedule'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run load tests
      run: |
        if [ "${{ needs.preflight.outputs.has-fastapi }}" == "true" ]; then
          chmod +x docker/test-runner.sh
          ./docker/test-runner.sh fastapi load --no-cleanup
        fi
    
    - name: Run Lighthouse audit
      if: needs.preflight.outputs.has-react == 'true'
      uses: treosh/lighthouse-ci-action@v10
      with:
        configPath: './lighthouserc.json'
        uploadArtifacts: true
    
    - name: Upload performance results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: performance-results-${{ github.run_id }}
        path: |
          lighthouse-results/
          load-test-results/
        retention-days: 30

  # Security scanning
  security:
    runs-on: ubuntu-latest
    needs: preflight
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: javascript, python

  # Generate reports
  reporting:
    runs-on: ubuntu-latest
    needs: [test, e2e, performance]
    if: always()
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Download all artifacts
      uses: actions/download-artifact@v3
      with:
        path: artifacts/
    
    - name: Setup Allure CLI
      run: |
        wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz
        tar -zxvf allure-2.24.0.tgz
        sudo mv allure-2.24.0 /opt/allure
        echo "/opt/allure/bin" >> $GITHUB_PATH
    
    - name: Combine test results
      run: |
        mkdir -p combined-results/allure-results
        find artifacts/ -name "allure-results" -type d | while read dir; do
          cp -r "$dir"/* combined-results/allure-results/ 2>/dev/null || true
        done
    
    - name: Generate Allure report
      run: |
        allure generate combined-results/allure-results -o allure-report --clean
    
    - name: Upload to PA-QA Allure Dashboard
      run: |
        if [ -f upload-results.sh ]; then
          chmod +x upload-results.sh
          ./upload-results.sh ${{ env.ALLURE_PROJECT_NAME }}
        fi
    
    - name: Deploy to GitHub Pages
      if: github.ref == 'refs/heads/main'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./allure-report
        destination_dir: test-reports

  # Deployment gate
  deploy-gate:
    runs-on: ubuntu-latest
    needs: [quality, test, e2e]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
    - name: Check quality gate
      run: |
        echo "All tests passed! Ready for deployment."
        echo "Quality checks: ✅"
        echo "Unit tests: ✅"
        echo "Integration tests: ✅"
        echo "E2E tests: ✅"
    
    - name: Trigger deployment
      if: success()
      run: |
        # Add deployment logic here
        echo "🚀 Deployment can proceed"
        # curl -X POST ${{ secrets.DEPLOYMENT_WEBHOOK_URL }}

  # Notifications
  notify:
    runs-on: ubuntu-latest
    needs: [quality, test, e2e, performance, reporting]
    if: always()
    
    steps:
    - name: Notify on success
      if: ${{ needs.test.result == 'success' && needs.e2e.result == 'success' }}
      run: |
        echo "✅ All tests passed for ${{ github.repository }}"
        # Add Slack/email notification here
    
    - name: Notify on failure
      if: ${{ needs.test.result == 'failure' || needs.e2e.result == 'failure' }}
      run: |
        echo "❌ Tests failed for ${{ github.repository }}"
        echo "Failed jobs: ${{ toJson(needs) }}"
        # Add failure notification here
```

### Branch Protection Rules

Configure in GitHub repository settings:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "quality",
      "test (react, unit)",
      "test (react, integration)",
      "test (fastapi, unit)",
      "test (fastapi, integration)",
      "test (wordpress, unit)",
      "test (wordpress, integration)",
      "e2e (react, chromium)",
      "e2e (fastapi, chromium)",
      "e2e (wordpress, chromium)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null
}
```

## 🔧 GitLab CI Integration

### Complete Pipeline (.gitlab-ci.yml)

```yaml
# PA-QA GitLab CI Pipeline
stages:
  - preflight
  - quality
  - test
  - security
  - e2e
  - performance
  - reporting
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  ALLURE_PROJECT_NAME: $CI_PROJECT_PATH

# Cache configuration
.cache_template: &cache_template
  cache:
    key: $CI_COMMIT_REF_SLUG
    paths:
      - node_modules/
      - .venv/
      - vendor/
      - .cache/

# Docker services
services:
  - docker:20.10.16-dind
  - postgres:15-alpine
  - mysql:8.0
  - redis:7-alpine

# Framework detection
detect-frameworks:
  stage: preflight
  image: alpine:latest
  script:
    - apk add --no-cache jq
    - |
      frameworks=""
      if [ -f "package.json" ] || [ -f "vite.config.ts" ]; then
        frameworks="$frameworks react"
      fi
      if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
        frameworks="$frameworks fastapi"
      fi
      if [ -f "composer.json" ] || [ -f "wp-config.php" ]; then
        frameworks="$frameworks wordpress"
      fi
      echo "FRAMEWORKS=$frameworks" > frameworks.env
  artifacts:
    reports:
      dotenv: frameworks.env
    expire_in: 1 hour

# Quality checks
lint-javascript:
  stage: quality
  image: node:18-alpine
  <<: *cache_template
  needs: ["detect-frameworks"]
  rules:
    - if: $FRAMEWORKS =~ /react/
  script:
    - npm ci
    - npm run lint
    - npm run type-check

lint-python:
  stage: quality
  image: python:3.11-slim
  <<: *cache_template
  needs: ["detect-frameworks"]
  rules:
    - if: $FRAMEWORKS =~ /fastapi/
  before_script:
    - pip install poetry
    - poetry config virtualenvs.in-project true
    - poetry install --with dev
  script:
    - poetry run black --check .
    - poetry run isort --check-only .
    - poetry run flake8 .
    - poetry run mypy app/

lint-php:
  stage: quality
  image: php:8.1-cli
  <<: *cache_template
  needs: ["detect-frameworks"]
  rules:
    - if: $FRAMEWORKS =~ /wordpress/
  before_script:
    - curl -sS https://getcomposer.org/installer | php
    - mv composer.phar /usr/local/bin/composer
    - composer install
  script:
    - composer phpcs
    - composer phpstan

# Security scanning
security-scan:
  stage: security
  image: aquasec/trivy:latest
  needs: ["detect-frameworks"]
  script:
    - trivy fs --exit-code 0 --format template --template "@contrib/sarif.tpl" -o trivy-results.sarif .
    - trivy fs --exit-code 1 --severity HIGH,CRITICAL .
  artifacts:
    reports:
      sast: trivy-results.sarif
    expire_in: 1 week

# Test jobs
.test_template: &test_template
  stage: test
  image: docker:20.10.16
  <<: *cache_template
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    MYSQL_ROOT_PASSWORD: password
    MYSQL_DATABASE: wordpress_test
  before_script:
    - docker network create pa_qa_test || true
  script:
    - chmod +x docker/test-runner.sh
    - ./docker/test-runner.sh $FRAMEWORK $TEST_TYPE --no-cleanup
  artifacts:
    paths:
      - test-results/
      - allure-results/
      - coverage-report/
    reports:
      junit: test-results/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    expire_in: 1 week

test-react-unit:
  <<: *test_template
  needs: ["detect-frameworks", "lint-javascript"]
  rules:
    - if: $FRAMEWORKS =~ /react/
  variables:
    FRAMEWORK: react
    TEST_TYPE: unit

test-react-integration:
  <<: *test_template
  needs: ["detect-frameworks", "lint-javascript"]
  rules:
    - if: $FRAMEWORKS =~ /react/
  variables:
    FRAMEWORK: react
    TEST_TYPE: integration

test-fastapi-unit:
  <<: *test_template
  needs: ["detect-frameworks", "lint-python"]
  rules:
    - if: $FRAMEWORKS =~ /fastapi/
  variables:
    FRAMEWORK: fastapi
    TEST_TYPE: unit

test-fastapi-integration:
  <<: *test_template
  needs: ["detect-frameworks", "lint-python"]
  rules:
    - if: $FRAMEWORKS =~ /fastapi/
  variables:
    FRAMEWORK: fastapi
    TEST_TYPE: integration

test-wordpress-unit:
  <<: *test_template
  needs: ["detect-frameworks", "lint-php"]
  rules:
    - if: $FRAMEWORKS =~ /wordpress/
  variables:
    FRAMEWORK: wordpress
    TEST_TYPE: unit

test-wordpress-integration:
  <<: *test_template
  needs: ["detect-frameworks", "lint-php"]
  rules:
    - if: $FRAMEWORKS =~ /wordpress/
  variables:
    FRAMEWORK: wordpress
    TEST_TYPE: integration

# E2E tests
.e2e_template: &e2e_template
  stage: e2e
  image: docker:20.10.16
  needs: 
    - job: "detect-frameworks"
    - job: "test-*-integration"
      optional: true
  script:
    - chmod +x docker/test-runner.sh
    - ./docker/test-runner.sh $FRAMEWORK e2e --no-cleanup
  artifacts:
    paths:
      - test-results/
      - playwright-report/
      - screenshots/
    expire_in: 1 week

e2e-react:
  <<: *e2e_template
  rules:
    - if: $FRAMEWORKS =~ /react/ && $CI_PIPELINE_SOURCE != "schedule"
  variables:
    FRAMEWORK: react

e2e-fastapi:
  <<: *e2e_template
  rules:
    - if: $FRAMEWORKS =~ /fastapi/ && $CI_PIPELINE_SOURCE != "schedule"
  variables:
    FRAMEWORK: fastapi

e2e-wordpress:
  <<: *e2e_template
  rules:
    - if: $FRAMEWORKS =~ /wordpress/ && $CI_PIPELINE_SOURCE != "schedule"
  variables:
    FRAMEWORK: wordpress

# Performance tests
performance-tests:
  stage: performance
  image: docker:20.10.16
  needs: ["test-fastapi-integration"]
  rules:
    - if: $CI_COMMIT_BRANCH == "main" || $CI_PIPELINE_SOURCE == "schedule"
  script:
    - chmod +x docker/test-runner.sh
    - ./docker/test-runner.sh fastapi load --no-cleanup
  artifacts:
    paths:
      - load-test-results/
    expire_in: 1 month

# Reporting
allure-report:
  stage: reporting
  image: alpine:latest
  needs:
    - job: "test-*"
      artifacts: true
    - job: "e2e-*"
      artifacts: true
      optional: true
  before_script:
    - apk add --no-cache wget tar
    - wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz
    - tar -zxvf allure-2.24.0.tgz
    - mv allure-2.24.0 /opt/allure
    - export PATH="/opt/allure/bin:$PATH"
  script:
    - mkdir -p combined-results/allure-results
    - find . -name "allure-results" -type d | while read dir; do
        cp -r "$dir"/* combined-results/allure-results/ 2>/dev/null || true
      done
    - allure generate combined-results/allure-results -o allure-report --clean
    - |
      if [ -f upload-results.sh ]; then
        chmod +x upload-results.sh
        ./upload-results.sh $ALLURE_PROJECT_NAME
      fi
  artifacts:
    paths:
      - allure-report/
    expire_in: 1 month

# Pages deployment
pages:
  stage: deploy
  image: alpine:latest
  needs: ["allure-report"]
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  script:
    - mkdir public
    - cp -r allure-report/* public/
  artifacts:
    paths:
      - public

# Deployment gate
deploy-gate:
  stage: deploy
  image: alpine:latest
  needs:
    - job: "test-*"
    - job: "e2e-*"
      optional: true
  rules:
    - if: $CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE == "push"
  script:
    - echo "All tests passed! Ready for deployment."
    - echo "🚀 Deployment can proceed"
    # Add deployment trigger here
```

## 🔧 Jenkins Integration

### Jenkinsfile

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_BUILDKIT = '1'
        ALLURE_PROJECT_NAME = "${env.JOB_NAME}"
        PA_QA_NETWORK = 'pa_qa_test'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
        parallelsAlwaysFailFast()
    }
    
    triggers {
        // Nightly builds
        cron('H 2 * * *')
        // Poll SCM every 5 minutes
        pollSCM('H/5 * * * *')
    }
    
    stages {
        stage('Preflight') {
            steps {
                script {
                    // Detect frameworks
                    def frameworks = []
                    if (fileExists('package.json') || fileExists('vite.config.ts')) {
                        frameworks.add('react')
                    }
                    if (fileExists('pyproject.toml') || fileExists('requirements.txt')) {
                        frameworks.add('fastapi')
                    }
                    if (fileExists('composer.json') || fileExists('wp-config.php')) {
                        frameworks.add('wordpress')
                    }
                    
                    env.FRAMEWORKS = frameworks.join(' ')
                    echo "Detected frameworks: ${env.FRAMEWORKS}"
                }
                
                // Setup Docker network
                sh '''
                    docker network create ${PA_QA_NETWORK} || true
                    docker network ls
                '''
            }
        }
        
        stage('Quality Checks') {
            parallel {
                stage('Lint JavaScript') {
                    when {
                        expression { env.FRAMEWORKS.contains('react') }
                    }
                    agent {
                        docker {
                            image 'node:18-alpine'
                            args '-v /var/lib/jenkins/.npm:/root/.npm'
                        }
                    }
                    steps {
                        sh '''
                            npm ci
                            npm run lint
                            npm run type-check
                        '''
                    }
                }
                
                stage('Lint Python') {
                    when {
                        expression { env.FRAMEWORKS.contains('fastapi') }
                    }
                    agent {
                        docker {
                            image 'python:3.11-slim'
                            args '-v /var/lib/jenkins/.cache/pip:/root/.cache/pip'
                        }
                    }
                    steps {
                        sh '''
                            pip install poetry
                            poetry config virtualenvs.in-project true
                            poetry install --with dev
                            poetry run black --check .
                            poetry run isort --check-only .
                            poetry run flake8 .
                            poetry run mypy app/
                        '''
                    }
                }
                
                stage('Lint PHP') {
                    when {
                        expression { env.FRAMEWORKS.contains('wordpress') }
                    }
                    agent {
                        docker {
                            image 'php:8.1-cli'
                            args '-v /var/lib/jenkins/.composer:/root/.composer'
                        }
                    }
                    steps {
                        sh '''
                            curl -sS https://getcomposer.org/installer | php
                            mv composer.phar /usr/local/bin/composer
                            composer install
                            composer phpcs
                            composer phpstan
                        '''
                    }
                }
                
                stage('Security Scan') {
                    agent {
                        docker {
                            image 'aquasec/trivy:latest'
                        }
                    }
                    steps {
                        sh '''
                            trivy fs --exit-code 0 --format template --template "@contrib/sarif.tpl" -o trivy-results.sarif .
                            trivy fs --exit-code 1 --severity HIGH,CRITICAL .
                        '''
                        
                        archiveArtifacts artifacts: 'trivy-results.sarif', fingerprint: true
                    }
                }
            }
        }
        
        stage('Unit & Integration Tests') {
            parallel {
                stage('React Tests') {
                    when {
                        expression { env.FRAMEWORKS.contains('react') }
                    }
                    stages {
                        stage('React Unit Tests') {
                            steps {
                                sh '''
                                    chmod +x docker/test-runner.sh
                                    ./docker/test-runner.sh react unit --no-cleanup
                                '''
                            }
                        }
                        stage('React Integration Tests') {
                            steps {
                                sh '''
                                    ./docker/test-runner.sh react integration --no-cleanup
                                '''
                            }
                        }
                    }
                }
                
                stage('FastAPI Tests') {
                    when {
                        expression { env.FRAMEWORKS.contains('fastapi') }
                    }
                    stages {
                        stage('FastAPI Unit Tests') {
                            steps {
                                sh '''
                                    chmod +x docker/test-runner.sh
                                    ./docker/test-runner.sh fastapi unit --no-cleanup
                                '''
                            }
                        }
                        stage('FastAPI Integration Tests') {
                            steps {
                                sh '''
                                    ./docker/test-runner.sh fastapi integration --no-cleanup
                                '''
                            }
                        }
                    }
                }
                
                stage('WordPress Tests') {
                    when {
                        expression { env.FRAMEWORKS.contains('wordpress') }
                    }
                    stages {
                        stage('WordPress Unit Tests') {
                            steps {
                                sh '''
                                    chmod +x docker/test-runner.sh
                                    ./docker/test-runner.sh wordpress unit --no-cleanup
                                '''
                            }
                        }
                        stage('WordPress Integration Tests') {
                            steps {
                                sh '''
                                    ./docker/test-runner.sh wordpress integration --no-cleanup
                                '''
                            }
                        }
                    }
                }
            }
        }
        
        stage('E2E Tests') {
            when {
                not { triggeredBy 'TimerTrigger' }  // Skip E2E on scheduled builds
            }
            parallel {
                stage('React E2E') {
                    when {
                        expression { env.FRAMEWORKS.contains('react') }
                    }
                    steps {
                        sh './docker/test-runner.sh react e2e --no-cleanup'
                    }
                }
                
                stage('FastAPI E2E') {
                    when {
                        expression { env.FRAMEWORKS.contains('fastapi') }
                    }
                    steps {
                        sh './docker/test-runner.sh fastapi e2e --no-cleanup'
                    }
                }
                
                stage('WordPress E2E') {
                    when {
                        expression { env.FRAMEWORKS.contains('wordpress') }
                    }
                    steps {
                        sh './docker/test-runner.sh wordpress e2e --no-cleanup'
                    }
                }
            }
        }
        
        stage('Performance Tests') {
            when {
                anyOf {
                    branch 'main'
                    triggeredBy 'TimerTrigger'
                }
            }
            steps {
                script {
                    if (env.FRAMEWORKS.contains('fastapi')) {
                        sh './docker/test-runner.sh fastapi load --no-cleanup'
                    }
                }
            }
        }
        
        stage('Generate Reports') {
            steps {
                sh '''
                    # Install Allure CLI
                    wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz
                    tar -zxvf allure-2.24.0.tgz
                    sudo mv allure-2.24.0 /opt/allure || mv allure-2.24.0 /tmp/allure
                    export PATH="/opt/allure/bin:/tmp/allure/bin:$PATH"
                    
                    # Combine results
                    mkdir -p combined-results/allure-results
                    find . -name "allure-results" -type d | while read dir; do
                        cp -r "$dir"/* combined-results/allure-results/ 2>/dev/null || true
                    done
                    
                    # Generate report
                    allure generate combined-results/allure-results -o allure-report --clean
                    
                    # Upload to PA-QA dashboard
                    if [ -f upload-results.sh ]; then
                        chmod +x upload-results.sh
                        ./upload-results.sh ${ALLURE_PROJECT_NAME}
                    fi
                '''
            }
        }
    }
    
    post {
        always {
            // Archive artifacts
            archiveArtifacts artifacts: '''
                test-results/**/*,
                allure-results/**/*,
                allure-report/**/*,
                coverage-report/**/*,
                playwright-report/**/*
            ''', fingerprint: true, allowEmptyArchive: true
            
            // Publish test results
            publishTestResults testResultsPattern: 'test-results/**/junit.xml'
            
            // Publish Allure report
            allure([
                includeProperties: false,
                jdk: '',
                properties: [],
                reportBuildPolicy: 'ALWAYS',
                results: [[path: 'allure-results']]
            ])
            
            // Publish coverage
            publishCoverage adapters: [
                cobertura(path: 'coverage.xml')
            ], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
            
            // Cleanup
            sh '''
                docker-compose -f docker-compose.test.yml down -v || true
                docker network rm ${PA_QA_NETWORK} || true
                docker system prune -f
            '''
        }
        
        success {
            // Notify on success
            echo '✅ All tests passed!'
            // Add notification logic here
        }
        
        failure {
            // Notify on failure
            echo '❌ Tests failed!'
            // Add notification logic here
        }
        
        unstable {
            // Notify on unstable build
            echo '⚠️ Tests are unstable!'
            // Add notification logic here
        }
    }
}
```

## 🔧 Advanced CI/CD Features

### Matrix Strategy Configuration

```yaml
# Advanced matrix for comprehensive testing
strategy:
  fail-fast: false
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    framework: [react, fastapi, wordpress]
    version:
      - framework: react
        node-version: [16, 18, 20]
      - framework: fastapi
        python-version: [3.8, 3.9, 3.10, 3.11]
      - framework: wordpress
        php-version: [8.0, 8.1, 8.2]
    exclude:
      - os: windows-latest
        framework: wordpress  # Skip WordPress on Windows
```

### Conditional Execution

```yaml
# Run different tests based on changes
- name: Detect changes
  uses: dorny/paths-filter@v2
  id: changes
  with:
    filters: |
      frontend:
        - 'src/**'
        - 'components/**'
        - 'package.json'
      backend:
        - 'app/**'
        - 'api/**'
        - 'pyproject.toml'
      tests:
        - 'tests/**'
        - 'cypress/**'

- name: Run frontend tests
  if: steps.changes.outputs.frontend == 'true'
  run: npm run test:frontend

- name: Run backend tests
  if: steps.changes.outputs.backend == 'true'
  run: poetry run pytest
```

### Dynamic Pipeline Generation

```python
# scripts/generate-pipeline.py
import json
import yaml
from pathlib import Path

def detect_frameworks():
    """Detect frameworks in the project."""
    frameworks = []
    
    if Path('package.json').exists():
        frameworks.append('react')
    if Path('pyproject.toml').exists():
        frameworks.append('fastapi')
    if Path('composer.json').exists():
        frameworks.append('wordpress')
    
    return frameworks

def generate_pipeline(frameworks):
    """Generate CI pipeline based on detected frameworks."""
    pipeline = {
        'name': 'PA-QA Dynamic Pipeline',
        'on': ['push', 'pull_request'],
        'jobs': {}
    }
    
    for framework in frameworks:
        pipeline['jobs'][f'test-{framework}'] = {
            'runs-on': 'ubuntu-latest',
            'steps': [
                {'uses': 'actions/checkout@v4'},
                {'run': f'./docker/test-runner.sh {framework} all'}
            ]
        }
    
    return pipeline

if __name__ == '__main__':
    frameworks = detect_frameworks()
    pipeline = generate_pipeline(frameworks)
    
    with open('.github/workflows/dynamic-pipeline.yml', 'w') as f:
        yaml.dump(pipeline, f, default_flow_style=False)
```

## 🔧 Monitoring and Alerting

### Slack Notifications

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    channel: '#qa-alerts'
    author_name: 'PA-QA Pipeline'
    title: 'Test Pipeline Failed'
    text: |
      Repository: ${{ github.repository }}
      Branch: ${{ github.ref }}
      Commit: ${{ github.sha }}
      Actor: ${{ github.actor }}
      
      View logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Email Notifications

```yaml
- name: Send email notification
  if: always()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 587
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: 'PA-QA Test Results: ${{ job.status }}'
    to: qa-team@company.com
    from: noreply@company.com
    body: |
      Test execution completed with status: ${{ job.status }}
      
      Repository: ${{ github.repository }}
      Branch: ${{ github.ref }}
      Commit: ${{ github.sha }}
      
      View detailed results: https://allure.projectassistant.ai/${{ github.repository }}
```

### Microsoft Teams Integration

```yaml
- name: Notify Microsoft Teams
  if: always()
  uses: aliencube/microsoft-teams-actions@v0.8.0
  with:
    webhook_uri: ${{ secrets.MS_TEAMS_WEBHOOK_URI }}
    title: 'PA-QA Test Results'
    summary: |
      Test execution for ${{ github.repository }} completed with status: ${{ job.status }}
    theme_color: ${{ job.status == 'success' && '28a745' || 'dc3545' }}
    sections: |
      [
        {
          "activityTitle": "Repository: ${{ github.repository }}",
          "activitySubtitle": "Branch: ${{ github.ref }}",
          "facts": [
            {"name": "Status", "value": "${{ job.status }}"},
            {"name": "Commit", "value": "${{ github.sha }}"},
            {"name": "Actor", "value": "${{ github.actor }}"}
          ]
        }
      ]
```

## ✅ Verification and Troubleshooting

### Pipeline Health Checks

```bash
# Verify pipeline configuration
./scripts/verify-pipeline.sh

# Test pipeline locally with act
act -j test-react-unit

# Validate GitHub Actions workflow
actionlint .github/workflows/pa-qa-pipeline.yml

# Check GitLab CI syntax
gitlab-ci-multi-runner exec docker test-react-unit
```

### Common Issues and Solutions

**1. Resource Limits**
```yaml
# Increase runner resources
jobs:
  test:
    runs-on: ubuntu-latest-8-cores  # Use larger runner
    timeout-minutes: 90              # Increase timeout
```

**2. Flaky Tests**
```yaml
# Add retry mechanism
- name: Run tests with retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 15
    max_attempts: 3
    command: ./docker/test-runner.sh react e2e
```

**3. Cache Issues**
```yaml
# Clear cache on specific branches
- name: Clear cache
  if: github.ref == 'refs/heads/cache-clear'
  run: |
    gh extension install actions/gh-actions-cache
    gh actions-cache delete --all
```

**4. Secret Management**
```bash
# Rotate secrets regularly
./scripts/rotate-secrets.sh

# Verify secret access
if [ -z "$ALLURE_TOKEN" ]; then
  echo "Missing ALLURE_TOKEN secret"
  exit 1
fi
```

## 📚 Additional Resources

- [PA-QA Best Practices](/docs/best-practices/testing-patterns.md)
- [Docker Testing Setup](/docs/setup-guides/docker-testing-setup.md)
- [Troubleshooting Guide](/docs/troubleshooting/common-issues.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI Documentation](https://docs.gitlab.com/ee/ci/)
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)

---

**🎉 Congratulations!** Your CI/CD pipelines now have comprehensive automated testing with the PA-QA framework. You're ready to deliver high-quality software with confidence through automated quality gates and continuous feedback loops.