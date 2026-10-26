# FireChronicle — Data and Metric Definitions Specification

**Standard:** Geospatial Data Engineer & Scientific Reviewer  
**Context:** NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots  
**Location:** `docs/DATA_AND_METRIC_DEFINITIONS.md`

---

## 1. Data Sources and Provenance Classification

| Provenance Type | Label | Data Origin & Authenticity | User Interface Representation |
|---|---|---|---|
| `LIVE_NASA_FIRMS` | **LIVE NASA FIRMS** | Retrieved in real time via NASA FIRMS REST API using authorized `MAP_KEY`. | Emerald status pill with pulse indicator; verified real-time notice |
| `UPLOADED_NASA_FIRMS_CSV` | **UPLOADED NASA FIRMS CSV** | User-imported NASA FIRMS observation CSV verified by schema parser. | Blue status pill with imported filename and valid row counts |
| `SYNTHETIC_DEMO` | **SYNTHETIC DEMONSTRATION DATA** | Benchmark demonstration fixture for offline evaluation (10–15 Aug 2024). | Amber warning pill explicitly marked *"Illustrative demonstration fixture (not real observations)"* |
| `EMPTY` | **NO OBSERVATIONS** | Database contains zero records matching query filters. | Neutral empty indicator with guidance to adjust filters or import data |

---

## 2. Harmonization Core Metrics

### 1. Raw MODIS Detections
- **Definition:** Total individual thermal infrared anomalies recorded by the Moderate Resolution Imaging Spectroradiometer (MODIS) aboard NASA's Terra and Aqua spacecraft.
- **Nominal Footprint:** $1.0\text{ km} \times 1.0\text{ km}$ at nadir, expanding up to $4.8\text{ km} \times 2.0\text{ km}$ at scan edge.
- **Confidence Range:** Integer percentage ($0\text{–}100\%$). Standardized as: Low ($<30\%$), Nominal ($30\text{–}80\%$), High ($>80\%$).

### 2. Raw VIIRS Detections
- **Definition:** Total individual thermal anomalies recorded by the Visible Infrared Imaging Radiometer Suite (VIIRS) aboard Suomi-NPP, NOAA-20, and NOAA-21.
- **Nominal Footprint:** $375\text{ m} \times 375\text{ m}$ at nadir with pixel aggregation limiting scan-edge growth to $\approx 800\text{ m} \times 800\text{ m}$.
- **Confidence Convention:** Categorical strings (`low`, `nominal`, `high`).

### 3. Candidate Sensor Matches
- **Definition:** Collocated MODIS and VIIRS detections occurring within configured spatio-temporal thresholds:
  $$d \le d_{\max} \quad (1000\text{ m}), \qquad \Delta t \le \Delta t_{\max} \quad (60\text{ minutes})$$
- **Physical Meaning:** A candidate match indicates that both instruments observed thermal radiance from within overlapping instantaneous fields of view during a single orbital overpass window. **It does NOT verify a single isolated physical tree or campfire.**
- **Composite Match Score:**
  $$S = 1.0 - \left( 0.70 \cdot \frac{d}{d_{\max}} + 0.30 \cdot \frac{\Delta t}{\Delta t_{\max}} \right) \in [0.0, 1.0]$$

### 4. Unique Active Grid Cells (1.0 km Equal-Area)
- **Definition:** Distinct spatial grid cells occupied by at least one active hotspot detection during a 24-hour UTC window.
- **Projection:** Lambert Cylindrical Equal-Area (CEA) authalic sphere projection ($R = 6371.0088\text{ km}$):
  $$x = R \cdot \lambda \quad (\text{radians}), \qquad y = R \cdot \sin(\phi) \quad (\text{radians})$$
- **Surface Area Conservation:** Every cell $[x, x + 1.0\text{ km}] \times [y, y + 1.0\text{ km}]$ has an exact surface area of $1.0\text{ km}^2$ anywhere on Earth.
- **Scientific Impact:** Eliminates the **68% point-density inflation bias** caused by sub-kilometer VIIRS pixel oversampling without discarding underlying detection telemetry.

---

## 3. Physical Invariants & Non-Summation Constraint

### Fire Radiative Power (FRP) Non-Summation
- Because VIIRS 375 m pixels cover approximately $1/7\text{th}$ the ground area of a 1 km MODIS pixel, multiple VIIRS detections are frequently collocated within a single MODIS footprint.
- As demonstrated by *Li et al. (Remote Sensing of Environment, 2018)*, summing collocated FRP values introduces severe overestimation bias, and no universal scalar multiplier exists across biomes.
- **Rule:** FireChronicle strictly preserves separate sensor FRP distributions (reporting separate median and 95th percentile metrics) and standardizes activity via equal-area spatial grid cell occupancy. Collocated FRP values are **never additively summed**.

### Absence of Detection &ne; Absence of Fire
- Thick pyrocumulus smoke plumes, cloud decks, and orbital revisit gaps obscure fire fronts from satellite radiometers.
- An area with zero recorded hotspot detections is explicitly reported as "No detections recorded" or "Unobserved coverage," not confirmed fire absence.
