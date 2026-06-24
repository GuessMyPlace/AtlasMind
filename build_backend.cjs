const fs = require('fs');
const path = require('path');

const files = {
  'backend/requirements.txt': `fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic-settings==2.3.0
supabase==2.5.3
redis[asyncio]==5.0.7
apscheduler==3.10.4
google-generativeai==0.7.2
sentence-transformers==3.0.1
numpy==1.26.4
python-dotenv==1.0.1
structlog==24.2.0
httpx==0.27.0`,
  'backend/Dockerfile': `FROM python:3.11-slim
ENV PORT=7860
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential libgomp1 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
COPY . .
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]`,
  'backend/main.py': `from fastapi import FastAPI
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
`,
  'backend/app/__init__.py': ``,
  'backend/app/api/__init__.py': `from fastapi import APIRouter
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
router.include_router(quota_router, prefix="/api/quota", tags=["quota"])`,
  'backend/app/api/health.py': `from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "AtlasMind Backend"}`,
  'backend/app/api/quota.py': `from fastapi import APIRouter
from app.services.quota_manager import quota_manager

router = APIRouter()

@router.get("/today")
async def get_today_quota():
    return quota_manager.get_today_quota()`,
  'backend/app/api/jobs.py': `from fastapi import APIRouter
from typing import Optional

router = APIRouter()

@router.get("/")
async def get_jobs(status: Optional[str] = None):
    return {"jobs": [], "total": 0}

@router.get("/{id}")
async def get_job(id: str):
    return {"id": id, "status": "running"}

@router.post("/{id}/pause")
async def pause_job(id: str):
    return {"id": id, "status": "paused"}

@router.post("/{id}/resume")
async def resume_job(id: str):
    return {"id": id, "status": "running"}

@router.post("/{id}/cancel")
async def cancel_job(id: str):
    return {"id": id, "status": "failed"}`,
  'backend/app/api/generate.py': `from fastapi import APIRouter, BackgroundTasks
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
    return {"places": [], "total": 0}`,
  'backend/app/api/roadmap.py': `from fastapi import APIRouter
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
    return {"job_id": job_id, "message": "Phase started"}`,
  'backend/app/core/__init__.py': ``,
  'backend/app/core/config.py': `from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    supabase_url: str = "https://example.supabase.co"
    supabase_service_role_key: str = "example_key"
    gemini_api_key: str = "example_key"
    gemini_model: str = "gemini-2.5-pro"
    redis_url: Optional[str] = "redis://localhost:6379"
    environment: str = "development"
    log_level: str = "INFO"
    gemini_daily_limit: int = 50
    guessmy_place_api: str = "https://Rafs-an09002-geoai-backend.hf.space"
    port: int = 7860

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()`,
  'backend/app/core/scheduler.py': `from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.quota_manager import quota_manager
from app.services.supabase_service import supabase_service
from app.services.pipeline import run_pipeline, resume_paused_jobs
import asyncio
import structlog

logger = structlog.get_logger(__name__)

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=0, minute=5)
async def daily_quota_reset():
    logger.info("Running daily quota reset")
    quota_manager.reset_if_new_day()
    await resume_paused_jobs()

@scheduler.scheduled_job('interval', minutes=5)
async def check_scheduled_jobs():
    logger.info("Checking for scheduled jobs")
    jobs = await supabase_service.get_due_scheduled_jobs()
    for job in jobs:
        asyncio.create_task(run_pipeline(job.get('id'), job.get('names_input', []), job.get('place_type'), job.get('generate_questions', False)))`,
  'backend/app/services/__init__.py': ``,
  'backend/app/services/supabase_service.py': `from supabase import create_client, Client
from app.core.config import settings
import structlog

logger = structlog.get_logger(__name__)

class SupabaseService:
    def __init__(self):
        try:
            self.client: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        except Exception as e:
            logger.warning("Failed to initialize Supabase client", error=str(e))
            self.client = None

    async def get_due_scheduled_jobs(self):
        return []

    async def upsert_place(self, data: dict, embedding: list[float] | None = None) -> str | None:
        return "dummy-place-id"

    async def get_job(self, job_id: str):
        return {"id": job_id, "status": "running"}

    async def update_job_status(self, job_id: str, status: str, error: str = None):
        logger.info(f"Updated job {job_id} to status: {status}", error=error)

    async def get_paused_jobs(self):
        return []

supabase_service = SupabaseService()`,
  'backend/app/services/quota_manager.py': `from pydantic import BaseModel
from app.core.config import settings
import structlog

logger = structlog.get_logger(__name__)

class QuotaStatus(BaseModel):
    requests_made: int
    requests_limit: int
    percentage: float
    quota_exceeded: bool

class QuotaManager:
    def __init__(self):
        self._requests_made = 0

    def get_today_quota(self) -> QuotaStatus:
        limit = settings.gemini_daily_limit
        made = self._requests_made
        pct = (made / limit * 100) if limit > 0 else 0
        return QuotaStatus(
            requests_made=made,
            requests_limit=limit,
            percentage=pct,
            quota_exceeded=made >= limit
        )

    def can_make_request(self) -> tuple[bool, str]:
        today = self.get_today_quota()
        if today.requests_made >= today.requests_limit:
            return False, f"Daily quota exceeded ({today.requests_made}/{today.requests_limit})"
        return True, ""

    def increment(self, tokens_used: int = 0):
        self._requests_made += 1
        logger.info("Quota incremented", requests_made=self._requests_made)

    def handle_quota_exceeded(self, job_id: str):
        logger.warning("Quota exceeded for job", job_id=job_id)

    def reset_if_new_day(self):
        self._requests_made = 0
        logger.info("Quota reset for new day")

quota_manager = QuotaManager()`,
  'backend/app/services/embedding_service.py': `import structlog

logger = structlog.get_logger(__name__)
try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    logger.warning("SentenceTransformer failed to load", error=str(e))
    model = None

class EmbeddingService:
    async def embed(self, data: dict) -> list[float] | None:
        if not model:
            return None
        text_to_embed = f"{data.get('name', '')} {data.get('description', '')}"
        try:
            return model.encode(text_to_embed).tolist()
        except Exception as e:
            logger.error("Failed to embed", error=str(e))
            return None

embedding_service = EmbeddingService()`,
  'backend/app/services/gemini_service.py': `import google.generativeai as genai
from app.core.config import settings
import structlog

logger = structlog.get_logger(__name__)

class GeminiService:
    def __init__(self):
        try:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(settings.gemini_model)
        except Exception as e:
            logger.warning("Failed to configure generative AI", error=str(e))
            self.model = None

    async def generate(self, name: str, place_type: str | None) -> dict:
        if not self.model:
            return {"name": name, "generated": True}
        
        prompt = f"Generate JSON structured data for {name}"
        if place_type:
            prompt += f" which is a {place_type}"
        return {"name": name, "generated": True}

gemini_service = GeminiService()`,
  'backend/app/services/question_gen.py': `from app.services.gemini_service import gemini_service
import structlog

logger = structlog.get_logger(__name__)

class QuestionGenService:
    async def generate(self, place_data: dict) -> int:
        logger.info("Generating questions for place", name=place_data.get('name'))
        return 10

question_gen = QuestionGenService()`,
  'backend/app/services/pipeline.py': `import asyncio
import structlog
from app.services.quota_manager import quota_manager
from app.services.gemini_service import gemini_service
from app.services.embedding_service import embedding_service
from app.services.supabase_service import supabase_service
from app.services.question_gen import question_gen

logger = structlog.get_logger(__name__)

async def validate_name(name: str):
    return len(name.strip()) > 0

async def is_duplicate(name: str):
    return False

async def log_result(job_id: str, name: str, status: str, **kwargs):
    logger.info("Result logged", job_id=job_id, name=name, status=status, **kwargs)

async def update_job_progress(job_id: str):
    logger.info("Job progress updated", job_id=job_id)

async def run_pipeline(
    job_id: str,
    names: list[str],
    place_type: str | None,
    generate_questions: bool,
) -> None:
    logger.info("Starting run_pipeline", job_id=job_id, count=len(names))
    for name in names:
        can, reason = quota_manager.can_make_request()
        if not can:
            await supabase_service.update_job_status(job_id, 'quota_exceeded', error=reason)
            return

        if not await validate_name(name):
            await log_result(job_id, name, 'failed', error='Invalid name')
            continue

        if await is_duplicate(name):
            await log_result(job_id, name, 'duplicate')
            continue

        data = None
        for attempt in range(3):
            try:
                data = await gemini_service.generate(name, place_type)
                quota_manager.increment()
                break
            except Exception as e:
                if '429' in str(e) or 'quota' in str(e).lower():
                    quota_manager.handle_quota_exceeded(job_id)
                    return
                if attempt == 2:
                    await log_result(job_id, name, 'failed', error=str(e))
                await asyncio.sleep(2 ** attempt)
        
        if not data:
            continue

        quality = 0.95
        if quality < 0.4:
            await log_result(job_id, name, 'low_quality', quality=quality)
            continue

        embedding = await embedding_service.embed(data)
        place_id = await supabase_service.upsert_place(data, embedding)

        q_count = 0
        if generate_questions and place_id:
            can, _ = quota_manager.can_make_request()
            if can:
                q_count = await question_gen.generate(data)
                quota_manager.increment()

        await log_result(job_id, name, 'inserted', place_id=place_id, quality=quality, questions_generated=q_count)
        await update_job_progress(job_id)

async def resume_paused_jobs():
    logger.info("Resuming paused jobs")
    jobs = await supabase_service.get_paused_jobs()
    for job in jobs:
        logger.info(f"Resuming job {job['id']}")`,
  'backend/app/utils/__init__.py': ``,
  'backend/app/utils/logger.py': `import structlog
import logging
import sys
from app.core.config import settings

def setup_logger():
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=settings.log_level.upper())
    structlog.configure(
        processors=[
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer() if settings.environment == "development" else structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

setup_logger()
logger = structlog.get_logger(__name__)`
};

for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim());
}
console.log('Backend built!');
