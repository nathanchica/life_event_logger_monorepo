#!/bin/bash

# Exit on any error
set -e

echo "🔨 Starting Vercel build process for Web app..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WEB_DIR="$SCRIPT_DIR/.."
MONOREPO_ROOT="$WEB_DIR/../.."
UTILS_DIR="$MONOREPO_ROOT/packages/utils"

echo "📦 Building @life-event-logger/utils package..."
cd "$UTILS_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing utils dependencies..."
    npm install
fi

# Build the utils package
npm run build
echo "✅ Utils package built successfully"

# Return to web directory
cd "$WEB_DIR"

echo "🔨 Building web app..."
npm run tsc && npm run vite:build

echo "✅ Vercel build completed successfully!"