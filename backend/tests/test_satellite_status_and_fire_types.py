"""Unit & integration tests for Satellite Constellation Status and Fire Type Intelligence."""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.fire_type_intelligence import (
    classify_fire_type,
    FIRMS_REPORTED_TYPE_MAP,
    NRT_INFERRED_METHOD_MAP,
)
from backend.app.services.storage import storage_engine


@pytest.fixture
def client():
    return TestClient(app)


def test_satellite_config_file_integrity():
    """Verify satellites.json follows NASA FIRMS mission status facts exactly."""
    config_path = Path(__file__).resolve().parent.parent / "app" / "config" / "satellites.json"
    assert config_path.exists(), "satellites.json must exist"

    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["last_verified_utc"] == "2026-11-02"
    assert "firms.modaps.eosdis.nasa.gov" in data["verification_source_url"]

    timeline = data["timeline_overview"]
    assert "2000" in timeline["modis_span"] and "2027" in timeline["modis_span"]
    assert "2012" in timeline["viirs_span"]
    assert timeline["snpp_end_date"] == "2026-11-02"
    assert timeline["noaa20_start_year"] == 2018
    assert timeline["noaa21_start_year"] == 2023
    assert "2027" in timeline["terra_planned_end"]
    assert "2027" in timeline["aqua_planned_end"]

    sats = {s["id"]: s for s in data["satellites"]}
    assert len(sats) == 5

    # Suomi NPP
    snpp = sats["snpp_viirs"]
    assert "Ended — NASA stopped new FIRMS data on 2026-11-02; historical archive only" in snpp["status"]
    assert snpp["status_type"] == "ended"

    # NOAA-20 & NOAA-21
    assert sats["noaa20_viirs"]["status"] == "Active"
    assert sats["noaa20_viirs"]["status_type"] == "active"
    assert sats["noaa21_viirs"]["status"] == "Active"
    assert sats["noaa21_viirs"]["status_type"] == "active"

    # Terra MODIS
    terra = sats["terra_modis"]
    assert "Active, only morning overpass; planned end ~Jan 2027" in terra["status"]

    # Aqua MODIS
    aqua = sats["aqua_modis"]
    assert "Active; planned end ~Sep 2027" in aqua["status"]


def test_fire_type_standard_reported():
    """Verify standard-quality FIRMS type 0, 1, 2, 3 are reported honestly."""
    for type_code, expected_label in [
        (0, "Reported by FIRMS: Presumed vegetation fire (type 0)"),
        (1, "Reported by FIRMS: Active volcano (type 1)"),
        (2, "Reported by FIRMS: Other static land source (type 2)"),
        (3, "Reported by FIRMS: Offshore detection (type 3)"),
    ]:
        res = classify_fire_type(anomaly_type=type_code)
        assert res["has_firms_type"] is True
        assert res["raw_firms_type"] == type_code
        assert res["display_label"] == expected_label
        assert res["source_provenance"] == "Reported by FIRMS"
        assert res["is_inferred"] is False
        assert "wildfire" not in res["display_label"].lower()


def test_fire_type_nrt_inferred_marked_as_inferred():
    """Verify missing type field in NRT data shows 'Type not provided in NRT data' and marks 'Inferred (method)'."""
    # Crop residue
    crop = classify_fire_type(anomaly_type=None, context_class="LIKELY_AGRICULTURAL_CONTEXT")
    assert crop["has_firms_type"] is False
    assert crop["raw_firms_type"] is None
    assert crop["is_inferred"] is True
    assert crop["source_provenance"] == "Type not provided in NRT data"
    assert "Inferred (" in crop["display_label"]
    assert "Agricultural residue context" in crop["display_label"]
    assert "wildfire" not in crop["display_label"].lower()

    # Static persistence
    static = classify_fire_type(anomaly_type=None, context_class="OTHER_STATIC_THERMAL_SOURCE")
    assert static["is_inferred"] is True
    assert "Inferred (Persistence across >=3 days)" in static["display_label"]

    # Offshore mask
    offshore = classify_fire_type(anomaly_type=None, context_class="OFFSHORE")
    assert offshore["is_inferred"] is True
    assert "Inferred (Land-Sea Boundary Mask)" in offshore["display_label"]

    # Unclassified
    unclass = classify_fire_type(anomaly_type=None, context_class=None)
    assert unclass["is_inferred"] is True
    assert unclass["source_provenance"] == "Type not provided in NRT data"
    assert "Unclassified thermal anomaly" in unclass["display_label"]


def test_api_satellites_endpoint(client):
    """Test /api/satellites returns all 5 satellites and dynamic loaded date ranges."""
    res = client.get("/api/satellites")
    assert res.status_code == 200
    data = res.json()
    assert data["last_verified_utc"] == "2026-11-02"
    assert len(data["satellites"]) == 5
    ids = [s["id"] for s in data["satellites"]]
    assert "snpp_viirs" in ids
    assert "noaa20_viirs" in ids
    assert "noaa21_viirs" in ids
    assert "terra_modis" in ids
    assert "aqua_modis" in ids


def test_api_fire_types_breakdown_endpoint(client):
    """Test /api/types/breakdown returns counts split between reported and inferred."""
    res = client.get("/api/types/breakdown")
    assert res.status_code == 200
    data = res.json()
    assert "reported_by_firms" in data
    assert "inferred_nrt" in data
    assert "scientific_disclaimer" in data
    assert "wildfire" not in data["scientific_disclaimer"].lower()


def test_api_metadata_includes_satellite_and_timeline(client):
    """Test /api/metadata includes updated satellite and timeline structures."""
    res = client.get("/api/metadata")
    assert res.status_code == 200
    data = res.json()
    assert "satellites" in data
    assert "timeline_overview" in data
    assert data["suomi_npp_lifecycle"]["cessation_date"] == "2026-11-02"
