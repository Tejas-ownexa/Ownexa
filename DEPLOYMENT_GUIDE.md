# Ownexa Real Estate Management - Deployment Guide

## Overview
This guide will help you deploy the Ownexa Real Estate Management System to Vercel with both frontend and backend components.

## Architecture
- **Frontend**: React.js application deployed to Vercel
- **Backend**: Flask API deployed to Vercel using serverless functions
- **Database**: Neon PostgreSQL (cloud-hosted)

## Prerequisites
1. Vercel CLI installed (`npm i -g vercel`)
2. Git repository with your code
3. Neon database account and connection string

## Backend Deployment (Flask API)

### 1. Configure Environment Variables
In your Vercel backend project, set these environment variables:
```bash
NEON_DATABASE_URL=postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SECRET_KEY=ownexa-production-secret-key-2024
FLASK_ENV=production
```

### 2. Deploy Backend
```bash
# From the root directory (where app.py is located)
vercel --prod
```

### 3. Note the Backend URL
After deployment, Vercel will provide a URL like: `https://your-backend-app.vercel.app`

## Frontend Deployment (React App)

### 1. Update Frontend Configuration
Update `frontend/vercel.json` with your actual backend URL:
```json
{
  "env": {
    "REACT_APP_API_BASE_URL": "https://your-actual-backend-url.vercel.app"
  }
}
```

### 2. Deploy Frontend
```bash
# From the frontend directory
cd frontend
vercel --prod
```

## Database Setup

### 1. Neon Database
The application is configured to use the provided Neon PostgreSQL database:
```
postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. Initialize Database Tables
After backend deployment, you may need to initialize the database tables. This can be done by:
1. Creating a temporary script to run migrations
2. Using the database initialization endpoints (if created)
3. Running Flask migrations through the Vercel functions

## Features Available

### 1. User Management
- ✅ User registration and authentication
- ✅ Role-based access (Owner, Agent, Tenant, Vendor)
- ✅ JWT token authentication

### 2. Property Management
- ✅ Add/edit properties
- ✅ Property listings
- ✅ Property details and images
- ✅ CSV import for bulk property creation

### 3. Tenant Management
- ✅ Tenant registration
- ✅ Lease management
- ✅ Rent roll tracking
- ✅ CSV import for bulk tenant creation

### 4. Maintenance System
- ✅ Maintenance request creation
- ✅ Vendor assignment
- ✅ Status tracking
- ✅ AI-powered chatbot assistance

### 5. Data Import Pipeline
- ✅ CSV import for properties
- ✅ CSV import for tenants
- ✅ Template download functionality
- ✅ Error handling and validation
- 🔄 Maintenance requests import (coming soon)
- 🔄 Vendor import (coming soon)

### 6. Financial Management
- ✅ Property financial tracking
- ✅ Accountability features
- ✅ Financial reporting
- ✅ General ledger

### 7. Reporting
- ✅ Property reports
- ✅ Financial reports
- ✅ Tenant reports
- ✅ PDF generation

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/token` - User login
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties/add` - Add property
- `POST /api/properties/import` - Import properties from CSV

### Tenants
- `GET /api/tenants` - List tenants
- `POST /api/tenants` - Add tenant
- `POST /api/tenants/import` - Import tenants from CSV

### Data Pipeline
- `POST /api/pipeline/import/{data_type}` - Universal CSV import
- `GET /api/pipeline/template/{data_type}` - Download CSV templates
- `GET /api/pipeline/status` - Get available import types

### Maintenance
- `GET /api/maintenance` - List maintenance requests
- `POST /api/maintenance` - Create maintenance request

### Other Endpoints
- Financial management: `/api/financial/*`
- Vendor management: `/api/vendors/*`
- Reporting: `/api/reports/*`
- Accountability: `/api/accountability/*`

## Testing the Deployment

### 1. Backend Health Check
Visit your backend URL to see the API status:
```
GET https://your-backend.vercel.app/
```

### 2. Frontend Access
Visit your frontend URL and test:
1. User registration
2. User login
3. Property creation
4. CSV import functionality

### 3. Database Connection
The backend should automatically connect to the Neon database. Check the logs in Vercel dashboard for any connection issues.

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS is properly configured in the backend
   - Check that the frontend is using the correct backend URL

2. **Database Connection Issues**
   - Verify the Neon connection string is correct
   - Check Vercel environment variables

3. **Authentication Issues**
   - Ensure JWT secret key is consistent
   - Check token storage in frontend

4. **Import Functionality**
   - Test CSV templates first
   - Check file size limits (16MB max)
   - Verify required columns are present

### Performance Optimization

1. **Backend**
   - Use connection pooling for database
   - Implement caching where appropriate
   - Optimize SQL queries

2. **Frontend**
   - Enable code splitting
   - Optimize image sizes
   - Use React Query for API caching

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive keys to Git
   - Use Vercel environment variables for secrets

2. **Database Security**
   - Neon provides SSL encryption by default
   - Use connection pooling for better performance

3. **API Security**
   - JWT tokens for authentication
   - Input validation on all endpoints
   - Rate limiting (can be added)

## Next Steps

1. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor performance metrics
   - Set up uptime monitoring

2. **Backups**
   - Configure database backups in Neon
   - Implement data export functionality

3. **Scaling**
   - Monitor usage and optimize as needed
   - Consider CDN for static assets
   - Implement caching strategies

## Support

For issues and questions:
1. Check Vercel deployment logs
2. Review Neon database logs
3. Check browser console for frontend errors
4. Verify API endpoints are responding correctly
