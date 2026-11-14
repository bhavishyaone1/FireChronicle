"""Common Enums and Shared Models for FireChronicle."""

from enum import Enum
from typing import List, Tuple, Optional, Dict, Any
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


class ContextClass(str, Enum):
    """India-focused cautious context classification."""
    FSI_SUPPORTED_FOREST_ALERT = "FSI_SUPPORTED_FOREST_ALERT"
    LIKELY_FOREST_CONTEXT = "LIKELY_FOREST_CONTEXT"
    BHUVAN_AGRICULTURAL_FIRE_RECORD = "BHUVAN_AGRICULTURAL_FIRE_RECORD"
    LIKELY_AGRICULTURAL_CONTEXT = "LIKELY_AGRICULTURAL_CONTEXT"
    OTHER_STATIC_THERMAL_SOURCE = "OTHER_STATIC_THERMAL_SOURCE"
    OFFSHORE = "OFFSHORE"
    VOLCANIC = "VOLCANIC"
    UNCLASSIFIED = "UNCLASSIFIED"


class ContextConfidence(str, Enum):
    """Confidence level of context inference."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT = "INSUFFICIENT"


class SourceAgency(str, Enum):
    NASA_FIRMS = "NASA_FIRMS"
    FSI = "FSI"
    BHUVAN = "BHUVAN"
    IMD = "IMD"
    GFWED = "GFWED"



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
    provenance: Optional[Dict[str, Any]] = None


class BoundingBox(BaseModel):
    west: float = Field(..., ge=-180.0, le=180.0)
    south: float = Field(..., ge=-90.0, le=90.0)
    east: float = Field(..., ge=-180.0, le=180.0)
    north: float = Field(..., ge=-90.0, le=90.0)

    def as_tuple(self) -> Tuple[float, float, float, float]:
        return (self.west, self.south, self.east, self.north)
