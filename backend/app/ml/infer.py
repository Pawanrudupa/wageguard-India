"""Fast inference path for the risk model, called by the API layer.

Keep this lean: no training-time dependencies re-imported here beyond what's
needed to load models/risk_model.pkl and produce a prediction.
"""

# TODO: def predict_risk(state: str, sector: str) -> RiskResult: ...
