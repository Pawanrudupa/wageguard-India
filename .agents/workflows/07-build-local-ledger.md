# Workflow: Build Local-First Work & Wage Ledger

**Prerequisite**: Frontend shell (Workflow 05) and RAG retrieval corpus (Workflow 03).

## Purpose & Core Problem
In India's informal economy, over 90% of workers lack written appointment letters, wage slips, or attendance records. While Section 59 of the Code on Wages 2019 shifts the statutory burden of proof to the employer to prove payment and authorized deductions, workers must still substantiate the specific quantum owed (days worked, overtime hours, advances deducted) and establish employment when contested. 

A centralized server-side database of worker disputes introduces grave risks: contractor phone confiscation/retaliation, digital friction (OTP/passwords), and legal liability under the DPDP Act 2023.

This workflow builds an **Offline-First, Device-Only Work & Dispute Ledger** (स्थानीय कार्य डायरी) stored entirely client-side in the worker's browser (IndexedDB).

## In Scope (v1)
1. **Daily Shift & Wage Log (`frontend/src/lib/ledger/db.ts`)**:
   - Fields: Date, Standard Hours Worked, Overtime Hours, Advance Received (₹), Notes.
   - Stored 100% client-side in browser IndexedDB.
   - Zero network calls for saving, reading, updating, or deleting entries.
   - Computes daily & monthly statutory wage arrears against state notified minimum wage rates.

2. **Days-Remaining-to-File Countdown (Section 45(6), Code on Wages 2019)**:
   - Calculates the 3-year unified statutory limitation deadline from the date of wage default or separation.
   - Accompanied by mandatory urgency advisory: *"Statutory limit is 3 years, but acting sooner improves recovery chances before contractors relocate or dissolve."*
   - Anti-retaliation design: Must NOT be an always-visible hero widget; contained strictly inside the ledger detail/dispute view.

3. **Discreet Mode (Anti-Retaliation Handset Concealment)**:
   - One-tap toggle or 4-digit PIN that instantly disguises the ledger screen as a neutral-looking notepad or functional basic calculator.
   - Prevents contractor/supervisor retaliation if handset is inspected on a worksite or in a labor colony.

4. **Evidence Statement Export (Client-Side PDF)**:
   - Generates an "Empirical Statement of Work & Statutory Wage Arrears" using client-side jsPDF.
   - Prominently states: *"Prepared by worker as educational documentation under the Code on Wages, 2019; not legal representation."* (NOT framed as a legal notice or demand letter).
   - Auto-populates relevant statutory provisions (Section 17(2) timely settlement, Section 59 burden of proof, Section 45 claims authority, and state minimum wage rate) by querying the existing RAG corpus without duplicating corpus data into the ledger module.

5. **Offline QR-Code Caseworker Handoff**:
   - Compresses the ledger JSON payload using `pako` gzip and renders it as an offline QR code.
   - Protected by an ephemeral 4-digit PIN that the worker speaks verbally to the caseworker scanning it.
   - Requires an explicit one-tap consent modal explaining what data is being shared before rendering the QR code.

## Explicitly Out of Scope (Do NOT Build in v1)
- Voice input of any kind (audio recording or voice-to-text deferred).
- Translation features.
- Cross-worker or aggregated data sharing (strictly single-worker, single-device).
- Server-side storage, cloud sync, or user login/authentication of any kind.

## Architecture & Privacy Constraints
- Core ledger CRUD operations in `frontend/src/lib/ledger/` must contain ZERO network library imports (`fetch`, `axios`, etc.).
- Network calls are permitted solely when querying statutory provision text from the RAG API for PDF generation, with zero worker PII in the query payload.

## Definition of Done
- IndexedDB CRUD tests pass (create shift, read shifts, update shift, delete shift).
- Section 45(6) 3-year countdown test passes with exact date calculations.
- PDF generation test confirms inclusion of non-legal representation disclaimer and neutral title.
- QR payload tests confirm pako gzip compression and PIN-protected decryption requirement.
- Privacy test verifies zero network imports in core ledger CRUD storage modules.
- UI integrates into frontend with bilingual English & Hindi support and passes TypeScript strict compilation (`tsc -b`).
