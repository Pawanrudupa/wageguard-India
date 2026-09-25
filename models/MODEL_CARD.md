# Model Card: State/Sector Wage-Theft Risk Model

## 1. Model Details
- **Model Name**: WageGuard State/Sector Risk Classifier
- **Model Architecture**: RandomForest_depth4 (`scikit-learn` Pipeline)
- **Model Version**: 1.0.0
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
- **Temporal Chronological Split (Strictly No Random Split)**:
  - **Training Set (Years 2018–2021)**: 384 state-sector-year observations.
  - **Validation Set (Year 2022)**: 96 state-sector-year observations.
  - **Rationale**: Random cross-validation leaks temporal trends and macroeconomic autocorrelation across years. Evaluating strictly on the unseen future year (2022) tests real-world forward predictive validity.
- **Preprocessing & Featurization Ordering**:
  - Categorical Features (`state`, `sector`): `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` fitted strictly on training data.
  - Numerical Features (`lag_irregularity_rate`, `lag_inspections`, `lag_complaints`, `min_wage_ratio`): `StandardScaler()` fitted strictly on training data.
  - **National Median Wage Benchmark**: INR 481.00/day calculated exclusively on training years (2018–2021).

---

## 4. Evaluation Results (2022 Validation Set)

### Overall Performance
- **Validation Accuracy**: 97.92%
- **Macro Average F1-Score**: 0.9792
- **Weighted Average F1-Score**: 0.9792

### Per-Class Metrics
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
| Data Confidence Level | Observations | Accuracy | Macro F1-Score | State Examples |
|---|---|---|---|---|
| **High Confidence** | 56 | 98.2% | 0.9786 | Delhi, Maharashtra, Karnataka, Tamil Nadu, Kerala, Telangana, Central Sphere |
| **Medium Confidence** | 32 | 96.9% | 0.9714 | West Bengal, Gujarat, Uttar Pradesh, Rajasthan |
| **Low Confidence** | 8 | 100.0% | 1.0000 | Bihar (unsubmitted annual returns in 2019/2020) |

---

## 5. Interpretability & Top Features

Top feature contributors to risk classification:
```text
- lag_irregularity_rate: 0.3944
- min_wage_ratio: 0.1144
- lag_complaints: 0.1074
- lag_inspections: 0.0943
- state_Tamil Nadu: 0.0653
- state_Kerala: 0.0477
- state_Telangana: 0.0420
- state_Bihar: 0.0374
- state_Central Sphere: 0.0345
- state_Maharashtra: 0.0098
```

### Why This Model is Explainable
- Predictions directly reflect **historical violation density per inspection** (`lag_irregularity_rate`) and **scheduled employment vulnerability multipliers**.
- When a worker in Construction or Security Services queries risk, the model output explains that elevated risk stems from subcontracting layers and high violation hit rates in published Labour Bureau inspections.

---

## 6. Known Limitations & Caveats

1. **State Inspection Heterogeneity (The Inspection Density Paradox)**:
   - High-enforcement states (Tamil Nadu with 75,000+ inspections, Kerala with 100,000+ irregularities) report far more aggressively than states with passive inspectorates.
   - While normalizing by inspection count mitigates this, states that conduct fewer than 5,000 inspections statewide have higher sampling variance.
2. **Missing Government Returns**:
   - States with unsubmitted returns (e.g. Bihar in 2019/2020 marked "Return Not Received") have lower statistical reliability. The model flags these with `data_confidence = "Low"`.
3. **Sector Disaggregation Assumption**:
   - Central Sphere and state tables report inspections at state aggregation; sectoral hazard multipliers are calibrated using Periodic Labour Force Survey (PLFS) informal workforce distributions and CAIU inspection targets.
4. **Inflation & Rate Freshness**:
   - Minimum wage levels require half-yearly updates as states publish new Variable Dearness Allowance (VDA) notifications.
