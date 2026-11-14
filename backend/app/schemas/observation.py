"""Observation schemas for normalized and GeoJSON outputs."""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator
from backend.app.schemas.common import (
    SensorType,
    PlatformType,
    ProcessingStatus,
    ConfidenceCategory,
    ClassificationType,
    ContextClass,
    ContextConfidence,
    SourceAgency,
)


class NormalizedObservation(BaseModel):
    """Normalized active fire hotspot observation."""
    
    observation_id: str = Field(..., description="Deterministic SHA-256 hash")
    source_agency: Optional[SourceAgency] = Field(default=SourceAgency.NASA_FIRMS, description="Source agency e.g. NASA_FIRMS, FSI, BHUVAN")
    source_product: str = Field(default="NASA_FIRMS", description="Original FIRMS source e.g. MODIS_SP")
    source_file: str = Field(default="archive", description="Originating raw filename")
    source_row_id: Optional[int] = Field(default=0, description="Row index in original file")
    
    sensor: SensorType
    platform: PlatformType
    processing_status: ProcessingStatus = Field(default=ProcessingStatus.SP)

    @field_validator("platform", mode="before")
    @classmethod
    def normalize_platform(cls, v: Any) -> Any:
        if isinstance(v, str):
            v_clean = v.strip().upper()
            if v_clean in ("N20", "NOAA20", "JPSS-1", "JPSS1"):
                return PlatformType.NOAA20
            if v_clean in ("N21", "NOAA21", "JPSS-2", "JPSS2"):
                return PlatformType.NOAA21
            if v_clean in ("T", "TERRA"):
                return PlatformType.TERRA
            if v_clean in ("A", "AQUA"):
                return PlatformType.AQUA
            if v_clean in ("NPP", "SNPP", "SUOMI-NPP"):
                return PlatformType.SNPP
        return v

    @field_validator("processing_status", mode="before")
    @classmethod
    def normalize_processing_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            v_clean = v.strip().upper()
            if "STANDARD" in v_clean or "SP" in v_clean or "VERIFIED" in v_clean or "ARCHIVE" in v_clean:
                return ProcessingStatus.SP
            if "NRT" in v_clean:
                return ProcessingStatus.NRT
        if v is None:
            return ProcessingStatus.SP
        return v
    
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    
    acq_datetime_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    acq_datetime_ist: Optional[str] = Field(None, description="India Standard Time (UTC+05:30)")
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
    
    # Specific sensor channels (Kelvin)
    brightness_channel_1: Optional[float] = Field(None, description="4um channel brightness temp (K)")
    brightness_channel_1_name: Optional[str] = Field(None, description="e.g. Band I-4 (3.74 um) or Ch 21/22")
    brightness_channel_1_unit: Optional[str] = Field(default="K", description="Unit of measure: Kelvin")
    brightness_channel_2: Optional[float] = Field(None, description="11um channel brightness temp (K)")
    brightness_channel_2_name: Optional[str] = Field(None, description="e.g. Band I-5 (11.45 um) or Ch 31")
    brightness_channel_2_unit: Optional[str] = Field(default="K", description="Unit of measure: Kelvin")
    
    # India Jurisdictional Attribution
    india_state: Optional[str] = Field(None, description="Indian State or Union Territory")
    india_district: Optional[str] = Field(None, description="Indian District")
    
    # Cautious Context Classification
    context_class: Optional[ContextClass] = Field(default=ContextClass.UNCLASSIFIED, description="Inferred or verified context class")
    context_evidence: List[str] = Field(default_factory=list, description="Array of verified evidence tags")
    context_confidence: Optional[ContextConfidence] = Field(default=ContextConfidence.INSUFFICIENT, description="Confidence of context inference")
    
    # Official Cross-Reference References
    fsi_alert_id: Optional[str] = Field(None, description="Associated Forest Survey of India alert ID")
    bhuvan_record_id: Optional[str] = Field(None, description="Associated ISRO Bhuvan agricultural fire record ID")
    event_id: Optional[str] = Field(None, description="Candidate multi-pass event grouping ID")
    is_large_fire_candidate: Optional[bool] = Field(False, description="FSI cue: >=3 contiguous VIIRS 375m pixels")
    
    classification: ClassificationType = ClassificationType.MODIS_ONLY
    matched_pair_id: Optional[str] = None
    matched_observation_id: Optional[str] = None
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
