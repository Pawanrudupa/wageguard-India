# Workflow: Build the state/sector risk dataset

**Goal**: produce `data/processed/state_sector_risk.csv` with columns roughly:
`state, sector, year, inspections_conducted, irregularities_detected, prosecutions,
convictions, complaints_received, claims_awarded, current_min_wage_rate,
irregularity_rate, risk_label`.

## Steps
1. Collect raw source documents into `data/raw/`:
   - Ministry of Labour & Employment annual reports (PDF) — enforcement-of-Minimum-Wages-
     Act tables.
   - Lok Sabha / Rajya Sabha unstarred-question replies from eparlib.nic.in matching
     "minimum wages violations state-wise" / "non-compliance of wage laws" — these
     contain state-wise complaint/irregularity/prosecution counts.
   - indiastat.com tables on "Enforcement of Minimum Wages Act" (state-wise, year-wise).
   - Current state minimum wage notifications (each state labour dept publishes these
     twice a year) — at least for the 5-8 states you plan to launch with.
   - See `docs/DATA_SOURCES.md` for the full list and notes on access.
2. For each source, extract the state × year × (inspections / irregularities /
   prosecutions / convictions / complaints) table. Most of these are PDFs — use a table
   extraction approach (e.g. `pdfplumber` or `camelot`) and manually verify a sample of
   rows against the source PDF, since these are messy scanned/typeset government tables.
3. Normalize state names (spelling variants, union territories) into one canonical list.
4. Join across years/sources into one long-format table in `data/processed/`.
5. Engineer `irregularity_rate = irregularities_detected / max(inspections_conducted, 1)`
   and similar normalized rates — raw counts alone are misleading (states with more
   inspections will show more irregularities).
6. Bucket into a `risk_label` (e.g. tertile split: low/medium/high) per state-sector —
   document your thresholding choice in the script's docstring, this is a modeling
   decision to be able to defend later.
7. Write a short `data/processed/DATA_NOTES.md` documenting: what's missing, what years
   were unavailable for which states, and any manual corrections made. This
   documentation is itself a deliverable — it's evidence of rigor.

## Definition of done
- `data/processed/state_sector_risk.csv` exists, loads cleanly with pandas, has no
  duplicate state-sector-year rows.
- `data/processed/DATA_NOTES.md` explains provenance and known gaps.
