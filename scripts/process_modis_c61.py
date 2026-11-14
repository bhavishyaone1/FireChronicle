#!/usr/bin/env python3
"""
Process and inventory the MODIS Collection 6.1 active-fire archive:
data/raw/firms/DL_FIRE_M-C61_841318.zip
"""

import os
import sys
import hashlib
import zipfile
import json
import math
from pathlib import Path
import pandas as pd
import numpy as np

DATA_DIR = Path("data")
MODIS_ZIP = DATA_DIR / "raw" / "firms" / "DL_FIRE_M-C61_841318.zip"
EXTRACTED_DIR = DATA_DIR / "extracted" / "modis_c61"
REPORTS_DIR = Path("reports")
DOCS_DATA_DIR = Path("docs") / "data"

# Official Republic of India Bounding Envelope
INDIA_BBOX = [68.1, 6.5, 97.4, 37.1]  # [west, south, east, north]


def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(1024 * 1024):
            sha.update(chunk)
    return sha.hexdigest()


def main():
    print(f"=== Inspecting MODIS Archive: {MODIS_ZIP} ===")
    if not MODIS_ZIP.exists():
        print(f"ERROR: {MODIS_ZIP} does not exist.")
        sys.exit(1)

    file_size = MODIS_ZIP.stat().st_size
    print(f"Archive file size: {file_size:,} bytes ({file_size / (1024*1024):.2f} MB)")

    print("Computing SHA-256 checksum...")
    sha256 = compute_sha256(MODIS_ZIP)
    print(f"SHA-256: {sha256}")

    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    members_info = []

    with zipfile.ZipFile(MODIS_ZIP, "r") as zf:
        print("\nListing archive members:")
        for info in zf.infolist():
            print(f" - {info.filename}: {info.file_size:,} bytes (compressed: {info.compress_size:,} bytes)")
            # Safety check
            norm = os.path.normpath(info.filename)
            if norm.startswith("..") or os.path.isabs(norm):
                raise ValueError(f"Unsafe path in ZIP: {info.filename}")
            
            # Extract safely
            dest = EXTRACTED_DIR / norm
            if not str(dest.resolve()).startswith(str(EXTRACTED_DIR.resolve())):
                raise ValueError(f"Escapes target: {info.filename}")
            
            zf.extract(info, EXTRACTED_DIR)
            members_info.append({
                "name": info.filename,
                "uncompressed_bytes": info.file_size,
                "compressed_bytes": info.compress_size,
                "crc": info.CRC,
                "local_path": str(dest),
            })

    print(f"\nExtracted {len(members_info)} member(s) to {EXTRACTED_DIR}")

    # Inspect extracted files
    csv_files = list(EXTRACTED_DIR.glob("*.csv")) + list(EXTRACTED_DIR.glob("*.txt"))
    shp_files = list(EXTRACTED_DIR.glob("*.shp"))

    analysis = {
        "archive_filename": MODIS_ZIP.name,
        "archive_size_bytes": file_size,
        "sha256": sha256,
        "members": members_info,
        "csv_files": [],
        "shp_files": [str(s.name) for s in shp_files],
    }

    for cf in csv_files:
        print(f"\n--- Inspecting tabular member: {cf.name} ---")
        # Read header and first 5 rows to detect delimiter and columns
        with open(cf, "r", encoding="utf-8", errors="replace") as f:
            first_line = f.readline().strip()
            second_line = f.readline().strip()

        delimiter = "," if "," in first_line else "\t"
        columns = [c.strip() for c in first_line.split(delimiter)]
        print(f"Detected columns ({len(columns)}): {columns}")
        print(f"Sample row 1: {second_line}")

        # Stream / chunk through dataset to compute exact statistics
        total_rows = 0
        min_date = None
        max_date = None
        unique_dates = set()
        min_lat = float("inf")
        max_lat = float("-inf")
        min_lon = float("inf")
        max_lon = float("-inf")
        india_rows = 0
        satellites = {}
        daynight_dist = {}
        confidence_dist = {"low": 0, "nominal": 0, "high": 0, "other": 0}
        total_frp = 0.0
        frp_count = 0
        min_frp = float("inf")
        max_frp = float("-inf")
        brightness_count = 0
        bright_t31_count = 0
        type_dist = {}

        chunk_size = 50000
        for chunk in pd.read_csv(cf, sep=delimiter, chunksize=chunk_size, low_memory=False):
            total_rows += len(chunk)
            
            # Dates
            if "acq_date" in chunk.columns:
                dates = chunk["acq_date"].astype(str).tolist()
                chunk_min_date = min(dates)
                chunk_max_date = max(dates)
                min_date = chunk_min_date if min_date is None else min(min_date, chunk_min_date)
                max_date = chunk_max_date if max_date is None else max(max_date, chunk_max_date)
                unique_dates.update(dates)

            # Coordinates
            lat_col = "latitude" if "latitude" in chunk.columns else "lat"
            lon_col = "longitude" if "longitude" in chunk.columns else "lon"
            if lat_col in chunk.columns and lon_col in chunk.columns:
                valid_coords = chunk[chunk[lat_col].notna() & chunk[lon_col].notna()]
                min_lat = min(min_lat, valid_coords[lat_col].min())
                max_lat = max(max_lat, valid_coords[lat_col].max())
                min_lon = min(min_lon, valid_coords[lon_col].min())
                max_lon = max(max_lon, valid_coords[lon_col].max())

                # India Envelope filter
                in_india = (
                    (valid_coords[lon_col] >= INDIA_BBOX[0]) &
                    (valid_coords[lon_col] <= INDIA_BBOX[2]) &
                    (valid_coords[lat_col] >= INDIA_BBOX[1]) &
                    (valid_coords[lat_col] <= INDIA_BBOX[3])
                )
                india_rows += int(in_india.sum())

            # Satellites
            if "satellite" in chunk.columns:
                for sat, count in chunk["satellite"].value_counts().items():
                    satellites[str(sat)] = satellites.get(str(sat), 0) + int(count)

            # Day/Night
            if "daynight" in chunk.columns:
                for dn, count in chunk["daynight"].value_counts().items():
                    daynight_dist[str(dn)] = daynight_dist.get(str(dn), 0) + int(count)

            # Confidence
            if "confidence" in chunk.columns:
                for conf in chunk["confidence"]:
                    try:
                        c = float(conf)
                        if c < 30:
                            confidence_dist["low"] += 1
                        elif c < 80:
                            confidence_dist["nominal"] += 1
                        else:
                            confidence_dist["high"] += 1
                    except (ValueError, TypeError):
                        confidence_dist["other"] += 1

            # FRP
            if "frp" in chunk.columns:
                frp_series = pd.to_numeric(chunk["frp"], errors="coerce").dropna()
                if len(frp_series) > 0:
                    frp_count += len(frp_series)
                    total_frp += float(frp_series.sum())
                    min_frp = min(min_frp, float(frp_series.min()))
                    max_frp = max(max_frp, float(frp_series.max()))

            # Brightness channels
            if "brightness" in chunk.columns:
                brightness_count += int(chunk["brightness"].notna().sum())
            if "bright_t31" in chunk.columns:
                bright_t31_count += int(chunk["bright_t31"].notna().sum())

            # Type field
            if "type" in chunk.columns:
                for t, count in chunk["type"].value_counts().items():
                    type_dist[str(t)] = type_dist.get(str(t), 0) + int(count)

        csv_summary = {
            "filename": cf.name,
            "total_rows": total_rows,
            "columns": columns,
            "min_date": min_date,
            "max_date": max_date,
            "unique_date_count": len(unique_dates),
            "coord_bounds": {
                "min_lat": round(min_lat, 5) if min_lat != float("inf") else None,
                "max_lat": round(max_lat, 5) if max_lat != float("-inf") else None,
                "min_lon": round(min_lon, 5) if min_lon != float("inf") else None,
                "max_lon": round(max_lon, 5) if max_lon != float("-inf") else None,
            },
            "india_envelope_record_count": india_rows,
            "india_envelope_percentage": round((india_rows / total_rows * 100), 2) if total_rows > 0 else 0,
            "satellites": satellites,
            "daynight_distribution": daynight_dist,
            "confidence_distribution": confidence_dist,
            "frp": {
                "available_count": frp_count,
                "min_mw": round(min_frp, 2) if min_frp != float("inf") else None,
                "max_mw": round(max_frp, 2) if max_frp != float("-inf") else None,
                "mean_mw": round(total_frp / frp_count, 2) if frp_count > 0 else None,
            },
            "brightness_channel_21_22_count": brightness_count,
            "brightness_channel_31_count": bright_t31_count,
            "hotspot_type_distribution": type_dist,
        }
        analysis["csv_files"].append(csv_summary)
        print(f"Summary for {cf.name}: {total_rows:,} rows | Dates: {min_date} to {max_date} | India Envelope: {india_rows:,} ({csv_summary['india_envelope_percentage']}%)")

    # Save JSON summary
    summary_path = DATA_DIR / "manifests" / "modis_c61_inventory.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2)
    print(f"\nWrote MODIS inventory summary to {summary_path}")


if __name__ == "__main__":
    main()
