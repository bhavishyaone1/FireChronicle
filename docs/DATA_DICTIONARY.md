# FireChronicle — Canonical Data Dictionary
**Version:** 1.0.0  
**Scope:** India-First Satellite Fire Intelligence System  
**Updated:** 09 November 2026  

---

## 1. Overview
This document defines the canonical schema for active-fire and thermal-anomaly observations stored in FireChronicle's DuckDB and Parquet engines.

Every incoming observation from NASA FIRMS (MODIS Terra/Aqua, VIIRS Suomi-NPP/NOAA-20/NOAA-21), Forest Survey of India (FSI), and ISRO Bhuvan is normalized into this common model while preserving original source values, sensor-specific measurement channels, and geographic provenance.

---

## 2. Canonical Observation Table (`observations`)

| Column Name | Data Type | Nullable | Units / Format | Description & Scientific Definition |
|-------------|-----------|----------|----------------|-------------------------------------|
| `observation_id` | `VARCHAR` | No | SHA-256 (16-char hex) | Deterministic unique hash computed from `(source_file, row_id, sensor, platform, lat, lon, acq_datetime_utc)`. |
| `source_agency` | `VARCHAR` | No | String Enum | Originating agency: `NASA_FIRMS`, `FSI`, `BHUVAN`, `IMD`, `GFWED`. |
| `source_product` | `VARCHAR` | No | String | Exact product identifier, e.g., `MODIS_SP`, `VIIRS_NOAA20_NRT`, `FSI_ALERT_KML`, `BHUVAN_AGRI_SHP`. |
| `source_file` | `VARCHAR` | No | String | Filename or API query token from which this record was ingested. |
| `source_row_id` | `INTEGER` | No | Integer | Zero-based row index in the raw ingestion batch. |
| `sensor` | `VARCHAR` | No | `MODIS` \| `VIIRS` \| `OTHER` | Remote sensing instrument family. |
| `platform` | `VARCHAR` | No | `Terra` \| `Aqua` \| `Suomi-NPP` \| `NOAA-20` \| `NOAA-21` | Satellite platform hosting the sensor. |
| `processing_status` | `VARCHAR` | No | `SP` \| `NRT` | Standard Science Quality (`SP`) or Near Real-Time (`NRT`). |
| `latitude` | `DOUBLE` | No | Decimal degrees (WGS 84) | Latitude of the center of the detected satellite pixel (-90.0 to +90.0). |
| `longitude` | `DOUBLE` | No | Decimal degrees (WGS 84) | Longitude of the center of the detected satellite pixel (-180.0 to +180.0). |
| `acq_datetime_utc` | `VARCHAR` | No | ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`) | Satellite observation acquisition timestamp in Coordinated Universal Time. |
| `acq_datetime_ist` | `VARCHAR` | Yes | `YYYY-MM-DD HH:MM:SS IST` | India Standard Time (UTC + 05:30), strictly calculated from `acq_datetime_utc`. |
| `acq_date_utc` | `VARCHAR` | No | `YYYY-MM-DD` | Calendar acquisition date in UTC. |
| `acq_time_utc` | `VARCHAR` | No | `HHMM` | 4-digit 24-hour acquisition time in UTC. |
| `confidence_category` | `VARCHAR` | No | `low` \| `nominal` \| `high` | Standardized tri-state confidence category. |
| `raw_confidence` | `VARCHAR` | No | Raw string / int | Original source confidence: 0–100% for MODIS; `low`/`nominal`/`high` for VIIRS. |
| `frp_mw` | `DOUBLE` | Yes | Megawatts (MW) | Fire Radiative Power computed by the standard algorithm. |
| `daynight` | `VARCHAR` | No | `D` \| `N` | Day (`D`) or Night (`N`) overpass flag. |
| `anomaly_type` | `INTEGER` | Yes | `0` \| `1` \| `2` \| `3` | NASA standard inferred hotspot type: `0`=presumed vegetation fire, `1`=volcano, `2`=other static land source, `3`=offshore. `NULL` if source NRT product does not compute it. |
| `scan_km` | `DOUBLE` | Yes | Kilometers (km) | Spatial pixel dimension along the satellite scan direction. |
| `track_km` | `DOUBLE` | Yes | Kilometers (km) | Spatial pixel dimension along the satellite flight track direction. |
| `brightness_kelvin` | `DOUBLE` | Yes | Kelvin (K) | Primary thermal infrared brightness temperature. |
| `brightness_channel_1` | `DOUBLE` | Yes | Kelvin (K) | 4 μm channel brightness temperature (Band 21/22 for MODIS, Band I-4 for VIIRS). |
| `brightness_channel_1_name` | `VARCHAR` | Yes | String | Channel descriptor: `Channel 21/22 (3.96 μm)` or `Band I-4 (3.74 μm)`. |
| `brightness_channel_1_unit` | `VARCHAR` | Yes | `K` | Unit of measure: Kelvin. |
| `brightness_channel_2` | `DOUBLE` | Yes | Kelvin (K) | 11 μm channel brightness temperature (Band 31 for MODIS, Band I-5 for VIIRS). |
| `brightness_channel_2_name` | `VARCHAR` | Yes | String | Channel descriptor: `Channel 31 (11.03 μm)` or `Band I-5 (11.45 μm)`. |
| `brightness_channel_2_unit` | `VARCHAR` | Yes | `K` | Unit of measure: Kelvin. |
| `india_state` | `VARCHAR` | Yes | State / UT Name | Spatially joined Indian State or Union Territory name (e.g., `Punjab`, `Madhya Pradesh`, `Uttarakhand`). |
| `india_district` | `VARCHAR` | Yes | District Name | Spatially joined Indian District name (e.g., `Ludhiana`, `Chamoli`, `Bastar`). |
| `classification` | `VARCHAR` | No | `matched` \| `MODIS_only` \| `VIIRS_only` | Cross-sensor correspondence classification status. |
| `matched_pair_id` | `VARCHAR` | Yes | SHA-256 ID | Observation ID of the corresponding counterpart observation. |
| `match_distance_m` | `DOUBLE` | Yes | Meters (m) | Geodesic distance in meters to matched counterpart. |
| `match_time_delta_min`| `DOUBLE` | Yes | Minutes | Absolute time difference between sensor passes. |
| `match_score` | `DOUBLE` | Yes | Normalized [0.0–1.0] | Assignment score reflecting spatial and temporal proximity. |
| `is_ambiguous` | `BOOLEAN` | Yes | True / False | Flag indicating multiple competing candidates fell within matching tolerances. |
| `candidate_count` | `INTEGER` | Yes | Count | Number of candidate detections within tolerance radius. |
| `grid_cell_id` | `VARCHAR` | No | Grid token | 1 km Equal-Area grid cell index (`grid_1.0km_{grid_y}_{grid_x}`). |
| `context_class` | `VARCHAR` | No | Enum | Cautious context classification (see Section 3). |
| `context_evidence` | `VARCHAR` | No | JSON array string | Array of verified evidence tags supporting the context classification. |
| `context_confidence` | `VARCHAR` | No | `HIGH` \| `MEDIUM` \| `LOW` \| `INSUFFICIENT` | Confidence level of the contextual inference. |
| `fsi_alert_id` | `VARCHAR` | Yes | String | Associated Forest Survey of India alert reference if matched. |
| `bhuvan_record_id` | `VARCHAR` | Yes | String | Associated ISRO Bhuvan agricultural fire record reference if matched. |
| `event_id` | `VARCHAR` | Yes | String | Candidate clustered fire event ID if grouped across passes. |
| `is_large_fire_candidate` | `BOOLEAN` | Yes | True / False | FSI indicator: part of a cluster of ≥3 contiguous VIIRS 375m pixels. |

---

## 3. Context Classification Taxonomy

FireChronicle applies a rule-based evidence hierarchy that strictly separates **raw satellite detection** from **geographic and institutional context**:

```text
context_class:
  ├── FSI_SUPPORTED_FOREST_ALERT          (Linked to official FSI Van Agni alert)
  ├── LIKELY_FOREST_CONTEXT               (Spatial overlap with verified forest land / FSI fire-prone tract)
  ├── BHUVAN_AGRICULTURAL_FIRE_RECORD     (Direct match with ISRO Bhuvan active crop residue dataset)
  ├── LIKELY_AGRICULTURAL_CONTEXT         (Cropland landcover, crop burning window: Rabi/Kharif, CAQM protocol)
  ├── OTHER_STATIC_THERMAL_SOURCE         (NASA type=2, industrial facility, refinery, thermal plant)
  ├── OFFSHORE                            (NASA type=3, gas flare platform, offshore marine)
  ├── VOLCANIC                            (NASA type=1, Barren Island active volcano)
  └── UNCLASSIFIED                        (Default when evidence is insufficient or ambiguous)
```

### Context Evidence Tags (`context_evidence`)
- `NASA_TYPE_FIELD`: Source product metadata provides explicit hotspot type.
- `FSI_ALERT_OVERLAP`: Spatial and temporal co-occurrence with FSI alert bulletin.
- `FSI_LARGE_FIRE_REFERENCE`: Contiguous cluster meets FSI Large Forest Fire (LFF) criteria (≥3 contiguous VIIRS 375m pixels).
- `BHUVAN_ACTIVE_AGRICULTURAL_FIRE_OVERLAP`: Point intersects Bhuvan agricultural fire layer during declared season.
- `CROP_SEASON_MATCH`: Detected during Rabi (01 Apr – 30 May) or Kharif (15 Sep – 30 Nov) in key agricultural belt (Punjab, Haryana, UP, Rajasthan, MP).
- `LAND_COVER_CROPLAND`: High-resolution land cover indicates agricultural field.
- `LAND_COVER_TREE_COVER`: High-resolution land cover indicates closed/open forest canopy.
- `FOREST_TYPE_LAYER_OVERLAP`: Intersects Bhuvan / FSI Champion & Seth forest classification grid.
- `INDUSTRIAL_OR_MINING_CONTEXT`: Located within known steel, cement, or mining footprint.
- `IMD_WEATHER_CONTEXT`: Local IMD weather shows high fire-weather severity (high temp, low RH, zero rain).
