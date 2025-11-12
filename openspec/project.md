# Project Context

## Purpose

**Sean 4EX Game** - A multiplayer web-based platform for playing turn-based 4X strategy games.

### Core Features
- **No User Accounts**: Zero friction entry - players don't need to register or maintain accounts
- **Room-Based Gameplay**: Simple room creation and joining via room codes
- **Multiplayer Support**: 2-4 players per game (expandable)
- **Real-time Synchronization**: All players see game state updates in real-time

### User Flow
1. **Landing Page**: User chooses to create or join a room
2. **Room Creation**: 
   - Enter nickname
   - Select game type
   - Receive unique room code
   - Wait for other players to join
3. **Room Joining**: Enter room code and nickname
4. **Game Start**: Room creator starts game when minimum players joined (2-4 players)
5. **Gameplay**: Turn-based strategy game with rich UI

### Current Game
- **Sean 4EX**: A minimized civilization game designed by an 8-year-old
- **Rules**: See `/game_rules/sean_4ex_rules.md` for complete game mechanics
- **Game Type**: Turn-based 4X (eXplore, eXpand, eXploit, eXterminate)

## Tech Stack

### Backend
- **Language**: Python 3.12+
- **Framework**: FastAPI
- **GraphQL**: Strawberry GraphQL
- **Database**: SQLite with SQLAlchemy ORM
- **Package Manager**: uv (modern, fast Python package manager)
- **Server**: Uvicorn (ASGI server with hot reload)

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Mantine (modern React component library)
- **Game Rendering**: PixiJS (2D WebGL game engine)
- **GraphQL Client**: Relay (Facebook's GraphQL client)
- **Build Tool**: Vite
- **Package Manager**: pnpm (fast, disk-efficient package manager)

### Communication
- **API Layer**: GraphQL over HTTP
- **Real-time Updates**: GraphQL Subscriptions (planned) or polling
- **Schema**: Shared between backend and frontend

### Development Tools
- **Backend Dev**: `uv run uvicorn main:app --reload --port 9000`
- **Frontend Dev**: `pnpm dev` (runs on port 5173)
- **Hot Reload**: Both backend and frontend support automatic reloading
- **API Proxy**: Frontend proxies `/graphql` to backend during development

### Deployment
- **Production Mode**: Single port (9000) serves both frontend static files and API
- **Frontend Build**: Static files generated to `frontend/dist/`
- **Backend Serving**: FastAPI serves static files + GraphQL endpoint

See root `readme.md` for detailed setup instructions.

## Project Conventions

### Code Style

#### Python (Backend)
- **Style Guide**: PEP 8 compliant
- **Type Hints**: Use type hints for all function signatures
- **Naming**:
  - Classes: `PascalCase`
  - Functions/Variables: `snake_case`
  - Constants: `UPPER_SNAKE_CASE`
- **Imports**: Group by standard library, third-party, local imports

#### TypeScript/React (Frontend)
- **Style Guide**: Standard TypeScript conventions
- **Naming**:
  - Components: `PascalCase` (e.g., `FilmList.tsx`)
  - Functions/Variables: `camelCase`
  - Types/Interfaces: `PascalCase`
  - CSS Classes: `kebab-case` (when not using Mantine props)
- **Component Structure**:
  - Prefer functional components with hooks
  - Use TypeScript for all components
  - Props should have explicit types
- **Mantine Usage**:
  - Use Mantine shorthand props (e.g., `fw={500}`, `c="inherit"`)
  - Prefer Mantine components over raw HTML when possible
  - Use `Group`, `Stack`, `Box` for layouts

#### GraphQL
- **Schema Naming**:
  - Types: `PascalCase` (e.g., `Film`, `Player`)
  - Fields: `camelCase` (e.g., `allFilms`, `roomCode`)
  - Mutations: Verb-first (e.g., `createRoom`, `joinRoom`)
  - Queries: Noun-based (e.g., `allGames`, `roomStatus`)

### Architecture Patterns

#### Backend Architecture
- **Pattern**: Layered architecture with ORM
- **Structure**:
  - GraphQL schema definitions (Strawberry types)
  - Business logic in query/mutation resolvers
  - SQLAlchemy models for database entities
  - Data models separate from GraphQL types
  - Static file serving for production frontend
- **Data Layer**:
  - SQLAlchemy ORM for database operations
  - SQLite for local development and production
  - Session management for database transactions

#### Frontend Architecture
- **Pattern**: Component-based architecture with Relay
- **Structure**:
  ```
  src/
    ├── components/     # Reusable components
    ├── pages/          # Page-level components
    ├── graphql_schema/ # GraphQL schemas
    ├── game/           # PixiJS game engine code
    └── App.tsx         # Root application
  ```
- **State Management**:
  - Relay for GraphQL data
  - React hooks for local state
  - Context API for global UI state (e.g., theme)
- **Game Rendering**:
  - PixiJS for game board and animations
  - React for UI overlays (HUD, menus, dialogs)
  - Mantine for standard UI components

#### Communication Pattern
- **GraphQL First**: All backend communication via GraphQL
- **Code Generation**: Relay compiler generates TypeScript types from schema
- **Schema Sync**: Backend exports schema → Frontend generates types
  ```bash
  cd api && uv run strawberry export-schema main > ../frontend/src/graphql_schema/local_schema.graphql
  cd frontend && pnpm relay
  ```

### Testing Strategy

#### Current Status
- **Backend**: Manual testing via GraphQL playground
- **Frontend**: Manual testing in browser
- **Integration**: End-to-end manual testing

#### Future Plans
- **Backend**: pytest for unit tests
- **Frontend**: Vitest + React Testing Library
- **E2E**: Playwright for critical flows
- **Game Logic**: Unit tests for game rules

### Git Workflow

#### Branching
- **Main Branch**: `main` - production-ready code
- **Feature Branches**: Short-lived, merged via commits
- **No Protected Branches**: Direct commits allowed for rapid iteration

#### Commit Messages
- **Format**: Clear, descriptive messages
- **Style**: Start with verb (e.g., "Add", "Fix", "Update")
- **Examples**:
  - "Migrate to modern package managers: uv for backend, pnpm for frontend"
  - "Add GQL debug link to navigation"
  - "Update victory condition to 1.5x AND ≥10 lead"

#### Workflow
- Commit working features immediately
- Push to origin regularly
- No formal PR process (solo/small team development)

## Domain Context

### Game Terminology

#### 4X Game Genre
- **eXplore**: Discover new opportunities (resource gathering in Sean 4EX)
- **eXpand**: Grow your territory/population
- **eXploit**: Use resources efficiently (tools, crafting)
- **eXterminate**: Compete with/eliminate opponents (raids, combat)

#### Sean 4EX Game Concepts
- **Population Types**: Free, Gatherer, Crafter, Fighter, Wounded
- **Resources**: Food, Stone, Leather, Stick
- **Items**: Tools (gathering/crafting/universal), Weapons (spear/bow), Armor
- **Turn Phases**: Assign Jobs → Execution → End Turn
- **Combat**: 5 rounds per turn, random targeting, ranged vs melee
- **Victory**: 1.5× opponents' population AND ≥10 lead

#### Key Game Mechanics
- **Production Formula**: `floor(N × Tool_Multiplier)`
- **Tool Multiplier**: 1.5 with tool, 1.0 without
- **Population Growth**: `floor(surplus_food / 3)`
- **Raid Cost**: 4 food per fighter
- **Fighter Levels**: 1-5, gain XP from training or combat

See `/game_rules/sean_4ex_rules.md` for complete rules.

### UI/UX Terminology
- **Room Code**: 6-character unique identifier for game rooms
- **Lobby**: Pre-game waiting area where players gather
- **Game Board**: PixiJS-rendered game state visualization
- **HUD**: Heads-up display showing player stats, resources, turn phase
- **Action Panel**: UI for assigning jobs and making decisions

## Important Constraints

### Technical Constraints
- **SQLite Database**: Local file-based database for simplicity
  - Single-file database (easy backup/restore)
  - No separate database server required
  - Sufficient for moderate concurrent users
  - Consider PostgreSQL for scaling in future
- **Single Server**: No distributed deployment initially
- **Browser Compatibility**: Modern browsers only (ES2020+, WebGL support)
- **Network**: Assumes stable connection (no offline mode)

### Business Constraints
- **Solo Development**: Optimize for single developer workflow
- **Educational Project**: Built with an 8-year-old collaborator
- **No Monetization**: Free to play, no ads or payments
- **No User Data**: Privacy-first, no personal data collected

### Design Constraints
- **PixiJS for Game**: Must use PixiJS for game rendering (requirement)
- **Mantine for UI**: Must use Mantine for standard UI components
- **GraphQL Communication**: Backend-frontend communication via GraphQL only
- **No Auth**: Intentionally no user authentication or sessions

### Performance Targets
- **Room Creation**: < 500ms response time (including DB write)
- **Turn Execution**: < 1s to process and update all clients (including DB write)
- **Game Load**: < 3s from room join to game board visible
- **Concurrent Rooms**: Support 50+ simultaneous game rooms
- **Database**: SQLite sufficient for ~100 concurrent connections

## External Dependencies

### Core Libraries

#### Backend
- **FastAPI**: Web framework ([docs](https://fastapi.tiangolo.com/))
- **Strawberry GraphQL**: GraphQL server ([docs](https://strawberry.rocks/))
- **SQLAlchemy**: SQL toolkit and ORM ([docs](https://www.sqlalchemy.org/))
- **SQLite**: Embedded database ([docs](https://www.sqlite.org/))
- **Uvicorn**: ASGI server ([docs](https://www.uvicorn.org/))
- **uv**: Package manager ([docs](https://docs.astral.sh/uv/))

#### Frontend
- **React**: UI framework ([docs](https://react.dev/))
- **Mantine**: Component library ([docs](https://mantine.dev/))
- **PixiJS**: Game rendering engine ([docs](https://pixijs.com/))
- **Relay**: GraphQL client ([docs](https://relay.dev/))
- **Vite**: Build tool ([docs](https://vitejs.dev/))

### Development Tools
- **Tabler Icons**: Icon library for Mantine ([icons](https://tabler.io/icons))
- **pnpm**: Frontend package manager ([docs](https://pnpm.io/))

### Database Schema

The application uses SQLAlchemy ORM to manage database entities. Key models include:

- **Room**: Game rooms with unique codes, player count, game state
- **Player**: Player information (nickname, room association)
- **GameState**: Serialized game state for each active game
- **GameHistory**: (Future) Historical game records

Example model pattern (see `/todo.md` for SQLAlchemy usage example):
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Room(Base):
    __tablename__ = 'rooms'
    
    id = Column(Integer, primary_key=True)
    code = Column(String(6), unique=True, nullable=False)
    game_type = Column(String(50), nullable=False)
    status = Column(String(20), default='waiting')
    # ... additional fields
```

### No External Services (Currently)
- ❌ No authentication service
- ❌ No cloud database (using local SQLite)
- ❌ No cloud storage
- ❌ No analytics
- ❌ No CDN

### Future Considerations
- **WebSocket/Server-Sent Events**: For real-time game updates
- **PostgreSQL**: For scaling to more concurrent users
- **Redis**: For caching and session management
- **Docker**: For easier deployment

## File Structure

```
sean_4ex_game/
├── api/                      # Backend (Python)
│   ├── main.py              # FastAPI + Strawberry GraphQL server
│   ├── models.py            # SQLAlchemy database models
│   ├── database.py          # Database configuration and session
│   ├── game_state.db        # SQLite database file (gitignored)
│   ├── pyproject.toml       # Python dependencies (uv)
│   ├── uv.lock              # Lock file
│   └── .python-version      # Python version (3.12)
├── frontend/                # Frontend (React)
│   ├── src/
│   │   ├── main.tsx         # Entry point
│   │   ├── App.tsx          # Root component
│   │   ├── FilmList.tsx     # Example component
│   │   └── graphql_schema/  # GraphQL schemas
│   ├── package.json         # Frontend dependencies
│   ├── pnpm-lock.yaml       # Lock file
│   ├── vite.config.ts       # Vite configuration
│   └── relay.config.json    # Relay compiler config
├── game_rules/              # Game design documents
│   └── sean_4ex_rules.md    # Complete game rules
├── openspec/                # Project documentation
│   ├── project.md           # This file
│   └── AGENTS.md            # AI assistant guidelines
└── readme.md                # Setup and development guide
```

## Quick Start Reference

```bash
# Backend (from api/)
uv sync                                    # Install dependencies
uv run uvicorn main:app --reload --port 9000

# Frontend (from frontend/)
pnpm install                               # Install dependencies
pnpm dev                                   # Start dev server (port 5173)

# Sync GraphQL schema
cd api && uv run strawberry export-schema main > ../frontend/src/graphql_schema/local_schema.graphql
cd ../frontend && pnpm relay

# Production build
cd frontend && pnpm build                  # Build static files to dist/
cd ../api && uv run uvicorn main:app --host 0.0.0.0 --port 9000  # Serve all
```

## Notes for AI Assistants

- Always respond in English
- This project uses modern package managers (uv, pnpm) - use these, not pip/npm
- Game rules are complex - refer to `/game_rules/sean_4ex_rules.md` for mechanics
- Prefer Mantine components and props over raw HTML/CSS
- Use TypeScript for all frontend code
- Use type hints for all Python backend code
- GraphQL schema changes require regenerating frontend types
- Use SQLAlchemy for all database operations (see `/todo.md` for examples)
- Database models should be separate from GraphQL types
- Use proper session management for database transactions
