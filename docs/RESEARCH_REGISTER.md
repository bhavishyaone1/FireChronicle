# FireChronicle — Research Register & Technical Reference Index

**Project:** FireChronicle  
**Challenge:** NASA International Space Apps Challenge 2026 — [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/)  
**Document Status:** Comprehensive Research Register & Technical Authority  
**Audit & Access Date:** 2026-10-25  
**Operating Mode:** `HACKATHON_BUILD`

---

## 🔬 Critical Science Guardrail

> [!CAUTION]
> **A satellite active-fire hotspot detection is NOT an independent wildfire.**  
> Thermal anomalies detected by spaceborne radiometers represent momentary infrared radiative energy emissions. Detections encompass vegetation fires, agricultural stubble burns, industrial gas flares, volcanoes, and geothermal activity.  
> 
> The following metrics represent fundamentally distinct physical phenomena and **must never be conflated**:
> 1. **Raw Hotspot Point Count:** Number of detection records. Heavily biased by satellite pixel resolution (VIIRS 375 m detects 3× to 10× more points than MODIS 1 km over identical physical fires).
> 2. **Unique Active Grid Cells:** Spatial footprint of burning activity on an equal-area grid (resolution-insensitive).
> 3. **Fire Radiative Power (FRP in MW):** Instantaneous rate of radiant energy output; cannot be summed across overlapping sensors.
> 4. **Burned Area (km²):** Post-fire surface scar alteration (e.g. MCD64A1); distinct from active flaming fronts.
> 5. **Wildfire Risk / Probability:** Predictive forecast of future ignition; FireChronicle is **not** a predictive fire ignition tool.

---

## 📚 Master Index of Technical & Scientific References

Each reference is indexed with its canonical URL, owning organization, classified source type, relevant field definitions and limitations, access date (2026-10-25), and exact architectural/scientific usage in FireChronicle.

### Category Legend:
- `[OFFICIAL_CHALLENGE_REQUIREMENT]` — Binding requirement or criteria from NASA Space Apps.
- `[SCIENTIFIC_CONSTRAINT]` — Physical/algorithmic constraint grounded in peer-reviewed science or sensor physics.
- `[ENGINEERING_CHOICE]` — Architectural, framework, or tooling implementation choice.
- `[OPTIONAL_FEATURE]` — Contextual or auxiliary dataset evaluated for decision support.

---

### Section 1: Official Challenge and Event Documentation

#### 1. Exact Official Challenge Statement
- **URL:** [https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/)
- **Owner / Organization:** NASA International Space Apps Challenge Committee
- **Source Type:** Official Challenge Statement `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Key Points:** Mandates building a deployable tool that reconciles MODIS and VIIRS active-fire hotspot observations onto a common grid framework, produces an interpretable burning-activity calendar, accounts for sensor divergence, and visualizes historical regimes.
- **Relevant Fields / Limitations:** Full challenge brief and resources released October 28, 2026; event window November 14–15, 2026.
- **FireChronicle Usage:** Primary problem definition, functional scope, and judging compliance framework.

#### 2. NASA Space Apps 2026 Home / Event Information
- **URL:** [https://www.spaceappschallenge.org/2026/](https://www.spaceappschallenge.org/2026/)
- **Owner / Organization:** NASA Earth Science Division
- **Source Type:** Official Event Portal `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Key Points:** Establishes event schedule, registration, team participation rules, and judging criteria.
- **FireChronicle Usage:** Event timeline, fair-play mode verification, and submission portal link.

#### 3. NASA’s 2026 Space Apps Announcement
- **URL:** [https://science.nasa.gov/universe/nasa-welcomes-all-ages-experience-levels-for-space-apps-challenge/](https://science.nasa.gov/universe/nasa-welcomes-all-ages-experience-levels-for-space-apps-challenge/)
- **Owner / Organization:** NASA Science Mission Directorate
- **Source Type:** Agency Press Announcement `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Key Points:** Details open-data ethos, global reach, and non-commercial public science principles.
- **FireChronicle Usage:** Guides open-source licensing (MIT) and public non-proprietary architecture.

#### 4. Space Apps India Local Event Page
- **URL:** [https://www.spaceappsindia.com/](https://www.spaceappsindia.com/)
- **Owner / Organization:** Space Apps Local Lead India
- **Source Type:** Local Event Reference `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Key Points:** Local event timing, judging schedule, and participant coordination for Indian time zone.
- **FireChronicle Usage:** Timezone harmonization reference (`+05:30` IST local time vs UTC satellite acquisition timestamps).

#### 5. NASA Space Apps Teams & Challenge Mirror Example
- **URL:** [https://www.spaceappschallenge.org/2026/find-a-team/protectech/](https://www.spaceappschallenge.org/2026/find-a-team/protectech/)
- **Owner / Organization:** NASA Space Apps Challenge
- **Source Type:** Secondary Team / Challenge Search View `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Key Points:** Confirms secondary challenge summary text; official challenge page retains authority.
- **FireChronicle Usage:** Cross-validation of challenge title and category boundaries.

---

### Section 2: Primary Fire Hotspot Data — NASA FIRMS

#### 6. NASA FIRMS Main Site
- **URL:** [https://firms.modaps.eosdis.nasa.gov/](https://firms.modaps.eosdis.nasa.gov/)
- **Owner / Organization:** NASA ESDIS / LANCE
- **Source Type:** Official Dataset & Portal `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Key Points:** Authoritative global portal for near-real-time and archive active fire data from MODIS and VIIRS.
- **FireChronicle Usage:** Primary data provider and global attribution anchor.

#### 7. FIRMS Active-Fire Data Downloads
- **URL:** [https://firms.modaps.eosdis.nasa.gov/active_fire/](https://firms.modaps.eosdis.nasa.gov/active_fire/)
- **Owner / Organization:** NASA FIRMS
- **Source Type:** Official Data Download Portal `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Key Points:** Direct access to recent 24h, 48h, and 7-day active fire text/SHP/KML files.
- **FireChronicle Usage:** Specifications for standard CSV headers across MODIS and VIIRS feeds.

#### 8. FIRMS Historical Archive
- **URL:** [https://firms.modaps.eosdis.nasa.gov/download/](https://firms.modaps.eosdis.nasa.gov/download/)
- **Owner / Organization:** NASA FIRMS / Earthdata Login
- **Source Type:** Official Historical Archive `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Key Points:** Archive of standard-processing science quality observations dating back to 2000 (MODIS) and 2012 (VIIRS).
- **Relevant Fields / Limitations:** Requires Earthdata authentication for bulk geographic extractions older than 7 days.
- **FireChronicle Usage:** Ingestion source for multi-year baseline data slices.

#### 9. FIRMS API Overview
- **URL:** [https://firms.modaps.eosdis.nasa.gov/api/](https://firms.modaps.eosdis.nasa.gov/api/)
- **Owner / Organization:** NASA FIRMS
- **Source Type:** Official API Documentation `[ENGINEERING_CHOICE]`
- **Key Points:** Architectural guidelines for programmatic data access, API keys, and rate limits.
- **FireChronicle Usage:** Technical blueprint for `backend/app/services/firms_client.py`.

#### 10. FIRMS Area API
- **URL:** [https://firms.modaps.eosdis.nasa.gov/api/area/](https://firms.modaps.eosdis.nasa.gov/api/area/)
- **Owner / Organization:** NASA FIRMS
- **Source Type:** Official REST API `[OFFICIAL_CHALLENGE_REQUIREMENT]`
- **Endpoint Structure:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{WEST,SOUTH,EAST,NORTH}/{DAY_RANGE}/{DATE}`
- **Constraints:** Bounding box in `west,south,east,north` decimal degrees; day range limited to 1–5 days per query.
- **FireChronicle Usage:** Core on-demand geographic query engine implemented with chunking and backoff in `firms_client.py`.

#### 11. FIRMS Data Availability API
- **URL:** [https://firms.modaps.eosdis.nasa.gov/api/data_availability/](https://firms.modaps.eosdis.nasa.gov/api/data_availability/)
- **Owner / Organization:** NASA FIRMS
- **Source Type:** Official Metadata API `[ENGINEERING_CHOICE]`
- **Endpoint Structure:** `https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{MAP_KEY}/{SENSOR}`
- **FireChronicle Usage:** Dynamic temporal bounds validation and orbital coverage detection in `GET /api/metadata`.

#### 12. Free FIRMS MAP_KEY Registration
- **URL:** [https://firms.modaps.eosdis.nasa.gov/api/map_key/](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
- **Owner / Organization:** NASA FIRMS
- **Source Type:** Authentication Portal `[ENGINEERING_CHOICE]`
- **Security Rule:** Users register for a personal key; stored exclusively in `.env` as `FIRMS_MAP_KEY` and never exposed client-side.
- **FireChronicle Usage:** Detailed user onboarding guide in `README.md`.

#### 13. FIRMS API Usage Tutorial
- **URL:** [https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html](https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html)
- **Owner / Organization:** NASA FIRMS Fire Data Academy
- **Source Type:** Technical Tutorial `[ENGINEERING_CHOICE]`
- **Key Points:** Python requests/pandas patterns for parsing CSV responses and managing API quotas.
- **FireChronicle Usage:** Implemented in `firms_client.py` using `httpx.AsyncClient`.

#### 14. FIRMS Fire Data Academy
- **URL:** [https://firms.modaps.eosdis.nasa.gov/content/academy/](https://firms.modaps.eosdis.nasa.gov/content/academy/)
- **Owner / Organization:** NASA FIRMS / ESDIS
- **Source Type:** Training & Methodological Repository `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Official Jupyter/Colab notebooks on UTC timestamp parsing, coordinate projections, and diurnal fire cycles.
- **FireChronicle Usage:** Formulated timestamp parsing rules in `normalizer.py`.

#### 15. FIRMS Alert / Product Notes
- **URL:** [https://firms.modaps.eosdis.nasa.gov/alerts/notes.php](https://firms.modaps.eosdis.nasa.gov/alerts/notes.php)
- **Owner / Organization:** NASA FIRMS
- **Source Type:** Operational Product Caveats `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Documents sensor maintenance, orbital maneuvers, and latency differences between NRT and SP.
- **FireChronicle Usage:** Preserves separation between `SP` and `NRT` records in schemas.

#### 16. FIRMS WMS / WFS Map Services
- **URL:** [https://firms.modaps.eosdis.nasa.gov/api/](https://firms.modaps.eosdis.nasa.gov/api/)
- **Owner / Organization:** NASA FIRMS
- **Source Type:** Geospatial Web Services `[ENGINEERING_CHOICE]`
- **Key Points:** WMS/WFS endpoints for GIS overlay; secondary to direct tabular API for analytical calculations.
- **FireChronicle Usage:** Evaluated; direct CSV/Parquet analytical pipeline prioritized for performance and transparency.

---

### Section 3: MODIS Data and Documentation

#### 17. NASA MODIS Active-Fire Product Page
- **URL:** [https://modarch.gsfc.nasa.gov/data/dataprod/mod14.php](https://modarch.gsfc.nasa.gov/data/dataprod/mod14.php)
- **Owner / Organization:** NASA Goddard Space Flight Center (GSFC)
- **Source Type:** Official Sensor Specification `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Documents MOD14 (Terra) and MYD14 (Aqua) level-2 swath products; ~1 km nominal resolution at nadir.
- **FireChronicle Usage:** Platform definitions in `schemas/common.py` (`PlatformType.TERRA`, `PlatformType.AQUA`).

#### 18. MODIS Active-Fire / Burned-Area User Guide Index
- **URL:** [https://modis-fire.umd.edu/guides.html](https://modis-fire.umd.edu/guides.html)
- **Owner / Organization:** University of Maryland / NASA GSFC
- **Source Type:** Product Guide Repository `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Index of user guides across Collections 5, 6, and 6.1.
- **FireChronicle Usage:** Contextual reference for Collection 6.1 science algorithms.

#### 19. MODIS Collection 6 / 6.1 Active-Fire User Guide (PDF)
- **URL:** [https://modis-fire.umd.edu/files/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf](https://modis-fire.umd.edu/files/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf)
- **Owner / Organization:** Giglio, L., Schroeder, W., & Justice, C. O.
- **Source Type:** Authoritative Scientific Product Guide `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:**
  - MODIS nadir pixel covers 1000 m × 1000 m; expands up to ~2.0 km × 4.8 km at scan edges due to geometric bow-tie effect.
  - Confidence is a continuous integer (0% to 100%) computed from background brightness temperature difference.
  - FRP is estimated using the 4 µm brightness temperature empirical radiance technique.
- **FireChronicle Usage:** Governs confidence mapping (`<30%` low, `30–80%` nominal, `>80%` high) in `normalizer.py`.

#### 20. NASA Earthdata — MODIS Collection 6.1 Fire Attribute Documentation
- **URL:** [https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms](https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms)
- **Owner / Organization:** NASA Earthdata
- **Source Type:** Official Field Definitions `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:**
  - Field `type`: `0` = presumed vegetation fire, `1` = active volcano, `2` = other static land source, `3` = offshore.
  - Field `daynight`: `D` = Day, `N` = Night.
- **FireChronicle Usage:** Normalized in `schemas/observation.py` (`anomaly_type`, `daynight`).

---

### Section 4: VIIRS Data and Documentation

#### 21. NASA VIIRS Land Products — Active Fires
- **URL:** [https://viirsland.gsfc.nasa.gov/Products/NASA/FireESDR.html](https://viirsland.gsfc.nasa.gov/Products/NASA/FireESDR.html)
- **Owner / Organization:** NASA GSFC / VIIRS Land Science Team
- **Source Type:** Official Sensor Specification `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Outlines VNP14IMG (Suomi-NPP), VJ114IMG (NOAA-20), and VJ214IMG (NOAA-21) 375 m I-band active fire products.
- **FireChronicle Usage:** Platform definitions in `schemas/common.py` (`SNPP`, `NOAA20`, `NOAA21`).

#### 22. NASA VIIRS 375 m and 750 m Active Fire Product User Guide (PDF)
- **URL:** [https://viirsland.gsfc.nasa.gov/PDF/VIIRS_activefire_User_Guide.pdf](https://viirsland.gsfc.nasa.gov/PDF/VIIRS_activefire_User_Guide.pdf)
- **Owner / Organization:** Schroeder, W., & Giglio, L.
- **Source Type:** Authoritative Scientific Product Guide `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:**
  - VIIRS 375 m (I-band: I4 at 3.74 µm, I5 at 11.45 µm) provides 375 m resolution at nadir.
  - Onboard 3-pixel aggregation limits limb pixel expansion to ~750 m, eliminating extreme bow-tie distortion.
  - Detects fires an order of magnitude smaller than MODIS threshold.
  - Confidence is categorical (`low`, `nominal`, `high`), not a continuous percentage.
  - The 750 m M-band product preserves continuity with MODIS 1 km, whereas the 375 m product diverges in count density.
- **FireChronicle Usage:** Fundamental justification for resolution divergence in `docs/methodology.md` and `DiscontinuityInspector.tsx`.

#### 23. NASA Earthdata — NOAA-20 VIIRS 375 m Product Information
- **URL:** [https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms/vj114imgtdlnrt](https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms/vj114imgtdlnrt)
- **Owner / Organization:** NASA Earthdata / LANCE
- **Source Type:** Product Information Sheet `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Documents NOAA-20 (JPSS-1) orbit (~50 minutes separated from Suomi-NPP, ascending ~13:30 local solar time).
- **FireChronicle Usage:** Temporal tolerance calibration ($\Delta t_{max} = 60\text{ min}$) for cross-matching near-synchronous afternoon orbits.

#### 24. NASA Earthdata — NOAA-21 VIIRS 375 m Product Information
- **URL:** [https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms/vj214imgtdlnrt](https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms/vj214imgtdlnrt)
- **Owner / Organization:** NASA Earthdata / LANCE
- **Source Type:** Product Information Sheet `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Documents NOAA-21 (JPSS-2) operational status and field definitions.
- **FireChronicle Usage:** Schema support for `VIIRS_NOAA21_SP` and `VIIRS_NOAA21_NRT`.

---

### Section 5: Scientific Literature and Validation References

#### 25. Li et al. (2018), “Comparison of Fire Radiative Power Estimates From VIIRS and MODIS Observations”
- **DOI:** [https://doi.org/10.1029/2017JD027823](https://doi.org/10.1029/2017JD027823)
- **Open Access Copy:** [NOAA Institutional Repository (PDF)](https://repository.library.noaa.gov/view/noaa/49896/noaa_49896_DS1.pdf)
- **Owner / Organization:** Journal of Geophysical Research: Atmospheres (AGU / NOAA)
- **Source Type:** Peer-Reviewed Scientific Authority `[SCIENTIFIC_CONSTRAINT]`
- **Critical Findings & Insights:**
  1. *FRP Discrepancies:* VIIRS 375 m FRP is derived from I-band radiances with lower saturation thresholds than MODIS 4 µm channels.
  2. *Scale & Aggregation:* Over identical fires, individual VIIRS FRP values are lower than MODIS because VIIRS isolates smaller flame fractions. However, aggregated cluster FRP shows non-linear regional divergence.
  3. *Scan Angle Impact:* MODIS pixel expansion at scan edges dilutes FRP density; VIIRS onboard aggregation maintains tighter footprint bounds.
  4. *No Universal Correction Factor:* Li et al. explicitly prove that applying a single global multiplicative scaling coefficient between MODIS and VIIRS FRP is scientifically invalid due to fuel bed variation, canopy obscuration, and viewing geometry.
- **FireChronicle Usage:** Direct authority for **prohibiting blind FRP summation** and keeping raw FRP values preserved per sensor in `aggregator.py` and `SensorDiscontinuityInspector.tsx`.

#### 26. NASA MODIS Science Team Publication on MODIS/VIIRS FRP
- **URL:** [https://modis.gsfc.nasa.gov/sci_team/pubs/abstract_new.php?id=39209](https://modis.gsfc.nasa.gov/sci_team/pubs/abstract_new.php?id=39209)
- **Owner / Organization:** NASA MODIS Science Team
- **Source Type:** Peer-Reviewed Publication Reference `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Analyzes cross-sensor fire radiative energy agreement by study region, grid size, and view angle.
- **FireChronicle Usage:** Supports distance sensitivity sweep analysis (500m to 2000m) in `matcher.py`.

#### 27. NASA MODIS Burned-Area Product Page
- **URL:** [https://modarch.gsfc.nasa.gov/data/dataprod/mod45.php](https://modarch.gsfc.nasa.gov/data/dataprod/mod45.php)
- **Owner / Organization:** NASA GSFC
- **Source Type:** Contextual Dataset Description `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Distinguishes burned area (post-fire surface reflectance alterations) from active fire hotspots.
- **FireChronicle Usage:** Cited in `MethodologyProvenance.tsx` as a non-equivalent physical measurement.

#### 28. NASA MCD64A1 Burned-Area Product
- **URL:** [https://lpdaac.usgs.gov/products/mcd64a1v061/](https://lpdaac.usgs.gov/products/mcd64a1v061/)
- **Owner / Organization:** USGS / NASA LP DAAC
- **Source Type:** Auxiliary Context Dataset `[OPTIONAL_FEATURE]`
- **Key Points:** 500 m gridded monthly burned area.
- **FireChronicle Usage:** Retained as an optional validation layer; excluded from core MVP to avoid false equivalence.

#### 29. NASA Earthdata Search
- **URL:** [https://search.earthdata.nasa.gov/](https://search.earthdata.nasa.gov/)
- **Owner / Organization:** NASA ESDIS
- **Source Type:** Dataset Discovery Engine `[ENGINEERING_CHOICE]`
- **Key Points:** Centralized discovery for NASA Earth science granule downloads.
- **FireChronicle Usage:** Reference for historical granule lookups.

#### 30. NASA FIRMS FAQ & Scientific Notes
- **URL:** [https://firms.modaps.eosdis.nasa.gov/](https://firms.modaps.eosdis.nasa.gov/)
- **Owner / Organization:** NASA FIRMS
- **Source Type:** Technical Guidance `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Official caveats regarding pyrocumulus cloud blockage, reflective solar glare, and false positive thermal anomalies.
- **FireChronicle Usage:** Methodological limitations documented in `model_card.md` and `MethodologyProvenance.tsx`.

---

### Section 6: NASA Imagery & Map Context

#### 31. NASA Worldview
- **URL:** [https://worldview.earthdata.nasa.gov/](https://worldview.earthdata.nasa.gov/)
- **Owner / Organization:** NASA ESDIS
- **Source Type:** Interactive Visualization Service `[OPTIONAL_FEATURE]`
- **Key Points:** Interactive daily true-color satellite imagery browse tool.
- **FireChronicle Usage:** Visual case study verification tool for test scenes (e.g. California 2024 fire plumes).

#### 32. NASA Global Imagery Browse Services (GIBS)
- **URL:** [https://www.earthdata.nasa.gov/data/tools/gibs](https://www.earthdata.nasa.gov/data/tools/gibs)
- **Owner / Organization:** NASA ESDIS
- **Source Type:** Official WMTS / WMS Tile Service `[ENGINEERING_CHOICE]`
- **Key Points:** Full-resolution raster imagery tiles served via standard OGC WMTS endpoints.
- **FireChronicle Usage:** Architecture design supports GIBS Corrected Reflectance imagery as background raster layers in MapLibre GL.

#### 33. GIBS API Documentation
- **URL:** [https://nasa-gibs.github.io/gibs-api-docs/](https://nasa-gibs.github.io/gibs-api-docs/)
- **Owner / Organization:** NASA GIBS Team
- **Source Type:** Developer API Docs `[ENGINEERING_CHOICE]`
- **Key Points:** Layer identifiers, EPSG:3857 tile matrix sets, and time dimensions (`TIME=YYYY-MM-DD`).
- **FireChronicle Usage:** Map tile configuration in `docs/architecture.md`.

#### 34. Google Earth Engine Data Catalog
- **URL:** [https://developers.google.com/earth-engine/datasets/catalog](https://developers.google.com/earth-engine/datasets/catalog)
- **Owner / Organization:** Google / Earth Engine
- **Source Type:** Optional Cloud Processing Platform `[OPTIONAL_FEATURE]`
- **Key Points:** Scalable cloud raster processing; requires authenticated GEE account.
- **FireChronicle Usage:** Evaluated; excluded from core deployment to preserve zero-credential, lightweight, self-contained local deployment.

---

### Section 7: Optional Boundary and Context Data

#### 35. Natural Earth Administrative Boundaries
- **URL:** [https://www.naturalearthdata.com/downloads/](https://www.naturalearthdata.com/downloads/)
- **Owner / Organization:** Natural Earth (Public Domain)
- **Source Type:** Geographic Basemap Layer `[ENGINEERING_CHOICE]`
- **Key Points:** Public domain 1:110m and 1:50m country and state boundary vectors.
- **FireChronicle Usage:** Coordinates for preset regional bounding boxes (California, Pantanal, NSW Australia).

#### 36. geoBoundaries Global Administrative Boundaries
- **URL:** [https://www.geoboundaries.org/globalDownloads.html](https://www.geoboundaries.org/globalDownloads.html)
- **Owner / Organization:** William & Mary geoLab (CC-BY 4.0)
- **Source Type:** Sub-National Administrative Polygons `[OPTIONAL_FEATURE]`
- **Key Points:** High-precision ADM1 and ADM2 district boundaries.
- **FireChronicle Usage:** Documented as an optional sub-national polygon query source.

#### 37. NASA MODIS Land Cover (MCD12Q1)
- **URL:** [https://modis-land.gsfc.nasa.gov/landcover.html](https://modis-land.gsfc.nasa.gov/landcover.html)
- **Owner / Organization:** NASA GSFC / Boston University
- **Source Type:** Auxiliary Environmental Dataset `[OPTIONAL_FEATURE]`
- **Key Points:** 500 m yearly global land cover classification (IGBP).
- **FireChronicle Usage:** Contextual guidance; explicitly noted that land cover type does not confirm fire ignition source.

#### 38. NASA Global Precipitation Measurement (GPM) IMERG
- **URL:** [https://gpm.nasa.gov/data/imerg](https://gpm.nasa.gov/data/imerg)
- **Owner / Organization:** NASA Goddard / GPM Mission
- **Source Type:** Precipitation Radar/Radiometer Dataset `[OPTIONAL_FEATURE]`
- **Key Points:** Half-hourly and daily multi-satellite precipitation estimates.
- **FireChronicle Usage:** Optional rainfall context; excluded from MVP to prevent scope bloat.

---

### Section 8: Geospatial & Data-Processing Libraries

#### 39. Python 3.11 Documentation
- **URL:** [https://docs.python.org/3.11/](https://docs.python.org/3.11/)
- **Owner / Organization:** Python Software Foundation
- **Source Type:** Core Language Specification `[ENGINEERING_CHOICE]`
- **Key Points:** Chosen runtime for reliable binary wheel compatibility with Windows geospatial packages.
- **FireChronicle Usage:** System Python runtime in `.venv` (`Python 3.11.9`).

#### 40. pandas Documentation
- **URL:** [https://pandas.pydata.org/docs/](https://pandas.pydata.org/docs/)
- **Owner / Organization:** PyData / NumFOCUS
- **Source Type:** Tabular Data Library `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Ingestion chunking, schema mapping, and dataframe cleaning.

#### 41. NumPy Documentation
- **URL:** [https://numpy.org/doc/stable/](https://numpy.org/doc/stable/)
- **Owner / Organization:** NumPy Developers
- **Source Type:** Numerical Computing Engine `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Fast array-based quantile calculation and trigonometric seasonal encoding.

#### 42. GeoPandas Documentation
- **URL:** [https://geopandas.org/en/stable/](https://geopandas.org/en/stable/)
- **Owner / Organization:** GeoPandas Developers
- **Source Type:** Geospatial Analysis Library `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Spatial point operations and spatial index construction.

#### 43. Shapely Documentation
- **URL:** [https://shapely.readthedocs.io/en/stable/](https://shapely.readthedocs.io/en/stable/)
- **Owner / Organization:** Shapely Developers
- **Source Type:** Geometric Manipulation Library `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Planar geometry, polygon intersection, and point buffering.

#### 44. pyproj Documentation
- **URL:** [https://pyproj4.github.io/pyproj/stable/](https://pyproj4.github.io/pyproj/stable/)
- **Owner / Organization:** PROJ / pyproj Developers
- **Source Type:** Cartographic Projections Library `[SCIENTIFIC_CONSTRAINT]`
- **Constraint Rule:** Physical distances must never be computed from raw degree differences ($\Delta \text{deg}$).
- **FireChronicle Usage:** Geodetic distance calculations and equal-area projected coordinates (EPSG:6933).

#### 45. DuckDB Documentation
- **URL:** [https://duckdb.org/docs/stable/](https://duckdb.org/docs/stable/)
- **Owner / Organization:** DuckDB Foundation
- **Source Type:** In-Process Vectorized Analytical Database `[ENGINEERING_CHOICE]`
- **Key Points:** Columnar execution engine querying Parquet and memory directly without RAM bloat.
- **FireChronicle Usage:** Core storage and query engine in `backend/app/services/storage.py` with memory capped at 1GB (`SET max_memory = '1GB'`).

#### 46. DuckDB Spatial Extension
- **URL:** [https://duckdb.org/docs/stable/core_extensions/spatial/overview](https://duckdb.org/docs/stable/core_extensions/spatial/overview)
- **Owner / Organization:** DuckDB Foundation
- **Source Type:** Spatial Database Extension `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** High-performance SQL geospatial querying over Parquet partitions.

#### 47. Apache Arrow / PyArrow Documentation
- **URL:** [https://arrow.apache.org/docs/python/](https://arrow.apache.org/docs/python/)
- **Owner / Organization:** Apache Software Foundation
- **Source Type:** Columnar Memory Specification `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Zero-copy tabular memory exchange between DuckDB and pandas.

#### 48. PyArrow Parquet Guide
- **URL:** [https://arrow.apache.org/docs/python/parquet.html](https://arrow.apache.org/docs/python/parquet.html)
- **Owner / Organization:** Apache Software Foundation
- **Source Type:** Columnar Storage Documentation `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Serialization of harmonized records to `data/processed/harmonized_observations.parquet`.

#### 49. Requests (Python HTTP Client)
- **URL:** [https://requests.readthedocs.io/en/latest/](https://requests.readthedocs.io/en/latest/)
- **Owner / Organization:** Kenneth Reitz / Requests
- **Source Type:** HTTP Networking Library `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Synchronous HTTP reference; implemented asynchronously via `httpx`.

#### 50. Pydantic Documentation
- **URL:** [https://docs.pydantic.dev/latest/](https://docs.pydantic.dev/latest/)
- **Owner / Organization:** Pydantic / Samuel Colvin
- **Source Type:** Data Validation Engine `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Request/response schemas, type coercion, and boundary validation in `backend/app/schemas/`.

---

### Section 9: Backend / API References

#### 51. FastAPI Tutorial
- **URL:** [https://fastapi.tiangolo.com/tutorial/](https://fastapi.tiangolo.com/tutorial/)
- **Owner / Organization:** Sebastián Ramírez / FastAPI
- **Source Type:** Web Framework Documentation `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** REST API routing, query parameter validation, and automatic OpenAPI interactive documentation.

#### 52. FastAPI Deployment Concepts
- **URL:** [https://fastapi.tiangolo.com/deployment/](https://fastapi.tiangolo.com/deployment/)
- **Owner / Organization:** FastAPI
- **Source Type:** Deployment Architecture Guide `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Production ASGI process management and health endpoints.

#### 53. Uvicorn Documentation
- **URL:** [https://www.uvicorn.org/](https://www.uvicorn.org/)
- **Owner / Organization:** Encode / Uvicorn
- **Source Type:** ASGI Server `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** High-speed server running FastAPI on `127.0.0.1:8000`.

#### 54. Python Dotenv Documentation
- **URL:** [https://saurabh-kumar.com/python-dotenv/](https://saurabh-kumar.com/python-dotenv/)
- **Owner / Organization:** Saurabh Kumar
- **Source Type:** Secrets Management Library `[ENGINEERING_CHOICE]`
- **Security Rule:** Prevents accidental secret check-ins; loads `.env` exclusively into server memory.
- **FireChronicle Usage:** Configured via `pydantic-settings` in `config.py`.

---

### Section 10: Frontend Stack — Official References

#### 55. Next.js App Router Documentation
- **URL:** [https://nextjs.org/docs/app](https://nextjs.org/docs/app)
- **Owner / Organization:** Vercel / Next.js
- **Source Type:** Frontend Framework Documentation `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** App Router page structure (`src/app/layout.tsx`, `src/app/page.tsx`).

#### 56. Next.js Installation Guide
- **URL:** [https://nextjs.org/docs/app/getting-started/installation](https://nextjs.org/docs/app/getting-started/installation)
- **Owner / Organization:** Vercel
- **Source Type:** Framework Setup Guide `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Node.js version verification (`Node v24.18.0` / `npm 11.16.0`).

#### 57. React Documentation
- **URL:** [https://react.dev/learn](https://react.dev/learn)
- **Owner / Organization:** Meta / React
- **Source Type:** UI Library Documentation `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Reactive state hooks (`useState`, `useEffect`, `useRef`).

#### 58. TypeScript Handbook
- **URL:** [https://www.typescriptlang.org/docs/handbook/intro.html](https://www.typescriptlang.org/docs/handbook/intro.html)
- **Owner / Organization:** Microsoft
- **Source Type:** Language Specification `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Strong typing in `frontend/src/types/index.ts` synchronized with backend Pydantic models.

#### 59. Tailwind CSS with Next.js
- **URL:** [https://tailwindcss.com/docs/installation/framework-guides/nextjs](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- **Owner / Organization:** Tailwind Labs
- **Source Type:** Styling Framework `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Scientific dark theme (`#0B132B`, `#1C2541`, `#F77F00`, `#48CAE4`).

#### 60. MapLibre GL JS Documentation
- **URL:** [https://maplibre.org/maplibre-gl-js/docs/](https://maplibre.org/maplibre-gl-js/docs/)
- **Owner / Organization:** MapLibre Community
- **Source Type:** WebGL Interactive Map Library `[ENGINEERING_CHOICE]`
- **Engineering Rule:** Must be imported dynamically with `{ ssr: false }` to avoid SSR `window is not defined` crash.
- **FireChronicle Usage:** High-performance WebGL circle layers for MODIS 1000m and VIIRS 375m in `HotspotMap.tsx`.

#### 61. Leaflet Quick Start
- **URL:** [https://leafletjs.com/examples/quick-start/](https://leafletjs.com/examples/quick-start/)
- **Owner / Organization:** Leaflet / Vladimir Agafonkin
- **Source Type:** Alternative Mapping Library `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Evaluated; MapLibre GL JS selected for GPU-accelerated rendering of 10,000+ points without DOM degradation.

#### 62. Recharts Documentation
- **URL:** [https://recharts.org/en-US/guide](https://recharts.org/en-US/guide)
- **Owner / Organization:** Recharts Community
- **Source Type:** React SVG Charting Library `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Bar charts and sensitivity curves in `BurningActivityCalendar.tsx` and `SensorDiscontinuityInspector.tsx`.

#### 63. Plotly.js Documentation
- **URL:** [https://plotly.com/javascript/](https://plotly.com/javascript/)
- **Owner / Organization:** Plotly
- **Source Type:** Alternative Charting Library `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Evaluated; Recharts selected to maintain lightweight bundle size.

#### 64. Lucide React Icons
- **URL:** [https://lucide.dev/guide/packages/lucide-react](https://lucide.dev/guide/packages/lucide-react)
- **Owner / Organization:** Lucide Community
- **Source Type:** Iconography Library `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Accessible icons in `Header.tsx`, `Controls.tsx`, and `MethodologyProvenance.tsx`.

#### 65. OpenStreetMap Tile Usage Policy
- **URL:** [https://operations.osmfoundation.org/policies/tiles/](https://operations.osmfoundation.org/policies/tiles/)
- **Owner / Organization:** OpenStreetMap Foundation
- **Source Type:** Basemap Tile Policy `[SCIENTIFIC_CONSTRAINT]`
- **Policy Compliance:** Mandatory attribution (`&copy; OpenStreetMap &copy; CARTO`) and caching compliance.
- **FireChronicle Usage:** Carto Dark raster basemap with compliant attribution headers in `HotspotMap.tsx`.

---

### Section 11: Statistical Anomaly Detection & Modeling

#### 66. scikit-learn User Guide
- **URL:** [https://scikit-learn.org/stable/user_guide.html](https://scikit-learn.org/stable/user_guide.html)
- **Owner / Organization:** scikit-learn Developers
- **Source Type:** Machine Learning Library Documentation `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Technical reference for robust regression and outlier isolation.

#### 67. Isolation Forest API
- **URL:** [https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
- **Owner / Organization:** scikit-learn
- **Source Type:** Unsupervised Anomaly Detection `[OPTIONAL_FEATURE]`
- **Scientific Limitation:** Unsupervised outlier detector on multi-dimensional aggregates; **not** a wildfire ignition predictor.
- **FireChronicle Usage:** Governed under `docs/model_card.md`.

#### 68. Time-Series Forecasting Guide in Statsmodels
- **URL:** [https://www.statsmodels.org/stable/tsa.html](https://www.statsmodels.org/stable/tsa.html)
- **Owner / Organization:** statsmodels Developers
- **Source Type:** Statistical Time-Series Modeling `[SCIENTIFIC_CONSTRAINT]`
- **Key Points:** Non-parametric robust seasonal decomposition.
- **FireChronicle Usage:** Foundation for Median + MAD seasonal baseline in `backend/app/analytics/seasonal.py`.

---

### Section 12: Testing, Quality, Security & Deployment

#### 69. pytest Documentation
- **URL:** [https://docs.pytest.org/en/stable/](https://docs.pytest.org/en/stable/)
- **Owner / Organization:** pytest Developers
- **Source Type:** Automated Test Framework `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** 17 automated tests executed and verified in `backend/tests/`.

#### 70. HTTPX Documentation
- **URL:** [https://www.python-httpx.org/](https://www.python-httpx.org/)
- **Owner / Organization:** Encode / Tom Christie
- **Source Type:** Asynchronous HTTP Client `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Asynchronous API querying and integration test client.

#### 71. Git Documentation
- **URL:** [https://git-scm.com/doc](https://git-scm.com/doc)
- **Owner / Organization:** Git Community
- **Source Type:** Version Control Authority `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Clean commit history with protected `.gitignore`.

#### 72. GitHub Actions
- **URL:** [https://docs.github.com/actions](https://docs.github.com/actions)
- **Owner / Organization:** GitHub
- **Source Type:** CI/CD Automation `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Continuous testing configuration.

#### 73. OWASP Secrets Management Cheat Sheet
- **URL:** [https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- **Owner / Organization:** OWASP Foundation
- **Source Type:** Security Standard `[SCIENTIFIC_CONSTRAINT]`
- **Mandate:** Zero API keys committed to Git or exposed in client bundles.
- **FireChronicle Usage:** `.env*` exclusion verified via `git check-ignore`.

#### 74. OWASP Logging Cheat Sheet
- **URL:** [https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- **Owner / Organization:** OWASP Foundation
- **Source Type:** Security Standard `[SCIENTIFIC_CONSTRAINT]`
- **Mandate:** Redact tokens and credentials from console and network logs.
- **FireChronicle Usage:** Implemented in `firms_client.py` and `routes.py`.

#### 75. Next.js Deployment Documentation
- **URL:** [https://nextjs.org/docs/app/getting-started/deploying](https://nextjs.org/docs/app/getting-started/deploying)
- **Owner / Organization:** Vercel
- **Source Type:** Production Deployment Guide `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Production build validation (`next build`).

#### 76. Vercel Documentation
- **URL:** [https://vercel.com/docs](https://vercel.com/docs)
- **Owner / Organization:** Vercel
- **Source Type:** Cloud Hosting Platform `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Optional target host for Next.js frontend client.

#### 77. Render Documentation
- **URL:** [https://render.com/docs](https://render.com/docs)
- **Owner / Organization:** Render
- **Source Type:** Cloud Hosting Platform `[ENGINEERING_CHOICE]`
- **FireChronicle Usage:** Optional target host for Python FastAPI backend.

---

## 🔬 Authoritative Answers to Critical Science Questions

The following scientific questions (from Section 5 of the Resource Pack) govern every calculation performed by FireChronicle:

### 1. What exact products/collections are being compared?
- **MODIS:** Collection 6.1 Standard Processing (`MODIS_SP`), representing level-2 thermal anomalies swath records from Terra (descending morning overpass ~10:30 local solar time) and Aqua (ascending afternoon overpass ~13:30 local solar time).
- **VIIRS 375 m:** Collection 1/2 Standard Processing (`VIIRS_SNPP_SP` for Suomi-NPP, `VIIRS_NOAA20_SP` for NOAA-20 / JPSS-1, and `VIIRS_NOAA21_SP` for NOAA-21 / JPSS-2).

### 2. Are the records standard or NRT?
- The primary analytical pipeline processes **Standard Processing (`SP`) science-quality products**.
- If near-real-time records are ingested, they are tagged with `processing_status = 'NRT'` and strictly partitioned; NRT and SP records are **never silently mixed** into a single historical trend.

### 3. Are coordinates centres of detections or polygon footprints?
- FIRMS point coordinates (`latitude`, `longitude`) represent the **nadir-projected center of the detector pixel**.
- Nominal spatial footprints are:
  - MODIS: 1000 m × 1000 m at nadir, widening up to 2.0 km × 4.8 km at scan edges.
  - VIIRS 375 m: 375 m × 375 m at nadir, constrained to ~750 m at scan edges due to onboard 3-pixel aggregation.

### 4. Which fields differ by source and what do their values mean?
- **Confidence:**
  - MODIS provides a continuous integer percentage (0% to 100%).
  - VIIRS 375 m provides a categorical string (`'low'`, `'nominal'`, `'high'`).
  - *FireChronicle preserves original values* while mapping them into standardized comparison bins (`low <30%`, `nominal 30–80%`, `high >80%`).
- **Brightness Temperatures:**
  - MODIS: Channel 21/22 (4 µm) and Channel 31 (11 µm) in Kelvin.
  - VIIRS: I-band 4 (3.74 µm) and I-band 5 (11.45 µm) in Kelvin.

### 5. What time tolerance is being used for candidate matches, and why?
- Default temporal tolerance is **$\Delta t_{max} = 60\text{ minutes}$**.
- *Scientific Rationale:* Aqua (MODIS) and Suomi-NPP / NOAA-20 (VIIRS) operate in sun-synchronous afternoon orbits with nominal equatorial crossing times around 13:30 local solar time. NOAA-20 trails Suomi-NPP by ~50 minutes. A 60-minute window captures collocated afternoon overpasses while excluding morning Terra passes (10:30 local time), which observe completely different diurnal fire phases.

### 6. How does the match count change when thresholds/grid sizes change?
- As demonstrated in `docs/validation_report.md`:
  - At $d = 500\text{ m}$: 61.5% of MODIS detections match.
  - At $d = 1000\text{ m}$ (nominal nadir footprint): **84.6% match**.
  - At $d = 2000\text{ m}$: 100.0% match (captures peripheral limb distortion).

### 7. What does the burning-activity calendar count?
The calendar provides two distinct metrics with explicit toggles:
1. `raw_detection_count`: Raw satellite point detections, displayed per sensor.
2. `unique_active_cells` (Primary Harmonized Metric): Number of distinct equal-area 1.0 km grid cells containing at least one thermal anomaly during that day. This metric is **resolution-insensitive**, eliminating the 3×–10× point count inflation caused by VIIRS's finer sub-kilometer grid.

### 8. What does the output NOT claim to measure?
- Does **not** measure certified ground wildfire perimeters.
- Does **not** predict fire ignition, flame spread rate, or future wildfire probability.
- Does **not** measure post-fire burned area (which requires optical surface reflectance burn scars).

### 9. How is FRP handled without double-counting matched observations?
- Based on Li et al. (2018), collocated detections of the same physical fire across sensors **are never summed together**.
- The pipeline reports source-specific FRP distributions (`mean_frp_modis` and `mean_frp_viirs`) independently. When harmonized cell-level FRP is computed, it evaluates peak intensity or preserves sensor-specific medians, preventing artificial energy duplication.
