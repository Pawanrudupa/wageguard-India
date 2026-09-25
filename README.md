# WageGuard India (वेतन रक्षक)

**Know your risk. Know your rights.**

A wage-theft risk + workers'-rights navigator for Indian workers, combining a
state/sector wage-law-irregularity risk model (ML) with a retrieval-augmented rights
assistant grounded in Indian labour law (RAG).

> **Start here in Antigravity**: `GEMINI.md` (project context) and `AGENTS.md`
> (agent coding rules) are read automatically. Work through the numbered files in
> `.agents/workflows/` in order — each is a self-contained build task.

## Why this project
Most "AI for X" resume projects in this space are RAG-only chatbots. This one pairs a
real predictive model — trained on genuinely messy, fragmented Indian government
statistics (no clean company-level violation API exists, unlike the US) — with a
grounded legal-rights retrieval system. See `GEMINI.md` for the full problem framing
and honest scope (what this tool does and deliberately does NOT claim to do).

## Repo layout
```
GEMINI.md                  Project context (read by Antigravity)
AGENTS.md                  Agent coding rules (read by Antigravity)
.agents/workflows/         Step-by-step build workflows, run in order 01→06
docs/                       Architecture, data sources, design system, day-by-day plan
backend/                    FastAPI app: ML risk model + RAG rights assistant
frontend/                   React + Vite + TS + Tailwind, neo-brutalist UI
data/raw/                   Collected source PDFs/exports (gitignored, see note below)
data/processed/             Cleaned state_sector_risk.csv + notes
models/                     Trained model artifact + model card
rag_store/                  Legal-text corpus + Chroma vector index
```

## Quickstart (once you've started building)
```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Build order
1. `.agents/workflows/01-data-pipeline.md` — compile the risk dataset
2. `.agents/workflows/02-train-risk-model.md` — train the risk model
3. `.agents/workflows/03-build-rag-corpus.md` — build the legal RAG index
4. `.agents/workflows/04-build-backend-api.md` — wire ML + RAG into FastAPI
5. `.agents/workflows/05-build-frontend.md` — neo-brutalist React UI
6. `.agents/workflows/06-deploy.md` — deploy + record demo

Full day-by-day time-boxed plan for a 1–2 week build: `docs/DAY_BY_DAY_PLAN.md`.

## Data sources
See `docs/DATA_SOURCES.md` for the full list (Ministry of Labour annual reports,
Lok Sabha/Rajya Sabha replies, India Code portal, state minimum wage notifications,
Shram Suvidha / eShram / NALSA).

## Important scope note
This tool gives **state/sector-level** risk context, not employer-specific accusations
— India has no centralized company-level violation database. It is **not** a legal
advice product. See `GEMINI.md` → "Explicit non-goals."

## License / disclaimer
Educational/portfolio project. Not affiliated with the Government of India. Legal
information provided is not a substitute for professional legal advice.
