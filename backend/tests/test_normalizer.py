"""Unit tests for schema normalization and coordinate/time validation."""

import pytest
from backend.app.schemas.common import SensorType, PlatformType, ConfidenceCategory, ProcessingStatus
from backend.app.services.normalizer import (
    normalize_record,
    parse_utc_datetime,
    compute_grid_cell_id,
    compute_observation_id,
)


def test_modis_standard_schema_mapping():
    raw_row = {
        "latitude": 34.2512,
        "longitude": -118.1523,
        "brightness": 328.4,
        "scan": 1.1,
        "track": 1.0,
        "acq_date": "2024-08-10",
        "acq_time": "1335",
        "satellite": "Aqua",
        "confidence": 85,
        "version": "6.1SP",
        "bright_t31": 295.1,
        "frp": 45.2,
        "daynight": "D",
        "type": 0,
    }
    obs = normalize_record(raw_row, "sample_modis.csv", 0)
    assert obs is not None
    assert obs.sensor == SensorType.MODIS
    assert obs.platform == PlatformType.AQUA
    assert obs.confidence_category == ConfidenceCategory.HIGH
    assert obs.raw_confidence == 85
    assert obs.frp_mw == 45.2
    assert obs.acq_datetime_utc == "2024-08-10T13:35:00Z"
    assert obs.grid_cell_id.startswith("grid_1.0km_")


def test_viirs_standard_schema_mapping():
    raw_row = {
        "latitude": 34.2520,
        "longitude": -118.1515,
        "bright_ti4": 348.2,
        "scan": 0.4,
        "track": 0.4,
        "acq_date": "2024-08-10",
        "acq_time": "1350",
        "satellite": "N",
        "confidence": "high",
        "version": "1.0SP",
        "bright_ti5": 299.1,
        "frp": 28.4,
        "daynight": "D",
        "type": 0,
    }
    obs = normalize_record(raw_row, "sample_viirs.csv", 0)
    assert obs is not None
    assert obs.sensor == SensorType.VIIRS
    assert obs.platform == PlatformType.SNPP
    assert obs.confidence_category == ConfidenceCategory.HIGH
    assert obs.raw_confidence == "high"
    assert obs.frp_mw == 28.4
    assert obs.brightness_kelvin == 348.2


def test_invalid_coordinates_rejected():
    invalid_lat = {"latitude": 95.0, "longitude": -118.0, "acq_date": "2024-08-10", "acq_time": "1200"}
    assert normalize_record(invalid_lat, "test.csv", 0) is None

    invalid_lon = {"latitude": 34.0, "longitude": 195.0, "acq_date": "2024-08-10", "acq_time": "1200"}
    assert normalize_record(invalid_lon, "test.csv", 0) is None

    non_numeric = {"latitude": "invalid", "longitude": -118.0, "acq_date": "2024-08-10", "acq_time": "1200"}
    assert normalize_record(non_numeric, "test.csv", 0) is None


def test_utc_datetime_parsing():
    _, iso_str, padded = parse_utc_datetime("2024-08-15", 5)
    assert iso_str == "2024-08-15T00:05:00Z"
    assert padded == "0005"

    _, iso_str_end, padded_end = parse_utc_datetime("2024-08-15", 2359)
    assert iso_str_end == "2024-08-15T23:59:00Z"
    assert padded_end == "2359"


def test_deterministic_observation_id():
    id1 = compute_observation_id("fileA.csv", 5, "MODIS", "Aqua", 34.25, -118.15, "2024-08-10T13:35:00Z")
    id2 = compute_observation_id("fileA.csv", 5, "MODIS", "Aqua", 34.25, -118.15, "2024-08-10T13:35:00Z")
    id3 = compute_observation_id("fileB.csv", 5, "MODIS", "Aqua", 34.25, -118.15, "2024-08-10T13:35:00Z")
    assert id1 == id2
    assert id1 != id3
