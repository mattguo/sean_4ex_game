# Proposal: Add Room Joining and Lobby System

**Change ID:** `add-room-joining-and-lobby`  
**Status:** Draft  
**Created:** 2025-11-12  
**Author:** Development Team

## Why

Currently, users can create rooms but have no way to join existing rooms or see who has joined their room. We need to enable the multiplayer flow where:
- Room creators can share a direct URL (not just a code)
- Other players can join via URL
- Creators can see who has joined in real-time
- Game can start once enough players have joined

This completes the core lobby functionality required before implementing actual gameplay.

## What Changes

- **BREAKING**: Replace "copy code" button with "copy URL" button that generates `{host}/join/{code}`
- **NEW**: URL routing for `/join/{code}` path
- **NEW**: Join game UI for players accessing join URLs
- **NEW**: Real-time polling (3-second interval) on creator's lobby to show joined players
- **NEW**: "Start Game" button that enables when valid number of players joined
- **NEW**: Error states for invalid/started/full rooms
- **NEW**: Backend API for joining rooms and fetching room state
- **NEW**: Game page route (`/game/{code}`) with minimalist placeholder UI
- **NEW**: All players automatically routed to game page when creator starts game

## Impact

### Affected Specs
- `room-creation` (MODIFIED - URL sharing instead of code)
- `room-joining` (ADDED - new capability)
- `game-lobby` (ADDED - new capability)

### Affected Code
- `frontend/src/GameHall.tsx` - Update copy button to URL, add polling
- `frontend/src/App.tsx` - Add routing
- `frontend/src/GamePage.tsx` - New minimalist game page placeholder
- `api/mutations.py` - Add `joinRoom` and `startGame` mutations
- `api/queries.py` - Add `roomByCode` query
- `api/models.py` - Update room status transitions

### Dependencies
- React Router (or similar) for client-side routing
- Polling mechanism (useState + useEffect with intervals)

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| URL routing complexity | Medium | Low | Use simple path-based routing (React Router or native) |
| Polling performance | Medium | Medium | 3-second interval is conservative; monitor backend load |
| Race conditions in join | High | Medium | Use database transactions and proper locking |
| Stale lobby data | Medium | Medium | Clear polling interval on unmount; show loading states |

## Success Criteria

- [ ] Users can share and copy join URLs
- [ ] Join URLs navigate to join page correctly
- [ ] Join page validates room code and shows appropriate errors
- [ ] Creator sees live updates of joined players (≤5 second latency)
- [ ] Start Game button enables only when valid player count
- [ ] All database operations handle concurrency correctly

## Related Changes

- Depends on: `build-game-hall` (must be complete)
- Blocks: Game start and turn execution features

## Open Questions

1. **Routing library**: Use React Router, Wouter, or native?
   - **Proposed**: React Router (most mature, good docs)
   - **Decision**: React Router v6

2. **Polling vs WebSockets/SSE**: What mechanism for real-time updates?
   - **Lobby phase (player joins, waiting for start)**: 
     - **Proposed**: **Polling (3-5 sec)** - Simple, sufficient latency for lobby
     - Rationale: Lobby updates are low-frequency, not latency-critical
   - **Game phase (turn-based actions, state sync)**:
     - **Proposed**: **WebSockets or SSE** - Lower latency, bi-directional preferred
     - Rationale: Game actions need <1s response time, frequent bidirectional updates
   - **Migration path**: Start with polling for lobby, implement WebSocket for game phase in separate proposal

3. **Player limit**: What's the max players per room?
   - **Proposed**: 4 players (per Sean 4EX rules)
   - **Decision**: 4 players max

4. **Room validation**: Should join check if room is expired/inactive?
   - **Proposed**: Yes, add status checks (waiting/active/finished)
   - **Decision**: Yes, validate status

5. **Game page placeholder**: What should minimal game page show?
   - **Proposed**: Game code (title), player IDs as simple text list
   - Note: Full game UI with PixiJS will be separate proposal

