# MODIS Collection 6.1 Data Dictionary

## 1. Product Overview
- **Product Name**: MODIS Active Fire / Thermal Anomaly Product (Collection 6.1)
- **Source System**: NASA FIRMS (Fire Information for Resource Management System) / EOSDIS
- **Archive File**: `DL_FIRE_M-C61_841318.zip` (131,035,671 bytes)
- **SHA-256**: `201810fb5cc8421bd0680ad411da247b0c7a8474ab3b3d254479728a973882cb`
- **Instruments**: Moderate Resolution Imaging Spectroradiometer (MODIS) on NASA Terra and Aqua satellites
- **Nominal Spatial Resolution**: 1.0 km at nadir (elongates toward scan edges up to ~4.8 km along scan, ~2.0 km along track)
- **Coordinate Reference System (CRS)**: WGS 84 (EPSG:4326), decimal degrees

## 2. Archive Members
| Member Filename | Format | Purpose | Record Count |
|---|---|---|---|
| `fire_archive_M-C61_841318.shp` (+ `.dbf`, `.shx`, `.prj`, `.cpg`) | ESRI Shapefile | Standard science-quality MODIS archive | 2,649,343 |
| `fire_nrt_M-C61_841318.shp` (+ `.dbf`, `.shx`, `.prj`, `.cpg`) | ESRI Shapefile | Near-Real-Time (NRT) MODIS observations | 747,712 |
| `Readme.txt` | Text | NASA EOSDIS metadata and documentation pointer | 1 |
| **Total MODIS Observations** | | | **3,397,055** |

---

## 3. Field Specifications & Scientific Semantics

### `LATITUDE`
- **Data Type**: Float64 (Numeric 32, 10 in DBF)
- **Unit**: Decimal degrees
- **Valid Range**: -90.0 to +90.0
- **Scientific Definition**: Center of the 1 km nominal fire pixel on the Earth's surface. Does NOT represent exact ground flame coordinates or fire front perimeter.

### `LONGITUDE`
- **Data Type**: Float64 (Numeric 32, 10 in DBF)
- **Unit**: Decimal degrees
- **Valid Range**: -180.0 to +180.0
- **Scientific Definition**: Center of the 1 km nominal fire pixel on the Earth's surface.

### `BRIGHTNESS` (Channel 21/22 Brightness Temperature)
- **Data Type**: Float64 (Numeric 32, 10 in DBF)
- **Physical Unit**: Kelvin ($K$)
- **Channel Wavelength**: 3.96 $\mu m$ (MIR band: Channel 21 for high saturation, Channel 22 for low)
- **Scientific Caveat**: **Brightness temperature ($T_{21}$) is a top-of-atmosphere sensor-channel radiometric measurement in Kelvin, NOT flame combustion temperature ($800\text{--}1200\text{ K}$) and NOT surface air temperature (°C).** Converting Kelvin to Celsius ($°C = K - 273.15$) retains the radiometric measurement and must always be labeled brightness temperature.

### `BRIGHT_T31` (Channel 31 Brightness Temperature)
- **Data Type**: Float64 (Numeric 32, 10 in DBF)
- **Physical Unit**: Kelvin ($K$)
- **Channel Wavelength**: 11.03 $\mu m$ (TIR band: Channel 31)
- **Scientific Caveat**: Used in the MODIS contextual algorithm to assess background surface temperature and cloud/water contrast: $\Delta T = T_{21} - T_{31}$.

### `SCAN`
- **Data Type**: Float64 (Numeric 32, 10 in DBF)
- **Unit**: Kilometres ($km$)
- **Scientific Definition**: Actual pixel dimension along the satellite scan direction. Varies from 1.0 km at nadir up to ~4.8 km at scan edges due to optical panoramic bowtie distortion.

### `TRACK`
- **Data Type**: Float64 (Numeric 32, 10 in DBF)
- **Unit**: Kilometres ($km$)
- **Scientific Definition**: Actual pixel dimension along the satellite flight track direction. Varies from 1.0 km at nadir up to ~2.0 km at scan edges.

### `ACQ_DATE`
- **Data Type**: Date (`YYYYMMDD` string in DBF, parsed to `YYYY-MM-DD` ISO)
- **Timezone**: Timezone-free acquisition date (UTC-governed)

### `ACQ_TIME`
- **Data Type**: Character(4) (`HHMM` UTC)
- **Timezone**: Coordinated Universal Time (UTC)
- **Dual Display**: When displaying in India context, paired with India Standard Time ($IST = UTC + 05:30$).

### `SATELLITE`
- **Data Type**: Character(5)
- **Values**: `Terra` (morning descending, equator crossing ~10:30 local time), `Aqua` (afternoon ascending, equator crossing ~13:30 local time).

### `INSTRUMENT`
- **Data Type**: Character(5)
- **Value**: `MODIS`

### `CONFIDENCE`
- **Data Type**: Integer (Numeric 6, 0 in DBF)
- **Unit**: Percentage ($0\text{--}100\%$)
- **Semantics**: Source-specific numerical detection quality score:
  - `Low`: $0\text{--}29\%$
  - `Nominal`: $30\text{--}79\%$
  - `High`: $80\text{--}100\%$
- **Scientific Caveat**: Do NOT merge or conflate with VIIRS categorical confidence (`low`, `nominal`, `high`). Must be stored with `confidence_semantics = "MODIS_PERCENT_0_100"`.

### `VERSION`
- **Data Type**: Character(5 to 6)
- **Values**: `61.03` (Standard collection science product) or `6.1NRT` (Near-Real-Time delivery).

### `FRP` (Fire Radiative Power)
- **Data Type**: Float64 (Numeric 32, 10 in DBF)
- **Physical Unit**: Megawatts ($MW$)
- **Scientific Definition**: Instantaneous pixel-integrated rate of radiated radiative energy from the thermal anomaly.
- **Aggregation Non-Duplication Rule**: When MODIS and VIIRS observe the same fire event, FRP measurements must NEVER be added together.

### `DAYNIGHT`
- **Data Type**: Character(1)
- **Values**: `D` (Daytime observation), `N` (Nighttime observation).

### `TYPE` (Hotspot Type - Standard Product Only)
- **Data Type**: Integer (Numeric 11, 0 in DBF; null in NRT)
- **Official NASA FIRMS Classification Code**:
  - `0`: Presumed vegetation fire
  - `1`: Active volcano
  - `2`: Other static land source (industrial flares, oil/gas refineries, factories)
  - `3`: Offshore detection
- **Availability**: Present exclusively in `fire_archive_M-C61_841318`; absent in `fire_nrt_M-C61_841318`.
