import strawberry
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from strawberry.fastapi import GraphQLRouter

from mutations import MyAPIMutation
from init_db import init_database
from graphql_types import RoomType
from models import Room
from database import get_db
from sqlalchemy.orm import joinedload

@strawberry.type
class MyAPIQuery:
    @strawberry.field
    def ping(self, message: str) -> str:
        return f"Ack: {message}"
    
    @strawberry.field
    def room_by_code(self, code: str) -> Optional[RoomType]:
        """
        Query a room by its code.
        
        Args:
            code: The 6-character room code
            
        Returns:
            RoomType if found, None otherwise
        """
        with get_db() as session:
            # Eager load relationships to avoid lazy loading issues
            room = session.query(Room).options(
                joinedload(Room.creator),
                joinedload(Room.players)
            ).filter_by(code=code).first()
            
            if room:
                return RoomType.from_db_model(room)
            return None



schema = strawberry.Schema(query=MyAPIQuery, mutation=MyAPIMutation)

graphql_app = GraphQLRouter(schema)

app = FastAPI()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on application startup."""
    init_database()

# Configure allowed origins from environment variable
# Default includes mattguo.com and all subdomains
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://mattguo.com,https://*.mattguo.com"
).split(",")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Production domains
    allow_origin_regex=r"https?://(localhost|192\.168\.\d+\.\d+):\d+",  # Local development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all request headers
)

# Build frontend path
frontend_dist_path = Path(__file__).parent.parent / "frontend" / "dist"

# If frontend is built, serve static files
if frontend_dist_path.exists():
    # Serve static files (JS, CSS, images, etc.)
    app.mount("/assets", StaticFiles(directory=frontend_dist_path / "assets"), name="assets")
    
    # Serve static files from root path
    app.mount("/static", StaticFiles(directory=frontend_dist_path), name="static")
    
    # Handle all other routes, return index.html (for React Router)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Check if file exists
        file_path = frontend_dist_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # Otherwise return index.html (for SPA routing)
        return FileResponse(frontend_dist_path / "index.html")
else:
    # If frontend is not built, provide hint message
    @app.get("/")
    async def root():
        return {
            "message": "Backend API is running. Please build the frontend first with 'npm run build' in the frontend directory.",
            "graphql_endpoint": "/graphql"
        }

# Add GraphQL router last to ensure it's not intercepted by wildcard route
app.include_router(graphql_app, prefix="/graphql")