# FireChronicle 🔥🛰️

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Challenge-blue.svg)](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/)
[![Tests](https://img.shields.io/badge/Tests-74%2F74%20Passing%20(100%25)-success.svg)](backend/tests/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20(React%2018)-black.svg)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![NASA FIRMS](https://img.shields.io/badge/NASA%20FIRMS-Active%20Telemetry-orange.svg)](https://firms.modaps.eosdis.nasa.gov/)

> **NASA International Space Apps Challenge 2026**  
> **Challenge:** [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/)  
> **Primary Data Source:** [NASA FIRMS (Fire Information for Resource Management System)](https://firms.modaps.eosdis.nasa.gov/)  
> **Operating Mode:** `HACKATHON_BUILD` (Verified & Production Deployed)

---

## 🚀 Live Deployments & Submission Links

| Component | Production URL | Platform | Status |
| :--- | :--- | :--- | :---: |
| **Interactive Dashboard (Web App)** | [https://fire-chronicle.vercel.app/](https://fire-chronicle.vercel.app/) | Vercel Edge Global CDN | **Online (200 OK)** |
| **Analytical Telemetry Engine (API)** | [https://firechronicle.onrender.com/](https://firechronicle.onrender.com/) | Render Cloud Container | **Online (200 OK)** |
| **Interactive API Documentation (Swagger)** | [https://firechronicle.onrender.com/docs](https://firechronicle.onrender.com/docs) | OpenAPI 3.0 / Swagger UI | **Online (200 OK)** |
| **GitHub Source Code Repository** | [https://github.com/bhavishyaone1/FireChronicle](https://github.com/bhavishyaone1/FireChronicle) | GitHub Public Repository | **Active (Master)** |

---

## 🛰️ Executive Overview & Problem Statement

Over the past two decades, NASA Earth observation satellites have tracked active thermal anomalies across the globe. However, historical records are split across two core sensor families with fundamentally different spatial resolutions and orbital designs:

1. **MODIS** (~1 km footprint, Terra [morning] & Aqua [afternoon] satellites, 2000–present; planned decommissioning in 2027)
2. **VIIRS** (375 m / 750 m footprints, NOAA-20 & NOAA-21 active; Suomi-NPP operational data ended on Nov 02, 2026, archive only)

### The Satellite Discontinuity Crisis
Because VIIRS operates at a 375 m pixel pitch compared to MODIS's 1,000 m pixel pitch, **VIIRS produces between 7× and 23× more raw detections for the exact same thermal front**. Simply concatenating raw MODIS and VIIRS detections creates artificial "surges" in fire frequency that distort climate records, public policy, and emergency response. Furthermore, with **Suomi-NPP FIRMS ingestion stopping on Nov 02, 2026** and **Terra/Aqua planned for decommissioning in 2027**, cross-sensor harmonization is urgent.

### The FireChronicle Solution
**FireChronicle** resolves this discontinuity through an **11-stage scientific harmonization engine**:
- **1 km Equal-Area Cylindrical Binning:** Projects all observations into equal-area cylindrical cells (`unique_active_cells`), neutralizing the **19.2% point density inflation** caused by VIIRS sub-pixel clustering.
- **Bipartite Cross-Sensor Matching:** Implements both Greedy Spatio-Temporal and Global Hungarian Assignment matching algorithms within spatial footprints ($1{,}000\text{ m}$) and temporal windows ($60\text{ min}$).
- **20-Year Burning Activity Calendar:** Delivers an unbroken, resolution-invariant calendar of daily burning activity with bootstrap 95% confidence intervals and dual-channel Kelvin radiometry.
- **Honest Thermal Anomaly Attribution:** Distinguishes *Standard Reported FIRMS Classes* from *NRT Inferred Context Classes* (e.g. static industrial flaring, agricultural residues, volcanic activity), ensuring satellite observations are never misleadingly classified as "confirmed wildfires" without ground truth.

---

## 💡 The 3 Core Pillars (USPs)

```
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│     1. DISCONTINUITY PROBLEM          │   │      2. EQUAL-AREA ENGINE (USP)       │   │     3. BURNING ACTIVITY CALENDAR      │
│ MODIS (1 km) vs VIIRS (375 m) cannot  │──>│ 1 km Equal-Area Cylindrical Binning   │──>│ Unbroken 20-year activity calendar,   │
│ be directly merged. VIIRS creates 7×  │   │ measures "unique_active_cells"        │   │ dual-channel Kelvin brightness, and   │
│ to 23× more raw points per fire,      │   │ eliminating the 19.2% density         │   │ honest attribution separating FIRMS   │
│ simulating artificial fire surges.    │   │ inflation across sensor transitions.  │   │ reported types from inferred context. │
└───────────────────────────────────────┘   └───────────────────────────────────────┘   └───────────────────────────────────────┘
```

---

## 🛰️ Satellite Constellation Status (Verified Nov 02, 2026)

| Platform | Sensor & Resolution | Overpass Schedule | Status (FIRMS Verified) | Observation Handling |
| :--- | :--- | :--- | :---: | :--- |
| **Suomi NPP** | VIIRS 375m (I-band) / 750m (M-band) | ~13:30 & ~01:30 local solar time | **Ended (Archive)** | Data ingestion ended 2026-11-02; historical baseline only. |
| **NOAA-20 (JPSS-1)** | VIIRS 375m (I-band) / 750m (M-band) | ~13:30 & ~01:30 (~50 min offset from S-NPP) | **Active** | Primary afternoon VIIRS operational feed. |
| **NOAA-21 (JPSS-2)** | VIIRS 375m (I-band) / 750m (M-band) | ~13:30 & ~01:30 local solar time | **Active** | Secondary afternoon VIIRS operational feed. |
| **Terra** | MODIS 1.0 km nadir nominal | ~10:30 & ~22:30 (orbital drift since 2020) | **Active (Drifting)** | Morning overpass only; planned decommissioning ~Jan 2027. |
| **Aqua** | MODIS 1.0 km nadir nominal | ~13:30 & ~01:30 afternoon orbit | **Active** | Afternoon overpass; planned decommissioning ~Sep 2027. |

---

## 🏗️ System Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │      NASA FIRMS / MODIS & VIIRS Telemetry     │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                    (Canonical Shapefiles & Real-time Feeds)
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │   DuckDB High-Performance Analytical Engine  │
                                  │      - 1.13M Canonical Records Ingested      │
                                  │      - Spatial & Temporal Bounding Indices   │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │     11-Stage Harmonization Pipeline          │
                                  │  ├── Stage 1-3: Normalization & IST Convert  │
                                  │  ├── Stage 4-6: Bipartite Cross-Sensor Match │
                                  │  ├── Stage 7-8: Equal-Area 1 km Binning      │
                                  │  └── Stage 9-11: Attribution & Uncertainty   │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │     FastAPI REST Cloud Engine (Render)       │
                                  │   /api/health • /api/observations • /api/cal │
                                  │   /api/compare • /api/anomalies • /api/export│
                                  └──────────────────────┬───────────────────────┘
                                                         │ (HTTPS Proxy Rewrites)
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │     Next.js 14 Production Frontend (Vercel)  │
                                  │  ├── Interactive Map (ArcGIS Satellite Base) │
                                  │  ├── 36px Collapsible Constellation Status   │
                                  │  ├── Monthly Burning Activity Calendar       │
                                  │  ├── Observation Details (Kelvin Radiometry) │
                                  │  └── Harmonization Audit & Ledger Exports    │
                                  └──────────────────────────────────────────────┘
```

---

## 🔬 Core Scientific Principles & Safeguards

1. **Hotspots ≠ Confirmed Wildfires:** Satellite thermal anomalies represent detected thermal radiation. Sources include vegetation fires, agricultural burns, gas flares, and volcanoes. Detections are never labeled confirmed wildfires without independent ground incident verification.
2. **Absence of Detection ≠ Absence of Fire:** Cloud cover, dense smoke, and orbital gaps between satellite overpasses limit visibility. "Zero detections" must be distinguished from "no observation".
3. **No Blind FRP Summation:** When MODIS and VIIRS observe collocated fire activity during overlapping overpasses, their Fire Radiative Power (MW) values must **never** be summed together.
4. **Resolution-Insensitive Metrics:** The central calendar displays `unique_active_cells` (on an equal-area grid) alongside per-sensor raw counts, removing the artificial point-count inflation caused by VIIRS's finer 375 m pixel grid.
5. **Zero Secrets in Code:** NASA FIRMS API keys are restricted to server-side environments and never exposed to client browsers or version control.

---

## 🧪 Automated Verification & Test Results

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.7.0
rootdir: C:\Users\bhavishya\Downloads\PROJECTS\Nasa
configfile: pyproject.toml

backend/tests/test_aggregator.py ......................... PASSED [ 2%]
backend/tests/test_api.py ................................ PASSED [20%]
backend/tests/test_context_rules.py ...................... PASSED [29%]
backend/tests/test_equal_area.py ......................... PASSED [33%]
backend/tests/test_event_grouping.py ..................... PASSED [35%]
backend/tests/test_export_and_cessation.py ............... PASSED [40%]
backend/tests/test_fsi_bhuvan_ingestion.py ............... PASSED [45%]
backend/tests/test_india_boundary.py ..................... PASSED [54%]
backend/tests/test_matcher.py ............................ PASSED [60%]
backend/tests/test_matcher_algorithms.py ................. PASSED [63%]
backend/tests/test_missing_coverage.py ................... PASSED [67%]
backend/tests/test_normalizer.py ......................... PASSED [74%]
backend/tests/test_satellite_status_and_fire_types.py .... PASSED [82%]
backend/tests/test_synthetic_scenes.py ................... PASSED [90%]
backend/tests/test_timezones_ist.py ...................... PASSED [94%]
backend/tests/test_uncertainty.py ........................ PASSED [100%]

======================= 74 passed in 42.09s (100% Pass Rate) =======================
```

Next.js Production Build:
```
  ▲ Next.js 14.2.15
  ✓ Compiled successfully
  ✓ Linting and checking validity of types ... 0 errors, 0 warnings
  ✓ Generating static pages (4/4) ... Done
  ✓ Finalizing page optimization ... Done
```

---

## ⚡ 5-Command Local Quickstart

```powershell
# 1. Setup Python 3.11 virtual environment and install backend dependencies
py -3.11 -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt

# 2. Install frontend dependencies
cd frontend; npm install; cd ..

# 3. Start FastAPI backend (Port 8002)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8002

# 4. In a second terminal, launch Next.js frontend (Port 3000)
cd frontend; npm run dev

# 5. Run the full automated test suite (74 tests)
pytest backend/tests/ -v
```

Visit [`http://localhost:3000`](http://localhost:3000) to open FireChronicle locally.

---

## 📚 Master Documentation Index

All technical, mathematical, and governance documentation is consolidated in [**`docs/README.md`**](docs/README.md):
- [**`docs/methodology.md`**](docs/methodology.md) — 11-stage scientific harmonization pipeline and mathematical formulations.
- [**`docs/HARMONIZATION_METHOD.md`**](docs/HARMONIZATION_METHOD.md) — Equal-Area projection equations and bipartite assignment proofs.
- [**`docs/DATA_DICTIONARY.md`**](docs/DATA_DICTIONARY.md) — Canonical field definitions, SI units, and valid domains.
- [**`docs/LIMITATIONS.md`**](docs/LIMITATIONS.md) — Sensor physical constraints, orbital drift, and cloud obscuration.
- [**`docs/validation_report.md`**](docs/validation_report.md) — Empirical validation across biomes, bootstrap 95% CI, and sensitivity curves.
- [**`docs/model_card.md`**](docs/model_card.md) — Statistical governance, intended use, and baseline definitions.
- [**`docs/architecture.md`**](docs/architecture.md) — System architecture, proxy routing, and REST API endpoints.
- [**`docs/design-system.md`**](docs/design-system.md) — WCAG AA color tokens, typography, and dark mode standards.

---

## 📜 Attribution & License

- **Data Attribution:** We gratefully acknowledge the use of data and imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://firms.modaps.eosdis.nasa.gov/), part of the NASA Earth Observing System Data and Information System (EOSDIS).
- **License:** Open Source under the [MIT License](LICENSE).
