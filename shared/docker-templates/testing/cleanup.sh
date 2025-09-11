#!/bin/bash

# PA-QA Docker Environment Cleanup Script
# Comprehensive cleanup for test environments, containers, volumes, and resources
# Supports local Docker, Docker Compose, and Kubernetes environments

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
CLEANUP_SCOPE="local"
FORCE_CLEANUP=false
PRESERVE_VOLUMES=false
PRESERVE_IMAGES=false
PRESERVE_NETWORKS=false
DRY_RUN=false
VERBOSE=false

# Function to print colored output
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print usage information
usage() {
    cat << EOF
PA-QA Docker Environment Cleanup Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -s, --scope SCOPE       Cleanup scope (local|compose|k8s|all)
    -f, --force             Force cleanup without confirmation
    --preserve-volumes      Preserve Docker volumes
    --preserve-images       Preserve Docker images
    --preserve-networks     Preserve Docker networks
    -v, --verbose           Verbose output
    -n, --dry-run           Show what would be cleaned without executing
    -h, --help              Show this help message

SCOPES:
    local                   Clean local Docker containers and images
    compose                 Clean Docker Compose resources
    k8s                     Clean Kubernetes resources
    all                     Clean everything (default)

EXAMPLES:
    # Clean everything with confirmation
    $0

    # Force clean all resources without confirmation
    $0 --force

    # Clean only Docker Compose resources
    $0 --scope compose

    # Dry run to see what would be cleaned
    $0 --dry-run

    # Clean with preserved volumes and images
    $0 --preserve-volumes --preserve-images

ENVIRONMENT VARIABLES:
    PA_QA_CLEANUP_SCOPE     Override cleanup scope
    PA_QA_PRESERVE_DATA     Preserve volumes and persistent data (true/false)

EOF
}

# Function to confirm cleanup action
confirm_cleanup() {
    if [[ "$FORCE_CLEANUP" == "true" ]]; then
        return 0
    fi
    
    print_colored "$YELLOW" "This will cleanup PA-QA test environment resources."
    print_colored "$YELLOW" "Scope: $CLEANUP_SCOPE"
    
    if [[ "$PRESERVE_VOLUMES" != "true" ]]; then
        print_colored "$RED" "WARNING: This will delete test data and volumes!"
    fi
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_colored "$CYAN" "Cleanup cancelled."
        exit 0
    fi
}

# Function to detect compose command
detect_compose_command() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        print_colored "$RED" "Error: Neither 'docker compose' nor 'docker-compose' found"
        exit 1
    fi
}

# Function to cleanup local Docker resources
cleanup_local_docker() {
    print_colored "$BLUE" "Cleaning up local Docker resources..."
    
    # Stop and remove PA-QA containers
    local pa_qa_containers=$(docker ps -aq --filter "name=pa-qa-*" 2>/dev/null || true)
    if [[ -n "$pa_qa_containers" ]]; then
        print_colored "$CYAN" "Stopping PA-QA containers..."
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "Would execute: docker stop $pa_qa_containers"
            echo "Would execute: docker rm $pa_qa_containers"
        else
            docker stop $pa_qa_containers 2>/dev/null || true
            docker rm $pa_qa_containers 2>/dev/null || true
        fi
        print_colored "$GREEN" "PA-QA containers cleaned up"
    else
        print_colored "$CYAN" "No PA-QA containers found"
    fi
    
    # Remove PA-QA images
    if [[ "$PRESERVE_IMAGES" != "true" ]]; then
        local pa_qa_images=$(docker images --filter "reference=pa-qa/*" -q 2>/dev/null || true)
        if [[ -n "$pa_qa_images" ]]; then
            print_colored "$CYAN" "Removing PA-QA images..."
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "Would execute: docker rmi $pa_qa_images"
            else
                docker rmi $pa_qa_images 2>/dev/null || true
            fi
            print_colored "$GREEN" "PA-QA images cleaned up"
        else
            print_colored "$CYAN" "No PA-QA images found"
        fi
    fi
    
    # Remove dangling images
    local dangling_images=$(docker images -f "dangling=true" -q 2>/dev/null || true)
    if [[ -n "$dangling_images" ]]; then
        print_colored "$CYAN" "Removing dangling images..."
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "Would execute: docker rmi $dangling_images"
        else
            docker rmi $dangling_images 2>/dev/null || true
        fi
        print_colored "$GREEN" "Dangling images cleaned up"
    fi
    
    # Clean up volumes
    if [[ "$PRESERVE_VOLUMES" != "true" ]]; then
        local pa_qa_volumes=$(docker volume ls --filter "name=pa-qa" -q 2>/dev/null || true)
        if [[ -n "$pa_qa_volumes" ]]; then
            print_colored "$CYAN" "Removing PA-QA volumes..."
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "Would execute: docker volume rm $pa_qa_volumes"
            else
                docker volume rm $pa_qa_volumes 2>/dev/null || true
            fi
            print_colored "$GREEN" "PA-QA volumes cleaned up"
        else
            print_colored "$CYAN" "No PA-QA volumes found"
        fi
        
        # Remove unused volumes
        print_colored "$CYAN" "Removing unused volumes..."
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "Would execute: docker volume prune -f"
        else
            docker volume prune -f 2>/dev/null || true
        fi
    fi
    
    # Clean up networks
    if [[ "$PRESERVE_NETWORKS" != "true" ]]; then
        local pa_qa_networks=$(docker network ls --filter "name=pa-qa" -q 2>/dev/null || true)
        if [[ -n "$pa_qa_networks" ]]; then
            print_colored "$CYAN" "Removing PA-QA networks..."
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "Would execute: docker network rm $pa_qa_networks"
            else
                docker network rm $pa_qa_networks 2>/dev/null || true
            fi
            print_colored "$GREEN" "PA-QA networks cleaned up"
        else
            print_colored "$CYAN" "No PA-QA networks found"
        fi
        
        # Remove unused networks
        print_colored "$CYAN" "Removing unused networks..."
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "Would execute: docker network prune -f"
        else
            docker network prune -f 2>/dev/null || true
        fi
    fi
    
    # Clean up build cache
    print_colored "$CYAN" "Cleaning Docker build cache..."
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would execute: docker builder prune -f"
    else
        docker builder prune -f 2>/dev/null || true
    fi
    
    print_colored "$GREEN" "Local Docker cleanup complete"
}

# Function to cleanup Docker Compose resources
cleanup_compose() {
    print_colored "$BLUE" "Cleaning up Docker Compose resources..."
    
    local compose_cmd=$(detect_compose_command)
    local compose_files=(
        "$SCRIPT_DIR/docker-compose.test.yml"
        "$SCRIPT_DIR/docker-compose.services.yml"
    )
    
    for compose_file in "${compose_files[@]}"; do
        if [[ -f "$compose_file" ]]; then
            local file_name=$(basename "$compose_file")
            print_colored "$CYAN" "Cleaning up $file_name..."
            
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "Would execute: $compose_cmd -f $compose_file down --remove-orphans"
                if [[ "$PRESERVE_VOLUMES" != "true" ]]; then
                    echo "Would execute: $compose_cmd -f $compose_file down -v --remove-orphans"
                fi
            else
                # Stop services
                $compose_cmd -f "$compose_file" down --remove-orphans 2>/dev/null || true
                
                # Remove volumes if not preserving
                if [[ "$PRESERVE_VOLUMES" != "true" ]]; then
                    $compose_cmd -f "$compose_file" down -v --remove-orphans 2>/dev/null || true
                fi
            fi
            
            print_colored "$GREEN" "$file_name resources cleaned up"
        else
            print_colored "$YELLOW" "Compose file not found: $compose_file"
        fi
    done
    
    print_colored "$GREEN" "Docker Compose cleanup complete"
}

# Function to cleanup Kubernetes resources
cleanup_kubernetes() {
    print_colored "$BLUE" "Cleaning up Kubernetes resources..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        print_colored "$YELLOW" "kubectl not found, skipping Kubernetes cleanup"
        return
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace pa-qa-testing &> /dev/null; then
        print_colored "$CYAN" "PA-QA testing namespace not found, nothing to clean"
        return
    fi
    
    # Delete namespace and all resources
    print_colored "$CYAN" "Deleting PA-QA testing namespace..."
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would execute: kubectl delete namespace pa-qa-testing --ignore-not-found=true"
    else
        kubectl delete namespace pa-qa-testing --ignore-not-found=true --timeout=300s
    fi
    
    # Clean up persistent volumes if not preserving
    if [[ "$PRESERVE_VOLUMES" != "true" ]]; then
        local pa_qa_pvs=$(kubectl get pv --no-headers 2>/dev/null | grep "pa-qa" | awk '{print $1}' || true)
        if [[ -n "$pa_qa_pvs" ]]; then
            print_colored "$CYAN" "Cleaning up PA-QA persistent volumes..."
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "Would execute: kubectl delete pv $pa_qa_pvs"
            else
                kubectl delete pv $pa_qa_pvs --ignore-not-found=true 2>/dev/null || true
            fi
        fi
    fi
    
    # Clean up cluster roles and bindings if any
    local pa_qa_clusterroles=$(kubectl get clusterrole --no-headers 2>/dev/null | grep "pa-qa" | awk '{print $1}' || true)
    if [[ -n "$pa_qa_clusterroles" ]]; then
        print_colored "$CYAN" "Cleaning up PA-QA cluster roles..."
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "Would execute: kubectl delete clusterrole $pa_qa_clusterroles"
        else
            kubectl delete clusterrole $pa_qa_clusterroles --ignore-not-found=true 2>/dev/null || true
        fi
    fi
    
    local pa_qa_clusterrolebindings=$(kubectl get clusterrolebinding --no-headers 2>/dev/null | grep "pa-qa" | awk '{print $1}' || true)
    if [[ -n "$pa_qa_clusterrolebindings" ]]; then
        print_colored "$CYAN" "Cleaning up PA-QA cluster role bindings..."
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "Would execute: kubectl delete clusterrolebinding $pa_qa_clusterrolebindings"
        else
            kubectl delete clusterrolebinding $pa_qa_clusterrolebindings --ignore-not-found=true 2>/dev/null || true
        fi
    fi
    
    print_colored "$GREEN" "Kubernetes cleanup complete"
}

# Function to cleanup test result directories
cleanup_test_results() {
    print_colored "$BLUE" "Cleaning up test result directories..."
    
    local result_dirs=(
        "$PROJECT_ROOT/test-results"
        "$PROJECT_ROOT/coverage"
        "$PROJECT_ROOT/allure-results"
        "$PROJECT_ROOT/allure-reports"
        "$PROJECT_ROOT/screenshots"
        "$PROJECT_ROOT/videos"
        "$PROJECT_ROOT/reports"
        "$PROJECT_ROOT/logs"
    )
    
    for dir in "${result_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            print_colored "$CYAN" "Cleaning $dir..."
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "Would execute: rm -rf $dir"
            else
                rm -rf "$dir"
            fi
        fi
    done
    
    print_colored "$GREEN" "Test result directories cleaned up"
}

# Function to cleanup temporary files
cleanup_temp_files() {
    print_colored "$BLUE" "Cleaning up temporary files..."
    
    # Find and remove PA-QA temporary files
    local temp_patterns=(
        "/tmp/pa-qa-*"
        "/tmp/test-*"
        "/tmp/allure-*"
        "/tmp/playwright-*"
        "/tmp/selenium-*"
    )
    
    for pattern in "${temp_patterns[@]}"; do
        local temp_files=$(find /tmp -maxdepth 1 -name "$(basename "$pattern")" 2>/dev/null || true)
        if [[ -n "$temp_files" ]]; then
            print_colored "$CYAN" "Removing temporary files: $pattern"
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "Would execute: rm -rf $temp_files"
            else
                rm -rf $temp_files 2>/dev/null || true
            fi
        fi
    done
    
    # Clean npm cache if needed
    if command -v npm &> /dev/null; then
        print_colored "$CYAN" "Cleaning npm cache..."
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "Would execute: npm cache clean --force"
        else
            npm cache clean --force 2>/dev/null || true
        fi
    fi
    
    # Clean pip cache if needed
    if command -v pip &> /dev/null; then
        print_colored "$CYAN" "Cleaning pip cache..."
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "Would execute: pip cache purge"
        else
            pip cache purge 2>/dev/null || true
        fi
    fi
    
    print_colored "$GREEN" "Temporary files cleaned up"
}

# Function to display cleanup summary
display_summary() {
    print_colored "$PURPLE" "=== CLEANUP SUMMARY ==="
    
    # Docker resources
    if [[ "$CLEANUP_SCOPE" == "all" ]] || [[ "$CLEANUP_SCOPE" == "local" ]]; then
        local containers=$(docker ps -aq --filter "name=pa-qa-*" 2>/dev/null | wc -l || echo "0")
        local images=$(docker images --filter "reference=pa-qa/*" -q 2>/dev/null | wc -l || echo "0")
        local volumes=$(docker volume ls --filter "name=pa-qa" -q 2>/dev/null | wc -l || echo "0")
        local networks=$(docker network ls --filter "name=pa-qa" -q 2>/dev/null | wc -l || echo "0")
        
        print_colored "$CYAN" "Docker Containers: $containers"
        print_colored "$CYAN" "Docker Images: $images"
        print_colored "$CYAN" "Docker Volumes: $volumes"
        print_colored "$CYAN" "Docker Networks: $networks"
    fi
    
    # Kubernetes resources
    if [[ "$CLEANUP_SCOPE" == "all" ]] || [[ "$CLEANUP_SCOPE" == "k8s" ]]; then
        if command -v kubectl &> /dev/null; then
            local k8s_namespace=$(kubectl get namespace pa-qa-testing --no-headers 2>/dev/null | wc -l || echo "0")
            print_colored "$CYAN" "Kubernetes Namespace: $k8s_namespace"
        fi
    fi
    
    # Disk space freed
    if command -v df &> /dev/null; then
        local available_space=$(df -h /var/lib/docker 2>/dev/null | awk 'NR==2 {print $4}' || echo "Unknown")
        print_colored "$CYAN" "Available Docker Space: $available_space"
    fi
    
    print_colored "$PURPLE" "======================"
}

# Function to handle script interruption
handle_interrupt() {
    print_colored "$YELLOW" "Cleanup interrupted. Some resources may not have been cleaned up."
    exit 130
}

# Main execution function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--scope)
                CLEANUP_SCOPE="$2"
                shift 2
                ;;
            -f|--force)
                FORCE_CLEANUP=true
                shift
                ;;
            --preserve-volumes)
                PRESERVE_VOLUMES=true
                shift
                ;;
            --preserve-images)
                PRESERVE_IMAGES=true
                shift
                ;;
            --preserve-networks)
                PRESERVE_NETWORKS=true
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
    
    # Override from environment variables
    if [[ -n "${PA_QA_CLEANUP_SCOPE:-}" ]]; then
        CLEANUP_SCOPE="$PA_QA_CLEANUP_SCOPE"
    fi
    
    if [[ "${PA_QA_PRESERVE_DATA:-}" == "true" ]]; then
        PRESERVE_VOLUMES=true
    fi
    
    # Set verbose mode
    if [[ "$VERBOSE" == "true" ]]; then
        set -x
    fi
    
    # Validate cleanup scope
    case $CLEANUP_SCOPE in
        local|compose|k8s|all)
            ;;
        *)
            print_colored "$RED" "Error: Invalid cleanup scope '$CLEANUP_SCOPE'"
            print_colored "$YELLOW" "Valid scopes: local, compose, k8s, all"
            exit 1
            ;;
    esac
    
    # Set up interrupt handler
    trap handle_interrupt SIGINT SIGTERM
    
    # Print configuration
    print_colored "$PURPLE" "=== PA-QA CLEANUP TOOL ==="
    print_colored "$CYAN" "Scope: $CLEANUP_SCOPE"
    print_colored "$CYAN" "Force: $FORCE_CLEANUP"
    print_colored "$CYAN" "Preserve Volumes: $PRESERVE_VOLUMES"
    print_colored "$CYAN" "Preserve Images: $PRESERVE_IMAGES"
    print_colored "$CYAN" "Preserve Networks: $PRESERVE_NETWORKS"
    print_colored "$CYAN" "Dry Run: $DRY_RUN"
    print_colored "$PURPLE" "========================="
    
    # Confirm cleanup
    if [[ "$DRY_RUN" != "true" ]]; then
        confirm_cleanup
    fi
    
    # Execute cleanup based on scope
    local start_time=$(date +%s)
    
    case $CLEANUP_SCOPE in
        local)
            cleanup_local_docker
            ;;
        compose)
            cleanup_compose
            ;;
        k8s)
            cleanup_kubernetes
            ;;
        all)
            cleanup_compose
            cleanup_local_docker
            cleanup_kubernetes
            cleanup_test_results
            cleanup_temp_files
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Display summary
    display_summary
    
    print_colored "$PURPLE" "=== CLEANUP COMPLETE ==="
    print_colored "$CYAN" "Duration: ${duration}s"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_colored "$YELLOW" "Status: DRY RUN (no changes made)"
    else
        print_colored "$GREEN" "Status: SUCCESS"
    fi
    
    print_colored "$PURPLE" "========================"
}

# Execute main function with all arguments
main "$@"