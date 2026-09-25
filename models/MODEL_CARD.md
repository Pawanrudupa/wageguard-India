# Model Card: State/Sector Wage-Theft Risk Model

## 1. Model Details
- **Model Name**: WageGuard State/Sector Risk Classifier
- **Model Architecture**: RandomForest_depth4 (`scikit-learn` Pipeline)
- **Model Version**: 1.1.0
- **Training Date**: 2026-09-25
- **Task**: Multi-class Classification (3 Tertiles: `Low`, `Medium`, `High`)
- **Primary Objective**: Provide Indian informal/low-wage workers with state- and sector-aggregated wage-law irregularity context based on government inspection statistics.

---

## 2. Intended Use & Ethical Boundaries
- **Intended Use**: Educational risk context for workers and labour rights organizations. Informs workers whether wage-law irregularities in their sector and state are statistically elevated compared to national baselines.
- **Explicit Non-Goals & Prohibited Use**:
  - **NOT an accusation against any individual employer or company.** India maintains no central employer violation database; accusing named employers without verified court records is legally hazardous.
  - **NOT legal advice.** Must always be accompanied by the mandatory statutory educational disclaimer.
  - **NOT an automated complaint adjudicator.** Does not file complaints on behalf of workers.

---

## 3. Training & Validation Methodology

### A. Temporal Chronological Split (Strictly Zero Random Split)
- **Training Set (Years 2018–2021)**: 384 state-sector-year observations.
- **Validation Set (Year 2022)**: 96 state-sector-year observations.
- **Rationale**: Random cross-validation leaks temporal autocorrelation and macroeconomic trends across years. Evaluating strictly on the unseen future year (2022) tests real-world forward predictive validity.

### B. Strict Temporal Featurization (Zero-Leakage Guarantee)
To guarantee that no future data leaks into predictions, lag features are strictly computed from year $Y-1$:
```python
# 1. Sort strictly by state, sector, and year
df = df.sort_values(by=["state", "sector", "year"]).reset_index(drop=True)

# 2. Shift strictly by 1 year within each state-sector group
df["lag_irregularity_rate"] = df.groupby(["state", "sector"])["irregularity_rate"].shift(1)
df["lag_inspections"] = df.groupby(["state", "sector"])["inspections_conducted"].shift(1)
df["lag_complaints"] = df.groupby(["state", "sector"])["complaints_received"].shift(1)

# 3. Assert zero leakage: Year 2022 lag feature matches Year 2021 exactly with 0 diff
val_diff = (
    df[df["year"] == 2021].set_index(["state", "sector"])["irregularity_rate"]
    - df[df["year"] == 2022].set_index(["state", "sector"])["lag_irregularity_rate"]
).abs().max()
assert val_diff == 0.0, "Temporal data leakage detected in lag_irregularity_rate!"
```
For any observation in validation year $Y=2022$, `lag_irregularity_rate` is mathematically guaranteed to originate exclusively from year $Y-1=2021$, with zero access to year $2022$ inspection or irregularity data.

### C. Preprocessing & Featurization Ordering
- Categorical Features (`state`, `sector`): `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` fitted strictly on training data.
- Numerical Features (`lag_irregularity_rate`, `lag_inspections`, `lag_complaints`, `min_wage_ratio`): `StandardScaler()` fitted strictly on training data.
- **National Median Wage Benchmark**: INR 481.00/day calculated exclusively on training years (2018–2021).

---

## 4. Evaluation Results (2022 Validation Set)

### Model Comparison vs. Naive Baseline (2022 Validation Set)
| Model / Baseline | Accuracy | Macro F1-Score | Type & Notes |
|---|---|---|---|
| **Naive Persistence Baseline** | 97.92% | 0.9792 | Simply predicts each state-sector's prior year (2021) label unchanged |
| **Multinomial Logistic Regression** | 96.88% | 0.9689 | Linear ML baseline |
| **Random Forest (max_depth=4)** (Selected) | 97.92% | 0.9792 | Shallow tree model with explainable feature importances |

### Per-Class Metrics (Random Forest)
| Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| **Low Risk** | 0.9688 | 1.0000 | 0.9841 | 31.0 |
| **Medium Risk** | 0.9688 | 0.9688 | 0.9688 | 32.0 |
| **High Risk** | 1.0000 | 0.9697 | 0.9846 | 33.0 |

### Confusion Matrix (Rows = Actual, Columns = Predicted: Low, Medium, High)
```text
           Predicted Low   Predicted Medium   Predicted High
Actual Low       31              0                  0
Actual Med       1               31                 0
Actual High      0               1                  32
```

### Slice-Based Performance Analysis (By Data Confidence Tier)
| Data Confidence Level | Observations | Accuracy | Macro F1-Score | Notes & State Examples |
|---|---|---|---|---|
| **High Confidence** | 56 | 98.2% | 0.9786 | Delhi, Maharashtra, Karnataka, Tamil Nadu, Kerala, Telangana, Central Sphere |
| **Medium Confidence** | 32 | 96.9% | 0.9714 | West Bengal, Gujarat, Uttar Pradesh, Rajasthan |
| **Low Confidence** | 8 | *N/A (n=8 too small)* | *N/A (n=8 too small)* | Bihar (unsubmitted annual returns in 2019/2020; n=8 is too small to report a meaningful accuracy metric) |

---

## 5. Interpretability & Top Features

Top feature contributors to risk classification:
```text
- lag_irregularity_rate: 0.3517
- min_wage_ratio: 0.1346
- lag_complaints: 0.0894
- state_Tamil Nadu: 0.0706
- state_Telangana: 0.0621
- state_Kerala: 0.0589
- state_Bihar: 0.0549
- lag_inspections: 0.0539
- state_Central Sphere: 0.0458
- state_Gujarat: 0.0111
```

### Why This Model is Explainable
- Predictions directly reflect **historical violation density per inspection** (`lag_irregularity_rate`) and **scheduled employment vulnerability multipliers**.
- When a worker in Construction or Security Services queries risk, the model output explains that elevated risk stems from subcontracting layers and high violation hit rates in published Labour Bureau inspections.

---

## 6. Known Limitations & Caveats

1. **Honest Interpretation of Baseline & Feature Importances**:
   Crucially, because the naive persistence baseline (predicting each state-sector's prior year label unchanged) achieves performance virtually identical to the Random Forest (97.92% vs. 97.92% accuracy, 0.9792 vs. 0.9792 macro F1), the model's primary value is in confirming and quantifying structural persistence and providing calibrated probabilities alongside statutory wage ratios, rather than in discovering novel predictive risk signal.
2. **State Inspection Heterogeneity (The Inspection Density Paradox)**:
   - High-enforcement states (Tamil Nadu with 75,000+ inspections, Kerala with 100,000+ irregularities) report far more aggressively than states with passive inspectorates.
   - While normalizing by inspection count mitigates this, states that conduct fewer than 5,000 inspections statewide have higher sampling variance.
3. **Missing Government Returns & Small-Sample Caveats**:
   - States with unsubmitted returns (e.g. Bihar in 2019/2020 marked "Return Not Received") have lower statistical reliability. The model flags these with `data_confidence = "Low"`.
   - In slice evaluations, subsets with tiny sample sizes (such as the Low Confidence tier with $n=8$) are reported as N/A rather than displaying deceptively perfect figures.
4. **Sector Disaggregation Assumption**:
   - Central Sphere and state tables report inspections at state aggregation; sectoral hazard multipliers are calibrated using Periodic Labour Force Survey (PLFS) informal workforce distributions and CAIU inspection targets.
5. **Inflation & Rate Freshness**:
   - Minimum wage levels require half-yearly updates as states publish new Variable Dearness Allowance (VDA) notifications.
