#!/bin/bash

# Fix and deploy AgentAuth MVP to Vercel

echo "🔧 Fixing AgentAuth MVP deployment..."
echo "======================================"

# Step 1: Check if we're in the right place
if [ ! -d "frontend" ]; then
  echo "❌ Error: frontend directory not found!"
  echo "Please run from the project root directory"
  exit 1
fi

# Step 2: Create a clean deployment in a temp directory
echo "1. Creating clean deployment directory..."
DEPLOY_DIR="/tmp/agent-auth-vercel-$(date +%s)"
mkdir -p "$DEPLOY_DIR"

# Copy all frontend files
echo "2. Copying frontend files..."
cp -r frontend/* "$DEPLOY_DIR/"
cp frontend/.gitignore "$DEPLOY_DIR/" 2>/dev/null || true

# Create proper vercel.json
echo "3. Creating Vercel configuration..."
cat > "$DEPLOY_DIR/vercel.json" << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
EOF

echo "4. Testing build..."
cd "$DEPLOY_DIR"
if npm run build; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed. Checking issues..."
  exit 1
fi

echo ""
echo "🎯 DEPLOYMENT READY!"
echo "===================="
echo ""
echo "Method 1: Vercel Web Interface (Recommended)"
echo "--------------------------------------------"
echo "1. Go to: https://vercel.com/new"
echo "2. Drag and drop the folder: $DEPLOY_DIR"
echo "3. Or select 'Import Git Repository' and use: yksanjo/agent-auth-mvp"
echo "4. IMPORTANT: Set 'Root Directory' to 'frontend'"
echo "5. Click 'Deploy'"
echo ""
echo "Method 2: Vercel CLI"
echo "-------------------"
echo "cd $DEPLOY_DIR"
echo "vercel --prod"
echo ""
echo "Method 3: Direct upload"
echo "----------------------"
echo "cd $DEPLOY_DIR"
echo "tar -czf ../agent-auth-vercel.tar.gz ."
echo "# Then upload to Vercel"
echo ""
echo "🌐 Your site will be at: https://agent-auth-mvp.vercel.app"
echo ""
echo "📝 Note: If deploying via Git, make sure to set:"
echo "- Framework: Next.js"
echo "- Root Directory: frontend"
echo "- Build Command: npm run build"
echo "- Output Directory: .next"