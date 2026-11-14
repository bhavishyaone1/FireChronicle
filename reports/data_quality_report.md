# FireChronicle Data Quality & Integrity Report

**Date:** 2026-11-09  
**Pipeline:** NASA FIRMS Binary DBF & Geo-Processing Validation Stream  
**Target Dataset:** MODIS C6.1 (`138,194 records`) & VIIRS J1V-C2 (`995,447 records`)  

---

## 1. Data Cleaning & Validation Audit

| Validation Check | Target Domain / Rule | MODIS C6.1 Result | VIIRS J1V-C2 Result | Disposition |
| :--- | :--- | :--- | :--- | :--- |
| **Coordinate Bounds** | Lat: \[-90, 90\], Lon: \[-180, 180\] | 0 invalid rows | 0 invalid rows | **Passed (100% valid)** |
| **Geographic Filtering** | Within India: \[68.1, 6.5, 97.4, 37.1\] | 138,194 valid in-bounds | 995,447 valid in-bounds | **Verified Subset** |
| **Timestamp Parsing** | 4-digit HHMM UTC (0000–2359) | 0 malformed times | 0 malformed times | **Passed (100% valid)** |
| **Date Parsing** | ISO-8601 YYYY-MM-DD | 0 malformed dates | 0 malformed dates | **Passed (100% valid)** |
| **Brightness Temp 1** | Kelvin: $200.0\text{ K} \le T \le 370.0\text{ K}$ | 0 suspect values | 0 suspect values | **Passed** |
| **Brightness Temp 2** | Kelvin: $150.0\text{ K} \le T \le 380.0\text{ K}$ | 0 suspect values | 0 suspect values | **Passed** |
| **FRP Numeric Sanity** | Non-negative: $\text{FRP} \ge 0.0\text{ MW}$ | 0 negative values | 0 negative values | **Passed** |
| **Missing Fields** | Standard vs NRT schema difference | `TYPE` null in NRT (11,381 rows) | `TYPE` absent in C2 (treated as null) | **Preserved as Null** |
| **Duplicate Records** | Deterministic SHA-256 Observation ID | 0 accidental collisions | 0 accidental collisions | **100% Unique Keys** |

---

## 2. Radiometric Physics Verification

> [!NOTE]
> All brightness temperatures extracted from both standard and near-real-time streams are stored and rendered strictly in Kelvin ($K$).
> - **MODIS Channel 21/22:** Mean = $328.6\text{ K}$, Min = $300.0\text{ K}$, Max = $364.5\text{ K}$.
> - **VIIRS Band I-4:** Mean = $334.2\text{ K}$, Min = $295.4\text{ K}$, Max = $367.0\text{ K}$.
> None of these radiometric measurements have been conflated with or mislabeled as flame combustion temperatures or ambient surface temperatures.
