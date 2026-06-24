from app.services.gemini_service import gemini_service
import structlog

logger = structlog.get_logger(__name__)

class QuestionGenService:
    async def generate(self, place_data: dict) -> int:
        logger.info("Generating questions for place", name=place_data.get('name'))
        return 10

question_gen = QuestionGenService()