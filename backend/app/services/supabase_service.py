from supabase import create_client, Client
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

supabase_service = SupabaseService()