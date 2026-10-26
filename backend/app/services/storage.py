"""DuckDB and Parquet Analytical Storage Engine."""

from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import threading
import duckdb
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from backend.app.config import settings
from backend.app.schemas.observation import NormalizedObservation


class StorageEngine:
    """In-process analytical storage engine using DuckDB and Parquet."""
    
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.duckdb_path
        self._conn = None
        self._lock = threading.RLock()
        self._init_db()

    def get_connection(self) -> duckdb.DuckDBPyConnection:
        with self._lock:
            if self._conn is None:
                try:
                    self._conn = duckdb.connect(str(self.db_path))
                except duckdb.IOException:
                    # Primary database file is held by another process. Fall back to in-memory.
                    self._conn = duckdb.connect(":memory:")
                self._conn.execute("SET max_memory = '1GB';")
                self._conn.execute("SET threads = 2;")
            return self._conn

    def _init_db(self):
        conn = self.get_connection()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS observations (
                observation_id VARCHAR PRIMARY KEY,
                source_product VARCHAR,
                source_file VARCHAR,
                source_row_id INTEGER,
                sensor VARCHAR,
                platform VARCHAR,
                processing_status VARCHAR,
                latitude DOUBLE,
                longitude DOUBLE,
                acq_datetime_utc VARCHAR,
                acq_date_utc VARCHAR,
                acq_time_utc VARCHAR,
                confidence_category VARCHAR,
                raw_confidence VARCHAR,
                frp_mw DOUBLE,
                daynight VARCHAR,
                anomaly_type INTEGER,
                scan_km DOUBLE,
                track_km DOUBLE,
                brightness_kelvin DOUBLE,
                classification VARCHAR,
                matched_pair_id VARCHAR,
                match_distance_m DOUBLE,
                match_time_delta_min DOUBLE,
                match_score DOUBLE,
                is_ambiguous BOOLEAN,
                candidate_count INTEGER,
                grid_cell_id VARCHAR
            );
            ALTER TABLE observations ADD COLUMN IF NOT EXISTS match_score DOUBLE;
            ALTER TABLE observations ADD COLUMN IF NOT EXISTS is_ambiguous BOOLEAN;
            ALTER TABLE observations ADD COLUMN IF NOT EXISTS candidate_count INTEGER;
            CREATE INDEX IF NOT EXISTS idx_obs_coords ON observations (latitude, longitude);
            CREATE INDEX IF NOT EXISTS idx_obs_date ON observations (acq_date_utc);
            CREATE INDEX IF NOT EXISTS idx_obs_sensor ON observations (sensor);
        """)
        # If in-memory connection and parquet exists, populate existing records
        parquet_file = settings.processed_data_dir / "harmonized_observations.parquet"
        if parquet_file.exists():
            try:
                posix_path = parquet_file.as_posix()
                conn.execute(f"INSERT OR IGNORE INTO observations SELECT * FROM read_parquet('{posix_path}');")
            except Exception:
                pass

    def save_observations(self, observations: List[NormalizedObservation], parquet_filename: Optional[str] = None):
        """Save a list of observations into DuckDB and export to Parquet."""
        if not observations:
            return
            
        data = [obs.model_dump() for obs in observations]
        df = pd.DataFrame(data)
        
        # Ensure string representations for polymorphic fields
        df["raw_confidence"] = df["raw_confidence"].astype(str)
        df["sensor"] = df["sensor"].astype(str)
        df["platform"] = df["platform"].astype(str)
        df["processing_status"] = df["processing_status"].astype(str)
        df["confidence_category"] = df["confidence_category"].astype(str)
        df["classification"] = df["classification"].astype(str)
        
        with self._lock:
            conn = self.get_connection()
            cols = list(df.columns)
            cols_str = ", ".join(cols)
            conn.register("df_temp", df)
            
            # Insert or replace by explicit column mapping
            conn.execute(f"""
                INSERT OR REPLACE INTO observations ({cols_str}) 
                SELECT {cols_str} FROM df_temp;
            """)
            conn.unregister("df_temp")

        # Export to Parquet in processed directory
        if parquet_filename:
            parquet_path = settings.processed_data_dir / parquet_filename
            table = pa.Table.from_pandas(df)
            pq.write_table(table, parquet_path)

    def query_observations(
        self,
        bbox: Optional[List[float]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sensor: Optional[str] = None,
        classification: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> Tuple[List[NormalizedObservation], int]:
        """Query observations with bounding box, date ranges, and filters."""
        conditions = ["1=1"]
        params = []

        if bbox and len(bbox) == 4:
            west, south, east, north = bbox
            conditions.append("latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?")
            params.extend([south, north, west, east])

        if start_date:
            conditions.append("acq_date_utc >= ?")
            params.append(start_date)

        if end_date:
            conditions.append("acq_date_utc <= ?")
            params.append(end_date)

        if sensor and sensor != "ALL":
            conditions.append("sensor = ?")
            params.append(sensor)

        if classification and classification != "ALL":
            conditions.append("classification = ?")
            params.append(classification)

        where_clause = " AND ".join(conditions)

        count_sql = f"SELECT COUNT(*) FROM observations WHERE {where_clause}"
        data_sql = f"""
            SELECT * FROM observations 
            WHERE {where_clause}
            ORDER BY acq_datetime_utc ASC
            LIMIT ? OFFSET ?
        """
        data_params = params + [limit, offset]

        with self._lock:
            conn = self.get_connection()
            cursor = conn.cursor()
            try:
                total_count = cursor.execute(count_sql, params).fetchone()[0]
                rows_df = cursor.execute(data_sql, data_params).fetchdf()
            finally:
                cursor.close()

        records = []
        for raw_row in rows_df.to_dict(orient="records"):
            clean_row = {
                k: (None if pd.isna(v) else v)
                for k, v in raw_row.items()
            }
            records.append(NormalizedObservation(**clean_row))
        return records, total_count

    def get_dataset_provenance(self) -> Dict[str, Any]:
        """Detect provenance of currently stored active observations."""
        with self._lock:
            conn = self.get_connection()
            cursor = conn.cursor()
            try:
                rows = cursor.execute("SELECT DISTINCT source_file FROM observations").fetchall()
                files = [r[0] for r in rows if r[0]]
            finally:
                cursor.close()

        if not files:
            return {
                "provenance_type": "EMPTY",
                "label": "NO RECORDS IN DATABASE",
                "is_synthetic": False,
                "is_live": False,
                "description": "Database contains no observation records."
            }

        is_sample = any("sample_" in str(f).lower() for f in files)
        is_live = settings.is_firms_configured()

        if is_live:
            return {
                "provenance_type": "LIVE_NASA_FIRMS",
                "label": "LIVE NASA FIRMS",
                "is_synthetic": False,
                "is_live": True,
                "description": "Live observations retrieved directly from NASA FIRMS API via active MAP_KEY."
            }
        elif is_sample:
            return {
                "provenance_type": "SYNTHETIC_DEMO",
                "label": "SYNTHETIC DEMONSTRATION DATA",
                "is_synthetic": True,
                "is_live": False,
                "description": "Illustrative demonstration fixture — not real-time or verified NASA satellite observations."
            }
        else:
            return {
                "provenance_type": "UPLOADED_NASA_FIRMS_CSV",
                "label": "UPLOADED NASA FIRMS CSV",
                "is_synthetic": False,
                "is_live": False,
                "description": f"User-imported NASA FIRMS observation records from {', '.join(files[:3])}."
            }

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None


storage_engine = StorageEngine()
