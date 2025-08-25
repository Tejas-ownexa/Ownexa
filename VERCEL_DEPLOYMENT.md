# Vercel Deployment Guide

This guide covers deploying both the Flask backend API and React frontend to Vercel.

## Prerequisites

- Vercel account
- Git repository connected to Vercel
- Node.js and npm (for CLI deployment)

## Option 1: Dashboard Deployment (Recommended for first deployment)

### Backend (Flask API) Deployment

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"

2. **Import Repository**
   - Select your Git repository
   - Choose the repository containing your Flask app

3. **Configure Project Settings**
   - **Framework Preset**: Other
   - **Root Directory**: `/` (root of your repository)
   - **Build Command**: Leave empty (Vercel will auto-detect)
   - **Output Directory**: Leave empty
   - **Install Command**: `pip install -r requirements.txt`

4. **Environment Variables**
   Add these environment variables in the Vercel dashboard:
   ```
   FLASK_ENV=production
   DATABASE_URL=your_database_connection_string
   SECRET_KEY=your_secret_key
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Note the deployment URL (e.g., `https://your-app.vercel.app`)

### Frontend (React) Deployment

1. **Create New Project**
   - In Vercel dashboard, click "New Project"
   - Import the same repository

2. **Configure Project Settings**
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Environment Variables**
   Add the backend API URL:
   ```
   REACT_APP_API_URL=https://your-backend-domain.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

## Option 2: CLI Deployment

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login to Vercel

```bash
vercel login
```

### Deploy Backend

1. **Navigate to project root**
   ```bash
   cd /path/to/your/project
   ```

2. **Deploy backend**
   ```bash
   vercel --prod
   ```

3. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `your-app-backend`
   - Directory: `./` (current directory)
   - Override settings: `N`

4. **Set environment variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add SECRET_KEY
   vercel env add FLASK_ENV
   ```

### Deploy Frontend

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Deploy frontend**
   ```bash
   vercel --prod
   ```

3. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `your-app-frontend`
   - Directory: `./` (current directory)
   - Override settings: `N`

4. **Set environment variables**
   ```bash
   vercel env add REACT_APP_API_URL
   ```

## Configuration Files

### Backend (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ],
  "env": {
    "FLASK_ENV": "production"
  }
}
```

### Frontend (`frontend/vercel.json`)
```json
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
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Important Notes

1. **Database**: Vercel doesn't support persistent file-based databases. Use a cloud database like:
   - PostgreSQL on Railway, Supabase, or Neon
   - MongoDB Atlas
   - PlanetScale (MySQL)

2. **File Uploads**: Vercel functions are stateless. For file uploads, use:
   - AWS S3
   - Cloudinary
   - Vercel Blob Storage

3. **Environment Variables**: Make sure to set all required environment variables in the Vercel dashboard.

4. **CORS**: Update your frontend API calls to use the deployed backend URL.

5. **Domain Configuration**: After deployment, you can configure custom domains in the Vercel dashboard.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are in `requirements.txt`
   - Verify Python version compatibility

2. **Import Errors**
   - Make sure all imports are relative to the project root
   - Check that `__init__.py` files exist in all packages

3. **Database Connection**
   - Verify DATABASE_URL is correctly set
   - Ensure database is accessible from Vercel's servers

4. **CORS Issues**
   - Update CORS configuration to allow your frontend domain
   - Check that API calls use the correct backend URL

### Useful Commands

```bash
# View deployment logs
vercel logs

# List all deployments
vercel ls

# Remove deployment
vercel remove

# Pull environment variables
vercel env pull .env.local
```

## Next Steps

1. Set up a production database
2. Configure file upload storage
3. Set up monitoring and logging
4. Configure custom domains
5. Set up CI/CD pipelines
