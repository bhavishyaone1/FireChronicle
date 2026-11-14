# FireChronicle — System Limitations & Scientific Caveats
**Document Version:** 1.0.0  
**Scope:** Remote Sensing Physics, Temporal Gaps, and Algorithmic Boundaries  
**Date:** 09 November 2026  

---

## 1. Remote Sensing Physical Constraints

### 1.1 Detection Sensitivities and Cloud/Canopy Obscuration
- **Thermal Obscuration:** Satellite infrared sensors operating at 3.7–4.0 μm cannot penetrate thick convective clouds, heavy precipitation, or dense pyrocumulus smoke columns. During the South Asian summer monsoon (June–September) and heavy winter fog over the Indo-Gangetic Plain (December–January), active-fire detections are severely suppressed.
- **Absence of Detection $\ne$ Absence of Fire:** A zero-detection day in FireChronicle indicates that no thermal emission exceeding algorithm detection thresholds reached the satellite sensor during an overpass; it is **not** definitive proof that no fires occurred on the ground.
- **Canopy Attenuation:** Dense evergreen and semi-evergreen forest canopies (e.g. in the Western Ghats and Northeast India) attenuate upwelling thermal radiance from understory surface fires, reducing the likelihood of detection by coarser sensors like MODIS.

### 1.2 Brightness Temperature is Not Flame Temperature
- Satellite infrared radiometers measure the average spectral radiance emitted by an entire pixel footprint ($375\text{ m} \times 375\text{ m}$ for VIIRS, $1000\text{ m} \times 1000\text{ m}$ for MODIS).
- Active combustion typically occupies a subpixel fraction of $0.001$ to $0.01$. The reported brightness temperature (in Kelvin) represents the integrated Planckian radiant flux of this subpixel emitter combined with the unburnt background surface.
- **Do not interpret a brightness temperature of 330 K (~57°C) as the temperature of the fire.** Wildfire flames burn at 800–1200 K (500–900°C).

### 1.3 Fire Radiative Power (FRP) Interpretation
- FRP (reported in Megawatts) measures the rate of radiant energy release at the instant of satellite overpass.
- FRP is an instantaneous rate, not total consumed energy or burned area.
- Adding MODIS and VIIRS FRP values from near-simultaneous overpasses of the same fire results in double-counting and is strictly prohibited in FireChronicle.

---

## 2. Sensor Discontinuities & Orbital Timing

### 2.1 Spatial Resolution Disparity
- VIIRS 375 m has an area footprint ~7 times smaller at nadir than MODIS 1 km, enabling it to detect smaller, low-intensity agricultural residue burns that MODIS misses.
- Long-term time-series comparisons must account for the introduction of VIIRS in 2012; an increase in hotspot counts post-2012 reflects enhanced sensor sensitivity, not necessarily an increase in ground fire frequency.

### 2.2 Suomi-NPP Mission Cessation (November 2026)
- Suomi-NPP VIIRS reached end-of-life and was decommissioned in November 2026.
- Operational near-real-time monitoring transitioned automatically to NOAA-20 and NOAA-21 VIIRS. Historical queries referencing Suomi-NPP prior to November 2026 remain supported in archive mode.

---

## 3. Institutional & Data Integration Caveats

### 3.1 Forest Survey of India (FSI)
- FSI alerts are generated from MODIS and VIIRS passes processed through NRSC. Because they rely on the same underlying satellite instruments, FSI alert counts cannot be used as an independent statistical validation of FIRMS hotspot detections.
- FSI applies masking algorithms to eliminate industrial and mining thermal sources and clips alerts against State Forest Department administrative boundaries. Discrepancies between FIRMS raw hotspots and FSI alerts often reflect jurisdictional masking rather than sensor error.

### 3.2 ISRO / NRSC Bhuvan Active Agricultural Fire
- Bhuvan crop residue burning data is published **only** during declared cropping seasons:
  - **Rabi Season:** 01 April – 30 May
  - **Kharif Season:** 15 September – 30 November
- Outside these calendar windows, the Bhuvan service does not ingest agricultural fire records. Queries outside these dates default to standard FIRMS observations with seasonal context rules.
