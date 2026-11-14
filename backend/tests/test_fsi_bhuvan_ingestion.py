"""Unit tests for FSI and Bhuvan adapter ingestion and validation."""

import pytest
from backend.app.schemas.common import ContextClass, SensorType
from backend.app.services.fsi_adapter import parse_fsi_csv, parse_fsi_kml
from backend.app.services.bhuvan_adapter import parse_bhuvan_csv, validate_bhuvan_season


def test_fsi_csv_parsing_and_large_fire_detection():
    # 4 contiguous VIIRS pixels forming a candidate Large Forest Fire in Chamoli
    csv_data = """FIRE_ID,STATE,DISTRICT,CIRCLE,DIVISION,RANGE,SENSOR,LATITUDE,LONGITUDE,DATE,TIME
FSI_01,Uttarakhand,Chamoli,Garhwal,Badrinath,Joshimath,VIIRS,30.450,79.400,2024-04-15,0730
FSI_02,Uttarakhand,Chamoli,Garhwal,Badrinath,Joshimath,VIIRS,30.455,79.405,2024-04-15,0730
FSI_03,Uttarakhand,Chamoli,Garhwal,Badrinath,Joshimath,VIIRS,30.458,79.408,2024-04-15,0730
FSI_04,Uttarakhand,Chamoli,Garhwal,Badrinath,Joshimath,VIIRS,30.460,79.410,2024-04-15,0730
"""
    obs, report = parse_fsi_csv(csv_data, "test_fsi.csv")
    assert len(obs) == 4
    assert report["records_ingested"] == 4
    assert report["records_rejected"] == 0
    # All 4 should be flagged as large fire candidates because cluster size >= 3
    assert report["large_fire_candidates"] == 4
    assert obs[0].context_class == ContextClass.FSI_SUPPORTED_FOREST_ALERT
    assert obs[0].india_state == "Uttarakhand"
    assert obs[0].india_district == "Chamoli"
    assert obs[0].is_large_fire_candidate is True
    assert "FSI_LARGE_FIRE_REFERENCE" in obs[0].context_evidence


def test_fsi_kml_parsing():
    kml_data = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>FSI_LFF_Chamoli_01</name>
      <description>Garhwal Circle Forest Fire</description>
      <Point>
        <coordinates>79.400,30.450,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>FSI_LFF_Chamoli_02</name>
      <description>Garhwal Circle Forest Fire</description>
      <Point>
        <coordinates>79.405,30.455,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>
"""
    obs, report = parse_fsi_kml(kml_data, "test_fsi.kml")
    assert len(obs) == 2
    assert report["records_ingested"] == 2
    assert obs[0].latitude == 30.450
    assert obs[0].longitude == 79.400
    assert obs[0].context_class == ContextClass.FSI_SUPPORTED_FOREST_ALERT


def test_bhuvan_season_validation():
    # Kharif Season: Oct 25 -> Valid
    is_valid, desc = validate_bhuvan_season("2024-10-25")
    assert is_valid is True
    assert "Kharif" in desc

    # Rabi Season: May 10 -> Valid
    is_valid, desc = validate_bhuvan_season("2024-05-10")
    assert is_valid is True
    assert "Rabi" in desc

    # Monsoon Off-Season: July 15 -> Inactive
    is_valid, desc = validate_bhuvan_season("2024-07-15")
    assert is_valid is False
    assert "Inactive" in desc


def test_bhuvan_csv_parsing():
    csv_data = """STATE,DISTRICT,LATITUDE,LONGITUDE,DATE,TIME,SENSOR
Punjab,Ludhiana,30.850,75.820,2024-10-28,0815,VIIRS_375M
Punjab,Sangrur,30.220,75.840,2024-10-28,0815,VIIRS_375M
"""
    obs, report = parse_bhuvan_csv(csv_data, "test_bhuvan.csv")
    assert len(obs) == 2
    assert obs[0].context_class == ContextClass.BHUVAN_AGRICULTURAL_FIRE_RECORD
    assert obs[0].india_state == "Punjab"
    assert obs[0].india_district == "Ludhiana"
    assert "BHUVAN_ACTIVE_AGRICULTURAL_FIRE_OVERLAP" in obs[0].context_evidence
    assert obs[0].bhuvan_record_id is not None
