"""Common Enums and Shared Models for FireChronicle."""

from enum import Enum
from typing import List, Tuple
from pydantic import BaseModel, Field


class SensorType(str, Enum):
    MODIS = "MODIS"
    VIIRS = "VIIRS"


class PlatformType(str, Enum):
    TERRA = "Terra"
    AQUA = "Aqua"
    SNPP = "Suomi-NPP"
    NOAA20 = "NOAA-20"
    NOAA21 = "NOAA-21"


class ProcessingStatus(str, Enum):
    SP = "SP"     # Standard Science Quality Processing
    NRT = "NRT"   # Near Real-Time Processing


class ConfidenceCategory(str, Enum):
    LOW = "low"
    NOMINAL = "nominal"
    HIGH = "high"


class ClassificationType(str, Enum):
    MATCHED = "matched"
    MODIS_ONLY = "MODIS_only"
    VIIRS_ONLY = "VIIRS_only"


class CoverageStatus(str, Enum):
    FULL = "full"
    PARTIAL = "partial"
    NO_PASS = "no_pass"
    CLOUD_OBSCURED = "cloud_obscured"


class HealthResponse(BaseModel):
    status: str = "healthy"
    timestamp: str
    version: str = "1.0.0"
    firms_configured: bool
    duckdb_ready: bool
    active_mode: str = "HACKATHON_BUILD"


class BoundingBox(BaseModel):
    west: float = Field(..., ge=-180.0, le=180.0)
    south: float = Field(..., ge=-90.0, le=90.0)
    east: float = Field(..., ge=-180.0, le=180.0)
    north: float = Field(..., ge=-90.0, le=90.0)

    def as_tuple(self) -> Tuple[float, float, float, float]:
        return (self.west, self.south, self.east, self.north)
