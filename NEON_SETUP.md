# Neon PostgreSQL Database Setup

This guide will help you set up and use your Neon PostgreSQL database for the Real Estate Management System.

## 🔗 Connection Details

**Connection String:**
```
postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Database Info:**
- **Host**: ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech
- **Database**: neondb
- **User**: neondb_owner
- **Port**: 5432 (default)

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Test Connection
```bash
python test_neon_connection.py
```

### 3. Upload Database Schema
```bash
python upload_to_neon.py
```

### 4. Use Neon Database in Your App
```bash
# Copy the Neon config
cp config_neon.py config.py

# Or manually update config.py to use Neon connection string
```

## 📋 Step-by-Step Instructions

### Step 1: Test Database Connection
First, test if you can connect to your Neon database:

```bash
python test_neon_connection.py
```

This will:
- Test the connection to Neon
- Show PostgreSQL version
- List existing tables (if any)

### Step 2: Upload Database Schema
Upload your database_tables.sql file to create all the tables:

```bash
python upload_to_neon.py
```

This will:
- Connect to Neon database
- Execute all SQL statements from database_tables.sql
- Create 20+ tables for the real estate management system
- Verify that all tables were created successfully

### Step 3: Configure Your Application
Update your application to use the Neon database:

**Option A: Use the Neon config file**
```bash
cp config_neon.py config.py
```

**Option B: Manually update config.py**
Replace the SQLite configuration with:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Step 4: Run Your Application
```bash
python app.py
```

## 📊 Database Tables

The upload script will create the following tables:

1. **user** - User accounts and authentication
2. **properties** - Property listings and details
3. **tenants** - Tenant information and leases
4. **rent_roll** - Rent payment tracking
5. **outstanding_balances** - Outstanding payments
6. **draft_leases** - Lease drafts and templates
7. **lease_renewals** - Lease renewal tracking
8. **vendors** - Vendor profiles and services
9. **maintenance_requests** - Maintenance request tracking
10. **property_financials** - Property financial details
11. **loan_payments** - Loan payment tracking
12. **financial_transactions** - All financial transactions
13. **associations** - Homeowner associations
14. **property_favorites** - User property favorites
15. **ownership_accounts** - Ownership account details
16. **association_memberships** - Association memberships
17. **association_balances** - Association balance tracking
18. **violations** - Violation tracking
19. **listings** - Property listings
20. **applicants** - Applicant information

## 🔧 Troubleshooting

### Connection Issues
- **Error: "connection refused"** - Check if your Neon database is active
- **Error: "authentication failed"** - Verify the password in the connection string
- **Error: "SSL connection required"** - The connection string already includes SSL settings

### Upload Issues
- **Error: "table already exists"** - Tables may already exist, this is normal
- **Error: "permission denied"** - Check if your user has CREATE privileges

### Application Issues
- **Error: "no module named psycopg2"** - Run `pip install psycopg2-binary`
- **Error: "database does not exist"** - Verify the database name in the connection string

## 🔄 Switching Between Local and Neon

### To use Local SQLite:
```bash
# Use the original config.py (SQLite)
python app.py
```

### To use Neon PostgreSQL:
```bash
# Use the Neon config
cp config_neon.py config.py
python app.py
```

## 📝 Environment Variables

For production, consider using environment variables:

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

Then update config.py to use:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ownexa.db')
```

## 🎉 Success!

Once you've completed these steps, your application will be using the Neon PostgreSQL database. The database is:

- ✅ Cloud-hosted and accessible from anywhere
- ✅ Automatically backed up
- ✅ Scalable and reliable
- ✅ Ready for production use

## 📞 Support

If you encounter issues:
1. Check the Neon console for database status
2. Verify your connection string
3. Test the connection with the test script
4. Check the upload logs for specific errors
