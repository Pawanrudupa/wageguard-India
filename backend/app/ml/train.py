"""Training pipeline for the state/sector wage-theft risk model."""

import json
import os
from pathlib import Path
import pickle
import sys
import time

# Ensure backend directory is in python path
backend_dir = Path(__file__).resolve().parents[2]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.ml.data_pipeline import normalize_state_name


def load_and_prepare_features(csv_path: Path) -> Tuple[pd.DataFrame, float]:
    """Load processed dataset, compute lag indicators, and chronological median wages."""
    if not csv_path.exists():
        raise FileNotFoundError(f"Processed dataset not found at {csv_path}")

    df = pd.read_csv(csv_path)
    df["state"] = df["state"].apply(normalize_state_name)
    df = df.sort_values(by=["state", "sector", "year"]).reset_index(drop=True)

    # 1-year lag features to capture historical baseline and momentum
    df["lag_irregularity_rate"] = df.groupby(["state", "sector"])["irregularity_rate"].shift(1)
    df["lag_irregularity_rate"] = df["lag_irregularity_rate"].fillna(df["irregularity_rate"])

    df["lag_inspections"] = df.groupby(["state", "sector"])["inspections_conducted"].shift(1)
    df["lag_inspections"] = df["lag_inspections"].fillna(df["inspections_conducted"])

    df["lag_complaints"] = df.groupby(["state", "sector"])["complaints_received"].shift(1)
    df["lag_complaints"] = df["lag_complaints"].fillna(df["complaints_received"])

    # Compute national median wage strictly on earlier training years to prevent leakage
    train_mask = df["year"] < 2022
    national_median_wage = float(df.loc[train_mask, "current_min_wage_rate"].median())

    df["min_wage_ratio"] = df["current_min_wage_rate"] / national_median_wage

    return df, national_median_wage


def train_and_evaluate_models(
    df: pd.DataFrame,
    val_year: int = 2022,
) -> Dict[str, Any]:
    """Perform time-based train/val split, train baseline and tree models, and evaluate."""
    # Chronological Split (Train: < val_year, Val: == val_year)
    train_df = df[df["year"] < val_year].copy()
    val_df = df[df["year"] == val_year].copy()

    features_cat = ["state", "sector"]
    features_num = ["lag_irregularity_rate", "lag_inspections", "lag_complaints", "min_wage_ratio"]
    feature_cols = features_cat + features_num

    X_train = train_df[feature_cols]
    y_train = train_df["risk_label"]
    X_val = val_df[feature_cols]
    y_val = val_df["risk_label"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), features_cat),
            ("num", StandardScaler(), features_num),
        ]
    )

    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "RandomForest_depth4": RandomForestClassifier(
            max_depth=4, n_estimators=100, random_state=42
        ),
    }

    results = {}
    best_model_name = None
    best_f1 = -1.0
    best_pipeline = None

    classes = ["Low", "Medium", "High"]

    for name, clf in models.items():
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", clf),
        ])

        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_val)

        report = classification_report(y_val, preds, output_dict=True, zero_division=0)
        conf_mat = confusion_matrix(y_val, preds, labels=classes)
        macro_f1 = float(report["macro avg"]["f1-score"])

        results[name] = {
            "pipeline": pipeline,
            "report": report,
            "confusion_matrix": conf_mat.tolist(),
            "macro_f1": macro_f1,
            "accuracy": float(report["accuracy"]),
        }

        if macro_f1 > best_f1:
            best_f1 = macro_f1
            best_model_name = name
            best_pipeline = pipeline

    # Slice evaluation on validation set: High Confidence vs Low Confidence states
    val_df_copy = val_df.copy()
    val_df_copy["predicted_risk"] = best_pipeline.predict(X_val)

    slice_eval = {}
    for conf_level in ["High", "Medium", "Low"]:
        subset = val_df_copy[val_df_copy["data_confidence"] == conf_level]
        if not subset.empty:
            sub_acc = float((subset["risk_label"] == subset["predicted_risk"]).mean())
            sub_f1 = float(f1_score(subset["risk_label"], subset["predicted_risk"], average="macro", zero_division=0))
            slice_eval[conf_level] = {
                "count": len(subset),
                "accuracy": round(sub_acc, 4),
                "macro_f1": round(sub_f1, 4),
            }

    # Extract feature importances if Random Forest
    classifier = best_pipeline.named_steps["classifier"]
    encoded_cat_names = list(best_pipeline.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(features_cat))
    all_feature_names = encoded_cat_names + features_num

    feature_importances = {}
    if hasattr(classifier, "feature_importances_"):
        importances = classifier.feature_importances_
        for f_name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)[:10]:
            feature_importances[f_name] = round(float(imp), 4)

    return {
        "best_model_name": best_model_name,
        "best_pipeline": best_pipeline,
        "results": results,
        "slice_eval": slice_eval,
        "feature_importances": feature_importances,
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "feature_names": feature_cols,
    }


def generate_state_sector_lookup(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Build fast in-memory lookup table of latest metrics and confidence per state-sector."""
    lookup: Dict[str, Dict[str, Any]] = {}
    # Sort so latest year comes last
    sorted_df = df.sort_values(by=["state", "sector", "year"])

    for (state, sector), group in sorted_df.groupby(["state", "sector"]):
        latest = group.iloc[-1]
        key = f"{state.strip().title()}::{sector.strip()}"
        lookup[key] = {
            "state": state,
            "sector": sector,
            "latest_year": int(latest["year"]),
            "current_min_wage_rate": float(latest["current_min_wage_rate"]),
            "irregularity_rate": float(latest["irregularity_rate"]),
            "risk_label": str(latest["risk_label"]),
            "data_confidence": str(latest["data_confidence"]),
            "inspections_conducted": int(latest["inspections_conducted"]),
            "irregularities_detected": int(latest["irregularities_detected"]),
            "complaints_received": int(latest["complaints_received"]),
            "prosecutions": int(latest["prosecutions"]),
            "convictions": int(latest["convictions"]),
            "reporting_years_count": int(len(group[group["inspections_conducted"] > 0])),
        }
    return lookup


def generate_model_card(
    eval_data: Dict[str, Any],
    national_median_wage: float,
    output_path: Path,
) -> None:
    """Generate MODEL_CARD.md documenting architecture, time split, and known limitations."""
    best_name = eval_data["best_model_name"]
    res = eval_data["results"][best_name]
    report = res["report"]
    cm = res["confusion_matrix"]
    slices = eval_data["slice_eval"]
    importances = eval_data["feature_importances"]

    model_card_content = f"""# Model Card: State/Sector Wage-Theft Risk Model

## 1. Model Details
- **Model Name**: WageGuard State/Sector Risk Classifier
- **Model Architecture**: {best_name} (`scikit-learn` Pipeline)
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
  - **Training Set (Years 2018–2021)**: {eval_data["train_samples"]} state-sector-year observations.
  - **Validation Set (Year 2022)**: {eval_data["val_samples"]} state-sector-year observations.
  - **Rationale**: Random cross-validation leaks temporal trends and macroeconomic autocorrelation across years. Evaluating strictly on the unseen future year (2022) tests real-world forward predictive validity.
- **Preprocessing & Featurization Ordering**:
  - Categorical Features (`state`, `sector`): `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` fitted strictly on training data.
  - Numerical Features (`lag_irregularity_rate`, `lag_inspections`, `lag_complaints`, `min_wage_ratio`): `StandardScaler()` fitted strictly on training data.
  - **National Median Wage Benchmark**: INR {national_median_wage:.2f}/day calculated exclusively on training years (2018–2021).

---

## 4. Evaluation Results (2022 Validation Set)

### Overall Performance
- **Validation Accuracy**: {res["accuracy"] * 100:.2f}%
- **Macro Average F1-Score**: {res["macro_f1"]:.4f}
- **Weighted Average F1-Score**: {report["weighted avg"]["f1-score"]:.4f}

### Per-Class Metrics
| Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| **Low Risk** | {report["Low"]["precision"]:.4f} | {report["Low"]["recall"]:.4f} | {report["Low"]["f1-score"]:.4f} | {report["Low"]["support"]} |
| **Medium Risk** | {report["Medium"]["precision"]:.4f} | {report["Medium"]["recall"]:.4f} | {report["Medium"]["f1-score"]:.4f} | {report["Medium"]["support"]} |
| **High Risk** | {report["High"]["precision"]:.4f} | {report["High"]["recall"]:.4f} | {report["High"]["f1-score"]:.4f} | {report["High"]["support"]} |

### Confusion Matrix (Rows = Actual, Columns = Predicted: Low, Medium, High)
```text
           Predicted Low   Predicted Medium   Predicted High
Actual Low       {cm[0][0]:<15} {cm[0][1]:<18} {cm[0][2]}
Actual Med       {cm[1][0]:<15} {cm[1][1]:<18} {cm[1][2]}
Actual High      {cm[2][0]:<15} {cm[2][1]:<18} {cm[2][2]}
```

### Slice-Based Performance Analysis (By Data Confidence Tier)
| Data Confidence Level | Observations | Accuracy | Macro F1-Score | State Examples |
|---|---|---|---|---|
| **High Confidence** | {slices.get("High", {}).get("count", 0)} | {slices.get("High", {}).get("accuracy", 0.0) * 100:.1f}% | {slices.get("High", {}).get("macro_f1", 0.0):.4f} | Delhi, Maharashtra, Karnataka, Tamil Nadu, Kerala, Telangana, Central Sphere |
| **Medium Confidence** | {slices.get("Medium", {}).get("count", 0)} | {slices.get("Medium", {}).get("accuracy", 0.0) * 100:.1f}% | {slices.get("Medium", {}).get("macro_f1", 0.0):.4f} | West Bengal, Gujarat, Uttar Pradesh, Rajasthan |
| **Low Confidence** | {slices.get("Low", {}).get("count", 0)} | {slices.get("Low", {}).get("accuracy", 0.0) * 100:.1f}% | {slices.get("Low", {}).get("macro_f1", 0.0):.4f} | Bihar (unsubmitted annual returns in 2019/2020) |

---

## 5. Interpretability & Top Features

Top feature contributors to risk classification:
```text
{chr(10).join(f"- {k}: {v:.4f}" for k, v in importances.items())}
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
"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(model_card_content)


def main():
    repo_root = Path(__file__).resolve().parents[3]
    csv_path = repo_root / "data" / "processed" / "state_sector_risk.csv"
    model_artifact_path = repo_root / "models" / "risk_model.pkl"
    model_card_path = repo_root / "models" / "MODEL_CARD.md"

    print("--- 1. Loading and preparing features ---")
    df, national_median_wage = load_and_prepare_features(csv_path)

    print("--- 2. Training models with chronological validation (2018-2021 -> 2022) ---")
    eval_data = train_and_evaluate_models(df, val_year=2022)

    best_name = eval_data["best_model_name"]
    res = eval_data["results"][best_name]
    print(f"\nBest Model: {best_name}")
    print(f"Validation Accuracy: {res['accuracy'] * 100:.2f}%")
    print(f"Validation Macro F1: {res['macro_f1']:.4f}")

    print("--- 3. Generating state-sector lookup cache ---")
    lookup = generate_state_sector_lookup(df)

    print(f"--- 4. Saving artifact to {model_artifact_path} ---")
    artifact = {
        "pipeline": eval_data["best_pipeline"],
        "model_name": best_name,
        "classes": ["Low", "Medium", "High"],
        "national_median_wage": national_median_wage,
        "feature_names": eval_data["feature_names"],
        "feature_importances": eval_data["feature_importances"],
        "metrics": {
            "accuracy": res["accuracy"],
            "macro_f1": res["macro_f1"],
            "confusion_matrix": res["confusion_matrix"],
            "slice_eval": eval_data["slice_eval"],
        },
        "lookup": lookup,
        "valid_states": sorted(list(df["state"].unique())),
        "valid_sectors": sorted(list(df["sector"].unique())),
        "updated_at": "2026-09-25",
    }

    model_artifact_path.parent.mkdir(parents=True, exist_ok=True)
    with open(model_artifact_path, "wb") as f:
        pickle.dump(artifact, f)

    print(f"--- 5. Generating Model Card at {model_card_path} ---")
    generate_model_card(eval_data, national_median_wage, model_card_path)

    print("\nTraining workflow completed successfully!")


if __name__ == "__main__":
    main()
