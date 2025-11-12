# Spec Delta: Room Creation

**Capability:** `room-creation`  
**Change:** `add-room-joining-and-lobby`

## MODIFIED Requirements

### Requirement: Room Code Sharing

When a room is created, the system SHALL provide a shareable join URL (instead of just the room code) to enable other players to join the room directly.

#### Scenario: Creator receives join URL

- **GIVEN** a user has created a room with code "ABC123"
- **WHEN** the room creation succeeds
- **THEN** the system SHALL display a join URL in format `{protocol}://{host}/join/{code}`
- **AND** the URL SHALL be copyable to clipboard via a "Copy Join URL" button

#### Scenario: Join URL copied to clipboard

- **GIVEN** a room has been created
- **WHEN** the creator clicks "Copy Join URL"
- **THEN** the full URL SHALL be copied to the system clipboard
- **AND** the button SHALL show feedback "URL Copied!"
- **AND** the URL SHALL be in format `http://localhost:5173/join/ABC123` (or production host)

#### Scenario: Join URL includes room code

- **GIVEN** a room with code "XYZ789"
- **WHEN** the join URL is generated
- **THEN** the URL path SHALL include the room code: `/join/XYZ789`
- **AND** the URL SHALL be valid and navigable

### Requirement: Creator Lobby Display

After creating a room, the system SHALL display a lobby view showing real-time updates of players who have joined.

#### Scenario: Creator sees initial lobby state

- **GIVEN** a user has just created a room
- **WHEN** the room creation completes
- **THEN** the creator SHALL see a lobby view with their nickname
- **AND** the player count SHALL show "1/4 players"
- **AND** the creator SHALL be marked with a "Creator" badge

#### Scenario: Creator sees new players join

- **GIVEN** a creator is viewing their lobby
- **WHEN** another player joins the room
- **THEN** the new player SHALL appear in the lobby player list within 5 seconds
- **AND** the player count SHALL update accordingly

#### Scenario: Lobby updates in real-time

- **GIVEN** a creator is viewing their lobby
- **WHEN** the lobby is active
- **THEN** the system SHALL poll for updates every 3 seconds
- **AND** the player list SHALL automatically update when changes occur
- **AND** polling SHALL stop when the creator leaves the lobby page

### Requirement: Start Game Control

The creator SHALL have a "Start Game" button that enables only when the correct number of players have joined.

#### Scenario: Start button disabled with insufficient players

- **GIVEN** a creator is viewing their lobby
- **WHEN** only 1 player (the creator) is present
- **THEN** the "Start Game" button SHALL be disabled
- **AND** a tooltip SHALL explain "Need 2-4 players to start"

#### Scenario: Start button enabled with valid player count

- **GIVEN** a creator is viewing their lobby
- **WHEN** 2 or more players are present
- **AND** no more than 4 players are present
- **THEN** the "Start Game" button SHALL be enabled
- **AND** the button SHALL display the current player count: "Start Game (2/4 players)"

#### Scenario: Player count displayed on button

- **GIVEN** a creator is viewing their lobby
- **WHEN** the lobby has N players
- **THEN** the "Start Game" button text SHALL show "(N/4 players)"

