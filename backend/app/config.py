"""FireChronicle Configuration & Environment Management."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""
    
    # NASA FIRMS API Map Key
    firms_map_key: str = Field(default="", alias="FIRMS_MAP_KEY")
    
    # Server host & port
    host: str = Field(default="127.0.0.1", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    
    # Storage Paths
    base_dir: Path = Path(__file__).resolve().parent.parent.parent
    raw_data_dir: Path = base_dir / "data" / "raw"
    processed_data_dir: Path = base_dir / "data" / "processed"
    sample_data_dir: Path = base_dir / "data" / "sample"
    duckdb_path: Path = base_dir / "data" / "firechronicle.duckdb"
    
    # Harmonization Defaults
    default_spatial_tolerance_m: float = 1000.0   # 1.0 km nominal MODIS footprint
    default_temporal_tolerance_min: float = 60.0  # 60 minutes for near-synchronous orbits
    default_grid_size_km: float = 1.0             # 1.0 km equal-area grid
    
    # Active Operating Mode
    active_mode: str = "HACKATHON_BUILD"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def is_firms_configured(self) -> bool:
        """Check if a non-placeholder FIRMS map key is configured."""
        key = self.firms_map_key.strip()
        return bool(key and key != "your_firms_map_key_here")


settings = Settings()

# Ensure required directories exist
settings.raw_data_dir.mkdir(parents=True, exist_ok=True)
settings.processed_data_dir.mkdir(parents=True, exist_ok=True)
settings.sample_data_dir.mkdir(parents=True, exist_ok=True)
