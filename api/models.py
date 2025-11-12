"""
Database models for the Sean 4EX game.

This module defines SQLAlchemy ORM models for rooms and players.
"""

from datetime import datetime
from typing import List

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Room(Base):
    """
    Represents a game room where players gather to play.
    
    Attributes:
        id: Primary key
        code: Unique 6-character room code for joining
        game_type: Type of game (default: 'sean_4ex')
        status: Current room status ('waiting', 'active', 'finished')
        created_at: Timestamp when room was created
        created_by_player_id: Foreign key to the creator player
        creator: Relationship to the creator Player
        players: Relationship to all Players in this room
    """
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(6), unique=True, nullable=False, index=True)
    game_type = Column(String(50), nullable=False, default="sean_4ex")
    status = Column(String(20), nullable=False, default="waiting")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_by_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    
    # Relationships
    creator = relationship(
        "Player",
        foreign_keys=[created_by_player_id],
        back_populates="created_rooms"
    )
    players = relationship(
        "Player",
        foreign_keys="Player.room_id",
        back_populates="room"
    )
    
    def __repr__(self) -> str:
        return f"<Room(id={self.id}, code='{self.code}', status='{self.status}')>"


class Player(Base):
    """
    Represents a player in a game room.
    
    Attributes:
        id: Primary key
        nickname: Player's chosen nickname (3-20 characters)
        room_id: Foreign key to the room they're in (nullable)
        is_creator: Whether this player created the room
        joined_at: Timestamp when player joined
        room: Relationship to the Room this player is in
        created_rooms: Relationship to Rooms this player created
    """
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nickname = Column(String(20), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    is_creator = Column(Boolean, nullable=False, default=False)
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    room = relationship(
        "Room",
        foreign_keys=[room_id],
        back_populates="players"
    )
    created_rooms = relationship(
        "Room",
        foreign_keys="Room.created_by_player_id",
        back_populates="creator"
    )
    
    def __repr__(self) -> str:
        return f"<Player(id={self.id}, nickname='{self.nickname}', is_creator={self.is_creator})>"

