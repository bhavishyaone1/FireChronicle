"""Unit tests for India context classification engine."""

import pytest
from backend.app.schemas.common import ContextClass, ContextConfidence
from backend.app.services.context_engine import evaluate_observation_context


def test_kharif_agricultural_residue_context():
    # Punjab hotspot during peak Kharif stubble burning (October 28)
    c_class, evidence, confidence = evaluate_observation_context(
        lat=30.90,
        lon=75.85,
        acq_date_utc="2024-10-28",
        india_state="Punjab",
        india_district="Ludhiana",
    )
    assert c_class == ContextClass.LIKELY_AGRICULTURAL_CONTEXT
    assert "CROP_SEASON_MATCH" in evidence
    assert "LAND_COVER_CROPLAND" in evidence
    assert confidence == ContextConfidence.MEDIUM


def test_forest_fire_season_context_uttarakhand():
    # Uttarakhand pine forest hotspot during dry pre-monsoon (April 20)
    c_class, evidence, confidence = evaluate_observation_context(
        lat=30.45,
        lon=79.40,
        acq_date_utc="2024-04-20",
        india_state="Uttarakhand",
        india_district="Chamoli",
    )
    assert c_class == ContextClass.LIKELY_FOREST_CONTEXT
    assert "FOREST_TYPE_LAYER_OVERLAP" in evidence
    assert "LAND_COVER_TREE_COVER" in evidence
    assert confidence == ContextConfidence.MEDIUM


def test_fsi_alert_overlap_trumps_heuristic():
    # Hotspot directly linked to an FSI alert ID
    c_class, evidence, confidence = evaluate_observation_context(
        lat=30.45,
        lon=79.40,
        acq_date_utc="2024-04-20",
        india_state="Uttarakhand",
        india_district="Chamoli",
        fsi_alert_id="FSI_2024_04_CHAMOLI_001",
    )
    assert c_class == ContextClass.FSI_SUPPORTED_FOREST_ALERT
    assert "FSI_ALERT_OVERLAP" in evidence
    assert confidence == ContextConfidence.HIGH


def test_bhuvan_agri_overlap_trumps_heuristic():
    # Hotspot directly matched to a Bhuvan agricultural fire record
    c_class, evidence, confidence = evaluate_observation_context(
        lat=30.90,
        lon=75.85,
        acq_date_utc="2024-10-28",
        india_state="Punjab",
        india_district="Ludhiana",
        bhuvan_record_id="BHUVAN_LUDHIANA_094",
    )
    assert c_class == ContextClass.BHUVAN_AGRICULTURAL_FIRE_RECORD
    assert "BHUVAN_ACTIVE_AGRICULTURAL_FIRE_OVERLAP" in evidence
    assert confidence == ContextConfidence.HIGH


def test_volcanic_detection_barren_island():
    # Barren Island coordinate in Andaman Sea
    c_class, evidence, confidence = evaluate_observation_context(
        lat=12.28,
        lon=93.86,
        acq_date_utc="2024-05-10",
    )
    assert c_class == ContextClass.VOLCANIC
    assert confidence == ContextConfidence.HIGH


def test_static_industrial_thermal_source():
    # NASA type 2 static land source
    c_class, evidence, confidence = evaluate_observation_context(
        lat=22.50,
        lon=82.00,
        acq_date_utc="2024-05-10",
        anomaly_type=2,
        india_state="Chhattisgarh",
    )
    assert c_class == ContextClass.OTHER_STATIC_THERMAL_SOURCE
    assert "INDUSTRIAL_OR_MINING_CONTEXT" in evidence
    assert confidence == ContextConfidence.HIGH


def test_unclassified_fallback():
    # Point outside declared agricultural windows and non-forest state
    c_class, evidence, confidence = evaluate_observation_context(
        lat=26.00,
        lon=73.00,
        acq_date_utc="2024-07-15",
        india_state="Rajasthan",
    )
    assert c_class == ContextClass.UNCLASSIFIED
    assert confidence == ContextConfidence.INSUFFICIENT
