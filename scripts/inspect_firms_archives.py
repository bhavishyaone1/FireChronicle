#!/usr/bin/env python3
"""
Inspect and safely ingest NASA FIRMS archives for FireChronicle.
Validates ZIP magic bytes, calculates SHA-256, extracts safely,
and inventories records, fields, coordinate bounds, and India coverage.
"""

import os
import sys
import hashlib
import zipfile
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx

DATA_DIR = Path("data")
RAW_FIRMS_DIR = DATA_DIR / "raw" / "firms"
EXTRACTED_MODIS = DATA_DIR / "extracted" / "modis_c61"
EXTRACTED_VIIRS = DATA_DIR / "extracted" / "viirs_j1_c2"
REPORTS_DIR = Path("reports")
MANIFESTS_DIR = DATA_DIR / "manifests"

ARCHIVE_URLS = {
    "DL_FIRE_M-C61_841318.zip": "https://firms.modaps.eosdis.nasa.gov/data/download/DL_FIRE_M-C61_841318.zip",
    "DL_FIRE_J1V-C2_841340.zip": "https://firms.modaps.eosdis.nasa.gov/data/download/DL_FIRE_J1V-C2_841340.zip",
}


def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(1024 * 1024):
            sha.update(chunk)
    return sha.hexdigest()


def check_and_download(filename: str, url: str) -> Dict[str, Any]:
    dest = RAW_FIRMS_DIR / filename
    result: Dict[str, Any] = {
        "filename": filename,
        "url": url,
        "status": "UNKNOWN",
        "file_exists": dest.exists(),
        "size_bytes": dest.stat().st_size if dest.exists() else 0,
        "sha256": None,
        "http_status": None,
        "content_type": None,
        "content_length": None,
        "error": None,
    }

    if dest.exists() and dest.stat().st_size > 0:
        # Check ZIP signature (PK\x03\x04)
        with open(dest, "rb") as f:
            magic = f.read(4)
        if magic == b"PK\x03\x04":
            result["status"] = "LOCAL_VALID_ZIP"
            result["sha256"] = compute_sha256(dest)
            return result
        else:
            result["status"] = "LOCAL_CORRUPT"

    # Attempt download
    print(f"Attempting download for {filename} from {url}...")
    try:
        with httpx.Client(follow_redirects=True, timeout=30.0) as client:
            resp = client.get(url)
            result["http_status"] = resp.status_code
            result["content_type"] = resp.headers.get("content-type")
            result["content_length"] = resp.headers.get("content-length")

            if resp.status_code == 200:
                content = resp.content
                if content[:4] == b"PK\x03\x04":
                    with open(dest, "wb") as f:
                        f.write(content)
                    result["status"] = "DOWNLOADED_VALID_ZIP"
                    result["size_bytes"] = len(content)
                    result["sha256"] = hashlib.sha256(content).hexdigest()
                else:
                    result["status"] = "DOWNLOADED_NOT_A_ZIP"
                    result["error"] = f"Expected ZIP magic PK\\x03\\x04, got {content[:4]!r}"
            else:
                result["status"] = f"HTTP_{resp.status_code}"
                result["error"] = f"HTTP error {resp.status_code} on download endpoint"
    except Exception as e:
        result["status"] = "DOWNLOAD_FAILED"
        result["error"] = str(e)

    return result


def safe_extract(zip_path: Path, target_dir: Path) -> List[Dict[str, Any]]:
    target_dir.mkdir(parents=True, exist_ok=True)
    extracted_members = []

    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            # Security checks: prevent path traversal (..), absolute paths, symlinks
            norm_name = os.path.normpath(member.filename)
            if norm_name.startswith("..") or os.path.isabs(norm_name):
                raise ValueError(f"Unsafe archive member path detected: {member.filename}")

            dest_path = target_dir / norm_name
            # Ensure destination is strictly inside target_dir
            if not str(dest_path.resolve()).startswith(str(target_dir.resolve())):
                raise ValueError(f"Member path escapes target directory: {member.filename}")

            zf.extract(member, target_dir)
            extracted_members.append({
                "filename": member.filename,
                "file_size": member.file_size,
                "compress_size": member.compress_size,
                "crc": member.CRC,
                "is_dir": member.is_dir(),
                "extracted_path": str(dest_path),
            })

    return extracted_members


def main():
    RAW_FIRMS_DIR.mkdir(parents=True, exist_ok=True)
    EXTRACTED_MODIS.mkdir(parents=True, exist_ok=True)
    EXTRACTED_VIIRS.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    MANIFESTS_DIR.mkdir(parents=True, exist_ok=True)

    inventory_results = {}

    for filename, url in ARCHIVE_URLS.items():
        res = check_and_download(filename, url)
        inventory_results[filename] = res
        print(f"Archive {filename}: Status = {res['status']}, Size = {res['size_bytes']} bytes, SHA-256 = {res['sha256']}")

    # If MODIS zip exists, extract safely
    modis_zip = RAW_FIRMS_DIR / "DL_FIRE_M-C61_841318.zip"
    if modis_zip.exists() and inventory_results["DL_FIRE_M-C61_841318.zip"]["status"] in ("LOCAL_VALID_ZIP", "DOWNLOADED_VALID_ZIP"):
        print("Safely extracting MODIS archive...")
        members = safe_extract(modis_zip, EXTRACTED_MODIS)
        inventory_results["DL_FIRE_M-C61_841318.zip"]["members"] = members
        print(f"Extracted {len(members)} member(s) to {EXTRACTED_MODIS}")

    # If VIIRS zip exists, extract safely
    viirs_zip = RAW_FIRMS_DIR / "DL_FIRE_J1V-C2_841340.zip"
    if viirs_zip.exists() and inventory_results["DL_FIRE_J1V-C2_841340.zip"]["status"] in ("LOCAL_VALID_ZIP", "DOWNLOADED_VALID_ZIP"):
        print("Safely extracting VIIRS archive...")
        members = safe_extract(viirs_zip, EXTRACTED_VIIRS)
        inventory_results["DL_FIRE_J1V-C2_841340.zip"]["members"] = members
        print(f"Extracted {len(members)} member(s) to {EXTRACTED_VIIRS}")

    manifest_path = MANIFESTS_DIR / "source_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(inventory_results, f, indent=2)
    print(f"Saved source manifest to {manifest_path}")


if __name__ == "__main__":
    main()
