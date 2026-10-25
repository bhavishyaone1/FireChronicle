# FireChronicle Test Plan & Quality Assurance Framework

**System:** FireChronicle Harmonization Pipeline & Analytical API  
**Target Environment:** pytest (Python 3.11) + Vitest/Playwright (Frontend)  
**Status:** Pre-Hackathon Specification & Fixture Design

---

## 1. Test Objectives & Scientific Integrity Principles

The FireChronicle test suite ensures mathematical correctness, physical validity, and API resilience. It guarantees that:
1. Heterogeneous satellite formats are correctly parsed without silent coercion.
2. Coordinates and timestamps respect physical and orbital realities.
3. Candidate cross-sensor matches strictly adhere to configurable spatial-temporal tolerances.
4. The burning-activity calendar calculates resolution-insensitive active grid cells without double-counting collocated FRP.
5. All synthetic test records are explicitly tagged and never mixed into production analytical tables.

---

## 2. Test Suite Architecture

```text
backend/tests/
├── conftest.py                   # Pytest fixtures and synthetic test records generator
├── test_schemas.py               # Schema normalization & validation tests
├── test_coordinates_time.py     # Lat/lon bounds, dateline, and UTC parsing tests
├── test_matcher.py               # Spatial-temporal matching & classification tests
├── test_aggregator.py            # Calendar metrics & FRP non-duplication tests
├── test_api_endpoints.py         # FastAPI endpoint contracts, pagination & limits
└── test_resilience.py            # Missing MAP_KEY, network timeout, & malformed CSV tests
```

---

## 3. Detailed Test Specifications

### 3.1 Ingestion & Schema Normalization (`test_schemas.py`)
- **`test_modis_standard_schema_mapping`**:
  - *Input:* Representative MODIS CSV record (`latitude`, `longitude`, `brightness`, `scan`, `track`, `acq_date`, `acq_time`, `satellite`, `confidence`, `version`, `bright_t31`, `frp`, `daynight`, `type`).
  - *Expectation:* Maps to unified schema; integer confidence (e.g., 85) correctly mapped to category `'high'`; `observation_id` generated deterministically.
- **`test_viirs_standard_schema_mapping`**:
  - *Input:* Representative VIIRS 375 m record (`latitude`, `longitude`, `bright_ti4`, `scan`, `track`, `acq_date`, `acq_time`, `satellite`, `confidence`, `version`, `bright_ti5`, `frp`, `daynight`, `type`).
  - *Expectation:* Native categorical confidence (`'nominal'`) preserved; `sensor` labeled `'VIIRS'`; 375 m footprint parameters correctly populated.
- **`test_missing_optional_fields_handling`**:
  - *Input:* CSV record with null `frp` or omitted `type`.
  - *Expectation:* Does NOT crash or convert nulls to zero; sets `frp = None` with appropriate quality flag.
- **`test_duplicate_record_idempotency`**:
  - *Input:* Ingesting identical CSV records twice.
  - *Expectation:* Both produce identical SHA-256 `observation_id`; DuckDB ingestion ignores duplicate or updates without row duplication.

### 3.2 Coordinate & Timestamp Validation (`test_coordinates_time.py`)
- **`test_latitude_longitude_bounds`**:
  - *Cases:* Valid $(-33.86, 151.20)$; invalid latitude $(95.0, 45.0)$; invalid longitude $(12.0, 195.0)$.
  - *Expectation:* Out-of-bounds coordinates raise validation errors and are filtered into the quarantine log.
- **`test_utc_timestamp_parsing_and_boundary`**:
  - *Cases:* `acq_date = '2024-08-15'`, `acq_time = '0005'` $\rightarrow$ `2024-08-15T00:05:00Z`; `acq_time = '2359'` $\rightarrow$ `2024-08-15T23:59:00Z`.
  - *Expectation:* Zero-padded four-digit times parsed accurately into UTC without double-offsetting local time.
- **`test_antimeridian_dateline_handling`**:
  - *Cases:* Query bounding box spanning $175.0^\circ\text{E}$ to $-175.0^\circ\text{W}$.
  - *Expectation:* System handles boundary split correctly without rejecting the query as negative width.

### 3.3 Candidate Spatial-Temporal Matching (`test_matcher.py`)
- **`test_positive_cross_sensor_match`**:
  - *Setup:* Synthetic MODIS observation at $(34.050, -118.250)$ at $13:30\text{ UTC}$ and synthetic VIIRS observation at $(34.054, -118.253)$ at $13:45\text{ UTC}$ (Distance $\approx 500\text{ m} \le 1000\text{ m}$, $\Delta t = 15\text{ min} \le 60\text{ min}$).
  - *Expectation:* Detections are labeled `matched`; matched pair table records `distance_m` and `time_delta_min`.
- **`test_negative_spatial_separation_match`**:
  - *Setup:* Same overpass time ($13:30\text{ UTC}$), but locations separated by $3.5\text{ km}$ ($> 1.0\text{ km}$ tolerance).
  - *Expectation:* Observations classified as `MODIS_only` and `VIIRS_only`.
- **`test_negative_temporal_separation_match`**:
  - *Setup:* Collocated coordinates ($< 100\text{ m}$), but Terra MODIS morning pass ($10:30\text{ UTC}$) vs S-NPP afternoon pass ($13:30\text{ UTC}$, $\Delta t = 180\text{ min}$).
  - *Expectation:* Classified as independent `MODIS_only` and `VIIRS_only` observations (not simultaneous).
- **`test_one_to_many_viirs_clustering`**:
  - *Setup:* One 1 km MODIS pixel contains three distinct 375 m VIIRS detections within the same overpass window.
  - *Expectation:* All three VIIRS records link to the parent MODIS `observation_id` without duplicating the MODIS row.
- **`test_tolerance_sensitivity_sweep`**:
  - *Setup:* Run matcher over distance thresholds: $500\text{ m}$, $1000\text{ m}$, $1500\text{ m}$, $2000\text{ m}$.
  - *Expectation:* Matched fraction increases monotonically; results logged for methodology sensitivity panel.

### 3.4 Harmonization Metrics & Calendar Aggregation (`test_aggregator.py`)
- **`test_raw_detection_count_preservation`**:
  - *Setup:* 2 MODIS detections and 8 VIIRS detections over an AOI on Date $D$.
  - *Expectation:* `modis_raw_count == 2`, `viirs_raw_count == 8`.
- **`test_unique_active_cells_resolution_insensitivity`**:
  - *Setup:* 5 VIIRS detections clustered within a single 1 km equal-area grid cell; 1 MODIS detection in that same cell.
  - *Expectation:* `unique_active_cells == 1`. The metric eliminates point-density bias.
- **`test_frp_non_duplication_rule`**:
  - *Setup:* Matched pair with $FRP_{MODIS} = 45.0\text{ MW}$ and $FRP_{VIIRS} = 52.0\text{ MW}$.
  - *Expectation:* Aggregated FRP is **never** $97.0\text{ MW}$. App preserves per-sensor distributions and reports harmonized FRP as maximum or primary sensor value ($52.0\text{ MW}$).
- **`test_empty_vs_no_observation_calendar_days`**:
  - *Cases:* Day with satellite pass and 0 hotspots (`count == 0`, `status == 'no_detections'`) vs Day with instrument maintenance or heavy cloud coverage (`status == 'no_observation'`).
  - *Expectation:* The calendar visually and structurally distinguishes both cases.

### 3.5 API Endpoints & Resilience (`test_api_endpoints.py` & `test_resilience.py`)
- **`test_health_endpoint_no_secrets`**:
  - *Expectation:* `/api/health` returns `200 OK` with system metadata and does NOT expose `FIRMS_MAP_KEY` or any environment secret.
- **`test_query_bounds_clamping`**:
  - *Expectation:* Requesting a 180-day query is clamped to the 30-day maximum with an informative warning header.
- **`test_firms_api_downtime_fallback`**:
  - *Setup:* Mock FIRMS API returning `503 Service Unavailable` or connection timeout.
  - *Expectation:* Backend serves cached DuckDB data or small sample fixtures with `data_source: 'cached_offline'` in response metadata.
