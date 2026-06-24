from fastapi import APIRouter
from typing import Optional
import uuid

router = APIRouter()

@router.get("/")
async def get_roadmap():
    return {
        "phases": [],
        "summary": {"completed": 0, "in_progress": 0, "pending": 0}
    }

@router.post("/{id}/start")
async def start_roadmap_phase(id: str):
    job_id = str(uuid.uuid4())
    return {"job_id": job_id, "message": "Phase started"}