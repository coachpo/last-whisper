#!/bin/bash

# Enable GitHub Container Registry Script
# This script checks and helps enable GitHub Container Registry

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

# Check if GITHUB_REPOSITORY is set
if [ -z "$GITHUB_REPOSITORY" ]; then
    print_error "GITHUB_REPOSITORY is not set!"
    print_error "Please set it in your .env file (e.g., GITHUB_REPOSITORY=coachpo/last-whisper)"
    exit 1
fi

print_status "Checking GitHub Container Registry for repository: $GITHUB_REPOSITORY"

# Get repository info
print_status "Getting repository information..."
REPO_INFO=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/$GITHUB_REPOSITORY")

if echo "$REPO_INFO" | grep -q '"name"'; then
    print_status "✅ Repository access confirmed"
else
    print_error "❌ Cannot access repository: $GITHUB_REPOSITORY"
    exit 1
fi

# Check if repository is private or public
IS_PRIVATE=$(echo "$REPO_INFO" | grep -o '"private":[^,]*' | cut -d':' -f2 | tr -d ' ')
print_info "Repository is: $([ "$IS_PRIVATE" = "true" ] && echo "private" || echo "public")"

# Check Actions permissions
print_status "Checking Actions permissions..."
ACTIONS_PERMISSIONS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/$GITHUB_REPOSITORY/actions/permissions")

if echo "$ACTIONS_PERMISSIONS" | grep -q '"enabled":true'; then
    print_status "✅ Actions are enabled"
    
    # Check workflow permissions
    WORKFLOW_PERMISSIONS=$(echo "$ACTIONS_PERMISSIONS" | grep -o '"default_workflow_permissions":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$WORKFLOW_PERMISSIONS" ]; then
        print_info "Workflow permissions: $WORKFLOW_PERMISSIONS"
        if [ "$WORKFLOW_PERMISSIONS" = "write" ]; then
            print_status "✅ Workflow permissions are set to write"
        else
            print_warning "⚠️  Workflow permissions are set to: $WORKFLOW_PERMISSIONS"
            print_warning "Consider setting to 'write' for full CI/CD functionality"
        fi
    fi
else
    print_warning "⚠️  Actions are not enabled for this repository"
    print_warning "You may need to enable Actions in repository settings"
fi

# Test package creation (this will fail if packages are not enabled, but gives us info)
print_status "Testing package access..."
PACKAGE_TEST=$(curl -s -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/user/packages?package_type=container")
HTTP_CODE="${PACKAGE_TEST: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    print_status "✅ Package API access: Success"
elif [ "$HTTP_CODE" = "403" ]; then
    print_warning "⚠️  Package API access: Forbidden (packages may not be enabled)"
elif [ "$HTTP_CODE" = "401" ]; then
    print_error "❌ Package API access: Unauthorized (token issue)"
else
    print_warning "⚠️  Package API access: HTTP $HTTP_CODE"
fi

# Test Docker login to GitHub Container Registry
print_status "Testing Docker login to GitHub Container Registry..."
if echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin > /dev/null 2>&1; then
    print_status "✅ Docker login to ghcr.io: Success"
    docker logout ghcr.io > /dev/null 2>&1
else
    print_error "❌ Docker login to ghcr.io: Failed"
    print_error "This indicates GitHub Container Registry may not be properly configured"
fi

print_status "GitHub Container Registry check complete!"

# Provide next steps
echo ""
print_info "Next steps if packages are not working:"
print_info "1. Go to: https://github.com/settings/packages"
print_info "2. Or go to your repository settings and look for 'Actions' → 'General'"
print_info "3. Ensure 'Workflow permissions' is set to 'Read and write permissions'"
print_info "4. For private repositories, ensure your account has GitHub Container Registry enabled"
