"""
GraphQL types for the Sean 4EX game.

This module defines Strawberry GraphQL types that correspond to
database models and are used in queries and mutations.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

import strawberry


@strawberry.enum
class RoomStatus(Enum):
    """Room status enumeration."""
    WAITING = "waiting"
    ACTIVE = "active"
    FINISHED = "finished"


@strawberry.type
class PlayerType:
    """
    GraphQL type for a player.
    
    Represents a user participating in a game room.
    """
    id: strawberry.ID
    nickname: str
    is_creator: bool
    joined_at: datetime
    
    @classmethod
    def from_db_model(cls, player):
        """
        Create a PlayerType from a database Player model.
        
        Args:
            player: models.Player instance
            
        Returns:
            PlayerType instance
        """
        return cls(
            id=strawberry.ID(f"Player:{player.id}"),
            nickname=player.nickname,
            is_creator=player.is_creator,
            joined_at=player.joined_at,
        )


@strawberry.type
class RoomType:
    """
    GraphQL type for a game room.
    
    Represents a room where players gather to play the game.
    """
    id: strawberry.ID
    code: str
    game_type: str
    status: RoomStatus
    created_at: datetime
    creator: PlayerType
    players: List[PlayerType]
    
    @classmethod
    def from_db_model(cls, room):
        """
        Create a RoomType from a database Room model.
        
        Args:
            room: models.Room instance
            
        Returns:
            RoomType instance
        """
        return cls(
            id=strawberry.ID(f"Room:{room.id}"),
            code=room.code,
            game_type=room.game_type,
            status=RoomStatus(room.status),
            created_at=room.created_at,
            creator=PlayerType.from_db_model(room.creator),
            players=[PlayerType.from_db_model(p) for p in room.players],
        )


@strawberry.type
class CreateRoomResult:
    """
    Result type for the createRoom mutation.
    
    Contains both the created room and the creator player.
    """
    room: RoomType
    player: PlayerType


@strawberry.type
class JoinRoomResult:
    """
    Result type for the joinRoom mutation.
    
    Contains success status, optional error message, and the room/player data on success.
    """
    success: bool
    error: Optional[str] = None
    room: Optional[RoomType] = None
    player: Optional[PlayerType] = None


@strawberry.type
class StartGameResult:
    """
    Result type for the startGame mutation.
    
    Contains success status, optional error message, and the room data on success.
    """
    success: bool
    error: Optional[str] = None
    room: Optional[RoomType] = None

