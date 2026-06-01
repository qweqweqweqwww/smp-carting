"""
Application factory and startup/shutdown lifecycle.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import init_db

# REST routers
from app.api.routes import races, users, incidents, audio, export

# WebSocket routers
from app.api.ws import marshal_ws, role_ws

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    await init_db()
    settings.AUDIO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Database ready. Audio storage: %s", settings.AUDIO_STORAGE_DIR.resolve())
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # CORS (all origins allowed on local Wi-Fi; tighten for internet-facing)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # REST routes
    app.include_router(races.router, prefix="/api/v1")
    app.include_router(users.router, prefix="/api/v1")
    app.include_router(incidents.router, prefix="/api/v1")
    app.include_router(audio.router, prefix="/api/v1")
    app.include_router(export.router, prefix="/api/v1")

    # WebSocket routes (no prefix — path is /ws/...)
    app.include_router(marshal_ws.router)
    app.include_router(role_ws.router)

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_app()
