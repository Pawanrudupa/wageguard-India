"""FastAPI router for state and sector wage-law irregularity risk predictions."""

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.app.api.analytics import record_risk_call
from backend.app.api.limiter import RateLimiter
from backend.app.api.schemas import RiskResponse
from backend.app.ml.infer import predict_risk

router = APIRouter(prefix="/api/risk", tags=["Risk Assessment"])

# Rate limit: 60 requests per minute per IP for risk calculation
risk_limiter = RateLimiter(times=60, seconds=60)


@router.get(
    "",
    response_model=RiskResponse,
    dependencies=[Depends(risk_limiter)],
    summary="Get Wage Irregularity Risk Context",
)
def get_risk_assessment(
    state: str = Query(
        ...,
        min_length=2,
        description="Indian State or Union Territory (e.g., 'Maharashtra', 'Delhi', 'Karnataka')",
        examples=["Maharashtra"],
    ),
    sector: str = Query(
        ...,
        min_length=2,
        description="Economic Sector (e.g., 'Construction', 'Retail & Commercial', 'Manufacturing & Factories')",
        examples=["Construction"],
    ),
) -> RiskResponse:
    """Predict state-sector wage-theft irregularity risk level and data confidence.

    Returns high/medium/low risk classification based on government enforcement records,
    along with data confidence reflecting inspection reporting density.
    """
    clean_state = state.strip()
    clean_sector = sector.strip()

    if not clean_state or not clean_sector:
        raise HTTPException(
            status_code=400,
            detail="Both 'state' and 'sector' query parameters must be non-empty strings.",
        )

    # Anonymous aggregate-only tally (AGENTS.md: state+sector combo count only, no user tracking)
    record_risk_call(clean_state, clean_sector)

    try:
        result = predict_risk(state=clean_state, sector=clean_sector)
        return RiskResponse(
            state=result.state,
            sector=result.sector,
            risk_label=result.risk_label,
            explanation=result.explanation,
            data_confidence=result.data_confidence,
            irregularity_rate=result.irregularity_rate,
            current_min_wage_rate=result.current_min_wage_rate,
            probabilities=result.probabilities,
            inference_time_ms=result.inference_time_ms,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Risk inference failed: {exc}") from exc
