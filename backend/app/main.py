"""FireChronicle FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.api.routes import router
from backend.app.services.pipeline import pipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown logic."""
    # Initialize default sample data on startup
    pipeline.initialize_default_sample_data()
    yield


app = FastAPI(
    title="FireChronicle API",
    description="Harmonization of MODIS and VIIRS Hot Spots into an interpretable burning activity calendar.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend client
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/")
def read_root():
    return {
        "title": "FireChronicle API",
        "status": "operational",
        "mode": settings.active_mode,
        "docs_url": "/docs",
        "health_url": "/api/health",
        "calendar_url": "/api/calendar",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main.py:app", host=settings.host, port=settings.port, reload=True)
