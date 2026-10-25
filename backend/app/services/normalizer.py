"""Schema normalization and coordinate/timestamp validation engine."""

import hashlib
import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple, Union
import pandas as pd

from backend.app.schemas.common import (
    SensorType,
    PlatformType,
    ProcessingStatus,
    ConfidenceCategory,
    ClassificationType,
)
from backend.app.schemas.observation import NormalizedObservation


def compute_observation_id(
    source_file: str,
    row_idx: int,
    sensor: str,
    platform: str,
    lat: float,
    lon: float,
    acq_datetime_utc: str
) -> str:
    """Compute an immutable, reproducible SHA-256 hash identifying a source record."""
    hash_input = f"{source_file}:{row_idx}:{sensor}:{platform}:{lat:.5f}:{lon:.5f}:{acq_datetime_utc}"
    return hashlib.sha256(hash_input.encode("utf-8")).hexdigest()[:16]


def parse_utc_datetime(acq_date: str, acq_time: Union[int, str, float]) -> Tuple[datetime, str, str]:
    """
    Parse acquisition date (YYYY-MM-DD) and acquisition time (HHMM / HMM) into UTC.
    Returns: (datetime_object, iso_utc_string, hhmm_padded)
    """
    time_str = str(acq_time).strip().zfill(4)
    if len(time_str) > 4:
        time_str = time_str[:4]
    
    hours = int(time_str[:2])
    minutes = int(time_str[2:])
    
    # Boundary check for 24:00 (some satellite feeds write 2400 instead of 0000)
    if hours >= 24:
        hours = 23
        minutes = 59
    if minutes >= 60:
        minutes = 59
        
    date_parts = [int(p) for p in str(acq_date).strip().split("-")]
    dt = datetime(date_parts[0], date_parts[1], date_parts[2], hours, minutes, tzinfo=timezone.utc)
    
    iso_str = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    padded_time = f"{hours:02d}{minutes:02d}"
    return dt, iso_str, padded_time



def map_modis_confidence(val: Any) -> Tuple[ConfidenceCategory, int]:
    """Map MODIS 0-100% confidence to standardized category."""
    try:
        conf_int = int(float(val))
    except (ValueError, TypeError):
        conf_int = 50
        
    if conf_int < 30:
        category = ConfidenceCategory.LOW
    elif conf_int <= 80:
        category = ConfidenceCategory.NOMINAL
    else:
        category = ConfidenceCategory.HIGH
    return category, conf_int


def map_viirs_confidence(val: Any) -> Tuple[ConfidenceCategory, str]:
    """Map VIIRS categorical confidence to standardized category."""
    s = str(val).strip().lower()
    if "h" in s or s == "high":
        return ConfidenceCategory.HIGH, "high"
    elif "l" in s or s == "low":
        return ConfidenceCategory.LOW, "low"
    else:
        return ConfidenceCategory.NOMINAL, "nominal"


def map_platform(sat_val: Any, sensor: SensorType) -> PlatformType:
    """Resolve satellite platform string to standardized enum."""
    s = str(sat_val).strip().upper()
    if sensor == SensorType.MODIS:
        if "T" in s or "TERRA" in s:
            return PlatformType.TERRA
        return PlatformType.AQUA
    else:
        # VIIRS
        if "N" in s or "SNPP" in s or "SUOMI" in s:
            return PlatformType.SNPP
        elif "1" in s or "NOAA20" in s or "NOAA-20" in s or "J01" in s:
            return PlatformType.NOAA20
        elif "2" in s or "NOAA21" in s or "NOAA-21" in s or "J02" in s:
            return PlatformType.NOAA21
        return PlatformType.SNPP


def compute_grid_cell_id(lat: float, lon: float, grid_size_km: float = 1.0) -> str:
    """
    Compute an equal-area projected grid cell identifier.
    Uses cylindrical equal-area projection approximation for high performance:
    x = lon * cos(lat_rad) * 111.32 km
    y = lat * 110.57 km
    """
    lat_rad = math.radians(lat)
    km_per_lat = 110.574
    km_per_lon = 111.320 * math.cos(lat_rad)
    
    # Avoid zero division near poles
    if abs(km_per_lon) < 0.001:
        km_per_lon = 0.001
        
    grid_y = int(math.floor((lat * km_per_lat) / grid_size_km))
    grid_x = int(math.floor((lon * km_per_lon) / grid_size_km))
    return f"grid_{grid_size_km}km_{grid_y}_{grid_x}"


def normalize_record(
    row: Dict[str, Any],
    source_file: str,
    row_idx: int,
    detected_sensor: Optional[SensorType] = None,
    grid_size_km: float = 1.0
) -> Optional[NormalizedObservation]:
    """
    Normalize a raw dictionary row from a MODIS or VIIRS CSV into a NormalizedObservation.
    Returns None if record has invalid coordinates or corrupted fields.
    """
    # 1. Coordinate Validation
    try:
        lat = float(row.get("latitude", row.get("lat")))
        lon = float(row.get("longitude", row.get("lon")))
    except (ValueError, TypeError):
        return None
        
    if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
        return None
        
    # 2. Sensor & Platform Detection
    if detected_sensor is None:
        if "bright_ti4" in row or "bright_ti5" in row:
            sensor = SensorType.VIIRS
        else:
            sensor = SensorType.MODIS
    else:
        sensor = detected_sensor
        
    sat_raw = row.get("satellite", row.get("sat", "Aqua" if sensor == SensorType.MODIS else "Suomi-NPP"))
    platform = map_platform(sat_raw, sensor)
    
    # 3. Timestamp Parsing
    acq_date = row.get("acq_date", "2024-01-01")
    acq_time = row.get("acq_time", "1200")
    try:
        _, iso_utc, padded_time = parse_utc_datetime(acq_date, acq_time)
    except Exception:
        return None
        
    # 4. Confidence Mapping
    conf_raw = row.get("confidence", "nominal" if sensor == SensorType.VIIRS else 50)
    if sensor == SensorType.MODIS:
        conf_cat, conf_stored = map_modis_confidence(conf_raw)
    else:
        conf_cat, conf_stored = map_viirs_confidence(conf_raw)
        
    # 5. FRP Validation
    frp_val = None
    if "frp" in row and pd.notna(row["frp"]):
        try:
            f = float(row["frp"])
            if 0.0 <= f <= 50000.0:  # Physical plausibility ceiling (50,000 MW)
                frp_val = round(f, 2)
        except (ValueError, TypeError):
            frp_val = None
            
    # 6. Optional physical fields
    daynight = str(row.get("daynight", "D")).strip().upper()
    if daynight not in ("D", "N"):
        daynight = "D"
        
    scan_km = None
    track_km = None
    if "scan" in row and pd.notna(row["scan"]):
        try:
            scan_km = round(float(row["scan"]), 3)
        except (ValueError, TypeError):
            pass
    if "track" in row and pd.notna(row["track"]):
        try:
            track_km = round(float(row["track"]), 3)
        except (ValueError, TypeError):
            pass
            
    brightness_k = None
    b_field = "bright_ti4" if sensor == SensorType.VIIRS else "brightness"
    if b_field in row and pd.notna(row[b_field]):
        try:
            brightness_k = round(float(row[b_field]), 2)
        except (ValueError, TypeError):
            pass
            
    anomaly_type = None
    if "type" in row and pd.notna(row["type"]):
        try:
            anomaly_type = int(row["type"])
        except (ValueError, TypeError):
            pass
            
    source_product = row.get("source_product", f"{sensor.value}_SP")
    proc_status = ProcessingStatus.NRT if "NRT" in str(source_product).upper() else ProcessingStatus.SP
    
    obs_id = compute_observation_id(source_file, row_idx, sensor.value, platform.value, lat, lon, iso_utc)
    grid_id = compute_grid_cell_id(lat, lon, grid_size_km)
    
    return NormalizedObservation(
        observation_id=obs_id,
        source_product=str(source_product),
        source_file=source_file,
        source_row_id=row_idx,
        sensor=sensor,
        platform=platform,
        processing_status=proc_status,
        latitude=round(lat, 5),
        longitude=round(lon, 5),
        acq_datetime_utc=iso_utc,
        acq_date_utc=str(acq_date).strip(),
        acq_time_utc=padded_time,
        confidence_category=conf_cat,
        raw_confidence=conf_stored,
        frp_mw=frp_val,
        daynight=daynight,
        anomaly_type=anomaly_type,
        scan_km=scan_km,
        track_km=track_km,
        brightness_kelvin=brightness_k,
        classification=ClassificationType.MODIS_ONLY if sensor == SensorType.MODIS else ClassificationType.VIIRS_ONLY,
        grid_cell_id=grid_id,
    )
