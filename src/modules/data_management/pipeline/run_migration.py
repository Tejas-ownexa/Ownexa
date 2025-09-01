#!/usr/bin/env python3
"""
CLI script to run the Data Migration Pipeline
Usage: python run_migration.py [options]
"""

import argparse
import sys
import os
from pathlib import Path

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_migration_pipeline import DataMigrationPipeline, MigrationConfig
from migration_config import get_logging_config, get_backup_config, get_performance_config

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Data Migration Pipeline for CSV to PostgreSQL",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run migration with default settings
  python run_migration.py

  # Run migration in dry-run mode (no database changes)
  python run_migration.py --dry-run

  # Run migration with custom CSV directory
  python run_migration.py --csv-dir ./data

  # Run migration with specific configuration
  python run_migration.py --no-validation --no-backup --batch-size 50

  # Run migration with verbose logging
  python run_migration.py --verbose --log-level DEBUG
        """
    )
    
    # File and directory options
    parser.add_argument(
        '--csv-dir', 
        default='.',
        help='Directory containing CSV files (default: current directory)'
    )
    
    parser.add_argument(
        '--backup-dir',
        default='./backups',
        help='Directory for database backups (default: ./backups)'
    )
    
    # Migration behavior options
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run migration without making database changes (default: False)'
    )
    
    parser.add_argument(
        '--no-validation',
        action='store_true',
        help='Skip data validation (default: False)'
    )
    
    parser.add_argument(
        '--no-cleaning',
        action='store_true',
        help='Skip data cleaning (default: False)'
    )
    
    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='Skip database backup (default: False)'
    )
    
    # Performance options
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Batch size for database operations (default: 100)'
    )
    
    parser.add_argument(
        '--max-errors',
        type=int,
        default=50,
        help='Maximum number of errors before stopping (default: 50)'
    )
    
    # Logging options
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    parser.add_argument(
        '--log-level',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default='INFO',
        help='Set logging level (default: INFO)'
    )
    
    parser.add_argument(
        '--log-file',
        default='migration.log',
        help='Log file path (default: migration.log)'
    )
    
    # Output options
    parser.add_argument(
        '--output-format',
        choices=['text', 'json', 'csv'],
        default='text',
        help='Output format for reports (default: text)'
    )
    
    parser.add_argument(
        '--create-report',
        action='store_true',
        help='Create detailed migration report'
    )
    
    # Database options
    parser.add_argument(
        '--db-url',
        help='Database connection URL (overrides config file)'
    )
    
    parser.add_argument(
        '--create-tables',
        action='store_true',
        help='Create database tables if they don\'t exist'
    )
    
    return parser.parse_args()

def validate_arguments(args):
    """Validate command line arguments"""
    errors = []
    
    # Check if CSV directory exists
    if not os.path.exists(args.csv_dir):
        errors.append(f"CSV directory does not exist: {args.csv_dir}")
    
    # Check if CSV directory contains CSV files
    csv_files = [f for f in os.listdir(args.csv_dir) if f.lower().endswith('.csv')]
    if not csv_files:
        errors.append(f"No CSV files found in directory: {args.csv_dir}")
    
    # Check batch size
    if args.batch_size <= 0:
        errors.append("Batch size must be positive")
    
    # Check max errors
    if args.max_errors <= 0:
        errors.append("Max errors must be positive")
    
    # Check backup directory
    if not args.no_backup:
        backup_path = Path(args.backup_dir)
        if not backup_path.exists():
            try:
                backup_path.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                errors.append(f"Cannot create backup directory {args.backup_dir}: {e}")
    
    if errors:
        print("Error: Invalid arguments:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    return True

def setup_logging(args):
    """Setup logging configuration"""
    import logging
    
    # Get logging config
    log_config = get_logging_config()
    
    # Override with command line arguments
    log_config['log_level'] = args.log_level
    log_config['log_file'] = args.log_file
    log_config['console_output'] = True
    log_config['file_output'] = True
    
    # Configure logging
    numeric_level = getattr(logging, log_config['log_level'].upper(), None)
    
    # Create formatter
    formatter = logging.Formatter(log_config['log_format'])
    
    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    if log_config['console_output']:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(numeric_level)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # File handler
    if log_config['file_output']:
        try:
            file_handler = logging.FileHandler(log_config['log_file'])
            file_handler.setLevel(numeric_level)
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
        except Exception as e:
            print(f"Warning: Could not create log file {log_config['log_file']}: {e}")
    
    return root_logger

def create_migration_config(args):
    """Create migration configuration from arguments"""
    config = MigrationConfig(
        csv_directory=args.csv_dir,
        backup_directory=args.backup_dir,
        create_backup=not args.no_backup,
        validate_data=not args.no_validation,
        clean_data=not args.no_cleaning,
        dry_run=args.dry_run,
        batch_size=args.batch_size,
        max_errors=args.max_errors
    )
    
    return config

def print_migration_info(config, args):
    """Print migration configuration information"""
    print("=" * 60)
    print("DATA MIGRATION PIPELINE")
    print("=" * 60)
    print(f"CSV Directory: {config.csv_directory}")
    print(f"Backup Directory: {config.backup_directory}")
    print(f"Dry Run: {config.dry_run}")
    print(f"Data Validation: {config.validate_data}")
    print(f"Data Cleaning: {config.clean_data}")
    print(f"Create Backup: {config.create_backup}")
    print(f"Batch Size: {config.batch_size}")
    print(f"Max Errors: {config.max_errors}")
    print(f"Log Level: {args.log_level}")
    print(f"Log File: {args.log_file}")
    print("=" * 60)
    
    # List CSV files
    csv_files = [f for f in os.listdir(config.csv_directory) if f.lower().endswith('.csv')]
    print(f"\nFound {len(csv_files)} CSV files:")
    for csv_file in sorted(csv_files):
        file_path = os.path.join(config.csv_directory, csv_file)
        file_size = os.path.getsize(file_path)
        print(f"  - {csv_file} ({file_size:,} bytes)")
    
    print()

def main():
    """Main entry point"""
    # Parse arguments
    args = parse_arguments()
    
    # Validate arguments
    if not validate_arguments(args):
        sys.exit(1)
    
    # Setup logging
    logger = setup_logging(args)
    
    try:
        # Create migration configuration
        config = create_migration_config(args)
        
        # Print migration information
        print_migration_info(config, args)
        
        # Confirm before proceeding (unless dry-run)
        if not config.dry_run:
            response = input("Do you want to proceed with the migration? (y/N): ")
            if response.lower() not in ['y', 'yes']:
                print("Migration cancelled.")
                sys.exit(0)
        
        # Create and run pipeline
        logger.info("Starting data migration pipeline...")
        pipeline = DataMigrationPipeline(config)
        
        success = pipeline.run_migration()
        
        if success:
            logger.info("Migration completed successfully!")
            print("\n✅ Migration completed successfully!")
            return 0
        else:
            logger.error("Migration failed!")
            print("\n❌ Migration failed! Check the log file for details.")
            return 1
            
    except KeyboardInterrupt:
        print("\n\nMigration interrupted by user.")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        print(f"\n❌ Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
