#!/bin/bash

# Test GitHub Token Script
# This script tests if your GitHub token has the correct permissions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists and load it
if [ -f .env ]; then
    source .env
    print_status "Loaded environment variables from .env file"
else
    print_warning ".env file not found. Make sure to set GITHUB_TOKEN environment variable."
fi

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    print_error "GITHUB_TOKEN is not set!"
    print_error "Please set it in your .env file or as an environment variable."
    exit 1
fi

# Check if GITHUB_USERNAME is set
if [ -z "$GITHUB_USERNAME" ]; then
    print_error "GITHUB_USERNAME is not set!"
    print_error "Please set it in your .env file or as an environment variable."
    exit 1
fi

print_status "Testing GitHub token for user: $GITHUB_USERNAME"

# Test 1: Check if token is valid
print_status "Test 1: Validating token..."
if curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -q '"login"'; then
    print_status "✅ Token is valid"
else
    print_error "❌ Token is invalid or expired"
    exit 1
fi

# Test 2: Check repository access
print_status "Test 2: Checking repository access..."
REPO_URL="https://api.github.com/repos/$GITHUB_REPOSITORY"
if curl -s -H "Authorization: token $GITHUB_TOKEN" "$REPO_URL" | grep -q '"name"'; then
    print_status "✅ Repository access confirmed"
else
    print_error "❌ Cannot access repository: $GITHUB_REPOSITORY"
    exit 1
fi

# Test 3: Check packages permissions
print_status "Test 3: Checking packages permissions..."
PACKAGES_URL="https://api.github.com/user/packages?package_type=container"
if curl -s -H "Authorization: token $GITHUB_TOKEN" "$PACKAGES_URL" > /dev/null; then
    print_status "✅ Packages permissions confirmed"
else
    print_warning "⚠️  Packages permissions may be limited (this is normal for new tokens)"
fi

# Test 4: Test Docker login to GitHub Container Registry
print_status "Test 4: Testing Docker login to GitHub Container Registry..."
if echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin > /dev/null 2>&1; then
    print_status "✅ Docker login to ghcr.io successful"
    print_status "Logging out from Docker registry..."
    docker logout ghcr.io > /dev/null 2>&1
else
    print_error "❌ Docker login to ghcr.io failed"
    print_error "Make sure your token has 'write:packages' permission"
    exit 1
fi

print_status "🎉 All tests passed! Your GitHub token is properly configured."
print_status "You can now use the deployment script: ./deploy.sh"
