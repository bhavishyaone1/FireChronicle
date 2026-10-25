"""Pytest fixtures and test setup."""

import pytest
from datetime import datetime, timezone
from backend.app.schemas.common import SensorType, PlatformType, ProcessingStatus, ConfidenceCategory, ClassificationType
from backend.app.schemas.observation import NormalizedObservation


@pytest.fixture(scope="session", autouse=True)
def initialize_sample_data():
    from backend.app.services.pipeline import pipeline
    pipeline.initialize_default_sample_data()


@pytest.fixture
def sample_modis_obs() -> NormalizedObservation:
    """Representative MODIS observation fixture."""
    return NormalizedObservation(
        observation_id="modis_test_001",
        source_product="MODIS_SP",
        source_file="sample_modis.csv",
        source_row_id=0,
        sensor=SensorType.MODIS,
        platform=PlatformType.AQUA,
        processing_status=ProcessingStatus.SP,
        latitude=34.2512,
        longitude=-118.1523,
        acq_datetime_utc="2024-08-10T13:35:00Z",
        acq_date_utc="2024-08-10",
        acq_time_utc="1335",
        confidence_category=ConfidenceCategory.HIGH,
        raw_confidence=85,
        frp_mw=45.2,
        daynight="D",
        anomaly_type=0,
        scan_km=1.1,
        track_km=1.0,
        brightness_kelvin=328.4,
        classification=ClassificationType.MODIS_ONLY,
        grid_cell_id="grid_1.0km_3787_-10928",
    )


@pytest.fixture
def sample_viirs_obs() -> NormalizedObservation:
    """Representative VIIRS observation fixture collocated with sample_modis_obs."""
    return NormalizedObservation(
        observation_id="viirs_test_001",
        source_product="VIIRS_SNPP_SP",
        source_file="sample_viirs.csv",
        source_row_id=0,
        sensor=SensorType.VIIRS,
        platform=PlatformType.SNPP,
        processing_status=ProcessingStatus.SP,
        latitude=34.2520,
        longitude=-118.1515,
        acq_datetime_utc="2024-08-10T13:50:00Z",
        acq_date_utc="2024-08-10",
        acq_time_utc="1350",
        confidence_category=ConfidenceCategory.HIGH,
        raw_confidence="high",
        frp_mw=28.4,
        daynight="D",
        anomaly_type=0,
        scan_km=0.4,
        track_km=0.4,
        brightness_kelvin=348.2,
        classification=ClassificationType.VIIRS_ONLY,
        grid_cell_id="grid_1.0km_3787_-10928",
    )
