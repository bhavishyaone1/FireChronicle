"""Tests for cross-sensor matching algorithms: Greedy vs Global Bipartite Assignment."""

import pytest
from backend.app.schemas.common import SensorType, PlatformType, ConfidenceCategory, ProcessingStatus, ClassificationType
from backend.app.schemas.observation import NormalizedObservation
from backend.app.services.matcher import match_observations, compute_match_score


def create_obs(obs_id: str, sensor: SensorType, lat: float, lon: float, dt_iso: str) -> NormalizedObservation:
    return NormalizedObservation(
        observation_id=obs_id,
        source_product="TEST",
        source_file="test.csv",
        source_row_id=1,
        sensor=sensor,
        platform=PlatformType.AQUA if sensor == SensorType.MODIS else PlatformType.SNPP,
        processing_status=ProcessingStatus.SP,
        latitude=lat,
        longitude=lon,
        acq_datetime_utc=dt_iso,
        acq_date_utc=dt_iso[:10],
        acq_time_utc=dt_iso[11:16].replace(":", ""),
        confidence_category=ConfidenceCategory.NOMINAL,
        raw_confidence=80 if sensor == SensorType.MODIS else "nominal",
        frp_mw=30.0,
        daynight="D",
        classification=ClassificationType.MODIS_ONLY if sensor == SensorType.MODIS else ClassificationType.VIIRS_ONLY,
        grid_cell_id="grid_1.0km_0_0",
    )


def test_greedy_vs_global_assignment_competing_candidates():
    """
    Scenario: 1 MODIS detection and 2 VIIRS detections within 400m and 10min.
    - Greedy (baseline) matches BOTH VIIRS detections to the single MODIS detection (1-to-many).
    - Global assignment matches only 1 VIIRS detection to the MODIS detection (1-to-1).
    - Both identify ambiguity on the contested detections.
    """
    # MODIS at origin
    m1 = create_obs("modis_01", SensorType.MODIS, 34.0000, -118.0000, "2024-08-10T13:30:00Z")
    
    # VIIRS 1: very close (100m, 5min delta)
    v1 = create_obs("viirs_01", SensorType.VIIRS, 34.0009, -118.0000, "2024-08-10T13:35:00Z")
    
    # VIIRS 2: slightly further (300m, 8min delta)
    v2 = create_obs("viirs_02", SensorType.VIIRS, 34.0027, -118.0000, "2024-08-10T13:38:00Z")
    
    obs_list = [m1, v1, v2]

    # 1. Greedy 1-to-many
    matched_greedy, stats_greedy = match_observations(
        [o.model_copy() for o in obs_list],
        spatial_tolerance_m=1000.0,
        temporal_tolerance_min=60.0,
        method="greedy"
    )
    assert stats_greedy["matched_pairs_count"] == 2
    assert stats_greedy["modis_matched_count"] == 1
    assert stats_greedy["viirs_matched_count"] == 2

    # Verify MODIS ambiguity: MODIS had 2 candidates
    m_greedy = [o for o in matched_greedy if o.observation_id == "modis_01"][0]
    assert m_greedy.is_ambiguous is True
    assert m_greedy.candidate_count == 2

    # 2. Global Optimal 1-to-1
    matched_global, stats_global = match_observations(
        [o.model_copy() for o in obs_list],
        spatial_tolerance_m=1000.0,
        temporal_tolerance_min=60.0,
        method="global_assignment"
    )
    # Only 1 pair formed under strict 1-to-1 global assignment
    assert stats_global["matched_pairs_count"] == 1
    assert stats_global["modis_matched_count"] == 1
    assert stats_global["viirs_matched_count"] == 1
    assert stats_global["viirs_only_count"] == 1

    # Closer VIIRS detection (v1) was selected by global optimization
    v1_global = [o for o in matched_global if o.observation_id == "viirs_01"][0]
    assert v1_global.classification == ClassificationType.MATCHED

    # v2 was left as unmatched in 1-to-1
    v2_global = [o for o in matched_global if o.observation_id == "viirs_02"][0]
    assert v2_global.classification == ClassificationType.VIIRS_ONLY

    # Algorithm comparison summary is properly populated
    assert "algorithm_comparison" in stats_global
    assert stats_global["algorithm_comparison"]["greedy_1toMany"]["pairs_count"] == 2
    assert stats_global["algorithm_comparison"]["global_assignment_1to1"]["pairs_count"] == 1


def test_match_score_calculation():
    """Verify composite match score boundaries and weighting."""
    # Exact collocation (0m, 0min) -> score 1.0
    perfect = compute_match_score(0.0, 0.0, 1000.0, 60.0)
    assert perfect == 1.0

    # At exact spatial boundary (1000m, 0min) -> 1.0 - (0.7 * 1.0 + 0) = 0.3
    spatial_bound = compute_match_score(1000.0, 0.0, 1000.0, 60.0)
    assert pytest.approx(spatial_bound, 0.01) == 0.30

    # At exact boundary of both (1000m, 60min) -> 0.0
    boundary = compute_match_score(1000.0, 60.0, 1000.0, 60.0)
    assert boundary == 0.0
