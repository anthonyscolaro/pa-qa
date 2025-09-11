# PA-QA Testing Showcase

A comprehensive testing framework showcase built with Next.js 14, featuring interactive documentation, real-world examples, and best practices for modern web development agencies.

## 🚀 Quick Start with Docker Compose

The entire application can be run using Docker Compose with different profiles for different use cases.

### Prerequisites

- Docker Desktop 4.0+ or Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Production Environment

Run the complete production setup:

```bash
# Clone the repository
git clone <repository-url>
cd pa-qa-showcase

# Build and start production services
docker-compose up -d

# Application will be available at:
# http://localhost:3005 - Main application
```

### Development Environment

For development with hot reloading and debugging:

```bash
# Start development environment
docker-compose --profile dev up -d

# Application will be available at:
# http://localhost:3006 - Development server with hot reload
```

### Testing Environment

Run the complete test suite:

```bash
# Run all tests
docker-compose --profile test up --abort-on-container-exit

# Or run tests and keep containers for debugging
docker-compose --profile test up -d
```

### All Services

To run all services including monitoring and testing:

```bash
# Start all services
docker-compose --profile dev --profile test up -d
```

## 📋 Available Services

| Service | Port | Description | Profile |
|---------|------|-------------|---------|
| **pa-qa-showcase** | 3005 | Production Next.js app | default |
| **pa-qa-dev** | 3006 | Development server | dev |
| **pa-qa-tests** | - | Test runner | test |

## 🛠️ Local Development (without Docker)

If you prefer to run locally without Docker:

### Prerequisites

- Node.js 18.0+
- npm 8.0+

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Run TypeScript checks

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run E2E tests with UI
npm run test:a11y       # Run accessibility tests
npm run test:performance # Run performance tests
npm run test:ci         # Run all tests for CI

# Documentation
npm run docs:sync       # Sync documentation with framework changes
npm run build:check     # Validate build and MDX files
```

## 🏗️ Project Structure

```
pa-qa-showcase/
├── app/                    # Next.js 14 App Router pages
│   ├── (routes)/          # Route groups
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── mdx/              # MDX interactive components
│   ├── navigation/       # Navigation components
│   └── showcase/         # Showcase-specific components
├── content/              # MDX documentation content
│   ├── getting-started.mdx
│   ├── testing-patterns.mdx
│   ├── utilities.mdx
│   ├── best-practices.mdx
│   ├── ci-cd.mdx
│   └── templates.mdx
├── docker/               # Docker configurations
│   ├── Dockerfile.dev    # Development container
│   ├── Dockerfile.prod   # Production container
│   └── Dockerfile.test   # Testing container
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # E2E tests
│   └── accessibility/    # Accessibility tests
├── scripts/              # Utility scripts
│   └── sync-docs.js      # Documentation sync script
├── docker-compose.yml    # Docker Compose configuration
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── vitest.config.ts      # Vitest configuration
├── playwright.config.ts  # Playwright configuration
└── package.json          # Dependencies and scripts
```

## 🧪 Testing

The showcase includes comprehensive testing examples:

### Unit Testing with Vitest

```bash
# Run unit tests
npm run test:unit

# With coverage
npm run test:coverage
```

### E2E Testing with Playwright

```bash
# Run E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Run specific tests
npm run test:e2e -- --grep "user authentication"
```

### Accessibility Testing

```bash
# Run accessibility tests
npm run test:a11y
```

### Performance Testing

```bash
# Run Lighthouse performance tests
npm run test:performance
```

## 📚 Documentation Features

### Interactive Components

The showcase includes several interactive MDX components:

- **CodeDemo**: Interactive code editor with execution
- **TestRunner**: Live test execution in the browser
- **TabbedCodeDemo**: Multi-language code examples
- **InteractiveSelector**: Project template selection
- **WorkflowDiagram**: Multi-agent workflow visualization

### Auto-Sync Documentation

Documentation automatically syncs with framework changes:

```bash
# Manual sync
npm run docs:sync

# The GitHub Action automatically syncs when:
# - project-types/ directory changes
# - shared/ utilities are updated
# - docs/requirements/ are modified
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# Next.js
NEXT_TELEMETRY_DISABLED=1

# Development
NODE_ENV=development

# Optional: Analytics
VERCEL_ANALYTICS_ID=your_analytics_id
```

### Docker Environment

The Docker setup includes several environment configurations:

- **Production**: Optimized build with minimal image size
- **Development**: Hot reloading with volume mounts
- **Testing**: Isolated environment for CI/CD

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker Production

```bash
# Build production image
docker build -f docker/Dockerfile.prod -t pa-qa-showcase .

# Run production container
docker run -p 3005:3000 pa-qa-showcase
```

### GitHub Actions

The project includes CI/CD workflows:

- **Test Suite**: Runs on every push and PR
- **Documentation Sync**: Updates MDX content automatically
- **Deployment**: Deploys to staging/production

## 🔍 Monitoring

### Health Checks

The application includes health check endpoints:

- `GET /api/health` - Application health status
- Docker containers include health checks for orchestration

### Performance Monitoring

- Lighthouse CI integration
- Core Web Vitals tracking
- Bundle size monitoring

## 🤝 Contributing

### Framework Integration

To add a new framework template:

1. Add template files to `project-types/[category]/[framework]/`
2. Include comprehensive tests and configurations
3. Update documentation with the sync script: `npm run docs:sync`
4. Submit a PR with the new integration

### Documentation Updates

1. Edit MDX files in the `content/` directory
2. Use interactive components for enhanced examples
3. Test with `npm run build:check`
4. Documentation auto-syncs with framework changes

## 📖 Examples

The showcase demonstrates testing across multiple frameworks:

### React + TypeScript
- Vitest unit testing
- Playwright E2E testing
- React Testing Library
- MSW API mocking

### FastAPI + Python
- Pytest with asyncio
- SQLAlchemy testing
- Pydantic validation
- httpx test client

### WordPress + PHP
- PHPUnit testing
- WordPress test suite
- WP-CLI integration
- Brain Monkey mocking

## 🐛 Troubleshooting

### Docker Issues

```bash
# Clean up containers and volumes
docker-compose down -v
docker system prune -f

# Rebuild images
docker-compose build --no-cache
```

### Development Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset test environment
npm run test -- --clearCache
```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
services:
  pa-qa-showcase:
    ports:
      - "3005:3000"  # Change external port
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js 14](https://nextjs.org/)
- Testing with [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Documentation with [MDX](https://mdxjs.com/)
- Icons by [Lucide React](https://lucide.dev/)

---

**Ready to transform your testing workflow?** 🚀

Get started with: `docker-compose up -d` and visit [http://localhost:3005](http://localhost:3005)