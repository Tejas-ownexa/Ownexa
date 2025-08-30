#!/bin/bash

# Ownexa Frontend Deployment Script
echo "🚀 Deploying Ownexa Frontend to Vercel..."

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found. Please run this script from the project root."
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"

# Get backend URL from user
echo "🔧 Please enter your backend URL (e.g., https://your-backend.vercel.app):"
read BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend URL is required"
    exit 1
fi

# Update vercel.json with the backend URL
echo "📝 Updating frontend configuration..."
cd frontend

# Create or update vercel.json
cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/\$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_BASE_URL": "$BACKEND_URL"
  }
}
EOF

echo "✅ Frontend configuration updated"

# Set environment variable for production
echo "🔧 Setting up environment variables..."
vercel env add REACT_APP_API_BASE_URL production <<< "$BACKEND_URL"

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

echo "✅ Frontend deployment complete!"
echo "🎉 Your Ownexa application should now be live!"
