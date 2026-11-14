"""Tests for missing data, sensor coverage, and data availability handling."""

import pytest
from datetime import date
from backend.app.schemas.common import CoverageStatus, SensorType, SourceAgency, PlatformType, ProcessingStatus, ConfidenceCategory
from backend.app.schemas.calendar import CalendarDaySummary
from backend.app.schemas.observation import NormalizedObservation
from backend.app.services.aggregator import aggregate_calendar


def test_missing_coverage_distinct_from_zero_detections():
    """Verify that no-pass or cloud-obscured day is structurally distinct from a verified zero-fire day."""
    zero_day = CalendarDaySummary(
        date="2024-08-01",
        modis_raw_count=0,
        viirs_raw_count=0,
        total_raw_count=0,
        unique_active_cells=0,
        matched_active_cells=0,
        modis_only_cells=0,
        viirs_only_cells=0,
        coverage_status=CoverageStatus.FULL,  # Monitored, active pass, no hotspot
    )

    no_pass_day = CalendarDaySummary(
        date="2024-08-02",
        modis_raw_count=0,
        viirs_raw_count=0,
        total_raw_count=0,
        unique_active_cells=0,
        matched_active_cells=0,
        modis_only_cells=0,
        viirs_only_cells=0,
        coverage_status=CoverageStatus.NO_PASS,  # Satellite did not overpass AOI
    )

    cloud_obscured_day = CalendarDaySummary(
        date="2024-08-03",
        modis_raw_count=0,
        viirs_raw_count=0,
        total_raw_count=0,
        unique_active_cells=0,
        matched_active_cells=0,
        modis_only_cells=0,
        viirs_only_cells=0,
        coverage_status=CoverageStatus.CLOUD_OBSCURED,  # 100% cloud cover
    )

    assert zero_day.coverage_status == CoverageStatus.FULL
    assert no_pass_day.coverage_status == CoverageStatus.NO_PASS
    assert cloud_obscured_day.coverage_status == CoverageStatus.CLOUD_OBSCURED
    assert no_pass_day.coverage_status != zero_day.coverage_status


def test_calendar_preserves_zero_detection_sequence():
    """Test calendar aggregation over a 3-day sequence with no detections."""
    res = aggregate_calendar(
        observations=[],
        aoi_bbox=[68.1, 6.5, 97.4, 37.1],
        start_date="2024-08-01",
        end_date="2024-08-03",
        grid_size_km=1.0,
    )

    assert len(res.days) == 3
    for day in res.days:
        assert day.total_raw_count == 0
        assert day.unique_active_cells == 0
        assert day.mean_frp_modis is None
        assert day.mean_frp_viirs is None
        assert day.coverage_status == CoverageStatus.FULL


def test_missing_optional_fields_remain_null():
    """Test that absent attributes in raw records deserialize to None, never manufactured numbers."""
    obs = NormalizedObservation(
        observation_id="test_missing_fields_001",
        source_agency=SourceAgency.NASA_FIRMS,
        source_product="MODIS_SP",
        source_file="sample.csv",
        source_row_id=1,
        sensor=SensorType.MODIS,
        platform=PlatformType.AQUA,
        processing_status=ProcessingStatus.SP,
        latitude=28.5,
        longitude=77.2,
        acq_datetime_utc="2024-08-10T08:30:00Z",
        acq_date_utc="2024-08-10",
        acq_time_utc="0830",
        confidence_category=ConfidenceCategory.NOMINAL,
        raw_confidence=60,
        frp_mw=None,  # missing FRP
        brightness_kelvin=None,  # missing brightness
        daynight="D",
        anomaly_type=None,
        fsi_alert_id=None,
        bhuvan_record_id=None,
    )

    assert obs.frp_mw is None
    assert obs.brightness_kelvin is None
    assert obs.anomaly_type is None
    assert obs.fsi_alert_id is None
    assert obs.bhuvan_record_id is None
