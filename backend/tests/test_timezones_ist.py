"""Unit tests for UTC to IST timezone conversion and sensor channel attributes."""

import pytest
from backend.app.services.normalizer import normalize_record
from backend.app.schemas.common import SensorType


def test_utc_to_ist_day_boundary():
    # Observation acquired at 2024-10-25 20:30:00 UTC
    # IST (+05:30) is 2024-10-26 02:00:00 IST (crosses into next calendar day!)
    row = {
        "latitude": 30.90,
        "longitude": 75.85,
        "acq_date": "2024-10-25",
        "acq_time": "2030",
        "confidence": "high",
        "bright_ti4": 348.5,
        "bright_ti5": 298.2,
        "frp": 25.4,
        "satellite": "NOAA-20",
    }
    obs = normalize_record(row, "test_ist.csv", 0, detected_sensor=SensorType.VIIRS)
    assert obs is not None
    assert obs.acq_datetime_utc == "2024-10-25T20:30:00Z"
    assert obs.acq_datetime_ist == "2024-10-26 02:00:00 IST"
    assert obs.india_state == "Punjab"
    assert obs.india_district == "Ludhiana"


def test_viirs_channel_names_and_kelvin():
    row = {
        "latitude": 30.45,
        "longitude": 79.40,
        "acq_date": "2024-04-15",
        "acq_time": "0800",
        "confidence": "nominal",
        "bright_ti4": 342.15,
        "bright_ti5": 296.80,
        "frp": 14.8,
        "satellite": "NOAA-21",
    }
    obs = normalize_record(row, "test_channels.csv", 0, detected_sensor=SensorType.VIIRS)
    assert obs is not None
    assert obs.brightness_channel_1 == 342.15
    assert "Band I-4" in obs.brightness_channel_1_name
    assert obs.brightness_channel_1_unit == "K"
    assert obs.brightness_channel_2 == 296.80
    assert "Band I-5" in obs.brightness_channel_2_name
    assert obs.brightness_channel_2_unit == "K"


def test_modis_channel_names_and_kelvin():
    row = {
        "latitude": 30.45,
        "longitude": 79.40,
        "acq_date": "2024-04-15",
        "acq_time": "0830",
        "confidence": 85,
        "brightness": 328.40,
        "bright_t31": 293.10,
        "frp": 42.1,
        "satellite": "Aqua",
    }
    obs = normalize_record(row, "test_modis_channels.csv", 0, detected_sensor=SensorType.MODIS)
    assert obs is not None
    assert obs.brightness_channel_1 == 328.40
    assert "Channel 21/22" in obs.brightness_channel_1_name
    assert obs.brightness_channel_1_unit == "K"
    assert obs.brightness_channel_2 == 293.10
    assert "Channel 31" in obs.brightness_channel_2_name
    assert obs.brightness_channel_2_unit == "K"
