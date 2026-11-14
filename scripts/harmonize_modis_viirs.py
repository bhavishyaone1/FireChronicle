#!/usr/bin/env python3
"""
FireChronicle High-Performance Cross-Sensor Harmonization & Common Grid Pipeline
Combines real NASA MODIS C6.1 and VIIRS NOAA-20 C2 active-fire observations across India.
Generates:
1. data/processed/canonical_observations.parquet
2. data/processed/candidate_correspondences.parquet
3. data/processed/grid_daily_activity.parquet
4. reports/harmonization_validation_report.md
"""

import sys
import time
import math
import json
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np

# Ensure root import path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

DATA_DIR = Path("data")
INTERIM_DIR = DATA_DIR / "interim"
PROCESSED_DIR = DATA_DIR / "processed"
REPORTS_DIR = Path("reports")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

MODIS_PARQUET = INTERIM_DIR / "modis_india.parquet"
VIIRS_PARQUET = INTERIM_DIR / "viirs_india.parquet"

CANONICAL_PARQUET = PROCESSED_DIR / "canonical_observations.parquet"
CORRESPONDENCES_PARQUET = PROCESSED_DIR / "candidate_correspondences.parquet"
GRID_DAILY_PARQUET = PROCESSED_DIR / "grid_daily_activity.parquet"
VALIDATION_REPORT = REPORTS_DIR / "harmonization_validation_report.md"

R_EARTH_KM = 6371.0088


def run_harmonization():
    print("=" * 70, flush=True)
    print("FireChronicle High-Performance Harmonization Pipeline", flush=True)
    print("=" * 70, flush=True)

    t0 = time.time()
    print(f"Loading MODIS interim: {MODIS_PARQUET}...", flush=True)
    df_modis = pd.read_parquet(MODIS_PARQUET)
    print(f"Loaded {len(df_modis):,} MODIS records.", flush=True)

    print(f"Loading VIIRS interim: {VIIRS_PARQUET}...", flush=True)
    df_viirs = pd.read_parquet(VIIRS_PARQUET)
    print(f"Loaded {len(df_viirs):,} VIIRS records.", flush=True)

    # 1. Combine into Canonical Observations Parquet
    print("\nMerging into unified Canonical Observations schema...", flush=True)
    df_modis["raw_confidence"] = df_modis["raw_confidence"].astype(str)
    df_viirs["raw_confidence"] = df_viirs["raw_confidence"].astype(str)
    if "anomaly_type" in df_modis.columns:
        df_modis["anomaly_type"] = df_modis["anomaly_type"].astype(str)
    if "anomaly_type" in df_viirs.columns:
        df_viirs["anomaly_type"] = df_viirs["anomaly_type"].astype(str)

    df_canonical = pd.concat([df_modis, df_viirs], ignore_index=True)
    df_canonical = df_canonical.sort_values(by="acq_datetime_utc")
    df_canonical.to_parquet(CANONICAL_PARQUET, index=False)
    print(f"Saved canonical dataset: {CANONICAL_PARQUET} ({CANONICAL_PARQUET.stat().st_size / (1024*1024):.2f} MB)", flush=True)
    print(f"Total Canonical Observations: {len(df_canonical):,}", flush=True)

    # 2. Vectorized Spatio-Temporal Candidate Matching (<= 1000m & <= 3600s)
    print("\nExecuting Vectorized Spatio-Temporal Candidate Matching (1 km & <= 60 min)...", flush=True)
    t_match = time.time()

    df_modis["dt"] = pd.to_datetime(df_modis["acq_datetime_utc"])
    df_viirs["dt"] = pd.to_datetime(df_viirs["acq_datetime_utc"])

    m_sub = df_modis[["observation_id", "acq_date_utc", "grid_cell_id", "dt", "latitude", "longitude", "frp_mw", "platform", "india_state"]]
    v_sub = df_viirs[["observation_id", "acq_date_utc", "grid_cell_id", "dt", "latitude", "longitude", "frp_mw", "platform"]]

    # Fast hash join on common date and 1 km grid cell
    merged = pd.merge(m_sub, v_sub, on=["acq_date_utc", "grid_cell_id"], suffixes=("_modis", "_viirs"))
    print(f"Found {len(merged):,} spatial grid overlaps across India.", flush=True)

    if not merged.empty:
        time_deltas = (merged["dt_modis"] - merged["dt_viirs"]).abs().dt.total_seconds()
        time_mask = time_deltas <= 3600.0
        merged = merged[time_mask].copy()
        merged["temporal_delta_sec"] = time_deltas[time_mask].astype(int)

        lat1 = np.radians(merged["latitude_modis"].to_numpy())
        lon1 = np.radians(merged["longitude_modis"].to_numpy())
        lat2 = np.radians(merged["latitude_viirs"].to_numpy())
        lon2 = np.radians(merged["longitude_viirs"].to_numpy())

        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
        c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
        dist_m = R_EARTH_KM * 1000.0 * c

        dist_mask = dist_m <= 1000.0
        valid_pairs = merged[dist_mask].copy()
        valid_pairs["spatial_separation_m"] = np.round(dist_m[dist_mask], 1)
        valid_pairs["match_score"] = np.round(np.clip(
            1.0 - (valid_pairs["spatial_separation_m"] / 1000.0) * 0.5 - (valid_pairs["temporal_delta_sec"] / 3600.0) * 0.5,
            0.0, 1.0
        ), 3)

        valid_pairs["pair_id"] = (
            "PAIR_" + valid_pairs["observation_id_modis"].str.slice(0, 12) + "_" + valid_pairs["observation_id_viirs"].str.slice(0, 12)
        )

        valid_pairs.rename(columns={
            "observation_id_modis": "modis_observation_id",
            "observation_id_viirs": "viirs_observation_id",
            "platform_modis": "modis_platform",
            "platform_viirs": "viirs_platform",
            "latitude_modis": "modis_lat",
            "longitude_modis": "modis_lon",
            "latitude_viirs": "viirs_lat",
            "longitude_viirs": "viirs_lon",
            "frp_mw_modis": "modis_frp_mw",
            "frp_mw_viirs": "viirs_frp_mw",
        }, inplace=True)

        cols_order = [
            "pair_id", "acq_date_utc", "modis_observation_id", "viirs_observation_id",
            "modis_platform", "viirs_platform", "modis_lat", "modis_lon", "viirs_lat", "viirs_lon",
            "spatial_separation_m", "temporal_delta_sec", "match_score", "grid_cell_id",
            "modis_frp_mw", "viirs_frp_mw", "india_state"
        ]
        df_pairs = valid_pairs[cols_order].copy()
    else:
        df_pairs = pd.DataFrame()

    df_pairs.to_parquet(CORRESPONDENCES_PARQUET, index=False)
    print(f"Generated {len(df_pairs):,} Candidate Correspondences in {time.time() - t_match:.2f}s ({CORRESPONDENCES_PARQUET.stat().st_size / (1024*1024):.2f} MB)", flush=True)

    unique_modis = len(df_pairs["modis_observation_id"].unique()) if not df_pairs.empty else 0
    unique_viirs = len(df_pairs["viirs_observation_id"].unique()) if not df_pairs.empty else 0
    print(f"Unique MODIS participating: {unique_modis:,} ({unique_modis / len(df_modis) * 100:.2f}%)", flush=True)
    print(f"Unique VIIRS participating: {unique_viirs:,} ({unique_viirs / len(df_viirs) * 100:.2f}%)", flush=True)

    # 3. Vectorized Daily Grid Activity Aggregation (1.0 km Equal-Area Grid)
    print("\nAggregating Burning-Activity Calendar by 1 km Equal-Area Grid...", flush=True)
    t_daily = time.time()

    # Fast groupby aggregation using set operations
    m_grp = df_modis.groupby("acq_date_utc").agg(
        modis_raw_count=("observation_id", "count"),
        modis_cells=("grid_cell_id", lambda x: set(x.dropna())),
        mean_frp_modis=("frp_mw", "mean")
    )
    v_grp = df_viirs.groupby("acq_date_utc").agg(
        viirs_raw_count=("observation_id", "count"),
        viirs_cells=("grid_cell_id", lambda x: set(x.dropna())),
        mean_frp_viirs=("frp_mw", "mean")
    )

    all_dates = sorted(list(set(m_grp.index).union(set(v_grp.index))))
    daily_rows = []

    for d in all_dates:
        m_row = m_grp.loc[d] if d in m_grp.index else None
        v_row = v_grp.loc[d] if d in v_grp.index else None

        m_count = int(m_row["modis_raw_count"]) if m_row is not None else 0
        v_count = int(v_row["viirs_raw_count"]) if v_row is not None else 0
        m_set = m_row["modis_cells"] if m_row is not None else set()
        v_set = v_row["viirs_cells"] if v_row is not None else set()

        combined_set = m_set.union(v_set)
        matched_set = m_set.intersection(v_set)

        daily_rows.append({
            "date": d,
            "unique_active_cells": len(combined_set),
            "modis_raw_count": m_count,
            "viirs_raw_count": v_count,
            "matched_active_cells": len(matched_set),
            "modis_only_cells": len(m_set - v_set),
            "viirs_only_cells": len(v_set - m_set),
            "mean_frp_modis": round(float(m_row["mean_frp_modis"]), 2) if m_row is not None and not math.isnan(m_row["mean_frp_modis"]) else 0.0,
            "mean_frp_viirs": round(float(v_row["mean_frp_viirs"]), 2) if v_row is not None and not math.isnan(v_row["mean_frp_viirs"]) else 0.0,
        })

    df_daily = pd.DataFrame(daily_rows)
    df_daily.sort_values(by="date", inplace=True)
    df_daily.to_parquet(GRID_DAILY_PARQUET, index=False)
    print(f"Generated {len(df_daily)} daily activity records in {time.time() - t_daily:.2f}s ({GRID_DAILY_PARQUET.stat().st_size / (1024*1024):.2f} MB)", flush=True)

    # 4. Generate Validation Report
    report_md = f"""# Cross-Sensor Harmonization & Common Grid Validation Report

**Pipeline Execution Date:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}  
**Target Region:** Republic of India (`[68.1°E, 6.5°N, 97.4°E, 37.1°N]`)  
**Spatial Collocation Criterion:** $\\le 1.0\\text{{ km}}$ Euclidean/Haversine distance  
**Temporal Collocation Criterion:** $\\le 3600\\text{{ s}}$ (60 minutes) overpass time delta  
**Common Projection:** Authalic Lambert Cylindrical Equal-Area Grid ($1.0\\text{{ km}} \\times 1.0\\text{{ km}}$, EPSG:6933)  

---

## 1. Harmonization Inventory & Candidate Correspondences

| Metric | Scientific Semantics | Verified Numeric Value |
| :--- | :--- | :--- |
| **Total MODIS India Observations** | Raw 1 km pixel detections | {len(df_modis):,} |
| **Total VIIRS India Observations** | Raw 375 m pixel detections | {len(df_viirs):,} |
| **Canonical Combined Dataset** | All observations indexed without loss | {len(df_canonical):,} |
| **Candidate Correspondence Edges** | Pairs meeting $\\le 1\\text{{ km}}$ and $\\le 60\\text{{ min}}$ | {len(df_pairs):,} |
| **Unique MODIS in Candidate Pairs** | Distinct MODIS detections collocated with VIIRS | {unique_modis:,} ({round(unique_modis/len(df_modis)*100, 2)}%) |
| **Unique VIIRS in Candidate Pairs** | Distinct VIIRS detections collocated with MODIS | {unique_viirs:,} ({round(unique_viirs/len(df_viirs)*100, 2)}%) |
| **Mean Spatial Separation** | Collocation distance between paired centroids | {round(df_pairs['spatial_separation_m'].mean(), 1) if not df_pairs.empty else 0.0} m |
| **Mean Temporal Separation** | Overpass delta between Terra/Aqua and NOAA-20 | {round(df_pairs['temporal_delta_sec'].mean()/60.0, 1) if not df_pairs.empty else 0.0} min |

---

## 2. Invariant Rules Enforced

1. **Non-Duplication Rule:**
   - Candidate pairs are treated strictly as correspondence edges, not merged observations.
   - MODIS and VIIRS FRP are stored and summarized separately. They are **never summed together** for candidate matches.
2. **One-to-Many Collocation Preservation:**
   - Because VIIRS 375 m has ~7x finer ground pixel area than MODIS 1 km, multiple VIIRS observations collocate with a single MODIS footprint.
   - All fine-scale VIIRS observations are fully preserved; no artificial sub-pixel MODIS records were synthesized.
3. **Common Equal-Area Deduplication:**
   - Burning activity calendar metric `unique_active_cells` deduplicates co-occurring detections within the same 1 km cell.
"""
    with open(VALIDATION_REPORT, "w", encoding="utf-8") as f:
        f.write(report_md)
    print(f"Saved validation report to {VALIDATION_REPORT}", flush=True)

    dt = time.time() - t0
    print(f"\nHarmonization pipeline completed successfully in {dt:.2f}s!", flush=True)


if __name__ == "__main__":
    run_harmonization()
