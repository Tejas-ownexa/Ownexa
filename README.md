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

## 🚀 Core Features

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

#### Option B: Manual Setup
```bash
# Create virtual environment
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Database Setup
```bash
# Create database tables
python create_db.py

# Run migrations
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
```

The backend will be available at `http://localhost:5001`

### Frontend
```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`

## 📊 Database Schema

The application includes comprehensive database tables for:

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

See `database_tables.sql` for complete schema details.

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

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/flask_db
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

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

---

**Note**: This is a comprehensive real estate management system suitable for property managers, landlords, and real estate professionals. The system handles all aspects of property management from tenant onboarding to financial tracking.