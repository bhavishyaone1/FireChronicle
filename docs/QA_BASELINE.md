# FireChronicle — QA Baseline Audit Report

**Date:** 2026-10-26  
**Auditor:** Lead QA Engineer & Release Engineer  
**Branch:** `master`  
**Commit:** `d853cce`  
**Repository Working Tree:** Clean (all prior changes committed)

---

## 1. System Environment & Runtime Architecture

- **Operating System:** Windows 10/11
- **Python Runtime:** Python 3.11.9 (`.venv/Scripts/python.exe`)
- **Node.js Runtime:** Node.js v20.x, npm 10.x
- **Backend Framework:** FastAPI 0.115.0 + DuckDB 1.1.1 + Uvicorn 0.31.0
- **Frontend Framework:** Next.js 14.2.15 (App Router, static SSG + client dynamic hydration)
- **UI & State:** React 18.3.1, Tailwind CSS 3.4.13, MapLibre GL 4.7.1, Recharts 2.13.0, Motion for React (`motion` ^14.6.0), Lucide React 0.451.0
- **Design Guidance Skill:** UI/UX Pro Max (`.agents/skills/`)
- **Port Allocations:**
  - FastAPI: `http://127.0.0.1:8000`
  - Next.js: `http://localhost:3000`

---

## 2. Baseline Test & Build Status (Pre-Change)

| Test Suite / Build Target | Command | Result | Details |
|---|---|:---:|---|
| **Backend Unit & Integration** | `pytest backend/tests/ -v` | **27 PASSED** (0 failed) | 1.70s execution time, 1 Starlette deprecation warning |
| **Frontend TypeScript** | `npx tsc --noEmit` | **0 ERRORS** | Strict type-checking passed with exit code 0 |
| **Frontend Build** | `npm run build` | **PASSED** | Static pages generated (4/4), First Load JS 177 kB |
| **Frontend Lint** | `npm run lint` | **CONFIG PENDING** | ESLint configuration added; package installation in progress |

---

## 3. Findings & Suspected Risks (Labeled Categories)

### Finding 1: CSV Upload UI Trigger Missing in Frontend
- **Category:** `improvement suggestion` / `MVP user journey blocker`
- **Location:** [`backend/app/api/routes.py`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/backend/app/api/routes.py#L290-L322) & [`Header.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/Header.tsx#L55-L100)
- **Observation:** The backend exposes a functional `POST /api/import` endpoint that parses CSVs and normalizes records into DuckDB. However, the frontend `Header.tsx` only offers a read-only data source dropdown without a file upload selector or progress indicator.
- **Remediation:** Add a CSV Upload Modal with drag-and-drop, client validation preview, and explicit feedback for valid, malformed, and skipped rows.

### Finding 2: CSV Import Schema Error Reporting Lacks Structured Breakdown
- **Category:** `confirmed bug`
- **Location:** [`backend/app/api/routes.py:302-322`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/backend/app/api/routes.py#L302-L322)
- **Observation:** In `import_csv_file`, rows that fail `normalize_record` are silently omitted from `observations` without recording row numbers, reason for failure (invalid lat/lon vs unparseable timestamp), or warning counts. If all rows fail, it returns generic 400.
- **Remediation:** Enforce upfront schema validation for required columns (`latitude`/`lat`, `longitude`/`lon`, `acq_date`). Track `total_rows`, `valid_rows`, `malformed_rows`, and return detailed error diagnostics.

### Finding 3: Reset Action Date Range Restoration
- **Category:** `confirmed bug` / `state consistency risk`
- **Location:** [`frontend/src/components/Controls.tsx:205-225`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/Controls.tsx)
- **Observation:** When user clicks "Reset", the date range should restore the documented default baseline (`2024-08-01` to `2024-08-20`) and clear `selectedDate` focus synchronously across all components.
- **Remediation:** Verify that resetting restores documented defaults, clears all overrides, and re-triggers single-state propagation.

### Finding 4: Empty Selection & Zero Results Handling
- **Category:** `risk requiring verification`
- **Location:** [`frontend/src/components/MetricsCards.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/MetricsCards.tsx), [`HotspotMap.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/HotspotMap.tsx), [`SensorComparisonCard.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/SensorComparisonCard.tsx)
- **Observation:** If a user selects a date with zero observations, or filters by a sensor with no detections in that bounding box, the UI must display clean, non-crashing empty states with `—` or `0 detections` and distinguish zero results from network errors.
- **Remediation:** Add explicit empty-state tests and verify in headless browser.

### Finding 5: Interactive Map "Locate on Map" Accessibility
- **Category:** `improvement suggestion`
- **Location:** [`frontend/src/components/ObservationDetailsPanel.tsx:235-245`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/ObservationDetailsPanel.tsx#L235-L245)
- **Observation:** "Center on map" currently centers coordinates, but should also ensure smooth zoom and accessible keyboard triggering.
- **Remediation:** Verify button click and keyboard Enter trigger map fly-to and halo ring animation.

---

## 4. Next Steps
1. Enhance `backend/app/api/routes.py` `/api/import` with structured column validation and malformed row accounting.
2. Build an accessible, drag-and-drop CSV upload modal in the frontend Header/Controls.
3. Add automated test coverage in `backend/tests/` and browser E2E tests for the 12 MVP user journeys.
4. Produce `docs/MVP_ACCEPTANCE_CHECKLIST.md`, `docs/TEST_PLAN.md`, and `docs/DATA_AND_METRIC_DEFINITIONS.md`.
