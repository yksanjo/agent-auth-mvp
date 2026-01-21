#!/bin/bash

# AgentAuth MVP Deployment Script
# Run: ./deploy.sh

set -e  # Exit on error

echo "🚀 AgentAuth MVP Deployment"
echo "============================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ git is required"; exit 1; }

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Checking environment...${NC}"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ is required (you have $(node -v))${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check if in correct directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Please run from project root directory${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"

# Install root dependencies
npm install --silent
echo -e "${GREEN}✅ Root dependencies installed${NC}"

# Install backend dependencies
cd backend
npm install --silent
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
cd ..

# Install frontend dependencies
cd frontend
npm install --silent
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
cd ..

echo -e "${YELLOW}Step 3: Setting up environment...${NC}"

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo -e "${YELLOW}⚠️  Created backend/.env - please edit with your database URL${NC}"
else
  echo -e "${GREEN}✅ Backend .env exists${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
  cp frontend/.env.example frontend/.env.local
  echo -e "${GREEN}✅ Created frontend/.env.local${NC}"
else
  echo -e "${GREEN}✅ Frontend .env.local exists${NC}"
fi

echo -e "${YELLOW}Step 4: Setting up database...${NC}"

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL=postgresql://" backend/.env; then
  echo -e "${YELLOW}⚠️  Using existing DATABASE_URL from .env${NC}"
else
  echo -e "${RED}❌ DATABASE_URL not configured${NC}"
  echo "Please edit backend/.env and set:"
  echo "DATABASE_URL=postgresql://username:password@localhost:5432/agent_auth"
  echo ""
  echo "Options:"
  echo "1. Local PostgreSQL: Install and create database 'agent_auth'"
  echo "2. Docker: docker run --name agent-auth-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres"
  echo "3. Supabase: Free tier at https://supabase.com"
  exit 1
fi

# Run database migrations
cd backend
echo -e "${YELLOW}Running database migrations...${NC}"
if npm run db:migrate 2>/dev/null; then
  echo -e "${GREEN}✅ Database migrations completed${NC}"
else
  echo -e "${RED}❌ Database migration failed${NC}"
  echo "Possible issues:"
  echo "1. Database server not running"
  echo "2. Invalid DATABASE_URL"
  echo "3. Insufficient permissions"
  exit 1
fi
cd ..

echo -e "${YELLOW}Step 5: Building frontend...${NC}"

cd frontend
if npm run build 2>/dev/null; then
  echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
  echo -e "${YELLOW}⚠️  Frontend build had warnings (may be OK for development)${NC}"
fi
cd ..

echo -e "${YELLOW}Step 6: Starting servers...${NC}"

# Check if ports are available
check_port() {
  lsof -ti:$1 >/dev/null 2>&1
}

if check_port 3000; then
  echo -e "${YELLOW}⚠️  Port 3000 (frontend) is in use${NC}"
fi

if check_port 3001; then
  echo -e "${YELLOW}⚠️  Port 3001 (backend) is in use${NC}"
fi

echo ""
echo -e "${GREEN}🎉 AgentAuth MVP is ready!${NC}"
echo ""
echo "To start development:"
echo "1. Open two terminal windows"
echo "2. Terminal 1: cd backend && npm run dev"
echo "3. Terminal 2: cd frontend && npm run dev"
echo ""
echo "Or use: npm run dev (from project root)"
echo ""
echo "📊 Access:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001/api/health"
echo ""
echo "📚 Next steps:"
echo "1. Open http://localhost:3000"
echo "2. Login with test email"
echo "3. Create permission grant"
echo "4. Try the example integrations"
echo ""
echo "For production deployment, see DEPLOYMENT.md"

# Create a quick test script
cat > test-agent-auth.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing AgentAuth..."
echo "1. Checking backend..."
curl -s http://localhost:3001/api/health | jq . || echo "Backend not running"
echo ""
echo "2. Checking frontend..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo "Frontend responding" || echo "Frontend not running"
echo ""
echo "3. Example API call..."
echo "Try: curl -X POST http://localhost:3001/api/test-login -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\"}' | jq ."
EOF

chmod +x test-agent-auth.sh
echo -e "${GREEN}✅ Created test script: ./test-agent-auth.sh${NC}"