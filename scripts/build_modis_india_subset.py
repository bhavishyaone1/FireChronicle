#!/usr/bin/env python3
"""
Full reproducible pipeline for MODIS Collection 6.1 archives.
Processes standard archive and NRT files, performs India spatial filtering,
administrative attribution, CEA 1km equal-area indexing, and exports to Parquet.
"""

import os
import sys
import struct
import hashlib
import time
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

# Ensure project root is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services.india_boundary import attribute_india_jurisdiction, is_within_india
from backend.app.services.context_engine import evaluate_observation_context
from backend.app.services.normalizer import compute_observation_id, compute_grid_cell_id

DATA_DIR = Path("data")
RAW_FIRMS_DIR = DATA_DIR / "raw" / "firms"
EXTRACTED_MODIS = DATA_DIR / "extracted" / "modis_c61"
INTERIM_DIR = DATA_DIR / "interim"
PROCESSED_DIR = DATA_DIR / "processed"
REPORTS_DIR = Path("reports")
DOCS_DATA_DIR = Path("docs") / "data"

INDIA_BBOX = [68.1, 6.5, 97.4, 37.1]  # [west, south, east, north]


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


def process_modis_dbf(dbf_path: Path, is_nrt: bool = False) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    print(f"\nProcessing {dbf_path.name}...")
    t0 = time.time()
    
    with open(dbf_path, "rb") as f:
        num_records, header_len, record_len, fields = parse_dbf_header(f)
        f.seek(header_len)

        # Field index offsets
        offsets = {}
        curr = 1 # skip deletion flag
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
            "satellites": {},
            "daynight": {},
            "confidence_bins": {"low": 0, "nominal": 0, "high": 0},
            "types": {},
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

        processed = 0
        while True:
            buf = f.read(chunk_bytes)
            if not buf:
                break
            n = len(buf) // record_len
            processed += n

            for i in range(n):
                rec = buf[i * record_len : (i + 1) * record_len]
                if rec[0] == 0x2A: # deleted
                    continue

                # Read coordinates
                s_lat, e_lat, _ = offsets["LATITUDE"]
                s_lon, e_lon, _ = offsets["LONGITUDE"]
                try:
                    lat = float(rec[s_lat:e_lat])
                    lon = float(rec[s_lon:e_lon])
                except ValueError:
                    global_stats["quality_flags"]["invalid_coords"] += 1
                    continue

                # Track global bounds
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    if lat < global_stats["min_lat"]: global_stats["min_lat"] = lat
                    if lat > global_stats["max_lat"]: global_stats["max_lat"] = lat
                    if lon < global_stats["min_lon"]: global_stats["min_lon"] = lon
                    if lon > global_stats["max_lon"]: global_stats["max_lon"] = lon
                else:
                    global_stats["quality_flags"]["invalid_coords"] += 1
                    continue

                # Read Date
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

                # Check India envelope
                if not (INDIA_BBOX[1] <= lat <= INDIA_BBOX[3] and INDIA_BBOX[0] <= lon <= INDIA_BBOX[2]):
                    continue

                # Read rest of fields for India record
                s_t, e_t, _ = offsets["ACQ_TIME"]
                acq_time = rec[s_t:e_t].decode('ascii', errors='ignore').strip().zfill(4)

                s_b, e_b, _ = offsets["BRIGHTNESS"]
                try:
                    brightness = float(rec[s_b:e_b])
                except ValueError:
                    brightness = None

                s_sc, e_sc, _ = offsets["SCAN"]
                try:
                    scan = float(rec[s_sc:e_sc])
                except ValueError:
                    scan = None

                s_tr, e_tr, _ = offsets["TRACK"]
                try:
                    track = float(rec[s_tr:e_tr])
                except ValueError:
                    track = None

                s_sat, e_sat, _ = offsets["SATELLITE"]
                satellite = rec[s_sat:e_sat].decode('ascii', errors='ignore').strip()
                global_stats["satellites"][satellite] = global_stats["satellites"].get(satellite, 0) + 1

                s_conf, e_conf, _ = offsets["CONFIDENCE"]
                try:
                    conf_int = int(float(rec[s_conf:e_conf]))
                except ValueError:
                    conf_int = 50

                if conf_int < 30:
                    conf_cat = "low"
                    global_stats["confidence_bins"]["low"] += 1
                elif conf_int < 80:
                    conf_cat = "nominal"
                    global_stats["confidence_bins"]["nominal"] += 1
                else:
                    conf_cat = "high"
                    global_stats["confidence_bins"]["high"] += 1

                s_ver, e_ver, _ = offsets["VERSION"]
                version = rec[s_ver:e_ver].decode('ascii', errors='ignore').strip()

                s_b31, e_b31, _ = offsets["BRIGHT_T31"]
                try:
                    bright_t31 = float(rec[s_b31:e_b31])
                except ValueError:
                    bright_t31 = None

                s_frp, e_frp, _ = offsets["FRP"]
                try:
                    frp = float(rec[s_frp:e_frp])
                    if frp < 0 or frp > 50000:
                        global_stats["quality_flags"]["suspect_frp"] += 1
                        frp = None
                except ValueError:
                    frp = None

                s_dn, e_dn, _ = offsets["DAYNIGHT"]
                daynight = rec[s_dn:e_dn].decode('ascii', errors='ignore').strip().upper() or "D"
                global_stats["daynight"][daynight] = global_stats["daynight"].get(daynight, 0) + 1

                type_val = None
                if not is_nrt and "TYPE" in offsets:
                    s_tp, e_tp, _ = offsets["TYPE"]
                    try:
                        type_val = int(float(rec[s_tp:e_tp]))
                        global_stats["types"][str(type_val)] = global_stats["types"].get(str(type_val), 0) + 1
                    except ValueError:
                        type_val = None

                # ISO UTC and IST timestamps
                try:
                    hh = int(acq_time[:2])
                    mm = int(acq_time[2:4])
                    dt_utc = datetime.strptime(f"{acq_date} {hh:02d}:{mm:02d}:00", "%Y-%m-%d %H:%M:%S")
                    iso_utc = dt_utc.isoformat() + "Z"
                    # IST = UTC + 5h30m
                    dt_ist = dt_utc + pd.Timedelta(hours=5, minutes=30)
                    iso_ist = dt_ist.strftime("%Y-%m-%d %H:%M:%S IST")
                except Exception:
                    global_stats["quality_flags"]["invalid_time"] += 1
                    iso_utc = f"{acq_date}T{acq_time[:2]}:{acq_time[2:4]}:00Z"
                    iso_ist = f"{acq_date} {acq_time[:2]}:{acq_time[2:4]}:00 IST"

                # State / District spatial join
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
                    sensor="MODIS",
                    platform=satellite,
                    lat=lat,
                    lon=lon,
                    acq_datetime_utc=iso_utc,
                )
                grid_id = compute_grid_cell_id(lat, lon, grid_size_km=1.0)

                india_records.append({
                    "observation_id": obs_id,
                    "source_system": "NASA_FIRMS",
                    "source_archive_filename": "DL_FIRE_M-C61_841318.zip",
                    "source_file_name": dbf_path.name,
                    "source_product": "MODIS_C6.1_NRT" if is_nrt else "MODIS_C6.1_STANDARD",
                    "collection": "6.1",
                    "product_version": version,
                    "processing_level": "NRT" if is_nrt else "STANDARD",
                    "sensor": "MODIS",
                    "platform": satellite,
                    "latitude": round(lat, 5),
                    "longitude": round(lon, 5),
                    "acq_datetime_utc": iso_utc,
                    "acq_datetime_ist": iso_ist,
                    "acq_date_utc": acq_date,
                    "acq_time_utc": acq_time,
                    "confidence_category": conf_cat,
                    "raw_confidence": conf_int,
                    "confidence_semantics": "MODIS_PERCENT_0_100",
                    "frp_mw": frp,
                    "daynight": daynight,
                    "brightness_kelvin": brightness,
                    "brightness_channel_1": brightness,
                    "brightness_channel_1_name": "Channel 21/22 (3.96 μm)",
                    "brightness_channel_1_unit": "K",
                    "brightness_channel_2": bright_t31,
                    "brightness_channel_2_name": "Channel 31 (11.03 μm)",
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
    INTERIM_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    archive_dbf = EXTRACTED_MODIS / "fire_archive_M-C61_841318.dbf"
    nrt_dbf = EXTRACTED_MODIS / "fire_nrt_M-C61_841318.dbf"

    all_india_records = []
    report_data = {}

    if archive_dbf.exists():
        records, stats = process_modis_dbf(archive_dbf, is_nrt=False)
        all_india_records.extend(records)
        report_data["standard_archive"] = {
            "file": archive_dbf.name,
            "total_records": stats["total_records"],
            "india_records": len(records),
            "india_percentage": round(len(records) / stats["total_records"] * 100, 2),
            "date_range": f"{stats['min_date']} to {stats['max_date']}",
            "unique_dates": len(stats["unique_dates"]),
            "bounds": [stats["min_lon"], stats["min_lat"], stats["max_lon"], stats["max_lat"]],
            "confidence_dist": stats["confidence_bins"],
            "satellites": stats["satellites"],
            "quality_flags": stats["quality_flags"],
            "type_dist": stats["types"],
        }

    if nrt_dbf.exists():
        records, stats = process_modis_dbf(nrt_dbf, is_nrt=True)
        all_india_records.extend(records)
        report_data["nrt_archive"] = {
            "file": nrt_dbf.name,
            "total_records": stats["total_records"],
            "india_records": len(records),
            "india_percentage": round(len(records) / stats["total_records"] * 100, 2),
            "date_range": f"{stats['min_date']} to {stats['max_date']}",
            "unique_dates": len(stats["unique_dates"]),
            "bounds": [stats["min_lon"], stats["min_lat"], stats["max_lon"], stats["max_lat"]],
            "confidence_dist": stats["confidence_bins"],
            "satellites": stats["satellites"],
            "quality_flags": stats["quality_flags"],
        }

    print(f"\nTotal combined India records extracted: {len(all_india_records):,}")
    df_india = pd.DataFrame(all_india_records)

    # Convert complex lists to JSON string for Parquet compatibility
    df_india["context_evidence"] = df_india["context_evidence"].apply(json.dumps)

    out_parquet = INTERIM_DIR / "modis_india.parquet"
    df_india.to_parquet(out_parquet, index=False)
    print(f"Exported processed India dataset to {out_parquet} ({out_parquet.stat().st_size / (1024*1024):.2f} MB)")

    # Produce State breakdown
    state_counts = df_india["india_state"].value_counts().to_dict()
    print("\nTop 10 Indian States by MODIS hotspot detections:")
    for st, count in list(state_counts.items())[:10]:
        print(f"  {st:<20}: {count:,}")

    # Save summary report JSON
    report_data["total_combined_india_records"] = len(all_india_records)
    report_data["state_breakdown"] = state_counts
    report_json_path = REPORTS_DIR / "modis_c61_processing_summary.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    print(f"Saved processing summary to {report_json_path}")


if __name__ == "__main__":
    main()
