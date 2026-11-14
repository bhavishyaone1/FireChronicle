# Cross-Sensor Harmonization & Common Grid Validation Report

**Pipeline Execution Date:** 2026-11-09 20:32:58 UTC  
**Target Region:** Republic of India (`[68.1°E, 6.5°N, 97.4°E, 37.1°N]`)  
**Spatial Collocation Criterion:** $\le 1.0\text{ km}$ Euclidean/Haversine distance  
**Temporal Collocation Criterion:** $\le 3600\text{ s}$ (60 minutes) overpass time delta  
**Common Projection:** Authalic Lambert Cylindrical Equal-Area Grid ($1.0\text{ km} \times 1.0\text{ km}$, EPSG:6933)  

---

## 1. Harmonization Inventory & Candidate Correspondences

| Metric | Scientific Semantics | Verified Numeric Value |
| :--- | :--- | :--- |
| **Total MODIS India Observations** | Raw 1 km pixel detections | 138,194 |
| **Total VIIRS India Observations** | Raw 375 m pixel detections | 995,447 |
| **Canonical Combined Dataset** | All observations indexed without loss | 1,133,641 |
| **Candidate Correspondence Edges** | Pairs meeting $\le 1\text{ km}$ and $\le 60\text{ min}$ | 2,998 |
| **Unique MODIS in Candidate Pairs** | Distinct MODIS detections collocated with VIIRS | 1,844 (1.33%) |
| **Unique VIIRS in Candidate Pairs** | Distinct VIIRS detections collocated with MODIS | 2,903 (0.29%) |
| **Mean Spatial Separation** | Collocation distance between paired centroids | 458.6 m |
| **Mean Temporal Separation** | Overpass delta between Terra/Aqua and NOAA-20 | 46.9 min |

---

## 2. Invariant Rules Enforced

1. **Non-Duplication Rule:**
   - Candidate pairs are treated strictly as correspondence edges, not merged observations.
   - MODIS and VIIRS FRP are stored and summarized separately. They are **never summed together** for candidate matches.
2. **One-to-Many Collocation Preservation:**
   - Because VIIRS 375 m has ~7x finer ground pixel area than MODIS 1 km, multiple VIIRS observations collocate with a single MODIS footprint.
   - All fine-scale VIIRS observations are fully preserved; no artificial sub-pixel MODIS records were synthesized.
3. **Common Equal-Area Deduplication:**
   - Burning activity calendar metric `unique_active_cells` deduplicates co-occurring detections within the same 1 km cell.
