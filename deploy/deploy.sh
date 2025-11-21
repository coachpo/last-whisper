#!/bin/bash

# Last Whisper Deployment Script
# This script deploys the application using Docker Compose with GitHub Container Registry images
# Images are automatically built and pushed by GitHub Actions CI/CD pipeline

set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"
MAX_WAIT_SECONDS=${MAX_WAIT_SECONDS:-60}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        print_error "Required command '$1' not found in PATH."
        exit 1
    fi
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f env.template ]; then
        cp env.template .env
        print_status "Created .env file from env.template"
        print_warning "Please edit .env file with your configuration before running again."
        exit 1
    else
        print_error "env.template file not found. Please create a .env file manually."
        exit 1
    fi
fi

require_cmd docker
docker compose version >/dev/null 2>&1 || {
    print_error "Docker Compose plugin is not available. Please install Docker Desktop or the compose plugin."
    exit 1
}

print_status "Deploying Last Whisper"

# Pull latest images
print_status "Pulling latest images..."
docker compose -f "$COMPOSE_FILE" pull

# Stop existing containers
print_status "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down

# Check if keys folder exists, create if it doesn't
if [ ! -d "keys" ]; then
    print_status "Creating keys directory..."
    mkdir -p keys
    print_status "Keys directory created successfully"
else
    print_status "Keys directory already exists"
fi

# Start services
print_status "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

services_healthy() {
    local ps_json
    if ps_json=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null); then
        python3 - "$ps_json" <<'PY'
import json, sys
data = json.loads(sys.argv[1])
for svc in data:
    state = (svc.get("State") or "").lower()
    health = (svc.get("Health") or "").lower()
    if state != "running":
        sys.exit(1)
    if health and health not in {"healthy", ""}:
        sys.exit(1)
sys.exit(0)
PY
        return $?
    fi

    # Fallback for older Compose versions
    docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"
}

print_status "Waiting for services to be ready (timeout: ${MAX_WAIT_SECONDS}s)..."
elapsed=0
interval=5
while [ "$elapsed" -lt "$MAX_WAIT_SECONDS" ]; do
    if services_healthy; then
        print_status "✅ Deployment successful!"
        print_status "Application is running at: http://localhost:8008"
        break
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
done

if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
    print_error "❌ Services did not become healthy within ${MAX_WAIT_SECONDS}s. Check logs with:"
    print_error "docker compose -f $COMPOSE_FILE logs"
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker compose -f "$COMPOSE_FILE" ps
