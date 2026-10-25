"""Seasonal Robust Baseline and Historical Anomaly Detection."""

import calendar
import numpy as np
from typing import List, Dict, Any, Optional
from backend.app.schemas.anomaly import MonthlyBaseline, AnomalyResponse


def compute_robust_baseline(
    historical_yearly_monthly_counts: Dict[int, Dict[int, float]],
    target_year: int,
    bbox: List[float],
    min_years_required: int = 3
) -> AnomalyResponse:
    """
    Compute a robust seasonal baseline across historical years using Median and MAD.
    
    historical_yearly_monthly_counts: {year: {month: unique_active_cells}}
    """
    baseline_years = sorted([y for y in historical_yearly_monthly_counts.keys() if y != target_year])
    target_data = historical_yearly_monthly_counts.get(target_year, {})

    monthly_results: List[MonthlyBaseline] = []
    anomalous_months_count = 0

    for month_num in range(1, 13):
        month_name = calendar.month_abbr[month_num]
        month_values = [
            historical_yearly_monthly_counts[y].get(month_num, 0.0)
            for y in baseline_years
            if month_num in historical_yearly_monthly_counts[y]
        ]

        observed_val = target_data.get(month_num, None)
        years_count = len(month_values)
        is_adequate = years_count >= min_years_required

        if not is_adequate or not month_values:
            monthly_results.append(MonthlyBaseline(
                month=month_num,
                month_name=month_name,
                historical_years_count=years_count,
                median_active_cells=0.0,
                mad_active_cells=0.0,
                p75_active_cells=0.0,
                observed_active_cells=observed_val,
                deviation_z_score=None,
                is_anomaly=False,
                is_history_adequate=False
            ))
            continue

        arr = np.array(month_values, dtype=float)
        median_val = float(np.median(arr))
        mad_val = float(np.median(np.abs(arr - median_val)))
        p75_val = float(np.percentile(arr, 75))

        # Robust z-score calculation
        z_score = None
        is_anomaly = False

        if observed_val is not None:
            diff = observed_val - median_val
            # Scale MAD by 1.4826 for consistency with normal distribution
            mad_scaled = mad_val * 1.4826
            if mad_scaled > 0.001:
                z_score = round(float(diff / mad_scaled), 2)
            else:
                # When historical baseline has near-zero dispersion:
                # If observed is within the historical 75th percentile, it is within normal baseline variability
                if observed_val <= p75_val:
                    z_score = 0.0
                else:
                    z_score = round(float(diff), 2)

            # Scientific Anomaly Criteria:
            # 1. Robust Z-score >= 2.0 (unusually elevated burning)
            # 2. Observed burning strictly exceeds the 75th percentile of historical baseline
            # 3. Meaningful absolute deviation: diff >= 3.0 cells (guards against single-pixel sensor noise)
            if z_score is not None and z_score >= 2.0 and observed_val > p75_val and diff >= 3.0:
                is_anomaly = True
                anomalous_months_count += 1
            else:
                is_anomaly = False

        monthly_results.append(MonthlyBaseline(
            month=month_num,
            month_name=month_name,
            historical_years_count=years_count,
            median_active_cells=round(median_val, 1),
            mad_active_cells=round(mad_val, 1),
            p75_active_cells=round(p75_val, 1),
            observed_active_cells=round(observed_val, 1) if observed_val is not None else None,
            deviation_z_score=z_score,
            is_anomaly=is_anomaly,
            is_history_adequate=True
        ))

    assessment = (
        f"{anomalous_months_count} month(s) exhibited statistically unusual burning activity (Z_robust >= 2.0) "
        f"relative to the {len(baseline_years)}-year historical baseline."
        if anomalous_months_count > 0
        else "Observed burning activity remained within normal historical variance ranges across all observed months."
    )

    limitations = [
        "Thermal anomalies reflect momentary satellite detections; they do not represent confirmed ground wildfire perimeters.",
        "Satellites cannot observe burning under dense pyrocumulus clouds or persistent storm cover.",
        "Historical records prior to 2012 rely exclusively on MODIS (1 km), while recent years include VIIRS (375 m). Anomaly scores use harmonized unique active cells to mitigate sensor transition bias."
    ]

    return AnomalyResponse(
        bbox=bbox,
        target_year=target_year,
        baseline_years=baseline_years,
        method="Robust Median + MAD Baseline (Z_robust = (X - Median) / (MAD * 1.4826))",
        months=monthly_results,
        overall_assessment=assessment,
        limitations=limitations
    )
