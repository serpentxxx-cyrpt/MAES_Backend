"""
Embedding Service (Component 3): RAG Pipeline
Blueprint: 512-token chunking, Gemini text-embedding-004, pgvector storage, semantic retrieval.
LLM: Gemini text-embedding-004 (approved for non-chat embedding tasks)
"""
import logging
import asyncio
from google import genai
from google.genai import types
from app.config import settings
from app.db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

gemini_client = genai.Client(api_key=settings.gemini_api_key)

CHUNK_SIZE = 512       # target words per chunk
CHUNK_OVERLAP = 64     # overlap words between chunks
EMBED_BATCH_SIZE = 100 # Gemini embedding API batch limit


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Splits text into word-boundary-aware chunks with overlap.
    Returns a list of chunk strings.
    """
    words = text.split()
    if not words:
        return []
    
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end >= len(words):
            break
        start += chunk_size - overlap  # slide forward with overlap
    
    return chunks


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """
    Generates 768-dim embeddings using Gemini text-embedding-004.
    Batches requests in groups of EMBED_BATCH_SIZE to stay within limits.
    Returns a list of embedding vectors.
    """
    all_embeddings = []
    
    for i in range(0, len(chunks), EMBED_BATCH_SIZE):
        batch = chunks[i:i + EMBED_BATCH_SIZE]
        try:
            result = gemini_client.models.embed_content(
                model="models/text-embedding-004",
                contents=batch,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
            )
            for emb in result.embeddings:
                all_embeddings.append(emb.values)
        except Exception as e:
            logger.error(f"[EMBEDDING] Failed to embed batch {i//EMBED_BATCH_SIZE}: {e}")
            all_embeddings.extend([[0.0] * 768] * len(batch))
    
    return all_embeddings


def store_embeddings(source_id: str, notebook_id: str, chunks: list[str], embeddings: list[list[float]]) -> None:
    """
    Bulk inserts chunk-embedding pairs into Supabase document_embeddings table.
    """
    sb = get_supabase()
    if not sb:
        logger.error("[EMBEDDING] Supabase client unavailable — embeddings not stored.")
        return
    
    rows = []
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        rows.append({
            "source_id": source_id,
            "notebook_id": notebook_id,
            "chunk_index": idx,
            "content": chunk,
            "embedding": embedding  # Supabase pgvector accepts Python list
        })
    
    try:
        # Insert in batches of 50 to avoid request size limits
        for i in range(0, len(rows), 50):
            sb.table("document_embeddings").insert(rows[i:i+50]).execute()
        logger.info(f"[EMBEDDING] Stored {len(rows)} chunks for source {source_id}")
    except Exception as e:
        logger.error(f"[EMBEDDING] Failed to store embeddings: {e}")


def retrieve_relevant_chunks(query: str, notebook_id: str, top_k: int = 5) -> list[str]:
    """
    Embeds the query and fetches top-K semantically similar chunks via Supabase RPC.
    Returns a list of chunk strings.
    """
    sb = get_supabase()
    if not sb:
        logger.warning("[EMBEDDING] Supabase client unavailable — falling back to empty context.")
        return []
    
    try:
        # Embed the query
        result = gemini_client.models.embed_content(
            model="models/text-embedding-004",
            contents=query,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
        )
        query_embedding = result.embeddings[0].values
        
        # Call Supabase stored procedure
        response = sb.rpc("match_documents", {
            "query_embedding": query_embedding,
            "match_notebook_id": notebook_id,
            "match_count": top_k
        }).execute()
        
        if response.data:
            return [row["content"] for row in response.data]
        return []
    
    except Exception as e:
        logger.error(f"[EMBEDDING] Retrieval failed: {e}")
        return []


def process_source(source_id: str, notebook_id: str, text: str) -> None:
    """
    Orchestrates full RAG pipeline: chunk → embed → store.
    Designed to be called as a FastAPI BackgroundTask.
    """
    if not text or not text.strip():
        logger.warning(f"[EMBEDDING] Source {source_id} has empty text — skipping.")
        return
    
    logger.info(f"[EMBEDDING] Processing source {source_id} ({len(text)} chars)...")
    chunks = chunk_text(text)
    logger.info(f"[EMBEDDING] Created {len(chunks)} chunks.")
    embeddings = embed_chunks(chunks)
    store_embeddings(source_id, notebook_id, chunks, embeddings)
    logger.info(f"[EMBEDDING] Source {source_id} fully embedded and stored.")
