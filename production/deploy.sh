#!/bin/bash

# Last Whisper Deployment Script
# This script deploys the application using Docker Compose with GitHub Container Registry images
# Images are automatically built and pushed by GitHub Actions CI/CD pipeline

set -e

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

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_status "Created .env file from .env.example"
        print_warning "Please edit .env file with your configuration before running again."
        exit 1
    else
        print_error ".env.example file not found. Please create a .env file manually."
        exit 1
    fi
fi

# Load environment variables
source .env

# Check if GITHUB_REPOSITORY is set
if [ -z "$GITHUB_REPOSITORY" ]; then
    print_error "GITHUB_REPOSITORY environment variable is not set."
    print_error "Please set it in your .env file (e.g., GITHUB_REPOSITORY=coachpo/last-whisper)"
    exit 1
fi

print_status "Deploying Last Whisper with repository: $GITHUB_REPOSITORY"

# Login to GitHub Container Registry (required for private repos)
if [ "$GITHUB_TOKEN" ]; then
    print_status "Logging in to GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
else
    print_warning "GITHUB_TOKEN not set. This may cause issues with private repositories."
fi

# Pull latest images
print_status "Pulling latest images..."
docker-compose -f docker-compose.prod.yml pull

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start services
print_status "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_status "✅ Deployment successful!"
    print_status "Application is running at: http://localhost:8008"
else
    print_error "❌ Some services failed to start. Check logs with:"
    print_error "docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.prod.yml ps
