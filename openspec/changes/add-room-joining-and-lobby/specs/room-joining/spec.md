# Spec: Room Joining

**Capability:** `room-joining`  
**Change:** `add-room-joining-and-lobby`

## ADDED Requirements

### Requirement: Join via URL

Users SHALL be able to join an existing game room by navigating to a join URL provided by the room creator.

#### Scenario: Navigate to join URL

- **GIVEN** a room exists with code "ABC123"
- **WHEN** a user navigates to `/join/ABC123`
- **THEN** the system SHALL display a join form
- **AND** the room code SHALL be visible: "Room Code: ABC123"

#### Scenario: Join URL with invalid code

- **GIVEN** no room exists with code "INVALID"
- **WHEN** a user navigates to `/join/INVALID`
- **THEN** the system SHALL display an error message "Room not found"
- **AND** no join form SHALL be displayed
- **AND** a button SHALL be provided to "Create New Room"

### Requirement: Join Room Form

The system SHALL provide a form for users to enter their nickname and join the room.

#### Scenario: User enters valid nickname

- **GIVEN** a user is on the join page for a valid room
- **WHEN** the user enters a valid nickname (3-20 alphanumeric characters)
- **AND** clicks "Join Game"
- **THEN** the system SHALL create a player record for the user
- **AND** the user SHALL be added to the room
- **AND** the user SHALL be navigated to the joined lobby view

#### Scenario: Nickname validation on join

- **GIVEN** a user is on the join page
- **WHEN** the user enters a nickname shorter than 3 characters
- **AND** clicks "Join Game"
- **THEN** the system SHALL display an error "Nickname must be at least 3 characters"
- **AND** the join SHALL not proceed

#### Scenario: Join button shows loading state

- **GIVEN** a user has entered a valid nickname
- **WHEN** the user clicks "Join Game"
- **THEN** the button SHALL show a loading indicator
- **AND** the button SHALL be disabled during the join process

### Requirement: Join Validation

The system SHALL validate that a room can be joined before allowing a user to join.

#### Scenario: Join room that is full

- **GIVEN** a room has 4 players already
- **WHEN** a 5th user attempts to join
- **THEN** the system SHALL return error code "ROOM_FULL"
- **AND** an error message SHALL be displayed: "This room is full (4/4 players)"
- **AND** the user SHALL not be added to the room

#### Scenario: Join room that has already started

- **GIVEN** a room has status "active"
- **WHEN** a user attempts to join
- **THEN** the system SHALL return error code "ROOM_ALREADY_STARTED"
- **AND** an error message SHALL be displayed: "This game has already started"
- **AND** the user SHALL not be added to the room

#### Scenario: Join with duplicate nickname

- **GIVEN** a room already has a player with nickname "Alice"
- **WHEN** another user attempts to join with nickname "Alice"
- **THEN** the system SHALL return error code "NICKNAME_TAKEN"
- **AND** an error message SHALL be displayed: "This nickname is already taken in this room"
- **AND** the user SHALL not be added to the room

#### Scenario: Join room successfully

- **GIVEN** a room exists with status "waiting"
- **AND** the room has fewer than 4 players
- **AND** the user's nickname is unique in the room
- **WHEN** the user joins with a valid nickname
- **THEN** a player record SHALL be created with `is_creator=False`
- **AND** the player SHALL be associated with the room
- **AND** the system SHALL return success response with room and player data

### Requirement: Nickname Uniqueness per Room

Nicknames SHALL be unique within a single room, but MAY be duplicated across different rooms.

#### Scenario: Same nickname in different rooms

- **GIVEN** Room A has a player "Alice"
- **AND** Room B exists
- **WHEN** a user joins Room B with nickname "Alice"
- **THEN** the join SHALL succeed
- **AND** both players SHALL coexist with the same nickname in different rooms

#### Scenario: Duplicate nickname in same room

- **GIVEN** a room has a player "Bob"
- **WHEN** another user attempts to join with nickname "Bob"
- **THEN** the join SHALL fail with "NICKNAME_TAKEN" error

### Requirement: Backend Join Mutation

The backend SHALL provide a `joinRoom` GraphQL mutation for joining rooms.

#### Scenario: JoinRoom mutation schema

- **GIVEN** the GraphQL schema
- **THEN** it SHALL include a mutation:
  ```graphql
  joinRoom(code: String!, nickname: String!): JoinRoomResult!
  ```
- **AND** `JoinRoomResult` SHALL have fields: `success: Boolean!`, `error: String`, `room: Room`, `player: Player`

#### Scenario: JoinRoom mutation returns success

- **GIVEN** valid join parameters
- **WHEN** `joinRoom` mutation is called
- **AND** all validations pass
- **THEN** the mutation SHALL return `success=true`
- **AND** the mutation SHALL return the room data including all players
- **AND** the mutation SHALL return the newly created player data

#### Scenario: JoinRoom mutation returns error

- **GIVEN** invalid join parameters (e.g., full room)
- **WHEN** `joinRoom` mutation is called
- **THEN** the mutation SHALL return `success=false`
- **AND** the mutation SHALL return an error code in the `error` field
- **AND** `room` and `player` fields SHALL be null

### Requirement: Transaction Safety

Join operations SHALL be atomic and handle concurrent joins correctly.

#### Scenario: Concurrent joins to nearly full room

- **GIVEN** a room has 3 players (1 spot left)
- **WHEN** two users attempt to join simultaneously
- **THEN** only one join SHALL succeed
- **AND** the other SHALL receive "ROOM_FULL" error
- **AND** the room SHALL have exactly 4 players (not 5)

#### Scenario: Database transaction rollback on error

- **GIVEN** a join operation encounters an error after creating player record
- **WHEN** the error occurs
- **THEN** the player record SHALL be rolled back
- **AND** the room state SHALL remain unchanged
- **AND** no partial data SHALL persist

