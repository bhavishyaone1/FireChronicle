"""Unit tests for dataset export (GeoJSON & CSV) and Suomi-NPP cessation lifecycle."""

import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.firms_client import resolve_viirs_product, SUOMI_NPP_CESSATION_DATE


@pytest.fixture
def client():
    return TestClient(app)


def test_export_endpoint_geojson(client):
    """Verify /api/export returns valid GeoJSON with full provenance and metadata."""
    resp = client.get("/api/export?export_format=geojson&start_date=2024-08-01&end_date=2024-08-20")
    assert resp.status_code == 200
    assert "application/geo+json" in resp.headers["content-type"]
    assert "attachment" in resp.headers["content-disposition"]
    assert ".geojson" in resp.headers["content-disposition"]

    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "metadata" in data
    assert "provenance" in data["metadata"]
    assert "citation" in data["metadata"]
    assert "scientific_guardrail" in data["metadata"]
    assert isinstance(data["features"], list)
    if data["features"]:
        props = data["features"][0]["properties"]
        assert "observation_id" in props
        assert "sensor" in props
        assert "grid_cell_id" in props


def test_export_endpoint_csv(client):
    """Verify /api/export returns valid RFC-4180 CSV with normalized columns."""
    resp = client.get("/api/export?export_format=csv&start_date=2024-08-01&end_date=2024-08-20")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "attachment" in resp.headers["content-disposition"]
    assert ".csv" in resp.headers["content-disposition"]

    lines = resp.text.strip().splitlines()
    assert len(lines) >= 1  # Header line
    header = lines[0].split(",")
    assert "observation_id" in header
    assert "sensor" in header
    assert "platform" in header
    assert "confidence_category" in header
    assert "raw_confidence" in header
    assert "grid_cell_id" in header


def test_suomi_npp_cessation_redirection():
    """Verify automatic transition from Suomi-NPP to NOAA-20 on/after November 1, 2026."""
    # Pre-cessation request: stays Suomi-NPP
    source_pre, notice_pre = resolve_viirs_product("VIIRS_SNPP_SP", target_date="2024-08-10")
    assert source_pre == "VIIRS_SNPP_SP"
    assert notice_pre is None

    # Post-cessation request: dynamically redirected to NOAA-20 with advisory notice
    source_post, notice_post = resolve_viirs_product("VIIRS_SNPP_SP", target_date="2026-11-05")
    assert source_post == "VIIRS_NOAA20_SP"
    assert notice_post is not None
    assert SUOMI_NPP_CESSATION_DATE in notice_post
    assert "NOAA-20" in notice_post


def test_metadata_contains_suomi_npp_lifecycle(client):
    """Verify /api/metadata includes operational timeline and guidance for Suomi-NPP cessation."""
    resp = client.get("/api/metadata")
    assert resp.status_code == 200
    data = resp.json()
    assert "suomi_npp_lifecycle" in data
    assert data["suomi_npp_lifecycle"]["cessation_date"] == "2026-11-01"
