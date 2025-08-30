#!/bin/bash

# Check GitHub Token Permissions Script
# This script shows what permissions your current token has

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[DETAIL]${NC} $1"
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

print_status "Checking GitHub token permissions..."

# Get token info
TOKEN_INFO=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
USERNAME=$(echo "$TOKEN_INFO" | grep -o '"login":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USERNAME" ]; then
    print_error "❌ Token is invalid or expired"
    exit 1
fi

print_status "✅ Token is valid for user: $USERNAME"

# Check what scopes the token has
print_status "Checking token scopes..."
SCOPES=$(curl -s -I -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -i "x-oauth-scopes" | cut -d' ' -f2- | tr -d '\r')

if [ -n "$SCOPES" ]; then
    print_info "Token scopes: $SCOPES"
    
    # Check for specific permissions
    if echo "$SCOPES" | grep -q "repo"; then
        print_status "✅ Repository access: Yes"
    else
        print_warning "⚠️  Repository access: No (repo scope missing)"
    fi
    
    if echo "$SCOPES" | grep -q "write:packages\|packages:write"; then
        print_status "✅ Package write access: Yes"
    else
        print_warning "⚠️  Package write access: No (write:packages scope missing)"
    fi
    
    if echo "$SCOPES" | grep -q "read:packages\|packages:read"; then
        print_status "✅ Package read access: Yes"
    else
        print_warning "⚠️  Package read access: No (read:packages scope missing)"
    fi
else
    print_warning "Could not determine token scopes"
fi

# Test package access
print_status "Testing package access..."
PACKAGES_RESPONSE=$(curl -s -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user/packages?package_type=container)
HTTP_CODE="${PACKAGES_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    print_status "✅ Package API access: Yes"
else
    print_warning "⚠️  Package API access: Limited (HTTP $HTTP_CODE)"
fi

# Test Docker login
print_status "Testing Docker login to GitHub Container Registry..."
if echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$USERNAME" --password-stdin > /dev/null 2>&1; then
    print_status "✅ Docker login to ghcr.io: Success"
    docker logout ghcr.io > /dev/null 2>&1
else
    print_error "❌ Docker login to ghcr.io: Failed"
    print_error "This usually means the token lacks 'write:packages' permission"
fi

print_status "Token permission check complete!"
