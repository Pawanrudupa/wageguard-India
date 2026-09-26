"""WageGuard India (वेतन रक्षक) — FastAPI Backend Application.

Wires together the state/sector wage risk model, the grounded legal rights
assistant (RAG), and curated government grievance resources.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.analytics import get_analytics_summary
from backend.app.api.resources import router as resources_router
from backend.app.api.rights import router as rights_router
from backend.app.api.risk import router as risk_router
from backend.app.api.schemas import AnalyticsResponse, HealthResponse
from backend.app.api.stats import router as stats_router

app = FastAPI(
    title="WageGuard India API (वेतन रक्षक)",
    description=(
        "State/sector wage-theft risk prediction model combined with a "
        "retrieval-augmented legal rights assistant grounded in Indian labour law.\n\n"
        "**Core Mandates:**\n"
        "- Zero server-side persistence of user complaint text or employer names.\n"
        "- Non-accusatory educational information with visible disclaimers.\n"
        "- Traceable statutory citations across all rights responses.\n"
        "- Real-time SSE streaming for grounded rights navigation."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration: Allow local Vite dev server, common frontend preview ports, and local LAN WiFi origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Register resource routers
app.include_router(risk_router)
app.include_router(rights_router)
app.include_router(resources_router)
app.include_router(stats_router)


@app.get("/api/health", response_model=HealthResponse, tags=["Health & Status"], summary="Service Liveness Probe")
def health_check() -> HealthResponse:
    """Verify backend service health, ML model availability, and vector index readiness."""
    repo_root = Path(__file__).resolve().parents[2]
    model_path = repo_root / "models" / "risk_model.pkl"
    chroma_path = repo_root / "rag_store" / "index" / "chroma.sqlite3"

    model_ready = model_path.exists()
    index_ready = chroma_path.exists()

    return HealthResponse(
        status="ok",
        version="0.1.0",
        model_loaded=model_ready,
        vector_store_ready=index_ready,
    )


@app.get(
    "/api/analytics",
    response_model=AnalyticsResponse,
    tags=["System Statistics"],
    summary="Anonymous Aggregate Analytics Overview",
)
def get_analytics() -> AnalyticsResponse:
    """Return aggregated anonymous request counters for state and sector lookups.

    Privacy Compliance (AGENTS.md):
    - No user IDs, no IP addresses, no timestamp-per-user tracking.
    - No complaint or query text is ever stored.
    """
    summary = get_analytics_summary()
    return AnalyticsResponse(
        total_risk_inquiries=summary["total_risk_inquiries"],
        total_rights_inquiries=summary["total_rights_inquiries"],
        aggregate_counters=summary["aggregate_counters"],
    )
