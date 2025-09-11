#!/bin/bash

# Upload Results Script for Centralized Allure Dashboard
# 
# This script uploads test results to the centralized Allure dashboard
# at https://allure.projectassistant.ai
# 
# Features:
# - Secure authentication via API key
# - Automatic project detection
# - History preservation
# - Retry mechanism for reliability
# - Notification integration
# - Multi-format support (Jest, Vitest, Pytest, PHPUnit)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALLURE_SERVER_URL="${ALLURE_SERVER_URL:-https://allure.projectassistant.ai}"
API_ENDPOINT="${ALLURE_SERVER_URL}/api/v1"
MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_DELAY="${RETRY_DELAY:-5}"
TIMEOUT="${TIMEOUT:-300}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Upload test results to centralized Allure dashboard.

OPTIONS:
    -p, --project PROJECT_NAME    Project name (required)
    -r, --results RESULTS_DIR     Results directory (default: allure-results)
    -f, --framework FRAMEWORK     Test framework (jest|vitest|pytest|phpunit)
    -b, --build BUILD_NUMBER      Build number for CI/CD
    -u, --branch BRANCH_NAME      Git branch name
    -c, --commit COMMIT_SHA       Git commit SHA
    -e, --environment ENV_NAME    Environment name (dev|staging|prod)
    -k, --api-key API_KEY         API key for authentication
    -n, --notify                  Send notifications on completion
    -v, --verbose                 Enable verbose logging
    -h, --help                    Show this help message

ENVIRONMENT VARIABLES:
    ALLURE_API_KEY               API key for dashboard authentication
    ALLURE_PROJECT_NAME          Default project name
    ALLURE_RESULTS_DIR           Default results directory
    ALLURE_SERVER_URL            Dashboard server URL
    CI_BUILD_NUMBER              CI build number
    CI_BRANCH                    CI branch name
    CI_COMMIT_SHA                CI commit SHA
    GITHUB_RUN_NUMBER            GitHub Actions run number
    GITHUB_REF_NAME              GitHub branch name
    GITHUB_SHA                   GitHub commit SHA

EXAMPLES:
    # Basic upload
    $0 -p my-project -r ./allure-results

    # CI/CD upload with all metadata
    $0 -p my-project -f jest -b \$BUILD_NUMBER -u \$BRANCH -c \$COMMIT_SHA

    # Upload with notifications
    $0 -p my-project -r ./test-results --notify

EOF
}

# Parse command line arguments
parse_arguments() {
    PROJECT_NAME="${ALLURE_PROJECT_NAME:-}"
    RESULTS_DIR="${ALLURE_RESULTS_DIR:-allure-results}"
    FRAMEWORK=""
    BUILD_NUMBER="${CI_BUILD_NUMBER:-${GITHUB_RUN_NUMBER:-}}"
    BRANCH_NAME="${CI_BRANCH:-${GITHUB_REF_NAME:-}}"
    COMMIT_SHA="${CI_COMMIT_SHA:-${GITHUB_SHA:-}}"
    ENVIRONMENT="${ENVIRONMENT:-}"
    API_KEY="${ALLURE_API_KEY:-}"
    SEND_NOTIFICATIONS=false
    VERBOSE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--project)
                PROJECT_NAME="$2"
                shift 2
                ;;
            -r|--results)
                RESULTS_DIR="$2"
                shift 2
                ;;
            -f|--framework)
                FRAMEWORK="$2"
                shift 2
                ;;
            -b|--build)
                BUILD_NUMBER="$2"
                shift 2
                ;;
            -u|--branch)
                BRANCH_NAME="$2"
                shift 2
                ;;
            -c|--commit)
                COMMIT_SHA="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -k|--api-key)
                API_KEY="$2"
                shift 2
                ;;
            -n|--notify)
                SEND_NOTIFICATIONS=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate required parameters
    if [[ -z "$PROJECT_NAME" ]]; then
        log_error "Project name is required. Use -p/--project or set ALLURE_PROJECT_NAME"
        exit 1
    fi

    if [[ -z "$API_KEY" ]]; then
        log_error "API key is required. Use -k/--api-key or set ALLURE_API_KEY"
        exit 1
    fi

    if [[ ! -d "$RESULTS_DIR" ]]; then
        log_error "Results directory does not exist: $RESULTS_DIR"
        exit 1
    fi
}

# Auto-detect test framework based on results directory contents
detect_framework() {
    if [[ -n "$FRAMEWORK" ]]; then
        return 0
    fi

    log_info "Auto-detecting test framework..."

    if [[ -f "$RESULTS_DIR/jest-junit.xml" ]] || find "$RESULTS_DIR" -name "*jest*" -type f | grep -q .; then
        FRAMEWORK="jest"
    elif [[ -f "$RESULTS_DIR/vitest-results.json" ]] || find "$RESULTS_DIR" -name "*vitest*" -type f | grep -q .; then
        FRAMEWORK="vitest"
    elif [[ -f "$RESULTS_DIR/pytest.xml" ]] || find "$RESULTS_DIR" -name "*pytest*" -type f | grep -q .; then
        FRAMEWORK="pytest"
    elif [[ -f "$RESULTS_DIR/junit.xml" ]] || find "$RESULTS_DIR" -name "*phpunit*" -type f | grep -q .; then
        FRAMEWORK="phpunit"
    else
        FRAMEWORK="unknown"
    fi

    log_info "Detected framework: $FRAMEWORK"
}

# Validate results directory structure
validate_results() {
    log_info "Validating results directory: $RESULTS_DIR"

    local result_files
    result_files=$(find "$RESULTS_DIR" -name "*.json" -o -name "*.xml" 2>/dev/null | wc -l)

    if [[ $result_files -eq 0 ]]; then
        log_error "No test result files found in $RESULTS_DIR"
        exit 1
    fi

    log_info "Found $result_files result files"

    # Check for common Allure files
    local allure_files=0
    for file in "environment.properties" "executor.json" "categories.json"; do
        if [[ -f "$RESULTS_DIR/$file" ]]; then
            ((allure_files++))
        fi
    done

    log_info "Found $allure_files Allure metadata files"
}

# Create upload metadata
create_metadata() {
    log_info "Creating upload metadata..."

    local metadata_file="$RESULTS_DIR/upload-metadata.json"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    cat > "$metadata_file" << EOF
{
  "project": "$PROJECT_NAME",
  "framework": "$FRAMEWORK",
  "buildNumber": "$BUILD_NUMBER",
  "branchName": "$BRANCH_NAME",
  "commitSha": "$COMMIT_SHA",
  "environment": "$ENVIRONMENT",
  "uploadTimestamp": "$timestamp",
  "uploader": {
    "tool": "pa-qa-upload-script",
    "version": "1.0.0",
    "user": "${USER:-unknown}",
    "hostname": "${HOSTNAME:-$(hostname)}"
  },
  "ci": {
    "isCI": "${CI:-false}",
    "provider": "${CI_PROVIDER:-${GITHUB_ACTIONS:+github}:-local}",
    "jobUrl": "${CI_JOB_URL:-${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}:-}",
    "pipelineUrl": "${CI_PIPELINE_URL:-${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}:-}"
  }
}
EOF

    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Metadata content:"
        cat "$metadata_file"
    fi
}

# Compress results for upload
compress_results() {
    log_info "Compressing results for upload..."

    local archive_name="allure-results-${PROJECT_NAME}-${BUILD_NUMBER:-$(date +%s)}.tar.gz"
    local archive_path="/tmp/$archive_name"

    # Create compressed archive
    tar -czf "$archive_path" -C "$(dirname "$RESULTS_DIR")" "$(basename "$RESULTS_DIR")"

    if [[ ! -f "$archive_path" ]]; then
        log_error "Failed to create archive: $archive_path"
        exit 1
    fi

    local archive_size=$(du -h "$archive_path" | cut -f1)
    log_info "Archive created: $archive_path ($archive_size)"

    echo "$archive_path"
}

# Upload results with retry mechanism
upload_with_retry() {
    local archive_path="$1"
    local attempt=1

    while [[ $attempt -le $MAX_RETRIES ]]; do
        log_info "Upload attempt $attempt/$MAX_RETRIES..."

        if upload_results "$archive_path"; then
            log_success "Upload completed successfully"
            return 0
        else
            log_warn "Upload attempt $attempt failed"
            if [[ $attempt -lt $MAX_RETRIES ]]; then
                log_info "Retrying in $RETRY_DELAY seconds..."
                sleep "$RETRY_DELAY"
            fi
        fi

        ((attempt++))
    done

    log_error "All upload attempts failed"
    return 1
}

# Upload results to dashboard
upload_results() {
    local archive_path="$1"
    local upload_url="$API_ENDPOINT/projects/$PROJECT_NAME/results"

    log_info "Uploading to: $upload_url"

    # Prepare curl command
    local curl_cmd=(
        curl
        --silent
        --show-error
        --fail
        --max-time "$TIMEOUT"
        --header "Authorization: Bearer $API_KEY"
        --header "Content-Type: multipart/form-data"
        --form "results=@$archive_path"
        --form "project=$PROJECT_NAME"
        --form "framework=$FRAMEWORK"
        --form "buildNumber=$BUILD_NUMBER"
        --form "branchName=$BRANCH_NAME"
        --form "commitSha=$COMMIT_SHA"
        --form "environment=$ENVIRONMENT"
    )

    if [[ "$VERBOSE" == "true" ]]; then
        curl_cmd+=(--verbose)
    fi

    curl_cmd+=("$upload_url")

    # Execute upload
    local response
    if response=$("${curl_cmd[@]}" 2>&1); then
        log_info "Server response: $response"
        
        # Parse response to get report URL
        local report_url
        report_url=$(echo "$response" | grep -o '"reportUrl":"[^"]*"' | sed 's/"reportUrl":"\([^"]*\)"/\1/' | head -1)
        
        if [[ -n "$report_url" ]]; then
            log_success "Report available at: $report_url"
            echo "$report_url" > "/tmp/allure-report-url.txt"
        fi

        return 0
    else
        log_error "Upload failed: $response"
        return 1
    fi
}

# Send notifications
send_notifications() {
    if [[ "$SEND_NOTIFICATIONS" != "true" ]]; then
        return 0
    fi

    log_info "Sending notifications..."

    local report_url
    if [[ -f "/tmp/allure-report-url.txt" ]]; then
        report_url=$(cat "/tmp/allure-report-url.txt")
    else
        report_url="$ALLURE_SERVER_URL/$PROJECT_NAME"
    fi

    # Call notification script if available
    local notification_script="$SCRIPT_DIR/notifications.js"
    if [[ -f "$notification_script" ]] && command -v node >/dev/null 2>&1; then
        node "$notification_script" \
            --project "$PROJECT_NAME" \
            --framework "$FRAMEWORK" \
            --build "$BUILD_NUMBER" \
            --branch "$BRANCH_NAME" \
            --report-url "$report_url" \
            --status "success"
    else
        log_warn "Notification script not found or Node.js not available"
    fi
}

# Cleanup temporary files
cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove temporary archive
    if [[ -n "${archive_path:-}" ]] && [[ -f "$archive_path" ]]; then
        rm -f "$archive_path"
    fi
    
    # Remove temporary files
    rm -f "/tmp/allure-report-url.txt"
}

# Main execution
main() {
    local start_time=$(date +%s)

    log_info "Starting Allure results upload..."
    log_info "Dashboard: $ALLURE_SERVER_URL"

    # Parse arguments
    parse_arguments "$@"

    # Set up cleanup trap
    trap cleanup EXIT

    # Validate inputs
    validate_results
    detect_framework
    create_metadata

    # Upload process
    local archive_path
    archive_path=$(compress_results)

    if upload_with_retry "$archive_path"; then
        send_notifications
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "Upload completed in ${duration}s"
        log_success "Project: $PROJECT_NAME"
        log_success "Framework: $FRAMEWORK"
        log_success "Build: $BUILD_NUMBER"
        log_success "Dashboard: $ALLURE_SERVER_URL/$PROJECT_NAME"
        
        exit 0
    else
        log_error "Upload failed after $MAX_RETRIES attempts"
        exit 1
    fi
}

# Execute main function with all arguments
main "$@"