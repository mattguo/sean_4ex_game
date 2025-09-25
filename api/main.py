import strawberry
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from strawberry.fastapi import GraphQLRouter

"""
Example query:
{
  ping(message: "Ciao")
  allFilms {
    films {
      id
      title
      director
    }
  },
}
"""

@strawberry.type
class Film:
    id: str
    title: str
    director: str

@strawberry.type
class FilmList:
    films: list[Film]

@strawberry.type
class MyAPIQuery:
    @strawberry.field
    def allFilms(self) -> FilmList:
        return FilmList(films=[
            Film(id="1", title="The Empire Strikes Back", director="Irvin Kershner"),
            Film(id="2", title="A New Hope", director="George Lucas"),
            Film(id="3", title="Return of the Jedi", director="Richard Marquand"),
            Film(id="4", title="The Phantom Menace", director="George Lucas"),
            Film(id="5", title="Attack of the Clones", director="George Lucas"),
            Film(id="6", title="Revenge of the Sith", director="George Lucas"),
            Film(id="7", title="The Force Awakens", director="J.J. Abrams"),
            Film(id="8", title="The Last Jedi", director="Rian Johnson"),
            Film(id="9", title="The Rise of Skywalker", director="J.J. Abrams"),
            Film(id="10", title="Rogue One", director="Gareth Edwards"),
            Film(id="11", title="Solo", director="Ron Howard")
        ])

    @strawberry.field
    def ping(self, message: str) -> str:
        return f"Ack: {message}"



schema = strawberry.Schema(MyAPIQuery)

graphql_app = GraphQLRouter(schema)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",  # Allow any localhost port
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