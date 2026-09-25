# WageGuard India — Legal Corpus Card & Statutory Freshness Notes (`rag_store/CORPUS_NOTES.md`)

## 1. Corpus Overview & Architecture
- **Knowledge Base Scope**: Statutory labour laws, state minimum wage schedules, official grievance redressal channels, and plain-language rights FAQs for Indian workers.
- **Corpus Structure**:
  - `rag_store/corpus/central_acts/`: Primary Acts (Payment of Wages Act 1936, Minimum Wages Act 1948, Payment of Gratuity Act 1972, Code on Wages 2019).
  - `rag_store/corpus/state_minimum_wages/`: Current notified rates and frontmatter metadata for 7 launch states (Delhi, Maharashtra, Karnataka, Tamil Nadu, Kerala, Telangana, West Bengal).
  - `rag_store/corpus/grievance_channels/`: Official portals (Shram Suvidha, EPFO EPFiGMS, ESIC CPGRAMS, NALSA 15100, State Labour Commissioner offices).
  - `rag_store/corpus/faq/`: Section-grounded legal Q&As for common wage theft scenarios.
- **Chunking Strategy**: Chunked strictly by logical statutory section or notification table schedule (`## Section X`), never arbitrary token windows. Every chunk stores traceable metadata (`source_file`, `act_name`, `section_or_clause`, `state`, `valid_as_of_date`).
- **Storage & Vector Index**: ChromaDB persistent collection (`wageguard_legal_corpus`) located at `rag_store/index/` using normalized cosine distance space.

---

## 2. Major Legal Paradigm Shift: November 2025 Labour Codes Notification
A historic, foundational reform of Indian labour law occurred on **21 November 2025**:
- **Official Commencement (21 Nov 2025)**: The Central Government officially published Gazette notifications bringing into force the four consolidated Labour Codes:
  1. **The Code on Wages, 2019** (Act No. 29 of 2019)
  2. **The Industrial Relations Code, 2020**
  3. **The Code on Social Security, 2020**
  4. **The Occupational Safety, Health and Working Conditions Code, 2020**
- **Repeal & Subsumption**: The Code on Wages, 2019 repeals and consolidates four historical statutes:
  - Payment of Wages Act, 1936
  - Minimum Wages Act, 1948
  - Payment of Bonus Act, 1965
  - Equal Remuneration Act, 1976
- **Substantive Rights Changes**:
  - **Universal Minimum Wage (Section 6)**: Eliminates the restrictive "scheduled employments" doctrine from 1948; statutory minimum wages now apply universally to all workers across organized and unorganized sectors.
  - **National Floor Wage (Section 9)**: Central government sets a statutory floor below which no state minimum wage may fall.
  - **Statutory Resignation Settlement (Section 17(2))**: Resolves the historical vacuum in Section 5(2) of the 1936 Act (which had applied strictly to employer-initiated termination). Under Section 17(2), wages earned upon **resignation** must also be paid within **two working days (2 working days)**.

---

## 3. Transitional Realities & Concurrent Administration (Early 2026 Status)
While the Code on Wages, 2019 is substantively in force, operational administration reflects the realities of Indian federalism:
1. **Concurrent List (Entry 24, List III)**: Both Parliament and State Legislatures hold legislative competence over labour. While the Central Code is in effect, States must frame their corresponding State Rules.
2. **Rule-Making Status in Early 2026**:
   - Draft Central Rules under the Code on Wages were published for public consultation around **30 December 2025**.
   - Several states have finalized rules, while others are operating through draft rules or transitional directives.
3. **Transitional Enforcement Mechanism**:
   - Where state-specific Code procedural rules or newly constituted adjudicative tribunals (e.g. Facilitators instead of Inspectors) are still being set up, workers and labour courts frequently cite transitional provisions and utilize the established adjudication mechanisms of the **Payment of Wages Act 1936 (Section 15)** or **State Shops & Establishments Acts**.
   - The substantive standard (e.g., 2-day resignation settlement under Section 17(2)) is the binding law of the land, while the administrative forum depends on local state notification progress.

---

## 4. Known Freshness Risk & Mandatory Pre-Deployment Refresh Protocol
> [!WARNING]
> **HIGH FRESHNESS RISK**: Indian labour law underwent its most comprehensive restructuring in over 75 years in late 2025. Statutory rules, state gazette notifications, variable dearness allowance (VDA) revisions, and enforcement procedures are actively evolving month-to-month.

### Mandatory Pre-Deployment Checklist:
Before deploying WageGuard India to real-world users, the deploying team **MUST** execute the following verification steps:
1. **Verify State Rules Status**: Check the official Gazette portal for each target launch state to determine whether state-level Code on Wages Rules have been fully published and operationalized.
2. **Re-verify with India Code Portal**: Run an automated or manual diff against the official India Code portal (`https://indiacode.nic.in`) to check for newly notified amendments, rules, or commencement orders.
3. **Bi-Annual Minimum Wage Rate Refresh**: State minimum wage notifications are revised twice each year (typically April and October, or January and July) based on Consumer Price Index (CPI) adjustments. Update all `rag_store/corpus/state_minimum_wages/*.md` files with the latest gazette notification numbers and `valid_as_of_date` before every deployment cycle.
4. **Adjudication Forum Check**: Verify whether District Labour Courts or newly designated Code Adjudication Officers hear wage recovery claims in the relevant municipal jurisdiction.

---

## 5. Non-Negotiable Privacy & Safety Mandates (from `AGENTS.md`)
- **No PII Persistence**: Freeform complaint text, worker names, and employer names must never be stored server-side beyond the active request lifecycle.
- **Non-Accusatory Legal Framing**: Generated answers must NEVER accuse a named employer of being "guilty". Frame all responses as *"Based on [Act/Section], this pattern indicates..."* and route to official grievance portals.
- **Mandatory Visible Disclaimer**: Every output must carry the visible disclaimer:
  - English: *"This is educational information, not legal advice."*
  - Hindi: *"यह केवल शैक्षणिक जानकारी है, कानूनी सलाह नहीं है।"*
- **Explicit Fallback for Low Confidence**: If retrieval similarity is below threshold or out-of-scope, return an explicit *"I don't have a grounded answer for this — here's where to ask a human"* routing to NALSA (15100) or Shram Suvidha, rather than letting an LLM generate ungrounded parametric conjectures.
