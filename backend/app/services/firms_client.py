"""NASA FIRMS API Client with caching, rate limiting, and fallback."""

import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import httpx

from backend.app.config import settings
from backend.app.schemas.common import SensorType


SUOMI_NPP_CESSATION_DATE = "2026-11-01"


def resolve_viirs_product(source: str, target_date: Optional[str] = None) -> Tuple[str, Optional[str]]:
    """
    Handle NASA's announced November 1, 2026 cessation of Suomi-NPP data-product delivery.
    If Suomi-NPP is requested on or after 2026-11-01, dynamically recommend/route to NOAA-20.
    """
    check_date = target_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if "SNPP" in source.upper() and check_date >= SUOMI_NPP_CESSATION_DATE:
        replacement = source.upper().replace("SNPP", "NOAA20")
        advisory = (
            f"Suomi-NPP product delivery ceased on {SUOMI_NPP_CESSATION_DATE}. "
            f"Automatically routed request to {replacement} (NOAA-20 / JPSS-1)."
        )
        return replacement, advisory
    return source, None


class FirmsApiClient:
    """Client for NASA FIRMS Area API and Data Availability API with caching and proxy security."""
    
    BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api"

    def __init__(self, map_key: Optional[str] = None):
        self.map_key = map_key or settings.firms_map_key

    def is_configured(self) -> bool:
        k = self.map_key.strip()
        return bool(k and k != "your_firms_map_key_here")

    async def fetch_area_csv(
        self,
        source: str,
        bbox: List[float],
        day_range: int = 5,
        target_date: Optional[str] = None,
        max_retries: int = 3
    ) -> Tuple[Optional[str], str]:
        """
        Fetch active-fire detections CSV from FIRMS Area API.
        
        URL format:
        https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{WEST,SOUTH,EAST,NORTH}/{DAY_RANGE}/{DATE}
        
        Returns: (csv_text_or_none, status_message)
        """
        # Resolve Suomi-NPP cessation if applicable
        effective_source, cessation_notice = resolve_viirs_product(source, target_date)

        if not self.is_configured():
            msg = "FIRMS MAP_KEY is not configured. Serving local sample data."
            if cessation_notice:
                msg += f" ({cessation_notice})"
            return None, msg

        west, south, east, north = bbox
        area_str = f"{west:.4f},{south:.4f},{east:.4f},{north:.4f}"
        
        # Clamp day range between 1 and 5
        day_range = max(1, min(day_range, 5))
        
        # Check disk cache first to conserve NASA API rate limits
        cache_date_tag = target_date or "latest"
        cache_key = f"{effective_source}_{area_str}_{day_range}_{cache_date_tag}.csv".replace(",", "_")
        cache_path = settings.raw_data_dir / cache_key
        if cache_path.exists():
            try:
                cached_text = cache_path.read_text(encoding="utf-8")
                return cached_text, f"Served from local disk cache ({len(cached_text.splitlines())} lines)."
            except Exception:
                pass

        url = f"{self.BASE_URL}/area/csv/{self.map_key}/{effective_source}/{area_str}/{day_range}"
        if target_date:
            url += f"/{target_date}"

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        csv_content = resp.text
                        # Check for API error messages formatted inside 200 responses
                        if "Invalid MAP_KEY" in csv_content or "Transaction limit" in csv_content:
                            return None, f"FIRMS API Error: {csv_content.strip()}"

                        # Cache raw content to disk
                        cache_path.write_text(csv_content, encoding="utf-8")
                        
                        msg = f"Retrieved {len(csv_content.splitlines())} lines from FIRMS ({effective_source})."
                        if cessation_notice:
                            msg += f" [{cessation_notice}]"
                        return csv_content, msg
                    elif resp.status_code == 429:
                        # Rate limited, backoff
                        await asyncio.sleep(2.0 ** attempt)
                    else:
                        await asyncio.sleep(1.0 * attempt)
            except Exception as e:
                if attempt == max_retries:
                    return None, f"Network error contacting FIRMS: {str(e)}"
                await asyncio.sleep(1.0 * attempt)

        return None, "Failed to retrieve data from FIRMS after maximum retries."

    async def fetch_data_availability(self) -> Dict[str, Any]:
        """Fetch platform availability ranges."""
        if not self.is_configured():
            return {
                "status": "sample_mode",
                "available_sensors": ["MODIS_SP", "VIIRS_SNPP_SP", "VIIRS_NOAA20_SP", "VIIRS_NOAA21_SP"],
                "note": "Using documented sensor coverage tables (MAP_KEY unconfigured)."
            }

        url = f"{self.BASE_URL}/data_availability/csv/{self.map_key}/ALL"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return {"status": "live", "raw_availability": resp.text}
        except Exception:
            pass

        return {"status": "unavailable", "note": "Could not contact availability API."}


firms_client = FirmsApiClient()
