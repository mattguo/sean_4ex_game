# Capability: Room Creation API

**Change ID:** `build-game-hall`  
**Capability:** `room-creation-api`  
**Status:** Draft

## Overview

Implement GraphQL API for creating game rooms, including room code generation, validation, and database persistence.

## Dependencies

- Requires: `room-database-schema` (Room and Player models must exist)

## ADDED Requirements

### Requirement: Room Code Generation

The system SHALL generate unique, user-friendly 6-character room codes.

**Rationale:** Room codes must be memorable, easy to type, and avoid user confusion.

#### Scenario: Room code uses safe character set

**Given** a room code is generated  
**When** the code is examined  
**Then** it SHALL contain only characters from: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`  
**And** it SHALL NOT contain: `0`, `O`, `1`, `I`, `l` (ambiguous characters)  
**And** it SHALL be exactly 6 characters long

#### Scenario: Room code is unique

**Given** 100 rooms exist in the database  
**When** a new room code is generated  
**Then** it SHALL NOT match any existing room code  
**And** if a collision occurs, the system SHALL retry generation  
**And** the system SHALL attempt up to 10 retries before failing

#### Scenario: Room code generation performance

**Given** an empty database  
**When** a room code is generated  
**Then** generation SHALL complete in less than 50ms  
**And** uniqueness check SHALL use the database index on `rooms.code`

### Requirement: Create Room Mutation

The system SHALL provide a GraphQL mutation for creating rooms.

**Rationale:** Frontend needs a typed API to create rooms with proper validation.

#### Scenario: Create room mutation signature

**Given** the GraphQL schema is defined  
**When** the schema is queried  
**Then** it SHALL include a mutation:
```graphql
createRoom(nickname: String!): CreateRoomResult!
```

**And** the `CreateRoomResult` type SHALL include:
```graphql
type CreateRoomResult {
  room: Room!
  player: Player!
}
```

#### Scenario: Successful room creation

**Given** a valid nickname "Alice"  
**When** the `createRoom(nickname: "Alice")` mutation is executed  
**Then** a new Room SHALL be created in the database  
**And** a new Player SHALL be created with:
  - `nickname` = "Alice"
  - `is_creator` = true
  - `room_id` = the created room's id
**And** the response SHALL include both the room and player data  
**And** the room SHALL have status "waiting"  
**And** the room SHALL have game_type "sean_4ex"

#### Scenario: Room creation is atomic

**Given** a room creation is in progress  
**When** the database operation fails after creating the room but before creating the player  
**Then** the transaction SHALL rollback  
**And** no Room SHALL exist in the database  
**And** no Player SHALL exist in the database  
**And** an error SHALL be returned to the client

### Requirement: Nickname Validation

The system SHALL validate player nicknames according to rules.

**Rationale:** Prevents invalid data, SQL injection, and ensures consistent user experience.

#### Scenario: Valid nicknames are accepted

**Given** a nickname is provided  
**When** the nickname is one of:
  - "Alice" (5 letters)
  - "Bob123" (mixed alphanumeric)
  - "player_99" (with underscore)
**Then** validation SHALL pass  
**And** the room SHALL be created successfully

#### Scenario: Invalid nicknames are rejected

**Given** a nickname is provided  
**When** the nickname is one of:
  - "AB" (too short, < 3 chars)
  - "ThisIsAVeryLongNicknameThatExceedsTwentyCharacters" (too long, > 20 chars)
  - "Bob@123" (contains special char @)
  - "Hello World" (contains space)
  - "" (empty string)
**Then** validation SHALL fail  
**And** an error SHALL be returned with message indicating the validation rule violated  
**And** no Room or Player SHALL be created

#### Scenario: Nickname validation error messages

**Given** an invalid nickname  
**When** validation fails  
**Then** the error message SHALL be clear and actionable:
  - Empty: "Nickname is required"
  - Too short: "Nickname must be at least 3 characters"
  - Too long: "Nickname must be no more than 20 characters"
  - Invalid chars: "Nickname can only contain letters, numbers, and underscores"

### Requirement: GraphQL Types

The system SHALL define GraphQL types for Room and Player entities.

**Rationale:** Type safety for frontend and clear API contracts.

#### Scenario: Room GraphQL type

**Given** the GraphQL schema  
**When** the Room type is queried  
**Then** it SHALL include fields:
```graphql
type Room {
  id: ID!
  code: String!
  gameType: String!
  status: RoomStatus!
  createdAt: DateTime!
  creator: Player!
}
```

**And** `RoomStatus` SHALL be an enum:
```graphql
enum RoomStatus {
  WAITING
  ACTIVE
  FINISHED
}
```

#### Scenario: Player GraphQL type

**Given** the GraphQL schema  
**When** the Player type is queried  
**Then** it SHALL include fields:
```graphql
type Player {
  id: ID!
  nickname: String!
  isCreator: Boolean!
  joinedAt: DateTime!
}
```

### Requirement: Error Handling

The system SHALL handle errors gracefully and return meaningful messages.

**Rationale:** Users and developers need clear feedback on what went wrong.

#### Scenario: Database connection error

**Given** the database is unavailable  
**When** `createRoom` mutation is executed  
**Then** an error SHALL be returned  
**And** the error message SHALL indicate a system error (not expose internals)  
**And** the error SHALL be logged server-side with full details

#### Scenario: Validation error

**Given** an invalid nickname "A" (too short)  
**When** `createRoom` mutation is executed  
**Then** an error SHALL be returned  
**And** the error SHALL have type "VALIDATION_ERROR"  
**And** the error message SHALL be user-friendly  
**And** the HTTP status SHALL be 400 Bad Request

#### Scenario: Room code generation exhaustion

**Given** room code generation fails after 10 retries  
**When** `createRoom` mutation is executed  
**Then** an error SHALL be returned  
**And** the error SHALL indicate the system is unable to generate a unique code  
**And** the error SHALL be logged as a critical issue  
**And** the HTTP status SHALL be 500 Internal Server Error

### Requirement: Integration with Strawberry GraphQL

The system SHALL integrate cleanly with the existing Strawberry setup.

**Rationale:** Maintain consistency with project architecture.

#### Scenario: Mutation is added to schema

**Given** the main.py file with existing MyAPIQuery  
**When** the createRoom mutation is implemented  
**Then** a new MyAPIMutation class SHALL be created  
**And** it SHALL be added to the Strawberry schema:
```python
schema = strawberry.Schema(query=MyAPIQuery, mutation=MyAPIMutation)
```

#### Scenario: Database session is managed per request

**Given** a GraphQL request is received  
**When** the mutation resolver executes  
**Then** a database session SHALL be created  
**And** the session SHALL be committed if successful  
**And** the session SHALL be rolled back if an error occurs  
**And** the session SHALL be closed in all cases

## Implementation Notes

### File Structure
```
api/
├── main.py              # Updated with MyAPIMutation
├── mutations.py         # createRoom mutation implementation
├── types.py             # GraphQL types (Room, Player, etc.)
└── utils.py             # Room code generation utility
```

### Example Mutation Implementation
```python
@strawberry.type
class MyAPIMutation:
    @strawberry.mutation
    def create_room(self, nickname: str) -> CreateRoomResult:
        # Validate nickname
        if not validate_nickname(nickname):
            raise ValueError("Invalid nickname")
        
        # Create session
        with SessionLocal() as session:
            # Generate unique code
            code = generate_unique_room_code(session)
            
            # Create room and player
            room = Room(code=code, game_type="sean_4ex")
            session.add(room)
            session.flush()  # Get room.id
            
            player = Player(
                nickname=nickname,
                room_id=room.id,
                is_creator=True
            )
            session.add(player)
            session.commit()
            
            return CreateRoomResult(room=room, player=player)
```

### Testing Considerations
- Mock database session for unit tests
- Test validation logic independently
- Integration test full mutation flow
- Test concurrent room creation (code uniqueness)

