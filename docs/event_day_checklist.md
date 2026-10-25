# Event-Day Implementation Checklist

**System:** FireChronicle  
**Target Event:** NASA International Space Apps Challenge 2026 (November 14–15, 2026)  
**Execution Mode:** `HACKATHON_BUILD` (Activated only once the event opens)

---

## Pre-Flight Checklist (08:30 – 09:00, November 14, 2026)
- [ ] Confirm official start with local event lead and team members.
- [ ] Verify that NASA FIRMS `MAP_KEY` is present in local `.env` (or prepare local archive CSV fallback).
- [ ] Activate Python virtual environment: `.\.venv\Scripts\Activate.ps1`.
- [ ] Verify clean git status: `git status`.

---

## Milestone A: Challenge Statement Audit & Mode Transition (09:00 – 10:00)
- [ ] Review the finalized challenge statement and resources released on October 28, 2026 at [Space Apps Challenge Page](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/).
- [ ] Check for any newly introduced FIRMS API parameters or satellite platform releases (e.g., NOAA-21 operational status).
- [ ] Update `docs/official_challenge_requirements.md` with any revisions to judging criteria.
- [ ] Set `MODE = HACKATHON_BUILD` in project metadata and backend configuration.
- [ ] Commit audit log: `git commit -m "chore: activate HACKATHON_BUILD mode and record final challenge audit"`.

---

## Milestone B: Ingestion Pipeline & Bounded Real Data (10:00 – 12:30)
- [ ] Create `backend/requirements.txt` with pinned dependencies from `docs/dependency_manifest.md`.
- [ ] Install backend dependencies into `.venv`: `.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt`.
- [ ] Verify package installations with a fast import test.
- [ ] Implement `backend/app/services/firms_client.py`:
  - NASA FIRMS Area API client with bounded bounding boxes and 5-day chunks.
  - Data Availability API client.
  - Exponential backoff retry logic and safe error handling.
- [ ] Implement `backend/app/services/manifest.py` to record retrieval metadata and SHA-256 checksums.
- [ ] Ingest first bounded test slice (e.g. 30 days of overlapping MODIS and VIIRS detections over an active fire region such as California or Pantanal).
- [ ] Verify raw files exist in `data/raw/` and confirm they remain ignored by Git.

---

## Milestone C: Scientific Harmonization Engine & Unit Tests (12:30 – 16:00)
- [ ] Implement schema validation and normalization (`backend/app/services/normalizer.py`):
  - Parse MODIS (`MODIS_SP`) and VIIRS (`VIIRS_SNPP_SP`, `VIIRS_NOAA20_SP`).
  - Calculate deterministic SHA-256 `observation_id`.
  - Normalize timestamps to ISO 8601 UTC.
  - Standardize confidence categories (`low`, `nominal`, `high`) while preserving raw values.
- [ ] Implement candidate cross-sensor matching engine (`backend/app/services/matcher.py`):
  - Spatial KD-tree / distance index (configurable $d_{max}$, default 1000 m).
  - Temporal window filter (configurable $\Delta t_{max}$, default 60 min).
  - Label detections: `matched`, `MODIS_only`, `VIIRS_only`.
- [ ] Implement grid & calendar aggregation (`backend/app/services/aggregator.py`):
  - Calculate `raw_detection_count` per sensor.
  - Calculate `unique_active_cells` (harmonized resolution-insensitive metric).
  - Aggregate FRP distributions without double-counting collocated detections.
- [ ] Implement DuckDB Parquet storage layer (`backend/app/services/storage.py`).
- [ ] Create automated test suite (`backend/tests/`):
  - Schema mapping, timestamp parsing, coordinate boundary checking.
  - Positive/negative candidate matching cases.
  - Aggregation and FRP non-duplication tests.
- [ ] Run pytest: `.\.venv\Scripts\python.exe -m pytest backend/tests/ -v`.
- [ ] Commit scientific pipeline: `git commit -m "feat: core 11-stage harmonization pipeline and passing unit tests"`.

---

## Milestone D: Full-Stack Web Application (16:00 – 21:00)
- [ ] Implement FastAPI backend application (`backend/app/main.py` & `backend/app/api/`):
  - `GET /api/health`
  - `GET /api/metadata`
  - `GET /api/observations` (GeoJSON FeatureCollection with pagination)
  - `GET /api/calendar` (Daily & monthly harmonized burning activity)
  - `GET /api/compare` (Cross-sensor matching metrics & FRP distributions)
  - `GET /api/anomalies` (Robust seasonal median + MAD deviation score)
  - `POST /api/import` (Safe authorized CSV file import)
- [ ] Initialize Next.js frontend in `frontend/`:
  - Run `npm.cmd create next-app` or initialize with TypeScript and Tailwind CSS.
  - Install `maplibre-gl`, `@types/maplibre-gl`, `recharts`, `lucide-react`.
- [ ] Build core UI views:
  - **Interactive Map:** Separate layers for MODIS (1 km footprints), VIIRS (375 m footprints), Matched pairs, and Harmonized grid cells.
  - **Burning-Activity Calendar:** Interactive daily heatmap matrix across years with toggle between raw sensor counts and `unique_active_cells`.
  - **Sensor Discontinuity Inspector:** Side-by-side comparison chart showing why raw point counts diverge.
  - **Methodology & Provenance Panel:** Transparent display of processing dates, satellite platforms, confidence thresholds, and NASA citations.
- [ ] Test frontend production build: `npm.cmd run build`.
- [ ] Commit full-stack implementation: `git commit -m "feat: full-stack dashboard with interactive calendar and map"`.

---

## Milestone E: Validation, Polish & Final Submission (November 15, 09:00 – 15:00)
- [ ] Run end-to-end integration test with real NASA data.
- [ ] Generate empirical validation report (`docs/validation_report.md`):
  - Record actual spatial agreement (Jaccard index on active cells).
  - Report matched fraction percentage and sensitivity across distance thresholds (500m to 2000m).
  - Evaluate FRP distributions before and after collocated filtering.
- [ ] Perform security and secrets audit:
  - Verify `.env` is absent from git history (`git log -S "MAP_KEY"`).
  - Confirm API key never appears in client browser network payload.
- [ ] Record 2–3 minute video demonstration following the documented demo narrative.
- [ ] Capture 4 high-resolution backup screenshots of key views.
- [ ] Finalize Space Apps submission form with project description, NASA data citations, and GitHub repository URL.
- [ ] Final commit & tag: `git tag -a v1.0.0-submission -m "Final NASA Space Apps 2026 Submission"`.
