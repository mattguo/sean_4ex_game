# Tasks: Add Room Joining and Lobby System

**Change ID:** `add-room-joining-and-lobby`  
**Status:** Draft

## Task Breakdown

### Stream 1: Backend API Extensions

#### Task 1.1: Add roomByCode Query
**Est:** 20 min | **Priority:** P0 | **Depends on:** build-game-hall complete

- [ ] Update `api/queries.py` (or create if doesn't exist)
- [ ] Add `room_by_code(code: str) -> Optional[RoomType]` method to `MyAPIQuery`
- [ ] Query database with eager loading of players relationship
- [ ] Return None if room not found
- [ ] Add error handling and logging

**Validation:**
```graphql
query {
  roomByCode(code: "ABC123") {
    id
    code
    status
    players {
      nickname
      isCreator
    }
  }
}
```

**Files:** `api/queries.py` (update or create)

---

#### Task 1.2: Define JoinRoomResult Type
**Est:** 10 min | **Priority:** P0 | **Depends on:** 1.1

- [ ] Add `JoinRoomResult` type to `api/graphql_types.py`
- [ ] Define fields: `success: bool`, `error: Optional[str]`, `room: Optional[RoomType]`, `player: Optional[PlayerType]`
- [ ] Add error code constants (ROOM_NOT_FOUND, ROOM_FULL, etc.)

**Validation:**
```python
from graphql_types import JoinRoomResult
result = JoinRoomResult(success=False, error="ROOM_NOT_FOUND")
assert result.success == False
```

**Files:** `api/graphql_types.py` (update)

---

#### Task 1.3: Implement joinRoom Mutation
**Est:** 45 min | **Priority:** P0 | **Depends on:** 1.2

- [ ] Add `join_room(code: str, nickname: str) -> JoinRoomResult` to `MyAPIMutation` in `api/mutations.py`
- [ ] Validate nickname using existing `validate_nickname()` function
- [ ] Check room exists
- [ ] Check room status is "waiting"
- [ ] Check room not full (< 4 players)
- [ ] Check nickname not taken in this room
- [ ] Create Player record with `is_creator=False`
- [ ] Use database transaction with proper error handling
- [ ] Add logging for join attempts
- [ ] Return appropriate error codes for each failure case

**Validation:**
```graphql
mutation {
  joinRoom(code: "ABC123", nickname: "Player2") {
    success
    error
    room {
      code
      players {
        nickname
      }
    }
    player {
      nickname
      isCreator
    }
  }
}
```

**Files:** `api/mutations.py` (update)

---

#### Task 1.4: Update GraphQL Schema Export
**Est:** 5 min | **Priority:** P0 | **Depends on:** 1.3

- [ ] Export updated schema:
  ```bash
  cd api && uv run strawberry export-schema main > ../frontend/src/graphql_schema/local_schema.graphql
  ```
- [ ] Verify new query and mutation appear in schema
- [ ] Commit schema file

**Validation:**
- Schema file contains `roomByCode` query
- Schema file contains `joinRoom` mutation

**Files:** `frontend/src/graphql_schema/local_schema.graphql` (update)

---

### Stream 2: Frontend Routing Setup

#### Task 2.1: Add React Router Dependency
**Est:** 5 min | **Priority:** P0 | **Depends on:** None

- [ ] Install React Router: `cd frontend && pnpm add react-router-dom`
- [ ] Verify installation
- [ ] Update `package.json` is committed

**Validation:**
```bash
cd frontend && pnpm list react-router-dom
```

**Files:** `frontend/package.json` (update), `frontend/pnpm-lock.yaml` (update)

---

#### Task 2.2: Add Router to App Component
**Est:** 20 min | **Priority:** P0 | **Depends on:** 2.1

- [ ] Import `BrowserRouter`, `Routes`, `Route` from `react-router-dom`
- [ ] Wrap app content in `<BrowserRouter>`
- [ ] Define routes:
  - `/` → GameHall component
  - `/join/:code` → JoinRoom component (to be created)
- [ ] Move theme toggle and GQL debug link outside routes (persistent across pages)
- [ ] Test navigation works

**Validation:**
- Navigate to `/` shows GameHall
- Navigate to `/join/TEST123` shows JoinRoom (even if component is placeholder)

**Files:** `frontend/src/App.tsx` (update)

---

### Stream 3: Join Room Flow (Frontend)

#### Task 3.1: Create Join Room Component
**Est:** 60 min | **Priority:** P0 | **Depends on:** 2.2, 1.4

- [ ] Create `frontend/src/JoinRoom.tsx`
- [ ] Extract `code` from URL params using `useParams()`
- [ ] Create form with nickname TextInput (Mantine)
- [ ] Add client-side validation using existing `validateNickname()` utility
- [ ] Define `JoinRoomMutation` GraphQL mutation inline
- [ ] Use `useMutation` hook from Relay
- [ ] Handle form submission:
  - Call mutation with code and nickname
  - Show loading state
  - On success: navigate to joined lobby or show success state
  - On error: display error message from backend
- [ ] Add "Room Code: {code}" display
- [ ] Style with Mantine Container, Title, Text, Button

**Validation:**
- Component renders with code from URL
- Form validates nickname
- Mutation called on submit
- Error messages displayed for backend errors

**Files:** `frontend/src/JoinRoom.tsx` (new)

---

#### Task 3.2: Add Room Code Query
**Est:** 20 min | **Priority:** P0 | **Depends on:** 1.4

- [ ] Define `RoomByCodeQuery` in `frontend/src/JoinRoom.tsx` or separate file
- [ ] Query fields: room { id, code, status, players { nickname, isCreator, joinedAt }, creator { nickname } }
- [ ] Run Relay compiler: `cd frontend && pnpm relay`
- [ ] Verify generated types

**Validation:**
```bash
cd frontend && pnpm relay
# Check generated file exists
```

**Files:** `frontend/src/__generated__/RoomByCodeQuery.graphql.ts` (generated)

---

#### Task 3.3: Create Joined Lobby Component
**Est:** 45 min | **Priority:** P0 | **Depends on:** 3.2

- [ ] Create `frontend/src/JoinedLobby.tsx`
- [ ] Accept props: `code: string`, `playerId: number`
- [ ] Use `useQuery` with `RoomByCodeQuery`
- [ ] Implement polling with `useEffect`:
  ```typescript
  useEffect(() => {
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [code, refetch]);
  ```
- [ ] Display:
  - Room code
  - "Waiting for game to start..." message
  - Player list (map over `data.roomByCode.players`)
  - Creator indicator (show who's the host)
- [ ] Check if game started (`status === "active"`):
  - If yes, navigate to game page (placeholder for now)
- [ ] Add loading skeleton while fetching
- [ ] Style with Mantine components

**Validation:**
- Component polls every 3 seconds
- Player list updates when new players join (test with multiple browser tabs)
- Polling stops when component unmounts

**Files:** `frontend/src/JoinedLobby.tsx` (new)

---

#### Task 3.4: Integrate Join Flow in JoinRoom
**Est:** 15 min | **Priority:** P0 | **Depends on:** 3.1, 3.3

- [ ] Add state to track if player has joined: `const [joined, setJoined] = useState(false)`
- [ ] Add state to store player ID after join: `const [playerId, setPlayerId] = useState<number | null>(null)`
- [ ] On successful mutation:
  - Set `joined = true`
  - Store `playerId` from mutation result
- [ ] Conditionally render:
  - If not joined: show join form
  - If joined: render `<JoinedLobby code={code} playerId={playerId} />`

**Validation:**
- After joining, component switches to JoinedLobby
- Player sees themselves in the lobby
- Polling starts automatically

**Files:** `frontend/src/JoinRoom.tsx` (update)

---

### Stream 4: Creator Lobby Updates (Frontend)

#### Task 4.1: Update GameHall - Copy URL Instead of Code
**Est:** 15 min | **Priority:** P0 | **Depends on:** 2.2

- [ ] Update room code display section in `GameHall.tsx`
- [ ] Generate join URL: `const joinUrl = ${window.location.origin}/join/${roomCode}`
- [ ] Replace "Copy Code" button with "Copy Join URL" button
- [ ] Update CopyButton `value` prop to `joinUrl`
- [ ] Update button text: "Copy Join URL" / "URL Copied!"
- [ ] Add icon: `<IconLink />` from `@tabler/icons-react`
- [ ] Update instructional text: "Share this URL with friends to join"

**Validation:**
- Copy button copies full URL (not just code)
- URL format is correct: `http://localhost:5173/join/ABC123`
- Opening URL in new tab navigates to JoinRoom page

**Files:** `frontend/src/GameHall.tsx` (update)

---

#### Task 4.2: Add Creator Lobby Polling
**Est:** 30 min | **Priority:** P0 | **Depends on:** 4.1, 3.2

- [ ] Import `useQuery` and `RoomByCodeQuery` in `GameHall.tsx`
- [ ] After room creation, use query to fetch room state:
  ```typescript
  const { data, refetch } = useQuery(RoomByCodeQuery, { variables: { code: roomCode } });
  ```
- [ ] Implement polling with `useEffect`:
  ```typescript
  useEffect(() => {
    if (!roomCode) return;
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [roomCode, refetch]);
  ```
- [ ] Display player list below room code
- [ ] Style player list with Mantine components (List, Avatar, Badge)
- [ ] Show "Creator" badge next to creator's name
- [ ] Show player count: "Players: {count}/4"

**Validation:**
- Creator sees new players appear within 3 seconds of joining
- Player list updates in real-time
- Polling stops if component unmounts

**Files:** `frontend/src/GameHall.tsx` (update)

---

#### Task 4.3: Add Start Game Button
**Est:** 30 min | **Priority:** P0 | **Depends on:** 4.2

- [ ] Add "Start Game" button in creator's lobby view
- [ ] Calculate if button should be enabled:
  ```typescript
  const playerCount = data?.roomByCode?.players?.length ?? 0;
  const canStart = playerCount >= 2 && playerCount <= 4;
  ```
- [ ] Disable button if `!canStart`
- [ ] Add tooltip explaining why disabled (e.g., "Need 2-4 players to start")
- [ ] Add `onClick` handler (placeholder for now - just console.log)
- [ ] Style button prominently (primary color, large size)
- [ ] Show player count in button text: "Start Game (2/4 players)"

**Validation:**
- Button disabled when 0-1 players
- Button enabled when 2-4 players
- Tooltip shows on disabled state
- Button click logged to console

**Files:** `frontend/src/GameHall.tsx` (update)

---

### Stream 5: Error Handling & Edge Cases

#### Task 5.1: Add Error States to JoinRoom
**Est:** 30 min | **Priority:** P1 | **Depends on:** 3.1

- [ ] Add state for error message: `const [error, setError] = useState<string | null>(null)`
- [ ] Map backend error codes to user-friendly messages:
  - `ROOM_NOT_FOUND` → "Room not found. Please check the code."
  - `ROOM_ALREADY_STARTED` → "This game has already started."
  - `ROOM_FULL` → "This room is full (4/4 players)."
  - `NICKNAME_TAKEN` → "This nickname is already taken in this room."
  - `INVALID_NICKNAME` → "Invalid nickname. Use 3-20 alphanumeric characters."
- [ ] Display error with Mantine Alert component (red, with icon)
- [ ] Clear error when user edits nickname
- [ ] Add "Try Again" button for network errors

**Validation:**
- Test each error case:
  - Join with invalid code → see "Room not found"
  - Join room with 4 players → see "Room is full"
  - Join with duplicate nickname → see "Nickname already taken"

**Files:** `frontend/src/JoinRoom.tsx` (update)

---

#### Task 5.2: Add Loading and Empty States
**Est:** 20 min | **Priority:** P1 | **Depends on:** 3.3, 4.2

- [ ] Add loading skeleton to JoinedLobby while query loading
- [ ] Add loading skeleton to creator lobby while fetching players
- [ ] Add empty state: "Waiting for players to join..."
- [ ] Use Mantine Skeleton and Loader components
- [ ] Ensure smooth transitions between states

**Validation:**
- Skeletons appear while loading
- Empty state shows when no players yet
- Smooth fade-in when data loads

**Files:** `frontend/src/JoinedLobby.tsx` (update), `frontend/src/GameHall.tsx` (update)

---

#### Task 5.3: Handle Invalid Room Code in URL
**Est:** 20 min | **Priority:** P1 | **Depends on:** 3.1

- [ ] In JoinRoom, query room immediately on mount (before join form)
- [ ] If room not found, show error page:
  - Message: "Room not found"
  - Explanation: "This room doesn't exist or has been closed."
  - Button: "Create New Room" (navigate to `/`)
- [ ] Don't show join form if room invalid

**Validation:**
- Navigate to `/join/INVALID`
- See error page immediately (no form shown)
- Click "Create New Room" navigates to home

**Files:** `frontend/src/JoinRoom.tsx` (update)

---

### Stream 6: Integration & Testing

#### Task 6.1: Compile GraphQL Types
**Est:** 5 min | **Priority:** P0 | **Depends on:** All frontend GraphQL code

- [ ] Run Relay compiler: `cd frontend && pnpm relay`
- [ ] Fix any compilation errors
- [ ] Verify all generated types are correct
- [ ] Check no TypeScript errors

**Validation:**
```bash
cd frontend && pnpm relay
cd frontend && pnpm run tsc --noEmit
```

---

#### Task 6.2: End-to-End Manual Testing
**Est:** 45 min | **Priority:** P0 | **Depends on:** All previous tasks

Test complete flow with multiple users:

- [ ] **Test 1: Happy Path (2 players)**
  1. User A creates room
  2. User A copies join URL
  3. User A sees themselves in lobby (1/4 players)
  4. User B opens URL in incognito
  5. User B enters nickname and joins
  6. User A sees User B appear in lobby (2/4 players)
  7. User A sees "Start Game" button enabled
  8. User B sees "Waiting for game to start"

- [ ] **Test 2: Full Room (4 players)**
  1. Create room, have 4 players join
  2. Try to join with 5th player
  3. See "Room is full" error

- [ ] **Test 3: Duplicate Nickname**
  1. User A creates room with nickname "Alice"
  2. User B tries to join with nickname "Alice"
  3. See "Nickname already taken" error
  4. User B changes to "Bob" and joins successfully

- [ ] **Test 4: Invalid Room Code**
  1. Navigate to `/join/INVALID`
  2. See "Room not found" error
  3. No join form shown

- [ ] **Test 5: Real-time Updates**
  1. User A creates room (browser tab 1)
  2. User B joins (browser tab 2)
  3. Verify User A sees User B within 3 seconds
  4. User C joins (browser tab 3)
  5. Verify both A and B see User C

- [ ] **Test 6: Polling Cleanup**
  1. Create room
  2. Open DevTools Network tab
  3. Verify polling happens every 3 seconds
  4. Navigate away from page
  5. Verify polling stops (no more requests)

**Files:** Manual testing checklist

---

#### Task 6.3: Database Verification
**Est:** 15 min | **Priority:** P0 | **Depends on:** 6.2

- [ ] After tests, inspect `api/game_state.db`:
  ```bash
  cd api && sqlite3 game_state.db
  SELECT * FROM rooms;
  SELECT * FROM players;
  ```
- [ ] Verify:
  - Rooms have correct status
  - Players have correct room_id
  - Creator player has `is_creator=1`
  - Non-creator players have `is_creator=0`
  - Timestamps are correct

---

#### Task 6.4: Browser Compatibility Testing
**Est:** 20 min | **Priority:** P1 | **Depends on:** 6.2

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge
- [ ] Verify clipboard API works in all browsers
- [ ] Verify routing works in all browsers

---

#### Task 6.5: Responsive Design Testing
**Est:** 15 min | **Priority:** P1 | **Depends on:** 6.2

- [ ] Test on mobile viewport (375px width)
- [ ] Test on tablet viewport (768px width)
- [ ] Test on desktop viewport (1920px width)
- [ ] Verify player list is readable on all sizes
- [ ] Verify buttons are tappable on mobile

---

#### Task 6.6: Accessibility Testing
**Est:** 20 min | **Priority:** P1 | **Depends on:** 6.2

- [ ] Test keyboard navigation:
  - Tab through join form
  - Enter submits form
  - Focus visible on all interactive elements
- [ ] Test screen reader (if available):
  - Form labels announced correctly
  - Error messages announced
  - Player list readable
- [ ] Verify color contrast (use browser DevTools)
- [ ] Add ARIA labels where needed

---

### Stream 7: Documentation & Cleanup

#### Task 7.1: Update README
**Est:** 15 min | **Priority:** P1 | **Depends on:** 6.2

- [ ] Document new features:
  - Room joining via URL
  - Real-time lobby updates
  - Start game button
- [ ] Update development instructions if needed
- [ ] Add troubleshooting section for common issues

**Files:** `readme.md` (update)

---

#### Task 7.2: Update .gitignore
**Est:** 5 min | **Priority:** P1 | **Depends on:** None

- [ ] Verify `.gitignore` ignores:
  - `api/game_state.db`
  - `frontend/node_modules/`
  - `frontend/dist/`
  - `frontend/src/__generated__/` (if not already)
- [ ] Add any missing entries

**Files:** `.gitignore` (update if needed)

---

#### Task 7.3: Code Cleanup
**Est:** 20 min | **Priority:** P1 | **Depends on:** All implementation tasks

- [ ] Remove console.log statements
- [ ] Remove commented-out code
- [ ] Fix linter warnings
- [ ] Add JSDoc comments to complex functions
- [ ] Ensure consistent code style

---

## Task Dependencies Graph

```
Backend:
1.1 → 1.2 → 1.3 → 1.4

Frontend Routing:
2.1 → 2.2

Join Flow:
2.2, 1.4 → 3.1 → 3.4
1.4 → 3.2 → 3.3 → 3.4

Creator Lobby:
2.2, 3.2 → 4.1 → 4.2 → 4.3

Error Handling:
3.1 → 5.1
3.3, 4.2 → 5.2
3.1 → 5.3

Integration:
All → 6.1 → 6.2 → 6.3, 6.4, 6.5, 6.6 → 7.1, 7.2, 7.3
```

## Parallelization Opportunities

Can be worked on simultaneously:
- Stream 1 (Backend) and Stream 2 (Routing setup)
- Task 3.1 (JoinRoom UI) and Task 4.1 (Copy URL)
- Task 5.1, 5.2, 5.3 (different error states)
- Task 6.4, 6.5, 6.6 (different test types)

## Estimated Total Time

- Backend API: ~1.5 hours
- Frontend Routing: ~25 min
- Join Flow: ~2.5 hours
- Creator Lobby: ~1.25 hours
- Error Handling: ~1.25 hours
- Testing: ~2 hours
- Documentation: ~40 min

**Total:** ~9.5 hours for single developer  
**With parallelization:** ~6-7 hours

## Rollback Plan

1. **Backend API**: Additions are non-breaking, no rollback needed
2. **Frontend**: Revert routing changes, restore "copy code" button
3. **Full Rollback**: `git revert <commit-hash>`

## Definition of Done

- [ ] All tasks completed and validated
- [ ] End-to-end flow works for 2-4 players
- [ ] All error cases handled gracefully
- [ ] Polling works correctly and cleans up
- [ ] Start game button enables at correct player count
- [ ] Code is clean and well-documented
- [ ] No linter errors or TypeScript errors
- [ ] Tests passed (manual testing checklist)
- [ ] README updated
- [ ] Code committed and pushed

