import google.generativeai as genai
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

gemini_service = GeminiService()