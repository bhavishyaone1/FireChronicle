"""Context Classification and Evidence Engine for India Fire Intelligence.

Combines NASA standard hotspot metadata, FSI alerts, Bhuvan agricultural records,
Indian seasonal crop burning windows, and forest landcover context to assign
scientifically cautious context classifications with explicit evidence tags.
"""

from datetime import datetime
from typing import Optional, List, Tuple
from backend.app.schemas.common import ContextClass, ContextConfidence


# Known Indian fire seasons
# Kharif crop residue burning: mid-September to end of November
# Rabi crop residue burning: April to end of May
# Indian Forest fire season: mid-February to mid-June (peaks in March-April)
AGRICULTURAL_STATES = {"Punjab", "Haryana", "Rajasthan", "Uttar Pradesh"}
FOREST_STATES = {
    "Uttarakhand", "Himachal Pradesh", "Madhya Pradesh", "Chhattisgarh",
    "Odisha", "Kerala", "Karnataka", "Assam", "Mizoram"
}


def is_kharif_season(month: int, day: int) -> bool:
    """Kharif burning window: 15 September through 30 November."""
    if month == 9 and day >= 15:
        return True
    if month in (10, 11):
        return True
    return False


def is_rabi_season(month: int, day: int) -> bool:
    """Rabi burning window: 01 April through 30 May."""
    if month == 4:
        return True
    if month == 5 and day <= 30:
        return True
    return False


def is_forest_fire_season(month: int) -> bool:
    """Indian forest fire peak season: February through June."""
    return month in (2, 3, 4, 5, 6)


def evaluate_observation_context(
    lat: float,
    lon: float,
    acq_date_utc: str,
    anomaly_type: Optional[int] = None,
    india_state: Optional[str] = None,
    india_district: Optional[str] = None,
    fsi_alert_id: Optional[str] = None,
    bhuvan_record_id: Optional[str] = None,
    is_large_fire_candidate: bool = False,
) -> Tuple[ContextClass, List[str], ContextConfidence]:
    """
    Evaluate contextual evidence and assign a cautious context classification.
    Returns: (context_class, context_evidence, context_confidence)
    """
    evidence: List[str] = []

    # 1. Official Institutional Overlaps (Highest Confidence)
    if fsi_alert_id:
        evidence.append("FSI_ALERT_OVERLAP")
        if is_large_fire_candidate:
            evidence.append("FSI_LARGE_FIRE_REFERENCE")
        return ContextClass.FSI_SUPPORTED_FOREST_ALERT, evidence, ContextConfidence.HIGH

    if bhuvan_record_id:
        evidence.append("BHUVAN_ACTIVE_AGRICULTURAL_FIRE_OVERLAP")
        return ContextClass.BHUVAN_AGRICULTURAL_FIRE_RECORD, evidence, ContextConfidence.HIGH

    # 2. NASA Standard Hotspot Type Metadata
    if anomaly_type is not None:
        evidence.append("NASA_TYPE_FIELD")
        if anomaly_type == 1:
            return ContextClass.VOLCANIC, evidence, ContextConfidence.HIGH
        elif anomaly_type == 2:
            evidence.append("INDUSTRIAL_OR_MINING_CONTEXT")
            return ContextClass.OTHER_STATIC_THERMAL_SOURCE, evidence, ContextConfidence.HIGH
        elif anomaly_type == 3:
            return ContextClass.OFFSHORE, evidence, ContextConfidence.HIGH

    # 3. Barren Island Volcano Check (lat ~12.278, lon ~93.858)
    if 12.20 <= lat <= 12.35 and 93.80 <= lon <= 93.92:
        evidence.append("GEOGRAPHIC_VOLCANIC_ZONE")
        return ContextClass.VOLCANIC, evidence, ContextConfidence.HIGH

    # 4. Parse Date for Seasonal Analysis
    try:
        parts = [int(p) for p in acq_date_utc.split("-")]
        month = parts[1]
        day = parts[2]
    except Exception:
        month = 6
        day = 1

    # 5. Agricultural Residue Burning Context
    if india_state in AGRICULTURAL_STATES:
        if is_kharif_season(month, day) or is_rabi_season(month, day):
            evidence.append("CROP_SEASON_MATCH")
            evidence.append("LAND_COVER_CROPLAND")
            if is_large_fire_candidate:
                evidence.append("FSI_LARGE_FIRE_REFERENCE")
            return ContextClass.LIKELY_AGRICULTURAL_CONTEXT, evidence, ContextConfidence.MEDIUM

    # 6. Forest Fire Context
    if india_state in FOREST_STATES:
        if is_forest_fire_season(month):
            evidence.append("FOREST_TYPE_LAYER_OVERLAP")
            evidence.append("LAND_COVER_TREE_COVER")
            if is_large_fire_candidate:
                evidence.append("FSI_LARGE_FIRE_REFERENCE")
            return ContextClass.LIKELY_FOREST_CONTEXT, evidence, ContextConfidence.MEDIUM

    # 7. Unclassified Fallback
    return ContextClass.UNCLASSIFIED, evidence, ContextConfidence.INSUFFICIENT
