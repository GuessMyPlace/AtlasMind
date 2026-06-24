from apscheduler.schedulers.asyncio import AsyncIOScheduler
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
        asyncio.create_task(run_pipeline(job.get('id'), job.get('names_input', []), job.get('place_type'), job.get('generate_questions', False)))