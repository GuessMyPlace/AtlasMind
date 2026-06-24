from pydantic import BaseModel
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

quota_manager = QuotaManager()