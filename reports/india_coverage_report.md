# FireChronicle India Satellite Fire Coverage Report

**Date of Analysis:** 2026-11-09  
**Geographic Scope:** Republic of India (`[68.1°E, 6.5°N, 97.4°E, 37.1°N]`)  
**Data Sources:** NASA FIRMS MODIS Collection 6.1 (`M-C61`) & VIIRS Collection 2 (`J1V-C2`)  

---

## 1. Executive Summary

The ingestion of NASA FIRMS archives confirmed extensive, high-density active fire and thermal anomaly coverage across the Republic of India:
- **Total Combined NASA Hotspot Detections in India:** **1,133,641 records**
  - **MODIS (Terra & Aqua, 1.0 km nadir):** **138,194 records** (12.19% of total)
  - **VIIRS (NOAA-20 / JPSS-1, 375 m nadir):** **995,447 records** (87.81% of total)
- **Temporal Span:** Full 365-day continuous annual baseline from **2025-11-09 to 2026-11-09**.
- **Sensor Ratio:** VIIRS detects approximately **7.2x more active-fire pixels** than MODIS over India, illustrating the significant sensitivity increase of the 375 m I-band over the legacy 1 km sensor.

---

## 2. State-Level Detection Breakdown

| Indian State / Region | MODIS Detections | VIIRS Detections | Combined Total | Primary Fire Regime / Seasonality |
| :--- | :--- | :--- | :--- | :--- |
| **Madhya Pradesh** | 18,044 | 123,543 | **141,587** | Central deciduous forest fires (Feb–Apr) & wheat stubble (Apr–May) |
| **Chhattisgarh** | 9,023 | 93,628 | **102,651** | Sal forest understory fires (Feb–Apr) & tendu leaf burning |
| **Odisha** | 5,646 | 59,626 | **65,272** | Similipal and Eastern Ghats dry deciduous fires (Mar–May) |
| **Telangana / Andhra Pradesh** | 5,811 | 54,649 | **60,460** | Scrub forest and agricultural clearing (Jan–Apr) |
| **West Bengal / Jharkhand** | 4,210 | 51,704 | **55,914** | Chota Nagpur forest fires & rice residue burning |
| **Uttar Pradesh** | 6,689 | 48,034 | **54,723** | Indo-Gangetic paddy residue (Oct–Nov) & wheat residue (Apr–May) |
| **Karnataka** | 5,448 | 37,083 | **42,531** | Western Ghats dry deciduous fringes & sugarcane burning |
| **Punjab** | 6,705 | 24,718 | **31,423** | Intense post-monsoon Kharif paddy stubble burning (Oct–Nov) |
| **Rajasthan** | 3,120 | 21,163 | **24,283** | Arid crop clearing and mustard residue burning |
| **Assam & North East** | 2,963 | 19,452 | **22,415** | Jhum (shifting cultivation) clearing & tea plantation burning (Feb–Apr) |
| **Uttarakhand & Himachal** | 1,840 | 12,890 | **14,730** | Chir pine needle forest fires (Apr–Jun pre-monsoon peak) |
| **Other States & Territories** | 68,695 | 448,957 | **517,652** | Maharashtra, Gujarat, Tamil Nadu, Bihar, etc. |
| **Total** | **138,194** | **995,447** | **1,133,641** | **All India National Coverage** |

---

## 3. Radiometric & Diurnal Characteristics

### Day vs. Night Overpass Distribution
- **MODIS:** 78.4% Daytime overpasses (Terra ~10:30 AM local, Aqua ~1:30 PM local); 21.6% Nighttime overpasses (Terra ~10:30 PM, Aqua ~1:30 AM).
- **VIIRS (NOAA-20):** 74.2% Daytime (~1:20 PM local); 25.8% Nighttime (~1:20 AM local).

### Fire Radiative Power (FRP) Distribution
- **MODIS FRP:** Mean = $38.4\text{ MW}$, Median = $18.2\text{ MW}$, 95th Percentile = $124.6\text{ MW}$.
- **VIIRS FRP:** Mean = $14.1\text{ MW}$, Median = $6.2\text{ MW}$, 95th Percentile = $52.8\text{ MW}$.
- *Scientific Explanation:* VIIRS resolves smaller and lower-intensity fires, shifting the FRP distribution towards lower values while detecting significantly more discrete flaming fronts.
