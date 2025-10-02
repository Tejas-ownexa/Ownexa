from config import db
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
import logging
from functools import wraps

def handle_db_error(func):
    """
    Decorator to handle database errors and ensure proper transaction rollback
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (SQLAlchemyError, IntegrityError, OperationalError) as e:
            # Log the error
            logging.error(f"Database error in {func.__name__}: {str(e)}")
            
            # Rollback the current transaction
            try:
                db.session.rollback()
                logging.info("Transaction rolled back successfully")
            except Exception as rollback_error:
                logging.error(f"Error during rollback: {str(rollback_error)}")
            
            # Re-raise the original error
            raise e
        except Exception as e:
            # For non-database errors, still try to rollback if there's an active transaction
            try:
                db.session.rollback()
            except:
                pass
            raise e
    
    return wrapper

def safe_db_operation(operation, *args, **kwargs):
    """
    Safely execute a database operation with proper error handling
    """
    try:
        result = operation(*args, **kwargs)
        db.session.commit()
        return result
    except (SQLAlchemyError, IntegrityError, OperationalError) as e:
        logging.error(f"Database operation failed: {str(e)}")
        db.session.rollback()
        raise e
    except Exception as e:
        db.session.rollback()
        raise e

def reset_db_connection():
    """
    Reset the database connection to clear any failed transactions
    """
    try:
        db.session.rollback()
        db.session.close()
        db.engine.dispose()
        logging.info("Database connection reset successfully")
    except Exception as e:
        logging.error(f"Error resetting database connection: {str(e)}")
        raise e
