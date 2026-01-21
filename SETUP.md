# AgentAuth MVP - Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Clone and Install
```bash
# Clone the repository
git clone [your-repo-url]
cd agent-auth-mvp

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Set Up Database
```bash
# Create a PostgreSQL database (if you don't have one)
# Using Docker:
docker run --name agent-auth-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Or using Supabase (free tier):
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Get connection string from Settings > Database
```

### 3. Configure Environment
```bash
# Copy example environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit backend/.env with your database URL
# DATABASE_URL=postgresql://username:password@localhost:5432/agent_auth
# JWT_SECRET=your-super-secret-key-change-this

# Edit frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Run Database Migrations
```bash
cd backend
npm run db:migrate
```

### 5. Start Development Servers
```bash
# From project root
npm run dev

# Or start separately:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

### 6. Open in Browser
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/health

## 📦 What You Get

### Backend API (http://localhost:3001)
- ✅ Permission grant creation
- ✅ Token validation
- ✅ Audit logging
- ✅ Grant revocation
- ✅ Rate limiting & security

### Frontend Dashboard (http://localhost:3000)
- ✅ User login (MVP test mode)
- ✅ Grant creation UI
- ✅ Active grants management
- ✅ One-click revocation
- ✅ Audit log viewing

### Example Integrations
- 📅 Calendar agent example
- 🔌 Service integration example
- 📚 Complete API documentation

## 🗄️ Database Schema

The migration creates 5 tables:

1. **users** - User accounts (simplified for MVP)
2. **agents** - Registered AI agents
3. **permission_grants** - User→agent permission grants
4. **audit_logs** - All agent actions
5. **token_blacklist** - Revoked tokens

Plus indexes, views, and test data.

## 🔐 Authentication Flow (MVP)

### For Testing:
1. Enter email on dashboard
2. Click "Login/Create Account"
3. Get JWT token (stored in localStorage)

### In Production:
Replace with your preferred auth (OAuth, magic links, etc.)

## 🎯 API Endpoints

### Core Endpoints:
```
POST   /api/test-login          # Get test user token
POST   /api/grants              # Create permission grant
POST   /api/validate            # Validate agent token
POST   /api/audit               # Log agent action
GET    /api/grants              # List user's grants
DELETE /api/grants/:id          # Revoke grant
GET    /api/grants/:id/audit    # Get audit logs
```

### Example Request:
```bash
# Create grant
curl -X POST http://localhost:3001/api/grants \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "scopes": ["calendar:read", "calendar:write:meetings"],
    "expires_in_hours": 24,
    "budget_limit": 50.00,
    "rate_limit_per_day": 100
  }'
```

## 🧪 Testing the Flow

### 1. Create Test Account
1. Open http://localhost:3000
2. Enter email (e.g., `test@example.com`)
3. Click "Login/Create Account"

### 2. Grant Permissions to Agent
1. Select "Calendar Assistant" agent
2. Set scopes: `calendar:read`, `calendar:write:meetings`
3. Set budget: $50, rate limit: 100/day
4. Click "Create Permission Grant"
5. **Copy the agent token** that appears

### 3. Test Agent Integration
```bash
# Run the calendar agent example
cd examples
node calendar-agent.js
# (Replace YOUR_AGENT_AUTH_TOKEN_HERE with your token)
```

### 4. Monitor & Revoke
1. Back in dashboard, see active grants
2. View usage stats (calls, cost)
3. Click trash icon to revoke access instantly

## 🔧 Configuration Options

### Backend (.env):
```env
# Database
DATABASE_URL=postgresql://...

# Security
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Redis (optional, for production)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🚀 Deployment

### Option A: Vercel (Recommended)
```bash
# Deploy frontend
cd frontend
vercel --prod

# Deploy backend as serverless functions
# Add vercel.json configuration
```

### Option B: Railway/Render
```bash
# Both support PostgreSQL + Node.js
# Push to GitHub and connect
```

### Option C: Docker
```dockerfile
# Example Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend .
EXPOSE 3001
CMD ["node", "server.js"]
```

## 📈 Next Steps After MVP

### 1. Add Real Authentication
- OAuth (Google, GitHub, etc.)
- Magic links
- Wallet connection (Web3)

### 2. Enhance Dashboard
- Real-time updates (WebSockets)
- Advanced analytics
- Team management

### 3. Production Features
- Email notifications
- Webhook integrations
- Advanced rate limiting
- Monitoring & alerts

### 4. Business Features
- Billing integration
- Usage analytics
- Team collaboration
- API marketplace

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql DATABASE_URL

# Reset database
DROP DATABASE agent_auth;
CREATE DATABASE agent_auth;
npm run db:migrate
```

### Port Already in Use
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### JWT Errors
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Update JWT_SECRET in .env
```

### CORS Issues
```bash
# Ensure FRONTEND_URL in .env matches your frontend
# Default: http://localhost:3000
```

## 📚 Additional Resources

- [API Documentation](./docs/API.md)
- [Example Integrations](./examples/)
- [Database Schema](./backend/schema.sql)
- [Frontend Components](./frontend/app/)

## 🆘 Need Help?

1. Check the console logs
2. Verify database connection
3. Ensure environment variables are set
4. Try the example integrations

## 🎉 Success!

You now have a working AgentAuth MVP that:
- Lets users grant permissions to AI agents
- Enforces scopes, budgets, and time limits
- Provides audit trails
- Allows instant revocation
- Has a clean dashboard for management

Next: Integrate with your agents and services!