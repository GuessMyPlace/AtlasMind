from fastapi import APIRouter
from app.services.quota_manager import quota_manager

router = APIRouter()

@router.get("/today")
async def get_today_quota():
    return quota_manager.get_today_quota()