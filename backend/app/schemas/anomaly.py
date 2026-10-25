"""Seasonal Baseline and Historical Anomaly Schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field


class MonthlyBaseline(BaseModel):
    month: int = Field(..., ge=1, le=12)
    month_name: str
    historical_years_count: int
    median_active_cells: float
    mad_active_cells: float
    p75_active_cells: float
    observed_active_cells: Optional[float] = None
    deviation_z_score: Optional[float] = None
    is_anomaly: bool = False
    is_history_adequate: bool = True


class AnomalyResponse(BaseModel):
    bbox: List[float]
    target_year: int
    baseline_years: List[int]
    method: str = "Robust Median + MAD Baseline"
    months: List[MonthlyBaseline]
    overall_assessment: str
    limitations: List[str]
