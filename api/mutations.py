"""
GraphQL mutations for the Sean 4EX game.

This module defines all GraphQL mutations including room creation,
player management, and game actions.
"""

import logging

import strawberry

from database import get_db
from graphql_types import CreateRoomResult, PlayerType, RoomType
from models import Player, Room
from utils import generate_unique_room_code, validate_nickname

logger = logging.getLogger(__name__)


@strawberry.type
class MyAPIMutation:
    """
    Root mutation type for the Sean 4EX GraphQL API.
    
    Contains all mutations for creating and managing game rooms and players.
    """
    
    @strawberry.mutation
    def create_room(self, nickname: str) -> CreateRoomResult:
        """
        Create a new game room with the given creator nickname.
        
        This mutation:
        1. Validates the nickname
        2. Generates a unique room code
        3. Creates a room in the database
        4. Creates a player (room creator) in the database
        5. Returns both room and player data
        
        Args:
            nickname: The creator's chosen nickname (3-20 chars, alphanumeric + underscore)
            
        Returns:
            CreateRoomResult containing the created room and player
            
        Raises:
            ValueError: If nickname validation fails
            RuntimeError: If unable to generate unique room code
            
        Example GraphQL:
            mutation {
              createRoom(nickname: "Alice") {
                room {
                  id
                  code
                  status
                }
                player {
                  id
                  nickname
                  isCreator
                }
              }
            }
        """
        # Validate nickname
        is_valid, error_message = validate_nickname(nickname)
        if not is_valid:
            logger.warning(f"Invalid nickname attempt: {nickname} - {error_message}")
            raise ValueError(error_message)
        
        logger.info(f"Creating room for player: {nickname}")
        
        try:
            with get_db() as session:
                # Generate unique room code
                code = generate_unique_room_code(session)
                logger.info(f"Generated room code: {code}")
                
                # Create player first (without room reference)
                player = Player(
                    nickname=nickname,
                    room_id=None,  # Will be set after room is created
                    is_creator=True
                )
                session.add(player)
                session.flush()  # Flush to get player.id
                
                logger.debug(f"Created player with id: {player.id}")
                
                # Create room with creator reference
                room = Room(
                    code=code,
                    game_type="sean_4ex",
                    status="waiting",
                    created_by_player_id=player.id
                )
                session.add(room)
                session.flush()  # Flush to get room.id
                
                # Update player's room_id
                player.room_id = room.id
                
                logger.info(f"Created room {room.code} (id: {room.id}) with creator {player.nickname} (id: {player.id})")
                
                # Convert to GraphQL types
                room_type = RoomType.from_db_model(room)
                player_type = PlayerType.from_db_model(player)
                
                return CreateRoomResult(
                    room=room_type,
                    player=player_type
                )
                
        except ValueError as e:
            # Validation error - already logged
            raise
        except RuntimeError as e:
            # Room code generation error - already logged
            logger.error(f"Failed to create room: {e}")
            raise
        except Exception as e:
            # Unexpected database error
            logger.error(f"Unexpected error creating room: {e}", exc_info=True)
            raise RuntimeError(f"Failed to create room: {str(e)}")

