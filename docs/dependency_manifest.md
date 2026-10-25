# Dependency Manifest & Compatibility Plan

**System:** FireChronicle  
**Stack:** FastAPI (Backend) + Next.js (Frontend) + DuckDB/Parquet (Storage & Analytics)  
**Host Environment:** Windows 11 (64-bit AMD64), Python 3.11.9, Node.js v24.18.0, npm 11.16.0  
**Status:** Pre-Hackathon Preparation Specification (Strict separation between verified/installed and planned dependencies)

---

## 1. Backend Dependency Manifest (Python)

### 1.1 Currently Verified & Installed in `.venv`
These packages are physically installed in `c:\Users\bhavishya\Downloads\PROJECTS\Nasa\.venv` and tested with Python 3.11.9:
- `python` == 3.11.9 (Verified via `.\.venv\Scripts\python.exe`)
- `pip` == 24.0 (Verified via `.\.venv\Scripts\python.exe -m pip --version`)
- `setuptools` == 65.5.0 (Verified in `.venv`)

### 1.2 Planned Backend Packages (To be installed on Hackathon Build Day)
*Note: These packages have NOT been installed in preparation mode to avoid pre-building the solution.*

| Package Category | Planned Package | Target Version | Compatibility Justification & Windows 11 Wheel Status |
| :--- | :--- | :--- | :--- |
| **API Framework** | `fastapi` | `~=0.115.0` | Pure Python + Cython dependencies; universal wheel support. |
| **ASGI Server** | `uvicorn[standard]` | `~=0.32.0` | Standard ASGI server with `uvloop` fallback (uses `asyncio` default on Windows). |
| **Validation** | `pydantic` | `~=2.9.0` | High-speed Rust-backed core (`pydantic-core`) with pre-built Windows x64 wheels. |
| **Settings** | `pydantic-settings` | `~=2.5.0` | Environment variable and `.env` parsing. |
| **Analytics Engine**| `duckdb` | `~=1.1.0` | Embedded vectorized OLAP database; pre-compiled Windows x64 wheel; direct Parquet/CSV querying without RAM bloat. |
| **Columnar Storage**| `pyarrow` | `~=17.0.0` | High-throughput columnar memory and Parquet I/O with binary Windows wheels. |
| **Tabular Data** | `pandas` | `~=2.2.0` | Standard data manipulation; pre-compiled wheels for Python 3.11. |
| **Numerical Math** | `numpy` | `~=2.1.0` or `<2.0.0` | Pin compatible with SciPy and GeoPandas wheels. |
| **Statistics** | `scipy` | `~=1.14.0` | Robust statistical functions (median, MAD, IQR) for seasonal anomaly baseline. |
| **Geospatial Math** | `shapely` | `~=2.0.6` | Fast geometric operations with pre-compiled GEOS C-library binaries for Windows. |
| **Projections** | `pyproj` | `~=3.6.1` | Geodetic distance calculations with pre-compiled PROJ binaries for Windows. |
| **Geo DataFrames** | `geopandas` | `~=1.0.1` | Pure Python layer atop Shapely/pyproj/PyArrow. |
| **HTTP Client** | `httpx` | `~=0.27.0` | Async HTTP client for NASA FIRMS Area and Availability APIs. |
| **Optional ML** | `scikit-learn` | `~=1.5.0` | IsolationForest & robust regressors; optional, only if justified on held-out data. |
| **Testing** | `pytest` | `~=8.3.0` | Test framework for unit, schema, and harmonization tests. |
| **Linting & Types** | `ruff`, `mypy` | Latest stable | Fast Python linter, formatter, and static type checker. |

---

## 2. Frontend Dependency Manifest (Node.js / React)

### 2.1 Currently Verified & Installed Globally / System
- `node` == `v24.18.0` (Verified via `node -e`)
- `npm` == `11.16.0` (Verified via `npm.cmd --version`)

### 2.2 Planned Frontend Packages (To be initialized on Hackathon Build Day)
*Note: `package.json` and `node_modules/` will be initialized in `frontend/` once the hackathon build phase starts.*

| Package Category | Planned Package | Target Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Core Framework** | `next` | `~15.0.0` or `~14.2.0` | React server-side rendering, routing, and static generation. |
| **UI Library** | `react`, `react-dom`| `~19.0.0` or `~18.3.0` | Interactive UI component framework. |
| **Type Checking** | `typescript`, `@types/react` | `^5.0.0` | Static typing and compile-time contract enforcement. |
| **CSS Framework** | `tailwindcss`, `postcss`, `autoprefixer` | `^3.4.0` | Responsive utility-first styling for dark-mode dashboard. |
| **Geospatial Map** | `maplibre-gl` | `^4.7.0` | High-performance WebGL client map for rendering hotspot points, footprints, and GIBS tiles. |
| **Map Typings** | `@types/maplibre-gl`| `^3.4.0` | Strict TypeScript types for map layers and GeoJSON events. |
| **Charts** | `recharts` | `^2.13.0` | Visualizing burning-activity calendar time series and FRP distributions. |
| **Icons** | `lucide-react` | `^0.450.0` | Accessible iconography for sensor filters, calendar toggles, and metadata badges. |

---

## 3. Host System Compatibility & Resource Constraints

### 3.1 Memory Management Plan (8 GB Physical RAM / ~1.9 GB Free)
- **Bottleneck Identified:** The machine has ~1.92 GB of currently available physical RAM. Loading uncompressed global satellite active fire CSVs (hundreds of megabytes to gigabytes) directly into a pandas DataFrame would risk `OutOfMemoryError` or heavy paging.
- **Engineered Solution:**
  1. **DuckDB Streaming:** Query Parquet files directly using DuckDB's streaming query engine with memory limit set:
     ```python
     conn.execute("SET max_memory = '1GB';")
     ```
  2. **Bounded Ingestion:** NASA FIRMS Area API queries will be restricted to bounded bounding boxes and maximum 5-day chunks, saving directly to disk in `data/raw/`.
  3. **Chunked Normalization:** Ingestion and schema conversion to Parquet will process records in bounded 50,000-row chunks.

### 3.2 Windows Platform & Shell Compatibility
- **PowerShell Execution Policy:** On Windows, running `npm.ps1` triggers `UnauthorizedAccess`.
  - *Standard Solution:* All automated scripts, README commands, and package operations will invoke `npm.cmd` directly.
- **C-Extension Wheels:** Python 3.14 on Windows frequently lacks pre-built wheels for GDAL/PROJ.
  - *Standard Solution:* Python 3.11.9 is explicitly pinned and isolated in `.venv`, where all planned geospatial libraries (`shapely`, `pyproj`, `geopandas`, `duckdb`) provide pre-built binary wheels.
