#!/usr/bin/env python3
"""
Inspect, verify, extract, and process NASA FIRMS VIIRS JPSS-1 (NOAA-20) Collection 2 archive:
data/raw/firms/DL_FIRE_J1V-C2_841340.zip
"""

import os
import sys
import struct
import hashlib
import time
import json
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services.india_boundary import attribute_india_jurisdiction, is_within_india
from backend.app.services.context_engine import evaluate_observation_context
from backend.app.services.normalizer import compute_observation_id, compute_grid_cell_id

DATA_DIR = Path("data")
RAW_FIRMS_DIR = DATA_DIR / "raw" / "firms"
VIIRS_ZIP = RAW_FIRMS_DIR / "DL_FIRE_J1V-C2_841340.zip"
EXTRACTED_VIIRS = DATA_DIR / "extracted" / "viirs_j1_c2"
INTERIM_DIR = DATA_DIR / "interim"
REPORTS_DIR = Path("reports")
DOCS_DATA_DIR = Path("docs") / "data"

EXPECTED_SHA256 = "51a5643f710cc6672c07db14c3afa0d073c319ad274b3adbc93241529562b529"
INDIA_BBOX = [68.1, 6.5, 97.4, 37.1]  # [west, south, east, north]


def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(2 * 1024 * 1024):
            sha.update(chunk)
    return sha.hexdigest()


def parse_dbf_header(f) -> Tuple[int, int, int, List[Tuple[str, str, int, int]]]:
    header = f.read(32)
    num_records, header_len, record_len = struct.unpack('<IHH', header[4:12])
    fields = []
    while True:
        field_desc = f.read(32)
        if not field_desc or field_desc[0] == 0x0D:
            break
        fname = field_desc[:11].replace(b'\x00', b'').decode('ascii').strip()
        ftype = chr(field_desc[11])
        flen = field_desc[16]
        fdec = field_desc[17]
        fields.append((fname, ftype, flen, fdec))
    return num_records, header_len, record_len, fields


def safe_extract_zip(zip_path: Path, target_dir: Path) -> List[Dict[str, Any]]:
    target_dir.mkdir(parents=True, exist_ok=True)
    extracted = []
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            norm_name = os.path.normpath(member.filename)
            if norm_name.startswith("..") or os.path.isabs(norm_name):
                raise ValueError(f"Unsafe member path: {member.filename}")
            dest = target_dir / norm_name
            if not str(dest.resolve()).startswith(str(target_dir.resolve())):
                raise ValueError(f"Member path escapes target directory: {member.filename}")
            zf.extract(member, target_dir)
            extracted.append({
                "filename": member.filename,
                "file_size": member.file_size,
                "compress_size": member.compress_size,
                "crc": member.CRC,
            })
    return extracted


def process_viirs_dbf(dbf_path: Path, is_nrt: bool = False) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    print(f"\nScanning VIIRS DBF {dbf_path.name}...")
    t0 = time.time()

    with open(dbf_path, "rb") as f:
        num_records, header_len, record_len, fields = parse_dbf_header(f)
        f.seek(header_len)

        offsets = {}
        curr = 1
        for name, ftype, flen, fdec in fields:
            offsets[name] = (curr, curr + flen, ftype)
            curr += flen

        global_stats = {
            "total_records": num_records,
            "min_lat": float("inf"),
            "max_lat": float("-inf"),
            "min_lon": float("inf"),
            "max_lon": float("-inf"),
            "min_date": None,
            "max_date": None,
            "unique_dates": set(),
            "confidence_dist": {},
            "satellites": {},
            "quality_flags": {
                "invalid_coords": 0,
                "invalid_time": 0,
                "suspect_frp": 0,
                "suspect_temp": 0,
            }
        }

        india_records = []
        chunk_records = 50000
        chunk_bytes = chunk_records * record_len

        while True:
            buf = f.read(chunk_bytes)
            if not buf:
                break
            n = len(buf) // record_len

            for i in range(n):
                rec = buf[i * record_len : (i + 1) * record_len]
                if rec[0] == 0x2A: # deleted
                    continue

                # Coordinates
                s_lat, e_lat, _ = offsets.get("LATITUDE", (None, None, None))
                s_lon, e_lon, _ = offsets.get("LONGITUDE", (None, None, None))
                if s_lat is None: continue

                try:
                    lat = float(rec[s_lat:e_lat])
                    lon = float(rec[s_lon:e_lon])
                except ValueError:
                    global_stats["quality_flags"]["invalid_coords"] += 1
                    continue

                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    if lat < global_stats["min_lat"]: global_stats["min_lat"] = lat
                    if lat > global_stats["max_lat"]: global_stats["max_lat"] = lat
                    if lon < global_stats["min_lon"]: global_stats["min_lon"] = lon
                    if lon > global_stats["max_lon"]: global_stats["max_lon"] = lon
                else:
                    global_stats["quality_flags"]["invalid_coords"] += 1
                    continue

                # Acquisition Date
                s_d, e_d, _ = offsets["ACQ_DATE"]
                date_raw = rec[s_d:e_d].decode('ascii', errors='ignore').strip()
                if len(date_raw) == 8:
                    acq_date = f"{date_raw[:4]}-{date_raw[4:6]}-{date_raw[6:8]}"
                else:
                    acq_date = date_raw
                global_stats["unique_dates"].add(acq_date)
                if not global_stats["min_date"] or acq_date < global_stats["min_date"]:
                    global_stats["min_date"] = acq_date
                if not global_stats["max_date"] or acq_date > global_stats["max_date"]:
                    global_stats["max_date"] = acq_date

                # India Envelope check
                if not (INDIA_BBOX[1] <= lat <= INDIA_BBOX[3] and INDIA_BBOX[0] <= lon <= INDIA_BBOX[2]):
                    continue

                s_t, e_t, _ = offsets["ACQ_TIME"]
                acq_time = rec[s_t:e_t].decode('ascii', errors='ignore').strip().zfill(4)

                # Brightness channels: Band I-4 (3.74 um) and Band I-5 (11.45 um)
                # In FIRMS DBF shapefiles, Band I-4 is labeled 'BRIGHTNESS' and Band I-5 is labeled 'BRIGHT_T31'
                s_ti4, e_ti4, _ = offsets.get("BRIGHT_TI4") if "BRIGHT_TI4" in offsets else offsets.get("BRIGHTNESS", (None, None, None))
                try:
                    bright_ti4 = float(rec[s_ti4:e_ti4]) if s_ti4 else None
                except ValueError:
                    bright_ti4 = None

                s_ti5, e_ti5, _ = offsets.get("BRIGHT_TI5") if "BRIGHT_TI5" in offsets else offsets.get("BRIGHT_T31", (None, None, None))
                try:
                    bright_ti5 = float(rec[s_ti5:e_ti5]) if s_ti5 else None
                except ValueError:
                    bright_ti5 = None

                s_sc, e_sc, _ = offsets.get("SCAN", (None, None, None))
                try:
                    scan = float(rec[s_sc:e_sc]) if s_sc else None
                except ValueError:
                    scan = None

                s_tr, e_tr, _ = offsets.get("TRACK", (None, None, None))
                try:
                    track = float(rec[s_tr:e_tr]) if s_tr else None
                except ValueError:
                    track = None

                s_sat, e_sat, _ = offsets.get("SATELLITE", (None, None, None))
                satellite = rec[s_sat:e_sat].decode('ascii', errors='ignore').strip() if s_sat else "NOAA-20"
                if satellite in ("1", "J1", "NOAA20", "NOAA-20", "J01"):
                    platform_str = "NOAA-20"
                else:
                    platform_str = satellite
                global_stats["satellites"][platform_str] = global_stats["satellites"].get(platform_str, 0) + 1

                # Confidence: VIIRS categorical ('low', 'nominal', 'high' or 'l', 'n', 'h')
                s_conf, e_conf, _ = offsets["CONFIDENCE"]
                raw_conf = rec[s_conf:e_conf].decode('ascii', errors='ignore').strip().lower()
                if raw_conf in ("h", "high"):
                    conf_cat = "high"
                elif raw_conf in ("l", "low"):
                    conf_cat = "low"
                else:
                    conf_cat = "nominal"
                global_stats["confidence_dist"][conf_cat] = global_stats["confidence_dist"].get(conf_cat, 0) + 1

                s_ver, e_ver, _ = offsets.get("VERSION", (None, None, None))
                version = rec[s_ver:e_ver].decode('ascii', errors='ignore').strip() if s_ver else ("2.0NRT" if is_nrt else "2.0")

                s_frp, e_frp, _ = offsets.get("FRP", (None, None, None))
                try:
                    frp = float(rec[s_frp:e_frp]) if s_frp else None
                    if frp is not None and (frp < 0 or frp > 50000):
                        global_stats["quality_flags"]["suspect_frp"] += 1
                        frp = None
                except ValueError:
                    frp = None

                s_dn, e_dn, _ = offsets.get("DAYNIGHT", (None, None, None))
                daynight = rec[s_dn:e_dn].decode('ascii', errors='ignore').strip().upper() if s_dn else "D"
                if daynight not in ("D", "N"): daynight = "D"

                type_val = None
                if not is_nrt and "TYPE" in offsets:
                    s_tp, e_tp, _ = offsets["TYPE"]
                    try:
                        type_val = int(float(rec[s_tp:e_tp]))
                    except ValueError:
                        type_val = None

                # Timestamps
                try:
                    hh = int(acq_time[:2])
                    mm = int(acq_time[2:4])
                    dt_utc = datetime.strptime(f"{acq_date} {hh:02d}:{mm:02d}:00", "%Y-%m-%d %H:%M:%S")
                    iso_utc = dt_utc.isoformat() + "Z"
                    dt_ist = dt_utc + pd.Timedelta(hours=5, minutes=30)
                    iso_ist = dt_ist.strftime("%Y-%m-%d %H:%M:%S IST")
                except Exception:
                    global_stats["quality_flags"]["invalid_time"] += 1
                    iso_utc = f"{acq_date}T{acq_time[:2]}:{acq_time[2:4]}:00Z"
                    iso_ist = f"{acq_date} {acq_time[:2]}:{acq_time[2:4]}:00 IST"

                # India Jurisdiction
                india_state, india_district = attribute_india_jurisdiction(lat, lon)
                inside_official = is_within_india(lat, lon)

                # Context Inference
                c_class, c_evidence, c_conf = evaluate_observation_context(
                    lat=lat,
                    lon=lon,
                    acq_date_utc=acq_date,
                    anomaly_type=type_val,
                    india_state=india_state,
                    india_district=india_district,
                )

                obs_id = compute_observation_id(
                    source_file=dbf_path.name,
                    row_idx=len(india_records),
                    sensor="VIIRS",
                    platform=platform_str,
                    lat=lat,
                    lon=lon,
                    acq_datetime_utc=iso_utc,
                )
                grid_id = compute_grid_cell_id(lat, lon, grid_size_km=1.0)

                india_records.append({
                    "observation_id": obs_id,
                    "source_system": "NASA_FIRMS",
                    "source_archive_filename": "DL_FIRE_J1V-C2_841340.zip",
                    "source_file_name": dbf_path.name,
                    "source_product": "VIIRS_NOAA20_NRT_375M" if is_nrt else "VIIRS_NOAA20_STANDARD_375M",
                    "collection": "2",
                    "product_version": version,
                    "processing_level": "NRT" if is_nrt else "STANDARD",
                    "sensor": "VIIRS",
                    "platform": platform_str,
                    "latitude": round(lat, 5),
                    "longitude": round(lon, 5),
                    "acq_datetime_utc": iso_utc,
                    "acq_datetime_ist": iso_ist,
                    "acq_date_utc": acq_date,
                    "acq_time_utc": acq_time,
                    "confidence_category": conf_cat,
                    "raw_confidence": raw_conf,
                    "confidence_semantics": "VIIRS_CATEGORY_LOW_NOMINAL_HIGH",
                    "frp_mw": frp,
                    "daynight": daynight,
                    "brightness_kelvin": bright_ti4,
                    "brightness_channel_1": bright_ti4,
                    "brightness_channel_1_name": "Band I-4 (3.74 μm)",
                    "brightness_channel_1_unit": "K",
                    "brightness_channel_2": bright_ti5,
                    "brightness_channel_2_name": "Band I-5 (11.45 μm)",
                    "brightness_channel_2_unit": "K",
                    "scan_km": scan,
                    "track_km": track,
                    "anomaly_type": type_val,
                    "india_state": india_state,
                    "india_district": india_district,
                    "inside_india_boundary": inside_official,
                    "context_class": c_class.value if hasattr(c_class, "value") else str(c_class),
                    "context_confidence": c_conf.value if hasattr(c_conf, "value") else str(c_conf),
                    "context_evidence": c_evidence,
                    "grid_cell_id": grid_id,
                })

    dt = time.time() - t0
    print(f"Finished {dbf_path.name} in {dt:.2f}s | India records: {len(india_records):,}")
    return india_records, global_stats


def main():
    if not VIIRS_ZIP.exists():
        print(f"ERROR: {VIIRS_ZIP} does not exist.")
        sys.exit(1)

    print(f"Archive: {VIIRS_ZIP}")
    size = VIIRS_ZIP.stat().st_size
    print(f"Size: {size:,} bytes ({size / (1024*1024):.2f} MB)")

    print("Extracting VIIRS archive safely...")
    members = safe_extract_zip(VIIRS_ZIP, EXTRACTED_VIIRS)
    print(f"Extracted {len(members)} member(s) to {EXTRACTED_VIIRS}")

    shp_files = list(EXTRACTED_VIIRS.glob("*.shp"))
    dbf_files = list(EXTRACTED_VIIRS.glob("*.dbf"))
    print(f"Extracted DBF files: {[f.name for f in dbf_files]}")

    all_india_records = []
    report_data = {}

    for dbf in dbf_files:
        is_nrt = "nrt" in dbf.name.lower()
        records, stats = process_viirs_dbf(dbf, is_nrt=is_nrt)
        all_india_records.extend(records)
        report_data[dbf.name] = {
            "file": dbf.name,
            "total_records": stats["total_records"],
            "india_records": len(records),
            "india_percentage": round(len(records) / stats["total_records"] * 100, 2) if stats["total_records"] > 0 else 0,
            "date_range": f"{stats['min_date']} to {stats['max_date']}",
            "unique_dates": len(stats["unique_dates"]),
            "bounds": [stats["min_lon"], stats["min_lat"], stats["max_lon"], stats["max_lat"]],
            "confidence_dist": stats["confidence_dist"],
            "satellites": stats["satellites"],
            "quality_flags": stats["quality_flags"],
        }

    print(f"\nTotal combined VIIRS India records extracted: {len(all_india_records):,}")
    df_india = pd.DataFrame(all_india_records)
    df_india["context_evidence"] = df_india["context_evidence"].apply(json.dumps)

    out_parquet = INTERIM_DIR / "viirs_india.parquet"
    df_india.to_parquet(out_parquet, index=False)
    print(f"Exported processed India VIIRS dataset to {out_parquet} ({out_parquet.stat().st_size / (1024*1024):.2f} MB)")

    state_counts = df_india["india_state"].value_counts().to_dict()
    print("\nTop 10 Indian States by VIIRS 375m hotspot detections:")
    for st, count in list(state_counts.items())[:10]:
        print(f"  {st:<20}: {count:,}")

    report_data["total_combined_india_records"] = len(all_india_records)
    report_data["state_breakdown"] = state_counts
    report_json_path = REPORTS_DIR / "viirs_j1_c2_processing_summary.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    print(f"Saved VIIRS processing summary to {report_json_path}")


if __name__ == "__main__":
    main()
