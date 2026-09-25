"""FastAPI router for grounded legal rights retrieval and educational guidance."""

import logging

from fastapi import APIRouter, HTTPException

from backend.app.api.schemas import CitationSchema, RightsRequest, RightsResponse
from backend.app.rag.generate import generate_grounded_answer

logger = logging.getLogger("wageguard.rights")
router = APIRouter(prefix="/api/rights", tags=["Rights Assistant"])


@router.post("", response_model=RightsResponse, summary="Query Legal Rights Assistant")
def ask_rights_assistant(request: RightsRequest) -> RightsResponse:
    """Retrieve grounded statutory legal citations and answer labour law inquiries.

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
