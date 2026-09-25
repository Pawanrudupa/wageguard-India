"""WageGuard India — FastAPI entrypoint.

Wires together the risk-model API and the RAG rights-assistant API.
See .agents/workflows/04-build-backend-api.md for what to build here.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="WageGuard India API",
    description="State/sector wage-theft risk + grounded labour-rights assistant.",
    version="0.1.0",
)

# TODO: restrict allow_origins to the actual frontend dev/deployed URLs before shipping
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


# TODO (Workflow 04): include routers once built
# from app.api import risk, rights, resources
# app.include_router(risk.router)
# app.include_router(rights.router)
# app.include_router(resources.router)
