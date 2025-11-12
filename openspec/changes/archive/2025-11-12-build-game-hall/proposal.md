# Proposal: Build Game Hall

**Change ID:** `build-game-hall`  
**Status:** Draft  
**Created:** 2025-11-12  
**Author:** Development Team

## Overview

Build the game hall landing page where users can create game rooms without authentication. This is the entry point for the Sean 4EX multiplayer game, enabling players to start new games and receive unique room codes to share with friends.

## Problem Statement

Currently, the application has only example code (Film list). We need to implement the core game lobby functionality that allows:

1. Users to create a game room by entering their nickname
2. System to generate unique 6-character room codes
3. Room state persistence in database (SQLite + SQLAlchemy)
4. Users to see their room code and wait for other players

This is the foundational feature required before implementing room joining, player management, and actual gameplay.

## Goals

### Primary Goals
- ✅ **Room Creation**: Users can create a room with their nickname
- ✅ **Room Code Generation**: System generates unique, memorable 6-character codes
- ✅ **Data Persistence**: Rooms are stored in SQLite database via SQLAlchemy
- ✅ **Simple UX**: Clean Mantine UI with form validation and feedback

### Non-Goals (Future Work)
- ❌ Room joining (separate change)
- ❌ Player management and lobby state
- ❌ Game start logic
- ❌ Real-time updates (subscriptions/polling)

## User Stories

**As a player**, I want to create a game room so that I can invite friends to play Sean 4EX with me.

**Acceptance Criteria:**
- I can enter my nickname (3-20 characters, alphanumeric)
- I receive a unique 6-character room code
- The room code is memorable (no ambiguous characters like 0/O, 1/I/l)
- I see a confirmation with my room code displayed prominently
- Room persists in database even if I refresh the page

## Scope

### In Scope
1. **Database Schema** - Room and Player models with SQLAlchemy
2. **Backend API** - GraphQL mutation for room creation
3. **Frontend UI** - Landing page with room creation form

### Out of Scope
- Room joining interface
- Lobby player list
- Game selection (only Sean 4EX for now)
- WebSocket/real-time features

## Dependencies

### Technical Dependencies
- SQLAlchemy (add to pyproject.toml)
- Database initialization script
- Relay compiler for GraphQL types generation

### Architectural Dependencies
- None (this is the first feature)

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Room code collisions | Medium | Low | Use cryptographically random generation + uniqueness check |
| Database performance | Low | Low | SQLite sufficient for 50+ concurrent rooms |
| Form validation complexity | Low | Low | Use Mantine form hooks with simple validation rules |

## Success Metrics

- Room creation completes in < 500ms
- Room codes are unique (0 collisions in testing)
- UI is responsive and accessible
- Database queries are efficient (< 50ms)

## Related Changes

None (this is the foundational change)

## Open Questions

1. **Room expiration**: Should rooms expire after inactivity?
   - **Decision needed**: Implement in future change or add TTL now?
   
2. **Room code format**: XXXXXX (6 chars) vs XXX-XXX (3-3 with dash)?
   - **Proposed**: 6 chars no dash for simplicity, revisit if UX issues

3. **Nickname storage**: Store in Room model or separate Player model?
   - **Proposed**: Separate Player model (more flexible for future)

