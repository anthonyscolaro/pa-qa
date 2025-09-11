# PA-QA Showcase Docker Configuration

This directory contains comprehensive Docker configurations for the PA-QA Testing Showcase application, designed for development, testing, and production environments.

## 🏗️ Architecture Overview

### Multi-Environment Support
- **Development**: Hot reload, debugging tools, development databases
- **Testing**: Isolated test environment with Playwright, browser support
- **Production**: Optimized multi-stage builds, monitoring, security hardening

### Services Included
- **Application**: Next.js application with SSR/SSG
- **Database**: PostgreSQL with proper initialization
- **Cache**: Redis for session storage and caching
- **Proxy**: Nginx with SSL termination and load balancing
- **Monitoring**: Prometheus, Grafana, Loki for observability
- **Email**: Mailhog for development email testing
- **Storage**: MinIO for S3-compatible object storage

## 🚀 Quick Start

### Development Environment
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f app

# Access services
# - Application: http://localhost:3000
# - Database: localhost:5432
# - Redis: localhost:6379
# - Mailhog: http://localhost:8025
# - MinIO: http://localhost:9001
```

### Testing Environment
```bash
# Run all tests
docker-compose -f docker-compose.test.yml up --build

# Run specific test types
docker-compose -f docker-compose.test.yml up unit-tests
docker-compose -f docker-compose.test.yml up e2e-tests
docker-compose -f docker-compose.test.yml up performance-tests

# View test results
# - Allure Reports: http://localhost:5050
# - Coverage Reports: http://localhost:8080
```

### Production Environment
```bash
# Set environment variables
export POSTGRES_PASSWORD="secure-password"
export REDIS_PASSWORD="secure-redis-password"
export NEXTAUTH_SECRET="secure-nextauth-secret"
export NEXTAUTH_URL="https://your-domain.com"

# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d

# Monitor services
# - Application: https://your-domain.com
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001
```

## 📁 File Structure

```
docker/
├── Dockerfile.dev           # Development container with hot reload
├── Dockerfile.test          # Testing container with Playwright
├── Dockerfile.prod          # Production multi-stage build
├── entrypoint.sh           # Container initialization script
├── healthcheck.sh          # Health check script
├── backup.sh               # Database backup script
├── nginx.dev.conf          # Development Nginx configuration
├── nginx.prod.conf         # Production Nginx configuration
├── redis.conf              # Development Redis configuration
├── redis.prod.conf         # Production Redis configuration
├── init.sql                # Development database initialization
├── init-test.sql           # Test database initialization
└── README.md               # This file

kubernetes/
└── deployment.yml          # Kubernetes deployment manifests

# Root level
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── docker-compose.test.yml # Testing environment
└── .dockerignore           # Docker build optimization
```

## 🛠️ Configuration Details

### Dockerfiles

#### Development (`Dockerfile.dev`)
- Based on Node.js 20 Alpine
- Hot reload support with volume mounts
- Development dependencies included
- Non-root user for security
- Health checks enabled

#### Testing (`Dockerfile.test`)
- Based on Microsoft Playwright image
- All browsers pre-installed
- Support for headless and headed testing
- Parallel test execution
- Test result artifact collection

#### Production (`Dockerfile.prod`)
- Multi-stage build for optimization
- Production dependencies only
- Static file optimization
- Security hardening
- Minimal attack surface

### Environment Variables

#### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@postgres:5432/pa_qa_dev
REDIS_URL=redis://redis:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key
```

#### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/pa_qa_prod
REDIS_URL=redis://redis:6379
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
```

### Security Features

#### Production Security
- Non-root containers
- Read-only root filesystems where possible
- Security contexts and capability drops
- SSL/TLS termination
- Rate limiting
- Security headers
- Resource limits

#### Network Security
- Custom bridge networks
- Service isolation
- No exposed databases in production
- Proper firewall rules

### Monitoring & Observability

#### Metrics Collection
- Prometheus for metrics scraping
- Grafana for visualization
- Custom dashboards included
- Alert rules configured

#### Logging
- Centralized logging with Loki
- Structured JSON logging
- Log retention policies
- Error tracking

#### Health Checks
- Application health endpoints
- Database connectivity checks
- Redis availability checks
- Load balancer health checks

### Backup Strategy

#### Automated Backups
- Daily PostgreSQL backups
- 30-day retention policy
- Compressed backup files
- Backup verification

#### Backup Commands
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec backup /backup.sh

# Restore from backup
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d pa_qa_prod < /backups/backup_YYYYMMDD_HHMMSS.sql
```

## 🧪 Testing Configuration

### Test Types Supported
1. **Unit Tests**: Jest with React Testing Library
2. **Integration Tests**: API endpoint testing
3. **E2E Tests**: Playwright with multiple browsers
4. **Performance Tests**: K6 load testing
5. **Accessibility Tests**: Axe-core integration

### Test Execution
```bash
# Run all tests in parallel
docker-compose -f docker-compose.test.yml up --build

# Run tests individually
docker-compose -f docker-compose.test.yml run unit-tests
docker-compose -f docker-compose.test.yml run integration-tests
docker-compose -f docker-compose.test.yml run e2e-tests
docker-compose -f docker-compose.test.yml run performance-tests
docker-compose -f docker-compose.test.yml run accessibility-tests
```

### Test Reports
- **Allure Reports**: Comprehensive test reporting
- **Coverage Reports**: Code coverage visualization
- **Performance Reports**: Load testing results
- **Accessibility Reports**: WCAG compliance checks

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (v1.20+)
- kubectl configured
- Cert-manager for SSL certificates
- Nginx Ingress Controller

### Deployment Steps
```bash
# Apply all manifests
kubectl apply -f kubernetes/deployment.yml

# Check deployment status
kubectl get pods -n pa-qa-showcase

# View logs
kubectl logs -f deployment/app-deployment -n pa-qa-showcase

# Scale deployment
kubectl scale deployment app-deployment --replicas=5 -n pa-qa-showcase
```

### Kubernetes Features
- **Namespace isolation**
- **Horizontal Pod Autoscaling**
- **Pod Disruption Budgets**
- **Resource limits and requests**
- **Health checks and probes**
- **Service mesh ready**
- **RBAC configuration**

## 🔧 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check health status
docker-compose ps

# Rebuild without cache
docker-compose build --no-cache
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Check network connectivity
docker-compose exec app nc -z postgres 5432
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $(id -u):$(id -g) .

# Check container user
docker-compose exec app id
```

### Performance Optimization

#### Development
- Use volume mounts for hot reload
- Limit resource usage with Docker Desktop
- Use .dockerignore for faster builds

#### Production
- Enable all caching layers
- Use CDN for static assets
- Monitor resource usage
- Implement proper scaling policies

## 📊 Monitoring Dashboards

### Grafana Dashboards
1. **Application Metrics**: Response times, error rates
2. **Infrastructure Metrics**: CPU, memory, disk usage
3. **Database Metrics**: Connection pools, query performance
4. **Business Metrics**: User activity, feature usage

### Prometheus Alerts
- High error rates
- Memory/CPU usage thresholds
- Database connection issues
- Slow response times

## 🔒 Security Considerations

### Container Security
- Regular base image updates
- Vulnerability scanning
- Secrets management
- Network policies

### Application Security
- Environment variable validation
- HTTPS enforcement
- CSRF protection
- Rate limiting

### Data Security
- Encrypted connections
- Backup encryption
- Access controls
- Audit logging

## 📈 Scaling Strategies

### Horizontal Scaling
- Load balancer configuration
- Session affinity
- Database read replicas
- Cache clustering

### Vertical Scaling
- Resource monitoring
- Performance profiling
- Bottleneck identification
- Capacity planning

---

This Docker configuration provides a robust foundation for developing, testing, and deploying the PA-QA Testing Showcase application with industry-standard practices for security, monitoring, and scalability.