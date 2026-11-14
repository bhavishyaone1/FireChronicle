"""
Scientific Uncertainty Quantification and Resampling Module for FireChronicle.
Provides bootstrap confidence intervals (BCI), sensitivity curves, and sample-size accounting.
Enforces rigorous statistical reporting: every statistic is reported with its sample size (n)
and 95% bootstrap confidence interval.
"""

from typing import List, Dict, Any, Tuple, Optional, Callable
import numpy as np


def compute_bootstrap_ci(
    data: np.ndarray,
    stat_fn: Callable[[np.ndarray], float],
    n_bootstraps: int = 1000,
    confidence_level: float = 0.95,
    seed: int = 42,
) -> Dict[str, Any]:
    """
    Compute empirical bootstrap confidence interval for any scalar statistic.

    Parameters:
    - data: 1D or 2D numpy array of observations
    - stat_fn: Function that maps a resampled array to a scalar float
    - n_bootstraps: Number of Monte Carlo resamples (default 1000)
    - confidence_level: Interval coverage (default 0.95)
    - seed: Deterministic PRNG seed for scientific reproducibility

    Returns:
    - dict with point_estimate, ci_lower, ci_upper, standard_error, sample_size_n
    """
    n = len(data)
    if n == 0:
        return {
            "point_estimate": 0.0,
            "ci_lower": 0.0,
            "ci_upper": 0.0,
            "standard_error": 0.0,
            "sample_size_n": 0,
            "n_bootstraps": n_bootstraps,
        }

    rng = np.random.default_rng(seed)
    point_est = float(stat_fn(data))

    if n == 1:
        return {
            "point_estimate": round(point_est, 4),
            "ci_lower": round(point_est, 4),
            "ci_upper": round(point_est, 4),
            "standard_error": 0.0,
            "sample_size_n": 1,
            "n_bootstraps": n_bootstraps,
        }

    # Resample with replacement
    indices = rng.integers(0, n, size=(n_bootstraps, n))
    bootstrap_samples = data[indices]
    
    # Compute statistic for each bootstrap resample
    boot_stats = np.empty(n_bootstraps, dtype=float)
    for b in range(n_bootstraps):
        boot_stats[b] = stat_fn(bootstrap_samples[b])

    # Filter out NaNs if any
    boot_stats = boot_stats[np.isfinite(boot_stats)]
    if len(boot_stats) == 0:
        return {
            "point_estimate": round(point_est, 4),
            "ci_lower": round(point_est, 4),
            "ci_upper": round(point_est, 4),
            "standard_error": 0.0,
            "sample_size_n": n,
            "n_bootstraps": n_bootstraps,
        }

    alpha = (1.0 - confidence_level) / 2.0
    ci_lower = float(np.percentile(boot_stats, alpha * 100))
    ci_upper = float(np.percentile(boot_stats, (1.0 - alpha) * 100))
    se = float(np.std(boot_stats, ddof=1))

    return {
        "point_estimate": round(point_est, 4),
        "ci_lower": round(max(0.0, ci_lower), 4),
        "ci_upper": round(min(1.0 if point_est <= 1.0 else ci_upper, ci_upper), 4),
        "standard_error": round(se, 4),
        "sample_size_n": n,
        "n_bootstraps": n_bootstraps,
    }


def compute_matched_fraction_uncertainty(
    is_matched_bool_array: List[bool],
    n_bootstraps: int = 1000,
    seed: int = 42,
) -> Dict[str, Any]:
    """
    Compute bootstrap confidence interval for matched fraction (e.g. MODIS or VIIRS detections).
    Input: list or array of booleans indicating whether each detection found a candidate counterpart.
    """
    arr = np.array(is_matched_bool_array, dtype=float)
    return compute_bootstrap_ci(
        data=arr,
        stat_fn=lambda x: float(np.mean(x)),
        n_bootstraps=n_bootstraps,
        confidence_level=0.95,
        seed=seed,
    )


def compute_jaccard_uncertainty(
    cells_modis_by_day: List[set],
    cells_viirs_by_day: List[set],
    n_bootstraps: int = 1000,
    seed: int = 42,
) -> Dict[str, Any]:
    """
    Compute bootstrap confidence interval for multi-day mean Jaccard spatial agreement index.
    Resamples across observation days.
    """
    n_days = len(cells_modis_by_day)
    if n_days == 0 or len(cells_viirs_by_day) != n_days:
        return {
            "point_estimate": 0.0,
            "ci_lower": 0.0,
            "ci_upper": 0.0,
            "standard_error": 0.0,
            "sample_size_n": 0,
            "n_bootstraps": n_bootstraps,
        }

    daily_jaccards = []
    for m_set, v_set in zip(cells_modis_by_day, cells_viirs_by_day):
        u = len(m_set.union(v_set))
        i = len(m_set.intersection(v_set))
        daily_jaccards.append(i / u if u > 0 else 0.0)

    data = np.array(daily_jaccards, dtype=float)
    return compute_bootstrap_ci(
        data=data,
        stat_fn=lambda x: float(np.mean(x)),
        n_bootstraps=n_bootstraps,
        confidence_level=0.95,
        seed=seed,
    )


def compute_empirical_sensitivity_curves(
    candidate_pairs: List[Dict[str, Any]],
    modis_total: int,
    viirs_total: int,
    distance_thresholds_m: Optional[List[float]] = None,
    time_thresholds_min: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Compute exact, un-modeled sensitivity curves by evaluating the candidate pair population
    under varying spatial and temporal thresholds.
    """
    if distance_thresholds_m is None:
        distance_thresholds_m = [375.0, 500.0, 750.0, 1000.0, 1500.0, 2000.0]
    if time_thresholds_min is None:
        time_thresholds_min = [15.0, 30.0, 45.0, 60.0, 90.0, 120.0, 180.0]

    # Pre-extract numpy arrays of distances and time deltas
    if candidate_pairs:
        dists = np.array([p["distance_m"] for p in candidate_pairs], dtype=float)
        times = np.array([p["time_delta_min"] for p in candidate_pairs], dtype=float)
        m_ids = [p["modis_id"] for p in candidate_pairs]
        v_ids = [p["viirs_id"] for p in candidate_pairs]
    else:
        dists = np.array([], dtype=float)
        times = np.array([], dtype=float)
        m_ids = []
        v_ids = []

    # 1. Spatial sensitivity curve at fixed default 60 min window
    spatial_curve = []
    fixed_time_min = 60.0
    for d_tol in distance_thresholds_m:
        if len(dists) > 0:
            mask = (dists <= d_tol) & (times <= fixed_time_min)
            active_pairs = int(np.sum(mask))
            unique_m = len(set(np.array(m_ids)[mask])) if active_pairs > 0 else 0
            unique_v = len(set(np.array(v_ids)[mask])) if active_pairs > 0 else 0
        else:
            active_pairs = 0
            unique_m = 0
            unique_v = 0

        spatial_curve.append({
            "tolerance_m": float(d_tol),
            "matched_pairs": active_pairs,
            "modis_matched_count": unique_m,
            "viirs_matched_count": unique_v,
            "modis_matched_fraction": round(unique_m / max(modis_total, 1), 4),
            "viirs_matched_fraction": round(unique_v / max(viirs_total, 1), 4),
        })

    # 2. Temporal sensitivity curve at fixed default 1000 m distance
    temporal_curve = []
    fixed_dist_m = 1000.0
    for t_tol in time_thresholds_min:
        if len(times) > 0:
            mask = (dists <= fixed_dist_m) & (times <= t_tol)
            active_pairs = int(np.sum(mask))
            unique_m = len(set(np.array(m_ids)[mask])) if active_pairs > 0 else 0
            unique_v = len(set(np.array(v_ids)[mask])) if active_pairs > 0 else 0
        else:
            active_pairs = 0
            unique_m = 0
            unique_v = 0

        temporal_curve.append({
            "temporal_window_min": float(t_tol),
            "matched_pairs": active_pairs,
            "modis_matched_count": unique_m,
            "viirs_matched_count": unique_v,
            "modis_matched_fraction": round(unique_m / max(modis_total, 1), 4),
            "viirs_matched_fraction": round(unique_v / max(viirs_total, 1), 4),
        })

    return {
        "spatial_sensitivity_curve": spatial_curve,
        "temporal_sensitivity_curve": temporal_curve,
        "sample_sizes": {
            "modis_total_n": modis_total,
            "viirs_total_n": viirs_total,
            "candidate_edges_n": len(candidate_pairs),
        }
    }
