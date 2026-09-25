# Data Sources

## Risk-model data (state/sector wage-law statistics)
India has **no centralized, company-level violation database** — confirmed by the
Ministry of Labour & Employment's own replies in Parliament ("the data is not
maintained centrally," per eparlib.nic.in unstarred-question replies). Work with
state/sector-aggregated statistics instead:

1. **Ministry of Labour & Employment — Annual Reports**
   Contains "Enforcement of Minimum Wages Act" tables: state-wise inspections,
   irregularities detected, prosecutions launched, convictions. Published yearly on the
   Ministry's website. Cross-check figures against Parliament replies where possible.

2. **Lok Sabha / Rajya Sabha unstarred-question replies** (eparlib.nic.in)
   Search terms that surface relevant tables: "minimum wages violations state-wise",
   "non-compliance of wage laws", "enforcement of labour laws". These PDF replies often
   contain exactly the state-wise complaint/irregularity/prosecution breakdowns needed —
   but are inconsistent in format year to year, expect manual cleanup.

3. **indiastat.com** — "Enforcement of Minimum Wages Act, 1948" and related
   labour-and-workforce tables, state-wise and year-wise. Useful as a secondary
   cross-check / faster-to-parse source, but verify against the primary government
   documents above where it matters for the model.

4. **PRS Legislative Research** (prsindia.org) — good for plain-language summaries of
   labour law statistics and bills; useful for context, not a primary data source.

5. **State minimum wage notifications** — each state labour department publishes
   current rates per "scheduled employment" category, revised roughly twice yearly.
   Launch with 5-8 states with clearer online publication (e.g. Delhi, Maharashtra,
   Karnataka, Tamil Nadu, Kerala) rather than attempting all 28 states + UTs in the MVP.

## RAG corpus (legal text)
1. **India Code portal** (indiacode.nic.in) — authoritative full text of central Acts:
   Minimum Wages Act 1948, Payment of Wages Act 1936, Payment of Gratuity Act 1972, and
   the four new Labour Codes (verify current implementation/notification status per
   state before treating a Code section as "in force" — rollout has been staggered).
2. **State labour department websites** — current minimum wage notifications (PDF/HTML)
   per launch state.
3. **Shram Suvidha Portal** (shramsuvidha.gov.in) — central compliance/grievance portal;
   use for grievance-channel info, not as a data-statistics source.
4. **eShram** (eshram.gov.in) — national database for unorganised workers; reference for
   worker registration info in the Resources page.
5. **NALSA** (nalsa.gov.in) — free legal aid contact info per state, for the Resources
   page.

## Explicitly out of scope for data collection
- Do not scrape individual employer names, Glassdoor/Indeed-style company reviews, or
  social-media complaints and present them as "violations" — unverified, defamation-risk,
  and contradicts the project's explicit non-goal of not accusing named employers.

## Refresh cadence
- State minimum wage notifications: re-check every 6 months (they're revised roughly
  twice a year).
- Ministry annual report / Parliament reply data: re-check yearly when new reports are
  published.
- Document the "valid as of" date on every ingested corpus file — this is enforced by
  the ingest workflow, not optional metadata.
