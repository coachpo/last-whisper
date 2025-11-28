#!/bin/bash

# Last Whisper Deployment Script
# This script deploys the application using Docker Compose with GitHub Container Registry images
# Images are automatically built and pushed by GitHub Actions CI/CD pipeline

set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"

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

print_status "✅ Deployment steps finished."
print_status "Application expected at: http://localhost:8008"

# Show running containers
print_status "Running containers:"
docker compose -f "$COMPOSE_FILE" ps
