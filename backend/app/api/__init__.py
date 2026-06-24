from fastapi import APIRouter
from .generate import router as generate_router
from .jobs import router as jobs_router
from .roadmap import router as roadmap_router
from .quota import router as quota_router
from .health import router as health_router

router = APIRouter()

router.include_router(health_router, prefix="", tags=["health"])
router.include_router(generate_router, prefix="/api/generate", tags=["generate"])
router.include_router(jobs_router, prefix="/api/jobs", tags=["jobs"])
router.include_router(roadmap_router, prefix="/api/roadmap", tags=["roadmap"])
router.include_router(quota_router, prefix="/api/quota", tags=["quota"])