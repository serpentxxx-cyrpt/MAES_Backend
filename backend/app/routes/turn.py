"""
Turn Route (Phase 3): SSE Streaming + RAG + CCLI + GCD
Components: 3 (RAG retrieval), 4 (CLS injection), 5 (SSE streaming), 7 (GCD background)
"""
import json
import asyncio
import logging
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from groq import AsyncGroq

from app.db.models import TurnRequest
from app.db.upstash_client import get_session_context, set_session_context
from app.db.supabase_client import save_message, get_supabase
from app.db.neon_client import log_audit_entry
from app.agents.orchestrator import graph
from app.middleware.auth import get_current_user
from app.middleware.sanitizer import sanitize_student_input, wrap_for_llm
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/")
async def process_turn(
    req: TurnRequest,
    bg_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Phase 3: Streaming SSE endpoint for a tutoring turn.
    Yields:
      event: status  — agent thinking indicators
      event: token   — streaming tokens of final hint
      event: dvs     — SVG visual scaffold (if triggered)
      event: done    — final bloom_tag, register, peer_challenge flag
    """
    context = await get_session_context(req.session_id)
    if not context:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
        
    if context.get("student_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session.")

    history = context.get("history", [])
    clean_message = sanitize_student_input(req.student_message)
    safe_message = wrap_for_llm(clean_message)

    # Fetch active misconception for Agent P seeding
    from app.services.gcd_service import get_active_misconception
    active_misconception = await get_active_misconception(user["user_id"])

    # --- Phase 3 Component 3: Semantic RAG retrieval ---
    notebook_id = context.get("notebook_id")
    active_sources = None
    
    if notebook_id:
        try:
            from app.services.embedding_service import retrieve_relevant_chunks
            chunks = retrieve_relevant_chunks(req.student_message, notebook_id, top_k=5)
            if chunks:
                active_sources = "\n\n".join([f"[Chunk {i+1}]\n{c}" for i, c in enumerate(chunks)])
                logger.info(f"[TURN] Retrieved {len(chunks)} RAG chunks for notebook {notebook_id}")
            else:
                # Fallback: dump raw_content if embeddings not yet generated
                sb = get_supabase()
                if sb:
                    def fetch_sources():
                        return sb.table("sources").select("title, raw_content").eq("notebook_id", notebook_id).eq("is_active", True).execute()
                    res = await asyncio.to_thread(fetch_sources)
                    if res.data:
                        blocks = [f"--- SOURCE: {r['title']} ---\n{r.get('raw_content','')}" for r in res.data]
                        active_sources = "\n\n".join(blocks)[:50000]
        except Exception as e:
            logger.error(f"[TURN] RAG retrieval failed: {e}")

    initial_state = {
        "session_id": req.session_id,
        "student_id": context.get("student_id"),
        "student_message": safe_message,
        "learner_model": context.get("learner_model", {}),
        "current_register": context.get("current_register", "socratic"),
        "turn_number": context.get("turn_number", 1),
        "dialogue_history": history,
        "agent_a_draft": None,
        "agent_b_result": None,
        "agent_b_signal": None,
        "loop_count": 0,
        # Phase 3 CCLI
        "chronometric_load_score": req.chronometric_load_score,
        "bloom_stall_count": context.get("bloom_stall_count", 0),
        "active_misconception": active_misconception,
        "dvs_payload": None,
        "peer_challenge": False,
        "active_sources": active_sources,
        "audit_logs_to_dispatch": []
    }

    # Save student message to Supabase
    await asyncio.to_thread(save_message, req.session_id, "student", req.student_message)

    async def event_generator():
        try:
            # Status: Agent A thinking
            yield f"event: status\ndata: {json.dumps({'msg': 'Agent A is composing a response...'})}\n\n"
            
            # Run orchestrator graph
            final_state = await graph.ainvoke(initial_state)
            
            # Status: streaming hint
            yield f"event: status\ndata: {json.dumps({'msg': 'Streaming response...'})}\n\n"

            hint = (final_state.get("agent_a_draft") or {}).get("hint_text", "I'm not sure how to respond.")
            bloom = (final_state.get("agent_b_result") or {}).get("bloom_tag_student", "remember")
            new_register = (final_state.get("agent_b_result") or {}).get("register_switch") or context.get("current_register", "socratic")
            dvs_payload = final_state.get("dvs_payload")
            peer_challenge = final_state.get("peer_challenge", False)

            # Phase 3 Component 5: Stream the hint word-by-word via Groq
            try:
                groq_client = AsyncGroq(api_key=settings.groq_api_key)
                stream = await groq_client.chat.completions.create(
                    model=settings.agent_a_model,
                    messages=[
                        {"role": "system", "content": "Restate the following hint clearly and naturally for a student. Do not change the meaning. Output plain text only, no JSON."},
                        {"role": "user", "content": hint}
                    ],
                    temperature=0.3,
                    max_tokens=600,
                    stream=True
                )
                streamed_hint = ""
                async for chunk in stream:
                    token = chunk.choices[0].delta.content or ""
                    if token:
                        streamed_hint += token
                        yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"
                
                # Use streamed version as the saved hint
                hint = streamed_hint if streamed_hint else hint
            except Exception as e:
                logger.error(f"[TURN] Groq streaming failed, falling back to non-streamed: {e}")
                # Fallback: send hint as single token
                yield f"event: token\ndata: {json.dumps({'token': hint})}\n\n"

            # Send DVS payload if triggered
            if dvs_payload:
                yield f"event: dvs\ndata: {json.dumps({'svg': dvs_payload})}\n\n"

            # Save tutor hint to Supabase
            await asyncio.to_thread(save_message, req.session_id, "tutor", hint)

            # Dispatch audit logs
            logs = final_state.get("audit_logs_to_dispatch", [])
            for log in logs:
                bg_tasks.add_task(log_audit_entry, **log)

            # Log pedagogy metrics to Neon
            from app.db.neon_client import get_neon_pool
            try:
                pool = get_neon_pool()
                async with pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO pedagogy_metrics (session_id, student_id, turn_number, cls_score, bloom_stall_count, active_misconception)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                        req.session_id,
                        context.get("student_id", ""),
                        context.get("turn_number", 1),
                        req.chronometric_load_score,
                        context.get("bloom_stall_count", 0),
                        active_misconception
                    )
            except Exception as e:
                logger.error(f"[TURN] Failed to log pedagogy_metrics: {e}")

            # GCD background misconception detection
            bg_tasks.add_task(
                _detect_misconception_bg,
                req.session_id,
                context.get("student_id", ""),
                req.student_message,
                bloom
            )

            # Update context
            history.append({"role": "student", "text": req.student_message})
            history.append({"role": "tutor", "text": hint, "bloom_tag": bloom})
            context["history"] = history
            context["turn_number"] = context.get("turn_number", 1) + 1
            context["current_register"] = new_register
            
            # Track bloom stall: same bloom level → increment, different → reset
            prev_bloom = context.get("last_bloom_tag")
            if prev_bloom and prev_bloom == bloom:
                context["bloom_stall_count"] = context.get("bloom_stall_count", 0) + 1
            else:
                context["bloom_stall_count"] = 0
            context["last_bloom_tag"] = bloom
            
            await set_session_context(req.session_id, context)

            # Done signal
            yield f"event: done\ndata: {json.dumps({'bloom_tag': bloom, 'register': new_register, 'peer_challenge': peer_challenge, 'dvs_triggered': dvs_payload is not None})}\n\n"

        except Exception as e:
            logger.error(f"[TURN] Graph execution error: {e}")
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no"
    })


async def _detect_misconception_bg(session_id: str, student_id: str, message: str, bloom_tag: str):
    """Helper to call GCD service as a background task."""
    try:
        from app.services.gcd_service import detect_and_log_misconception
        await detect_and_log_misconception(session_id, student_id, message, bloom_tag)
    except Exception as e:
        logger.error(f"[TURN-BG] GCD detection failed: {e}")
