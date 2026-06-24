from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.services.pipeline import run_pipeline
import uuid

router = APIRouter()

class GenerateCheckRequest(BaseModel):
    names: list[str]

class GenerateStartRequest(BaseModel):
    job_name: Optional[str] = None
    names: list[str]
    place_type: Optional[str] = None
    generate_questions: bool = True
    schedule_for: Optional[str] = None

@router.post("/check")
async def check_duplicates(req: GenerateCheckRequest):
    results = {}
    for name in req.names:
        results[name] = {"exists": False, "place_id": None, "similar_to": None}
    return {"results": results}

@router.post("/start")
async def start_generation(req: GenerateStartRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    
    if not req.schedule_for:
        background_tasks.add_task(
            run_pipeline, 
            job_id, 
            req.names, 
            req.place_type, 
            req.generate_questions
        )
        status = "running"
    else:
        status = "pending"
        
    return {"job_id": job_id, "message": "Generation started", "status": status}

@router.get("/queue")
async def get_queue():
    return {"places": [], "total": 0}