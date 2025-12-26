#!/bin/bash

# A&R Focus Forecast - Quick Deployment Script
# This script helps verify your environment before deployment

echo "🚀 A&R Focus Forecast - Pre-Deployment Check"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Found: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} Found: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check if in project directory
echo -n "Checking project files... "
if [ -f "package.json" ] && [ -f "next.config.ts" ]; then
    echo -e "${GREEN}✓${NC} Project files found"
else
    echo -e "${RED}✗${NC} Not in project directory"
    exit 1
fi

# Check .env.local
echo -n "Checking environment variables... "
if [ -f ".env.local" ]; then
    if grep -q "placeholder.supabase.co" .env.local; then
        echo -e "${YELLOW}⚠${NC} Using placeholder values"
        echo "   Please update .env.local with real Supabase credentials"
    else
        echo -e "${GREEN}✓${NC} Environment configured"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env.local not found"
    echo "   Copy .env.local.example to .env.local and configure"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install dependencies"
    exit 1
fi

# Run build test
echo ""
echo "🔨 Testing production build..."
npm run build > /tmp/build.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed. Check /tmp/build.log for details"
    tail -20 /tmp/build.log
    exit 1
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Create Supabase project at https://supabase.com"
echo "2. Run scripts/schema.sql in Supabase SQL Editor"
echo "3. Update .env.local with real Supabase credentials"
echo "4. Run 'npm run seed' to populate database"
echo "5. Deploy to Vercel at https://vercel.com"
echo ""
echo "📚 See VERCEL_SETUP.md for detailed instructions"
echo ""
