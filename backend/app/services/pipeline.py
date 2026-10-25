"""End-to-end scientific harmonization pipeline execution."""

from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd

from backend.app.config import settings
from backend.app.schemas.common import SensorType, BoundingBox
from backend.app.schemas.observation import NormalizedObservation
from backend.app.services.normalizer import normalize_record
from backend.app.services.matcher import match_observations
from backend.app.services.storage import storage_engine


class HarmonizationPipeline:
    """Orchestrates data ingestion, validation, normalization, and matching."""

    @staticmethod
    def load_and_process_csv(
        file_path: Path,
        source_name: str,
        sensor: Optional[SensorType] = None,
        grid_size_km: float = 1.0
    ) -> List[NormalizedObservation]:
        """Read a CSV file, validate rows, and return normalized observations."""
        if not file_path.exists():
            return []

        df = pd.read_csv(file_path)
        observations: List[NormalizedObservation] = []
        
        for idx, row in df.iterrows():
            norm = normalize_record(
                row=row.to_dict(),
                source_file=file_path.name,
                row_idx=int(idx),
                detected_sensor=sensor,
                grid_size_km=grid_size_km
            )
            if norm is not None:
                observations.append(norm)

        return observations

    @classmethod
    def initialize_default_sample_data(cls) -> Dict[str, Any]:
        """
        Load sample fixtures from data/sample/ to ensure immediate system functionality.
        Runs normalization, spatial-temporal matching, and DuckDB storage.
        """
        modis_sample = settings.sample_data_dir / "sample_modis.csv"
        viirs_sample = settings.sample_data_dir / "sample_viirs.csv"

        all_obs: List[NormalizedObservation] = []

        if modis_sample.exists():
            modis_obs = cls.load_and_process_csv(modis_sample, "MODIS_SP", SensorType.MODIS)
            all_obs.extend(modis_obs)

        if viirs_sample.exists():
            viirs_obs = cls.load_and_process_csv(viirs_sample, "VIIRS_SNPP_SP", SensorType.VIIRS)
            all_obs.extend(viirs_obs)

        # Match observations across sensors
        matched_obs, match_stats = match_observations(
            all_obs,
            spatial_tolerance_m=settings.default_spatial_tolerance_m,
            temporal_tolerance_min=settings.default_temporal_tolerance_min
        )

        # Persist to DuckDB and Parquet
        storage_engine.save_observations(matched_obs, parquet_filename="harmonized_observations.parquet")

        return {
            "total_ingested": len(matched_obs),
            "match_statistics": match_stats,
            "status": "Sample baseline initialized successfully."
        }


pipeline = HarmonizationPipeline()
