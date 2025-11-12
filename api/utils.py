"""
Utility functions for the Sean 4EX game.

This module provides helper functions for room code generation,
validation, and other common operations.
"""

import logging
import re
import secrets
from typing import Tuple

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Character set for room codes (no ambiguous characters)
# Excluded: 0 (zero), O (oh), 1 (one), I (eye), l (el)
ROOM_CODE_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
ROOM_CODE_LENGTH = 6
MAX_CODE_GENERATION_ATTEMPTS = 10

# Nickname validation
NICKNAME_MIN_LENGTH = 3
NICKNAME_MAX_LENGTH = 20
NICKNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")


def generate_room_code() -> str:
    """
    Generate a random 6-character room code.
    
    Uses cryptographically secure random number generator.
    Returns codes using safe character set (no ambiguous characters).
    
    Returns:
        A 6-character room code string
        
    Example:
        >>> code = generate_room_code()
        >>> len(code)
        6
        >>> all(c in ROOM_CODE_CHARSET for c in code)
        True
    """
    return ''.join(
        secrets.choice(ROOM_CODE_CHARSET) 
        for _ in range(ROOM_CODE_LENGTH)
    )


def generate_unique_room_code(session: Session) -> str:
    """
    Generate a unique room code that doesn't exist in the database.
    
    Attempts to generate a code up to MAX_CODE_GENERATION_ATTEMPTS times.
    If all attempts result in collisions, raises an exception.
    
    Args:
        session: SQLAlchemy database session
        
    Returns:
        A unique 6-character room code
        
    Raises:
        RuntimeError: If unable to generate unique code after max attempts
        
    Example:
        >>> with get_db() as session:
        ...     code = generate_unique_room_code(session)
        ...     # code is guaranteed unique in database
    """
    from models import Room  # Import here to avoid circular dependency
    
    for attempt in range(1, MAX_CODE_GENERATION_ATTEMPTS + 1):
        code = generate_room_code()
        
        # Check if code already exists in database
        existing = session.query(Room).filter_by(code=code).first()
        
        if not existing:
            logger.debug(f"Generated unique room code: {code} (attempt {attempt})")
            return code
        
        logger.warning(f"Room code collision on attempt {attempt}: {code}")
    
    # All attempts failed
    error_msg = f"Failed to generate unique room code after {MAX_CODE_GENERATION_ATTEMPTS} attempts"
    logger.error(error_msg)
    raise RuntimeError(error_msg)


def validate_nickname(nickname: str) -> Tuple[bool, str]:
    """
    Validate a player nickname according to game rules.
    
    Rules:
    - Must not be empty
    - Must be between 3 and 20 characters
    - Must contain only letters, numbers, and underscores
    
    Args:
        nickname: The nickname string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        - is_valid: True if nickname is valid, False otherwise
        - error_message: Empty string if valid, error description if invalid
        
    Example:
        >>> validate_nickname("Alice")
        (True, '')
        >>> validate_nickname("AB")
        (False, 'Nickname must be at least 3 characters')
        >>> validate_nickname("Alice@123")
        (False, 'Nickname can only contain letters, numbers, and underscores')
    """
    if not nickname:
        return (False, "Nickname is required")
    
    if len(nickname) < NICKNAME_MIN_LENGTH:
        return (False, f"Nickname must be at least {NICKNAME_MIN_LENGTH} characters")
    
    if len(nickname) > NICKNAME_MAX_LENGTH:
        return (False, f"Nickname must be no more than {NICKNAME_MAX_LENGTH} characters")
    
    if not NICKNAME_PATTERN.match(nickname):
        return (False, "Nickname can only contain letters, numbers, and underscores")
    
    return (True, "")

