# Design: Build Game Hall

**Change ID:** `build-game-hall`

## Architecture Overview

This change introduces the foundational data layer and user interface for the multiplayer game system. It follows a three-tier architecture:

```
┌─────────────────────────────────────────┐
│  Frontend (React + Mantine)             │
│  - GameHall.tsx (landing page)          │
│  - CreateRoomForm.tsx (form component)  │
└────────────────┬────────────────────────┘
                 │ GraphQL over HTTP
┌────────────────▼────────────────────────┐
│  Backend (FastAPI + Strawberry)         │
│  - createRoom mutation                  │
│  - RoomType, PlayerType (GraphQL types) │
└────────────────┬────────────────────────┘
                 │ SQLAlchemy ORM
┌────────────────▼────────────────────────┐
│  Database (SQLite)                      │
│  - rooms table                          │
│  - players table                        │
└─────────────────────────────────────────┘
```

## Database Schema Design

### Entities

#### Room Table
```python
class Room(Base):
    __tablename__ = 'rooms'
    
    id: int (PK, auto-increment)
    code: str (unique, 6 chars, indexed)
    game_type: str (default: 'sean_4ex')
    status: str (enum: 'waiting', 'active', 'finished')
    created_at: datetime
    created_by_player_id: int (FK -> players.id)
```

#### Player Table
```python
class Player(Base):
    __tablename__ = 'players'
    
    id: int (PK, auto-increment)
    nickname: str (3-20 chars)
    room_id: int (FK -> rooms.id, nullable)
    is_creator: bool (default: false)
    joined_at: datetime
```

### Relationships
- Room has many Players (one-to-many)
- Room has one Creator (Player with is_creator=true)

### Design Decisions

**Why separate Player table?**
- Supports multiple players per room (future: joining)
- Allows tracking player history
- Flexible for future features (player stats, game history)

**Why not use sessions/JWT?**
- Project requirement: no authentication
- Players identified by nickname + room association only
- Stateless API simplifies MVP

## API Design

### GraphQL Schema

```graphql
type Room {
  id: ID!
  code: String!
  gameType: String!
  status: RoomStatus!
  createdAt: DateTime!
  creator: Player!
  players: [Player!]!
}

type Player {
  id: ID!
  nickname: String!
  isCreator: Boolean!
  joinedAt: DateTime!
}

enum RoomStatus {
  WAITING
  ACTIVE
  FINISHED
}

type Mutation {
  createRoom(nickname: String!): CreateRoomResult!
}

type CreateRoomResult {
  room: Room!
  player: Player!
}
```

### Room Code Generation Algorithm

```python
import random
import string

def generate_room_code() -> str:
    """
    Generate a 6-character room code.
    
    Uses alphanumeric chars excluding ambiguous ones:
    - Excluded: 0, O, 1, I, l (zero, oh, one, eye, el)
    - Included: 2-9, A-Z (except O, I)
    
    Collision probability: ~1 in 2 billion for 6 chars
    """
    charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    while True:
        code = ''.join(random.choices(charset, k=6))
        if not room_code_exists(code):
            return code
```

**Why this approach?**
- Easy to type and remember
- No ambiguous characters (reduces user error)
- Sufficient entropy: 32^6 = 1,073,741,824 combinations
- Simple collision check via database query

## Frontend Design

### Component Structure

```
src/
├── pages/
│   └── GameHall.tsx          # Landing page container
├── components/
│   ├── CreateRoomForm.tsx    # Room creation form
│   └── RoomCodeDisplay.tsx   # (Future) Shows created room code
└── graphql/
    └── mutations/
        └── createRoom.ts     # Relay mutation
```

### User Flow

```
┌──────────────┐
│ Landing Page │
│ "Welcome to  │
│  Sean 4EX"   │
└──────┬───────┘
       │
       ├─ Button: "Create Room"
       │
┌──────▼───────────────┐
│ Create Room Form     │
│ Input: Nickname      │
│ Button: Create       │
└──────┬───────────────┘
       │ (Submit)
┌──────▼───────────────┐
│ Loading Spinner      │
└──────┬───────────────┘
       │ (Success)
┌──────▼───────────────┐
│ Room Created!        │
│ Code: ABCD12         │
│ "Share this code..." │
└──────────────────────┘
```

### Form Validation

```typescript
interface CreateRoomForm {
  nickname: string;
}

const validation = {
  nickname: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    errorMessages: {
      required: 'Nickname is required',
      minLength: 'Must be at least 3 characters',
      maxLength: 'Must be no more than 20 characters',
      pattern: 'Only letters, numbers, and underscores allowed',
    },
  },
};
```

## Data Flow

### Create Room Sequence

```
User                Frontend              Backend              Database
  │                    │                     │                     │
  ├─ Enter nickname ──▶│                     │                     │
  │                    │                     │                     │
  ├─ Click "Create" ──▶│                     │                     │
  │                    │                     │                     │
  │                    ├─ createRoom() ────▶│                     │
  │                    │   mutation          │                     │
  │                    │                     │                     │
  │                    │                     ├─ Generate code ────▶│
  │                    │                     │                     │
  │                    │                     ├─ Check unique ─────▶│
  │                    │                     │◀─ (not exists) ─────│
  │                    │                     │                     │
  │                    │                     ├─ INSERT Room ──────▶│
  │                    │                     ├─ INSERT Player ────▶│
  │                    │                     │◀─ Success ──────────│
  │                    │                     │                     │
  │                    │◀─ { room, player } │                     │
  │◀─ Display code ────│                     │                     │
  │                    │                     │                     │
```

## Error Handling

### Backend Errors
- **Database connection failure**: HTTP 500, log error, return generic message
- **Unique constraint violation** (code collision): Retry code generation (max 3 attempts)
- **Invalid nickname**: HTTP 400 with validation error details

### Frontend Errors
- **Network failure**: Show "Unable to connect" message with retry button
- **Validation errors**: Inline form field errors
- **Unknown error**: Generic error message + support contact info

## Performance Considerations

### Database Indexes
```sql
CREATE UNIQUE INDEX idx_room_code ON rooms(code);
CREATE INDEX idx_room_status ON rooms(status);
CREATE INDEX idx_player_room ON players(room_id);
```

### Query Optimization
- Room code uniqueness check: Single indexed query
- Room creation: Transaction with COMMIT to ensure atomicity
- Expected load: < 10 room creations per minute (development phase)

### Caching Strategy
- **No caching for MVP**: SQLite queries are fast enough (< 10ms)
- **Future consideration**: Redis for active room lookups

## Security Considerations

### Input Validation
- Nickname: Whitelist alphanumeric + underscore only
- Max length enforced (prevent DoS via large inputs)
- SQL injection: Prevented by SQLAlchemy parameterized queries

### Rate Limiting
- **Not implemented in MVP**: Single-server, low traffic expected
- **Future**: Add rate limiting middleware (10 requests/minute per IP)

## Testing Strategy

### Unit Tests
- Room code generation (uniqueness, character set)
- Nickname validation logic
- Database model constraints

### Integration Tests
- End-to-end room creation flow
- Database transaction rollback on error
- GraphQL mutation response format

### Manual Testing Checklist
- [ ] Create room with valid nickname
- [ ] Create room with invalid nickname (too short, too long, special chars)
- [ ] Create multiple rooms (verify unique codes)
- [ ] Verify room appears in database
- [ ] Test network error handling (disconnect API)

## Alternatives Considered

### Alternative 1: UUID for Room Codes
**Rejected because:**
- UUIDs are 36 characters (too long to type/remember)
- Overkill for the scale we need
- User experience suffers

### Alternative 2: Numeric Codes (6 digits)
**Rejected because:**
- Only 1,000,000 combinations (insufficient)
- Less memorable than alphanumeric
- Ambiguous digits (0 vs O)

### Alternative 3: Nouns + Adjectives (e.g., "happy-cat")
**Rejected because:**
- Requires word list maintenance
- Harder to internationalize
- More complex to implement

## Future Enhancements

### Phase 2 (Not in this change)
- Room expiration after 24 hours of inactivity
- Room password/privacy settings
- Custom game configuration (player count, rules)
- Room search/browse interface

### Phase 3
- WebSocket for real-time updates
- Room invitation links
- Room history and statistics

