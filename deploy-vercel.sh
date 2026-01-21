#!/bin/bash

# AgentAuth MVP Vercel Deployment Helper
# Run: ./deploy-vercel.sh

set -e  # Exit on error

echo "🚀 AgentAuth MVP Vercel Deployment Helper"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Please run from project root directory${NC}"
  exit 1
fi

echo -e "${GREEN}✅ In project root directory${NC}"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ is required (you have $(node -v))${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"

# Install frontend dependencies
cd frontend
npm install --silent
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
cd ..

echo -e "${YELLOW}Step 3: Building frontend...${NC}"

cd frontend
npm run build --silent
echo -e "${GREEN}✅ Frontend built successfully${NC}"
cd ..

echo -e "${YELLOW}Step 4: Deployment options${NC}"

echo -e "${BLUE}Choose deployment method:${NC}"
echo "1) Deploy via Vercel CLI (if installed and logged in)"
echo "2) Deploy via Vercel web interface (recommended)"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo -e "${YELLOW}Deploying via Vercel CLI...${NC}"
    cd frontend
    if command -v vercel >/dev/null 2>&1; then
      echo -e "${GREEN}✅ Vercel CLI found${NC}"
      vercel --prod
    else
      echo -e "${RED}❌ Vercel CLI not found${NC}"
      echo "Install with: npm i -g vercel"
      exit 1
    fi
    ;;
  2)
    echo -e "${YELLOW}Deploy via Vercel web interface:${NC}"
    echo ""
    echo -e "${GREEN}1. Go to: https://vercel.com/new${NC}"
    echo -e "${GREEN}2. Sign in with GitHub${NC}"
    echo -e "${GREEN}3. Import repository: yksanjo/agent-auth-mvp${NC}"
    echo -e "${GREEN}4. Configure:${NC}"
    echo "   - Framework: Next.js"
    echo "   - Root Directory: frontend"
    echo "   - Build Command: npm run build"
    echo "   - Output Directory: .next"
    echo -e "${GREEN}5. Add environment variables${NC}"
    echo "   - NEXT_PUBLIC_API_URL: https://agent-auth-mvp.vercel.app/api"
    echo -e "${GREEN}6. Click Deploy${NC}"
    echo ""
    echo -e "${BLUE}Your site will be live at: https://agent-auth-mvp.vercel.app${NC}"
    ;;
  3)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✅ Deployment instructions complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test your deployed application"
echo "2. Share the demo link"
echo "3. Monitor deployment in Vercel dashboard"
echo ""
echo -e "${YELLOW}Live Demo URL: https://agent-auth-mvp.vercel.app${NC}"
echo -e "${YELLOW}GitHub Repo: https://github.com/yksanjo/agent-auth-mvp${NC}"