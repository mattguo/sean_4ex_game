# Design: Room Joining and Lobby System

**Change ID:** `add-room-joining-and-lobby`

## Context

We need to build a lobby system where:
- Room creators share a join URL (not just a code)
- Players join via URL and wait for game start
- Creators see who's joined in real-time
- Game starts when enough players are present

This requires client-side routing, real-time data synchronization, and careful state management across multiple users.

## Goals / Non-Goals

### Goals
- Simple URL-based room joining
- Real-time lobby updates via polling
- Robust error handling for edge cases
- Minimal dependencies (avoid WebSocket complexity for now)

### Non-Goals
- WebSocket/SSE real-time updates (future optimization)
- Room chat (future feature)
- Kick/ban players (future feature)
- Room settings configuration (use defaults)

## Architecture Overview

### Frontend Architecture

```
App.tsx (Router)
├─ / → GameHall (create room)
│   └─ After creation → CreatorLobby (with polling)
├─ /join/:code → JoinRoom
│   └─ After join → JoinedLobby (waiting for start)
└─ /game/:code → GamePage (minimalist placeholder)
    └─ All players routed here when game starts
```

### Backend Architecture

```
Queries:
- roomByCode(code: String!): Room

Mutations:
- createRoom(nickname: String!) → CreateRoomResult (exists)
- joinRoom(code: String!, nickname: String!) → JoinRoomResult
- startGame(code: String!) → StartGameResult

Models:
- Room (exists, status transitions: waiting → active)
- Player (exists)
```

## Decisions

### Decision 1: URL Format

**Choice:** `{protocol}://{host}/join/{code}` (e.g., `http://localhost:5173/join/ABC123`)

**Rationale:**
- Clear intent (/join prefix)
- Short and shareable
- Easy to parse and validate

**Alternatives Considered:**
- `/room/{code}` - Less clear intent
- `/r/{code}` - Too terse, not discoverable
- Query param `/?room=ABC123` - Harder to share, ugly

### Decision 2: Routing Library

**Choice:** React Router v6

**Rationale:**
- Industry standard
- Excellent TypeScript support
- Built-in hooks (`useParams`, `useNavigate`)
- Good documentation
- Already familiar to most developers

**Alternatives Considered:**
- Wouter (lightweight) - Less mature, fewer features
- Native (manual parsing) - More work, error-prone
- TanStack Router - Too new, overkill for simple routing

### Decision 3: Real-Time Updates Strategy

**Choice:** Polling with 3-5 second interval for lobby, WebSocket/SSE for game phase (future)

**Rationale:**

**For Lobby Phase (this proposal):**
- **Use Polling (3-5 sec interval)**
- Updates are low-frequency (players join infrequently)
- Latency tolerance is high (3-5 seconds acceptable)
- Simple implementation, no server-side changes needed
- Low concurrent load (typically <10 rooms with active lobbies)
- Easy debugging and monitoring

**For Game Phase (future proposal):**
- **Use WebSockets or SSE**
- Turn-based game needs <1 second response time
- Bidirectional communication preferred (actions + state updates)
- Frequent updates (multiple actions per minute)
- Server push eliminates polling waste
- Better UX for real-time game feel

**Detailed Comparison:**

| Feature | Polling | WebSocket | SSE |
|---------|---------|-----------|-----|
| **Lobby Updates** | ✅ Excellent | ⚠️ Overkill | ⚠️ Overkill |
| **Game Actions** | ❌ Too slow | ✅ Excellent | ⚠️ Good (one-way) |
| **Implementation** | Simple | Complex | Medium |
| **Server Load** | Higher | Lower | Lower |
| **Latency** | 3-5s | <100ms | <500ms |
| **Browser Support** | ✅ Universal | ✅ Modern | ✅ Modern |
| **Debugging** | Easy | Hard | Medium |
| **Scalability** | Good (<100 rooms) | Excellent | Excellent |

**Trade-offs:**
- Polling: Slightly higher server load (acceptable for MVP), not truly real-time
- WebSocket: Complex setup, connection management, firewall issues
- SSE: One-way only (need polling for client→server), simpler than WebSocket

**Alternatives Considered:**
- **Long polling** - Similar complexity to WebSockets without benefits
- **GraphQL Subscriptions (over WebSocket)** - Excellent but requires Strawberry subscriptions setup

**Migration Path:**
1. **Phase 1 (This proposal)**: Polling for lobby
2. **Phase 2 (Future)**: Add WebSocket infrastructure for game phase
3. **Phase 3 (Optimization)**: Optionally migrate lobby to WebSocket if needed

**Recommendation:**
- Lobby: Stick with **polling** (simple, sufficient)
- Game: Use **WebSocket with GraphQL Subscriptions** (best DX, type-safe)

### Decision 4: Lobby State Management

**Choice:** Store player list in Room model, query for updates

**Schema:**
```python
class Room:
    players: relationship("Player")  # Already exists

class Player:
    room_id: ForeignKey  # Already exists
    joined_at: DateTime  # Already exists
```

**Rationale:**
- Reuse existing schema
- Database is source of truth
- Simple queries (no caching complexity)

### Decision 5: Join Validation Logic

**Validations:**
1. Room code exists
2. Room status is "waiting" (not "active" or "finished")
3. Room not full (max 4 players)
4. Nickname is valid and unique within room

**Error Responses:**
- `ROOM_NOT_FOUND` - Invalid code
- `ROOM_ALREADY_STARTED` - Can't join active game
- `ROOM_FULL` - Max players reached
- `NICKNAME_TAKEN` - Duplicate nickname in room
- `INVALID_NICKNAME` - Validation failed

### Decision 6: Creator Lobby Polling

**Implementation:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    refetch(); // Relay refetch
  }, 3000);
  return () => clearInterval(interval);
}, [roomCode]);
```

**Rationale:**
- Standard React pattern
- Automatic cleanup on unmount
- Relay handles deduplication and caching

### Decision 7: Start Game Criteria

**Criteria:**
- Minimum 2 players
- Maximum 4 players
- Creator must still be present
- Room status is "waiting"

**Button State:**
- Disabled until criteria met
- Shows tooltip explaining why disabled

## Database Schema Changes

### New Fields (if any)

None required - existing schema supports all features.

**Existing Schema:**
```python
class Room(Base):
    id: int
    code: str(6)  # unique
    game_type: str = "sean_4ex"
    status: str = "waiting"  # "waiting" | "active" | "finished"
    created_at: datetime
    created_by_player_id: int
    
    creator: relationship("Player")
    players: relationship("Player")

class Player(Base):
    id: int
    nickname: str(20)
    room_id: int (nullable)
    is_creator: bool
    joined_at: datetime
    
    room: relationship("Room")
```

## API Design

### New Query: `roomByCode`

```graphql
query RoomByCode($code: String!) {
  roomByCode(code: $code) {
    id
    code
    status
    gameType
    createdAt
    creator {
      id
      nickname
    }
    players {
      id
      nickname
      isCreator
      joinedAt
    }
  }
}
```

**Implementation:**
```python
@strawberry.type
class MyAPIQuery:
    @strawberry.field
    def room_by_code(self, code: str) -> Optional[RoomType]:
        with get_db() as session:
            room = session.query(Room).filter_by(code=code).first()
            return RoomType.from_orm(room) if room else None
```

### New Mutation: `joinRoom`

```graphql
mutation JoinRoom($code: String!, $nickname: String!) {
  joinRoom(code: $code, nickname: $nickname) {
    success
    error
    room {
      id
      code
      status
      players {
        id
        nickname
        isCreator
      }
    }
    player {
      id
      nickname
      isCreator
    }
  }
}
```

**Result Type:**
```python
@strawberry.type
class JoinRoomResult:
    success: bool
    error: Optional[str] = None
    room: Optional[RoomType] = None
    player: Optional[PlayerType] = None
```

**Implementation:**
```python
@strawberry.field
def join_room(self, code: str, nickname: str) -> JoinRoomResult:
    # 1. Validate nickname
    is_valid, error = validate_nickname(nickname)
    if not is_valid:
        return JoinRoomResult(success=False, error=error)
    
    with get_db() as session:
        # 2. Find room
        room = session.query(Room).filter_by(code=code).first()
        if not room:
            return JoinRoomResult(success=False, error="ROOM_NOT_FOUND")
        
        # 3. Check room status
        if room.status != "waiting":
            return JoinRoomResult(success=False, error="ROOM_ALREADY_STARTED")
        
        # 4. Check player count
        if len(room.players) >= 4:
            return JoinRoomResult(success=False, error="ROOM_FULL")
        
        # 5. Check nickname uniqueness in room
        existing = session.query(Player).filter_by(
            room_id=room.id,
            nickname=nickname
        ).first()
        if existing:
            return JoinRoomResult(success=False, error="NICKNAME_TAKEN")
        
        # 6. Create player
        player = Player(
            nickname=nickname,
            room_id=room.id,
            is_creator=False
        )
        session.add(player)
        session.commit()
        
        return JoinRoomResult(
            success=True,
            room=RoomType.from_orm(room),
            player=PlayerType.from_orm(player)
        )
```

### New Mutation: `startGame`

```graphql
mutation StartGame($code: String!) {
  startGame(code: $code) {
    success
    error
    room {
      id
      code
      status
      players {
        id
        nickname
      }
    }
  }
}
```

**Result Type:**
```python
@strawberry.type
class StartGameResult:
    success: bool
    error: Optional[str] = None
    room: Optional[RoomType] = None
```

**Implementation:**
```python
@strawberry.field
def start_game(self, code: str) -> StartGameResult:
    with get_db() as session:
        # 1. Find room
        room = session.query(Room).filter_by(code=code).first()
        if not room:
            return StartGameResult(success=False, error="ROOM_NOT_FOUND")
        
        # 2. Verify room is in waiting status
        if room.status != "waiting":
            return StartGameResult(success=False, error="GAME_ALREADY_STARTED")
        
        # 3. Verify player count (2-4 players)
        player_count = len(room.players)
        if player_count < 2:
            return StartGameResult(success=False, error="NOT_ENOUGH_PLAYERS")
        if player_count > 4:
            return StartGameResult(success=False, error="TOO_MANY_PLAYERS")
        
        # 4. Update room status to "active"
        room.status = "active"
        session.commit()
        
        return StartGameResult(
            success=True,
            room=RoomType.from_orm(room)
        )
```

**Error Codes:**
- `ROOM_NOT_FOUND` - Invalid room code
- `GAME_ALREADY_STARTED` - Room status is not "waiting"
- `NOT_ENOUGH_PLAYERS` - Less than 2 players
- `TOO_MANY_PLAYERS` - More than 4 players (defensive check)

## Frontend Component Structure

### Updated: GameHall.tsx

```typescript
// After room creation:
const roomUrl = `${window.location.origin}/join/${roomCode}`;

// Replace copy button:
<CopyButton value={roomUrl}>
  {({ copied, copy }) => (
    <Button onClick={copy} leftSection={<IconLink />}>
      {copied ? 'URL Copied!' : 'Copy Join URL'}
    </Button>
  )}
</CopyButton>

// Add polling for creator:
const { data, refetch } = useQuery(RoomByCodeQuery, { code: roomCode });

useEffect(() => {
  const interval = setInterval(refetch, 3000);
  return () => clearInterval(interval);
}, [roomCode]);

// Show player list:
<PlayerList players={data.roomByCode.players} />

// Start game button:
const navigate = useNavigate();
const [startGameMutation] = useMutation(StartGameMutation);

const handleStartGame = () => {
  startGameMutation({
    variables: { code: roomCode },
    onCompleted: (data) => {
      if (data.startGame.success) {
        // Navigate to game page
        navigate(`/game/${roomCode}`);
      } else {
        // Show error
        showNotification({ message: data.startGame.error, color: 'red' });
      }
    }
  });
};

<Button
  disabled={data.roomByCode.players.length < 2}
  onClick={handleStartGame}
>
  Start Game ({data.roomByCode.players.length}/4 players)
</Button>
```

### New: JoinRoom.tsx

```typescript
function JoinRoom() {
  const { code } = useParams<{ code: string }>();
  const [nickname, setNickname] = useState('');
  const [commit, isInFlight] = useMutation(JoinRoomMutation);
  
  const handleJoin = () => {
    commit({
      variables: { code, nickname },
      onCompleted: (data) => {
        if (data.joinRoom.success) {
          // Show joined lobby
          setJoined(true);
        } else {
          // Show error
          setError(data.joinRoom.error);
        }
      }
    });
  };
  
  if (joined) {
    return <JoinedLobby code={code} />;
  }
  
  return (
    <Container size="sm">
      <Title>Join Game</Title>
      <Text>Room Code: {code}</Text>
      <TextInput
        label="Your Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.currentTarget.value)}
      />
      <Button onClick={handleJoin} loading={isInFlight}>
        Join Game
      </Button>
    </Container>
  );
}
```

### New: JoinedLobby.tsx

```typescript
function JoinedLobby({ code }: { code: string }) {
  const { data } = useQuery(RoomByCodeQuery, { code });
  
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [code]);
  
  if (data.roomByCode.status === 'active') {
    // Navigate to game
    return <Navigate to={`/game/${code}`} />;
  }
  
  return (
    <Container size="sm">
      <Title>Waiting for Game to Start...</Title>
      <Text>Room Code: {code}</Text>
      <PlayerList players={data.roomByCode.players} />
      <Text c="dimmed">
        Waiting for host to start the game
      </Text>
    </Container>
  );
}
```

### New: GamePage.tsx (Minimalist Placeholder)

```typescript
function GamePage() {
  const { code } = useParams<{ code: string }>();
  const { data, loading } = useQuery(RoomByCodeQuery, { variables: { code } });
  
  if (loading) {
    return <Loader />;
  }
  
  if (!data?.roomByCode) {
    return (
      <Container size="sm">
        <Title order={1}>Game Not Found</Title>
        <Text>This game room doesn't exist.</Text>
        <Button component={Link} to="/">Back to Home</Button>
      </Container>
    );
  }
  
  const room = data.roomByCode;
  
  return (
    <Container size="sm" py="xl">
      <Title order={1}>Game: {room.code}</Title>
      
      {/* Simple player list without styling */}
      <div>
        <h2>Players:</h2>
        <ul>
          {room.players.map((player) => (
            <li key={player.id}>
              Player ID: {player.id} - {player.nickname}
              {player.isCreator && ' (Creator)'}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Placeholder for future PixiJS canvas */}
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed gray' }}>
        <p>Game canvas will be implemented with PixiJS in a future proposal.</p>
        <p>This is a minimalist placeholder page.</p>
      </div>
    </Container>
  );
}
```

**Purpose:**
- Provide basic route for `/game/{code}`
- Display game code and player IDs (no fancy styling)
- Placeholder for future PixiJS game implementation
- Prevent navigation errors when game starts

**Not in scope for this proposal:**
- Game logic or mechanics
- PixiJS canvas or rendering
- Turn management
- Game state synchronization
- Styled UI components

## Error Handling

### Network Errors
- Show toast notification
- Retry button for failed queries
- Graceful degradation (show stale data)

### Validation Errors
- Inline form errors (nickname validation)
- Clear error messages from backend

### Edge Cases
- Room deleted while viewing - show "Room not found"
- Creator leaves - transfer ownership or close room (future)
- Network interruption during polling - show "Reconnecting..."

## Performance Considerations

### Polling Optimization
- Use GraphQL field selection (only query needed fields)
- Implement query deduplication (Relay default)
- Consider exponential backoff if errors occur

### Database Queries
- Index on `Room.code` (already exists)
- Eager load `room.players` relationship
- Use `joinedload` for single query

```python
room = session.query(Room).options(
    joinedload(Room.players)
).filter_by(code=code).first()
```

## Security Considerations

### Input Validation
- Nickname: 3-20 chars, alphanumeric + underscore
- Room code: exactly 6 chars, valid charset

### Rate Limiting (Future)
- Limit join attempts per IP
- Limit room creation per IP

### Data Exposure
- Only expose public room data
- Don't leak player IDs to clients (or use UUIDs)

## Migration Plan

### Phase 1: Backend (No Breaking Changes)
1. Add `roomByCode` query
2. Add `joinRoom` mutation
3. Test with GraphQL playground

### Phase 2: Frontend (Breaking Changes)
1. Add React Router dependency
2. Update GameHall to use URL copy
3. Create JoinRoom page
4. Add polling to creator lobby
5. Test end-to-end flow

### Rollback
- Backend: Queries/mutations are additive, no rollback needed
- Frontend: Revert routing changes, restore "copy code" button

## Testing Strategy

### Unit Tests
- `validateNickname()` function
- `generate_room_url()` utility

### Integration Tests
- `joinRoom` mutation with various error cases
- `roomByCode` query with valid/invalid codes

### Manual Testing
1. Create room as User A
2. Copy join URL
3. Open in incognito as User B
4. Join room with nickname
5. Verify User A sees User B in lobby
6. Add User C and User D
7. Verify "Start Game" enables at 2+ players
8. Test edge cases (full room, invalid code, started game)

## Open Questions

1. **Creator leaves**: Should room persist or close?
   - **Proposed**: Transfer ownership to next player (future feature)
   - **MVP**: Room stays open, creator can rejoin via join link

2. **Session management**: How to persist player identity?
   - **Proposed**: Store player ID in localStorage
   - **Future**: Implement proper session tokens

3. **Concurrent joins**: What if 2 users join simultaneously and room becomes overfull?
   - **Mitigation**: Database transaction with row locking

4. **Polling when tab inactive**: Should we stop polling?
   - **Proposed**: Continue polling (browser throttles intervals automatically)

## Future Enhancements

- WebSocket subscriptions for true real-time updates
- Room chat
- Player kick/ban
- Room settings (map size, game mode)
- Spectator mode
- Rejoin after disconnect

