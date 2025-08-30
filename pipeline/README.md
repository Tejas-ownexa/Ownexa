# 🚀 Data Pipeline - Excel/CSV to Database Import System

This folder contains all the automated pipeline components for importing Excel/CSV data into the PostgreSQL database for the Ownexa property management system.

## 📁 Pipeline Contents

### 🔧 Core Pipeline Scripts
- **`data_migration_pipeline.py`** - Main pipeline orchestrator with comprehensive data processing
- **`run_migration.py`** - CLI script to execute migrations with various options
- **`migration_config.py`** - Configuration file with field mappings and validation rules
- **`data_cleaner.py`** - Data cleaning and standardization utilities
- **`MIGRATION_README.md`** - Detailed documentation for the migration system

### 📊 Sample Data Files
- **`Properties_20250819_101214.csv`** - Property listings data
- **`Tenants_2025-08-25T02_25_27Z.csv`** - Tenant information data
- **`Leases20250824_102519.csv`** - Lease agreements data
- **`RentalOwners_20250824_102533.csv`** - Property owners data
- **`OutstandingLeaseBalances_20250825_022538.csv`** - Outstanding balance data

## 🎯 What This Pipeline Does

### 1. **Automatic File Detection**
- Detects CSV file types based on filename patterns and column headers
- Supports: Properties, Tenants, Leases, Owners, Outstanding Balances

### 2. **Data Validation & Cleaning**
- **Email validation** - Proper email format checking
- **Phone number standardization** - Formats phone numbers consistently
- **Address cleaning** - Standardizes address formats and abbreviations
- **Currency processing** - Cleans and validates monetary amounts
- **Date parsing** - Handles multiple date formats
- **Data deduplication** - Prevents duplicate records

### 3. **Database Integration**
- **Safe migrations** - Dry-run mode for testing
- **Backup creation** - Automatic database backups before changes
- **Error handling** - Comprehensive error logging and recovery
- **Batch processing** - Efficient handling of large datasets

## 🚀 Quick Start

### 1. **Test Migration (Recommended First Step)**
```bash
cd pipeline
python run_migration.py --dry-run
```

### 2. **Run Full Migration**
```bash
python run_migration.py --csv-dir . --verbose
```

### 3. **Custom Options**
```bash
# Skip validation for faster processing
python run_migration.py --no-validation

# Custom batch size for large files
python run_migration.py --batch-size 200

# Enable debug logging
python run_migration.py --log-level DEBUG
```

## 📋 Supported Data Types

### Properties
- **Required**: Property name, Address, City, State, Postal code
- **Optional**: Building type, Year built, Description, Reserve amount

### Tenants  
- **Required**: First name, Last name, Property name
- **Optional**: Email, Phone, Address, Lease dates, Emergency contact

### Leases
- **Required**: Account number, Tenants
- **Optional**: Start/End dates, Rent amount, Lease type

### Owners
- **Required**: Owner name
- **Optional**: Email, Phone, Address

### Outstanding Balances
- **Required**: Tenant name, Property, Amount due
- **Optional**: Due date, Status

## 🛠️ Pipeline Features

### Data Cleaning Capabilities
- **String normalization** - Trim whitespace, standardize case
- **Address standardization** - Expand abbreviations (St→Street, Ave→Avenue)
- **Phone formatting** - Convert to (XXX) XXX-XXXX format
- **Email normalization** - Lowercase, remove spaces
- **Currency cleaning** - Remove symbols, validate amounts
- **Date parsing** - Handle MM/DD/YYYY, YYYY-MM-DD, and other formats

### Validation Rules
- **Email format** - RFC compliant email validation
- **Phone numbers** - US phone number format validation
- **Postal codes** - US ZIP code format validation
- **States** - US state abbreviation validation
- **Required fields** - Ensures all mandatory data is present
- **Data types** - Validates numeric, date, and text fields

### Error Handling
- **Detailed logging** - Track all processing steps
- **Error categorization** - Validation vs system errors
- **Recovery options** - Continue processing despite errors
- **Error reporting** - Summary of all issues found

## 📊 Usage Examples

### Import All Data Files
```bash
# Place your CSV files in the pipeline folder
python run_migration.py
```

### Import from Custom Directory
```bash
python run_migration.py --csv-dir ./data
```

### Advanced Options
```bash
# Full migration with all features
python run_migration.py \
  --csv-dir ./data \
  --backup-dir ./backups \
  --batch-size 100 \
  --max-errors 50 \
  --log-level INFO \
  --verbose
```

## 🔍 Monitoring & Logs

### Log Files
- **`migration.log`** - Detailed processing log
- Console output - Real-time progress updates

### Progress Tracking
- File processing status
- Record counts (total, successful, failed)
- Error summaries
- Performance metrics

## ⚙️ Configuration

### Field Mappings
The `migration_config.py` file contains mappings between CSV column names and database fields:

```python
PROPERTY_FIELD_MAPPINGS = [
    FieldMapping("Property name", "title", required=True),
    FieldMapping("Address 1", "street_address_1", required=True),
    # ... more mappings
]
```

### Validation Rules
Custom validation rules for different data types:

```python
VALIDATION_RULES = {
    "email": ValidationRule(
        rule_type="regex",
        parameters={"pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
        error_message="Invalid email format"
    ),
    # ... more rules
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check if database is running
   docker-compose ps
   
   # Start database if needed
   docker-compose up -d
   ```

2. **CSV Format Issues**
   ```bash
   # Test with dry-run first
   python run_migration.py --dry-run --verbose
   ```

3. **Memory Issues with Large Files**
   ```bash
   # Reduce batch size
   python run_migration.py --batch-size 50
   ```

### Debug Mode
```bash
python run_migration.py --log-level DEBUG --verbose
```

## 🔧 Extending the Pipeline

### Add New File Types
1. Update `FILE_TYPE_PATTERNS` in `migration_config.py`
2. Add field mappings for new data type
3. Create validation rules
4. Update database model mappings

### Custom Data Cleaners
Extend the `DataCleaner` class in `data_cleaner.py`:

```python
@staticmethod
def clean_custom_field(value: str) -> str:
    # Your custom cleaning logic
    return cleaned_value
```

## 📈 Performance Tips

- Use `--dry-run` first to validate data
- Adjust `--batch-size` based on available memory
- Enable `--verbose` for detailed progress tracking
- Check logs for optimization opportunities

## 🔒 Safety Features

- **Dry-run mode** - Test without database changes
- **Automatic backups** - Database backup before migration
- **Transaction safety** - Rollback on errors
- **Validation checks** - Prevent bad data import
- **Error recovery** - Continue processing despite individual record errors

---

**Note**: Always test with `--dry-run` before running actual migrations, especially in production environments.

For detailed documentation, see `MIGRATION_README.md` in this folder.
