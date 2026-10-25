# Data Sources Register

This register documents all primary satellite observations, APIs, contextual geographic datasets, and validation resources utilized or evaluated for **FireChronicle**.

---

## 1. Primary Observation Sources (NASA FIRMS)

### 1.1 MODIS Active Fire Product (Collection 6.1)
- **Dataset / Product:** MODIS Collection 6.1 Thermal Anomalies / Active Fire (Swath: MOD14 [Terra] and MYD14 [Aqua]; Gridded: MOD14A1/MYD14A1)
- **Publisher:** NASA Earth Science Data and Information System (ESDIS) / LANCE / FIRMS
- **Official Documentation:** [MODIS Collection 6.1 Active Fire Product User Guide](https://modarch.gsfc.nasa.gov/data/dataprod/mod14.php)
- **Platform / Sensor:** Terra (morning descending ~10:30 AM/PM local solar time) and Aqua (afternoon ascending ~1:30 AM/PM local solar time) / MODIS instrument
- **Product Identifiers in FIRMS API:**
  - `MODIS_SP` — Standard Processing (science-quality, ~2–3 month latency, definitive calibration)
  - `MODIS_NRT` — Near-Real-Time (available within ~3 hours of overpass, preliminary calibration)
- **Spatial Resolution:** ~1 km (1000 m nominal at nadir; expands up to ~2 km × 4.8 km at scan edges due to bow-tie effect)
- **Temporal Coverage:** November 2000 (Terra) / July 2002 (Aqua) to Present
- **Key Fields & Schema:**
  - `latitude`, `longitude`: Center coordinates of fire pixel (WGS84 decimal degrees).
  - `brightness`: Channel 21/22 brightness temperature (Kelvin).
  - `scan`, `track`: Across-track and along-track pixel dimensions (km).
  - `acq_date`, `acq_time`: Acquisition date (`YYYY-MM-DD`) and UTC time (`HHMM`).
  - `satellite`: Satellite identifier (`Terra` or `Aqua`).
  - `confidence`: Detection confidence (integer percentage: 0% to 100%). Classified into low (<30%), nominal (30–80%), and high (>80%).
  - `version`: Algorithm / processing collection (e.g. `6.1NRT` or `6.1SP`).
  - `bright_t31`: Channel 31 brightness temperature (Kelvin).
  - `frp`: Fire Radiative Power (MW).
  - `daynight`: `D` (Day) or `N` (Night).
  - `type`: Inferred anomaly source (`0` = presumed vegetation fire, `1` = active volcano, `2` = other static land source, `3` = offshore).
- **Access & Authentication:** Free FIRMS `MAP_KEY` via [FIRMS API Request](https://firms.modaps.eosdis.nasa.gov/api/map_key/) or bulk archive via Earthdata Login.
- **License / Attribution:** NASA Open Data Policy. Citation: "We acknowledge the use of data and/or imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://firms.modaps.eosdis.nasa.gov/), part of the NASA Earth Observing System Data and Information System (EOSDIS)."
- **Known Limitations:**
  - 1 km nadir resolution misses smaller, low-intensity, or short-lived fires under canopy.
  - Pixel distortion (bow-tie effect) widens footprint substantially at limb edges.
  - Overpass occurs twice daily per satellite (Terra 10:30, Aqua 13:30 local solar time); activity outside overpasses is not captured.
- **App Usage:** Historical foundation (2000–present); compared with VIIRS from 2012–present to highlight sensor discontinuity.

---

### 1.2 VIIRS 375 m Active Fire Products (S-NPP, NOAA-20, NOAA-21)
- **Dataset / Product:** VIIRS 375 m Active Fire Product (I-band: VNP14IMG for S-NPP, VJ114IMG for NOAA-20, VJ214IMG for NOAA-21)
- **Publisher:** NASA ESDIS / LANCE / VIIRS Land Science Team
- **Official Documentation:** [VIIRS 375 m Active Fire Product User Guide](https://viirsland.gsfc.nasa.gov/Products/NASA/FireESDR.html)
- **Platforms / Sensor:**
  - Suomi-NPP (S-NPP): Launched Oct 2011, ~13:30 local solar time ascending.
  - NOAA-20 (JPSS-1): Launched Nov 2017, orbits ~50 minutes separated from S-NPP (~13:30 local).
  - NOAA-21 (JPSS-2): Launched Nov 2022, provides additional orbital coverage.
- **Product Identifiers in FIRMS API:**
  - `VIIRS_SNPP_SP`, `VIIRS_SNPP_NRT`
  - `VIIRS_NOAA20_SP`, `VIIRS_NOAA20_NRT`
  - `VIIRS_NOAA21_SP`, `VIIRS_NOAA21_NRT`
- **Spatial Resolution:** 375 m nominal at nadir; onboard pixel aggregation limits footprint expansion across the swath (maximum ~750 m at scan edge, preventing severe bow-tie distortion).
- **Temporal Coverage:** January 2012 to Present (S-NPP); January 2020 to Present (NOAA-20 SP); 2023 to Present (NOAA-21).
- **Key Fields & Schema:**
  - `latitude`, `longitude`: Center coordinates of fire pixel (WGS84 decimal degrees).
  - `bright_ti4`: I-band 4 (3.74 µm) brightness temperature (Kelvin).
  - `scan`, `track`: Across-track and along-track pixel dimensions (km).
  - `acq_date`, `acq_time`: Acquisition date (`YYYY-MM-DD`) and UTC time (`HHMM`).
  - `satellite`: Satellite identifier (`N` for Suomi-NPP, `1` for NOAA-20, `2` for NOAA-21).
  - `confidence`: Categorical string: `'low'`, `'nominal'`, or `'high'`.
  - `version`: Algorithm version (e.g. `2.0NRT`, `1.0SP`).
  - `bright_ti5`: I-band 5 (11.45 µm) brightness temperature (Kelvin).
  - `frp`: Fire Radiative Power (MW).
  - `daynight`: `D` (Day) or `N` (Night).
  - `type`: Anomaly category (`0` = presumed vegetation, `1` = active volcano, `2` = other static, `3` = offshore).
- **Access & Authentication:** Free FIRMS `MAP_KEY`.
- **License / Attribution:** NASA Open Data Policy.
- **Known Limitations:**
  - Detects ~3x to 10x more active-fire hotspots than MODIS over identical scenes due to higher spatial resolution and lower saturation thresholds.
  - Confidence format is categorical (`low`, `nominal`, `high`), not a 0–100 integer like MODIS.
  - FRP algorithm differs between 375 m I-band and 750 m M-band / MODIS 1 km.
- **App Usage:** High-resolution modern fire tracking; key counterpart in cross-sensor matching and harmonization.

---

### 1.3 VIIRS 750 m Active Fire Product (ESDR)
- **Dataset / Product:** VIIRS 750 m Active Fire Product (M-band: VNP14 / VJ114)
- **Publisher:** NASA ESDIS
- **Spatial Resolution:** 750 m nominal at nadir.
- **Design Intent:** Built specifically for algorithm continuity with the MODIS 1 km fire product (using similar M-band spectral channels and thresholds).
- **App Usage:** Methodological benchmark explaining why 375 m product diverges more sharply from MODIS than 750 m product.

---

## 2. NASA FIRMS API Endpoints

### 2.1 FIRMS Area API
- **Endpoint Structure:**
  ```text
  https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{source}/{west,south,east,north}/{day_range}/{date}
  ```
- **Supported Sources:** `MODIS_SP`, `MODIS_NRT`, `VIIRS_SNPP_SP`, `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_SP`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_SP`, `VIIRS_NOAA21_NRT`, `LANDSAT_NRT`.
- **Bounding Box Convention:** `west,south,east,north` in decimal degrees (-180 to 180, -90 to 90).
- **Day Range Limit:** 1 to 5 days per query.
- **Rate Limits:** Documented per MAP_KEY tier (cached backend queries strictly required).
- **App Usage:** Primary ingestion mechanism for user-selected AOIs and short-term analysis windows.

### 2.2 FIRMS Data Availability API
- **Endpoint Structure:**
  ```text
  https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{map_key}/{sensor}
  ```
- **Supported Sensor Param:** `ALL`, `MODIS_SP`, `VIIRS_SNPP_SP`, etc.
- **Response Content:** CSV detailing earliest and latest available acquisition dates per source.
- **App Usage:** Dynamic system metadata initialization and client date-range bounds validation.

---

## 3. NASA Visualization & Imagery Services

### 3.1 NASA GIBS (Global Imagery Browse Services) & Worldview
- **Publisher:** NASA ESDIS
- **Endpoint:** [NASA GIBS WMTS / WMS Services](https://www.earthdata.nasa.gov/data/tools/gibs)
- **Layers Available:** Corrected Reflectance (True Color from Terra/Aqua MODIS, Suomi-NPP VIIRS, NOAA-20 VIIRS), Thermal Anomaly Overlays.
- **App Usage:** Background map imagery layer in MapLibre GL for visual context and smoke/burn-scar verification.

---

## 4. Contextual & Reference Geographic Datasets

### 4.1 Natural Earth (Administrative & Coastlines)
- **Publisher:** Natural Earth (Public Domain)
- **Scale:** 1:110m and 1:50m cultural boundaries.
- **License:** Public Domain / Creative Commons 0.
- **App Usage:** Base country and region boundary polygons for AOI presets.

### 4.2 geoBoundaries
- **Publisher:** geoBoundaries.org (William & Mary)
- **Coverage:** Global sub-national administrative boundaries (ADM1 / ADM2).
- **License:** Open Academic / CC-BY 4.0.
- **App Usage:** High-detail district/county boundary queries.

### 4.3 NASA MODIS Burned Area Product (MCD64A1)
- **Publisher:** NASA ESDIS
- **Spatial Resolution:** 500 m gridded monthly.
- **App Usage:** Contextual validation reference. Explicitly documented in-app that *active fire hotspots (momentary thermal energy)* and *burned area (post-fire surface alteration)* are distinct physical phenomena that cannot be substituted for one another.
