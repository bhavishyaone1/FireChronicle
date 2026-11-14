"""Spatial-Temporal Candidate Cross-Sensor Matching Engine."""

import math
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from scipy.optimize import linear_sum_assignment

from backend.app.schemas.common import SensorType, ClassificationType, ConfidenceCategory
from backend.app.schemas.observation import NormalizedObservation
from backend.app.schemas.comparison import SensitivityPoint


def compute_footprint_envelope_m(
    scan_m: Optional[float],
    track_m: Optional[float],
    scan_v: Optional[float],
    track_v: Optional[float],
    default_spatial_m: float = 1000.0,
) -> float:
    """
    Compute physical spatial overlap limit considering off-nadir pixel growth.

    MODIS nadir footprint is 1.0 km x 1.0 km, expanding up to ~4.8 km x 2.0 km at scan edge (55°).
    VIIRS nadir footprint is 0.375 km x 0.375 km, expanding up to ~0.8 km x 0.8 km at scan edge (32°).
    Semi-diagonal radius r = 0.5 * sqrt(scan^2 + track^2) in meters.
    Geometric physical overlap occurs when distance between centroids is within r_m + r_v.
    """
    r_m = 0.5 * math.sqrt(scan_m**2 + track_m**2) * 1000.0 if (scan_m and track_m and scan_m > 0 and track_m > 0) else 707.1
    r_v = 0.5 * math.sqrt(scan_v**2 + track_v**2) * 1000.0 if (scan_v and track_v and scan_v > 0 and track_v > 0) else 265.2
    envelope = r_m + r_v
    return max(default_spatial_m, envelope)


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


def _parse_epoch_fast(dt_str: str) -> float:
    """Fast ISO datetime string to epoch seconds converter."""
    try:
        if dt_str.endswith("Z"):
            dt_str = dt_str[:-1] + "+00:00"
        return datetime.fromisoformat(dt_str).timestamp()
    except Exception:
        return 0.0


def is_low_confidence_detection(obs: NormalizedObservation) -> bool:
    """Helper to detect low-confidence observations across heterogeneous sensor products."""
    if obs.confidence_category == ConfidenceCategory.LOW:
        return True
    if obs.sensor == SensorType.MODIS:
        try:
            if obs.raw_confidence is not None and float(obs.raw_confidence) < 30.0:
                return True
        except (ValueError, TypeError):
            pass
    elif obs.sensor == SensorType.VIIRS:
        if str(obs.raw_confidence).strip().lower() in ("l", "low"):
            return True
    return False


def match_observations(
    observations: List[NormalizedObservation],
    spatial_tolerance_m: float = 1000.0,
    temporal_tolerance_min: float = 60.0,
    method: str = "greedy",
    use_adaptive_footprint: bool = True,
    exclude_low_confidence: bool = False,
) -> Tuple[List[NormalizedObservation], Dict[str, Any]]:
    """
    Perform transparent spatial-temporal cross-sensor matching.
    
    Identifies plausible candidate correspondences between MODIS (1 km) and VIIRS (375 m):
    1. Distance(obs_m, obs_v) <= spatial_tolerance_m (or adaptive footprint envelope)
    2. TimeDelta(obs_m, obs_v) <= temporal_tolerance_min
    3. Solar pass compatibility: Day/Night overpasses must match
    4. Optional confidence filtering: exclude low-confidence detections
    
    Algorithms supported:
    - "greedy": 1-to-many nearest neighbor (default baseline, clusters multiple VIIRS into 1 MODIS footprint).
    - "global_assignment": 1-to-1 optimal bipartite matching using the Hungarian algorithm (linear_sum_assignment).
    """
    if exclude_low_confidence:
        eval_observations = [obs for obs in observations if not is_low_confidence_detection(obs)]
    else:
        eval_observations = observations

    modis_obs = [obs for obs in eval_observations if obs.sensor == SensorType.MODIS]
    viirs_obs = [obs for obs in eval_observations if obs.sensor == SensorType.VIIRS]

    # Precompute epochs and coarse bounding-box threshold (approx 111 km per deg lat)
    deg_lat_thresh = (max(spatial_tolerance_m, 3500.0 if use_adaptive_footprint else spatial_tolerance_m) / 111000.0) * 1.5
    temporal_sec_thresh = temporal_tolerance_min * 60.0

    modis_epochs = [_parse_epoch_fast(m.acq_datetime_utc) for m in modis_obs]
    viirs_epochs = [_parse_epoch_fast(v.acq_datetime_utc) for v in viirs_obs]

    candidates_by_viirs: Dict[str, List[Dict[str, Any]]] = {v.observation_id: [] for v in viirs_obs}
    candidates_by_modis: Dict[str, List[Dict[str, Any]]] = {m.observation_id: [] for m in modis_obs}

    # Spatial-temporal bin index: (date, lat_bin, lon_bin) with 0.1 deg (~11 km) resolution
    modis_spatial_index: Dict[Tuple[str, int, int], List[int]] = {}
    for m_idx, m in enumerate(modis_obs):
        lat_bin = int(math.floor(m.latitude * 10))
        lon_bin = int(math.floor(m.longitude * 10))
        key = (m.acq_date_utc, lat_bin, lon_bin)
        modis_spatial_index.setdefault(key, []).append(m_idx)

    for v_idx, v in enumerate(viirs_obs):
        v_epoch = viirs_epochs[v_idx]
        v_lat, v_lon = v.latitude, v.longitude
        v_date = v.acq_date_utc
        v_lat_bin = int(math.floor(v_lat * 10))
        v_lon_bin = int(math.floor(v_lon * 10))

        # Query only 3x3 adjacent spatial bins for the same observation date
        candidate_m_indices: List[int] = []
        for d_lat in (-1, 0, 1):
            for d_lon in (-1, 0, 1):
                bin_key = (v_date, v_lat_bin + d_lat, v_lon_bin + d_lon)
                if bin_key in modis_spatial_index:
                    candidate_m_indices.extend(modis_spatial_index[bin_key])

        for m_idx in candidate_m_indices:
            m = modis_obs[m_idx]

            # Solar day/night compatibility filter: Day (D) and Night (N) passes are ~12h apart and must never match
            if m.daynight and v.daynight:
                m_dn = str(m.daynight).strip().upper()
                v_dn = str(v.daynight).strip().upper()
                if m_dn in ("D", "N") and v_dn in ("D", "N") and m_dn != v_dn:
                    continue

            # Fast temporal filter using precomputed epochs
            t_sec = abs(v_epoch - modis_epochs[m_idx])
            if t_sec > temporal_sec_thresh:
                continue

            # Footprint growth accounting: compute adaptive envelope or use fixed tolerance
            if use_adaptive_footprint:
                max_spatial_m = compute_footprint_envelope_m(
                    m.scan_km, m.track_km, v.scan_km, v.track_km, spatial_tolerance_m
                )
            else:
                max_spatial_m = spatial_tolerance_m

            # Fast spatial bounding-box filter before expensive haversine trigonometry
            deg_lat_thresh_local = max(deg_lat_thresh, (max_spatial_m / 111000.0) * 1.5)
            if abs(v_lat - m.latitude) > deg_lat_thresh_local or abs(v_lon - m.longitude) > deg_lat_thresh_local:
                continue

            t_diff = t_sec / 60.0
            dist = haversine_distance_m(v_lat, v_lon, m.latitude, m.longitude)
            if dist <= max_spatial_m:
                score = compute_match_score(dist, t_diff, max_spatial_m, temporal_tolerance_min)
                cand = {
                    "modis_id": m.observation_id,
                    "viirs_id": v.observation_id,
                    "modis_obs": m,
                    "viirs_obs": v,
                    "distance_m": round(dist, 1),
                    "time_delta_min": round(t_diff, 1),
                    "match_score": score,
                    "effective_spatial_limit_m": round(max_spatial_m, 1),
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

    # Only run Hungarian if method requested or candidate set is manageable
    if modis_obs and viirs_obs and (method == "global_assignment" or len(modis_obs) * len(viirs_obs) <= 500000):
        try:
            # Build sparse cost matrix only for pairs that actually have candidates
            active_m_ids = set()
            active_v_ids = set()
            for v_id, cands in candidates_by_viirs.items():
                if cands:
                    active_v_ids.add(v_id)
                    for c in cands:
                        active_m_ids.add(c["modis_id"])

            if active_m_ids and active_v_ids:
                sub_modis = [m for m in modis_obs if m.observation_id in active_m_ids]
                sub_viirs = [v for v in viirs_obs if v.observation_id in active_v_ids]
                modis_id_to_idx = {m.observation_id: idx for idx, m in enumerate(sub_modis)}
                viirs_id_to_idx = {v.observation_id: idx for idx, v in enumerate(sub_viirs)}

                cost_matrix = np.full((len(sub_modis), len(sub_viirs)), 1e6)
                for v_id, cands in candidates_by_viirs.items():
                    if v_id in viirs_id_to_idx:
                        v_idx = viirs_id_to_idx[v_id]
                        for c in cands:
                            m_idx = modis_id_to_idx[c["modis_id"]]
                            cost_matrix[m_idx, v_idx] = 1.0 - c["match_score"]

                row_ind, col_ind = linear_sum_assignment(cost_matrix)
                for r, c in zip(row_ind, col_ind):
                    if cost_matrix[r, c] < 1e5:
                        m = sub_modis[r]
                        v = sub_viirs[c]
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
        except Exception:
            global_pairs = greedy_pairs
            global_modis_matched = greedy_modis_matched
            global_viirs_matched = greedy_viirs_matched
    else:
        global_pairs = greedy_pairs
        global_modis_matched = greedy_modis_matched
        global_viirs_matched = greedy_viirs_matched

    # Select active match set based on user choice
    active_pairs = global_pairs if method == "global_assignment" else greedy_pairs
    active_modis_matched = global_modis_matched if method == "global_assignment" else greedy_modis_matched
    active_viirs_matched = global_viirs_matched if method == "global_assignment" else greedy_viirs_matched

    # Create mapping from observation_id to counterpart and pair_id
    pair_map: Dict[str, Tuple[str, str]] = {}
    for p in active_pairs:
        pair_map[p["modis_id"]] = (p["viirs_id"], p["pair_id"])
        pair_map[p["viirs_id"]] = (p["modis_id"], p["pair_id"])

    matched_observations: List[NormalizedObservation] = []
    for obs in observations:
        obs_copy = obs.model_copy() if hasattr(obs, "model_copy") else obs.copy()
        cands = candidates_by_modis.get(obs.observation_id, []) if obs.sensor == SensorType.MODIS else candidates_by_viirs.get(obs.observation_id, [])
        obs_copy.candidate_count = len(cands)
        obs_copy.is_ambiguous = len(cands) > 1

        if obs.sensor == SensorType.MODIS:
            if obs.observation_id in active_modis_matched:
                obs_copy.classification = ClassificationType.MATCHED
                matched_id, pair_id = pair_map[obs.observation_id]
                obs_copy.matched_observation_id = matched_id
                obs_copy.matched_pair_id = pair_id
            else:
                obs_copy.classification = ClassificationType.MODIS_ONLY
        elif obs.sensor == SensorType.VIIRS:
            if obs.observation_id in active_viirs_matched:
                obs_copy.classification = ClassificationType.MATCHED
                matched_id, pair_id = pair_map[obs.observation_id]
                obs_copy.matched_observation_id = matched_id
                obs_copy.matched_pair_id = pair_id
            else:
                obs_copy.classification = ClassificationType.VIIRS_ONLY
        matched_observations.append(obs_copy)

    # Compute Ambiguity Metrics
    multi_candidate_viirs = sum(1 for v_id, cands in candidates_by_viirs.items() if len(cands) > 1)
    multi_candidate_modis = sum(1 for m_id, cands in candidates_by_modis.items() if len(cands) > 1)
    unassigned_modis_count = len(modis_obs) - len(active_modis_matched)
    unassigned_viirs_count = len(viirs_obs) - len(active_viirs_matched)

    distances_greedy = [p["distance_m"] for p in greedy_pairs]
    avg_dist_greedy = round(float(np.mean(distances_greedy)), 1) if distances_greedy else 0.0

    distances_global = [p["distance_m"] for p in global_pairs]
    avg_dist_global = round(float(np.mean(distances_global)), 1) if distances_global else 0.0

    # Collect flat list of all unique candidate pairs for empirical sensitivity computation
    seen_cand_keys = set()
    all_candidate_edges = []
    for cands in candidates_by_viirs.values():
        for c in cands:
            key = (c["modis_id"], c["viirs_id"])
            if key not in seen_cand_keys:
                seen_cand_keys.add(key)
                all_candidate_edges.append({
                    "modis_id": c["modis_id"],
                    "viirs_id": c["viirs_id"],
                    "distance_m": c["distance_m"],
                    "time_delta_min": c["time_delta_min"],
                    "match_score": c["match_score"],
                })

    summary_stats = {
        "algorithm": method,
        "modis_total": len(modis_obs),
        "viirs_total": len(viirs_obs),
        "matched_pairs_count": len(active_pairs),
        "modis_matched_count": len(active_modis_matched),
        "viirs_matched_count": len(active_viirs_matched),
        "modis_only_count": unassigned_modis_count,
        "viirs_only_count": unassigned_viirs_count,
        "candidate_edges_count": len(all_candidate_edges),
        "candidate_edges": all_candidate_edges,
        "ambiguity": {
            "multi_candidate_viirs_count": multi_candidate_viirs,
            "multi_candidate_modis_count": multi_candidate_modis,
            "unassigned_modis_count": unassigned_modis_count,
            "unassigned_viirs_count": unassigned_viirs_count,
        },
        "algorithm_comparison": {
            "greedy_1toMany": {
                "pairs_count": len(greedy_pairs),
                "modis_matched": len(greedy_modis_matched),
                "viirs_matched": len(greedy_viirs_matched),
                "mean_distance_m": avg_dist_greedy,
                "description": "Baseline 1-to-many greedy nearest-neighbor."
            },
            "global_assignment_1to1": {
                "pairs_count": len(global_pairs),
                "modis_matched": len(global_modis_matched),
                "viirs_matched": len(global_viirs_matched),
                "mean_distance_m": avg_dist_global,
                "description": "Global optimal 1-to-1 bipartite assignment."
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
    """Sweep across spatial distance thresholds to quantify empirical matching sensitivity."""
    results = []
    modis_count = len([o for o in observations if o.sensor == SensorType.MODIS])

    if not observations or modis_count == 0:
        return [SensitivityPoint(tolerance_m=tol, matched_fraction=0.0, matched_pairs=0) for tol in tolerances_m]

    # Precompute pairwise candidates at maximum tolerance once
    max_tol = max(tolerances_m)
    _, max_stats = match_observations(
        observations,
        spatial_tolerance_m=max_tol,
        temporal_tolerance_min=temporal_tolerance_min,
        use_adaptive_footprint=False,
    )
    all_edges = max_stats.get("candidate_edges", [])

    for tol in sorted(tolerances_m):
        matching_edges = [e for e in all_edges if e["distance_m"] <= tol]
        matched_modis_ids = {e["modis_id"] for e in matching_edges}
        fraction = round(len(matched_modis_ids) / max(modis_count, 1), 3)
        results.append(SensitivityPoint(
            tolerance_m=tol,
            matched_fraction=fraction,
            matched_pairs=len(matching_edges)
        ))
    return results
