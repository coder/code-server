#!/usr/bin/env bash
set -euo pipefail

# Release script for code-server
# Usage: ./scripts/release.sh <version> [options]

VERSION=""
DRY_RUN=false
SKIP_TESTS=false
SKIP_BUILD=false

usage() {
    echo "Usage: $0 <version> [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run        Show what would be done without executing"
    echo "  --skip-tests     Skip running tests"
    echo "  --skip-build     Skip building (assumes already built)"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 v1.0.0"
    echo "  $0 v1.0.0 --dry-run"
    echo "  $0 v1.0.0 --skip-tests"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        -*)
            echo "Unknown option $1"
            usage
            exit 1
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$1"
            else
                echo "Multiple versions specified"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$VERSION" ]]; then
    echo "Error: Version is required"
    usage
    exit 1
fi

# Validate version format
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
    echo "Error: Version must be in format v1.0.0 or v1.0.0-beta"
    exit 1
fi

echo "🚀 Preparing release $VERSION"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Check if working directory is clean
if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: Working directory is not clean. Please commit or stash changes."
    exit 1
fi

# Check if tag already exists
if git rev-parse "$VERSION" > /dev/null 2>&1; then
    echo "Error: Tag $VERSION already exists"
    exit 1
fi

# Update package.json version
echo "📦 Updating package.json version to $VERSION"
if [[ "$DRY_RUN" == "true" ]]; then
    echo "Would run: npm version ${VERSION#v} --no-git-tag-version"
else
    npm version "${VERSION#v}" --no-git-tag-version
fi

# Run tests
if [[ "$SKIP_TESTS" == "false" ]]; then
    echo "🧪 Running tests..."
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would run: npm run test:unit"
    else
        npm run test:unit
    fi
fi

# Build project
if [[ "$SKIP_BUILD" == "false" ]]; then
    echo "🔨 Building project..."
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would run: npm run build"
    else
        npm run build
    fi
fi

# Create release package
echo "📦 Creating release package..."
if [[ "$DRY_RUN" == "true" ]]; then
    echo "Would run: npm run release"
else
    npm run release
fi

# Commit changes
echo "📝 Committing changes..."
if [[ "$DRY_RUN" == "true" ]]; then
    echo "Would run: git add . && git commit -m \"chore: release $VERSION\""
else
    git add .
    git commit -m "chore: release $VERSION"
fi

# Create tag
echo "🏷️  Creating tag $VERSION..."
if [[ "$DRY_RUN" == "true" ]]; then
    echo "Would run: git tag -a $VERSION -m \"Release $VERSION\""
else
    git tag -a "$VERSION" -m "Release $VERSION"
fi

# Push changes
echo "📤 Pushing changes..."
if [[ "$DRY_RUN" == "true" ]]; then
    echo "Would run: git push origin main && git push origin $VERSION"
else
    git push origin main
    git push origin "$VERSION"
fi

echo "✅ Release $VERSION prepared successfully!"
echo ""
echo "Next steps:"
echo "1. The GitHub Actions workflow will automatically:"
echo "   - Build and test the project"
echo "   - Publish to npm"
echo "   - Create a GitHub release"
echo "   - Build and push Docker images"
echo ""
echo "2. Monitor the workflow at: https://github.com/\${GITHUB_REPOSITORY:-your-org/your-repo}/actions"
