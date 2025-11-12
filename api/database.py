"""
Database configuration and session management.

This module provides SQLAlchemy engine, session factory, and base class
for all database models.
"""

import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

# Configure logging
logger = logging.getLogger(__name__)

# Database file path (relative to this file)
DB_PATH = Path(__file__).parent / "game_state.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False,  # Set to True for SQL query logging
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Create Base class for declarative models
Base = declarative_base()


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.
    
    Automatically commits on success, rolls back on error,
    and always closes the session.
    
    Usage:
        with get_db() as session:
            # Use session here
            room = session.query(Room).first()
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
        logger.debug("Database session committed successfully")
    except Exception as e:
        session.rollback()
        logger.error(f"Database session rolled back due to error: {e}")
        raise
    finally:
        session.close()
        logger.debug("Database session closed")

