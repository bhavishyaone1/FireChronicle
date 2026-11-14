import duckdb
from pathlib import Path

db_path = Path("data/firechronicle.duckdb")
parquet_path = Path("data/processed/canonical_observations.parquet").as_posix()

c = duckdb.connect(str(db_path))
print("Current tables:", c.execute("SHOW TABLES").fetchall())

# Create or replace table directly from parquet for lightning-fast 100% schema match
c.execute(f"""
    CREATE OR REPLACE TABLE observations AS 
    SELECT 
        *,
        source_system as source_agency,
        source_file_name as source_file,
        'unmatched' as classification,
        CAST(NULL AS VARCHAR) as matched_pair_id,
        CAST(NULL AS VARCHAR) as matched_observation_id,
        CAST(NULL AS DOUBLE) as match_distance_m,
        CAST(NULL AS DOUBLE) as match_time_delta_min,
        CAST(NULL AS DOUBLE) as match_score,
        false as is_ambiguous,
        1 as candidate_count,
        CAST(NULL AS VARCHAR) as fsi_alert_id,
        CAST(NULL AS VARCHAR) as bhuvan_record_id,
        CAST(NULL AS VARCHAR) as event_id,
        false as is_large_fire_candidate
    FROM read_parquet('{parquet_path}')
""")

cnt = c.execute("SELECT COUNT(*) FROM observations").fetchone()[0]
print("Loaded observations count:", cnt)

# Check distinct source files
src_files = c.execute("SELECT DISTINCT source_file FROM observations").fetchall()
print("Source files:", src_files)

# Update classification for matched records if candidate_correspondences exists
pairs_parquet = Path("data/processed/candidate_correspondences.parquet")
if pairs_parquet.exists():
    c.execute(f"""
        CREATE OR REPLACE TABLE candidate_correspondences AS
        SELECT * FROM read_parquet('{pairs_parquet.as_posix()}')
    """)
    pairs_cnt = c.execute("SELECT COUNT(*) FROM candidate_correspondences").fetchone()[0]
    print("Candidate correspondences count:", pairs_cnt)

    # Mark matched observations
    c.execute("""
        UPDATE observations 
        SET classification = 'matched',
            matched_pair_id = 'PAIR-' || c.modis_observation_id || '-' || c.viirs_observation_id,
            matched_observation_id = CASE 
                WHEN observations.observation_id = c.modis_observation_id THEN c.viirs_observation_id
                ELSE c.modis_observation_id
            END,
            match_distance_m = c.spatial_separation_m,
            match_time_delta_min = c.temporal_delta_sec / 60.0
        FROM candidate_correspondences c
        WHERE observations.observation_id = c.modis_observation_id 
           OR observations.observation_id = c.viirs_observation_id
    """)

    # Mark unmatched records as MODIS_only or VIIRS_only
    c.execute("""
        UPDATE observations
        SET classification = CASE 
            WHEN sensor = 'MODIS' THEN 'MODIS_only'
            ELSE 'VIIRS_only'
        END
        WHERE matched_pair_id IS NULL
    """)

# Create performance indexes
c.execute("CREATE INDEX IF NOT EXISTS idx_obs_coords ON observations (latitude, longitude)")
c.execute("CREATE INDEX IF NOT EXISTS idx_obs_date ON observations (acq_date_utc)")
c.execute("CREATE INDEX IF NOT EXISTS idx_obs_sensor ON observations (sensor)")
c.execute("CREATE INDEX IF NOT EXISTS idx_obs_state ON observations (india_state)")
c.execute("CREATE INDEX IF NOT EXISTS idx_obs_class ON observations (classification)")
c.execute("CREATE INDEX IF NOT EXISTS idx_obs_context ON observations (context_class)")

print("Indexes created. Final checks:")
print("Sensors:", c.execute("SELECT sensor, COUNT(*) FROM observations GROUP BY sensor").fetchall())
print("Classifications:", c.execute("SELECT classification, COUNT(*) FROM observations GROUP BY classification").fetchall())
print("Context classes:", c.execute("SELECT context_class, COUNT(*) FROM observations GROUP BY context_class").fetchall())

c.close()
print("DuckDB database successfully loaded and indexed!")
