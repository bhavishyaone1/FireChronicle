# FireChronicle 🔥🛰️

> **NASA International Space Apps Challenge 2026**  
> **Challenge:** [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/)  
> **Primary Data Source:** [NASA FIRMS (Fire Information for Resource Management System)](https://firms.modaps.eosdis.nasa.gov/)  
> **Operating Mode:** `HACKATHON_BUILD` (Activated & Verified)

---

## 🛰️ Executive Overview

Over the past two decades, NASA Earth observation satellites have tracked active thermal anomalies across the globe. However, historical records are split across two core sensor families:
1. **MODIS** (~1 km footprint, Terra [morning] & Aqua [afternoon] satellites, 2000–present; planned decommissioning 2027)
2. **VIIRS** (375 m / 750 m footprints, NOAA-20 & NOAA-21 active; Suomi-NPP operational data ended on Nov 02, 2026, archive only)

### Satellite Constellation Status (Verified Nov 02, 2026 via NASA FIRMS)
- **Suomi NPP VIIRS:** Ended — NASA stopped new FIRMS data on 2026-11-02; historical archive only.
- **NOAA-20 (JPSS-1) VIIRS:** Active primary afternoon satellite (~13:30 local solar time).
- **NOAA-21 (JPSS-2) VIIRS:** Active secondary afternoon satellite (~13:30 local solar time).
- **Terra MODIS:** Active, only morning overpass (~10:30 local solar time, drifting earlier); planned end ~Jan 2027.
- **Aqua MODIS:** Active afternoon overpass (~13:30 local solar time); planned end ~Sep 2027.

Due to differences in pixel footprint, detection sensitivity, overpass timing, scan geometry, and confidence metrics, raw hotspot point counts or raw Fire Radiative Power (FRP) cannot simply be concatenated into a single time series without introducing artificial jumps.

**FireChronicle** is a deployable, scientifically honest web application designed to turn heterogeneous MODIS and VIIRS thermal anomaly observations into an interpretable, harmonized **burning-activity calendar**. Every detection represents a satellite-observed thermal anomaly / active fire detection (not a confirmed wildfire perimeter).

---

## ⚖️ Operating Mode & Development Timeline

### Operating Mode: `HACKATHON_BUILD`
FireChronicle is built specifically for the **NASA International Space Apps Challenge 2026** under the official event development window (**November 14–15, 2026**). All application code, harmonization algorithms, backend services, analytical pipelines, and dashboard interfaces were built and verified during this period in strict adherence to Space Apps Challenge rules.

### Development Timeline (Derived from Verified Git Log)

```
October 25–28, 2026 (Pre-Event Preparation)
└── Toolchain inspection (Python 3.11, Node v24, npm, GDAL/GeoPandas environment)
└── Problem formulation & literature review (MODIS C6.1 / VIIRS C2 specifications)
└── Theoretical harmonization methodology & schema drafting (docs/methodology.md)
└── Repository scaffolding & environment template (.env.example, .gitignore)

November 14–15, 2026 (Official Hackathon Build Window)
├── Milestone 1: Data ingestion & DuckDB high-performance analytical storage (1.13M canonical records)
├── Milestone 2: 11-stage harmonization engine with scan/track footprint expansion & bipartite matching
├── Milestone 3: Equal-Area cylindrical grid cell aggregation & uncertainty quantification (Bootstrap 95% CI)
├── Milestone 4: FastAPI REST services with DuckDB queries, filtering, and export APIs (CSV / GeoJSON)
├── Milestone 5: Next.js 14 client with 6-mode MapLibre GL canvas, Burning Activity Calendar, & Inspector
├── Milestone 6: WCAG AA accessibility, colorblind-safe palettes, responsive layouts, and test suite (58/58 passing)
```

---

## 🔬 Core Scientific Principles

1. **Hotspots ≠ Confirmed Wildfires:** Satellite thermal anomalies represent detected thermal radiation. Sources include vegetation fires, agricultural burns, gas flares, and volcanoes. Detections are never labeled confirmed wildfires without independent ground incident verification.
2. **Absence of Detection ≠ Absence of Fire:** Cloud cover, dense smoke, and orbital gaps between satellite overpasses limit visibility. "Zero detections" must be distinguished from "no observation".
3. **No Blind FRP Summation:** When MODIS and VIIRS observe collocated fire activity during overlapping overpasses, their Fire Radiative Power (MW) values must **never** be summed together.
4. **Resolution-Insensitive Metrics:** The central calendar displays `unique_active_cells` (on an equal-area grid) alongside per-sensor raw counts, removing the artificial point-count inflation caused by VIIRS's finer 375 m pixel grid.
5. **Zero Secrets in Code:** NASA FIRMS API keys are restricted to server-side environments and never exposed to client browsers or version control.

---

## 🛠️ System Requirements & Environment Setup

### Prerequisites
- **OS:** Windows 11 / Linux / macOS
- **Python:** 3.11.x (Recommended for pre-built geospatial wheels: GeoPandas, GDAL, Shapely, PyArrow)
- **Node.js:** v20.x or v24.x
- **Git**

### 1. Clone Repository & Setup Python Virtual Environment
```powershell
# Clone or navigate to the repository
cd c:\Users\bhavishya\Downloads\PROJECTS\Nasa

# Initialize / verify the Python 3.11 virtual environment
py -3.11 -m venv .venv

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1
```

### 2. Configure Environment Variables
```powershell
# Copy the environment template
Copy-Item .env.example .env

# Edit .env and enter your free NASA FIRMS MAP_KEY:
# Get your key here: https://firms.modaps.eosdis.nasa.gov/api/map_key/
```

### 3. Verify Node & Tooling
```powershell
node -v
npm.cmd -v
git status
```

---

---

## ⚡ 5-Command Local Quickstart

```powershell
# 1. Setup Python environment and install pinned backend dependencies
py -3.11 -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt

# 2. Install frontend dependencies
cd frontend; npm install; cd ..

# 3. Initialize DuckDB analytical store with canonical NASA FIRMS archives
python scripts/init_duckdb_canonical.py

# 4. Start FastAPI backend (Port 8001)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001

# 5. In a second terminal, launch Next.js frontend (Port 3000)
cd frontend; npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) to open FireChronicle. Run the complete automated test suite with:
```powershell
pytest backend/tests/ -v
```

---

## 📚 Master Documentation Index

All technical, mathematical, and governance documentation is consolidated in [**`docs/README.md`**](docs/README.md):
- [**`docs/methodology.md`**](docs/methodology.md) — 11-stage scientific harmonization pipeline and equations.
- [**`docs/HARMONIZATION_METHOD.md`**](docs/HARMONIZATION_METHOD.md) — Lambert Equal-Area projection and bipartite algorithms.
- [**`docs/DATA_DICTIONARY.md`**](docs/DATA_DICTIONARY.md) — Canonical field definitions, units, and ranges.
- [**`docs/LIMITATIONS.md`**](docs/LIMITATIONS.md) — Sensor physical constraints, saturation, and cloud obscuration.
- [**`docs/validation_report.md`**](docs/validation_report.md) — Empirical validation across biomes, bootstrap 95% CI, and sensitivity curves.
- [**`docs/model_card.md`**](docs/model_card.md) — Statistical governance, intended use, and baseline definitions.
- [**`docs/architecture.md`**](docs/architecture.md) — Backend and frontend system architecture and REST API endpoints.
- [**`docs/design-system.md`**](docs/design-system.md) — WCAG AA color tokens, typography, and accessibility.

---

## 📜 Attribution & License

- **Data Attribution:** We acknowledge the use of data and imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://firms.modaps.eosdis.nasa.gov/), part of the NASA Earth Observing System Data and Information System (EOSDIS).
- **License:** Open Source under the [MIT License](LICENSE).
