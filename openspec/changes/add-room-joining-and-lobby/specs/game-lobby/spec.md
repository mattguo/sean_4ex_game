# Spec: Game Lobby

**Capability:** `game-lobby`  
**Change:** `add-room-joining-and-lobby`

## ADDED Requirements

### Requirement: Joined Player Lobby View

After successfully joining a room, non-creator players SHALL see a lobby view showing who else is in the room and waiting for the game to start.

#### Scenario: Joined player sees lobby

- **GIVEN** a user has successfully joined a room
- **WHEN** the join completes
- **THEN** the user SHALL see a "Waiting for game to start..." message
- **AND** the room code SHALL be displayed
- **AND** a list of all players in the room SHALL be shown
- **AND** the creator SHALL be clearly marked (e.g., with "Host" badge)

#### Scenario: Joined player sees other players

- **GIVEN** a user is in the joined lobby
- **AND** the room has 3 players total
- **WHEN** the lobby is displayed
- **THEN** all 3 player nicknames SHALL be visible
- **AND** each player's join time SHALL be indicated (implicitly via order or explicitly)
- **AND** the user SHALL see themselves in the list

### Requirement: Real-Time Lobby Updates for Joined Players

Joined players SHALL see real-time updates when new players join or when the game starts.

#### Scenario: New player joins while viewing lobby

- **GIVEN** a joined player is viewing the lobby
- **WHEN** another player joins the room
- **THEN** the new player SHALL appear in the player list within 5 seconds
- **AND** the player count SHALL update

#### Scenario: Game starts while in lobby

- **GIVEN** a joined player is viewing the lobby
- **WHEN** the creator starts the game
- **THEN** the room status SHALL change to "active"
- **AND** the user SHALL be automatically navigated to the game page
- **AND** this SHALL happen within 5 seconds of game start

#### Scenario: Lobby polling for joined players

- **GIVEN** a joined player is viewing the lobby
- **WHEN** the lobby view is active
- **THEN** the system SHALL poll the room state every 3 seconds
- **AND** the polling SHALL automatically stop when the user leaves the page
- **AND** the polling SHALL stop when the game starts

### Requirement: Room State Query

The backend SHALL provide a query to fetch the current state of a room by its code.

#### Scenario: RoomByCode query schema

- **GIVEN** the GraphQL schema
- **THEN** it SHALL include a query:
  ```graphql
  roomByCode(code: String!): Room
  ```
- **AND** the query SHALL return null if room not found
- **AND** the Room type SHALL include: `id`, `code`, `status`, `gameType`, `createdAt`, `creator`, `players`

#### Scenario: Query room with players

- **GIVEN** a room exists with code "ABC123"
- **AND** the room has 3 players
- **WHEN** `roomByCode(code: "ABC123")` is queried
- **THEN** the query SHALL return the room data
- **AND** the room SHALL include all 3 players with their nicknames, creator status, and join times

#### Scenario: Query non-existent room

- **GIVEN** no room exists with code "INVALID"
- **WHEN** `roomByCode(code: "INVALID")` is queried
- **THEN** the query SHALL return null
- **AND** no error SHALL be thrown

### Requirement: Player List Display

The lobby SHALL display all players in the room with clear visual indicators.

#### Scenario: Player list shows all players

- **GIVEN** a lobby with 4 players: "Alice" (creator), "Bob", "Charlie", "Diana"
- **WHEN** the player list is rendered
- **THEN** all 4 names SHALL be visible
- **AND** "Alice" SHALL have a "Creator" or "Host" badge
- **AND** the list SHALL be in a readable format (e.g., Mantine List component)

#### Scenario: Creator is visually distinguished

- **GIVEN** a player list with a creator
- **WHEN** the list is displayed
- **THEN** the creator SHALL have a visual indicator (badge, icon, or different color)
- **AND** the indicator SHALL clearly convey "Host" or "Creator" role

#### Scenario: Current user is highlighted

- **GIVEN** a user "Bob" is viewing the lobby
- **WHEN** the player list is displayed
- **THEN** "Bob" SHALL be visually highlighted (e.g., bold text, "You" label, or different background)
- **AND** it SHALL be clear which player is the current user

### Requirement: Player Count Display

The lobby SHALL show the current player count and maximum capacity.

#### Scenario: Player count format

- **GIVEN** a room with 2 players
- **WHEN** the lobby is displayed
- **THEN** the player count SHALL be shown as "2/4 players" or similar format
- **AND** the count SHALL update in real-time as players join

#### Scenario: Player count near capacity

- **GIVEN** a room with 4 players (full)
- **WHEN** the lobby is displayed
- **THEN** the player count SHALL show "4/4 players"
- **AND** optionally indicate "Room Full" status

### Requirement: Loading and Empty States

The lobby SHALL handle loading and empty states gracefully.

#### Scenario: Lobby loading state

- **GIVEN** a user enters the lobby
- **WHEN** room data is being fetched
- **THEN** a loading skeleton or spinner SHALL be displayed
- **AND** the UI SHALL not show stale or empty data
- **AND** the loading state SHALL not persist longer than 2 seconds under normal conditions

#### Scenario: Lobby with only creator (empty)

- **GIVEN** a newly created room with only the creator
- **WHEN** the creator views the lobby
- **THEN** the lobby SHALL show "1/4 players"
- **AND** optionally show "Waiting for players to join..." message
- **AND** the player list SHALL show only the creator

### Requirement: Navigation After Game Start

When a game starts, all players in the lobby SHALL be automatically redirected to the game page.

#### Scenario: Automatic navigation for creator

- **GIVEN** the creator has started the game
- **WHEN** the room status changes to "active"
- **THEN** the creator SHALL be navigated to `/game/{code}` (or equivalent game page)
- **AND** the navigation SHALL happen automatically

#### Scenario: Automatic navigation for joined players

- **GIVEN** a joined player is in the lobby
- **WHEN** the creator starts the game and room status becomes "active"
- **THEN** the joined player SHALL be navigated to `/game/{code}` within 5 seconds
- **AND** this SHALL happen via the polling mechanism detecting status change

### Requirement: Polling Lifecycle Management

Polling for lobby updates SHALL be properly managed to avoid memory leaks and unnecessary requests.

#### Scenario: Polling starts on lobby mount

- **GIVEN** a user enters the lobby
- **WHEN** the lobby component mounts
- **THEN** polling SHALL start automatically
- **AND** polling interval SHALL be 3 seconds

#### Scenario: Polling stops on lobby unmount

- **GIVEN** polling is active in the lobby
- **WHEN** the user navigates away from the lobby
- **THEN** the polling interval SHALL be cleared
- **AND** no further poll requests SHALL be made

#### Scenario: Polling continues across re-renders

- **GIVEN** polling is active
- **WHEN** the component re-renders (e.g., due to state updates)
- **THEN** the polling interval SHALL not be duplicated
- **AND** only one polling interval SHALL be active at any time

### Requirement: Error Handling in Lobby

The lobby SHALL handle errors gracefully and provide feedback to users.

#### Scenario: Network error during polling

- **GIVEN** polling is active
- **WHEN** a network error occurs during a poll request
- **THEN** the lobby SHALL continue to display the last known state
- **AND** optionally show a "Reconnecting..." indicator
- **AND** polling SHALL retry on the next interval

#### Scenario: Room deleted while in lobby

- **GIVEN** a user is viewing a lobby
- **WHEN** the room is deleted or expires
- **AND** the next poll request returns null
- **THEN** the lobby SHALL show an error message "Room no longer exists"
- **AND** provide a button to return to home page

#### Scenario: User kicked or removed (future)

- **GIVEN** a user is in a lobby
- **WHEN** polling detects the user is no longer in the room
- **THEN** the lobby SHALL show an error "You have been removed from the room"
- **AND** provide a button to return to home page

### Requirement: Responsive Lobby Design

The lobby SHALL be usable on mobile, tablet, and desktop devices.

#### Scenario: Mobile viewport (375px width)

- **GIVEN** a lobby is displayed on a 375px width screen
- **WHEN** the layout is rendered
- **THEN** all text SHALL be readable
- **AND** buttons SHALL be tappable (min 44x44px touch target)
- **AND** the player list SHALL fit within the viewport without horizontal scroll

#### Scenario: Desktop viewport (1920px width)

- **GIVEN** a lobby is displayed on a 1920px width screen
- **WHEN** the layout is rendered
- **THEN** the lobby SHALL be centered with reasonable max-width
- **AND** the layout SHALL not look stretched or too wide
- **AND** all elements SHALL maintain proper spacing

### Requirement: Accessibility

The lobby SHALL be accessible to users with disabilities.

#### Scenario: Keyboard navigation

- **GIVEN** a user is navigating via keyboard
- **WHEN** they tab through the lobby
- **THEN** focus SHALL be visible on all interactive elements
- **AND** there SHALL be a logical tab order
- **AND** the "Start Game" button (for creator) SHALL be keyboard-activatable

#### Scenario: Screen reader support

- **GIVEN** a screen reader user is in the lobby
- **WHEN** the player list is announced
- **THEN** each player name SHALL be announced
- **AND** the creator status SHALL be announced
- **AND** the player count SHALL be announced
- **AND** the "waiting" state SHALL be conveyed

#### Scenario: Color contrast

- **GIVEN** the lobby UI
- **WHEN** colors are used for status indicators
- **THEN** all text SHALL have sufficient contrast ratio (WCAG AA minimum)
- **AND** status SHALL not rely on color alone (use icons or text)

