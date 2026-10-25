"""Burning-Activity Calendar schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import CoverageStatus


class CalendarDaySummary(BaseModel):
    """Daily aggregated metrics for the burning activity calendar."""
    
    date: str = Field(..., description="YYYY-MM-DD")
    modis_raw_count: int = Field(default=0, ge=0)
    viirs_raw_count: int = Field(default=0, ge=0)
    total_raw_count: int = Field(default=0, ge=0)
    
    # Harmonized metric: distinct active grid cells
    unique_active_cells: int = Field(default=0, ge=0)
    matched_active_cells: int = Field(default=0, ge=0)
    modis_only_cells: int = Field(default=0, ge=0)
    viirs_only_cells: int = Field(default=0, ge=0)
    
    # Source-specific FRP summaries (MW)
    mean_frp_modis: Optional[float] = None
    mean_frp_viirs: Optional[float] = None
    max_frp_modis: Optional[float] = None
    max_frp_viirs: Optional[float] = None
    
    coverage_status: CoverageStatus = CoverageStatus.FULL


class CalendarResponse(BaseModel):
    """Response containing daily calendar series and overall summary."""
    
    aoi_bbox: List[float]
    start_date: str
    end_date: str
    grid_size_km: float
    total_days: int
    active_days: int
    days: List[CalendarDaySummary]
    summary: dict
