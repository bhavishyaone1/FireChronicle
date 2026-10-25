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
