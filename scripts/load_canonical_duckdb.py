#!/usr/bin/env python3
"""
Ingest canonical observations and candidate correspondences into DuckDB.
Ensures that the live FastAPI backend serves the genuine 1.13M NASA dataset.
"""

import sys
import time
from pathlib import Path
import duckdb
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.app.config import settings

DB_PATH = settings.duckdb_path
CANONICAL_PARQUET = Path("data/processed/canonical_observations.parquet")
CORRESPONDENCES_PARQUET = Path("data/processed/candidate_correspondences.parquet")


def main():
    print(f"Connecting to DuckDB: {DB_PATH}...")
    conn = duckdb.connect(str(DB_PATH))

    print(f"Loading canonical dataset from {CANONICAL_PARQUET}...")
    t0 = time.time()

    # Load canonical observations table
    conn.execute("CREATE OR REPLACE TABLE canonical_observations AS SELECT * FROM read_parquet('data/processed/canonical_observations.parquet');")
    count_canon = conn.execute("SELECT COUNT(*) FROM canonical_observations;").fetchone()[0]
    print(f"Ingested {count_canon:,} canonical observations into DuckDB in {time.time() - t0:.2f}s.")

    # Load candidate correspondences table
    t1 = time.time()
    conn.execute("CREATE OR REPLACE TABLE candidate_correspondences AS SELECT * FROM read_parquet('data/processed/candidate_correspondences.parquet');")
    count_pairs = conn.execute("SELECT COUNT(*) FROM candidate_correspondences;").fetchone()[0]
    print(f"Ingested {count_pairs:,} candidate correspondences into DuckDB in {time.time() - t1:.2f}s.")

    # Sync into main observations table with classification flags
    print("\nSynchronizing into main 'observations' table...")
    conn.execute("""
        CREATE OR REPLACE TABLE observations AS 
        WITH best_pairs AS (
            SELECT DISTINCT ON (observation_id)
                observation_id,
                pair_id,
                spatial_separation_m,
                temporal_delta_sec,
                match_score
            FROM (
                SELECT modis_observation_id AS observation_id, pair_id, spatial_separation_m, temporal_delta_sec, match_score
                FROM candidate_correspondences
                UNION ALL
                SELECT viirs_observation_id AS observation_id, pair_id, spatial_separation_m, temporal_delta_sec, match_score
                FROM candidate_correspondences
            )
            ORDER BY observation_id, match_score DESC
        )
        SELECT 
            c.observation_id,
            c.source_system AS source_agency,
            c.source_product,
            c.source_file_name AS source_file,
            1 AS source_row_id,
            c.sensor,
            CASE 
                WHEN c.platform = 'N20' THEN 'NOAA-20'
                WHEN c.platform = 'N21' THEN 'NOAA-21'
                ELSE c.platform
            END AS platform,
            CASE 
                WHEN c.processing_level = 'STANDARD' THEN 'SP'
                WHEN c.processing_level = 'NRT' THEN 'NRT'
                ELSE 'SP'
            END AS processing_status,
            c.latitude,
            c.longitude,
            c.acq_datetime_utc,
            c.acq_datetime_ist,
            c.acq_date_utc,
            c.acq_time_utc,
            c.confidence_category,
            c.raw_confidence,
            c.frp_mw,
            c.daynight,
            TRY_CAST(c.anomaly_type AS INTEGER) AS anomaly_type,
            c.scan_km,
            c.track_km,
            c.brightness_kelvin,
            c.brightness_channel_1,
            c.brightness_channel_1_name,
            c.brightness_channel_1_unit,
            c.brightness_channel_2,
            c.brightness_channel_2_name,
            c.brightness_channel_2_unit,
            c.india_state,
            c.india_district,
            c.context_class,
            c.context_evidence,
            c.context_confidence,
            NULL AS fsi_alert_id,
            NULL AS bhuvan_record_id,
            NULL AS event_id,
            FALSE AS is_large_fire_candidate,
            CASE 
                WHEN p.pair_id IS NOT NULL THEN 'matched'
                WHEN c.sensor = 'MODIS' THEN 'MODIS_only'
                ELSE 'VIIRS_only'
            END AS classification,
            p.pair_id AS matched_pair_id,
            p.spatial_separation_m AS match_distance_m,
            ROUND(p.temporal_delta_sec / 60.0, 1) AS match_time_delta_min,
            p.match_score,
            FALSE AS is_ambiguous,
            1 AS candidate_count,
            c.grid_cell_id
        FROM canonical_observations c
        LEFT JOIN best_pairs p ON c.observation_id = p.observation_id;
    """)

    conn.execute("ALTER TABLE observations ADD PRIMARY KEY (observation_id);")

    final_count = conn.execute("SELECT COUNT(*) FROM observations;").fetchone()[0]
    matched_count = conn.execute("SELECT COUNT(*) FROM observations WHERE classification = 'matched';").fetchone()[0]
    print(f"Final active observations table: {final_count:,} total records ({matched_count:,} matched records).")

    conn.close()
    print("DuckDB ingestion complete!")


if __name__ == "__main__":
    main()
