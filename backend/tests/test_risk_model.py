"""Unit tests for the risk inference module and trained model artifact."""

from pathlib import Path
import pytest

from app.ml.infer import predict_risk, get_model_artifact, RiskResult


def test_model_artifact_loaded():
    """Verify that models/risk_model.pkl exists, loads cleanly, and contains required metadata."""
    artifact = get_model_artifact()

    assert "pipeline" in artifact
    assert "classes" in artifact
    assert "lookup" in artifact
    assert "metrics" in artifact
    assert "valid_states" in artifact
    assert "valid_sectors" in artifact

    assert artifact["classes"] == ["Low", "Medium", "High"]
    assert len(artifact["lookup"]) > 0
    assert artifact["metrics"]["accuracy"] > 0.80
    assert artifact["metrics"]["macro_f1"] > 0.80


def test_predict_risk_known_pairs():
    """Verify predict_risk for primary launch states and high-vulnerability sectors."""
    test_cases = [
        ("Delhi", "Construction"),
        ("Maharashtra", "Domestic Work"),
        ("Karnataka", "Retail & Commercial"),
        ("Tamil Nadu", "Manufacturing & Factories"),
        ("Kerala", "Security & Facility"),
        ("Telangana", "Construction"),
        ("Central Sphere", "Transport & Logistics"),
    ]

    for state, sector in test_cases:
        res = predict_risk(state, sector)

        assert isinstance(res, RiskResult)
        assert res.state == state
        assert res.sector == sector
        assert res.risk_label in {"Low", "Medium", "High"}
        assert res.data_confidence in {"High", "Medium", "Low"}
        assert res.current_min_wage_rate > 0
        assert res.irregularity_rate >= 0
        assert len(res.explanation) > 20

        # Latency check: Must be well under 100ms
        assert res.inference_time_ms < 100.0, f"Inference took {res.inference_time_ms} ms, expected < 100ms"

        # Mandatory disclaimer in explanation
        assert "not an accusation against any specific employer" in res.explanation


def test_predict_risk_normalization():
    """Verify state name normalization in the inference path."""
    res1 = predict_risk("nct of delhi", "Construction")
    assert res1.state == "Delhi"

    res2 = predict_risk("tamilnadu", "Retail & Commercial")
    assert res2.state == "Tamil Nadu"

    res3 = predict_risk("mh", "Domestic Work")
    assert res3.state == "Maharashtra"


def test_predict_risk_sparse_state_confidence():
    """Verify that states with reporting gaps (like Bihar) return Low data_confidence and note."""
    res = predict_risk("Bihar", "Agriculture & Allied")

    assert res.state == "Bihar"
    assert res.data_confidence == "Low"
    assert "reporting gaps" in res.explanation.lower() or "unsubmitted" in res.explanation.lower()


def test_predict_risk_unseen_state_fallback():
    """Verify graceful pipeline fallback for unseen state-sector pairs."""
    res = predict_risk("Goa", "Construction")

    assert isinstance(res, RiskResult)
    assert res.state == "Goa"
    assert res.risk_label in {"Low", "Medium", "High"}
    assert res.inference_time_ms < 100.0


def test_risk_result_to_dict():
    """Verify dictionary serialization for API layer compatibility."""
    res = predict_risk("Delhi", "Construction")
    d = res.to_dict()

    expected_keys = {
        "state",
        "sector",
        "risk_label",
        "explanation",
        "data_confidence",
        "irregularity_rate",
        "current_min_wage_rate",
        "probabilities",
        "inference_time_ms",
    }
    assert set(d.keys()) == expected_keys
    assert d["state"] == "Delhi"
    assert d["risk_label"] == res.risk_label
