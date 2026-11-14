"""Unit tests for multi-pass candidate fire event grouping."""

import pytest
from backend.app.schemas.common import SensorType
from backend.app.services.normalizer import normalize_record
from backend.app.services.event_grouping import group_candidate_events


def test_event_grouping_adjacent_passes():
    # Pass 1: NOAA-20 VIIRS at 08:00 UTC
    row1 = {
        "latitude": 30.450,
        "longitude": 79.400,
        "acq_date": "2024-04-15",
        "acq_time": "0800",
        "confidence": "high",
        "bright_ti4": 345.0,
        "frp": 20.0,
        "satellite": "NOAA-20",
    }
    # Pass 2: Aqua MODIS at 08:45 UTC (45 min later, within 1 km)
    row2 = {
        "latitude": 30.453,
        "longitude": 79.404,
        "acq_date": "2024-04-15",
        "acq_time": "0845",
        "confidence": 90,
        "brightness": 332.0,
        "frp": 50.0,
        "satellite": "Aqua",
    }
    # Pass 3: Distant detection 200 km away in Punjab at same time
    row3 = {
        "latitude": 30.900,
        "longitude": 75.850,
        "acq_date": "2024-04-15",
        "acq_time": "0845",
        "confidence": 80,
        "brightness": 325.0,
        "frp": 30.0,
        "satellite": "Aqua",
    }

    obs1 = normalize_record(row1, "f1.csv", 0, detected_sensor=SensorType.VIIRS)
    obs2 = normalize_record(row2, "f2.csv", 1, detected_sensor=SensorType.MODIS)
    obs3 = normalize_record(row3, "f3.csv", 2, detected_sensor=SensorType.MODIS)

    events = group_candidate_events([obs1, obs2, obs3], spatial_radius_km=1.5, temporal_gap_hours=24.0)
    
    # Expect 2 distinct events: Chamoli cluster (obs1 + obs2) and Punjab cluster (obs3)
    assert len(events) == 2
    
    chamoli_event = next(e for e in events if e["india_state"] == "Uttarakhand")
    assert chamoli_event["total_detections"] == 2
    assert chamoli_event["sensor_breakdown"]["MODIS"] == 1
    assert chamoli_event["sensor_breakdown"]["VIIRS"] == 1
    # Max FRP must be max individual (50.0), never summed (70.0)
    assert chamoli_event["max_frp_mw"] == 50.0
    assert obs1.event_id == chamoli_event["event_id"]
    assert obs2.event_id == chamoli_event["event_id"]
