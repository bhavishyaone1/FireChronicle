# Environment & Tooling Verification

**Host System:** Windows 11 (64-bit, AMD64)  
**Workspace Path:** `c:\Users\bhavishya\Downloads\PROJECTS\Nasa`  
**Operating Mode:** `PRE_HACKATHON_PREPARATION`  
**Inspection Date:** 2026-10-25

---

## 1. Hardware & System Resources

- **OS Platform:** Windows_NT 10.0 (Windows 11, PowerShell shell)
- **CPU / Arch:** 64-bit AMD64
- **Physical Memory (RAM):**
  - Total Visible: 8.16 GB (~8,166,712 KB)
  - Free Physical: ~1.92 GB (~1,924,300 KB)
  - *Recommendation:* Keep in-memory DataFrames bounded; stream or partition analytical queries using DuckDB and Parquet rather than loading multi-gigabyte pandas DataFrames into memory.
- **Disk Storage (Drive C:):**
  - Used: 426.1 GB
  - Free: 49.3 GB
  - *Status:* Sufficient storage for local development, packages, and cached AOI data slices.

---

## 2. Installed Development Toolchains

### 2.1 Python Environment
- **System Pythons Detected:**
  - Python 3.14.6 (tags/v3.14.6) at `C:\Users\bhavishya\AppData\Local\Programs\Python\Python314\python.exe`
  - Python 3.13 (64-bit)
  - Python 3.11.9 (Microsoft Store) at `C:\Users\bhavishya\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\python.exe`
- **Selected Python for FireChronicle:** **Python 3.11.9**
  - *Reasoning:* Python 3.11 has full binary wheel support on Windows for core geospatial libraries (`geopandas`, `shapely`, `pyproj`, `scipy`, `duckdb`, `pyarrow`, `fastapi`). Newer versions (like 3.14) frequently encounter C-extension compilation errors for GDAL/geopandas on Windows.
- **Dedicated Project Virtual Environment:**
  - Path: `c:\Users\bhavishya\Downloads\PROJECTS\Nasa\.venv`
  - Python Executable: `.\.venv\Scripts\python.exe` (Python 3.11.9)
  - Pip Version: 24.0
  - Activation Command: `.\.venv\Scripts\Activate.ps1` (or direct execution via `.\.venv\Scripts\python.exe`)

### 2.2 Node.js & Frontend Environment
- **Node.js:** `v24.18.0`
- **Package Manager:** `npm` version `11.16.0`
- **PowerShell Execution Note:**
  - On Windows, PowerShell script execution policies (`Restricted`) may block direct `npm` script invocation (`npm.ps1`).
  - *Verified Fix:* Call `npm.cmd` directly (e.g. `npm.cmd run dev`, `npm.cmd install`) or launch PowerShell with `-ExecutionPolicy Bypass`.

### 2.3 Version Control
- **Git Version:** `2.55.0.windows.3`
- **Repository State:** Initialized at `c:\Users\bhavishya\Downloads\PROJECTS\Nasa\.git`
- **Exclusion Rules:** `.gitignore` active with protection for `.env*`, `.venv/`, raw data, and compilation artifacts.

---

## 3. General Tooling Verification Procedure

### Python Smoke Test
```powershell
.\.venv\Scripts\python.exe -c "import sys; print(f'Python OK: {sys.version}')"
```

### Node.js Smoke Test
```powershell
node -e "console.log('Node OK: ' + process.version)"
npm.cmd --version
```

### Git Verification
```powershell
git status
```
All core general developer tools have been verified and confirmed functional.
