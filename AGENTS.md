# Agent Behavioral Rules — AGENTS.md

These rules govern HOW agents write code in this repo. See `GEMINI.md` for WHAT the
project is and WHY.

## General
- Prefer small, reviewable diffs. Don't restructure unrelated files in the same task.
- Every new module needs a one-line docstring explaining its purpose.
- Never invent a data value, statistic, or legal citation. If a number isn't in
  `data/processed/` or a source in `docs/DATA_SOURCES.md`, mark it `# TODO: source needed`
  instead of filling in a plausible-looking placeholder and leaving it unmarked.
- Whenever asked to commit changes, ALWAYS push immediately to GitHub (`git push origin <branch>`). Do not leave committed changes unpushed.


## Python / backend
- Python 3.11+, type hints on all function signatures, PEP8 (use `ruff` for lint/format).
- FastAPI routers live in `backend/app/api/`, one file per resource
  (`risk.py`, `rights.py`, `resources.py`).
- Pydantic models for every request/response body — no raw dicts crossing the API
  boundary.
- ML code lives in `backend/app/ml/` (training scripts separate from inference/serving
  code — training scripts are not imported at request time).
- RAG code lives in `backend/app/rag/` (ingestion/chunking separate from
  retrieval/generation).
- Every RAG-generated answer must include which source document(s) and section(s) it
  drew from in the response payload — the frontend renders these as visible citations.
  If retrieval confidence is low / no relevant chunk found, return an explicit
  "I don't have a grounded answer for this — here's where to ask a human" response
  instead of letting the LLM answer from parametric memory alone.

## Frontend / React
- TypeScript strict mode. No `any` without a `// TODO` explaining why.
- Use the design tokens in `frontend/src/styles/tokens.css` and
  `docs/DESIGN_SYSTEM.md` — no ad-hoc colors, no border-radius on
  brutalist components, no soft/blurred box-shadows.
- All user-facing strings go through the i18n layer (`frontend/src/lib/i18n.ts`) —
  never hardcode English strings directly in JSX, even for a "quick" MVP screen.
- Minimum tap target 44×44px. Body text minimum 16px. Contrast ratio ≥ 4.5:1 — verify
  against the actual token colors, brutalist palettes are high-risk for accidentally
  failing contrast on accent colors.

## Privacy / safety (non-negotiable — this handles vulnerable users' complaints)
- Do not persist a user's freeform complaint text, name, or employer name server-side
  beyond the request lifecycle unless there is an explicit, visible opt-in with a clear
  explanation of what will be stored and why.
- Never log full request bodies containing user-entered complaint text to application
  logs or error trackers in plaintext.
- The rights-assistant answers must never state or imply a named employer is "guilty" of
  a violation — frame everything as "based on [Act/section], this pattern may
  indicate..." and route to the official grievance channel for actual determination.
- Every rights-related response requires the visible disclaimer: "This is educational
  information, not legal advice."
- **Local-first ledger isolation**: The core ledger CRUD and storage modules (`frontend/src/lib/ledger/db.ts`, `types.ts`, `countdown.ts`, `qr.ts`) must have ZERO imports of networking libraries (`fetch`, `axios`, `XMLHttpRequest`, or API client modules). All shift entries, wages, advances, and notes must remain strictly client-side in the user's browser IndexedDB. Zero worker shift records or dispute logs may ever cross the network to the server. Enforce this via automated test assertions.

## Testing
- New ML feature-engineering functions get a unit test with a small synthetic dataframe.
- New RAG retrieval logic gets a test asserting that a known query returns a chunk from
  the expected source document.
- API endpoints get at least one happy-path test in `backend/tests/`.

## When starting a new build task, follow the matching workflow
See `.agents/workflows/` — run the workflow file that matches the task rather than
improvising the sequence (data pipeline, risk model, RAG corpus, backend, frontend,
deploy each have one).
