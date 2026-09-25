# Workflow: Train the state/sector wage-theft risk model

**Prerequisite**: `data/processed/state_sector_risk.csv` exists (Workflow 01).

## Steps
1. In `backend/app/ml/train.py`: load the processed dataset, split by year (train on
   earlier years, validate on the most recent year available) — NOT a random split,
   since this is time-series-ish data and a random split would leak information.
2. Features: sector, state (encoded), historical irregularity_rate trend,
   inspections-per-registered-establishment if available, current minimum wage level
   relative to national median. Keep the feature set small and explainable — this is a
   policy-adjacent tool, a black-box model is a liability here.
3. Model: start with a simple, interpretable baseline (logistic regression or a shallow
   gradient-boosted tree with `max_depth` capped) predicting the `risk_label` tertile.
   Only move to a more complex model if the baseline is clearly insufficient, and if so,
   add SHAP or feature-importance output so the risk score can be explained to a user
   ("this sector's risk is elevated mainly because of X").
4. Evaluate with a confusion matrix and per-class precision/recall — for a resume
   project, a clearly-documented honest evaluation (including where the model is
   unreliable, e.g. states with sparse data) is more valuable than a suspiciously high
   accuracy number.
5. Save the trained model artifact to `models/risk_model.pkl` plus a
   `models/MODEL_CARD.md` documenting: training data date range, features used, known
   limitations (e.g. "predictions for states with < N inspection-years of data are
   low-confidence"), and intended use ("state/sector-level risk context, NOT an
   accusation against any individual employer").
6. Write `backend/app/ml/infer.py` with a small, fast `predict_risk(state, sector) ->
   RiskResult` function the API layer will call — inference code must not re-import
   pandas/sklearn training utilities it doesn't need, keep it lean for serving.

## Definition of done
- `models/risk_model.pkl` + `models/MODEL_CARD.md` exist.
- `backend/app/ml/infer.py` returns a risk result in well under 100ms for a given
  state+sector.
- A unit test in `backend/tests/test_risk_model.py` checks that `predict_risk` returns a
  valid label for a known state/sector pair.
