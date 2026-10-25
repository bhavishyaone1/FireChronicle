# Official Challenge Requirements & Compliance Checklist

**Project:** FireChronicle  
**Challenge:** Harmonization of MODIS and VIIRS Hot Spots  
**Host Organization:** NASA International Space Apps Challenge 2026  
**Document Status:** Live Reference & Compliance Audit  
**Operating Mode:** `PRE_HACKATHON_PREPARATION` (Current Date: October 25, 2026)

---

## 1. Challenge Metadata & Key Timeline Dates

- **Official Challenge URL:** [NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/)
- **Main Event URL:** [NASA Space Apps Challenge 2026](https://www.spaceappschallenge.org/2026/)
- **Challenge Statement & Resource Release Date:** **October 28, 2026**
- **Official Hackathon Development Window:** **November 14–15, 2026**

> [!IMPORTANT]
> **Operating Mode Declaration: `PRE_HACKATHON_PREPARATION`**  
> Under official NASA Space Apps rules, project solutions must **not** be developed prior to the official hackathon start.  
> - **Allowed now:** Inspect local system, verify/install general developer tooling, read official scientific literature and API docs, test API connectivity, create generic project scaffolds/docs, and establish the scientific methodology.  
> - **Prohibited until Hackathon Start:** Developing the FireChronicle solution code, creating project-specific processed datasets, precomputing results, training models, creating the final production UI, or producing submission deliverables.

---

## 2. Official Challenge Problem Statement Summary

Satellites have tracked active fire hotspots (vegetation fires, agricultural burning, and other thermal anomalies) for over two decades:
1. **MODIS** (Moderate Resolution Imaging Spectroradiometer aboard Terra and Aqua satellites) provides continuous observations from ~2000 to present at ~1 km spatial resolution.
2. **VIIRS** (Visible Infrared Imaging Radiometer Suite aboard Suomi-NPP, NOAA-20, and NOAA-21) provides observations from ~2012 to present at 375 m (I-band) and 750 m (M-band) resolutions.

### The Discontinuity Challenge
Because MODIS and VIIRS differ in:
- Pixel footprint (1 km vs 375 m / 750 m),
- Detection sensitivity (VIIRS detects significantly smaller and cooler thermal anomalies),
- Overpass timing and scan geometry (Terra 10:30 AM/PM, Aqua 1:30 AM/PM, Suomi-NPP / NOAA-20 / NOAA-21 ~1:30 AM/PM with differing orbital separation),
- Confidence metric conventions (MODIS: 0–100% continuous; VIIRS 375m: categorical `low`, `nominal`, `high`),

their raw detection counts and Fire Radiative Power (FRP) cannot be concatenated into a single time series without introducing artificial jumps.

### Challenge Objective
Build **FireChronicle**, a scientifically transparent web application that:
1. Harmonizes MODIS and VIIRS records onto a defensible common spatial-temporal framework.
2. Produces an interpretable **burning-activity calendar** allowing users to query any Area of Interest (AOI).
3. Distinguishes cross-sensor matches from sensor-specific detections.
4. Identifies historical seasonal baselines and unusual burning activity.
5. Preserves full provenance, sensor differences, and scientific caveats.

---

## 3. Compliance & Integrity Requirements Checklist

| Requirement | Scientific / Operational Rationale | Compliance Verification | Status |
| :--- | :--- | :--- | :---: |
| **No Pre-Hackathon Solution Building** | Adheres strictly to Space Apps fair play rules. | Verified: System in `PRE_HACKATHON_PREPARATION` mode until Nov 14, 2026. | ✅ COMPLIANT |
| **Real NASA Observations Only** | Never present fabricated or synthetic data as genuine NASA observations. | Pipeline exclusively consumes verified FIRMS CSV/Parquet sources; synthetic data restricted to isolated unit tests. | 📋 PREPARED |
| **Preserve Raw Records & Source IDs** | Scientific reproducibility requires full traceability. | Normalized records retain `source_file`, `source_row_id`, and immutable hash `observation_id`. | 📋 SPECIFIED |
| **No "Hotspot = Wildfire" Fallacy** | Hotspots include agricultural burns, gas flares, volcanoes, and industrial heat. | App UI explicitly labels detections as "Thermal Hotspots / Burning Activity", not confirmed wildfires. | 📋 SPECIFIED |
| **Distinguish "No Hotspot" vs "No Observation"** | Cloud cover, satellite orbital gaps, and instrument downtime are not zero-fire evidence. | Calendar explicitly flags coverage status and orbital availability. | 📋 SPECIFIED |
| **No Blind FRP Summation** | Collocated detections of the same fire cannot have their FRP summed. | FRP aggregation preserves per-sensor distributions; cross-sensor matches report maximum or sensor-specific FRP. | 📋 SPECIFIED |
| **Source-Specific Confidence Preservation** | MODIS (0–100) and VIIRS (`low`, `nominal`, `high`) are not numerically identical. | Raw confidence fields are kept distinct; filtering impacts are transparently toggled. | 📋 SPECIFIED |
| **Zero Secret Exposure** | NASA FIRMS MAP_KEY must never leak into client code or git history. | MAP_KEY strictly backend-isolated via `.env`; `.gitignore` blocks `.env*`; `.env.example` has blank placeholders. | ✅ ENFORCED |
| **Explainable Statistical Baseline** | Deep learning black-boxes are unjustified for MVP anomaly detection. | Seasonal median + MAD/IQR robust deviation baseline with sample size safeguards. | 📋 SPECIFIED |

---

## 4. Judging Criteria Alignment Matrix

When official 2026 judging rubrics are finalized on October 28, 2026, this matrix will be audited against the exact rubric:

| Criteria Dimension | FireChronicle Implementation Evidence |
| :--- | :--- |
| **Relevance** | The Burning-Activity Calendar is the central anchor, directly solving the MODIS/VIIRS historical break. |
| **Scientific Validity** | Strict preservation of sensor physics, spatial resolution footprints, overpass geometry, and explicit matching tolerances. |
| **Effective Use of NASA Data** | Ingestion of standard-processing (SP) and NRT archives from MODIS (Terra/Aqua) and VIIRS (S-NPP/NOAA-20/NOAA-21) via NASA FIRMS. |
| **Creativity & UX** | A dedicated Sensor Discontinuity Inspector showing side-by-side footprint resolution and candidate cross-sensor matches. |
| **Impact & Feasibility** | Enables land managers and researchers to query historical fire regimes without requiring expensive GIS infrastructure. |
| **Presentation & Clarity** | Clear legends, uncertainty ranges, data provenance badges, and a 2-3 minute repeatable demonstration workflow. |

---

## 5. Pre-Hackathon to Event-Day Transition Plan

1. **October 28, 2026:** Review released challenge statements, official resource links, and any new API parameters. Update this document.
2. **November 14, 2026 (09:00 Local Event Start):**
   - Confirm official start with user.
   - Switch `MODE` to `HACKATHON_BUILD`.
   - Execute Milestone A through E in sequence.
