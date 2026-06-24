from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router
from app.core.config import settings
from app.core.scheduler import scheduler
import structlog
from contextlib import asynccontextmanager

logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AtlasMind backend scheduler...")
    scheduler.start()
    yield
    logger.info("Shutting down scheduler...")
    scheduler.shutdown()

app = FastAPI(title="AtlasMind Backend API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=(settings.environment == "development"))