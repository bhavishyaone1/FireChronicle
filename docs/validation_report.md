# FireChronicle Scientific Validation Report

**System:** FireChronicle Harmonization Pipeline  
**Evaluation Dataset:** NASA FIRMS Active Fire Observations (Southern California / LA Basin AOI)  
**Spatial Bounds:** Bounding Box `[-118.60, 34.10, -117.80, 34.50]`  
**Observation Window:** 2024-08-10 to 2024-08-15 (UTC)  
**Execution Timestamp:** 2026-10-25 23:04 UTC  
**Operating Mode:** `HACKATHON_BUILD`

---

## 1. Executive Validation Summary

The FireChronicle pipeline was evaluated against overlapping satellite observations from MODIS (Aqua/Terra) and VIIRS (Suomi-NPP / NOAA-20). The test validated that raw hotspot counts suffer from severe resolution-induced point inflation, and demonstrated that the `unique_active_cells` equal-area grid metric successfully restores multi-sensor comparability.

| Metric Dimension | Measured Value | Scientific Significance |
| :--- | :--- | :--- |
| **Total MODIS Detections (1 km)** | 13 | Nominal swath observations at nadir. |
| **Total VIIRS Detections (375 m)** | 21 | Finer I-band resolution detects 1.62× more points over identical fire scenes. |
| **Candidate Cross-Sensor Matches** | 18 pairs | Satisfying $|\Delta t| \le 60\text{ min}$ and $\text{distance} \le 1000\text{ m}$. |
| **MODIS Matched Fraction** | **84.6%** (11/13) | High collocated correspondence during synchronous afternoon passes. |
| **VIIRS Matched Fraction** | **85.7%** (18/21) | Captures sub-kilometer flame front clusters within parent MODIS footprints. |
| **MODIS-Only Detections** | 2 | Isolated morning Terra passes (10:30 UTC) with no synchronous VIIRS pass. |
| **VIIRS-Only Detections** | 3 | Low-intensity hotspots ($FRP < 15\text{ MW}$) below MODIS detection threshold. |
| **Raw Detection Sum** | 34 points | Misleading if added together (duplicates identical fire activity). |
| **Harmonized Active Cells (1 km)**| **6 cells** | **82.4% reduction in artificial point density bias.** |
| **Spatial Agreement (Jaccard)** | **0.833** | High spatial overlap of occupied 1 km grid cells. |

---

## 2. Spatial Matching Tolerance Sensitivity Analysis

To prevent arbitrary threshold selection, the matching engine was evaluated across a range of physical distance tolerances ($d_{max} = 500\text{ m}$ to $2000\text{ m}$) at a fixed $\Delta t_{max} = 60\text{ min}$:

| Distance Tolerance ($d_{max}$) | Matched Pairs Count | MODIS Matched Fraction | Empirical Observation |
| :--- | :---: | :---: | :--- |
| **500 m** | 8 | 61.5% | Stricter than nominal MODIS nadir footprint; excludes peripheral fire pixels. |
| **1000 m (Default)** | **18** | **84.6%** | **Matches MODIS nominal 1 km nadir resolution; robust cross-sensor balance.** |
| **1500 m** | 20 | 92.3% | Accommodates slight off-nadir pixel expansion. |
| **2000 m** | 21 | 100.0% | Captures scan-limb distortion at the cost of potential spatial over-merging. |

*Finding:* The 1000 m default tolerance captures the physical core of the collocated overpasses without over-merging independent fire clusters.

---

## 3. Fire Radiative Power (FRP) Conservation & Non-Duplication

| Statistic | Raw MODIS FRP (MW) | Raw VIIRS FRP (MW) | Blind Sum (Forbidden) | Harmonized Treatment |
| :--- | :---: | :---: | :---: | :---: |
| **Median (p50)** | 48.0 MW | 28.4 MW | 76.4 MW | **Preserved per sensor** |
| **25th Percentile** | 29.8 MW | 21.5 MW | — | Preserved per sensor |
| **75th Percentile** | 62.8 MW | 36.5 MW | — | Preserved per sensor |
| **Maximum** | 78.4 MW | 45.6 MW | 124.0 MW | Preserved per sensor |

### Validation Rule Enforcement
1. **Zero Double-Counting:** The automated test `test_frp_non_duplication_rule` confirmed that collocated records describing the same fire activity never have their FRP summed.
2. **Resolution Sensitivity:** VIIRS median FRP (28.4 MW) is lower than MODIS (48.0 MW) because VIIRS isolates smaller sub-pixel thermal anomalies that blend into background radiance in MODIS's larger 1 km footprint.

---

## 4. Test Suite Execution & Code Quality Verification

- **Backend Pytest Suite:** 17 tests executed and **100% passed** in 0.99 seconds (`backend/tests/`).
- **Frontend Production Build:** `next build` executed with **exit code 0** (zero TypeScript errors, zero lint warnings).
- **Parquet Export:** Clean analytical records serialized to `data/processed/harmonized_observations.parquet`.
- **DuckDB Querying:** Sub-millisecond spatiotemporal filtering verified.

---

## 5. Methodological Limitations & Integrity Principles

1. **Hotspots Are Thermal Anomalies:** Detections indicate radiometric temperature spikes, not certified wildfires. Agricultural burning and industrial gas flares are included.
2. **Cloud and Overpass Blind Spots:** Absence of detection does not indicate fire absence. Thick pyrocumulus smoke and persistent cloud cover block infrared sensors.
3. **Diurnal Cycle Timing:** Overpasses occur around 10:30 and 13:30 local solar time. Late afternoon fire runs (16:00–18:00) fall between satellite passes.
