"""Unit tests for burning activity calendar aggregation."""

import pytest
from backend.app.schemas.common import SensorType
from backend.app.services.aggregator import aggregate_calendar


def test_unique_active_cells_eliminates_point_density_bias(sample_modis_obs, sample_viirs_obs):
    """
    Verify that multiple VIIRS detections inside one equal-area grid cell
    collapse to 1 active cell, rendering the metric resolution-insensitive.
    """
    # Create 3 VIIRS points all inside the exact same grid cell as MODIS
    v1 = sample_viirs_obs.model_copy()
    v2 = sample_viirs_obs.model_copy()
    v2.observation_id = "viirs_002"
    v3 = sample_viirs_obs.model_copy()
    v3.observation_id = "viirs_003"

    observations = [sample_modis_obs, v1, v2, v3]
    calendar = aggregate_calendar(
        observations=observations,
        aoi_bbox=[-118.6, 34.1, -117.8, 34.5],
        start_date="2024-08-10",
        end_date="2024-08-10",
        grid_size_km=1.0,
    )

    day = calendar.days[0]
    assert day.modis_raw_count == 1
    assert day.viirs_raw_count == 3
    assert day.total_raw_count == 4
    # Harmonized metric MUST be 1 active cell, NOT 4!
    assert day.unique_active_cells == 1


def test_frp_non_duplication_rule(sample_modis_obs, sample_viirs_obs):
    """Verify that collocated MODIS and VIIRS observations do NOT have their FRP summed."""
    sample_modis_obs.frp_mw = 50.0
    sample_viirs_obs.frp_mw = 35.0

    observations = [sample_modis_obs, sample_viirs_obs]
    calendar = aggregate_calendar(
        observations=observations,
        aoi_bbox=[-118.6, 34.1, -117.8, 34.5],
        start_date="2024-08-10",
        end_date="2024-08-10",
    )

    day = calendar.days[0]
    assert day.mean_frp_modis == 50.0
    assert day.mean_frp_viirs == 35.0
    # Confirms FRP values remain sensor-specific and never summed to 85.0
