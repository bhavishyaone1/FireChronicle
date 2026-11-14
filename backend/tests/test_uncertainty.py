"""
Tests for Bootstrap Confidence Intervals and Empirical Sensitivity Engine.
"""

import pytest
import numpy as np
from backend.app.analytics.uncertainty import (
    compute_bootstrap_ci,
    compute_matched_fraction_uncertainty,
    compute_jaccard_uncertainty,
    compute_empirical_sensitivity_curves,
)


def test_bootstrap_ci_coverage_and_reproducibility():
    """Verify bootstrap confidence interval bounds and seed determinism."""
    # Fixed synthetic sample with known mean ~ 0.5
    data = np.array([0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1])
    
    res1 = compute_bootstrap_ci(data, stat_fn=lambda x: float(np.mean(x)), n_bootstraps=500, seed=42)
    res2 = compute_bootstrap_ci(data, stat_fn=lambda x: float(np.mean(x)), n_bootstraps=500, seed=42)

    assert res1["point_estimate"] == res2["point_estimate"]
    assert res1["ci_lower"] == res2["ci_lower"]
    assert res1["ci_upper"] == res2["ci_upper"]
    assert res1["ci_lower"] <= res1["point_estimate"] <= res1["ci_upper"]
    assert res1["sample_size_n"] == len(data)


def test_matched_fraction_uncertainty():
    """Test bootstrap interval around matched fractions."""
    matches = [True] * 80 + [False] * 20  # 80% matched out of 100
    res = compute_matched_fraction_uncertainty(matches, n_bootstraps=500, seed=123)

    assert res["point_estimate"] == 0.80
    assert 0.70 <= res["ci_lower"] <= 0.80
    assert 0.80 <= res["ci_upper"] <= 0.90
    assert res["sample_size_n"] == 100


def test_jaccard_uncertainty():
    """Test multi-day spatial Jaccard bootstrap."""
    day1_m = {"cell_1", "cell_2", "cell_3"}
    day1_v = {"cell_2", "cell_3", "cell_4"}  # Jaccard = 2/4 = 0.5

    day2_m = {"cell_5", "cell_6"}
    day2_v = {"cell_5", "cell_6"}  # Jaccard = 2/2 = 1.0

    res = compute_jaccard_uncertainty([day1_m, day2_m], [day1_v, day2_v], n_bootstraps=500, seed=42)
    assert res["point_estimate"] == 0.75
    assert res["sample_size_n"] == 2
    assert res["ci_lower"] <= 0.75 <= res["ci_upper"]


def test_empirical_sensitivity_curves():
    """Test un-modeled sensitivity curve computation."""
    candidate_pairs = [
        {"modis_id": "M1", "viirs_id": "V1", "distance_m": 400.0, "time_delta_min": 20.0},
        {"modis_id": "M1", "viirs_id": "V2", "distance_m": 600.0, "time_delta_min": 25.0},
        {"modis_id": "M2", "viirs_id": "V3", "distance_m": 900.0, "time_delta_min": 50.0},
        {"modis_id": "M3", "viirs_id": "V4", "distance_m": 1400.0, "time_delta_min": 75.0},
    ]

    res = compute_empirical_sensitivity_curves(
        candidate_pairs,
        modis_total=5,
        viirs_total=5,
        distance_thresholds_m=[500.0, 1000.0, 1500.0],
        time_thresholds_min=[30.0, 60.0, 120.0],
    )

    spatial = res["spatial_sensitivity_curve"]
    # At 500m (fixed 60 min): only M1-V1 (400m, 20m) qualifies -> 1 pair, 1 MODIS
    assert spatial[0]["tolerance_m"] == 500.0
    assert spatial[0]["matched_pairs"] == 1
    assert spatial[0]["modis_matched_count"] == 1

    # At 1000m: M1-V1 (400m), M1-V2 (600m), M2-V3 (900m) -> 3 pairs, 2 MODIS
    assert spatial[1]["tolerance_m"] == 1000.0
    assert spatial[1]["matched_pairs"] == 3
    assert spatial[1]["modis_matched_count"] == 2
