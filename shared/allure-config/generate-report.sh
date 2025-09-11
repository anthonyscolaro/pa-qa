#!/bin/bash

# Generate Allure Report Script
# 
# This script generates local Allure reports from test results
# Supports multiple frameworks and provides enhanced reporting features
# 
# Features:
# - Framework-specific result processing
# - Historical data preservation
# - Custom report styling
# - Report server with live reload
# - Trend analysis integration
# - Multi-project support

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALLURE_VERSION="${ALLURE_VERSION:-2.24.0}"
ALLURE_INSTALL_DIR="${ALLURE_INSTALL_DIR:-/usr/local/bin}"
DEFAULT_RESULTS_DIR="allure-results"
DEFAULT_REPORT_DIR="allure-report"
DEFAULT_HISTORY_DIR="allure-history"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_debug() {
    if [[ "${VERBOSE:-false}" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1" >&2
    fi
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Generate Allure reports from test results.

OPTIONS:
    -r, --results RESULTS_DIR     Results directory (default: allure-results)
    -o, --output REPORT_DIR       Report output directory (default: allure-report)
    -h, --history HISTORY_DIR     History directory (default: allure-history)
    -p, --project PROJECT_NAME    Project name for multi-project reports
    -f, --framework FRAMEWORK     Test framework (jest|vitest|pytest|phpunit)
    -s, --serve                   Start report server after generation
    -P, --port PORT               Server port (default: 4040)
    -c, --clean                   Clean previous report and history
    -t, --trends                  Generate trend analysis
    -w, --watch                   Watch for changes and regenerate
    -v, --verbose                 Enable verbose logging
    --open                        Open report in browser
    --install                     Install/update Allure commandline
    --version                     Show Allure version
    --help                        Show this help message

EXAMPLES:
    # Basic report generation
    $0 -r ./test-results -o ./reports

    # Generate and serve report
    $0 --serve --open

    # Multi-project report with trends
    $0 -p my-project -f jest --trends --serve

    # Watch mode for development
    $0 --watch --serve --port 3000

    # Clean and regenerate everything
    $0 --clean --trends --serve

EOF
}

# Parse command line arguments
parse_arguments() {
    RESULTS_DIR="$DEFAULT_RESULTS_DIR"
    REPORT_DIR="$DEFAULT_REPORT_DIR"
    HISTORY_DIR="$DEFAULT_HISTORY_DIR"
    PROJECT_NAME="${ALLURE_PROJECT_NAME:-}"
    FRAMEWORK=""
    SERVE_REPORT=false
    SERVER_PORT="4040"
    CLEAN_PREVIOUS=false
    GENERATE_TRENDS=false
    WATCH_MODE=false
    VERBOSE=false
    OPEN_BROWSER=false
    INSTALL_ALLURE=false
    SHOW_VERSION=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--results)
                RESULTS_DIR="$2"
                shift 2
                ;;
            -o|--output)
                REPORT_DIR="$2"
                shift 2
                ;;
            -h|--history)
                HISTORY_DIR="$2"
                shift 2
                ;;
            -p|--project)
                PROJECT_NAME="$2"
                shift 2
                ;;
            -f|--framework)
                FRAMEWORK="$2"
                shift 2
                ;;
            -s|--serve)
                SERVE_REPORT=true
                shift
                ;;
            -P|--port)
                SERVER_PORT="$2"
                shift 2
                ;;
            -c|--clean)
                CLEAN_PREVIOUS=true
                shift
                ;;
            -t|--trends)
                GENERATE_TRENDS=true
                shift
                ;;
            -w|--watch)
                WATCH_MODE=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --open)
                OPEN_BROWSER=true
                shift
                ;;
            --install)
                INSTALL_ALLURE=true
                shift
                ;;
            --version)
                SHOW_VERSION=true
                shift
                ;;
            --help)
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
}

# Check if Allure is installed
check_allure_installation() {
    if command -v allure >/dev/null 2>&1; then
        local installed_version
        installed_version=$(allure --version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
        log_info "Allure commandline found: v$installed_version"
        return 0
    else
        log_warn "Allure commandline not found"
        return 1
    fi
}

# Install or update Allure commandline
install_allure() {
    log_info "Installing Allure commandline v$ALLURE_VERSION..."

    # Detect OS
    local os_type
    case "$(uname -s)" in
        Darwin*)
            if command -v brew >/dev/null 2>&1; then
                log_info "Installing via Homebrew..."
                brew install allure
                return 0
            else
                os_type="mac"
            fi
            ;;
        Linux*)
            os_type="linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            os_type="windows"
            ;;
        *)
            log_error "Unsupported operating system"
            exit 1
            ;;
    esac

    # Manual installation
    local download_url="https://github.com/allure-framework/allure2/releases/download/$ALLURE_VERSION/allure-$ALLURE_VERSION.tgz"
    local temp_dir="/tmp/allure-install"
    local allure_dir="/opt/allure-$ALLURE_VERSION"

    log_info "Downloading from: $download_url"

    # Create temporary directory
    mkdir -p "$temp_dir"
    cd "$temp_dir"

    # Download and extract
    if command -v wget >/dev/null 2>&1; then
        wget -O allure.tgz "$download_url"
    elif command -v curl >/dev/null 2>&1; then
        curl -L -o allure.tgz "$download_url"
    else
        log_error "Neither wget nor curl found. Cannot download Allure."
        exit 1
    fi

    tar -xzf allure.tgz

    # Install to system
    if [[ -w "/opt" ]]; then
        sudo mv "allure-$ALLURE_VERSION" "/opt/"
    else
        log_warn "Cannot write to /opt. Installing to user directory..."
        allure_dir="$HOME/.local/allure-$ALLURE_VERSION"
        mkdir -p "$HOME/.local"
        mv "allure-$ALLURE_VERSION" "$HOME/.local/"
    fi

    # Create symlink
    local bin_dir="/usr/local/bin"
    if [[ ! -w "$bin_dir" ]]; then
        bin_dir="$HOME/.local/bin"
        mkdir -p "$bin_dir"
    fi

    ln -sf "$allure_dir/bin/allure" "$bin_dir/allure"

    # Add to PATH if needed
    if [[ ":$PATH:" != *":$bin_dir:"* ]]; then
        log_info "Add $bin_dir to your PATH:"
        log_info "export PATH=\"$bin_dir:\$PATH\""
    fi

    # Cleanup
    cd - >/dev/null
    rm -rf "$temp_dir"

    log_success "Allure installed successfully"
}

# Validate results directory
validate_results() {
    if [[ ! -d "$RESULTS_DIR" ]]; then
        log_error "Results directory does not exist: $RESULTS_DIR"
        log_info "Run your tests first to generate results"
        exit 1
    fi

    local result_files
    result_files=$(find "$RESULTS_DIR" -name "*.json" -o -name "*.xml" 2>/dev/null | wc -l)

    if [[ $result_files -eq 0 ]]; then
        log_error "No test result files found in $RESULTS_DIR"
        log_info "Ensure your tests are configured to output Allure results"
        exit 1
    fi

    log_info "Found $result_files result files in $RESULTS_DIR"
}

# Auto-detect test framework
detect_framework() {
    if [[ -n "$FRAMEWORK" ]]; then
        return 0
    fi

    log_debug "Auto-detecting test framework..."

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

# Clean previous reports and history
clean_previous() {
    if [[ "$CLEAN_PREVIOUS" != "true" ]]; then
        return 0
    fi

    log_info "Cleaning previous reports and history..."

    if [[ -d "$REPORT_DIR" ]]; then
        rm -rf "$REPORT_DIR"
        log_debug "Removed: $REPORT_DIR"
    fi

    if [[ -d "$HISTORY_DIR" ]]; then
        rm -rf "$HISTORY_DIR"
        log_debug "Removed: $HISTORY_DIR"
    fi
}

# Preserve history from previous report
preserve_history() {
    log_debug "Preserving test history..."

    # Create history directory if it doesn't exist
    mkdir -p "$HISTORY_DIR"

    # Copy history from previous report
    if [[ -d "$REPORT_DIR/history" ]]; then
        cp -r "$REPORT_DIR/history/"* "$HISTORY_DIR/" 2>/dev/null || true
        log_debug "History preserved from previous report"
    fi

    # Copy history to results for report generation
    if [[ -d "$HISTORY_DIR" ]] && [[ "$(ls -A "$HISTORY_DIR" 2>/dev/null)" ]]; then
        mkdir -p "$RESULTS_DIR/history"
        cp -r "$HISTORY_DIR/"* "$RESULTS_DIR/history/" 2>/dev/null || true
        log_debug "History copied to results directory"
    fi
}

# Create custom report configuration
create_report_config() {
    log_debug "Creating custom report configuration..."

    local config_dir="$RESULTS_DIR"
    mkdir -p "$config_dir"

    # Create categories.json for test categorization
    cat > "$config_dir/categories.json" << EOF
[
  {
    "name": "Product defects",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*Assertion.*|.*AssertionError.*|.*expect.*"
  },
  {
    "name": "Test defects",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*TypeError.*|.*ReferenceError.*|.*SyntaxError.*|.*ImportError.*"
  },
  {
    "name": "Infrastructure problems",
    "matchedStatuses": ["broken"],
    "messageRegex": ".*timeout.*|.*connection.*|.*network.*|.*ConnectionError.*|.*TimeoutError.*"
  },
  {
    "name": "Performance issues",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*performance.*|.*slow.*|.*timeout.*"
  },
  {
    "name": "Flaky tests",
    "matchedStatuses": ["failed", "passed"],
    "messageRegex": ".*flaky.*|.*intermittent.*|.*unstable.*"
  }
]
EOF

    # Create environment.properties if it doesn't exist
    if [[ ! -f "$config_dir/environment.properties" ]]; then
        cat > "$config_dir/environment.properties" << EOF
Project=${PROJECT_NAME:-Unknown Project}
Framework=${FRAMEWORK:-Unknown}
Generated.Date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
Generator=PA-QA Generate Report Script
Node.Version=${NODE_VERSION:-$(node --version 2>/dev/null || echo "N/A")}
Python.Version=${PYTHON_VERSION:-$(python --version 2>/dev/null | cut -d' ' -f2 || echo "N/A")}
PHP.Version=${PHP_VERSION:-$(php --version 2>/dev/null | head -1 | cut -d' ' -f2 || echo "N/A")}
Platform=$(uname -s)
Architecture=$(uname -m)
EOF
    fi

    # Create executor.json if it doesn't exist
    if [[ ! -f "$config_dir/executor.json" ]]; then
        cat > "$config_dir/executor.json" << EOF
{
  "name": "${FRAMEWORK:-Unknown} Local",
  "type": "${FRAMEWORK:-unknown}",
  "url": "",
  "buildOrder": $(date +%s),
  "buildName": "${PROJECT_NAME:-Local} Report",
  "buildUrl": "",
  "reportUrl": "",
  "reportName": "${PROJECT_NAME:-Local} Test Report"
}
EOF
    fi
}

# Generate trend analysis
generate_trends() {
    if [[ "$GENERATE_TRENDS" != "true" ]]; then
        return 0
    fi

    log_info "Generating trend analysis..."

    local trends_script="$SCRIPT_DIR/trend-analysis.py"
    if [[ -f "$trends_script" ]] && command -v python3 >/dev/null 2>&1; then
        python3 "$trends_script" \
            --results "$RESULTS_DIR" \
            --history "$HISTORY_DIR" \
            --output "$REPORT_DIR/trends" \
            --project "$PROJECT_NAME" \
            --framework "$FRAMEWORK"
    else
        log_warn "Trend analysis script not found or Python not available"
    fi
}

# Generate Allure report
generate_report() {
    log_info "Generating Allure report..."
    log_info "Results: $RESULTS_DIR"
    log_info "Output: $REPORT_DIR"

    # Preserve history before generation
    preserve_history

    # Create custom configuration
    create_report_config

    # Generate report
    local allure_cmd=(
        allure generate
        "$RESULTS_DIR"
        --output "$REPORT_DIR"
        --clean
    )

    if [[ "$VERBOSE" == "true" ]]; then
        allure_cmd+=(--verbose)
    fi

    log_debug "Running: ${allure_cmd[*]}"

    if "${allure_cmd[@]}"; then
        log_success "Report generated successfully"
        
        # Preserve history after generation
        if [[ -d "$REPORT_DIR/history" ]]; then
            mkdir -p "$HISTORY_DIR"
            cp -r "$REPORT_DIR/history/"* "$HISTORY_DIR/" 2>/dev/null || true
        fi

        # Generate trends
        generate_trends

        return 0
    else
        log_error "Failed to generate report"
        return 1
    fi
}

# Start report server
serve_report() {
    if [[ "$SERVE_REPORT" != "true" ]]; then
        return 0
    fi

    if [[ ! -d "$REPORT_DIR" ]]; then
        log_error "Report directory does not exist: $REPORT_DIR"
        log_info "Generate a report first"
        return 1
    fi

    log_info "Starting report server on port $SERVER_PORT..."

    local server_cmd=(
        allure serve
        "$RESULTS_DIR"
        --port "$SERVER_PORT"
    )

    if [[ "$VERBOSE" == "true" ]]; then
        server_cmd+=(--verbose)
    fi

    # Open browser if requested
    if [[ "$OPEN_BROWSER" == "true" ]]; then
        (sleep 3 && open_in_browser "http://localhost:$SERVER_PORT") &
    fi

    log_success "Report server started: http://localhost:$SERVER_PORT"
    log_info "Press Ctrl+C to stop the server"

    # Execute server command
    "${server_cmd[@]}"
}

# Open report in browser
open_in_browser() {
    local url="$1"
    
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url"
    elif command -v open >/dev/null 2>&1; then
        open "$url"
    elif command -v start >/dev/null 2>&1; then
        start "$url"
    else
        log_warn "Cannot open browser automatically. Visit: $url"
    fi
}

# Watch for changes and regenerate
watch_changes() {
    if [[ "$WATCH_MODE" != "true" ]]; then
        return 0
    fi

    log_info "Watching for changes in $RESULTS_DIR..."
    log_info "Press Ctrl+C to stop watching"

    # Check if fswatch is available
    if command -v fswatch >/dev/null 2>&1; then
        fswatch -o "$RESULTS_DIR" | while read -r; do
            log_info "Changes detected, regenerating report..."
            generate_report
        done
    elif command -v inotifywait >/dev/null 2>&1; then
        while inotifywait -r -e modify,create,delete "$RESULTS_DIR" >/dev/null 2>&1; do
            log_info "Changes detected, regenerating report..."
            generate_report
        done
    else
        log_warn "File watching not available (install fswatch or inotify-tools)"
        log_info "Falling back to polling every 10 seconds..."
        
        local last_modified
        last_modified=$(find "$RESULTS_DIR" -type f -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1)
        
        while true; do
            sleep 10
            local current_modified
            current_modified=$(find "$RESULTS_DIR" -type f -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1)
            
            if [[ "$current_modified" != "$last_modified" ]]; then
                log_info "Changes detected, regenerating report..."
                generate_report
                last_modified="$current_modified"
            fi
        done
    fi
}

# Show Allure version
show_allure_version() {
    if check_allure_installation; then
        allure --version
    else
        log_error "Allure not installed"
        exit 1
    fi
}

# Main execution function
main() {
    local start_time=$(date +%s)

    log_info "PA-QA Allure Report Generator"
    log_info "=============================="

    # Parse arguments
    parse_arguments "$@"

    # Handle special modes
    if [[ "$SHOW_VERSION" == "true" ]]; then
        show_allure_version
        exit 0
    fi

    if [[ "$INSTALL_ALLURE" == "true" ]]; then
        install_allure
        exit 0
    fi

    # Check Allure installation
    if ! check_allure_installation; then
        log_error "Allure commandline not found"
        log_info "Install it with: $0 --install"
        log_info "Or visit: https://docs.qameta.io/allure/#_installing_a_commandline"
        exit 1
    fi

    # Validate inputs
    validate_results
    detect_framework

    # Clean if requested
    clean_previous

    # Generate report
    if generate_report; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "Report generation completed in ${duration}s"
        
        if [[ ! "$SERVE_REPORT" == "true" ]]; then
            log_success "Report available at: $REPORT_DIR/index.html"
        fi

        # Start server or watch mode
        if [[ "$WATCH_MODE" == "true" ]]; then
            if [[ "$SERVE_REPORT" == "true" ]]; then
                (serve_report) &
                watch_changes
            else
                watch_changes
            fi
        else
            serve_report
        fi
    else
        log_error "Report generation failed"
        exit 1
    fi
}

# Execute main function with all arguments
main "$@"