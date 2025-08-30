# Railway Backend Deployment Guide

## 🚀 Deploy Ownexa Backend to Railway

### Prerequisites
1. Create a Railway account at [railway.app](https://railway.app)
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login to Railway: `railway login`

### Step 1: Prepare Your Project
Your project is already configured with:
- ✅ `app.py` - Main Flask application
- ✅ `requirements.txt` - Python dependencies
- ✅ `railway.json` - Railway configuration
- ✅ Neon database connection

### Step 2: Deploy to Railway

#### Option A: Using Railway CLI (Recommended)
```bash
# Login to Railway
railway login

# Initialize Railway project
railway init

# Set environment variables
railway variables set NEON_DATABASE_URL="postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
railway variables set SECRET_KEY="ownexa-production-secret-key-2024"
railway variables set FLASK_ENV="production"

# Deploy
railway up
```

#### Option B: Using Railway Web Interface
1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Railway will automatically detect Python and deploy
5. Set environment variables in Railway dashboard:
   - `NEON_DATABASE_URL`: Your Neon connection string
   - `SECRET_KEY`: A secure random string
   - `FLASK_ENV`: production

### Step 3: Get Your Railway URL
After deployment, Railway will provide you with a URL like:
```
https://ownexa-backend-production.up.railway.app
```

### Step 4: Update Frontend Configuration
Update your frontend to point to the new Railway backend:

1. Update `frontend/vercel.json`:
```json
{
  "env": {
    "REACT_APP_API_BASE_URL": "https://your-railway-url.up.railway.app"
  }
}
```

2. Update `frontend/src/config.js`:
```javascript
API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://your-railway-url.up.railway.app'
```

3. Redeploy frontend:
```bash
cd frontend
vercel --prod
```

### Step 5: Test the Deployment

#### Health Check
```bash
curl https://your-railway-url.up.railway.app/health
```

#### Test Registration
```bash
curl -X POST https://your-railway-url.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User",
    "role": "OWNER",
    "street_address_1": "123 Test St",
    "city": "Test City",
    "state": "TX",
    "zip_code": "12345"
  }'
```

## 🎯 Railway Advantages

✅ **Flask-Friendly**: Perfect for Python/Flask applications  
✅ **Free Tier**: 512MB RAM, 1GB disk (sufficient for development)  
✅ **Auto-Scaling**: Scales automatically based on traffic  
✅ **PostgreSQL Support**: Native PostgreSQL support  
✅ **Environment Variables**: Easy configuration management  
✅ **Logs**: Real-time logging and monitoring  

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Verify NEON_DATABASE_URL is correct
   - Ensure database allows connections from Railway IPs

2. **Module Import Errors**
   - Check requirements.txt has all dependencies
   - Railway uses Python 3.11 by default

3. **CORS Issues**
   - CORS is already configured in the Flask app
   - Make sure frontend URL is allowed

### Useful Railway Commands:
```bash
# View logs
railway logs

# View environment variables
railway variables

# Restart deployment
railway restart

# View project status
railway status
```

## 📊 Cost Comparison

| Platform | Free Tier | Paid Plans | Flask Support |
|----------|-----------|------------|---------------|
| Vercel | Limited | $20+/month | Poor |
| Railway | 512MB RAM | $5+/month | Excellent |
| Render | 750h/month | $7+/month | Good |
| Heroku | None | $7+/month | Good |

## 🎉 Success!

Once deployed, you'll have:
- ✅ Full Flask API with database connectivity
- ✅ All endpoints working (auth, properties, tenants, etc.)
- ✅ CSV import functionality
- ✅ File upload support
- ✅ Production-ready backend

Your Railway URL will be: `https://your-project-name.up.railway.app`
