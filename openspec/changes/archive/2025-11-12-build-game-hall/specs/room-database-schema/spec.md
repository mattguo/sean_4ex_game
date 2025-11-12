# Capability: Room Database Schema

**Change ID:** `build-game-hall`  
**Capability:** `room-database-schema`  
**Status:** Draft

## Overview

Define and implement SQLAlchemy models for Room and Player entities, configure database connection, and provide initialization utilities.

## ADDED Requirements

### Requirement: Room Model Definition

The system SHALL define a Room model with all necessary fields for game room management.

**Rationale:** Room is the core entity that represents a game session waiting for players or in progress.

#### Scenario: Room model has all required fields

**Given** a database schema is defined  
**When** the Room model is instantiated  
**Then** it SHALL have the following fields:
- `id`: Integer, primary key, auto-increment
- `code`: String(6), unique, not null, indexed
- `game_type`: String(50), not null, default='sean_4ex'
- `status`: String(20), not null, default='waiting'
- `created_at`: DateTime, not null, default=datetime.utcnow
- `created_by_player_id`: Integer, foreign key to players.id, not null

**And** the table name SHALL be `rooms`

#### Scenario: Room code is unique and indexed

**Given** the database has multiple rooms  
**When** attempting to insert a room with a duplicate code  
**Then** the database SHALL raise a unique constraint violation

**And** queries filtering by code SHALL use the index for performance

### Requirement: Player Model Definition

The system SHALL define a Player model representing users in game rooms.

**Rationale:** Players need persistent identity within rooms, including their nickname and creator status.

#### Scenario: Player model has all required fields

**Given** a database schema is defined  
**When** the Player model is instantiated  
**Then** it SHALL have the following fields:
- `id`: Integer, primary key, auto-increment
- `nickname`: String(20), not null
- `room_id`: Integer, foreign key to rooms.id, nullable
- `is_creator`: Boolean, not null, default=False
- `joined_at`: DateTime, not null, default=datetime.utcnow

**And** the table name SHALL be `players`

#### Scenario: Player belongs to a room

**Given** a player is created with a room_id  
**When** the player record is queried  
**Then** the player SHALL have a relationship to the Room entity

**And** the room SHALL have a relationship to all its Player entities

### Requirement: Database Configuration

The system SHALL provide database connection configuration using SQLAlchemy.

**Rationale:** Centralized database configuration ensures consistent connection management across the application.

#### Scenario: Database connection is configured

**Given** the application starts  
**When** database.py is imported  
**Then** it SHALL provide:
- A configured SQLAlchemy engine pointing to `api/game_state.db`
- A SessionLocal factory for creating database sessions
- A Base declarative base class for all models

#### Scenario: Database session management

**Given** a database operation is needed  
**When** a session is requested  
**Then** the system SHALL provide a session context manager  
**And** the session SHALL automatically commit on success  
**And** the session SHALL automatically rollback on error  
**And** the session SHALL always close after use

### Requirement: Database Initialization

The system SHALL provide a mechanism to create all tables on first run.

**Rationale:** Development and deployment need automated schema creation.

#### Scenario: Tables are created from models

**Given** the database file does not exist  
**When** the initialization function is called  
**Then** all tables SHALL be created from SQLAlchemy models  
**And** indexes SHALL be created  
**And** constraints SHALL be applied

#### Scenario: Initialization is idempotent

**Given** the database already has tables  
**When** the initialization function is called again  
**Then** no errors SHALL occur  
**And** existing data SHALL be preserved

## Implementation Notes

### File Structure
```
api/
├── models.py           # Room and Player models
├── database.py         # Database configuration and session management
└── init_db.py          # Database initialization script
```

### Example Usage
```python
from database import SessionLocal
from models import Room, Player

# Create a session
with SessionLocal() as session:
    # Create a room
    room = Room(code="ABC123", created_by_player_id=1)
    session.add(room)
    session.commit()
    
    # Query
    room = session.query(Room).filter_by(code="ABC123").first()
```

### Dependencies
- Add `sqlalchemy>=2.0.0` to pyproject.toml
- SQLite is included in Python standard library

### Testing Considerations
- Use in-memory SQLite database (`:memory:`) for tests
- Reset database between test cases
- Verify foreign key constraints are enforced

