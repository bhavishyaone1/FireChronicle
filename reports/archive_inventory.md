# NASA FIRMS Raw Archive & Ingestion Inventory

**Date of Verification:** 2026-11-09  
**Ingestion Pipeline Version:** 1.0.0  
**Verification Status:** 100% Verified against NASA EOSDIS Headers & Digital Signatures  

---

## 1. Raw Archive Integrity & Provenance

| Archive Name | Product Family | Size (Bytes) | Size (MB) | SHA-256 Checksum | Extraction Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DL_FIRE_M-C61_841318.zip` | MODIS Collection 6.1 (Terra/Aqua) | 131,035,671 | 124.97 MB | `201810fb5cc8421bd0680ad411da247b0c7a8474ab3b3d254479728a973882cb` | Complete (`data/extracted/modis_c61/`) |
| `DL_FIRE_J1V-C2_841340.zip` | VIIRS Collection 2 (NOAA-20 / JPSS-1) | 721,620,438 | 688.19 MB | `51a5643f710cc6672c07db14c3afa0d073c319ad274b3adbc93241529562b529` | Complete (`data/extracted/viirs_j1_c2/`) |

---

## 2. Extracted Member Inventory & Sidecar Verification

### Archive 1: MODIS Collection 6.1 (`DL_FIRE_M-C61_841318.zip`)
- **Extraction Target:** `data/extracted/modis_c61/`
- **Total Members:** 11 files
- **Encoding:** UTF-8 / ASCII (`.cpg` specifies ANSI / UTF-8)
- **Coordinate Reference System:** WGS 84 (`EPSG:4326`) verified via `.prj` (`GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]]`)

| Member Filename | File Type | Size (Bytes) | Role / Content |
| :--- | :--- | :--- | :--- |
| `fire_archive_M-C61_841318.dbf` | dBase Table | 715,323,123 | Standard science data (2,649,343 records; includes `TYPE` field) |
| `fire_archive_M-C61_841318.shp` | ESRI Shapefile | 74,181,704 | Hotspot point geometries (WGS 84) |
| `fire_archive_M-C61_841318.shx` | Shape Index | 21,194,844 | Positional index |
| `fire_archive_M-C61_841318.prj` | Projection | 256 | Coordinate definition (`EPSG:4326`) |
| `fire_archive_M-C61_841318.cpg` | Code Page | 5 | Character encoding |
| `fire_nrt_M-C61_841318.dbf` | dBase Table | 194,405,601 | Near-Real-Time stream (747,712 records; lacks `TYPE` field) |
| `fire_nrt_M-C61_841318.shp` | ESRI Shapefile | 20,936,036 | NRT point geometries |
| `fire_nrt_M-C61_841318.shx` | Shape Index | 5,981,796 | NRT positional index |
| `fire_nrt_M-C61_841318.prj` | Projection | 256 | Coordinate definition (`EPSG:4326`) |
| `fire_nrt_M-C61_841318.cpg` | Code Page | 5 | Character encoding |
| `Readme.txt` | Text | 89 | NASA FIRMS citation & terms of use notice |

### Archive 2: VIIRS JPSS-1/NOAA-20 Collection 2 (`DL_FIRE_J1V-C2_841340.zip`)
- **Extraction Target:** `data/extracted/viirs_j1_c2/`
- **Total Members:** 11 files
- **Encoding:** UTF-8 / ASCII
- **Coordinate Reference System:** WGS 84 (`EPSG:4326`) verified via `.prj`

| Member Filename | File Type | Size (Bytes) | Role / Content |
| :--- | :--- | :--- | :--- |
| `fire_archive_J1V-C2_841340.dbf` | dBase Table | 2,961,642,203 | Standard science data (11,434,910 records; Band I-4/I-5 Kelvin, FRP, scan/track) |
| `fire_archive_J1V-C2_841340.shp` | ESRI Shapefile | 320,177,580 | 375 m pixel centroid geometries |
| `fire_archive_J1V-C2_841340.shx` | Shape Index | 91,479,380 | Positional index |
| `fire_archive_J1V-C2_841340.prj` | Projection | 256 | Coordinate definition (`EPSG:4326`) |
| `fire_archive_J1V-C2_841340.cpg` | Code Page | 5 | Character encoding |
| `fire_nrt_J1V-C2_841340.dbf` | dBase Table | 1,820,944,199 | Near-Real-Time stream (7,197,406 records) |
| `fire_nrt_J1V-C2_841340.shp` | ESRI Shapefile | 201,527,468 | NRT point geometries |
| `fire_nrt_J1V-C2_841340.shx` | Shape Index | 57,579,348 | NRT positional index |
| `fire_nrt_J1V-C2_841340.prj` | Projection | 256 | Coordinate definition (`EPSG:4326`) |
| `fire_nrt_J1V-C2_841340.cpg` | Code Page | 5 | Character encoding |
| `Readme.txt` | Text | 89 | NASA FIRMS citation notice |

---

## 3. Numeric Ingestion Summary

```
Total Global Raw Records Ingested:    22,029,371 records
  - MODIS C6.1 Total:                  3,397,055 records
  - VIIRS J1V-C2 Total:               18,632,316 records

Total Extracted India Hotspots:        1,133,641 records
  - MODIS India Total:                   138,194 records ( 4.07% of global archive )
  - VIIRS India Total:                   995,447 records ( 5.34% of global archive )
```
