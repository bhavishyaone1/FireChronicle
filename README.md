# FireChronicle 🔥🛰️

> **NASA International Space Apps Challenge 2026**  
> **Challenge:** [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/)  
> **Primary Data Source:** [NASA FIRMS (Fire Information for Resource Management System)](https://firms.modaps.eosdis.nasa.gov/)  
> **Operating Mode:** `PRE_HACKATHON_PREPARATION` (System Date: October 25, 2026)

---

## 🛰️ Executive Overview

Over the past two decades, NASA Earth observation satellites have tracked active fires across the globe. However, historical records are split across two core sensor families:
1. **MODIS** (~1 km footprint, Terra & Aqua satellites, 2000–present)
2. **VIIRS** (375 m / 750 m footprints, Suomi-NPP, NOAA-20, NOAA-21, 2012–present)

Due to differences in pixel footprint, detection sensitivity, overpass timing, scan geometry, and confidence metrics, raw hotspot point counts or raw Fire Radiative Power (FRP) cannot simply be concatenated into a single time series without introducing artificial jumps.

**FireChronicle** is a deployable, scientifically honest web application designed to turn heterogeneous MODIS and VIIRS thermal hotspot observations into an interpretable, harmonized **burning-activity calendar**.

---

## ⚖️ Operating Mode & Fair Play Declaration

### Current Status: `PRE_HACKATHON_PREPARATION`

Under the rules of the NASA International Space Apps Challenge:
- Full challenge statements and resources are released on **October 28, 2026**.
- The official hackathon development window takes place on **November 14–15, 2026**.
- **No project solution code, processed project datasets, trained project models, or submission deliverables may be created prior to the official event start.**

### Allowed Preparation Actions (Completed)
- ✅ System and hardware inspection (Windows 11, AMD64, 8 GB RAM, 49 GB disk).
- ✅ Development toolchain verification (Python 3.11 venv, Node v24, npm 11.16, Git 2.55).
- ✅ Deep review of NASA FIRMS, MODIS, and VIIRS technical specifications and user guides.
- ✅ Scientific harmonization methodology formulation ([`docs/methodology.md`](docs/methodology.md)).
- ✅ System architecture and REST API specification ([`docs/architecture.md`](docs/architecture.md)).
- ✅ Data sources register and field mappings ([`docs/data_sources.md`](docs/data_sources.md)).
- ✅ Environment configuration and secret safety templates ([`.env.example`](.env.example), [`.gitignore`](.gitignore)).
- ✅ Model card and ethical boundaries documentation ([`docs/model_card.md`](docs/model_card.md)).

### Prohibited Until Event Start (November 14, 2026)
- ❌ Developing the FireChronicle production application code.
- ❌ Fetching or preprocessing historical datasets for the submission.
- ❌ Precomputing harmonization results or training machine learning models.
- ❌ Creating submission deliverables or video recordings.

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

## 📅 Event-Day Execution Playbook (November 14–15, 2026)

When the hackathon officially opens:
1. **Switch Mode:** Change `MODE` to `HACKATHON_BUILD` in project metadata.
2. **Milestone A (Challenge Audit):** Review the October 28 final challenge statement and updated resource links.
3. **Milestone B (Bounded Real Data):** Ingest 30-day overlapping MODIS/VIIRS data slices for target test regions (e.g. California, Pantanal, or NSW Australia) via FIRMS API into `data/raw/`.
4. **Milestone C (Harmonization Pipeline):** Implement the 11-stage pipeline (ingest, schema normalize, spatial grid assign, candidate match, classification, calendar aggregate).
5. **Milestone D (Full-Stack UI):** Launch FastAPI backend endpoints and Next.js frontend (Interactive Map, Activity Calendar, Sensor Comparison, and Provenance Explorer).
6. **Milestone E (Validation & Polish):** Execute automated test suite, verify holdout metrics, record demo walkthrough, and finalize submission documentation.

---

## 📚 Documentation Index

- [`docs/official_challenge_requirements.md`](docs/official_challenge_requirements.md) — Challenge brief, compliance checklist, and judging alignment.
- [`docs/data_sources.md`](docs/data_sources.md) — Comprehensive register of NASA FIRMS, MODIS, and VIIRS products.
- [`docs/methodology.md`](docs/methodology.md) — Detailed 11-stage scientific harmonization pipeline and equations.
- [`docs/architecture.md`](docs/architecture.md) — System architecture, REST API specification, and component diagrams.
- [`docs/environment.md`](docs/environment.md) — Hardware specs, detected toolchains, and verification commands.
- [`docs/model_card.md`](docs/model_card.md) — Statistical baseline specifications and ML governance boundaries.

---

## 📜 Attribution & License

- **Data Attribution:** We acknowledge the use of data and imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://firms.modaps.eosdis.nasa.gov/), part of the NASA Earth Observing System Data and Information System (EOSDIS).
- **License:** Open Source under the [MIT License](LICENSE).
