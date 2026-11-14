"""Cross-Sensor Comparison, Uncertainty, and Discontinuity Schemas."""

from typing import List, Dict, Optional, Any, Tuple
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


class TemporalSensitivityPoint(BaseModel):
    temporal_window_min: float
    matched_pairs: int
    modis_matched_fraction: float
    viirs_matched_fraction: float


class BootstrapInterval(BaseModel):
    """Bootstrap 95% confidence interval and sample size."""
    point_estimate: float
    ci_lower: float
    ci_upper: float
    standard_error: float
    sample_size_n: int
    confidence_level: float = 0.95
    n_bootstraps: int = 1000


class UncertaintyReport(BaseModel):
    """Comprehensive uncertainty quantification with bootstrap intervals and sample sizes."""
    modis_matched_fraction_ci: BootstrapInterval
    viirs_matched_fraction_ci: BootstrapInterval
    spatial_jaccard_ci: BootstrapInterval
    cell_density_reduction_ci: Optional[BootstrapInterval] = None
    scientific_methodology: str = (
        "1,000-iteration percentile bootstrap resampling with fixed pseudo-random seed. "
        "Every reported fraction explicitly carries sample size n."
    )


class DiscontinuityMetrics(BaseModel):
    """Quantification of the 2012 sensor transition step-change."""
    raw_point_ratio_viirs_to_modis: float
    grid_cell_ratio_viirs_to_modis: float
    discontinuity_mitigation_percent: float
    pre_2012_record_regime: str = "MODIS C6.1 (1 km nominal footprint)"
    overlap_regime_2012_present: str = "MODIS + VIIRS C2 (375 m nominal footprint) dual-sensor overlap"
    future_regime_post_2026: str = "VIIRS (NOAA-20/21) primary following MODIS orbital drift and decommissioning"
    explanation: str = (
        "Raw point counts experience a sharp artificial 3x-8x step-change across the 2012 transition "
        "due to VIIRS 375 m spatial resolution. Aggregating into 1.0 km equal-area grid cells "
        "mitigates this discontinuity, restoring long-term multi-decadal comparability."
    )


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

    # FRP distributions (MW) - strictly separated, NEVER summed
    frp_quantiles_modis: Optional[QuantileSummary] = None
    frp_quantiles_viirs: Optional[QuantileSummary] = None

    # Matching sensitivity sweeps (distance & time)
    sensitivity_curve: List[SensitivityPoint]
    temporal_sensitivity_curve: Optional[List[TemporalSensitivityPoint]] = None

    # Uncertainty Quantification
    uncertainty: Optional[UncertaintyReport] = None

    # Discontinuity Analysis across 2012 sensor transition
    discontinuity: Optional[DiscontinuityMetrics] = None

    # Confidence Filter Accounting
    confidence_filter_applied: str = "all"
    low_confidence_counts: Optional[Dict[str, int]] = None

    # Algorithm & Ambiguity Analysis
    algorithm: str = "greedy"
    algorithm_comparison: Optional[Dict[str, Any]] = None
    ambiguity_stats: Optional[Dict[str, Any]] = None

    # Scientific notes & caveats
    notes: List[str]
