#!/bin/bash
# Test Statik-Server Build Setup

echo "🧪 Testing Statik-Server Build Setup"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

# Verify key files exist
echo "📁 Checking file structure..."

check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 (missing)"
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1/"
    else
        echo "❌ $1/ (missing)"
    fi
}

# Check core files
check_file "package.json"
check_file "startup.sh"
check_file "Dockerfile"
check_file "quick-build.sh"

# Check directories
check_dir "internal/mesh"
check_dir "src/node/statik"

# Check mesh components
check_file "internal/mesh/headscale"
check_file "internal/mesh/headscale.yaml"
check_file "internal/mesh/headscale.sh"

# Check Statik modules
check_file "src/node/statik/copilot-auth.ts"
check_file "src/node/statik/memory-router.ts"

echo ""
echo "🔧 Checking dependencies..."

# Check if Node.js is available
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js $(node --version)"
else
    echo "❌ Node.js (not installed)"
fi

# Check if yarn is available
if command -v yarn >/dev/null 2>&1; then
    echo "✅ Yarn $(yarn --version)"
else
    echo "❌ Yarn (not installed)"
fi

# Check if Docker is available
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
else
    echo "❌ Docker (not installed)"
fi

echo ""
echo "📋 Build Status Summary:"
echo "========================"

# Count files
missing_files=0
total_files=0

for file in "package.json" "startup.sh" "Dockerfile" "quick-build.sh" \
           "internal/mesh/headscale" "internal/mesh/headscale.yaml" "internal/mesh/headscale.sh" \
           "src/node/statik/copilot-auth.ts" "src/node/statik/memory-router.ts"; do
    total_files=$((total_files + 1))
    if [ ! -f "$file" ]; then
        missing_files=$((missing_files + 1))
    fi
done

ready_files=$((total_files - missing_files))
echo "📊 Files ready: $ready_files/$total_files"

if [ $missing_files -eq 0 ]; then
    echo "🎉 Statik-Server build setup is COMPLETE!"
    echo ""
    echo "🚀 Ready to build:"
    echo "   ./quick-build.sh"
    echo ""
    echo "🔧 Or manual build:"
    echo "   docker build -t statikfintech/statik-server ."
else
    echo "⚠️  Build setup incomplete ($missing_files files missing)"
fi
