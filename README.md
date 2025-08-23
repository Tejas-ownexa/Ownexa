# Real Estate Management System

A comprehensive property management system built with Flask (Python) and React.js, featuring AI-powered maintenance request assistance.

## 🚀 New Feature: AI Maintenance Assistant

🤖 **AI-Powered Chatbot**: Tenants can now submit maintenance requests through natural conversation with an AI assistant powered by **Ollama + Llama 3.2**!

### Features:
- **Natural Language Processing**: Describe issues in plain English
- **Smart Extraction**: AI automatically extracts structured data from conversations
- **Property Integration**: Seamlessly connected to your property management system
- **Fallback Support**: Works even when AI is offline
- **Privacy First**: All AI processing happens locally (no data sent to external servers)

**Quick Setup**: See `OLLAMA_SETUP.md` for AI setup instructions.

---

## 🏗️ Project Structure

```
Test_Flask/
├── app.py                 # Main Flask application entry point
├── config.py             # Database and application configuration
├── requirements.txt      # Python dependencies
├── docker-compose.yml    # Docker setup for PostgreSQL and pgAdmin
├── database_tables.sql   # Complete database schema
├── create_db.py         # Database creation script
├── models/              # Database models
│   ├── user.py          # User authentication model
│   ├── property.py      # Property management model
│   ├── tenant.py        # Tenant management model
│   ├── maintenance.py   # Maintenance requests model
│   ├── vendor.py        # Vendor management model
│   ├── financial.py     # Financial tracking model
│   ├── association.py   # Association management model
│   └── listing.py       # Property listings model
├── routes/              # API routes
│   ├── auth_routes.py   # Authentication endpoints
│   ├── property_routes.py # Property management endpoints
│   ├── tenant_routes.py # Tenant management endpoints
│   ├── maintenance_routes.py # Maintenance endpoints
│   ├── vendor_routes.py # Vendor management endpoints
│   ├── financial_routes.py # Financial endpoints
│   └── association_routes.py # Association endpoints
├── migrations/          # Database migrations (Alembic)
├── utils/              # Utility functions
├── uploads/            # File uploads (property images)
└── frontend/           # React frontend application
    ├── src/            # React source code
    ├── public/         # Static files
    ├── package.json    # Node.js dependencies
    └── README.md       # Frontend documentation
```

## 🚀 Features

### Backend (Flask)
- **User Authentication**: Secure login/register with JWT tokens
- **Property Management**: CRUD operations for properties with image uploads
- **Tenant Management**: Complete tenant lifecycle management
- **Maintenance Requests**: Track and manage maintenance requests
- **Vendor Management**: Vendor profiles and service tracking
- **Financial Tracking**: Comprehensive financial management
- **Association Management**: HOA and association features
- **Database Migrations**: Alembic for database version control

### Frontend (React)
- **Modern UI**: Built with React 18 and Tailwind CSS
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: React Query for data fetching
- **Form Management**: React Hook Form for form handling
- **Authentication**: Secure login/logout functionality
- **Dashboard**: Comprehensive property management dashboard

## 🛠️ Tech Stack

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Primary database
- **Alembic**: Database migrations
- **JWT**: Authentication tokens
- **Flask-CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: Frontend framework
- **Tailwind CSS**: Styling framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **React Query**: Data fetching and caching
- **React Hook Form**: Form management
- **Lucide React**: Icon library

## 📋 Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- Docker (optional, for database setup)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd Test_Flask
```

### 2. Backend Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

#### Option B: Manual PostgreSQL Setup
```bash
# Install PostgreSQL and create database
# Run the database_tables.sql file in your PostgreSQL instance

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Database Setup
```bash
# Create database tables
python create_db.py

# Run migrations (if using Alembic)
flask db upgrade
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

## 🏃‍♂️ Running the Application

### Backend
```bash
# From the root directory
python app.py
# or
flask run
```

The backend will be available at `http://localhost:5000`

### Frontend
```bash
# From the frontend directory
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`

## 📊 Database Schema

The application includes 20+ tables covering:

- **User Management**: Authentication and user profiles
- **Property Management**: Property listings and details
- **Tenant Management**: Tenant information and leases
- **Maintenance**: Request tracking and vendor assignments
- **Financial**: Transactions, payments, and financial records
- **Associations**: HOA management and violations
- **Listings**: Property listings and applications

See `database_tables.sql` for complete schema details.

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/flask_db
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

### Database Configuration
The application is configured to use PostgreSQL by default. You can modify the database connection in `config.py`.

## 📁 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Properties
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create new property
- `GET /api/properties/<id>` - Get property details
- `PUT /api/properties/<id>` - Update property
- `DELETE /api/properties/<id>` - Delete property

### Tenants
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/<id>` - Get tenant details
- `PUT /api/tenants/<id>` - Update tenant
- `DELETE /api/tenants/<id>` - Delete tenant

### Maintenance
- `GET /api/maintenance` - List maintenance requests
- `POST /api/maintenance` - Create maintenance request
- `PUT /api/maintenance/<id>` - Update maintenance request

### Financial
- `GET /api/financial` - Get financial data
- `POST /api/financial/transactions` - Create transaction

## 🐳 Docker Support

The project includes Docker Compose configuration for easy database setup:

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the API documentation

## 🔄 Updates

To update the application:

```bash
# Backend
git pull origin main
pip install -r requirements.txt
flask db upgrade

# Frontend
cd frontend
git pull origin main
npm install
npm run build
```

---

**Note**: This is a comprehensive real estate management system suitable for property managers, landlords, and real estate professionals. The system handles all aspects of property management from tenant onboarding to financial tracking.


