# Data Migration Pipeline for Ownexa-JP

A robust and repeatable data migration pipeline that converts CSV files to PostgreSQL database with comprehensive data validation, cleaning, and error handling.

## 🚀 Features

- **Automatic CSV Detection**: Automatically detects CSV file types (properties, tenants, leases, owners, balances)
- **Data Validation**: Comprehensive validation rules for all data types
- **Data Cleaning**: Advanced data cleaning and standardization
- **Error Handling**: Robust error handling with detailed logging
- **Database Backup**: Automatic database backup before migration
- **Dry Run Mode**: Test migrations without making database changes
- **Batch Processing**: Efficient batch processing for large datasets
- **Comprehensive Logging**: Detailed logging with configurable levels
- **Flexible Configuration**: Easy-to-configure field mappings and validation rules

## 📋 Prerequisites

- Python 3.7+
- PostgreSQL database
- Required Python packages (see requirements.txt)

## 🛠️ Installation

1. **Clone or download the project files**
2. **Install required dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Additional dependencies for the migration pipeline**:
   ```bash
   pip install pandas python-dateutil
   ```

## 📁 Project Structure

```
Ownexa-JP/
├── data_migration_pipeline.py    # Main migration pipeline
├── migration_config.py           # Configuration and field mappings
├── data_cleaner.py              # Data cleaning utilities
├── run_migration.py             # CLI script to run migrations
├── MIGRATION_README.md          # This file
├── Properties_20250819_101214.csv
├── Tenants_2025-08-25T02_25_27Z.csv
├── Leases20250824_102519.csv
├── RentalOwners_20250824_102533.csv
├── OutstandingLeaseBalances_20250825_022538.csv
└── models/                      # Database models
    ├── __init__.py
    ├── property.py
    ├── tenant.py
    ├── user.py
    └── ...
```

## 🚀 Quick Start

### 1. Basic Migration

Run the migration with default settings:

```bash
python run_migration.py
```

### 2. Dry Run (Recommended First Step)

Test the migration without making database changes:

```bash
python run_migration.py --dry-run
```

### 3. Custom CSV Directory

Specify a custom directory containing CSV files:

```bash
python run_migration.py --csv-dir ./data
```

## 📊 Supported CSV File Types

The pipeline automatically detects and processes these file types:

### Properties
- **File Pattern**: `*property*.csv`, `*properties*.csv`
- **Required Columns**: Property name, Address 1, City/Locality, State/Province, Postal code
- **Example**: `Properties_20250819_101214.csv`

### Tenants
- **File Pattern**: `*tenant*.csv`, `*tenants*.csv`
- **Required Columns**: First name, Last name, Property name
- **Example**: `Tenants_2025-08-25T02_25_27Z.csv`

### Leases
- **File Pattern**: `*lease*.csv`, `*leases*.csv`
- **Required Columns**: Account number, Tenants
- **Example**: `Leases20250824_102519.csv`

### Rental Owners
- **File Pattern**: `*owner*.csv`, `*owners*.csv`
- **Required Columns**: Owner name
- **Example**: `RentalOwners_20250824_102533.csv`

### Outstanding Balances
- **File Pattern**: `*balance*.csv`, `*balances*.csv`
- **Required Columns**: Tenant name, Property, Amount due
- **Example**: `OutstandingLeaseBalances_20250825_022538.csv`

## ⚙️ Configuration

### Field Mappings

The pipeline uses configurable field mappings to map CSV columns to database fields. These are defined in `migration_config.py`:

```python
PROPERTY_FIELD_MAPPINGS = [
    FieldMapping("Property name", "title", required=True, data_type="string"),
    FieldMapping("Address 1", "street_address_1", required=True, data_type="string"),
    FieldMapping("City/Locality", "city", required=True, data_type="string"),
    # ... more mappings
]
```

### Validation Rules

Comprehensive validation rules for different data types:

- **Email**: Regex pattern validation
- **Phone**: Format and length validation
- **Date**: Multiple date format support
- **Decimal**: Precision and scale validation
- **Postal Code**: US format validation
- **State**: US state abbreviation validation

### Data Cleaning Rules

Configurable cleaning rules for data standardization:

- **String**: Whitespace trimming, case conversion
- **Email**: Lowercase conversion, space removal
- **Phone**: Format standardization, non-digit removal
- **Address**: Abbreviation standardization
- **Currency**: Symbol removal, comma removal

## 🔧 Command Line Options

### Basic Options

```bash
python run_migration.py [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--csv-dir` | CSV files directory | Current directory |
| `--backup-dir` | Backup directory | `./backups` |
| `--dry-run` | Test without database changes | False |
| `--no-validation` | Skip data validation | False |
| `--no-cleaning` | Skip data cleaning | False |
| `--no-backup` | Skip database backup | False |

### Performance Options

| Option | Description | Default |
|--------|-------------|---------|
| `--batch-size` | Database batch size | 100 |
| `--max-errors` | Max errors before stopping | 50 |

### Logging Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose, -v` | Enable verbose output | False |
| `--log-level` | Set logging level | INFO |
| `--log-file` | Log file path | `migration.log` |

### Examples

```bash
# Run with custom settings
python run_migration.py --csv-dir ./data --batch-size 50 --log-level DEBUG

# Skip validation and backup for testing
python run_migration.py --no-validation --no-backup --dry-run

# Custom backup directory
python run_migration.py --backup-dir ./database_backups
```

## 📝 Data Validation

### Property Validation

- Required fields: Property name, Address 1, City, State, Postal code
- Postal code format validation
- State abbreviation validation
- Building type standardization

### Tenant Validation

- Required fields: First name, Last name, Property name
- Email format validation
- Phone number format validation
- Date parsing for lease dates
- Rent amount validation

### Data Quality Checks

- Duplicate detection
- Data type validation
- Range validation for numeric fields
- Format validation for structured fields

## 🧹 Data Cleaning

### String Cleaning

- Whitespace trimming
- Extra space removal
- Case conversion
- Special character handling

### Address Standardization

- Common abbreviation expansion
- Street type standardization
- Directional abbreviation expansion
- Unit/suite abbreviation standardization

### Phone Number Formatting

- US phone number formatting: (XXX) XXX-XXXX
- Non-digit character removal
- Country code handling

### Currency Cleaning

- Currency symbol removal
- Comma removal
- Decimal validation
- Range checking

## 🗄️ Database Integration

### Supported Models

- **Property**: Real estate properties
- **Tenant**: Property tenants
- **User**: Property owners/users
- **DraftLease**: Lease agreements
- **OutstandingBalance**: Financial balances

### Foreign Key Relationships

- Properties → Users (owners)
- Tenants → Properties
- Leases → Tenants + Properties
- Balances → Tenants + Properties

### Data Integrity

- Duplicate prevention
- Referential integrity
- Transaction safety
- Rollback capability

## 📊 Migration Process

### 1. File Discovery
- Scan directory for CSV files
- Auto-detect file types
- Validate file accessibility

### 2. Data Reading
- CSV parsing with delimiter detection
- Encoding handling
- Header validation

### 3. Data Validation
- Required field checking
- Data type validation
- Business rule validation
- Error collection

### 4. Data Cleaning
- String standardization
- Format normalization
- Data transformation
- Quality improvement

### 5. Database Migration
- Table backup creation
- Batch processing
- Error handling
- Transaction management

### 6. Reporting
- Migration summary
- Error reporting
- Warning collection
- Performance metrics

## 🚨 Error Handling

### Error Types

- **Validation Errors**: Data format/quality issues
- **Database Errors**: Connection/query issues
- **File Errors**: CSV reading/parsing issues
- **System Errors**: Memory/permission issues

### Error Recovery

- Continue on error (configurable)
- Detailed error logging
- Error categorization
- Recovery suggestions

### Error Reporting

- Console output
- Log file recording
- Error summary
- Detailed error details

## 📈 Performance Optimization

### Batch Processing

- Configurable batch sizes
- Memory-efficient processing
- Progress tracking
- Performance monitoring

### Database Optimization

- Transaction batching
- Connection pooling
- Query optimization
- Index utilization

### Memory Management

- Streaming CSV processing
- Garbage collection
- Memory monitoring
- Resource cleanup

## 🔍 Monitoring and Logging

### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General information
- **WARNING**: Warning messages
- **ERROR**: Error messages
- **CRITICAL**: Critical errors

### Log Output

- Console output
- File logging
- Log rotation
- Performance metrics

### Progress Tracking

- File processing progress
- Record processing count
- Error accumulation
- Time estimates

## 🧪 Testing

### Dry Run Mode

Test migrations without database changes:

```bash
python run_migration.py --dry-run
```

### Validation Testing

Test data validation without migration:

```bash
python run_migration.py --no-validation --dry-run
```

### Performance Testing

Test with different batch sizes:

```bash
python run_migration.py --batch-size 10 --dry-run
python run_migration.py --batch-size 1000 --dry-run
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database configuration
   - Verify network connectivity
   - Check user permissions

2. **CSV Parsing Errors**
   - Verify CSV format
   - Check file encoding
   - Validate delimiter detection

3. **Validation Errors**
   - Review data quality
   - Check field mappings
   - Verify required fields

4. **Memory Issues**
   - Reduce batch size
   - Process smaller files
   - Monitor system resources

### Debug Mode

Enable detailed debugging:

```bash
python run_migration.py --log-level DEBUG --verbose
```

### Error Logs

Check the migration log file for detailed error information:

```bash
tail -f migration.log
```

## 🔧 Customization

### Adding New File Types

1. Update `FILE_TYPE_PATTERNS` in `migration_config.py`
2. Add field mappings
3. Create validation rules
4. Update database mappings

### Custom Validation Rules

Add custom validation in `DataValidator` class:

```python
@staticmethod
def validate_custom_field(value: str) -> bool:
    # Custom validation logic
    return True
```

### Custom Data Cleaners

Extend `DataCleaner` class with new methods:

```python
@staticmethod
def clean_custom_field(value: str) -> str:
    # Custom cleaning logic
    return cleaned_value
```

## 📚 API Reference

### Main Classes

- **DataMigrationPipeline**: Main pipeline orchestrator
- **CSVProcessor**: CSV file processing
- **DataValidator**: Data validation
- **DataCleaner**: Data cleaning utilities
- **DatabaseMigrator**: Database operations

### Key Methods

- `run_migration()`: Execute the migration pipeline
- `validate_data()`: Validate CSV data
- `clean_record()`: Clean individual records
- `migrate_properties()`: Migrate property data
- `migrate_tenants()`: Migrate tenant data

## 🤝 Contributing

### Development Setup

1. Clone the repository
2. Install development dependencies
3. Run tests
4. Submit pull requests

### Code Style

- Follow PEP 8 guidelines
- Add type hints
- Include docstrings
- Write unit tests

## 📄 License

This project is part of the Ownexa-JP property management system.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section
2. Review the error logs
3. Enable debug mode
4. Contact the development team

## 🔄 Version History

- **v1.0.0**: Initial release with basic migration capabilities
- **v1.1.0**: Added comprehensive data validation
- **v1.2.0**: Enhanced data cleaning and error handling
- **v1.3.0**: Added CLI interface and configuration management

---

**Note**: Always test migrations in a development environment before running in production. Use dry-run mode to validate your data and configuration.
