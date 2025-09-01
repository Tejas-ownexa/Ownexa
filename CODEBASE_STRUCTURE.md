# Ownexa Property Management System - Restructured Codebase

## Overview
The codebase has been restructured to follow a modular, functionality-based organization that promotes maintainability, scalability, and clear separation of concerns.

## New Directory Structure

```
📁 Ownexa-test/
├── 📁 src/                          # Main source code directory
│   ├── 📁 core/                     # Core application files
│   │   ├── app.py                   # Main Flask application
│   │   └── wsgi.py                  # WSGI entry point
│   │
│   ├── 📁 config/                   # Configuration files
│   │   ├── config.py                # Main configuration
│   │   └── config_neon.py           # Neon database configuration
│   │
│   ├── 📁 database/                 # Database related files
│   │   ├── database_tables.sql      # Database schema
│   │   ├── updated_database.sql     # Updated schema
│   │   └── 📁 migrations/           # Database migrations
│   │
│   ├── 📁 modules/                  # Feature modules
│   │   ├── 📁 auth/                 # Authentication & User Management
│   │   │   ├── 📁 models/           # User models
│   │   │   ├── 📁 routes/           # Auth routes
│   │   │   ├── 📁 services/         # Auth services
│   │   │   └── 📁 utils/            # Auth utilities
│   │   │
│   │   ├── 📁 properties/           # Property Management
│   │   │   ├── 📁 models/           # Property, Listing, Association models
│   │   │   ├── 📁 routes/           # Property routes
│   │   │   ├── 📁 services/         # Property services
│   │   │   └── 📁 utils/            # Property utilities
│   │   │
│   │   ├── 📁 tenants/              # Tenant & Lease Management
│   │   │   ├── 📁 models/           # Tenant, Lease, RentalOwner models
│   │   │   ├── 📁 routes/           # Tenant routes
│   │   │   ├── 📁 services/         # Tenant services
│   │   │   └── 📁 utils/            # Tenant utilities
│   │   │
│   │   ├── 📁 financial/            # Financial Management
│   │   │   ├── 📁 models/           # Financial, Accountability models
│   │   │   ├── 📁 routes/           # Financial routes
│   │   │   ├── 📁 services/         # Financial services
│   │   │   └── 📁 utils/            # Financial utilities
│   │   │
│   │   ├── 📁 maintenance/          # Maintenance Management
│   │   │   ├── 📁 models/           # Maintenance, Vendor models
│   │   │   ├── 📁 routes/           # Maintenance routes
│   │   │   ├── 📁 services/         # Maintenance services
│   │   │   └── 📁 utils/            # Maintenance utilities
│   │   │
│   │   ├── 📁 reporting/            # Reporting & Analytics
│   │   │   ├── 📁 models/           # Report models
│   │   │   ├── 📁 routes/           # Reporting routes
│   │   │   ├── 📁 services/         # Reporting services
│   │   │   └── 📁 utils/            # Reporting utilities
│   │   │
│   │   ├── 📁 data_management/      # Data Import/Export & Pipelines
│   │   │   ├── 📁 models/           # Data models
│   │   │   ├── 📁 routes/           # Pipeline routes
│   │   │   ├── 📁 services/         # Data services
│   │   │   ├── 📁 utils/            # Data utilities
│   │   │   └── 📁 pipeline/         # Migration pipelines
│   │   │
│   │   └── 📁 ai_services/          # AI & Chatbot Services
│   │       ├── 📁 models/           # AI models
│   │       ├── 📁 routes/           # Chatbot routes
│   │       ├── 📁 services/         # AI services
│   │       └── 📁 utils/            # AI utilities
│   │
│   ├── 📁 shared/                   # Shared components
│   │   ├── 📁 models/               # Base models and DB setup
│   │   ├── 📁 utils/                # Shared utilities
│   │   └── 📁 services/             # Shared services
│   │
│   └── 📁 api/                      # API layer
│       └── 📁 v1/                   # API version 1
│           └── __init__.py          # Route registration
│
├── 📁 frontend/                     # React frontend (unchanged)
├── 📁 uploads/                      # File uploads
├── 📁 logs/                         # Application logs
├── app.py                           # Main entry point
├── requirements.txt                 # Python dependencies
└── CODEBASE_STRUCTURE.md           # This documentation
```

## Key Benefits of the New Structure

### 1. **Modular Organization**
- Each functional area is self-contained
- Clear separation of concerns
- Easy to navigate and understand

### 2. **Scalability**
- New features can be added as new modules
- Each module can be developed independently
- Easy to split into microservices if needed

### 3. **Maintainability**
- Related code is grouped together
- Consistent structure across modules
- Clear import paths

### 4. **Testing**
- Each module can be tested independently
- Clear boundaries for unit and integration tests

### 5. **Team Collaboration**
- Different teams can work on different modules
- Reduced merge conflicts
- Clear ownership boundaries

## Module Descriptions

### 🔐 Auth Module
- User registration and login
- Authentication middleware
- User profile management
- Role-based access control

### 🏢 Properties Module
- Property CRUD operations
- Property listings management
- Association management
- Property search and filtering

### 👥 Tenants Module
- Tenant management
- Lease agreements
- Rental owner profiles
- Rent collection

### 💰 Financial Module
- Financial reporting
- Accountability tracking
- Payment processing
- Transaction management

### 🔧 Maintenance Module
- Maintenance request tracking
- Vendor management
- Work order management
- Maintenance scheduling

### 📊 Reporting Module
- Analytics and dashboards
- Custom reports
- Data visualization
- Export functionality

### 📥 Data Management Module
- Excel import/export
- Data migration pipelines
- Data validation
- Bulk operations

### 🤖 AI Services Module
- Chatbot functionality
- Admin bot
- AI-powered features
- Natural language processing

## Import Changes

### Old Import Style
```python
from models.user import User
from routes.auth_routes import auth_bp
```

### New Import Style
```python
from src.modules.auth.models.user import User
from src.modules.auth.routes.auth_routes import auth_bp
```

## Running the Application

The main entry point remains `app.py` at the root level, which now imports from the restructured `src/` directory.

```bash
python app.py
```

## Development Guidelines

1. **Follow the module structure** when adding new features
2. **Use relative imports** within modules when possible
3. **Keep shared code** in the `shared/` directory
4. **Add proper `__init__.py`** files for all packages
5. **Document new modules** and their purpose

## Migration Notes

- All test files and unnecessary documentation have been removed
- File structure now follows Python package conventions
- Database models inherit from a shared `BaseModel`
- Route registration is centralized in `api/v1/__init__.py`

This restructured codebase provides a solid foundation for future development and maintenance of the Ownexa Property Management System.
