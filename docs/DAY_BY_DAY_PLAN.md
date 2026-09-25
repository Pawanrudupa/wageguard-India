# Day-by-Day Plan (1–2 weeks, intermediate skill level)

Each day assumes ~3-5 focused hours. Adjust freely — the workflow files in
`.agents/workflows/` are the source of truth for *what* each stage requires; this is
just a time-box.

## Week 1 — data + models

- **Day 1 — Data collection.** Gather source PDFs/tables per `docs/DATA_SOURCES.md`
  into `data/raw/`. Pick your 5-8 launch states. Run
  `.agents/workflows/01-data-pipeline.md` steps 1-2.
- **Day 2 — Data cleaning.** Normalize state names, join sources, engineer
  irregularity_rate, produce `state_sector_risk.csv` + `DATA_NOTES.md`. Finish
  Workflow 01.
- **Day 3 — Risk model.** EDA, train baseline model, evaluate honestly, write
  `MODEL_CARD.md`. Run Workflow 02.
- **Day 4 — Legal corpus.** Collect Act texts (India Code portal) + state minimum wage
  notifications + grievance channel info into `rag_store/corpus/`. Start Workflow 03.
- **Day 5 — RAG pipeline.** Chunk, embed, build Chroma index, write retrieve.py +
  generate.py, test grounded answers with citations. Finish Workflow 03.

## Week 2 — product

- **Day 6 — Backend API.** Wire `/api/risk`, `/api/rights`, `/api/resources`,
  `/api/health`. Run Workflow 04. Test all endpoints via `/docs`.
- **Day 7 — Frontend scaffold.** Set up Vite + Tailwind + design tokens from
  `DESIGN_SYSTEM.md`. Build Home + navigation shell. Start Workflow 05.
- **Day 8 — Core flows.** Build RiskLookup and AskRights pages, wire to live backend.
- **Day 9 — Resources page + i18n.** Build Resources page, wire Hindi/English toggle
  across all pages. Finish Workflow 05.
- **Day 10 — Polish + deploy.** Mobile responsiveness pass, accessibility check
  (contrast, tap targets), deploy backend + frontend, record demo clip. Run
  Workflow 06.

## Optional buffer days (11-12) — pick based on what will help your resume story most
- Add 2-3 more states to the risk model + corpus (broadens "scale" story).
- Add a second Indian language beyond Hindi (broadens "real accessibility" story).
- Add a simple wage calculator (hours × rate vs. state minimum) as a standalone
  feature — cheap to build, concretely useful, easy to demo in an interview.
- Write up the `MODEL_CARD.md` limitations section into a short "what I'd do with more
  time/data" note for your resume/portfolio page — interviewers respond well to
  demonstrated awareness of a project's limits.

## What to have ready for your resume/portfolio before you stop
1. Deployed live demo URL.
2. 60-90s demo clip (English + Hindi).
3. One paragraph on the ML approach + one on the RAG approach (see
   `docs/ARCHITECTURE.md` "why two separate pipelines" — that reasoning is good resume
   copy, adapt it).
4. The model card's honest limitations section — bring this up proactively in
   interviews, it signals maturity.
