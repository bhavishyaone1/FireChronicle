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


import math
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from scipy.optimize import linear_sum_assignment

from backend.app.schemas.common import SensorType, ClassificationType
from backend.app.schemas.observation import NormalizedObservation
from backend.app.schemas.comparison import SensitivityPoint


def compute_match_score(
    distance_m: float,
    time_delta_min: float,
    spatial_tolerance_m: float = 1000.0,
    temporal_tolerance_min: float = 60.0,
) -> float:
    """
    Compute normalized composite similarity score in [0.0, 1.0].
    Higher score indicates closer spatial and temporal alignment.
    Weights: 70% spatial proximity, 30% temporal concurrence.
    """
    norm_dist = min(1.0, max(0.0, distance_m / max(spatial_tolerance_m, 1.0)))
    norm_time = min(1.0, max(0.0, time_delta_min / max(temporal_tolerance_min, 1.0)))
    score = 1.0 - (0.7 * norm_dist + 0.3 * norm_time)
    return round(max(0.0, min(1.0, score)), 3)


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
    t1 = datetime.fromisoformat(dt_iso1.replace("Z", "+00:00"))
    t2 = datetime.fromisoformat(dt_iso2.replace("Z", "+00:00"))
    return abs((t1 - t2).total_seconds()) / 60.0


def match_observations(
    observations: List[NormalizedObservation],
    spatial_tolerance_m: float = 1000.0,
    temporal_tolerance_min: float = 60.0,
    method: str = "greedy"
) -> Tuple[List[NormalizedObservation], Dict[str, Any]]:
    """
    Perform transparent spatial-temporal cross-sensor matching.
    
    Identifies plausible candidate correspondences between MODIS (1 km) and VIIRS (375 m):
    1. Distance(obs_m, obs_v) <= spatial_tolerance_m
    2. TimeDelta(obs_m, obs_v) <= temporal_tolerance_min
    
    Algorithms supported:
    - "greedy": 1-to-many nearest neighbor (default baseline, clusters multiple VIIRS into 1 MODIS footprint).
    - "global_assignment": 1-to-1 optimal bipartite matching using the Hungarian algorithm (linear_sum_assignment).
    
    Scientific Note:
    Candidate matches represent spatio-temporal correspondences within overlapping sensor footprints,
    NOT confirmed single physical fires.
    """
    modis_obs = [obs for obs in observations if obs.sensor == SensorType.MODIS]
    viirs_obs = [obs for obs in observations if obs.sensor == SensorType.VIIRS]

    # Precompute pairwise distances, time deltas, and scores for all eligible candidates
    candidates_by_viirs: Dict[str, List[Dict[str, Any]]] = {v.observation_id: [] for v in viirs_obs}
    candidates_by_modis: Dict[str, List[Dict[str, Any]]] = {m.observation_id: [] for m in modis_obs}

    for v in viirs_obs:
        for m in modis_obs:
            t_diff = time_difference_minutes(v.acq_datetime_utc, m.acq_datetime_utc)
            if t_diff <= temporal_tolerance_min:
                dist = haversine_distance_m(v.latitude, v.longitude, m.latitude, m.longitude)
                if dist <= spatial_tolerance_m:
                    score = compute_match_score(dist, t_diff, spatial_tolerance_m, temporal_tolerance_min)
                    cand = {
                        "modis_id": m.observation_id,
                        "viirs_id": v.observation_id,
                        "modis_obs": m,
                        "viirs_obs": v,
                        "distance_m": round(dist, 1),
                        "time_delta_min": round(t_diff, 1),
                        "match_score": score,
                    }
                    candidates_by_viirs[v.observation_id].append(cand)
                    candidates_by_modis[m.observation_id].append(cand)

    # 1. Greedy 1-to-many Matching (Baseline)
    greedy_pairs = []
    greedy_modis_matched = set()
    greedy_viirs_matched = set()

    for v in viirs_obs:
        v_cands = candidates_by_viirs[v.observation_id]
        if v_cands:
            # Pick highest score (or closest distance)
            best = max(v_cands, key=lambda c: c["match_score"])
            pair_id = f"pair_{best['modis_id']}_{best['viirs_id']}"
            greedy_pairs.append({
                "pair_id": pair_id,
                "modis_id": best["modis_id"],
                "viirs_id": best["viirs_id"],
                "distance_m": best["distance_m"],
                "time_delta_min": best["time_delta_min"],
                "match_score": best["match_score"],
                "is_ambiguous": len(v_cands) > 1,
            })
            greedy_modis_matched.add(best["modis_id"])
            greedy_viirs_matched.add(best["viirs_id"])

    # 2. Global Optimal Bipartite Matching (1-to-1)
    global_pairs = []
    global_modis_matched = set()
    global_viirs_matched = set()

    if modis_obs and viirs_obs:
        # Build cost matrix
        cost_matrix = np.full((len(modis_obs), len(viirs_obs)), 1e6)
        modis_id_to_idx = {m.observation_id: idx for idx, m in enumerate(modis_obs)}
        viirs_id_to_idx = {v.observation_id: idx for idx, v in enumerate(viirs_obs)}

        for v_id, cands in candidates_by_viirs.items():
            v_idx = viirs_id_to_idx[v_id]
            for c in cands:
                m_idx = modis_id_to_idx[c["modis_id"]]
                # Cost is inverse of similarity score (0.0 best, 1.0 worst)
                cost_matrix[m_idx, v_idx] = 1.0 - c["match_score"]

        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        for r, c in zip(row_ind, col_ind):
            if cost_matrix[r, c] < 1e5:  # Valid assignment under tolerance
                m = modis_obs[r]
                v = viirs_obs[c]
                dist = haversine_distance_m(v.latitude, v.longitude, m.latitude, m.longitude)
                t_diff = time_difference_minutes(v.acq_datetime_utc, m.acq_datetime_utc)
                score = compute_match_score(dist, t_diff, spatial_tolerance_m, temporal_tolerance_min)
                pair_id = f"opt_{m.observation_id}_{v.observation_id}"
                global_pairs.append({
                    "pair_id": pair_id,
                    "modis_id": m.observation_id,
                    "viirs_id": v.observation_id,
                    "distance_m": round(dist, 1),
                    "time_delta_min": round(t_diff, 1),
                    "match_score": score,
                    "is_ambiguous": len(candidates_by_viirs[v.observation_id]) > 1 or len(candidates_by_modis[m.observation_id]) > 1,
                })
                global_modis_matched.add(m.observation_id)
                global_viirs_matched.add(v.observation_id)

    # Select active pair set based on method
    if method == "global_assignment":
        active_pairs = global_pairs
        active_modis_matched = global_modis_matched
        active_viirs_matched = global_viirs_matched
    else:
        active_pairs = greedy_pairs
        active_modis_matched = greedy_modis_matched
        active_viirs_matched = greedy_viirs_matched

    # Annotate VIIRS observations
    for v in viirs_obs:
        v_cands = candidates_by_viirs[v.observation_id]
        v.candidate_count = len(v_cands)
        v.is_ambiguous = len(v_cands) > 1

        linked = [p for p in active_pairs if p["viirs_id"] == v.observation_id]
        if linked:
            best = linked[0]
            v.classification = ClassificationType.MATCHED
            v.matched_pair_id = best["pair_id"]
            v.match_distance_m = best["distance_m"]
            v.match_time_delta_min = best["time_delta_min"]
            v.match_score = best["match_score"]
        else:
            v.classification = ClassificationType.VIIRS_ONLY
            v.matched_pair_id = None
            v.match_distance_m = None
            v.match_time_delta_min = None
            v.match_score = None

    # Annotate MODIS observations
    for m in modis_obs:
        m_cands = candidates_by_modis[m.observation_id]
        m.candidate_count = len(m_cands)
        m.is_ambiguous = len(m_cands) > 1

        linked = [p for p in active_pairs if p["modis_id"] == m.observation_id]
        if linked:
            primary = linked[0]
            m.classification = ClassificationType.MATCHED
            m.matched_pair_id = primary["pair_id"]
            m.match_distance_m = primary["distance_m"]
            m.match_time_delta_min = primary["time_delta_min"]
            m.match_score = primary["match_score"]
        else:
            m.classification = ClassificationType.MODIS_ONLY
            m.matched_pair_id = None
            m.match_distance_m = None
            m.match_time_delta_min = None
            m.match_score = None

    matched_observations = modis_obs + viirs_obs

    # Ambiguity metrics
    ambiguous_modis = len([m for m in modis_obs if m.is_ambiguous])
    ambiguous_viirs = len([v for v in viirs_obs if v.is_ambiguous])

    avg_dist_greedy = round(float(np.mean([p["distance_m"] for p in greedy_pairs])), 1) if greedy_pairs else 0.0
    avg_dist_global = round(float(np.mean([p["distance_m"] for p in global_pairs])), 1) if global_pairs else 0.0

    summary_stats = {
        "algorithm": method,
        "spatial_tolerance_m": spatial_tolerance_m,
        "temporal_tolerance_min": temporal_tolerance_min,
        "modis_total": len(modis_obs),
        "viirs_total": len(viirs_obs),
        "matched_pairs_count": len(active_pairs),
        "modis_matched_count": len(active_modis_matched),
        "viirs_matched_count": len(active_viirs_matched),
        "modis_only_count": len(modis_obs) - len(active_modis_matched),
        "viirs_only_count": len(viirs_obs) - len(active_viirs_matched),
        "matched_pairs": active_pairs,
        "ambiguity": {
            "ambiguous_modis_count": ambiguous_modis,
            "ambiguous_viirs_count": ambiguous_viirs,
            "total_ambiguous_detections": ambiguous_modis + ambiguous_viirs,
        },
        "algorithm_comparison": {
            "greedy_1toMany": {
                "pairs_count": len(greedy_pairs),
                "modis_matched": len(greedy_modis_matched),
                "viirs_matched": len(greedy_viirs_matched),
                "mean_distance_m": avg_dist_greedy,
                "description": "Baseline 1-to-many greedy nearest-neighbor. Allows multiple VIIRS 375m pixels inside 1 MODIS 1km footprint."
            },
            "global_assignment_1to1": {
                "pairs_count": len(global_pairs),
                "modis_matched": len(global_modis_matched),
                "viirs_matched": len(global_viirs_matched),
                "mean_distance_m": avg_dist_global,
                "description": "Global optimal 1-to-1 bipartite assignment minimizing composite spatio-temporal distance."
            }
        },
        "scientific_caveat": "Candidate sensor matches represent spatio-temporal correspondences within sensor footprints, NOT confirmed single physical fires."
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
