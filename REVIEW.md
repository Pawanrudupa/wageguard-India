# WageGuard India — Technical Audit & Review Dossier (`REVIEW.md`)

> **Document Purpose**: Complete technical audit, empirical verification notes, and resolution log covering model threshold reconciliations, sector-normalization fixes, multilingual RAG evaluation audit, and root documentation corrections.
> 
> *Generated locally for review. Strictly uncommitted.*

---

## 1. Resolution of Risk Tertile Threshold Inconsistency

### A. The Inconsistency
* **Previous Informal Discussion**: Referenced `"~1.40 (66th percentile)"` as the high-risk cutoff when evaluating Karnataka.
* **Earlier Documentation**: Stated tertile ranges as `Low ≤ 0.95`, `Medium 0.95–1.60`, `High > 1.60`.
* **Investigation Target**: Identify the exact mathematical cutoffs implemented in the codebase and dataset.

### B. Mathematical Ground Truth from Code & Data
In [`backend/app/ml/data_pipeline.py`](backend/app/ml/data_pipeline.py), lines 98–138 define `assign_risk_labels`, which computes empirical quantiles across all 480 state-sector-year observations in [`data/processed/state_sector_risk.csv`](data/processed/state_sector_risk.csv):

```python
# Quantiles computed across 480 observations:
q_33 = df['irregularity_rate'].quantile(0.3333)  # 0.92969 (~0.93)
q_67 = df['irregularity_rate'].quantile(0.6667)  # 1.65824 (~1.66)
```

The resulting distribution splits the 480 rows into 3 equal tertiles of 160 observations each:

| Risk Tier | Quantile Cutoff | Exact Empirical Range in CSV | Number of Rows | National Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Low Risk** | $\le 33.3\text{rd percentile}$ | `0.0000` to `0.9280` ($\le 0.93$) | 160 | Sub-median violations per inspection |
| **Medium Risk** | $33.3\text{rd} - 66.7\text{th percentile}$ | `0.9306` to `1.6559` ($0.93 - 1.66$) | 160 | Typical violation density (Median = 1.21) |
| **High Risk** | $> 66.7\text{th percentile}$ | `1.6626` to `11.8093` ($> 1.66$) | 160 | Heavily elevated violation density |

### C. Resolution & Reconciling
* The `"~1.40"` figure was an erroneous informal recollection.
* Karnataka's 2022 rate is **1.9197**, which is well above both 1.40 and the true $1.66$ threshold, placing it solidly in the **High Risk** tier.
* The exact empirical boundaries ($\le 0.93$, $0.93\text{–}1.66$, $> 1.66$) are now codified consistently across [`README.md`](README.md) and model documentation.

---

## 2. Empirical Verification: Maharashtra + Construction

### A. The Question
On the live `/risk` page, `Maharashtra + Construction` displays:
```
1.10 violations/inspection, Medium Risk
```
Because `1.10` was also the hardcoded fallback value in [`backend/app/ml/infer.py`](backend/app/ml/infer.py), is this a fallback leak or genuine data?

### B. Raw CSV Verification ([`data/processed/state_sector_risk.csv`](data/processed/state_sector_risk.csv#L247-L251))
```csv
Maharashtra,Construction,2018,4928,5198,231,135,125,99,532.0,1.0548,High,Medium
Maharashtra,Construction,2019,5302,5858,253,146,135,107,532.0,1.1049,High,Medium
Maharashtra,Construction,2020,2464,2695,113,58,68,49,532.0,1.0938,High,Medium
Maharashtra,Construction,2021,3696,4042,173,99,101,75,532.0,1.0936,High,Medium
Maharashtra,Construction,2022,4510,4978,217,124,122,94,532.0,1.1038,High,Medium
```

* **Year 2022 Returns**:
  * `inspections_conducted`: **4,510**
  * `irregularities_detected`: **4,978**
  * $\text{Raw Irregularity Rate} = \frac{4978}{4510} = \mathbf{1.103769...}$ (recorded in CSV as `1.1038`).
  * When formatted via `rate.toFixed(2)` in the UI, this displays as **`1.10 violations/inspection`**.
  * `current_min_wage_rate`: **₹532.00/day**
  * `risk_label`: **Medium**
  * `data_confidence`: **High**

### C. Proof That `/api/risk` Hits the Fast-Path Cache
A query to `http://127.0.0.1:8000/api/risk?state=Maharashtra&sector=Construction` returns:
```json
{
  "state": "Maharashtra",
  "sector": "Construction",
  "risk_label": "Medium",
  "data_confidence": "High",
  "irregularity_rate": 1.1038,
  "current_min_wage_rate": 532.0,
  "explanation": "Wage-law compliance in the Construction sector in Maharashtra shows moderate irregularity rates (Medium Risk), with approximately 1.10 violations detected per inspection. The notified minimum wage benchmark is ₹532.00/day for unskilled labor. Based on consistent statutory returns (4,510 inspections and 122 worker claims recorded)..."
}
```
* If it had fallen back, `current_min_wage_rate` would be `450.0`, inspections would be `5000`, claims would be `200`, and `data_confidence` would be `Medium`.
* **Conclusion**: 1.10 is the genuine empirical value from the 2022 Labour Bureau inspection returns. The visual similarity to 1.10 is an exact mathematical coincidence.

---

## 3. Sector Normalization Bug & Live Snapshot Cards Audit

### A. The Root Cause
Colloquial and informal aliases (e.g. "Brick Kilns", "Security Services", "Garments / Textiles") failed exact string matching against the precomputed lookup keys in [`backend/app/ml/infer.py`](backend/app/ml/infer.py). Consequently, queries with informal names fell through to the unmapped fallback branch, returning synthetic $1.10$ values.

### B. The Fix
Introduced `SECTOR_NORMALIZATION_MAP` in `infer.py` mapping:
* `brick kilns`, `brick kiln`, `brick-kilns`, `garments`, `textiles`, `garments / textiles` $\rightarrow$ `"Manufacturing & Factories"`
* `security services`, `security guard`, `facility management` $\rightarrow$ `"Security & Facility"`
* `hospitality & restaurants`, `hospitality / restaurants`, `hotels & restaurants` $\rightarrow$ `"Hospitality & Food Services"`
* `building`, `civil construction`, `construction worker` $\rightarrow$ `"Construction"`

### C. Live Snapshot Card Audit (Post-Fix Live API Results)

| Target State / Sector | Display Label Context | Raw Rate | Display (`toFixed(2)`) | Risk Tier | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Delhi / Construction** | Construction | `1.9876` | **1.99** viol/insp | **HIGH RISK** | Verified empirical |
| **Maharashtra / Manufacturing & Factories** | Garments / Textiles | `0.7504` | **0.75** viol/insp | **LOW RISK** | Verified empirical |
| **Karnataka / Security & Facility** | Security Services | `1.9197` | **1.92** viol/insp | **HIGH RISK** | **Confirmed: Now High Risk (previously fell back to Medium)** |
| **Tamil Nadu / Manufacturing & Factories** | Brick Kilns | `0.5708` | **0.57** viol/insp | **LOW RISK** | **Reconciled: Low Risk badge correctly matches 0.57 (not 1.10)** |
| **Gujarat / Hospitality & Food Services** | Hotels & Dining | `1.0217` | **1.02** viol/insp | **MEDIUM RISK** | Verified empirical |

### D. Dropdown Safety in `RiskLookup.tsx`
* **Dropdown Selection**: Inherently safe. The `SECTORS` constant in `frontend/src/pages/RiskLookup.tsx` contains only the 8 canonical sectors.
* **URL Parameter Guard**: When users navigate via deep links or QR codes (e.g. `?sector=Brick+Kilns`), the backend `SECTOR_NORMALIZATION_MAP` intercepts and normalizes the string before reaching the model or lookup table.

---

## 4. Multilingual RAG Retrieval Audit: Show Your Work

### A. Context & Purpose
Earlier documentation erroneously asserted: *"Top-1 retrieval reached 96% (24/25 queries)"*. Because the raw Top-4 candidate match rate was already known to be 56% (14/25), Top-1 accuracy could not mathematically be 96%.

### B. Query-by-Query Benchmark Results
Benchmark script: [`scripts/test_multilingual_rag.py`](scripts/test_multilingual_rag.py)  
Embedding model: `paraphrase-multilingual-MiniLM-L12-v2`  
Production cosine similarity cutoff: $\ge 0.40$  
Collection: `wageguard_legal_corpus` (ChromaDB)

| Language | Query Topic | Query Text | Top-1 Retrieved Chunk (Similarity) | Script Raw Match in Top 4? | Script Match Rank | Pass at Prod Threshold ($\ge 0.40$)? | Statutory Relevance Audit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tamil** | Resignation withholding | நான் ராஜினாமா செய்த பிறகு முதலாளி எனது சம்பளத்தை நிறுத்தி வைக்கலாமா? | TN State Schedule (0.223) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Tamil** | Overtime double rate | கூடுதல் நேர வேலைக்கு (ஓவர்டைம்) இரட்டிப்பு சம்பளம் வழங்கப்பட வேண்டுமா? | Payment of Gratuity s.4 (0.443) | ✅ Kerala Overtime (0.406) | Rank 2 | ✅ PASS (0.406) | ⚠️ Topical only (Cross-state: Kerala Schedule for TN query) |
| **Tamil** | Gratuity 5 years | 5 ஆண்டுகள் வேலை செய்த பிறகு பணிக்கொடை (கிராஜுவிட்டி) கிடைக்குமா? | Karnataka State Schedule (0.305) | ✅ Payment of Gratuity s.1 (0.303) | Rank 2 | ❌ Fail (0.303 < 0.40) | ✅ **Genuine Match** (Central Act; sub-threshold) |
| **Tamil** | Min wage complaint | குறைந்தபட்ச ஊதியம் வழங்காவிட்டால் எங்கு புகார் செய்வது? | Payment of Gratuity s.9 (0.297) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Tamil** | NALSA legal aid | தொழிலாளர்களுக்கு இலவச சட்ட உதவி மற்றும் வழக்கறிஞர் கிடைக்குமா? | Grievance Channels (0.325) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Telugu** | Resignation withholding | నేను రాజీనామా చేసిన తర్వాత యజమాని నా జీతం నిలిపివేయవచ్చా? | Payment of Gratuity s.4 (0.251) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Telugu** | Overtime double rate | ఓవర్‌టైమ్ పనికి డబుల్ జీతం చెల్లించాలా? | Payment of Gratuity s.4 (0.440) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Telugu** | Gratuity 5 years | 5 సంవత్సరాలు పనిచేసిన తర్వాత గ్రాట్యుటీ వస్తుందా? | Payment of Gratuity s.4 (0.396) | ✅ Payment of Gratuity s.4 (0.396) | **Rank 1** | ❌ Fail (0.396 < 0.40) | ✅ **Genuine Match (Rank 1)** (Central Act; sub-threshold) |
| **Telugu** | Min wage complaint | కనీస వేతనం చెల్లించకపోతే ఎక్కడ ఫిర్యాదు చేయాలి? | Payment of Gratuity s.4 (0.382) | ✅ Minimum Wages Act s.12 (0.374) | Rank 2 | ❌ Fail (0.374 < 0.40) | ✅ **Genuine Match** (Central Act s.12; sub-threshold) |
| **Telugu** | NALSA legal aid | ఉచిత న్యాయ సహాయం కోసం ఏ నంబర్‌కు కాల్ చేయాలి? | Payment of Gratuity s.7 (0.244) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Kannada** | Resignation withholding | ನಾನು ರಾಜೀನಾಮೆ ನೀಡಿದ ನಂತರ ಮಾಲೀಕರು ನನ್ನ ಸಂಬಳವನ್ನು ತಡೆಹಿಡಿಯಬಹುದೇ? | TN State Schedule (0.220) | ✅ Payment of Wages s.13A (0.191) | Rank 2 | ❌ Fail (0.191 < 0.40) | ❌ Topical mismatch (s.13A is record maintenance, not settlement) |
| **Kannada** | Overtime double rate | ಅಧಿಕಾವಧಿ (ಓವರ್‌ಟೈಮ್) ಕೆಲಸಕ್ಕೆ ದುಪ್ಪಟ್ಟು ವೇತನ ಸಿಗುತ್ತದೆಯೇ? | Payment of Gratuity s.4 (0.376) | ✅ Karnataka Overtime (0.330) | Rank 2 | ❌ Fail (0.330 < 0.40) | ✅ **Genuine Match** (Karnataka Schedule; sub-threshold) |
| **Kannada** | Gratuity 5 years | 5 ವರ್ಷ ಕೆಲಸ ಮಾಡಿದ ನಂತರ ಗ್ರಾಚ್ಯುಟಿ ಪಡೆಯಲು ಅರ್ಹತೆಯಿದೆಯೇ? | Payment of Gratuity s.4 (0.454) | ✅ Payment of Gratuity s.4 (0.454) | **Rank 1** | ✅ **PASS (0.454)** | ✅ **Genuine Match (Rank 1 & PASS $\ge 0.40$)** |
| **Kannada** | Min wage complaint | ಕನಿಷ್ಠ ವೇತನ ಸಿಗದಿದ್ದರೆ ಎಲ್ಲಿ ದೂರು ನೀಡಬೇಕು? | TN State Schedule (0.301) | ✅ TN State Schedule (0.301) | **Rank 1** | ❌ Fail (0.301 < 0.40) | ❌ **Misattributed** (TN Schedule is cross-state for Karnataka) |
| **Kannada** | NALSA legal aid | ಕಾರ್ಮಿಕರಿಗೆ ಉಚಿತ ಕಾನೂನು ನೆರವು ಸಿಗುತ್ತದೆಯೇ? | Payment of Gratuity s.8 (0.341) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Malayalam**| Resignation withholding | രാജി വെച്ചതിനു ശേഷം തൊഴിലുടമയ്ക്ക് ശമ്പളം തടഞ്ഞുവെക്കാൻ കഴിയുമോ? | TN State Schedule (0.237) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Malayalam**| Overtime double rate | അധിക സമയം (ഓവർടൈം) ജോലി ചെയ്താൽ ഇരട്ടി വേതനം ലഭിക്കുമോ? | TN State Schedule (0.267) | ✅ TN State Schedule (0.267) | **Rank 1** | ❌ Fail (0.267 < 0.40) | ❌ **Misattributed** (TN Schedule is cross-state for Kerala) |
| **Malayalam**| Gratuity 5 years | 5 വർഷത്തെ സേവനത്തിന് ശേഷം ഗ്രാറ്റുവിറ്റി ലഭിക്കാൻ അർഹതയുണ്ടോ? | Payment of Gratuity s.4 (0.340) | ✅ Payment of Gratuity s.4 (0.340) | **Rank 1** | ❌ Fail (0.340 < 0.40) | ✅ **Genuine Match (Rank 1)** (Central Act; sub-threshold) |
| **Malayalam**| Min wage complaint | മിനിമം വേതനം ലഭിച്ചില്ലെങ്കിൽ எവിടെ പരാതി നൽകണം? | TN State Schedule (0.270) | ✅ TN State Schedule (0.270) | **Rank 1** | ❌ Fail (0.270 < 0.40) | ❌ **Misattributed** (TN Schedule is cross-state for Kerala) |
| **Malayalam**| NALSA legal aid | തൊഴിലാളികൾക്ക് സൗജന്യ നിയമസಹায়ം ലഭിക്കുമോ? | Payment of Gratuity s.4 (0.398) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Bengali** | Resignation withholding | পদত্যাগ করার পর কি মালিক আমার বেতন আটকে রাখতে পারে? | Payment of Gratuity s.4 (0.341) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |
| **Bengali** | Overtime double rate | ওভারটাইম কাজের জন্য কি দ্বিগুণ মজুরি দিতে হয়? | Payment of Gratuity s.7 (0.239) | ✅ TN State Schedule (0.212) | Rank 2 | ❌ Fail (0.212 < 0.40) | ❌ **Misattributed** (TN Schedule is cross-state for Bengal) |
| **Bengali** | Gratuity 5 years | ৫ বছর কাজ করার পর কি গ্র্যাচুইটি পাওয়া যায়? | TN State Schedule (0.249) | ✅ Payment of Gratuity s.4 (0.240) | Rank 2 | ❌ Fail (0.240 < 0.40) | ✅ **Genuine Match** (Central Act; sub-threshold) |
| **Bengali** | Min wage complaint | ন্যূনতম মজুরি না দিলে কোথায় অভিযোগ করব? | TN State Schedule (0.290) | ✅ TN State Schedule (0.290) | **Rank 1** | ❌ Fail (0.290 < 0.40) | ❌ **Misattributed** (TN Schedule is cross-state for Bengal) |
| **Bengali** | NALSA legal aid | বিনামূল্যে আইনি সহায়তা পাওয়ার জন্য কোন নম্বরে ফোন করব? | TN State Schedule (0.235) | ❌ None in Top 4 | — | ❌ Fail | ❌ Fail (No relevant chunk in Top 4) |

### C. Benchmark Reconciliation: Naive Heuristic vs. Audited Statutory Accuracy

When evaluating multilingual vector retrieval across Indian regional languages, the results differ sharply depending on whether evaluation accepts keyword adjacency or enforces jurisdictional statutory correctness:

| Metric | Naive Script Heuristic (Topical / Keyword Adjacency) | Audited Statutory Relevance (Jurisdictionally Correct) |
| :--- | :--- | :--- |
| **Top-1 Match Rate** | **28.0% (7/25 queries)** | **12.0% (3/25 queries)** *(Telugu, Kannada, Malayalam Gratuity)* |
| **Top-4 Match Rate** | **56.0% (14/25 queries)** | **28.0% (7/25 queries)** *(Excluding 7 cross-state / spurious hits)* |
| **Production Pass Rate ($\ge 0.40$)** | **8.0% (2/25 queries)** | **4.0% (1/25 queries)** *(Kannada Gratuity only)* |
| **Hindi Baseline ($\ge 0.40$)** | **92.0% (23/25 queries)** | **92.0% (23/25 queries)** |

### D. Architectural Decision Grounded in Evidence
1. **The "Tamil Nadu Collapse" Phenomenon**: In 5 of the 25 queries, dense scheduled employment keyword overlap caused the vector index to retrieve the **Tamil Nadu State Schedule** for queries originating in Kannada, Malayalam, or Bengali. Under naive keyword testing, this was counted as a "hit" because the chunk title contained `"Minimum Wages Act"`, but from a legal standpoint it constitutes cross-state misinformation.
2. **Production Pass Rate ($4.0\% - 8.0\%$) vs Hindi ($92.0\%$)**: Even setting aside jurisdiction, multilingual semantic vectors for South Indian and Bengali scripts against English legal acts produce cosine similarity scores hovering in the $0.20 - 0.35$ range.
3. **Strategic Outcome**: Lowering the threshold below $0.40$ to admit low-similarity Indic vectors causes hallucination on out-of-domain queries. The web interface therefore remains bilingual (English + Hindi), and reaching non-Hindi migrant corridors is documented as requiring **conversational WhatsApp voice notes and telephony IVR** with explicit state routing.

---

## 5. RAG Corpus Chunk Count Verification

* **Inspection Method**: Direct Python query against ChromaDB:
  ```python
  client = chromadb.PersistentClient(path='rag_store/index')
  collection = client.get_collection('wageguard_legal_corpus')
  print(collection.count()) # Returns: 61
  ```
* **Result**: Exactly **61 chunks** indexed across 13 statutory markdown files in `rag_store/corpus/`.
* **Fix**: Replaced all occurrences of `168` in `README.md` with `61`.

---

## 6. Root README Polish & Housekeeping

1. **Opening Description**: Softened from `"production-grade"` to `"rigorously benchmarked"` to reflect the project's pre-deployment state.
2. **License**: Added standard [`LICENSE`](LICENSE) (MIT License, Copyright 2026 Pawan Udupa) in the repository root.
3. **Architecture Diagram**: Updated Mermaid diagram to reflect 61 curated chunks, local-first IndexedDB ledger, and sector normalization layer.
4. **Git Status**: All changes saved locally. **Zero commits and zero pushes have been made to GitHub**.
