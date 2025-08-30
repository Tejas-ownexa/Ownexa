# Rentals Feature Documentation

## Overview
The Rentals page is a comprehensive rental management system that provides property owners and managers with a complete view of their rental operations, including tenant information, payment tracking, lease management, and financial analytics.

## Features Implemented

### 1. Frontend Components

#### Rentals Page (`frontend/src/pages/Rentals.jsx`)
- **Overview Tab**: Dashboard with key metrics and recent activity
- **Tenants Tab**: Complete tenant listing with property associations
- **Payments Tab**: Payment history and transaction tracking
- **Leases Tab**: Lease management with expiration tracking
- **Outstanding Balances Tab**: Overdue payments and balance management

#### Key Features:
- Real-time statistics dashboard
- Interactive data tables with filtering
- Status indicators and color coding
- Responsive design for all screen sizes
- Integration with existing tenant and property data

### 2. Backend API Routes (`routes/rental_routes.py`)

#### Endpoints:
- `GET /api/rentals/` - Get comprehensive rental data
- `GET /api/rentals/rent-roll` - Get payment history
- `GET /api/rentals/outstanding-balances` - Get overdue balances
- `GET /api/rentals/statistics` - Get rental analytics
- `POST /api/rentals/payments` - Record new payments
- `PUT /api/rentals/payments/<id>` - Update payments
- `POST /api/rentals/outstanding-balances` - Create balance records
- `PUT /api/rentals/outstanding-balances/<id>` - Update balances
- `GET /api/rentals/lease-expirations` - Get expiring leases
- `GET /api/rentals/reports/rental-summary` - Generate reports

### 3. Database Models
The feature utilizes existing models:
- `Tenant` - Tenant information and lease details
- `RentRoll` - Payment history and transaction records
- `OutstandingBalance` - Overdue payment tracking
- `DraftLease` - Lease draft management
- `LeaseRenewal` - Lease renewal tracking

### 4. Navigation Integration
- Added "Rentals" link to the main sidebar navigation
- Integrated with existing routing system
- Accessible to property owners and agents

## Key Metrics Displayed

### Dashboard Statistics:
- **Total Monthly Rent**: Sum of all tenant rent amounts
- **Total Collected**: Total payments received
- **Outstanding**: Total overdue amounts
- **Occupancy Rate**: Percentage of properties occupied

### Data Tables:
- **Tenants**: Name, property, rent amount, lease end date, status
- **Payments**: Tenant, property, payment date, amount, method, status
- **Leases**: Tenant, property, rent amount, lease dates, status
- **Outstanding Balances**: Tenant, property, due amount, due date, days overdue

## Usage Instructions

### Accessing the Rentals Page:
1. Log in to the admin portal
2. Click on "Rentals" in the left sidebar
3. Navigate between tabs to view different aspects of rental management

### Key Actions:
- **View Tenant Details**: Click the eye icon in the tenants table
- **Edit Tenant Information**: Click the edit icon in the tenants table
- **Filter Data**: Use the dropdown filters in the payments tab
- **Generate Reports**: Click the "Generate Report" button in the header

### Data Management:
- All data is automatically fetched from the database
- Real-time updates when new tenants or payments are added
- Automatic calculation of statistics and metrics

## Technical Implementation

### Frontend Technologies:
- React with functional components and hooks
- React Query for data fetching and caching
- Tailwind CSS for styling
- Lucide React for icons
- React Router for navigation

### Backend Technologies:
- Flask with SQLAlchemy ORM
- JWT authentication for secure access
- RESTful API design
- PostgreSQL database integration

### Data Flow:
1. Frontend makes API calls to fetch rental data
2. Backend queries database using SQLAlchemy
3. Data is processed and formatted for frontend consumption
4. Frontend displays data in organized tables and charts

## Security Features
- JWT token authentication required for all endpoints
- Property ownership verification for data access
- User role-based access control
- Secure API endpoints with proper error handling

## Future Enhancements
- Payment processing integration
- Automated rent collection reminders
- Advanced reporting and analytics
- Lease document generation
- Tenant portal integration
- Mobile app support

## Troubleshooting

### Common Issues:
1. **No data displayed**: Check if user has properties and tenants
2. **API errors**: Verify backend is running and database is accessible
3. **Authentication issues**: Ensure user is logged in with proper role
4. **Missing navigation**: Clear browser cache and refresh page

### Debug Steps:
1. Check browser console for JavaScript errors
2. Verify API endpoints are responding correctly
3. Confirm database connections and data integrity
4. Test with different user accounts and roles

## File Structure
```
frontend/src/pages/Rentals.jsx          # Main rentals page component
routes/rental_routes.py                 # Backend API routes
models/tenant.py                        # Database models (existing)
models/__init__.py                      # Base model with to_dict method
frontend/src/App.jsx                    # Updated routing
frontend/src/components/Sidebar.jsx     # Updated navigation
routes/__init__.py                      # Updated route registration
```

This feature provides a comprehensive rental management solution that integrates seamlessly with the existing property management system while maintaining the same design patterns and user experience.
