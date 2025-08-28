# Real Estate Management System

A comprehensive real estate management system built with Flask (backend) and React (frontend).

## Features

- Property management
- Tenant management
- Maintenance requests
- Financial tracking
- User authentication
- File uploads
- Dashboard analytics
- Vendor management
- Association management
- Property listings and applications

## Local Development Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Test_Flask
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Database Setup Options**

   **Option A: Quick Setup (Recommended)**
   ```bash
   python setup_local.py
   ```

   **Option B: Manual Database Creation**
   ```bash
   # For SQLite (local development)
   python create_database.py
   
   # For PostgreSQL (Neon)
   python create_postgresql_database.py
   ```

   **Option C: Database Migration (if updating existing database)**
   ```bash
   python migrate_database.py
   ```

5. **Run migrations (optional)**
   ```bash
   flask db upgrade
   ```

6. **Start the backend server**
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Database

The application supports both SQLite (for local development) and PostgreSQL (for production via Neon). The database schema includes:

### Core Tables
- **Users** - User accounts for owners, tenants, and vendors
- **Properties** - Property listings with details and status
- **Tenants** - Tenant information and lease details
- **Vendors** - Vendor profiles and contact information
- **Maintenance Requests** - Maintenance requests and their status

### Financial Tables
- **Property Financials** - Financial details for each property
- **Loan Payments** - Mortgage loan payment records
- **Financial Transactions** - All financial transactions for properties
- **Rent Roll** - Rent payment records and history
- **Outstanding Balances** - Outstanding balances owed by tenants

### Association Tables
- **Associations** - Homeowner associations
- **Association Memberships** - Association membership records
- **Association Balances** - Association fee balances
- **Violations** - Association rule violations

### Additional Tables
- **Draft Leases** - Draft lease agreements
- **Lease Renewals** - Lease renewal requests and history
- **Property Favorites** - User favorite properties
- **Listings** - Property listings for rent
- **Applicants** - Applicants for property listings

### Database Views
- **active_tenants** - Shows currently active tenants
- **pending_maintenance_requests** - Shows pending maintenance requests
- **property_financial_summary** - Financial summary for properties

## Database Scripts

- `updated_database.sql` - Complete database schema (PostgreSQL)
- `create_database.py` - Creates SQLite database from schema
- `create_postgresql_database.py` - Creates PostgreSQL database from schema
- `migrate_database.py` - Migrates existing database to new schema
- `setup_local.py` - Complete local development setup

## API Endpoints

The backend provides RESTful API endpoints for:

- Authentication (`/api/auth/*`)
- Properties (`/api/properties/*`)
- Tenants (`/api/tenants/*`)
- Maintenance (`/api/maintenance/*`)
- Financial (`/api/financial/*`)
- Users (`/api/users/*`)
- Vendors (`/api/vendors/*`)
- Associations (`/api/associations/*`)
- Listings (`/api/listings/*`)

## File Structure

```
├── app.py                        # Main Flask application
├── config.py                     # Configuration settings
├── requirements.txt              # Python dependencies
├── updated_database.sql          # Complete database schema
├── create_database.py            # SQLite database creation script
├── create_postgresql_database.py # PostgreSQL database creation script
├── migrate_database.py           # Database migration script
├── setup_local.py                # Complete local setup script
├── models/                       # Database models
├── routes/                       # API routes
├── uploads/                      # File uploads directory
├── frontend/                     # React frontend
│   ├── src/
│   ├── package.json
│   └── ...
└── migrations/                   # Database migrations
```

## Environment Variables

Create a `.env` file in the root directory with:

```
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

## Database Migration

If you're updating from an older version of the database schema:

1. **Backup your existing data** (if needed)
2. **Run the migration script**:
   ```bash
   python migrate_database.py
   ```
3. **The script will detect your database type** and migrate accordingly
4. **Existing data will be preserved** (unless you choose to recreate tables)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.


