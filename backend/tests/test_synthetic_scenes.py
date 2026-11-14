"""
Hand-Built Synthetic Ground-Truth Test Scenes for Cross-Sensor Matching Correctness.
Validates:
1. Exact nadir co-occurrence.
2. Off-nadir footprint expansion (scan angle growth using SCAN and TRACK parameters).
3. Solar overpass incompatibility (Day vs Night rejection).
4. Temporal separation boundary condition (> threshold rejection).
5. 1-to-many sub-pixel cluster topology (1 MODIS parent -> multiple VIIRS detections).
6. Low-confidence detection filtering toggle.
"""

import pytest
from datetime import datetime, timezone
from backend.app.schemas.common import SensorType, ClassificationType, ConfidenceCategory, ProcessingStatus
from backend.app.schemas.observation import NormalizedObservation
from backend.app.services.matcher import match_observations, compute_footprint_envelope_m


def create_mock_obs(
    obs_id: str,
    sensor: SensorType,
    lat: float,
    lon: float,
    dt_iso: str,
    daynight: str = "D",
    confidence_cat: ConfidenceCategory = ConfidenceCategory.NOMINAL,
    raw_confidence: str = "80",
    scan_km: float = 1.0,
    track_km: float = 1.0,
    frp_mw: float = 25.0,
) -> NormalizedObservation:
    dt = datetime.fromisoformat(dt_iso.replace("Z", "+00:00"))
    date_str = dt.strftime("%Y-%m-%d")
    time_str = dt.strftime("%H%M")
    
    return NormalizedObservation(
        observation_id=obs_id,
        source_system="SYNTHETIC_TEST",
        source_archive_filename="synthetic_test.zip",
        source_file_name="synthetic.shp",
        source_row_id=1,
        source_product="TEST_PROD",
        collection="1.0",
        product_version="1.0",
        processing_status=ProcessingStatus.SP,
        processing_level="2",
        sensor=sensor,
        platform="TERRA" if sensor == SensorType.MODIS else "NOAA20",
        latitude=lat,
        longitude=lon,
        acq_datetime_utc=dt_iso,
        acq_date_utc=date_str,
        acq_time_utc=time_str,
        confidence_category=confidence_cat,
        raw_confidence=raw_confidence,
        confidence_semantics="Synthetic test confidence",
        frp_mw=frp_mw,
        daynight=daynight,
        brightness_kelvin=330.0,
        scan_km=scan_km,
        track_km=track_km,
        grid_cell_id=f"GRID_{lat}_{lon}",
    )


def test_scene_a_nadir_concurrent_match():
    """Scene A: Collocated nadir MODIS and VIIRS passes (<200m, 15 min delta, Day/Day)."""
    m = create_mock_obs("M_001", SensorType.MODIS, 22.000, 78.000, "2026-03-05T08:00:00Z", daynight="D")
    # ~150 meters offset: 0.001 deg lat is ~111m, 0.001 deg lon is ~103m -> ~150m
    v = create_mock_obs("V_001", SensorType.VIIRS, 22.001, 78.001, "2026-03-05T08:15:00Z", daynight="D", scan_km=0.375, track_km=0.375)

    matched, stats = match_observations([m, v], spatial_tolerance_m=1000.0, temporal_tolerance_min=60.0)

    assert stats["matched_pairs_count"] == 1
    assert stats["modis_matched_count"] == 1
    assert stats["viirs_matched_count"] == 1
    m_matched = next(o for o in matched if o.observation_id == "M_001")
    v_matched = next(o for o in matched if o.observation_id == "V_001")
    assert m_matched.classification == ClassificationType.MATCHED
    assert v_matched.classification == ClassificationType.MATCHED


def test_scene_b_off_nadir_footprint_growth():
    """
    Scene B: Edge-of-swath scan distortion.
    MODIS scan=4.0 km, track=2.0 km (semi-diagonal ~2236m).
    Centroid separation = 1800m (exceeds rigid 1000m nadir cutoff, but well inside true footprint).
    """
    m = create_mock_obs("M_OFFNADIR", SensorType.MODIS, 22.000, 78.000, "2026-03-05T08:00:00Z", scan_km=4.0, track_km=2.0)
    # Approx 1.8 km distance (0.0162 deg lat ~ 1800m)
    v = create_mock_obs("V_OFFNADIR", SensorType.VIIRS, 22.0162, 78.000, "2026-03-05T08:20:00Z", scan_km=0.8, track_km=0.8)

    # 1. Under rigid 1000m tolerance without adaptive footprint: REJECTED
    _, stats_rigid = match_observations([m, v], spatial_tolerance_m=1000.0, use_adaptive_footprint=False)
    assert stats_rigid["matched_pairs_count"] == 0

    # 2. Under adaptive footprint growth accounting: MATCHED
    _, stats_adaptive = match_observations([m, v], spatial_tolerance_m=1000.0, use_adaptive_footprint=True)
    assert stats_adaptive["matched_pairs_count"] == 1


def test_scene_c_day_night_incompatibility():
    """
    Scene C: Solar overpass mismatch.
    Same exact coordinate (0 meters apart), but one Day pass (Terra 08:30 UTC)
    and one Night pass (Suomi-NPP 20:30 UTC). Must never match.
    """
    m = create_mock_obs("M_DAY", SensorType.MODIS, 22.000, 78.000, "2026-03-05T08:30:00Z", daynight="D")
    v = create_mock_obs("V_NIGHT", SensorType.VIIRS, 22.000, 78.000, "2026-03-05T20:30:00Z", daynight="N")

    _, stats = match_observations([m, v], spatial_tolerance_m=2000.0, temporal_tolerance_min=1440.0)
    assert stats["matched_pairs_count"] == 0
    assert stats["modis_only_count"] == 1
    assert stats["viirs_only_count"] == 1


def test_scene_d_temporal_window_violation():
    """
    Scene D: Observations separated by 90 minutes with 60 minute threshold.
    Centroid separation = 50m.
    Must be rejected due to temporal threshold.
    """
    m = create_mock_obs("M_TIME", SensorType.MODIS, 22.000, 78.000, "2026-03-05T08:00:00Z")
    v = create_mock_obs("V_TIME", SensorType.VIIRS, 22.0003, 78.0003, "2026-03-05T09:30:00Z")  # 90 min delta

    _, stats = match_observations([m, v], spatial_tolerance_m=1000.0, temporal_tolerance_min=60.0)
    assert stats["matched_pairs_count"] == 0


def test_scene_e_subpixel_one_to_many_clustering():
    """
    Scene E: Resolution disparity.
    1 MODIS footprint (1 km) containing 3 distinct sub-kilometer VIIRS (375m) detections.
    Greedy matching must associate all 3 VIIRS detections to the parent MODIS detection,
    preserving fine flame front topology without synthesizing fake observations.
    """
    m = create_mock_obs("M_PARENT", SensorType.MODIS, 25.000, 80.000, "2026-03-05T08:00:00Z")
    v1 = create_mock_obs("V_CHILD1", SensorType.VIIRS, 25.001, 80.001, "2026-03-05T08:10:00Z", scan_km=0.375, track_km=0.375)
    v2 = create_mock_obs("V_CHILD2", SensorType.VIIRS, 25.002, 80.002, "2026-03-05T08:10:00Z", scan_km=0.375, track_km=0.375)
    v3 = create_mock_obs("V_CHILD3", SensorType.VIIRS, 25.003, 80.001, "2026-03-05T08:10:00Z", scan_km=0.375, track_km=0.375)

    matched, stats = match_observations([m, v1, v2, v3], spatial_tolerance_m=1000.0, method="greedy")
    assert stats["modis_matched_count"] == 1
    assert stats["viirs_matched_count"] == 3
    assert stats["matched_pairs_count"] == 3

    # Every VIIRS child points to the same parent MODIS
    viirs_matches = [o for o in matched if o.sensor == SensorType.VIIRS]
    for v in viirs_matches:
        assert v.classification == ClassificationType.MATCHED
        assert v.matched_observation_id == "M_PARENT"


def test_scene_f_low_confidence_filtering():
    """
    Scene F: Confidence handling.
    Low-confidence detections can be filtered to compare nominal/high performance.
    """
    m_high = create_mock_obs("M_HIGH", SensorType.MODIS, 22.000, 78.000, "2026-03-05T08:00:00Z", confidence_cat=ConfidenceCategory.HIGH, raw_confidence="95")
    v_low = create_mock_obs("V_LOW", SensorType.VIIRS, 22.001, 78.001, "2026-03-05T08:10:00Z", confidence_cat=ConfidenceCategory.LOW, raw_confidence="l")

    # With low confidence included: matches
    _, stats_all = match_observations([m_high, v_low], exclude_low_confidence=False)
    assert stats_all["matched_pairs_count"] == 1

    # With low confidence excluded: v_low is filtered out, no match possible
    _, stats_filtered = match_observations([m_high, v_low], exclude_low_confidence=True)
    assert stats_filtered["matched_pairs_count"] == 0
    assert stats_filtered["viirs_total"] == 0
