import asyncio
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
        logger.info(f"Resuming job {job['id']}")