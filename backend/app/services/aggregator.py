"""Calendar aggregation and resolution-insensitive metric engine."""

from collections import defaultdict
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from backend.app.schemas.common import SensorType, ClassificationType, CoverageStatus
from backend.app.schemas.observation import NormalizedObservation
from backend.app.schemas.calendar import CalendarDaySummary, CalendarResponse


def aggregate_calendar(
    observations: List[NormalizedObservation],
    aoi_bbox: List[float],
    start_date: str,
    end_date: str,
    grid_size_km: float = 1.0
) -> CalendarResponse:
    """
    Aggregate normalized observations into a daily burning activity calendar.
    
    Produces:
    1. raw_detection_count: direct record count per sensor
    2. unique_active_cells: distinct equal-area grid cells occupied by active thermal anomalies.
       This eliminates the 3x-10x point count inflation of VIIRS over MODIS.
    3. Separate source-specific FRP metrics without double counting.
    """
    # Group observations by date
    daily_obs: Dict[str, List[NormalizedObservation]] = defaultdict(list)
    for obs in observations:
        daily_obs[obs.acq_date_utc].append(obs)

    # Generate contiguous date sequence from start_date to end_date
    d_start = datetime.strptime(start_date, "%Y-%m-%d").date()
    d_end = datetime.strptime(end_date, "%Y-%m-%d").date()
    
    calendar_days: List[CalendarDaySummary] = []
    total_unique_cells_overall = set()
    total_raw_modis = 0
    total_raw_viirs = 0

    curr = d_start
    while curr <= d_end:
        date_str = curr.strftime("%Y-%m-%d")
        records = daily_obs.get(date_str, [])

        if not records:
            calendar_days.append(CalendarDaySummary(
                date=date_str,
                modis_raw_count=0,
                viirs_raw_count=0,
                total_raw_count=0,
                unique_active_cells=0,
                matched_active_cells=0,
                modis_only_cells=0,
                viirs_only_cells=0,
                mean_frp_modis=None,
                mean_frp_viirs=None,
                max_frp_modis=None,
                max_frp_viirs=None,
                coverage_status=CoverageStatus.FULL  # Active monitoring with zero detections
            ))
            curr += timedelta(days=1)
            continue

        modis_recs = [r for r in records if r.sensor == SensorType.MODIS]
        viirs_recs = [r for r in records if r.sensor == SensorType.VIIRS]

        # Raw counts
        n_modis = len(modis_recs)
        n_viirs = len(viirs_recs)
        total_raw_modis += n_modis
        total_raw_viirs += n_viirs

        # Grid cell sets
        all_cells = {r.grid_cell_id for r in records if r.grid_cell_id}
        modis_cells = {r.grid_cell_id for r in modis_recs if r.grid_cell_id}
        viirs_cells = {r.grid_cell_id for r in viirs_recs if r.grid_cell_id}
        
        matched_cells = modis_cells.intersection(viirs_cells)
        modis_only_cells = modis_cells - viirs_cells
        viirs_only_cells = viirs_cells - modis_cells

        total_unique_cells_overall.update(all_cells)

        # Source-specific FRP metrics (preserved separately, NEVER summed)
        frp_modis = [r.frp_mw for r in modis_recs if r.frp_mw is not None]
        frp_viirs = [r.frp_mw for r in viirs_recs if r.frp_mw is not None]

        mean_modis = round(sum(frp_modis) / len(frp_modis), 2) if frp_modis else None
        max_modis = round(max(frp_modis), 2) if frp_modis else None
        mean_viirs = round(sum(frp_viirs) / len(frp_viirs), 2) if frp_viirs else None
        max_viirs = round(max(frp_viirs), 2) if frp_viirs else None

        calendar_days.append(CalendarDaySummary(
            date=date_str,
            modis_raw_count=n_modis,
            viirs_raw_count=n_viirs,
            total_raw_count=n_modis + n_viirs,
            unique_active_cells=len(all_cells),
            matched_active_cells=len(matched_cells),
            modis_only_cells=len(modis_only_cells),
            viirs_only_cells=len(viirs_only_cells),
            mean_frp_modis=mean_modis,
            mean_frp_viirs=mean_viirs,
            max_frp_modis=max_modis,
            max_frp_viirs=max_viirs,
            coverage_status=CoverageStatus.FULL
        ))
        curr += timedelta(days=1)

    active_days = len([d for d in calendar_days if d.unique_active_cells > 0])
    
    return CalendarResponse(
        aoi_bbox=aoi_bbox,
        start_date=start_date,
        end_date=end_date,
        grid_size_km=grid_size_km,
        total_days=len(calendar_days),
        active_days=active_days,
        days=calendar_days,
        summary={
            "total_modis_raw": total_raw_modis,
            "total_viirs_raw": total_raw_viirs,
            "total_unique_active_cells": len(total_unique_cells_overall),
            "ratio_viirs_to_modis": round(total_raw_viirs / max(total_raw_modis, 1), 2),
            "harmonized_metric_description": "Unique active equal-area grid cells (1.0 km) per period"
        }
    )
