#!/bin/bash

# Direct deployment script for AgentAuth MVP

echo "🚀 Deploying AgentAuth MVP to Vercel..."

# Build the frontend first
echo "Building frontend..."
cd frontend
npm run build

# Create a simple deployment package
echo "Creating deployment package..."
mkdir -p .vercel/output
cp -r .next .vercel/output/
cp -r public .vercel/output/ 2>/dev/null || true

# Create the configuration
cat > .vercel/output/config.json << EOF
{
  "version": 3,
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
EOF

echo "✅ Build complete!"
echo ""
echo "📋 To deploy manually:"
echo "1. Go to: https://vercel.com/new"
echo "2. Import from GitHub: yksanjo/agent-auth-mvp"
echo "3. Configure:"
echo "   - Framework: Next.js"
echo "   - Root Directory: frontend"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo "4. Click Deploy"
echo ""
echo "🌐 Your site will be live at: https://agent-auth-mvp.vercel.app"
echo ""
echo "Alternatively, try:"
echo "cd frontend && vercel --prod --force"