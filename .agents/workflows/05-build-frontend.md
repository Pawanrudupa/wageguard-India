# Workflow: Build the React frontend

**Prerequisite**: backend API (Workflow 04) running locally.

## Pages (`frontend/src/pages/`)
1. **Home** — one-line pitch, big CTA into the "Check your situation" flow, brief
   "how this works" section. Neo-brutalist hero treatment lives here — this page can be
   bold.
2. **RiskLookup** — pick state + sector (simple dropdowns, large tap targets) → shows the
   risk badge (color-coded per `docs/DESIGN_SYSTEM.md`) + short explanation +
   `data_confidence` shown honestly, not hidden.
3. **AskRights** — a simple chat-style input, not a decorative chat bubble UI — a
   worker typing on a slow connection needs a plain textbox and a clear "Ask" button.
   Renders the answer with a visible, tappable citation list underneath (expandable to
   show the source excerpt), and the disclaimer always visible, not buried in a tooltip.
4. **Resources** — state-specific grievance channel contacts, formatted as a scannable
   list (phone numbers, portal links), not prose.

## Cross-cutting
- Language toggle (English/Hindi) in the header — wire through
  `frontend/src/lib/i18n.ts`, every page must support both from day one, don't retrofit.
- Mobile-first layout — design and test at a 360–390px width first, then scale up.
- Apply `docs/DESIGN_SYSTEM.md` tokens consistently: thick borders, hard offset
  shadows, no gradients, restrained to 1 accent color + risk-state colors (see design
  doc) — don't let brutalism creep into the AskRights answer text itself, that content
  needs to stay easy to read under stress.

## Definition of done
- All four pages render and call the live backend.
- Lighthouse mobile accessibility score checked — contrast and tap-target issues fixed
  before calling this done.
- Language toggle actually changes all visible strings, not just navigation labels.
