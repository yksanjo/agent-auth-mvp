# Deploy AgentAuth MVP to Vercel

## 🚀 Quick Deployment Guide

### Option 1: Vercel Web Interface (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import GitHub Repository**
   - Click "Import Git Repository"
   - Select: `yksanjo/agent-auth-mvp`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **Environment Variables**
   Add these variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://agent-auth-mvp.vercel.app/api
   DATABASE_URL=your_postgresql_url_here
   JWT_SECRET=your_jwt_secret_here
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your site will be live at: `https://agent-auth-mvp.vercel.app`

### Option 2: Vercel CLI (Alternative)

If Vercel CLI works for you:

```bash
# Navigate to frontend
cd agent-auth-mvp/frontend

# Deploy to Vercel
vercel --prod

# Follow the prompts:
# - Set up and deploy: Yes
# - Which scope: yksanjo
# - Link to existing project: No
# - Project name: agent-auth-mvp
# - Directory: . (current directory)
# - Override settings: No
```

### Option 3: Deploy Backend as Serverless Functions

The backend can be deployed as Vercel Serverless Functions:

1. **Create `api/` directory in frontend**
   ```bash
   mkdir -p agent-auth-mvp/frontend/api
   ```

2. **Move backend API routes**
   Create API routes in `frontend/api/` that proxy to your backend server or implement the API directly as serverless functions.

3. **Update `vercel.json`**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "nextjs",
     "functions": {
       "api/*.js": {
         "maxDuration": 10
       }
     }
   }
   ```

## 🌐 Live Demo URLs

After deployment, you'll have:

- **Frontend Dashboard**: `https://agent-auth-mvp.vercel.app`
- **API Endpoints**: `https://agent-auth-mvp.vercel.app/api/*`

## 🔧 Environment Setup

### Required Environment Variables

Create `.env.local` in the frontend directory:

```env
# Frontend
NEXT_PUBLIC_API_URL=https://agent-auth-mvp.vercel.app/api

# Backend (for local development)
DATABASE_URL=postgresql://username:password@localhost:5432/agent_auth
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### Database Setup

1. **Local PostgreSQL**
   ```bash
   # Install PostgreSQL (if not installed)
   brew install postgresql
   
   # Start PostgreSQL
   brew services start postgresql
   
   # Create database
   createdb agent_auth
   
   # Run migrations
   cd backend
   npm run db:migrate
   ```

2. **Supabase (Cloud - Recommended for Demo)**
   - Go to: https://supabase.com
   - Create new project
   - Get connection string from Settings > Database
   - Use in DATABASE_URL

## 📱 Testing the Deployment

### 1. Test Frontend
```bash
# Local development
cd agent-auth-mvp/frontend
npm run dev
# Open: http://localhost:3000
```

### 2. Test Backend API
```bash
# Local development
cd agent-auth-mvp/backend
npm run dev
# API running on: http://localhost:3001
```

### 3. Test API Endpoints
```bash
# Create a permission grant
curl -X POST http://localhost:3001/api/v1/grants \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent-001",
    "scopes": ["calendar:read"],
    "expires_in_hours": 24
  }'
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Build fails on Vercel**
   - Check Node.js version (requires 18+)
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json

2. **Database connection errors**
   - Verify DATABASE_URL is correct
   - Check if database allows connections
   - For Supabase: check IP restrictions

3. **CORS errors**
   - Ensure FRONTEND_URL matches your frontend URL
   - Check CORS configuration in backend/server.js

4. **API not found**
   - Verify API routes are properly configured
   - Check Vercel function configuration

### Vercel Deployment Logs

Check deployment logs:
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click on latest deployment
5. View build logs

## 🔄 Continuous Deployment

### GitHub Integration
Vercel automatically deploys when you push to GitHub:

1. **Connect GitHub repo in Vercel**
2. **Enable automatic deployments**
3. **Push changes to trigger deployment**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

### Preview Deployments
Every pull request gets a preview URL:
- Perfect for testing changes
- Share with team for review
- Automatically deleted when PR is closed

## 📈 Monitoring

### Vercel Analytics
- **Performance**: Page load times, Core Web Vitals
- **Analytics**: Page views, unique visitors
- **Errors**: JavaScript errors, server errors

### Custom Monitoring
```bash
# Check deployment status
vercel list

# View logs
vercel logs

# Open project in browser
vercel open
```

## 🎯 Success Checklist

- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] Environment variables set
- [ ] Database connected
- [ ] API endpoints working
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Basic functionality tested
- [ ] Share demo link with others

## 🆘 Getting Help

### Vercel Support
- Documentation: https://vercel.com/docs
- Community: https://vercel.com/community
- Support: https://vercel.com/support

### Project Issues
- GitHub Issues: https://github.com/yksanjo/agent-auth-mvp/issues
- Check existing documentation
- Review example integrations

## 🎉 Deployment Complete!

Once deployed, share your demo:
- **Live URL**: `https://agent-auth-mvp.vercel.app`
- **GitHub Repo**: `https://github.com/yksanjo/agent-auth-mvp`
- **API Docs**: `https://agent-auth-mvp.vercel.app/api-docs`

Your AgentAuth MVP is now live and ready for demos! 🚀