#!/bin/bash

# Prepare AgentAuth MVP for Vercel deployment

echo "🚀 Preparing AgentAuth MVP for Vercel deployment..."
echo "====================================================="

# Create a temporary directory for deployment
TEMP_DIR="/tmp/agent-auth-deploy-$(date +%s)"
mkdir -p "$TEMP_DIR"

echo "1. Copying frontend files..."
cp -r frontend/* "$TEMP_DIR/"
cp frontend/.gitignore "$TEMP_DIR/" 2>/dev/null || true

echo "2. Creating vercel.json configuration..."
cat > "$TEMP_DIR/vercel.json" << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://agent-auth-mvp.vercel.app/api"
  }
}
EOF

echo "3. Creating deployment package..."
cd "$TEMP_DIR"
tar -czf ../agent-auth-deploy.tar.gz .

echo ""
echo "✅ Deployment package created: /tmp/agent-auth-deploy.tar.gz"
echo ""
echo "📋 To deploy:"
echo "1. Go to: https://vercel.com/new"
echo "2. Drag and drop the tar.gz file or select 'Deploy from a Git Repository'"
echo "3. Or use: cd $TEMP_DIR && vercel --prod"
echo ""
echo "The package includes:"
echo "- Next.js frontend application"
echo "- Vercel configuration"
echo "- All dependencies (package.json)"
echo ""
echo "🌐 Your site will be live at: https://agent-auth-mvp.vercel.app"