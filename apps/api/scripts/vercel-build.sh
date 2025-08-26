#!/bin/bash

# Exit on any error
set -e

echo "🔨 Starting Vercel build process..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$SCRIPT_DIR/.."
MONOREPO_ROOT="$API_DIR/../.."
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

# Return to API directory
cd "$API_DIR"

echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "🔨 Building API TypeScript..."
npx tsc -p tsconfig.build.json

echo "✅ Vercel build completed successfully!"