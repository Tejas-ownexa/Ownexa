#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Deploy backend first
echo "📦 Deploying backend API..."
cd .
vercel --prod

# Get the backend URL
BACKEND_URL=$(vercel ls | grep "test-flask" | awk '{print $2}' | head -1)
echo "✅ Backend deployed at: $BACKEND_URL"

# Update frontend configuration with backend URL
echo "🔧 Updating frontend configuration..."
cd frontend
sed -i "s|REACT_APP_API_BASE_URL.*|REACT_APP_API_BASE_URL=$BACKEND_URL|" vercel.json

# Deploy frontend
echo "📦 Deploying frontend..."
vercel --prod

echo "🎉 Deployment completed!"
echo "Backend: $BACKEND_URL"
echo "Frontend: Check Vercel dashboard for the frontend URL"

