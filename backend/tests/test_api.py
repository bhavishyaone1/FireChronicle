"""Integration tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint_no_secrets():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "firms_map_key" not in str(data).lower()
    assert "secret" not in str(data).lower()


def test_metadata_endpoint():
    resp = client.get("/api/metadata")
    assert resp.status_code == 200
    data = resp.json()
    assert "MODIS" in data["sensors"]
    assert "VIIRS" in data["sensors"]
    assert len(data["preset_aois"]) >= 3


def test_observations_endpoint():
    resp = client.get("/api/observations?start_date=2024-08-10&end_date=2024-08-15")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0
    first_feat = data["features"][0]
    assert "geometry" in first_feat
    assert "properties" in first_feat
    assert "sensor" in first_feat["properties"]
    assert "classification" in first_feat["properties"]


def test_calendar_endpoint():
    resp = client.get("/api/calendar?start_date=2024-08-10&end_date=2024-08-15")
    assert resp.status_code == 200
    data = resp.json()
    assert "days" in data
    assert len(data["days"]) == 6
    assert data["summary"]["total_unique_active_cells"] > 0


def test_comparison_endpoint():
    resp = client.get("/api/compare?start_date=2024-08-10&end_date=2024-08-15")
    assert resp.status_code == 200
    data = resp.json()
    assert "matched_pairs_count" in data
    assert "spatial_agreement_jaccard" in data
    assert len(data["sensitivity_curve"]) == 4


def test_anomalies_endpoint():
    resp = client.get("/api/anomalies?target_year=2024")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["months"]) == 12
    assert "method" in data
    # Ensure zero false positives when observed value is within historical 75th percentile
    for m in data["months"]:
        if m["observed_active_cells"] is not None and m["observed_active_cells"] <= m["p75_active_cells"]:
            assert not m["is_anomaly"], f"False anomaly detected for {m['month_name']} where observed <= p75"


def test_import_rejects_non_csv():
    resp = client.post("/api/import", files={"file": ("test.txt", b"some text", "text/plain")})
    assert resp.status_code == 400
    assert "Only CSV files are accepted" in resp.json()["detail"]


def test_import_rejects_empty_file():
    resp = client.post("/api/import", files={"file": ("empty.csv", b"", "text/csv")})
    assert resp.status_code == 400
    assert "Empty file" in resp.json()["detail"]


def test_import_rejects_empty_csv():
    resp = client.post("/api/import", files={"file": ("empty_rows.csv", b"latitude,longitude,acq_date\n", "text/csv")})
    assert resp.status_code == 400
    assert "zero data rows" in resp.json()["detail"]


def test_import_rejects_missing_required_columns():
    resp = client.post("/api/import", files={"file": ("missing_cols.csv", b"temp,brightness\n300,320\n", "text/csv")})
    assert resp.status_code == 400
    assert "Missing required NASA FIRMS column(s)" in resp.json()["detail"]


def test_import_reports_malformed_rows_and_accepts_valid():
    csv_content = (
        "latitude,longitude,acq_date,acq_time,confidence,frp,satellite\n"
        "34.25,-118.15,2024-08-10,1230,80,25.5,Aqua\n"
        "999.0,-118.15,2024-08-10,1230,80,25.5,Aqua\n"  # Invalid lat
        "34.30,-118.20,2024-08-10,1230,nominal,15.2,N\n"
    ).encode("utf-8")
    resp = client.post("/api/import", files={"file": ("partial_valid.csv", csv_content, "text/csv")})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["total_rows"] == 3
    assert data["imported_rows"] == 2
    assert data["malformed_rows"] == 1
    assert len(data["sample_warnings"]) >= 1


def test_import_rejects_all_invalid_rows():
    csv_content = (
        "latitude,longitude,acq_date,acq_time,confidence,frp,satellite\n"
        "999.0,-118.15,2024-08-10,1230,80,25.5,Aqua\n"
        "-999.0,-118.15,2024-08-10,1230,80,25.5,Aqua\n"
    ).encode("utf-8")
    resp = client.post("/api/import", files={"file": ("all_invalid.csv", csv_content, "text/csv")})
    assert resp.status_code == 400
    assert "No valid active fire records identified in CSV" in resp.json()["detail"]


