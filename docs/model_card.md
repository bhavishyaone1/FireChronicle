# FireChronicle — Model Card & Algorithmic Governance
**Document:** Model Card for FireChronicle Context Inference Engine  
**Release:** Version 1.0 (MVP)  
**Date:** 09 November 2026  
**Type:** Rule-Based Expert Evidence Classifier with Auditable Provenance  

---

## 1. Model Details

### 1.1 Model Description
The FireChronicle Context Inference Engine is a deterministic, rule-based expert system designed to assign cautious contextual classifications to satellite active-fire / thermal-anomaly observations over the Republic of India.

### 1.2 Decision on Machine Learning (ML) Model Training
> **Scientific Integrity Decision:**  
> In accordance with the FireChronicle MVP Specification (Part F, Section 26 & 29), **no black-box machine learning model (e.g. Random Forest, XGBoost, or Deep Neural Network) was trained on raw satellite hotspot points to predict fire occurrence or fire cause.**
>
> **Rationale:**
> 1. **Absence of Independent Ground Truth:** Publicly available satellite thermal anomaly points (FIRMS, Bhuvan, FSI alerts) are themselves derived from satellite infrared observations. Training a classifier on one satellite product to predict another produces circular reasoning and label leakage, not true ground validation.
> 2. **Field Verification Scarcity:** Ground-truth incident records from State Forest Departments and Fire Services across all Indian districts are not systematically consolidated with sub-kilometer geographic coordinates and sub-hour precision.
> 3. **High Cost of False Confidences:** In scientific and tactical monitoring, black-box confidence scores can mislead decision-makers. A transparent, rules-based engine with verifiable evidence tags provides complete explainability and auditability.

When sufficient independently verified ground-truth incident datasets (with GPS coordinates, verified fuel type, and cause investigation) become available through official partnerships, a supervised classifier can be benchmarked against this rule baseline.

---

## 2. Intended Use & Boundaries

### 2.1 Intended Use
- Assign provisional, explainable context categories (`FSI_SUPPORTED_FOREST_ALERT`, `BHUVAN_AGRICULTURAL_FIRE_RECORD`, `LIKELY_FOREST_CONTEXT`, `LIKELY_AGRICULTURAL_CONTEXT`, `OTHER_STATIC_THERMAL_SOURCE`, `UNCLASSIFIED`) to satellite detections.
- Surface supporting evidence tags for each observation so analysts understand *why* a classification was assigned.
- Assist forest officers, researchers, and environmental analysts in filtering agricultural residue burning from forest canopy fires during overlapping seasonal windows.

### 2.2 Prohibited & Out-of-Scope Uses
- **Wildfire Ignition Prediction:** The engine does not predict future fire ignitions.
- **Emergency Dispatch Automation:** Must not be used as an automated trigger for emergency deployment without human verification.
- **Arson or Criminal Cause Attribution:** Cannot infer deliberate human intent or legal culpability.
- **Direct Flame Temperature Estimation:** Satellite brightness temperature must never be cited as flame combustion temperature.

---

## 3. Factors, Features & Evidence Logic

| Context Class | Evaluation Rule & Evidence Criteria | Required Evidence Tags | Default Confidence |
|---------------|-------------------------------------|------------------------|--------------------|
| `FSI_SUPPORTED_FOREST_ALERT` | Direct join with an official Forest Survey of India (Van Agni) alert bulletin within 500 m and same calendar day. | `FSI_ALERT_OVERLAP` | `HIGH` |
| `BHUVAN_AGRICULTURAL_FIRE_RECORD` | Direct join with an ISRO Bhuvan Active Agricultural Fire record within 750 m during Rabi/Kharif window. | `BHUVAN_ACTIVE_AGRICULTURAL_FIRE_OVERLAP` | `HIGH` |
| `LIKELY_FOREST_CONTEXT` | Located within mapped forest boundary (Bhuvan Forest Type or FSI fire-prone forest tract) AND not identified as static thermal source. | `FOREST_TYPE_LAYER_OVERLAP`, `LAND_COVER_TREE_COVER` | `MEDIUM` |
| `LIKELY_AGRICULTURAL_CONTEXT` | Located in major agricultural state (Punjab, Haryana, UP, MP, Rajasthan) AND observed during declared crop-burning seasons (Kharif: 15 Sep–30 Nov; Rabi: 01 Apr–30 May) AND land cover is cropland. | `CROP_SEASON_MATCH`, `LAND_COVER_CROPLAND` | `MEDIUM` |
| `OTHER_STATIC_THERMAL_SOURCE` | NASA standard type `2` (static land source) OR detected repeatedly at a known industrial plant/refinery/mine footprint. | `NASA_TYPE_FIELD`, `INDUSTRIAL_OR_MINING_CONTEXT` | `HIGH` |
| `OFFSHORE` | NASA standard type `3` OR located in marine waters > 5 km from coastline. | `NASA_TYPE_FIELD` | `HIGH` |
| `VOLCANIC` | NASA standard type `1` AND located within Barren Island volcano perimeter (Andaman Sea). | `NASA_TYPE_FIELD` | `HIGH` |
| `UNCLASSIFIED` | Insufficient overlapping contextual evidence, ambiguous multi-class landcover, or outside declared agricultural seasons. | None | `INSUFFICIENT` |

---

## 4. Cross-Sensor Harmonization & Matching Specifications

### 4.1 Matching Algorithms
1. **Greedy 1-to-Many Nearest-Neighbor (Baseline):**
   - Maps fine-scale VIIRS (375 m) detections to parent MODIS (1.0 km) footprints within spatial envelope $d_{\text{limit}}$ and temporal window $\Delta t_{\text{max}} \le 60\text{ min}$.
   - Preserves fine-scale sub-pixel flame front cluster morphology without synthesizing non-existent observations.
2. **Global Optimal Bipartite Assignment (Hungarian Algorithm):**
   - Formulates cost matrix $C_{ij} = 1.0 - \text{score}(m_i, v_j)$ and solves via `scipy.optimize.linear_sum_assignment` for strict 1-to-1 pairing.

### 4.2 Panoramic Scan Angle & Footprint Growth Mechanics
Off-nadir pixel growth is explicitly modeled from source `scan` and `track` parameters:
$$d_{\text{envelope}} = \frac{1}{2}\sqrt{\text{scan}_{\text{MODIS}}^2 + \text{track}_{\text{MODIS}}^2} + \frac{1}{2}\sqrt{\text{scan}_{\text{VIIRS}}^2 + \text{track}_{\text{VIIRS}}^2}$$
Effective spatial threshold: $d_{\text{limit}} = \max(\text{spatial\_tolerance\_m}, d_{\text{envelope}})$.
Solar overpass constraint: Observations must have matching `daynight` tags (Day vs Night overpasses are 12 hours apart in local solar time and cannot match).

### 4.3 Uncertainty Quantification
- Every statistic reports sample size $n$.
- Matched fractions and spatial Jaccard agreement include 95% bootstrap confidence intervals derived from 1,000 Monte Carlo resamples with fixed pseudo-random seeds.

### 4.4 Confidence Categorization & Filtering
- **MODIS C6.1:** Numeric confidence (0–100). Low: 0–29; Nominal: 30–79; High: 80–100.
- **VIIRS C2:** Categorical confidence (`l` = Low, `n` = Nominal, `h` = High).
- Users can toggle `exclude_low_confidence=True` to evaluate sensitivity to ambiguous detections.

### 4.5 Fire Radiative Power (FRP) Conservation
- **Strict Prohibition of Cross-Sensor Summation:** FRP estimates from collocated MODIS and VIIRS passes are never summed together.
- Summarized as sensor-specific quantile distributions and grid-cell maxima.

### 4.6 Observational Null State ("No Detection != No Fire")
- Explicit distinction between verified absence of thermal anomaly during clear-sky overpasses (`CoverageStatus.FULL`) and absence of observation due to cloud obscuration (`CoverageStatus.CLOUD_OBSCURED`) or missing orbital swath (`CoverageStatus.NO_PASS`).

---

## 5. Algorithmic Governance & Audit Trail
Every classification decision output by the API contains:
1. `context_class`: The categorical designation;
2. `context_evidence`: An explicit array of evidence tags;
3. `context_confidence`: An honest uncertainty metric (`HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT`);
4. `provenance`: Timestamp of rule evaluation, source version, and archive SHA256 checksum.
