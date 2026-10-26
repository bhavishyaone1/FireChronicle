# FireChronicle — MVP Acceptance Checklist

**Standard:** Lead QA Engineer & Release Engineer  
**Scope:** Complete End-to-End MVP Verification  
**Evaluation:** 12-Step MVP User Journey Verification

---

## 1. Traceability & Observable Acceptance Matrix

| # | MVP User Journey Step | Observable Acceptance Criteria | Implementation Component | Verification Status |
|:---:|:---|:---|:---|:---:|
| **1** | **Open Application** | App loads without uncaught browser errors; header reflects operational backend connectivity; active mode and data status badges are truthful. | [`Header.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/Header.tsx), [`page.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/app/page.tsx) | **PASSED** &bull; Verified via headless CDP & HTTP `/api/health` |
| **2** | **Choose Data Source** | Dropdown allows selecting live API or custom CSV upload; clearly labels synthetic benchmark sample vs live NASA feed. | [`Header.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/Header.tsx#L55-L100), [`CsvImportModal.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/CsvImportModal.tsx) | **PASSED** &bull; Dropdown and Modal triggers functional |
| **3** | **Load & Validate Data** | Validates required columns (`latitude`, `longitude`, `acq_date`), reports malformed rows, and preserves previous dataset on invalid import. | [`routes.py`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/backend/app/api/routes.py#L290-L360), [`CsvImportModal.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/CsvImportModal.tsx) | **PASSED** &bull; 6 automated unit tests in `test_api.py` |
| **4** | **Choose Region & Date Window** | Global state controls synchronization across AOI, start date, and end date without stale state drift. | [`Controls.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/Controls.tsx), [`page.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/app/page.tsx) | **PASSED** &bull; Synchronized React state & preset selectors |
| **5** | **Apply & Reset Filters** | Every relevant KPI, map layer, calendar cell, and chart updates synchronously. "Reset" restores documented default range. | [`Controls.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/Controls.tsx#L205-L225) | **PASSED** &bull; Verified via CDP reset click action |
| **6** | **Explore Map** | MapLibre GL renders with correct attribution; layers toggle MODIS, VIIRS, and candidate cross-match halos; "Center on map" centers target. | [`HotspotMap.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/HotspotMap.tsx), [`ObservationDetailsPanel.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/ObservationDetailsPanel.tsx#L235-L245) | **PASSED** &bull; Dynamic halo ring and smooth fly-to verified |
| **7** | **Explore Calendar** | Aggregates unique active 1.0 km cells per UTC day; clicking date focuses the day across the entire application; clear action works. | [`BurningActivityCalendar.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/BurningActivityCalendar.tsx), [`page.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/app/page.tsx) | **PASSED** &bull; Single-date focus and restore verified |
| **8** | **Compare Sensors** | Displays raw MODIS and VIIRS counts, candidate match pairs, sensor-unique detections, and spatial tolerance sensitivity curve. | [`SensorComparisonCard.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/SensorComparisonCard.tsx), [`SensorDiscontinuityInspector.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/SensorDiscontinuityInspector.tsx) | **PASSED** &bull; Disparity calculations and sensitivity curves verified |
| **9** | **Inspect Record** | Selected observation displays thermal cutout visualizer, tabular monospace coordinates, satellite platform, FRP, and confidence. | [`ObservationDetailsPanel.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/ObservationDetailsPanel.tsx) | **PASSED** &bull; Animated transition with Geist Mono verified |
| **10** | **Review Methodology & Provenance** | Explains 11-stage processing pipeline, sensor geometry differences, and core guardrails (e.g. thermal hotspots &ne; confirmed perimeters). | [`MethodologyProvenance.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/MethodologyProvenance.tsx) | **PASSED** &bull; Deep link `/#methodology` verified |
| **11** | **Data Export** | 1-click download of GeoJSON FeatureCollection and CSV matching active filtered scope with complete metadata sidecars. | [`routes.py`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/backend/app/api/routes.py#L390-L450), [`HarmonizationAuditView.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/HarmonizationAuditView.tsx#L140-L160) | **PASSED** &bull; GeoJSON and CSV endpoints verified |
| **12** | **Recover from Failure** | Non-CSV file, empty file, malformed CSV, empty bbox selection, or missing tiles produce actionable, non-crashing UI messages. | [`routes.py`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/backend/app/api/routes.py), [`HotspotMap.tsx`](file:///c:/Users/bhavishya/Downloads/PROJECTS/Nasa/frontend/src/components/HotspotMap.tsx#L250-L270) | **PASSED** &bull; Fallback banners & error boundaries active |

---

## 2. Scientific Integrity Guardrails

- **Zero Fabricated Claims:** Synthetic benchmark data explicitly flagged as `SYNTHETIC DEMONSTRATION DATA`.
- **Equal-Area Projection:** Lambert Cylindrical Equal-Area (1.0 km) mathematically ensures $S^2 = 1.0\text{ km}^2$ worldwide without latitude distortion.
- **FRP Non-Summation:** Distinct source-specific distributions strictly enforced (*Li et al., 2018*).
- **Suomi-NPP Lifecycle:** Automatic product redirection from `VIIRS_SNPP_SP` to `VIIRS_NOAA20_SP` / `VIIRS_NOAA21_SP` on/after 2026-11-01.
