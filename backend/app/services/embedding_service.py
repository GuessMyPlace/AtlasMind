import structlog

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

embedding_service = EmbeddingService()