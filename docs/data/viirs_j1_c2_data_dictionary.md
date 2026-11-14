# VIIRS Collection 2 (J1V-C2) Active Fire Data Dictionary

**Product Name:** NASA FIRMS VIIRS JPSS-1 (NOAA-20) 375 m Active Fire Product  
**Product Short Name:** J1V-C2  
**Archive Identifier:** `DL_FIRE_J1V-C2_841340.zip`  
**Spatial Resolution:** 375 m at nadir (growing to ~800 m at swath edges; constrained footprint growth relative to MODIS)  
**Sensors / Satellites:** Visible Infrared Imaging Radiometer Suite (VIIRS) aboard NOAA-20 (JPSS-1)  
**Coordinate Reference System:** WGS 84 (`EPSG:4326`)  
**Processing Stream:** Collection 2 Standard Science Archive (`fire_archive_J1V-C2_841340.dbf`) & Near-Real-Time Archive (`fire_nrt_J1V-C2_841340.dbf`)  

---

## 1. Scientific Field Specifications

| Field Name | DBF Type | Units | Range / Domain | Description & Scientific Semantics |
| :--- | :--- | :--- | :--- | :--- |
| `LATITUDE` | Numeric (8,5) | Degrees | \[-90.0, 90.0\] | Center latitude of the nominal 375 m detector pixel; not exact flame coordinates. |
| `LONGITUDE` | Numeric (8,5) | Degrees | \[-180.0, 180.0\] | Center longitude of the nominal 375 m detector pixel; not exact flame coordinates. |
| `BRIGHT_TI4` | Numeric (6,2) | Kelvin ($K$) | 200.0 – 367.0 | VIIRS Band I-4 (3.74 μm) brightness temperature. **Radiometric measurement in Kelvin, NOT flame combustion temperature.** |
| `BRIGHT_TI5` | Numeric (6,2) | Kelvin ($K$) | 150.0 – 380.0 | VIIRS Band I-5 (11.45 μm) thermal infrared brightness temperature. Clean terrestrial thermal background reference. |
| `SCAN` | Numeric (4,2) | km | 0.32 – 0.85 | Along-scan pixel dimension (nominal 0.375 km at nadir). |
| `TRACK` | Numeric (4,2) | km | 0.32 – 0.85 | Along-track pixel dimension (nominal 0.375 km at nadir). |
| `ACQ_DATE` | Character (10) | Date | YYYY-MM-DD | Acquisition date in UTC. |
| `ACQ_TIME` | Character (4) | Time | 0000 – 2359 | Overpass time in UTC (HHMM format). |
| `SATELLITE` | Character (3) | Code | `N20`, `1`, `J1` | Satellite platform code representing NOAA-20 (Joint Polar Satellite System 1). |
| `CONFIDENCE` | Character (7) | Category | `low`, `nominal`, `high` | **Source-specific categorical confidence rating.** Never conflate or linearly remap to MODIS percentage confidence ($0\text{--}100\%$). |
| `VERSION` | Character (10) | String | `2.0NRT`, `2.0` | Product collection and processing baseline version string. |
| `FRP` | Numeric (7,2) | MW | $\ge 0.0$ | Fire Radiative Power in Megawatts ($MW$). Pixel-integrated thermal radiative flux. |
| `DAYNIGHT` | Character (1) | Code | `D`, `N` | Solar illumination flag: `D` = Daytime overpass, `N` = Nighttime overpass. |

---

## 2. Radiometric Measurement Principles

> [!IMPORTANT]
> **Radiometric Kelvin Measurement vs. Flame Temperature:**
> `BRIGHT_TI4` (3.74 μm) and `BRIGHT_TI5` (11.45 μm) measure the equivalent blackbody brightness temperature of the entire $375\text{ m} \times 375\text{ m}$ sub-pixel ground footprint.
> - Typical active fire detections range from $300\text{ K}$ to $367\text{ K}$.
> - Actual combustion flame temperatures reach $800\text{--}1200\text{ K}$ over a fraction of the sub-pixel area.
> - Never report `BRIGHT_TI4` as flame temperature, wildfire temperature, or ambient surface heat.

---

## 3. Confidence Categorization Semantics

Unlike MODIS Collection 6.1 (which reports numeric probabilities from $0$ to $100\%$), VIIRS 375 m utilizes three discrete categorical confidence classes:
- **`low`**: Detections with lower thermal contrast against ambient background, potential sun glint, edge-of-swath smearing, or high sensor saturation uncertainty.
- **`nominal`**: Standard, high-quality thermal anomaly pixel meeting all core multi-channel contextual tests. Represents the vast majority of confirmed hotspots.
- **`high`**: Day or night observations with extreme radiometric contrast in Band I-4 ($\Delta T_{4-5} > 25\text{ K}$) and clear pixel background, indicating intense flaming combustion.
