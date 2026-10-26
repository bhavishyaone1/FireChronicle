"""Observation schemas for normalized and GeoJSON outputs."""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from backend.app.schemas.common import (
    SensorType,
    PlatformType,
    ProcessingStatus,
    ConfidenceCategory,
    ClassificationType,
)


class NormalizedObservation(BaseModel):
    """Normalized active fire hotspot observation."""
    
    observation_id: str = Field(..., description="Deterministic SHA-256 hash")
    source_product: str = Field(..., description="Original FIRMS source e.g. MODIS_SP")
    source_file: str = Field(..., description="Originating raw filename")
    source_row_id: int = Field(..., description="Row index in original file")
    
    sensor: SensorType
    platform: PlatformType
    processing_status: ProcessingStatus
    
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    
    acq_datetime_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    acq_date_utc: str = Field(..., description="YYYY-MM-DD")
    acq_time_utc: str = Field(..., description="HHMM")
    
    confidence_category: ConfidenceCategory
    raw_confidence: Union[int, str]
    
    frp_mw: Optional[float] = Field(None, ge=0.0, description="Fire Radiative Power in MW")
    daynight: str = Field(..., pattern="^[DN]$")
    anomaly_type: Optional[int] = Field(None, description="0=veg, 1=volcano, 2=static, 3=offshore")
    
    scan_km: Optional[float] = None
    track_km: Optional[float] = None
    brightness_kelvin: Optional[float] = None
    
    classification: ClassificationType = ClassificationType.MODIS_ONLY
    matched_pair_id: Optional[str] = None
    match_distance_m: Optional[float] = None
    match_time_delta_min: Optional[float] = None
    match_score: Optional[float] = None
    is_ambiguous: Optional[bool] = False
    candidate_count: Optional[int] = 0
    
    grid_cell_id: Optional[str] = None


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
    total_count: int
    offset: int
    limit: int
    metadata: Dict[str, Any]
