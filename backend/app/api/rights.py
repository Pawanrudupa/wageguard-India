"""FastAPI router for grounded legal rights retrieval and educational guidance with SSE streaming."""

import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from backend.app.api.analytics import record_rights_call
from backend.app.api.limiter import RateLimiter
from backend.app.api.schemas import (
    CitationSchema,
    LedgerProvisionsResponse,
    RightsRequest,
    RightsResponse,
)
from backend.app.ml.infer import predict_risk
from backend.app.rag.generate import generate_grounded_answer, stream_grounded_answer
from backend.app.rag.retrieve import retrieve_chunks

logger = logging.getLogger("wageguard.rights")
router = APIRouter(prefix="/api/rights", tags=["Rights Assistant"])

# Rate limit: 20 requests per minute per IP for rights queries
rights_limiter = RateLimiter(times=20, seconds=60)


@router.post(
    "",
    response_model=RightsResponse,
    dependencies=[Depends(rights_limiter)],
    summary="Query Legal Rights Assistant (Supports JSON & SSE Streaming)",
)
async def ask_rights_assistant(
    request: RightsRequest,
    raw_request: Request,
) -> Any:
    """Retrieve grounded statutory legal citations and answer labour law inquiries.

    Supports dual modes:
    - Standard JSON response (default or when Accept: application/json)
    - Server-Sent Events (SSE) streaming (when request.stream=True or Accept: text/event-stream)

    Privacy Notice (AGENTS.md):
    - User query text is never persisted server-side beyond the request lifecycle.
    - Application logs record request metadata only (length, language, state), NEVER raw query text.
    - Answers are educational and non-accusatory.
    """
    clean_query = request.query.strip()
    if not clean_query:
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")

    # Privacy enforcement: Log metadata only, never raw freeform complaint text
    logger.info(
        "Processing rights request: state=%s, lang=%s, query_len=%d",
        request.state or "unspecified",
        request.language,
        len(clean_query),
    )

    # Anonymous aggregate-only tally (AGENTS.md: state tally only, no query text or user tracking)
    record_rights_call(request.state)

    accept_header = raw_request.headers.get("accept", "")
    wants_streaming = request.stream or "text/event-stream" in accept_header

    if wants_streaming:
        async def event_generator():
            try:
                events = stream_grounded_answer(
                    query=clean_query,
                    state=request.state,
                    language=request.language,
                )
                for item in events:
                    event_type = item.get("event", "message")
                    data_str = json.dumps(item)
                    yield f"event: {event_type}\ndata: {data_str}\n\n"
                    if event_type == "token":
                        # 12ms pacing for crisp, smooth typing rhythm
                        await asyncio.sleep(0.012)
            except Exception as exc:
                logger.error("SSE streaming error: %s", exc)
                error_payload = json.dumps({"event": "error", "detail": "Generation failed."})
                yield f"event: error\ndata: {error_payload}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    # Standard JSON return mode
    try:
        grounded_result = generate_grounded_answer(
            query=clean_query,
            state=request.state,
            language=request.language,
        )

        citation_schemas = [
            CitationSchema(
                source_file=c.source_file,
                act_name=c.act_name,
                section_or_clause=c.section_or_clause,
                section_title=c.section_title,
                state=c.state or "",
                valid_as_of_date=c.valid_as_of_date,
            )
            for c in grounded_result.citations
        ]

        return RightsResponse(
            answer=grounded_result.answer,
            citations=citation_schemas,
            disclaimer=grounded_result.disclaimer,
            language=grounded_result.language,
            grounded=grounded_result.grounded,
            next_steps=grounded_result.next_steps,
        )
    except Exception as exc:
        logger.error("Error generating rights response: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate grounded rights response.",
        ) from exc


@router.get(
    "/provisions",
    response_model=LedgerProvisionsResponse,
    dependencies=[Depends(rights_limiter)],
    summary="Get Statutory Provisions & Citations for Ledger Evidence Export",
)
def get_ledger_provisions(
    state: str = Query(
        "Maharashtra",
        description="Target State or UT name",
        examples=["Maharashtra"],
    ),
) -> LedgerProvisionsResponse:
    """Retrieve grounded legal sections and minimum wage floor for auto-populating evidence PDF.

    Reuses retrieve_chunks to query Section 17(2), Section 59, and Section 45
    without duplicating corpus data into the client-side ledger module.
    Zero worker personal information is accepted or logged by this endpoint.
    """
    clean_state = state.strip()

    # Retrieve Section 17, 59, 45 from the central acts corpus
    chunks = retrieve_chunks(
        query="Code on Wages 2019 Section 17 time limit Section 59 burden of proof Section 45 claims limitation",
        state=clean_state,
        top_k=4,
    )

    citations = [
        CitationSchema(
            source_file=c["metadata"]["source_file"],
            act_name=c["metadata"]["act_name"],
            section_or_clause=c["metadata"]["section_or_clause"],
            section_title=c["metadata"].get("section_title"),
            state=c["metadata"].get("state", ""),
            valid_as_of_date=c["metadata"].get("valid_as_of_date"),
        )
        for c in chunks
    ]

    # Retrieve state daily rate if available via predict_risk or default
    daily_rate = None
    try:
        risk_res = predict_risk(clean_state, "Construction")
        daily_rate = risk_res.current_min_wage_rate
    except Exception:
        daily_rate = 500.0

    sections_summary = {
        "Section 17(2)": "Mandatory final settlement of earned wages within 2 working days of resignation or dismissal.",
        "Section 59": "Statutory burden of proof placed on the employer to prove payment of dues and authorized deductions.",
        "Section 45(6)": "Unified 3-year limitation period from the date claim arises to file before the adjudicating authority.",
    }

    return LedgerProvisionsResponse(
        state=clean_state,
        citations=citations,
        daily_min_wage_rate=daily_rate,
        sections_summary=sections_summary,
        disclaimer="Prepared by worker as educational documentation under the Code on Wages, 2019; not legal representation.",
    )
