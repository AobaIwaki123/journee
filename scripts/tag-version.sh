#!/bin/bash

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository"
    exit 1
fi

# Fetch latest tags from remote
print_info "Fetching latest tags from remote..."
git fetch --tags --quiet

# Get all tags matching v*.*.* pattern
TAGS=$(git tag -l "v*.*.*" | sort -V)

if [ -z "$TAGS" ]; then
    print_warning "No existing tags found. Creating initial tag v0.0.0"
    CURRENT_VERSION="0.0.0"
else
    # Get the latest tag
    LATEST_TAG=$(echo "$TAGS" | tail -n 1)
    CURRENT_VERSION=${LATEST_TAG#v}
    print_info "Current version: ${GREEN}${LATEST_TAG}${NC}"
fi

# Parse current version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Show current version and options
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Current Version: v${MAJOR}.${MINOR}.${PATCH}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Select version bump type:"
echo -e "  1) ${GREEN}Major${NC} (v$((MAJOR+1)).0.0) - Breaking changes"
echo -e "  2) ${BLUE}Minor${NC} (v${MAJOR}.$((MINOR+1)).0) - New features"
echo -e "  3) ${YELLOW}Patch${NC} (v${MAJOR}.${MINOR}.$((PATCH+1))) - Bug fixes"
echo "  4) Cancel"
echo ""

# Read user choice
read -p "Enter your choice (1-4): " CHOICE

case $CHOICE in
    1)
        NEW_MAJOR=$((MAJOR+1))
        NEW_MINOR=0
        NEW_PATCH=0
        BUMP_TYPE="major"
        ;;
    2)
        NEW_MAJOR=$MAJOR
        NEW_MINOR=$((MINOR+1))
        NEW_PATCH=0
        BUMP_TYPE="minor"
        ;;
    3)
        NEW_MAJOR=$MAJOR
        NEW_MINOR=$MINOR
        NEW_PATCH=$((PATCH+1))
        BUMP_TYPE="patch"
        ;;
    4)
        print_info "Cancelled"
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

NEW_VERSION="v${NEW_MAJOR}.${NEW_MINOR}.${NEW_PATCH}"

echo ""
echo -e "${BLUE}ℹ${NC} New version will be: ${GREEN}${NEW_VERSION}${NC}"
echo ""

# Switch to main branch
print_info "Switching to main branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout main
fi

# Pull latest changes
print_info "Pulling latest changes from origin/main..."
git pull origin main

# Get latest commit hash
LATEST_COMMIT=$(git rev-parse HEAD)
print_info "Latest commit: ${LATEST_COMMIT:0:8}"

# Check if the latest commit already has a tag
EXISTING_TAG=$(git tag --points-at HEAD | grep "^v[0-9]" || true)
if [ -n "$EXISTING_TAG" ]; then
    print_error "Latest commit already has tag(s): ${EXISTING_TAG}"
    print_error "Cannot create a new tag on a commit that already has a version tag"
    
    # Return to original branch if different
    if [ "$CURRENT_BRANCH" != "main" ]; then
        git checkout "$CURRENT_BRANCH"
    fi
    exit 1
fi

# Confirm before creating tag
echo ""
read -p "Create and push tag ${NEW_VERSION}? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_info "Cancelled"
    
    # Return to original branch if different
    if [ "$CURRENT_BRANCH" != "main" ]; then
        git checkout "$CURRENT_BRANCH"
    fi
    exit 0
fi

# Create tag
print_info "Creating tag ${NEW_VERSION}..."
git tag -a "$NEW_VERSION" -m "Release ${NEW_VERSION} (${BUMP_TYPE} bump)"

# Push tag
print_info "Pushing tag to remote..."
git push origin "$NEW_VERSION"

print_success "Successfully created and pushed tag ${NEW_VERSION}"

# Return to original branch if different
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_info "Returning to branch ${CURRENT_BRANCH}..."
    git checkout "$CURRENT_BRANCH"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}✓${NC} Version ${NEW_VERSION} released!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

