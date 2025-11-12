"""
GraphQL mutations for the Sean 4EX game.

This module defines all GraphQL mutations including room creation,
player management, and game actions.
"""

import logging

import strawberry

from database import get_db
from graphql_types import CreateRoomResult, JoinRoomResult, StartGameResult, PlayerType, RoomType
from models import Player, Room
from utils import generate_unique_room_code, validate_nickname
from sqlalchemy.orm import joinedload

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
    
    @strawberry.mutation
    def join_room(self, code: str, nickname: str) -> JoinRoomResult:
        """
        Join an existing game room.
        
        This mutation:
        1. Validates the nickname
        2. Finds the room by code
        3. Validates room status (must be "waiting")
        4. Checks player count (max 4 players)
        5. Checks nickname uniqueness in the room
        6. Creates a player and adds to the room
        7. Returns success result with room and player data
        
        Args:
            code: The 6-character room code
            nickname: The player's chosen nickname (3-20 chars, alphanumeric + underscore)
            
        Returns:
            JoinRoomResult with success status and data
            
        Error codes:
            - INVALID_NICKNAME: Nickname validation failed
            - ROOM_NOT_FOUND: Room code doesn't exist
            - ROOM_ALREADY_STARTED: Room status is not "waiting"
            - ROOM_FULL: Room already has 4 players
            - NICKNAME_TAKEN: Another player in this room has this nickname
        """
        # Validate nickname
        is_valid, error_message = validate_nickname(nickname)
        if not is_valid:
            logger.warning(f"Invalid nickname in join attempt: {nickname} - {error_message}")
            return JoinRoomResult(success=False, error=f"INVALID_NICKNAME: {error_message}")
        
        logger.info(f"Player {nickname} attempting to join room {code}")
        
        try:
            with get_db() as session:
                # Find room with eager loading
                room = session.query(Room).options(
                    joinedload(Room.creator),
                    joinedload(Room.players)
                ).filter_by(code=code).first()
                
                if not room:
                    logger.warning(f"Room not found: {code}")
                    return JoinRoomResult(success=False, error="ROOM_NOT_FOUND")
                
                # Check room status
                if room.status != "waiting":
                    logger.warning(f"Cannot join room {code}: status is {room.status}")
                    return JoinRoomResult(success=False, error="ROOM_ALREADY_STARTED")
                
                # Check player count
                if len(room.players) >= 4:
                    logger.warning(f"Cannot join room {code}: room is full ({len(room.players)}/4)")
                    return JoinRoomResult(success=False, error="ROOM_FULL")
                
                # Check nickname uniqueness in this room
                existing_player = session.query(Player).filter_by(
                    room_id=room.id,
                    nickname=nickname
                ).first()
                
                if existing_player:
                    logger.warning(f"Nickname {nickname} already taken in room {code}")
                    return JoinRoomResult(success=False, error="NICKNAME_TAKEN")
                
                # Create new player
                player = Player(
                    nickname=nickname,
                    room_id=room.id,
                    is_creator=False
                )
                session.add(player)
                session.flush()  # Get player ID
                
                logger.info(f"Player {nickname} (id: {player.id}) joined room {code}")
                
                # Convert to GraphQL types
                room_type = RoomType.from_db_model(room)
                player_type = PlayerType.from_db_model(player)
                
                return JoinRoomResult(
                    success=True,
                    room=room_type,
                    player=player_type
                )
                
        except Exception as e:
            logger.error(f"Unexpected error joining room: {e}", exc_info=True)
            return JoinRoomResult(success=False, error=f"INTERNAL_ERROR: {str(e)}")
    
    @strawberry.mutation
    def start_game(self, code: str) -> StartGameResult:
        """
        Start a game in a room.
        
        This mutation:
        1. Finds the room by code
        2. Validates room status (must be "waiting")
        3. Validates player count (2-4 players)
        4. Updates room status to "active"
        5. Returns success result with room data
        
        Args:
            code: The 6-character room code
            
        Returns:
            StartGameResult with success status and room data
            
        Error codes:
            - ROOM_NOT_FOUND: Room code doesn't exist
            - GAME_ALREADY_STARTED: Room status is not "waiting"
            - NOT_ENOUGH_PLAYERS: Less than 2 players in room
            - TOO_MANY_PLAYERS: More than 4 players in room (defensive check)
        """
        logger.info(f"Starting game in room {code}")
        
        try:
            with get_db() as session:
                # Find room with eager loading
                room = session.query(Room).options(
                    joinedload(Room.creator),
                    joinedload(Room.players)
                ).filter_by(code=code).first()
                
                if not room:
                    logger.warning(f"Room not found: {code}")
                    return StartGameResult(success=False, error="ROOM_NOT_FOUND")
                
                # Check room status
                if room.status != "waiting":
                    logger.warning(f"Cannot start game in room {code}: status is {room.status}")
                    return StartGameResult(success=False, error="GAME_ALREADY_STARTED")
                
                # Check player count
                player_count = len(room.players)
                if player_count < 2:
                    logger.warning(f"Cannot start game in room {code}: not enough players ({player_count}/2)")
                    return StartGameResult(success=False, error="NOT_ENOUGH_PLAYERS")
                
                if player_count > 4:
                    logger.error(f"Room {code} has too many players: {player_count}/4")
                    return StartGameResult(success=False, error="TOO_MANY_PLAYERS")
                
                # Update room status
                room.status = "active"
                session.flush()
                
                logger.info(f"Game started in room {code} with {player_count} players")
                
                # Convert to GraphQL type
                room_type = RoomType.from_db_model(room)
                
                return StartGameResult(
                    success=True,
                    room=room_type
                )
                
        except Exception as e:
            logger.error(f"Unexpected error starting game: {e}", exc_info=True)
            return StartGameResult(success=False, error=f"INTERNAL_ERROR: {str(e)}")

