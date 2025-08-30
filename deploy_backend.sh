#!/bin/bash

# Ownexa Backend Deployment Script
echo "🚀 Deploying Ownexa Backend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"

# Set environment variables for production
echo "🔧 Setting up environment variables..."

vercel env add NEON_DATABASE_URL production <<< "postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
vercel env add SECRET_KEY production <<< "ownexa-production-secret-key-2024"
vercel env add FLASK_ENV production <<< "production"

echo "✅ Environment variables set"

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

echo "✅ Backend deployment complete!"
echo "📝 Please note your backend URL for frontend configuration"
