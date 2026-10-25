"""Spatial-Temporal Candidate Cross-Sensor Matching Engine."""

import math
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional
from backend.app.schemas.common import SensorType, ClassificationType
from backend.app.schemas.observation import NormalizedObservation
from backend.app.schemas.comparison import SensitivityPoint


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute great-circle distance between two geographic coordinates in meters.
    """
    R = 6371000.0  # Earth's mean radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def time_difference_minutes(dt_iso1: str, dt_iso2: str) -> float:
    """Compute absolute time difference between two ISO 8601 UTC strings in minutes."""
    # Fast parsing of "YYYY-MM-DDTHH:MM:SSZ"
    t1 = datetime.fromisoformat(dt_iso1.replace("Z", "+00:00"))
    t2 = datetime.fromisoformat(dt_iso2.replace("Z", "+00:00"))
    return abs((t1 - t2).total_seconds()) / 60.0


def match_observations(
    observations: List[NormalizedObservation],
    spatial_tolerance_m: float = 1000.0,
    temporal_tolerance_min: float = 60.0
) -> Tuple[List[NormalizedObservation], Dict[str, Any]]:
    """
    Perform transparent spatial-temporal cross-sensor matching.
    
    Identifies plausible correspondences between MODIS and VIIRS detections:
    1. Distance(obs_m, obs_v) <= spatial_tolerance_m
    2. TimeDelta(obs_m, obs_v) <= temporal_tolerance_min
    
    Supports 1-to-many relationships (multiple VIIRS 375m points within 1 MODIS 1km footprint).
    """
    modis_obs = [obs for obs in observations if obs.sensor == SensorType.MODIS]
    viirs_obs = [obs for obs in observations if obs.sensor == SensorType.VIIRS]

    matched_pairs = []
    modis_matched_ids = set()
    viirs_matched_ids = set()

    # Match each VIIRS detection to its closest temporal & spatial MODIS detection
    for v in viirs_obs:
        best_modis: Optional[NormalizedObservation] = None
        min_dist = float("inf")
        min_time_delta = float("inf")

        for m in modis_obs:
            t_diff = time_difference_minutes(v.acq_datetime_utc, m.acq_datetime_utc)
            if t_diff <= temporal_tolerance_min:
                dist = haversine_distance_m(v.latitude, v.longitude, m.latitude, m.longitude)
                if dist <= spatial_tolerance_m and dist < min_dist:
                    min_dist = dist
                    min_time_delta = t_diff
                    best_modis = m

        if best_modis is not None:
            pair_id = f"pair_{best_modis.observation_id}_{v.observation_id}"
            matched_pairs.append({
                "pair_id": pair_id,
                "modis_id": best_modis.observation_id,
                "viirs_id": v.observation_id,
                "distance_m": round(min_dist, 1),
                "time_delta_min": round(min_time_delta, 1),
            })
            modis_matched_ids.add(best_modis.observation_id)
            viirs_matched_ids.add(v.observation_id)

            # Update VIIRS record
            v.classification = ClassificationType.MATCHED
            v.matched_pair_id = pair_id
            v.match_distance_m = round(min_dist, 1)
            v.match_time_delta_min = round(min_time_delta, 1)

    # Update MODIS records
    for m in modis_obs:
        if m.observation_id in modis_matched_ids:
            m.classification = ClassificationType.MATCHED
            # Find associated pairs
            linked_pairs = [p for p in matched_pairs if p["modis_id"] == m.observation_id]
            if linked_pairs:
                m.matched_pair_id = linked_pairs[0]["pair_id"]
                m.match_distance_m = linked_pairs[0]["distance_m"]
                m.match_time_delta_min = linked_pairs[0]["time_delta_min"]
        else:
            m.classification = ClassificationType.MODIS_ONLY

    # Ensure unmatched VIIRS remain labelled VIIRS_ONLY
    for v in viirs_obs:
        if v.observation_id not in viirs_matched_ids:
            v.classification = ClassificationType.VIIRS_ONLY

    # Reassemble list
    matched_observations = modis_obs + viirs_obs

    summary_stats = {
        "modis_total": len(modis_obs),
        "viirs_total": len(viirs_obs),
        "matched_pairs_count": len(matched_pairs),
        "modis_matched_count": len(modis_matched_ids),
        "viirs_matched_count": len(viirs_matched_ids),
        "modis_only_count": len(modis_obs) - len(modis_matched_ids),
        "viirs_only_count": len(viirs_obs) - len(viirs_matched_ids),
        "matched_pairs": matched_pairs,
    }
    return matched_observations, summary_stats


def compute_sensitivity_sweep(
    observations: List[NormalizedObservation],
    tolerances_m: List[float] = [500.0, 1000.0, 1500.0, 2000.0],
    temporal_tolerance_min: float = 60.0
) -> List[SensitivityPoint]:
    """Sweep across spatial distance thresholds to quantify matching sensitivity."""
    results = []
    modis_count = len([o for o in observations if o.sensor == SensorType.MODIS])
    
    for tol in tolerances_m:
        # Create shallow clones of records to test
        test_obs = [o.model_copy() for o in observations]
        _, stats = match_observations(test_obs, spatial_tolerance_m=tol, temporal_tolerance_min=temporal_tolerance_min)
        
        fraction = stats["modis_matched_count"] / max(modis_count, 1)
        results.append(SensitivityPoint(
            tolerance_m=tol,
            matched_fraction=round(fraction, 3),
            matched_pairs=stats["matched_pairs_count"]
        ))
    return results
