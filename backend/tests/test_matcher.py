"""Unit tests for spatial-temporal cross-sensor matching."""

import pytest
from backend.app.schemas.common import SensorType, ClassificationType
from backend.app.services.matcher import (
    haversine_distance_m,
    time_difference_minutes,
    match_observations,
    compute_sensitivity_sweep,
)


def test_haversine_distance_calculation():
    # Distance between LA City Hall and nearby point ~1.1 km away
    d = haversine_distance_m(34.0537, -118.2427, 34.0620, -118.2380)
    assert 900.0 < d < 1200.0


def test_positive_candidate_cross_sensor_match(sample_modis_obs, sample_viirs_obs):
    # Overlap within 150m and 15 minutes
    observations = [sample_modis_obs, sample_viirs_obs]
    matched, stats = match_observations(observations, spatial_tolerance_m=1000.0, temporal_tolerance_min=60.0)

    assert stats["matched_pairs_count"] == 1
    assert stats["modis_matched_count"] == 1
    assert stats["viirs_matched_count"] == 1
    assert matched[0].classification == ClassificationType.MATCHED
    assert matched[1].classification == ClassificationType.MATCHED
    assert matched[0].matched_pair_id is not None


def test_negative_spatial_separation_match(sample_modis_obs, sample_viirs_obs):
    # Move VIIRS 5 km away
    sample_viirs_obs.latitude = 34.3500
    sample_viirs_obs.longitude = -118.1500
    observations = [sample_modis_obs, sample_viirs_obs]
    matched, stats = match_observations(observations, spatial_tolerance_m=1000.0, temporal_tolerance_min=60.0)

    assert stats["matched_pairs_count"] == 0
    assert stats["modis_only_count"] == 1
    assert stats["viirs_only_count"] == 1


def test_negative_temporal_separation_match(sample_modis_obs, sample_viirs_obs):
    # Set overpass time 3 hours apart
    sample_viirs_obs.acq_datetime_utc = "2024-08-10T17:00:00Z"
    observations = [sample_modis_obs, sample_viirs_obs]
    matched, stats = match_observations(observations, spatial_tolerance_m=1000.0, temporal_tolerance_min=60.0)

    assert stats["matched_pairs_count"] == 0
    assert stats["modis_only_count"] == 1
    assert stats["viirs_only_count"] == 1


def test_one_to_many_viirs_clustering(sample_modis_obs, sample_viirs_obs):
    # Second VIIRS point within same MODIS footprint
    viirs_2 = sample_viirs_obs.model_copy()
    viirs_2.observation_id = "viirs_test_002"
    viirs_2.latitude = 34.2530
    viirs_2.longitude = -118.1505

    observations = [sample_modis_obs, sample_viirs_obs, viirs_2]
    matched, stats = match_observations(observations, spatial_tolerance_m=1000.0, temporal_tolerance_min=60.0)

    assert stats["matched_pairs_count"] == 2
    assert stats["modis_matched_count"] == 1
    assert stats["viirs_matched_count"] == 2
