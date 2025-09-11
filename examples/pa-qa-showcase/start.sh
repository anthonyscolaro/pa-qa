#!/bin/bash

# PA-QA Showcase Startup Script
# This script provides an easy way to start the PA-QA Testing Showcase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    PA-QA Testing Showcase                   ║"
echo "║                                                              ║"
echo "║  A comprehensive testing framework showcase built with       ║"
echo "║  Next.js 14, featuring interactive documentation and        ║"
echo "║  real-world examples for modern web development.            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose is available${NC}"
}

# Function to display help
show_help() {
    echo -e "${YELLOW}Usage: $0 [OPTION]${NC}"
    echo ""
    echo "Options:"
    echo "  prod        Start production environment (default)"
    echo "  dev         Start development environment with hot reload"
    echo "  test        Run test suite"
    echo "  all         Start all services (dev + test)"
    echo "  stop        Stop all services"
    echo "  clean       Clean up containers and volumes"
    echo "  logs        Show logs from running containers"
    echo "  status      Show status of running containers"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Start production environment"
    echo "  $0 dev          # Start development environment"
    echo "  $0 test         # Run tests"
    echo "  $0 clean        # Clean up everything"
}

# Function to start production environment
start_prod() {
    echo -e "${YELLOW}🚀 Starting production environment...${NC}"
    docker compose up -d pa-qa-showcase
    echo ""
    echo -e "${GREEN}✅ Production environment started!${NC}"
    echo -e "${BLUE}📱 Application: http://localhost:3005${NC}"
}

# Function to start development environment
start_dev() {
    echo -e "${YELLOW}🛠️  Starting development environment...${NC}"
    docker compose --profile dev up -d pa-qa-dev
    echo ""
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo -e "${BLUE}📱 Application: http://localhost:3006${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running test suite...${NC}"
    docker compose --profile test up --abort-on-container-exit pa-qa-tests
}

# Function to start all services
start_all() {
    echo -e "${YELLOW}🌟 Starting all services...${NC}"
    docker compose --profile dev --profile test up -d
    echo ""
    echo -e "${GREEN}✅ All services started!${NC}"
    echo -e "${BLUE}📱 Production: http://localhost:3005${NC}"
    echo -e "${BLUE}📱 Development: http://localhost:3006${NC}"
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    docker compose down
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Function to clean up
clean_up() {
    echo -e "${YELLOW}🧹 Cleaning up containers and volumes...${NC}"
    docker compose down -v
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}📋 Showing logs from running containers...${NC}"
    docker compose logs -f
}

# Function to show status
show_status() {
    echo -e "${YELLOW}📊 Container status:${NC}"
    echo ""
    docker compose ps
    echo ""
    echo -e "${YELLOW}📊 Docker system status:${NC}"
    docker system df
}

# Main script logic
case "${1:-prod}" in
    "prod")
        check_docker
        check_docker_compose
        start_prod
        ;;
    "dev")
        check_docker
        check_docker_compose
        start_dev
        ;;
    "test")
        check_docker
        check_docker_compose
        run_tests
        ;;
    "all")
        check_docker
        check_docker_compose
        start_all
        ;;
    "stop")
        stop_services
        ;;
    "clean")
        clean_up
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Invalid option: $1${NC}"
        show_help
        exit 1
        ;;
esac

# Post-execution status
if [[ "$1" == "prod" || "$1" == "dev" || "$1" == "all" || -z "$1" ]]; then
    echo ""
    echo -e "${YELLOW}💡 Useful commands:${NC}"
    echo "  $0 stop     # Stop all services"
    echo "  $0 logs     # View logs"
    echo "  $0 status   # Check status"
    echo "  $0 clean    # Clean up everything"
    echo ""
    echo -e "${GREEN}🎉 PA-QA Testing Showcase is ready!${NC}"
fi