"""
Database initialization script.

Run this script to create all database tables from SQLAlchemy models.
This script is idempotent - safe to run multiple times.

Usage:
    python init_db.py
    or
    uv run python init_db.py
"""

import logging
from pathlib import Path

from database import Base, engine, DB_PATH
from models import Room, Player  # Import models to register with Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def init_database() -> None:
    """
    Initialize the database by creating all tables.
    
    This function is idempotent - it will only create tables that don't exist.
    Existing tables and data will be preserved.
    """
    db_exists = DB_PATH.exists()
    
    if db_exists:
        logger.info(f"Database file already exists at: {DB_PATH}")
    else:
        logger.info(f"Creating new database at: {DB_PATH}")
    
    try:
        # Create all tables defined in models
        Base.metadata.create_all(bind=engine)
        
        if db_exists:
            logger.info("Database schema verified/updated successfully")
        else:
            logger.info("Database tables created successfully")
            
        # Log created tables
        table_names = list(Base.metadata.tables.keys())
        logger.info(f"Tables in database: {', '.join(table_names)}")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


if __name__ == "__main__":
    init_database()

