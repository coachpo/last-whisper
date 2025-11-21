#!/bin/bash

# Last Whisper Smoke Testing Script
# This script builds Docker images and runs comprehensive smoke tests

set -euo pipefail  # Exit on error, unset var, or failed pipe

SCRIPT_DIR=$(cd -- "$(dirname "$0")" && pwd)

cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.staging.yml"
PROJECT_NAME="last-whisper-staging"
TIMEOUT=${TIMEOUT:-60}
MAX_RETRIES=${MAX_RETRIES:-3}
KEEP_STACK=${KEEP_STACK:-0}
DOCKER_PRUNE=${DOCKER_PRUNE:-0}
WAIT_INTERVAL=5

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Cleanup function
cleanup() {
    if [ "$KEEP_STACK" = "1" ]; then
        log "KEEP_STACK=1 set; skipping cleanup so you can inspect containers."
        return
    fi

    log "Cleaning up containers and networks..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans 2>/dev/null || true
    
    log "Removing built images..."
    docker rmi "$PROJECT_NAME-backend" "$PROJECT_NAME-frontend" 2>/dev/null || true
    
    if [ "$DOCKER_PRUNE" = "1" ]; then
        log "Pruning dangling Docker resources (DOCKER_PRUNE=1)..."
        docker system prune -f 2>/dev/null || true
    fi
}

# Trap to ensure cleanup on script exit
trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Build images
build_images() {
    log "Building Docker images..."
    
    if docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build; then
        success "Images built successfully"
    else
        error "Failed to build images"
        exit 1
    fi
}

# Start services
start_services() {
    log "Starting services..."
    
    if docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d; then
        success "Services started successfully"
    else
        error "Failed to start services"
        exit 1
    fi
}

# Wait for services to report ready
wait_for_ready() {
    log "Waiting for services to be ready (timeout: ${TIMEOUT}s)..."
    local elapsed=0
    while [ "$elapsed" -lt "$TIMEOUT" ]; do
        local ps_json
        if command -v python3 >/dev/null 2>&1 && ps_json=$(docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps --format json 2>/dev/null); then
            python3 - "$ps_json" <<'PY'
import json, sys
data = json.loads(sys.argv[1])
for svc in data:
    state = (svc.get("State") or "").lower()
    if state != "running":
        sys.exit(1)
sys.exit(0)
PY
            if [ $? -ne 0 ]; then
                sleep "$WAIT_INTERVAL"
                elapsed=$((elapsed + WAIT_INTERVAL))
                continue
            fi
        else
            # Fallback if json format unsupported or python unavailable
            if ! docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps | grep -q "Up"; then
                sleep "$WAIT_INTERVAL"
                elapsed=$((elapsed + WAIT_INTERVAL))
                continue
            fi
        fi

        if curl -f -s http://localhost:8008/apis/health >/dev/null 2>&1 && \
           curl -f -s http://localhost:8008 >/dev/null 2>&1; then
            success "Services are responding"
            return 0
        fi

        warning "Services not ready yet, retrying... (${elapsed}/${TIMEOUT}s)"
        sleep "$WAIT_INTERVAL"
        elapsed=$((elapsed + WAIT_INTERVAL))
    done

    error "Services did not become ready within ${TIMEOUT}s"
    return 1
}

# Check service health
check_service_health() {
    log "Checking service health..."
    
    # Check if containers are running
    local expected_services=("backend" "frontend" "caddy")
    local failed_services=()
    
    for service in "${expected_services[@]}"; do
        if docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps "$service" | grep -q "Up"; then
            success "Service $service is running"
        else
            error "Service $service is not running"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        success "All containers are running"
    else
        error "Some containers are not running: ${failed_services[*]}"
        docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
        exit 1
    fi
}

# Test backend API
test_backend_api() {
    log "Testing backend API..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s http://localhost:8008/apis/health > /dev/null 2>&1; then
            success "Backend API is responding"
            return 0
        fi
        
        retries=$((retries + 1))
        warning "Backend API not ready, retrying... ($retries/$MAX_RETRIES)"
        sleep 5
    done
    
    error "Backend API failed to respond after $MAX_RETRIES attempts"
    return 1
}

# Test frontend
test_frontend() {
    log "Testing frontend..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s http://localhost:8008 > /dev/null 2>&1; then
            success "Frontend is responding"
            return 0
        fi
        
        retries=$((retries + 1))
        warning "Frontend not ready, retrying... ($retries/$MAX_RETRIES)"
        sleep 5
    done
    
    error "Frontend failed to respond after $MAX_RETRIES attempts"
    return 1
}

# Test API endpoints
test_api_endpoints() {
    log "Testing API endpoints..."
    
    local endpoints=(
        "/apis/health"
        "/apis/v1/items"
        "/apis/v1/stats/summary"
        "/apis/v1/tags"
    )
    
    local failed_endpoints=()
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "http://localhost:8008$endpoint" > /dev/null 2>&1; then
            success "Endpoint $endpoint is working"
        else
            error "Endpoint $endpoint failed"
            failed_endpoints+=("$endpoint")
        fi
    done
    
    if [ ${#failed_endpoints[@]} -eq 0 ]; then
        success "All API endpoints are working"
    else
        error "Some endpoints failed: ${failed_endpoints[*]}"
        return 1
    fi
}

# Check logs for errors
check_logs() {
    log "Checking service logs for errors..."
    
    local services=("backend" "frontend" "caddy")
    local has_errors=false
    
    for service in "${services[@]}"; do
        log "Checking $service logs..."
        if docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs "$service" 2>&1 | grep -i "error\|exception\|failed" > /dev/null; then
            warning "Found errors in $service logs:"
            docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs "$service" | grep -i "error\|exception\|failed" | head -5
            has_errors=true
        else
            success "$service logs look clean"
        fi
    done
    
    if [ "$has_errors" = false ]; then
        success "No critical errors found in logs"
    fi
}

# Performance test
performance_test() {
    log "Running basic performance test..."
    
    local start_time=$(date +%s)
    
    # Test API response time
    local response_time=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:8008/apis/health)
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        success "API response time: ${response_time}s (acceptable)"
    else
        warning "API response time: ${response_time}s (slow)"
    fi
    
    success "Performance test completed in ${duration}s"
}

# Resource usage check
check_resource_usage() {
    log "Checking resource usage..."
    
    local containers=$(docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q)

    if [ -z "$containers" ]; then
        warning "No containers found for project $PROJECT_NAME"
        return
    fi

    echo "Container Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $containers
    
    success "Resource usage check completed"
}

# Main smoke test function
run_smoke_test() {
    log "🚀 Starting Last Whisper Smoke Test"
    log "=================================="
    log "Note: stack will be cleaned up on exit (set KEEP_STACK=1 to keep it running)."
    
    # Run all test phases
    check_prerequisites
    build_images
    # Ensure keys directory exists for mounted credentials
    mkdir -p "$SCRIPT_DIR/keys"

    start_services
    wait_for_ready
    check_service_health
    test_backend_api
    test_frontend
    test_api_endpoints
    check_logs
    performance_test
    check_resource_usage
    
    log "=================================="
    success "🎉 Smoke test completed successfully!"
    if [ "$KEEP_STACK" = "1" ]; then
        log "Services kept running because KEEP_STACK=1"
        log "  - Frontend: http://localhost:8008"
        log "  - Backend API: http://localhost:8008/apis"
        log "To stop services manually: docker compose -f $COMPOSE_FILE -p $PROJECT_NAME down"
    else
        log "Services will be stopped during cleanup"
    fi
}

# Check if bc is available for floating point math
if ! command -v bc &> /dev/null; then
    warning "bc command not found, performance test will be simplified"
    performance_test() {
        log "Running basic performance test..."
        local start_time=$(date +%s)
        curl -s http://localhost:8008/apis/health > /dev/null
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        success "Performance test completed in ${duration}s"
    }
fi

# Run the smoke test
run_smoke_test
