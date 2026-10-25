# FireChronicle Model Card

**System:** FireChronicle Historical Anomaly & Harmonization Analytics  
**Primary Analytical Method:** Robust Seasonal Median + MAD Baseline  
**Optional Experimental Model:** Isolation Forest / Huber Cross-Sensor FRP Regressor  
**Document Status:** Specification & Pre-Hackathon Governance

---

## 1. Model Details

### 1.1 Model Description
- **Developer:** FireChronicle Team (NASA Space Apps Challenge 2026)
- **Model Type:**
  1. *Primary (Production Default):* Non-parametric robust seasonal baseline calculating median and Median Absolute Deviation (MAD) across multi-year historical burning activity.
  2. *Secondary (Optional Experimental):* Unsupervised Isolation Forest on spatiotemporally aggregated grid cells to detect multidimensional anomalous fire events (activity count + FRP + temporal persistence).
  3. *Optional Calibration:* Robust Huber linear regression for cross-sensor FRP calibration on strictly synchronous afternoon overpasses (Aqua vs Suomi-NPP / NOAA-20).
- **License:** Open Source (MIT)

---

## 2. Intended Use & Non-Intended Use

### 2.1 Intended Use
- **Historical Contextualization:** Provide emergency managers, land managers, and researchers with context on whether observed burning activity in a given month or grid cell is unusually elevated or depressed compared to historical multi-year records.
- **Cross-Sensor Discontinuity Demonstration:** Quantify the detection sensitivity differences between MODIS 1 km and VIIRS 375 m sensors.
- **Decision Support & Research:** Enable retrospective analysis of fire season dynamics.

### 2.2 Prohibited / Non-Intended Uses
- **NOT an Operational Wildfire Ignition Predictor:** This system does **not** predict fire ignition, fire spread, flame behavior, or future risk.
- **NOT a Real-Time Emergency Evacuation Dispatch Tool:** Hotspot detections reflect thermal anomalies from satellite passes hours prior; they do not replace local tactical ground and aerial firefighting intelligence.
- **NOT Confirmation of Wildfire:** Detections are labeled "thermal anomalies" or "hotspots" and include agricultural burning, gas flares, and volcanoes unless corroborated by independent ground incident reports.

---

## 3. Training & Evaluation Methodology

### 3.1 Dataset & Feature Definition
- **Data Source:** NASA FIRMS Standard Processing (`MODIS_SP`, `VIIRS_SNPP_SP`, `VIIRS_NOAA20_SP`).
- **Aggregated Spatiotemporal Units:** Equal-area grid cells (~1 km to 5 km) aggregated by calendar month/week.
- **Engineered Features (for Optional Anomaly Model):**
  - `harmonized_active_cells`: Count of unique occupied cells per grid-month.
  - `mean_frp_mw`: Average Fire Radiative Power across detections.
  - `max_frp_mw`: Peak observed FRP.
  - `cyclical_month_sin`, `cyclical_month_cos`: Seasonal cycle encoding.
  - `sensor_coverage_ratio`: Fractional days with valid satellite overpasses.

### 3.2 Holdout Strategy & Leakage Prevention
- **Time-Based Splitting:** Training and baseline fitting must exclusively use historical periods (e.g., 2012–2020), while evaluation is performed on held-out subsequent years (e.g., 2021–2024).
- **No Random K-Fold Splits:** Random row-level splitting is strictly prohibited because spatial and temporal autocorrelation across neighboring hotspots leaks information between training and testing folds, producing artificially inflated performance metrics.

### 3.3 Evaluation Metrics
- **Robust Baseline:** Residual error against historical distributions; stability across varying historical window lengths (3 vs 5 vs 10 years).
- **FRP Calibration (if enabled):**
  - Mean Absolute Error (MAE) in MW.
  - Root Mean Square Error (RMSE) in MW.
  - Mean Bias Error (MBE).
  - *Acceptance Criterion:* Calibration is enabled only if held-out RMSE decreases by at least 15% without introducing systematic negative FRP bias.

---

## 4. Scientific Limitations & Caveats

1. **Orbital & Cloud Blind Spots:** Satellites cannot observe fires through thick cloud cover or dense pyrocumulus smoke plumes. A "zero detection" day may reflect total cloud obscuration rather than fire absence.
2. **Diurnal Cycle Timing:** Terra passes around 10:30 AM/PM, whereas Aqua and VIIRS pass around 1:30 AM/PM. Wildfires typically peak in intensity and spread during late afternoon (15:00–18:00 local time), which falls between or after satellite overpasses.
3. **Small & Low-Intensity Fires:** Understory ground fires or agricultural burns smaller than the thermal detection threshold of MODIS (or hidden under dense tree canopy) are frequently undetected.
4. **Historical Baseline Asymmetry:** Historical records prior to 2012 rely solely on MODIS. Comparing 2024 VIIRS-inclusive burning records directly to a 2005 MODIS-only baseline without grid cell harmonization introduces severe false-positive anomaly alerts.
