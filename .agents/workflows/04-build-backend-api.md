# Workflow: Build the FastAPI backend

**Prerequisite**: risk model (Workflow 02) and RAG index (Workflow 03) exist.

## Endpoints to build in `backend/app/api/`
1. `GET /api/risk?state=&sector=` → calls `ml/infer.predict_risk`, returns
   `{ state, sector, risk_label, explanation, data_confidence }`. `data_confidence`
   must reflect the model card's known-limitation notes (e.g. "low" for sparse states) —
   never silently return a confident-sounding number for a state with thin data.
2. `POST /api/rights` with `{ query, state?, language }` → calls
   `rag/retrieve` + `rag/generate`, returns `{ answer, citations: [...],
   disclaimer, language }`. `disclaimer` is always populated with the fixed
   "educational information, not legal advice" text — never omit it.
3. `GET /api/resources?state=` → static/curated lookup (not RAG) returning grievance
   channel contact info for that state from `rag_store/corpus/grievance_channels/`.
4. `GET /api/health` → basic liveness check for deployment.

## Rules
- Pydantic schemas for every request/response in `backend/app/api/schemas.py`.
- No endpoint persists user-entered free text beyond the request unless an explicit
  opt-in flag is set (see AGENTS.md privacy rules) — if you add that opt-in path later,
  it needs its own explicit workflow and consent UI, don't add silent logging as a
  side-effect of building this.
- CORS configured for the frontend's local dev origin and eventual deployed origin only.

## Definition of done
- `uvicorn backend.app.main:app --reload` serves all four endpoints.
- `backend/tests/` has a passing happy-path test per endpoint.
- OpenAPI docs at `/docs` render cleanly with example request/response bodies.
