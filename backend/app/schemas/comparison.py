"""Cross-Sensor Comparison and Discontinuity Schemas."""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class QuantileSummary(BaseModel):
    min: float
    p25: float
    p50: float
    p75: float
    p95: float
    max: float


class SensitivityPoint(BaseModel):
    tolerance_m: float
    matched_fraction: float
    matched_pairs: int


class SensorComparisonResponse(BaseModel):
    """Complete sensor comparison payload."""
    
    start_date: str
    end_date: str
    bbox: List[float]
    
    # Counts
    modis_total_detections: int
    viirs_total_detections: int
    matched_pairs_count: int
    modis_only_count: int
    viirs_only_count: int
    
    # Fractions & Agreement
    matched_fraction_modis: float
    matched_fraction_viirs: float
    spatial_agreement_jaccard: float
    
    # FRP distributions (MW)
    frp_quantiles_modis: Optional[QuantileSummary] = None
    frp_quantiles_viirs: Optional[QuantileSummary] = None
    
    # Matching sensitivity sweep
    sensitivity_curve: List[SensitivityPoint]
    
    # Scientific notes & caveats
    notes: List[str]
