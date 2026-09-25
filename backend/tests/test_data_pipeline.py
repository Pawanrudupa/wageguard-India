"""Unit tests for the state/sector wage risk data pipeline and feature engineering."""

from pathlib import Path
import pandas as pd
import pytest

from app.ml.data_pipeline import (
    normalize_state_name,
    calculate_irregularity_rate,
    calculate_prosecution_rate,
    calculate_conviction_rate,
    assign_risk_labels,
)


def test_normalize_state_name():
    """Verify state name normalization across variations, abbreviations, and cases."""
    assert normalize_state_name("nct of delhi") == "Delhi"
    assert normalize_state_name("Delhi") == "Delhi"
    assert normalize_state_name("  delhi  ") == "Delhi"
    assert normalize_state_name("UP") == "Uttar Pradesh"
    assert normalize_state_name("u.p.") == "Uttar Pradesh"
    assert normalize_state_name("tamilnadu") == "Tamil Nadu"
    assert normalize_state_name("TN") == "Tamil Nadu"
    assert normalize_state_name("mh") == "Maharashtra"
    assert normalize_state_name("wb") == "West Bengal"
    assert normalize_state_name("central sphere") == "Central Sphere"
    assert normalize_state_name("cirm") == "Central Sphere"
    assert normalize_state_name("karnataka") == "Karnataka"


def test_calculate_irregularity_rate_standard():
    """Test standard irregularity rate calculation."""
    rate = calculate_irregularity_rate(irregularities=25, inspections=100)
    assert rate == 0.25


def test_calculate_irregularity_rate_zero_inspections():
    """Test that zero inspections safely avoids division by zero."""
    rate = calculate_irregularity_rate(irregularities=10, inspections=0)
    assert rate == 10.0

    rate_zero_both = calculate_irregularity_rate(irregularities=0, inspections=0)
    assert rate_zero_both == 0.0


def test_calculate_prosecution_and_conviction_rates():
    """Test secondary legal enforcement rate formulas."""
    pros_rate = calculate_prosecution_rate(prosecutions=15, irregularities=60)
    assert pros_rate == 0.25

    # Safe denominator with zero irregularities
    pros_rate_zero = calculate_prosecution_rate(prosecutions=5, irregularities=0)
    assert pros_rate_zero == 5.0

    conv_rate = calculate_conviction_rate(convictions=8, prosecutions=10)
    assert conv_rate == 0.8


def test_assign_risk_labels_synthetic():
    """Test tertile bucketing on a synthetic dataframe."""
    rates = pd.Series([0.1, 0.2, 0.3, 0.7, 0.8, 0.9, 1.5, 1.8, 2.0])
    labels = assign_risk_labels(rates)

    assert len(labels) == 9
    assert set(labels.unique()).issubset({"Low", "Medium", "High"})

    # Check order preservation: lowest values get Low, highest get High
    assert labels.iloc[0] == "Low"
    assert labels.iloc[1] == "Low"
    assert labels.iloc[8] == "High"


def test_assign_risk_labels_empty():
    """Test assign_risk_labels with an empty series."""
    empty_series = pd.Series(dtype=float)
    result = assign_risk_labels(empty_series)
    assert result.empty


def test_processed_dataset_invariants():
    """Verify integrity, schema, and absence of duplicates in state_sector_risk.csv."""
    repo_root = Path(__file__).resolve().parents[2]
    processed_path = repo_root / "data" / "processed" / "state_sector_risk.csv"

    assert processed_path.exists(), f"Processed CSV not found at {processed_path}"

    df = pd.read_csv(processed_path)

    expected_columns = [
        "state",
        "sector",
        "year",
        "inspections_conducted",
        "irregularities_detected",
        "prosecutions",
        "convictions",
        "complaints_received",
        "claims_awarded",
        "current_min_wage_rate",
        "irregularity_rate",
        "risk_label",
    ]

    # Verify column existence and ordering
    assert list(df.columns) == expected_columns

    # Verify dataset is non-empty
    assert len(df) > 0

    # Verify no nulls in any field
    assert df.isnull().sum().sum() == 0

    # Verify strictly no duplicate (state, sector, year) combinations
    duplicate_count = df.duplicated(subset=["state", "sector", "year"]).sum()
    assert duplicate_count == 0, f"Found {duplicate_count} duplicate (state, sector, year) rows!"

    # Verify valid categories for risk_label
    assert set(df["risk_label"].unique()) == {"Low", "Medium", "High"}

    # Verify rates and wages are non-negative
    assert (df["current_min_wage_rate"] > 0).all()
    assert (df["irregularity_rate"] >= 0).all()
    assert (df["inspections_conducted"] >= 0).all()
    assert (df["irregularities_detected"] >= 0).all()
