# FireChronicle — Harmonization & Grid Methodology
**Version:** 1.0.0  
**Scope:** Spatial Projection, Cross-Sensor Matching, and Event Grouping  
**Author:** FireChronicle Core Scientific Team  
**Date:** 09 November 2026  

---

## 1. Spatial Harmonization Grid: 1 km Equal-Area Projection

### 1.1 The Area Distortion Problem with Latitude-Longitude Bins
A common naive approach in GIS dashboards is to group coordinates into fixed degree bins (e.g. 0.01° × 0.01°). 
However, because meridians converge towards the poles, the true surface area of a 0.01° × 0.01° bin varies dramatically with latitude:
$$\text{Area}(\phi) \approx (R \cdot \Delta \phi) \cdot (R \cdot \cos\phi \cdot \Delta \lambda)$$
In India, at Cape Comorin ($\approx 8^\circ\text{N}$), $\cos(8^\circ) \approx 0.990$, yielding an area of $\sim 1.22\text{ km}^2$, whereas in northern Kashmir ($\approx 36^\circ\text{N}$), $\cos(36^\circ) \approx 0.809$, shrinking the bin by $\sim 18\%$ to $\sim 1.00\text{ km}^2$. Grouping observations into degree bins distorts density statistics, FRP summations, and comparative hotspot counts between northern and southern Indian states.

### 1.2 Mathematical Formulation of the Lambert Cylindrical Equal-Area (CEA) Grid
FireChronicle implements an authalic equal-area projected grid using standard Lambert Cylindrical Equal-Area geometry on the IUGG/WGS-84 authalic sphere ($R = 6371.0088\text{ km}$):

$$\begin{aligned}
x &= R \cdot \lambda \quad (\text{radians}) \\
y &= R \cdot \sin(\phi) \quad (\text{radians})
\end{aligned}$$

The area differential is given by:
$$dA = dx \cdot dy = (R \cdot d\lambda) \cdot (R \cdot \cos\phi \, d\phi) = R^2 \cos\phi \, d\lambda \, d\phi \equiv dA_{\text{sphere}}$$

Every projected cell defined by $[x_0, x_0 + S] \times [y_0, y_0 + S]$ with $S = 1.0\text{ km}$ covers **exactly $1.0\text{ km}^2$** of true Earth surface area across all of India, regardless of latitude.

### 1.3 Cell Identifier & Boundary Inversion
The discrete cell token is encoded deterministically:
$$\text{Cell ID} = \text{"grid\_1.0km\_"}_j\_i \quad \text{where } i = \lfloor x / S \rfloor, \; j = \lfloor y / S \rfloor$$

Inversion back to geographic coordinates for boundary visualization:
$$\begin{aligned}
\lambda_{\min} &= x_{\min} / R, \quad \lambda_{\max} = x_{\max} / R \\
\phi_{\min} &= \arcsin(y_{\min} / R), \quad \phi_{\max} = \arcsin(y_{\max} / R)
\end{aligned}$$

---

## 2. Cross-Sensor MODIS–VIIRS Correspondence

### 2.1 Sensor Physical Footprint Disparity
- **MODIS (Aqua/Terra):** Nominal nadir footprint is $1000\text{ m} \times 1000\text{ m}$, expanding up to $2000\text{ m} \times 4800\text{ m}$ at swath extremes.
- **VIIRS (NOAA-20/21, S-NPP):** Nominal nadir footprint is $375\text{ m} \times 375\text{ m}$, held to $\le 800\text{ m}$ at swath edge through onboard 3:1 aggregation.

Because of this 7:1 area difference at nadir, **one MODIS fire pixel can encompass multiple contiguous VIIRS fire pixels**. Naively pairing them one-to-one or deduplicating across sensors would discard critical physical combustion dynamics.

### 2.2 Matching Engine: Optimization Architecture
To establish candidate correspondences between MODIS and VIIRS passes:
1. **Candidate Search Window:**
   - Spatial tolerance: $d_{\max} = 1000\text{ m}$ (nominal MODIS pixel radius).
   - Temporal tolerance: $\Delta t_{\max} = 60\text{ minutes}$ (reflecting overlapping orbital overpasses, e.g. Aqua 13:30 local and NOAA-20 13:20 local).
2. **Distance Metric:** Geodesic distance computed via the Haversine formula on the authalic sphere:
   $$d(\mathbf{x}_1, \mathbf{x}_2) = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
3. **Proximity Score:**
   $$S = 1.0 - \left( 0.6 \cdot \frac{d}{d_{\max}} + 0.4 \cdot \frac{\Delta t}{\Delta t_{\max}} \right) \in [0.0, 1.0]$$
4. **Assignment Semantics:**
   - **Global Assignment (Default):** Solved via the Hungarian (Kuhn-Munkres) algorithm maximizing total correspondence score subject to bijective constraints ($N_{\text{pairs}} \le \min(N_{\text{MODIS}}, N_{\text{VIIRS}})$).
   - **Greedy Nearest Neighbor (Alternative):** Iterative pairing sorted by highest score $S$.
   - **Clustering / Many-to-One:** Unmatched VIIRS pixels falling within an assigned MODIS footprint are tagged as secondary cluster members, preserving subpixel fine-scale structure without double-counting.

---

## 3. Candidate Fire Event Grouping

### 3.1 Inference vs. Incident Confirmation
Satellite thermal anomaly detections from consecutive passes or successive days may represent:
1. A continuous, spreading wildfire;
2. Separate smoldering or flare events in close geographic proximity;
3. Repeat agricultural burns in adjacent agricultural parcels.

FireChronicle groups detections into **Candidate Fire Events** using a spatio-temporal clustering rule rather than declaring confirmed ground fires.

### 3.2 Spatio-Temporal Grouping Parameters
- **Spatial Radius:** $R_{\text{event}} = 1.5\text{ km}$ buffer.
- **Temporal Gap Threshold:** $\Delta T_{\text{gap}} = 24\text{ hours}$ (if no detection occurs within 24 hours, subsequent detections start a new event phase).
- **Attributes Preserved:**
  - `event_id`: Unique cluster identifier.
  - `duration_hours`: Elapsed time between first and last participating detection.
  - `total_detections`: Total number of sensor observations.
  - `participating_sensors`: Unique sensors contributing to the event.
  - `max_frp_mw`: Maximum observed FRP among individual observations (never summed).
  - `is_large_fire_candidate`: FSI indicator (True if cluster contains $\ge 3$ contiguous VIIRS 375m pixels in a single pass).
