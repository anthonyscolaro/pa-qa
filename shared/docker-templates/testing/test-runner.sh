#!/bin/bash

# PA-QA Docker Test Runner Script
# Orchestrates test execution across different environments and project types
# Supports parallel execution, monitoring, and result aggregation

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DOCKER_DIR="$SCRIPT_DIR"
RESULTS_DIR="$PROJECT_ROOT/test-results"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
PROJECT_TYPE="auto"
TEST_SUITE="all"
ENVIRONMENT="local"
PARALLEL=true
CLEANUP_AFTER=true
UPLOAD_ALLURE=true
VERBOSE=false
DRY_RUN=false
TIMEOUT=3600  # 1 hour default timeout

# Function to print colored output
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print usage information
usage() {
    cat << EOF
PA-QA Docker Test Runner

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -t, --type TYPE         Project type (node|python|php|wordpress|react|fastapi|auto)
    -s, --suite SUITE       Test suite (unit|integration|e2e|performance|load|security|all)
    -e, --env ENV          Environment (local|ci|k8s)
    -p, --parallel         Run tests in parallel (default: true)
    --no-parallel          Disable parallel execution
    -c, --cleanup          Cleanup after tests (default: true)
    --no-cleanup           Skip cleanup after tests
    -u, --upload-allure    Upload results to Allure (default: true)
    --no-upload-allure     Skip Allure upload
    -v, --verbose          Verbose output
    -n, --dry-run          Show what would be executed without running
    --timeout SECONDS      Test timeout in seconds (default: 3600)
    -h, --help             Show this help message

EXAMPLES:
    # Run all tests for auto-detected project type
    $0

    # Run only unit tests for React project
    $0 --type react --suite unit

    # Run E2E tests in parallel with verbose output
    $0 --suite e2e --parallel --verbose

    # Run performance tests in Kubernetes
    $0 --suite performance --env k8s

    # Dry run to see what would be executed
    $0 --type fastapi --suite all --dry-run

ENVIRONMENT VARIABLES:
    PA_QA_PROJECT_TYPE      Override project type detection
    PA_QA_ALLURE_URL        Allure server URL (default: https://allure.projectassistant.ai)
    PA_QA_DOCKER_REGISTRY   Docker registry for custom images
    DOCKER_BUILDKIT         Enable Docker BuildKit (recommended: 1)

EOF
}

# Function to detect project type
detect_project_type() {
    if [[ -n "${PA_QA_PROJECT_TYPE:-}" ]]; then
        echo "$PA_QA_PROJECT_TYPE"
        return
    fi

    local detected="unknown"
    
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        if grep -q "react" "$PROJECT_ROOT/package.json"; then
            detected="react"
        elif grep -q "vue" "$PROJECT_ROOT/package.json"; then
            detected="vue"
        elif grep -q "angular" "$PROJECT_ROOT/package.json"; then
            detected="angular"
        else
            detected="node"
        fi
    elif [[ -f "$PROJECT_ROOT/requirements.txt" ]] || [[ -f "$PROJECT_ROOT/pyproject.toml" ]]; then
        if grep -q "fastapi\|uvicorn" "$PROJECT_ROOT/requirements.txt" "$PROJECT_ROOT/pyproject.toml" 2>/dev/null; then
            detected="fastapi"
        elif grep -q "django" "$PROJECT_ROOT/requirements.txt" "$PROJECT_ROOT/pyproject.toml" 2>/dev/null; then
            detected="django"
        else
            detected="python"
        fi
    elif [[ -f "$PROJECT_ROOT/composer.json" ]]; then
        if grep -q "wordpress" "$PROJECT_ROOT/composer.json" || [[ -f "$PROJECT_ROOT/wp-config.php" ]]; then
            detected="wordpress"
        elif grep -q "laravel" "$PROJECT_ROOT/composer.json"; then
            detected="laravel"
        else
            detected="php"
        fi
    fi
    
    echo "$detected"
}

# Function to validate project type
validate_project_type() {
    local type=$1
    case $type in
        node|react|vue|angular|python|fastapi|django|php|wordpress|laravel|auto)
            return 0
            ;;
        *)
            print_colored "$RED" "Error: Invalid project type '$type'"
            print_colored "$YELLOW" "Valid types: node, react, vue, angular, python, fastapi, django, php, wordpress, laravel, auto"
            exit 1
            ;;
    esac
}

# Function to validate test suite
validate_test_suite() {
    local suite=$1
    case $suite in
        unit|integration|e2e|performance|load|security|quality|all)
            return 0
            ;;
        *)
            print_colored "$RED" "Error: Invalid test suite '$suite'"
            print_colored "$YELLOW" "Valid suites: unit, integration, e2e, performance, load, security, quality, all"
            exit 1
            ;;
    esac
}

# Function to setup test environment
setup_environment() {
    print_colored "$BLUE" "Setting up test environment..."
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"/{unit,integration,e2e,performance,load,security,quality}
    mkdir -p "$RESULTS_DIR"/{coverage,allure-results,screenshots,videos,reports}
    
    # Set Docker BuildKit
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        print_colored "$RED" "Error: Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_colored "$RED" "Error: Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Detect compose command
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    print_colored "$GREEN" "Environment setup complete"
}

# Function to build test images
build_test_images() {
    local project_type=$1
    print_colored "$BLUE" "Building test images for $project_type..."
    
    case $project_type in
        node|react|vue|angular)
            build_dockerfile "node-test.Dockerfile" "pa-qa/node-test"
            ;;
        python|fastapi|django)
            build_dockerfile "python-test.Dockerfile" "pa-qa/python-test"
            ;;
        php|wordpress|laravel)
            build_dockerfile "php-test.Dockerfile" "pa-qa/php-test"
            ;;
    esac
}

# Function to build individual Dockerfile
build_dockerfile() {
    local dockerfile=$1
    local image_name=$2
    
    print_colored "$CYAN" "Building $image_name..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would execute: docker build -f $DOCKER_DIR/$dockerfile -t $image_name $PROJECT_ROOT"
        return
    fi
    
    docker build \
        -f "$DOCKER_DIR/$dockerfile" \
        -t "$image_name" \
        "$PROJECT_ROOT" || {
        print_colored "$RED" "Failed to build $image_name"
        exit 1
    }
    
    print_colored "$GREEN" "Successfully built $image_name"
}

# Function to start services
start_services() {
    print_colored "$BLUE" "Starting service dependencies..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would execute: $COMPOSE_CMD -f $DOCKER_DIR/docker-compose.services.yml up -d"
        return
    fi
    
    $COMPOSE_CMD -f "$DOCKER_DIR/docker-compose.services.yml" up -d
    
    # Wait for services to be ready
    print_colored "$YELLOW" "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
}

# Function to check service health
check_service_health() {
    local services=("postgres" "mysql" "redis")
    
    for service in "${services[@]}"; do
        print_colored "$CYAN" "Checking $service health..."
        
        local retries=30
        while [[ $retries -gt 0 ]]; do
            if docker-compose -f "$DOCKER_DIR/docker-compose.services.yml" ps "$service" | grep -q "healthy\|Up"; then
                print_colored "$GREEN" "$service is healthy"
                break
            fi
            
            retries=$((retries - 1))
            if [[ $retries -eq 0 ]]; then
                print_colored "$RED" "$service failed to become healthy"
                return 1
            fi
            
            sleep 2
        done
    done
}

# Function to run tests
run_tests() {
    local project_type=$1
    local test_suite=$2
    
    print_colored "$BLUE" "Running $test_suite tests for $project_type..."
    
    case $ENVIRONMENT in
        local)
            run_local_tests "$project_type" "$test_suite"
            ;;
        ci)
            run_ci_tests "$project_type" "$test_suite"
            ;;
        k8s)
            run_k8s_tests "$project_type" "$test_suite"
            ;;
    esac
}

# Function to run local tests
run_local_tests() {
    local project_type=$1
    local test_suite=$2
    
    local compose_file="$DOCKER_DIR/docker-compose.test.yml"
    local profiles=""
    
    # Determine which profiles to run
    case $test_suite in
        unit)
            profiles="$project_type"
            ;;
        integration)
            profiles="$project_type,services"
            ;;
        e2e)
            profiles="$project_type,e2e,app,services"
            ;;
        performance)
            profiles="$project_type,performance,app,services"
            ;;
        load)
            profiles="$project_type,load,app,services"
            ;;
        security)
            profiles="$project_type,services"
            ;;
        all)
            profiles="all"
            ;;
    esac
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would execute: COMPOSE_PROFILES=$profiles $COMPOSE_CMD -f $compose_file up --abort-on-container-exit"
        return
    fi
    
    # Run tests with timeout
    if [[ "$PARALLEL" == "true" ]]; then
        timeout "$TIMEOUT" env COMPOSE_PROFILES="$profiles" $COMPOSE_CMD -f "$compose_file" up --abort-on-container-exit
    else
        timeout "$TIMEOUT" env COMPOSE_PROFILES="$profiles" $COMPOSE_CMD -f "$compose_file" up --abort-on-container-exit --scale node-tests=1 --scale python-tests=1 --scale php-tests=1
    fi
    
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        print_colored "$GREEN" "Tests completed successfully"
    elif [[ $exit_code -eq 124 ]]; then
        print_colored "$RED" "Tests timed out after $TIMEOUT seconds"
    else
        print_colored "$RED" "Tests failed with exit code $exit_code"
    fi
    
    return $exit_code
}

# Function to run CI tests
run_ci_tests() {
    local project_type=$1
    local test_suite=$2
    
    print_colored "$BLUE" "Running tests in CI mode..."
    
    # Set CI-specific environment variables
    export CI=true
    export NODE_ENV=test
    export ENVIRONMENT=test
    
    run_local_tests "$project_type" "$test_suite"
}

# Function to run Kubernetes tests
run_k8s_tests() {
    local project_type=$1
    local test_suite=$2
    
    print_colored "$BLUE" "Running tests in Kubernetes..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would execute: kubectl apply -f $DOCKER_DIR/k8s-test-pod.yml"
        return
    fi
    
    # Apply Kubernetes configuration
    kubectl apply -f "$DOCKER_DIR/k8s-test-pod.yml"
    
    # Wait for jobs to complete
    print_colored "$YELLOW" "Waiting for Kubernetes jobs to complete..."
    kubectl wait --for=condition=complete --timeout="${TIMEOUT}s" job/node-tests job/python-tests job/php-tests -n pa-qa-testing
    
    # Get job status
    local exit_code=0
    for job in node-tests python-tests php-tests; do
        local status=$(kubectl get job "$job" -n pa-qa-testing -o jsonpath='{.status.conditions[0].type}')
        if [[ "$status" != "Complete" ]]; then
            print_colored "$RED" "Job $job failed"
            exit_code=1
        fi
    done
    
    return $exit_code
}

# Function to collect test results
collect_results() {
    print_colored "$BLUE" "Collecting test results..."
    
    # Copy results from containers
    case $ENVIRONMENT in
        local)
            collect_local_results
            ;;
        k8s)
            collect_k8s_results
            ;;
    esac
    
    # Generate summary report
    generate_summary_report
}

# Function to collect local test results
collect_local_results() {
    local containers=(
        "pa-qa-node-tests:/app/test-results"
        "pa-qa-python-tests:/app/test-results"
        "pa-qa-php-tests:/var/www/html/test-results"
    )
    
    for container_path in "${containers[@]}"; do
        local container=$(echo "$container_path" | cut -d: -f1)
        local path=$(echo "$container_path" | cut -d: -f2)
        
        if docker ps -a --format "table {{.Names}}" | grep -q "$container"; then
            print_colored "$CYAN" "Collecting results from $container..."
            docker cp "$container:$path" "$RESULTS_DIR/" 2>/dev/null || true
        fi
    done
}

# Function to collect Kubernetes test results
collect_k8s_results() {
    local pods=$(kubectl get pods -n pa-qa-testing -l app=node-tests,python-tests,php-tests -o name)
    
    for pod in $pods; do
        print_colored "$CYAN" "Collecting results from $pod..."
        kubectl cp "pa-qa-testing/$pod:/app/test-results" "$RESULTS_DIR/" 2>/dev/null || true
    done
}

# Function to generate summary report
generate_summary_report() {
    local summary_file="$RESULTS_DIR/test-summary-$TIMESTAMP.json"
    
    print_colored "$BLUE" "Generating test summary report..."
    
    cat > "$summary_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "project_type": "$PROJECT_TYPE",
  "test_suite": "$TEST_SUITE",
  "environment": "$ENVIRONMENT",
  "parallel": $PARALLEL,
  "timeout": $TIMEOUT,
  "results": {
EOF

    # Count test results
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    # Parse JUnit XML files for test counts
    for junit_file in "$RESULTS_DIR"/*.xml "$RESULTS_DIR"/**/*.xml; do
        if [[ -f "$junit_file" ]]; then
            local tests=$(xmllint --xpath "//testsuite/@tests" "$junit_file" 2>/dev/null | grep -o '[0-9]*' || echo "0")
            local failures=$(xmllint --xpath "//testsuite/@failures" "$junit_file" 2>/dev/null | grep -o '[0-9]*' || echo "0")
            
            total_tests=$((total_tests + tests))
            failed_tests=$((failed_tests + failures))
        fi
    done
    
    passed_tests=$((total_tests - failed_tests))
    
    cat >> "$summary_file" << EOF
    "total": $total_tests,
    "passed": $passed_tests,
    "failed": $failed_tests,
    "success_rate": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc -l 2>/dev/null || echo "0")
  }
}
EOF

    print_colored "$GREEN" "Test summary generated: $summary_file"
    
    # Print summary to console
    print_colored "$PURPLE" "=== TEST SUMMARY ==="
    print_colored "$CYAN" "Total Tests: $total_tests"
    print_colored "$GREEN" "Passed: $passed_tests"
    print_colored "$RED" "Failed: $failed_tests"
    print_colored "$PURPLE" "===================="
}

# Function to upload results to Allure
upload_to_allure() {
    if [[ "$UPLOAD_ALLURE" != "true" ]]; then
        return
    fi
    
    local allure_url="${PA_QA_ALLURE_URL:-https://allure.projectassistant.ai}"
    local project_name="${PWD##*/}"
    
    print_colored "$BLUE" "Uploading results to Allure at $allure_url..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would upload results to $allure_url for project $project_name"
        return
    fi
    
    # Use the shared Allure upload script
    local upload_script="$PROJECT_ROOT/shared/allure-config/upload-results.sh"
    if [[ -f "$upload_script" ]]; then
        bash "$upload_script" "$RESULTS_DIR/allure-results" "$project_name" || {
            print_colored "$YELLOW" "Warning: Failed to upload to Allure"
        }
    else
        print_colored "$YELLOW" "Warning: Allure upload script not found"
    fi
}

# Function to cleanup resources
cleanup() {
    if [[ "$CLEANUP_AFTER" != "true" ]]; then
        return
    fi
    
    print_colored "$BLUE" "Cleaning up resources..."
    
    case $ENVIRONMENT in
        local)
            $COMPOSE_CMD -f "$DOCKER_DIR/docker-compose.test.yml" down -v 2>/dev/null || true
            $COMPOSE_CMD -f "$DOCKER_DIR/docker-compose.services.yml" down -v 2>/dev/null || true
            ;;
        k8s)
            kubectl delete namespace pa-qa-testing --ignore-not-found=true
            ;;
    esac
    
    # Clean up dangling images
    docker image prune -f 2>/dev/null || true
    
    print_colored "$GREEN" "Cleanup complete"
}

# Function to handle script interruption
handle_interrupt() {
    print_colored "$YELLOW" "Script interrupted. Cleaning up..."
    cleanup
    exit 130
}

# Main execution function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                PROJECT_TYPE="$2"
                shift 2
                ;;
            -s|--suite)
                TEST_SUITE="$2"
                shift 2
                ;;
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -p|--parallel)
                PARALLEL=true
                shift
                ;;
            --no-parallel)
                PARALLEL=false
                shift
                ;;
            -c|--cleanup)
                CLEANUP_AFTER=true
                shift
                ;;
            --no-cleanup)
                CLEANUP_AFTER=false
                shift
                ;;
            -u|--upload-allure)
                UPLOAD_ALLURE=true
                shift
                ;;
            --no-upload-allure)
                UPLOAD_ALLURE=false
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -n|--dry-run)
                DRY_RUN=true
                shift
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                print_colored "$RED" "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Set verbose mode
    if [[ "$VERBOSE" == "true" ]]; then
        set -x
    fi
    
    # Detect project type if auto
    if [[ "$PROJECT_TYPE" == "auto" ]]; then
        PROJECT_TYPE=$(detect_project_type)
        print_colored "$CYAN" "Detected project type: $PROJECT_TYPE"
    fi
    
    # Validate inputs
    validate_project_type "$PROJECT_TYPE"
    validate_test_suite "$TEST_SUITE"
    
    # Set up interrupt handler
    trap handle_interrupt SIGINT SIGTERM
    
    # Print configuration
    print_colored "$PURPLE" "=== PA-QA TEST RUNNER ==="
    print_colored "$CYAN" "Project Type: $PROJECT_TYPE"
    print_colored "$CYAN" "Test Suite: $TEST_SUITE"
    print_colored "$CYAN" "Environment: $ENVIRONMENT"
    print_colored "$CYAN" "Parallel: $PARALLEL"
    print_colored "$CYAN" "Cleanup: $CLEANUP_AFTER"
    print_colored "$CYAN" "Upload Allure: $UPLOAD_ALLURE"
    print_colored "$CYAN" "Dry Run: $DRY_RUN"
    print_colored "$PURPLE" "========================="
    
    # Execute test pipeline
    local start_time=$(date +%s)
    
    setup_environment
    build_test_images "$PROJECT_TYPE"
    start_services
    
    local test_exit_code=0
    run_tests "$PROJECT_TYPE" "$TEST_SUITE" || test_exit_code=$?
    
    collect_results
    upload_to_allure
    cleanup
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_colored "$PURPLE" "=== EXECUTION COMPLETE ==="
    print_colored "$CYAN" "Duration: ${duration}s"
    print_colored "$CYAN" "Results: $RESULTS_DIR"
    
    if [[ $test_exit_code -eq 0 ]]; then
        print_colored "$GREEN" "Status: SUCCESS"
    else
        print_colored "$RED" "Status: FAILED"
    fi
    
    print_colored "$PURPLE" "=========================="
    
    exit $test_exit_code
}

# Execute main function with all arguments
main "$@"