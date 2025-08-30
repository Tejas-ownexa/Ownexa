# Deployment Guide for Real Estate Management System

This guide will help you deploy the Real Estate Management System to Vercel with Neon database integration.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **Neon Database**: Already configured with the provided connection string

## Database Configuration

The system is configured to use the Neon database with the following connection string:
```
postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Backend Deployment

### 1. Configure Environment Variables

Create a `.env` file in the root directory:
```env
NEON_DATABASE_URL=postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SECRET_KEY=your-production-secret-key-here
```

### 2. Deploy Backend

```bash
# Navigate to project root
cd /path/to/your/project

# Deploy to Vercel
vercel --prod
```

### 3. Set Environment Variables in Vercel

After deployment, set these environment variables in your Vercel project settings:
- `NEON_DATABASE_URL`: Your Neon database connection string
- `SECRET_KEY`: A secure secret key for JWT tokens

## Frontend Deployment

### 1. Update API Configuration

Update `frontend/src/config.js` to use your deployed backend URL:
```javascript
API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://your-backend-url.vercel.app'
```

### 2. Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Deploy to Vercel
vercel --prod
```

### 3. Set Environment Variables

Set the following environment variable in your frontend Vercel project:
- `REACT_APP_API_BASE_URL`: Your deployed backend URL

## Automated Deployment

Use the provided deployment script:

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## API Endpoints

The backend provides the following main endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Properties
- `GET /api/properties` - Get all properties
- `POST /api/properties/add` - Add new property
- `POST /api/properties/import` - Import properties from CSV
- `DELETE /api/properties/{id}` - Delete property

### Tenants
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Add new tenant
- `POST /api/tenants/import` - Import tenants from CSV

### Rentals
- `GET /api/rentals/rent-roll` - Get rent roll data
- `GET /api/rentals/statistics` - Get rental statistics

## CSV Import Pipeline

The system supports CSV import for both properties and tenants:

### Property Import Format
```csv
PROPERTY,LOCATION,STREET_ADDRESS,STREET_ADDRESS_2,APT_NUMBER,DESCRIPTION,RENT_AMOUNT,STATUS,ZIP_CODE
Sample Property,New York NY,123 Main St,Apt 1B,Beautiful apartment,2500.00,available,10001
```

### Tenant Import Format
```csv
FULL_NAME,EMAIL,PHONE,PROPERTY_ID,LEASE_START_DATE,LEASE_END_DATE,RENT_AMOUNT,PAYMENT_STATUS
John Doe,john@example.com,555-1234,1,2024-01-01,2024-12-31,2500.00,active
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify the Neon database connection string
   - Check if the database is accessible from Vercel

2. **CORS Errors**
   - Ensure CORS is properly configured in the backend
   - Check that the frontend is calling the correct backend URL

3. **Environment Variables**
   - Verify all environment variables are set in Vercel
   - Check that the variable names match exactly

### Logs and Debugging

- Check Vercel function logs in the Vercel dashboard
- Use `vercel logs` command to view deployment logs
- Monitor the Neon database connection in the Neon dashboard

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Database Access**: Use connection pooling and SSL for database connections
3. **API Security**: Implement proper authentication and authorization
4. **CORS**: Configure CORS to only allow your frontend domain

## Performance Optimization

1. **Database**: Use connection pooling for better performance
2. **Caching**: Implement caching for frequently accessed data
3. **Image Optimization**: Use CDN for image storage and delivery
4. **Code Splitting**: Implement code splitting in the frontend

## Monitoring

1. **Vercel Analytics**: Monitor API performance and usage
2. **Database Monitoring**: Use Neon's built-in monitoring tools
3. **Error Tracking**: Implement error tracking for both frontend and backend

## Support

For issues and questions:
1. Check the Vercel documentation
2. Review the Neon database documentation
3. Check the project's GitHub issues
