# FireChronicle Canonical Observation Schema

**Version:** 1.0.0  
**Storage Format:** Apache Parquet (`data/processed/canonical_observations.parquet`) & DuckDB  
**Spatial Reference System:** WGS 84 (`EPSG:4326`) with Lambert Cylindrical Equal-Area Grid Indexing (`EPSG:6933`)  

---

## 1. Schema Definition

| Canonical Column | Data Type | Nullable | Source Field Mapping | Description |
| :--- | :--- | :--- | :--- | :--- |
| `observation_id` | `VARCHAR` | No | Deterministic Hash | Unique deterministic record key computed from `SHA256(source_product + lat + lon + acq_datetime_utc)`. |
| `source_system` | `VARCHAR` | No | Constant | `NASA_FIRMS` |
| `source_archive_filename` | `VARCHAR` | No | Extraction metadata | Exact ZIP archive member (e.g. `DL_FIRE_M-C61_841318.zip` or `DL_FIRE_J1V-C2_841340.zip`). |
| `source_file_name` | `VARCHAR` | No | Archive member | Exact DBF member name (e.g. `fire_archive_M-C61_841318.dbf`). |
| `source_product` | `VARCHAR` | No | Product code | `MODIS_C61` or `VIIRS_J1V_C2`. |
| `collection` | `VARCHAR` | No | String | `6.1` or `2.0`. |
| `product_version` | `VARCHAR` | No | Source `VERSION` | Exact version string (`61.03`, `6.1NRT`, `2.0`, `2.0NRT`). |
| `processing_level` | `VARCHAR` | No | Inferred | `standard` or `NRT`. |
| `sensor` | `VARCHAR` | No | Instrument | `MODIS` or `VIIRS`. |
| `platform` | `VARCHAR` | No | Spacecraft | `Terra`, `Aqua`, or `NOAA-20`. |
| `acq_datetime_utc` | `TIMESTAMP` | No | `ACQ_DATE` + `ACQ_TIME` | Timezone-aware ISO-8601 acquisition timestamp in UTC. |
| `acq_datetime_ist` | `VARCHAR` | No | Computed | India Standard Time representation (`UTC + 05:30`). |
| `acq_date_utc` | `DATE` | No | `ACQ_DATE` | UTC date of observation overpass. |
| `acq_time_utc` | `VARCHAR` | No | `ACQ_TIME` | 4-character UTC time (HHMM). |
| `latitude` | `DOUBLE` | No | `LATITUDE` | Pixel centroid latitude in decimal degrees. |
| `longitude` | `DOUBLE` | No | `LONGITUDE` | Pixel centroid longitude in decimal degrees. |
| `brightness_channel_1` | `DOUBLE` | Yes | `BRIGHTNESS` / `BRIGHT_TI4` | Mid-infrared brightness temperature in Kelvin ($K$). |
| `brightness_channel_1_name` | `VARCHAR` | No | Metadata | `Channel 21/22 (3.96 μm)` for MODIS; `Band I-4 (3.74 μm)` for VIIRS. |
| `brightness_channel_1_unit` | `VARCHAR` | No | Constant | `K` (Kelvin) |
| `brightness_channel_2` | `DOUBLE` | Yes | `BRIGHT_T31` / `BRIGHT_TI5` | Thermal infrared brightness temperature in Kelvin ($K$). |
| `brightness_channel_2_name` | `VARCHAR` | No | Metadata | `Channel 31 (11.03 μm)` for MODIS; `Band I-5 (11.45 μm)` for VIIRS. |
| `brightness_channel_2_unit` | `VARCHAR` | No | Constant | `K` (Kelvin) |
| `confidence_category` | `VARCHAR` | No | Stratified | Standardized rating: `low`, `nominal`, `high`. |
| `raw_confidence` | `VARCHAR` | No | Original value | Exact original numeric value ($0\text{--}100$) or categorical string (`low`, `nominal`, `high`). |
| `confidence_semantics` | `VARCHAR` | No | Metadata | `MODIS_PERCENT_0_100` or `VIIRS_CATEGORY_LOW_NOMINAL_HIGH`. |
| `frp_mw` | `DOUBLE` | Yes | `FRP` | Fire Radiative Power in Megawatts ($MW$). |
| `scan_km` | `DOUBLE` | Yes | `SCAN` | Along-scan ground pixel dimension ($km$). |
| `track_km` | `DOUBLE` | Yes | `TRACK` | Along-track ground pixel dimension ($km$). |
| `daynight` | `VARCHAR` | No | `DAYNIGHT` | `D` (Day) or `N` (Night). |
| `anomaly_type` | `VARCHAR` | Yes | `TYPE` | Standard product hotspot classification code (`0`=veg, `1`=volcano, `2`=static, `3`=offshore). Null for NRT files. |
| `india_state` | `VARCHAR` | Yes | Spatial join | Official Indian State attribution (e.g. `Madhya Pradesh`, `Punjab`). |
| `india_district` | `VARCHAR` | Yes | Spatial join | Indian District administrative boundary. |
| `inside_india_boundary` | `BOOLEAN` | No | Point-in-polygon | Whether coordinates fall strictly within the official Republic of India boundary polygon. |
| `grid_cell_id` | `VARCHAR` | No | CEA 1 km Index | Authalic Lambert Equal-Area 1.0 km grid index identifier (`grid_1.0km_Y_X`). |
| `context_class` | `VARCHAR` | No | Context Engine | Rule-based classification: `LIKELY_AGRICULTURAL_CONTEXT`, `LIKELY_FOREST_CONTEXT`, `OTHER_STATIC_THERMAL_SOURCE`, `UNCLASSIFIED`. |
| `context_confidence` | `VARCHAR` | No | Context Engine | Heuristic certainty: `HIGH`, `MEDIUM`, `LOW`. |
| `context_evidence` | `JSON` | No | Context Engine | Array of supporting contextual evidence tokens (e.g. `["KHARIF_PADDY_HARVEST_SEASON", "STATE_PUNJAB"]`). |
