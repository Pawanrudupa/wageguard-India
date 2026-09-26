# Project Context — GEMINI.md

## What this is
**WageGuard India** (वेतन रक्षक) — a wage-theft risk + workers'-rights navigator for Indian
workers. It combines a state/sector wage-law-irregularity risk model (ML) with a
retrieval-augmented (RAG) rights assistant grounded in Indian labour law.

One-line pitch: *"Know your risk. Know your rights."*

## The real-world problem
- Wage theft (unpaid overtime, below-minimum-wage pay, unpaid PF/ESI contributions,
  withheld final settlements) is widespread among India's low-wage and informal-sector
  workers, who rarely know their legal rights or how to act.
- India does **not** maintain a centralized, company-level wage-violation database
  (confirmed via Lok Sabha/Rajya Sabha replies from the Ministry of Labour & Employment:
  "the data is not maintained centrally"). This is why the ML component targets
  **state + sector level risk**, not individual-employer risk — that's the honest, defensible
  scope given real data availability.
- Labour law in India is fragmented: central Acts (Minimum Wages Act 1948, Payment of
  Wages Act 1936, Payment of Gratuity Act 1972, the four new Labour Codes) plus
  state-specific minimum wage notifications that are revised twice a year, per state,
  per "scheduled employment" category.

## Users / personas
1. **Primary**: a low-wage worker (construction, retail, domestic work, gig/platform,
   factory) who suspects they're being underpaid or denied statutory benefits, on a
   budget Android phone, possibly with limited English.
2. **Secondary**: worker-rights NGOs / union organizers who want a quick reference tool
   for members.

## Goals
- Give a worker a **risk context**: "wage-law irregularities in [sector] in [state] are
  [high/medium/low] relative to other sectors/states" — based on real published
  government statistics, not invented numbers.
- Give a worker **grounded, cited answers** to "is this legal?" questions, sourced from
  actual Acts/sections and current state minimum wage rates — never hallucinated
  citations.
- Point the worker to the correct **next step** (Shram Suvidha portal, state labour
  commissioner, EPFO grievance, NALSA legal aid) for their state.

## Explicit non-goals (don't build these)
- This is **not** a system that predicts or accuses a *specific named employer*. No
  company-level "risk score" — the data doesn't exist centrally and naming individual
  employers without verified evidence is a legal liability, not a resume asset.
- This is **not** a legal-advice product. Every rights-related answer must carry a
  visible "this is educational information, not legal advice" disclaimer.
- No filing of actual government complaints on the user's behalf in the MVP — link out
  to the official portal instead.

## Tone / UX principles
- Mobile-first, low-bandwidth-friendly (assume 3G, small data plans, older Android).
- Neo-brutalist visual shell (bold borders, high contrast, no gradients/soft shadows) —
  see `docs/DESIGN_SYSTEM.md` — but the core "check your rights" flow must stay simple
  and unambiguous. Brutalism is for the shell, never at the cost of clarity for someone
  checking if they're owed wages.
- Bilingual from the start: English + Hindi toggle (architecture should make adding more
  Indian languages later straightforward — don't hardcode strings).

## Tech stack (see docs/ARCHITECTURE.md for detail)
- Backend: Python, FastAPI, Pydantic
- ML: scikit-learn / XGBoost, trained on `data/processed/state_sector_risk.csv`
- RAG: sentence-transformers embeddings + ChromaDB (local, file-based) + an LLM for
  grounded generation with citations
- Frontend: React + Vite + TypeScript + Tailwind CSS (neo-brutalist design tokens)
- No PII persisted server-side beyond the active session unless the user explicitly
  opts in (see AGENTS.md privacy rules)

## Domain glossary (use these terms correctly and consistently)
- **Minimum Wages Act, 1948** — sets minimum wage rates per state per "scheduled
  employment."
- **Payment of Wages Act, 1936** — governs timely payment, permissible deductions.
- **Payment of Gratuity Act, 1972** — gratuity on separation after 5+ years of service.
- **EPFO** — Employees' Provident Fund Organisation (retirement savings).
- **ESIC** — Employees' State Insurance Corporation (health/social insurance).
- **Shram Suvidha Portal** — central govt portal for labour law compliance/complaints.
- **eShram** — national database/registration portal for unorganised-sector workers.
- **NALSA** — National Legal Services Authority (free legal aid).
- **Code on Wages, 2019** — enacted 2019, officially notified into force on **21 November 2025**. Consolidates Minimum Wages Act 1948, Payment of Wages Act 1936, Payment of Bonus Act 1965, and Equal Remuneration Act 1976. Key substantive sections: Section 17 (payment timeline and 2-day final settlement for termination AND resignation), Section 45(6) (unified 3-year limitation period for claims), Section 59 (burden of proof on employer for wage payments/deductions).

## Mandatory Rule: Pre- vs. Post-21-Nov-2025 Legal Verification
**CRITICAL**: Any legal research, prompt generation, statutory citation, or corpus documentation in this project MUST explicitly check whether a claim reflects pre- or post-21-November-2025 law.
- **Prior to 21 Nov 2025**: Legacy Acts governed wages with fragmented 6-month (Payment of Wages Act 1936 s.15(2), Minimum Wages Act 1948 s.20(2)) to 12-month limitation periods and judicial burden of proof on workers.
- **Since 21 Nov 2025**: The Code on Wages, 2019 is in force nationwide via Official Gazette notification. It unifies the claim limitation period to **3 years** (Section 45(6)), explicitly **shifts the burden of proof to the employer** to prove payment and lawful deductions (Section 59), and mandates **2-working-day final settlement** for both resignation and termination (Section 17(2)). Procedural state rules are in transitional rollout; always distinguish substantive statutory law from transitional state procedural rules.
- Under no circumstances state outdated pre-Code rules as settled current law.

## Data reality check (read this before building the ML pipeline)
There is no clean single CSV or API for this. Sources are Ministry of Labour annual
reports, Lok Sabha/Rajya Sabha unstarred-question replies (PDF, via eparlib.nic.in),
and aggregator sites like indiastat. Expect to manually compile a
state × sector × year table from PDFs. This data-wrangling difficulty is itself part
of the project's value — document it, don't hide it.
