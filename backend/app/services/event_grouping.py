"""Candidate Fire Event Grouping Service.

Groups multi-pass and multi-day satellite observations into candidate fire events
using spatial clustering and temporal persistence rules, preventing repeat overpasses
from being falsely counted as separate ground fire incidents.
"""

import math
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd

from backend.app.schemas.common import SensorType, ContextClass
from backend.app.schemas.observation import NormalizedObservation


def group_candidate_events(
    observations: List[NormalizedObservation],
    spatial_radius_km: float = 1.5,
    temporal_gap_hours: float = 24.0,
) -> List[Dict[str, Any]]:
    """
    Cluster observations into candidate fire events based on spatial proximity
    and temporal continuity.
    """
    if not observations:
        return []

    # Fast epoch timestamp precomputation
    def to_epoch(dt_str: str) -> float:
        try:
            return datetime.fromisoformat(dt_str.replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0.0

    obs_with_ts = [(o, to_epoch(o.acq_datetime_utc)) for o in observations]
    obs_with_ts.sort(key=lambda x: x[1])

    max_delta_sec = temporal_gap_hours * 3600.0
    max_dlat = spatial_radius_km / 111.0

    # Cluster structure: list of cluster dicts with bounding boxes and timestamp
    cluster_meta: List[Dict[str, Any]] = []

    for obs, obs_ts in obs_with_ts:
        assigned = False
        lat = obs.latitude
        lon = obs.longitude
        cos_lat = math.cos(math.radians(lat))
        max_dlon = spatial_radius_km / max(111.0 * cos_lat, 1e-4)
        radius_sq = spatial_radius_km * spatial_radius_km

        # Check clusters starting from most recent
        for c in reversed(cluster_meta):
            if (obs_ts - c["last_ts"]) > max_delta_sec:
                continue

            # Bounding box filter
            if lat < c["min_lat"] - max_dlat or lat > c["max_lat"] + max_dlat:
                continue
            if lon < c["min_lon"] - max_dlon or lon > c["max_lon"] + max_dlon:
                continue

            # Check distance against members
            for m in c["members"]:
                d_lat = (lat - m.latitude) * 111.0
                d_lon = (lon - m.longitude) * 111.0 * cos_lat
                if (d_lat * d_lat + d_lon * d_lon) <= radius_sq:
                    c["members"].append(obs)
                    c["min_lat"] = min(c["min_lat"], lat)
                    c["max_lat"] = max(c["max_lat"], lat)
                    c["min_lon"] = min(c["min_lon"], lon)
                    c["max_lon"] = max(c["max_lon"], lon)
                    c["last_ts"] = max(c["last_ts"], obs_ts)
                    assigned = True
                    break
            if assigned:
                break

        if not assigned:
            cluster_meta.append({
                "members": [obs],
                "min_lat": lat,
                "max_lat": lat,
                "min_lon": lon,
                "max_lon": lon,
                "last_ts": obs_ts,
            })

    events = [c["members"] for c in cluster_meta]

    # Convert clusters into structured event records
    event_records: List[Dict[str, Any]] = []
    for idx, cluster in enumerate(events, 1):
        event_id = f"EVENT-IND-{idx:04d}"
        
        # Tag each member observation with this event_id
        for o in cluster:
            o.event_id = event_id
            
        start_time = cluster[0].acq_datetime_utc
        end_time = cluster[-1].acq_datetime_utc
        dt_start = pd.to_datetime(start_time)
        dt_end = pd.to_datetime(end_time)
        duration_hrs = round((dt_end - dt_start).total_seconds() / 3600.0, 1)
        
        lats = [o.latitude for o in cluster]
        lons = [o.longitude for o in cluster]
        centroid_lat = round(sum(lats) / len(lats), 5)
        centroid_lon = round(sum(lons) / len(lons), 5)
        
        modis_count = sum(1 for o in cluster if o.sensor == SensorType.MODIS)
        viirs_count = sum(1 for o in cluster if o.sensor == SensorType.VIIRS)
        
        frp_vals = [o.frp_mw for o in cluster if o.frp_mw is not None]
        max_frp = max(frp_vals) if frp_vals else None
        
        b_vals = [o.brightness_kelvin for o in cluster if o.brightness_kelvin is not None]
        max_b = max(b_vals) if b_vals else None
        
        # Check FSI large fire candidate flag (any member tagged)
        is_lff = any(o.is_large_fire_candidate for o in cluster) or (viirs_count >= 3)
        if is_lff:
            for o in cluster:
                o.is_large_fire_candidate = True
                
        # Primary state and district from majority vote
        states = [o.india_state for o in cluster if o.india_state]
        primary_state = max(set(states), key=states.count) if states else "India (National)"
        districts = [o.india_district for o in cluster if o.india_district]
        primary_district = max(set(districts), key=districts.count) if districts else None
        
        # Primary context
        contexts = [o.context_class for o in cluster]
        primary_context = max(set(contexts), key=contexts.count).value if contexts else ContextClass.UNCLASSIFIED.value

        event_records.append({
            "event_id": event_id,
            "start_datetime_utc": start_time,
            "end_datetime_utc": end_time,
            "duration_hours": duration_hrs,
            "total_detections": len(cluster),
            "sensor_breakdown": {
                "MODIS": modis_count,
                "VIIRS": viirs_count,
            },
            "centroid": {
                "latitude": centroid_lat,
                "longitude": centroid_lon,
            },
            "max_frp_mw": max_frp,
            "max_brightness_kelvin": max_b,
            "india_state": primary_state,
            "india_district": primary_district,
            "context_class": primary_context,
            "is_large_fire_candidate": is_lff,
            "member_observation_ids": [o.observation_id for o in cluster],
        })

    return event_records
