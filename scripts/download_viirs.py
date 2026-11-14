#!/usr/bin/env python3
"""
Robust resilient downloader for NASA FIRMS VIIRS archive.
Uses HTTP Range requests to resume downloads across socket resets.
"""

import sys
import os
import time
import hashlib
from pathlib import Path
import httpx

URL = "https://firms.modaps.eosdis.nasa.gov/data/download/DL_FIRE_J1V-C2_841340.zip"
TARGET = Path("data/raw/firms/DL_FIRE_J1V-C2_841340.zip")
TOTAL_SIZE = 721620438
EXPECTED_SHA256 = "51a5643f710cc6672c07db14c3afa0d073c319ad274b3adbc93241529562b529"


def main():
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    current_size = TARGET.stat().st_size if TARGET.exists() else 0
    print(f"Target: {TARGET}")
    print(f"Current local size: {current_size:,} / {TOTAL_SIZE:,} bytes ({current_size/TOTAL_SIZE*100:.1f}%)")

    if current_size == TOTAL_SIZE:
        print("Checking existing complete file SHA-256...")
        sha = hashlib.sha256()
        with open(TARGET, "rb") as f:
            while chunk := f.read(2 * 1024 * 1024):
                sha.update(chunk)
        calc_sha = sha.hexdigest()
        print(f"Calculated: {calc_sha}")
        if calc_sha == EXPECTED_SHA256:
            print("Download verified 100% complete and matches NASA sha256!")
            return
        else:
            print("Checksum mismatch, restarting download from scratch...")
            current_size = 0

    mode = "ab" if current_size > 0 else "wb"
    attempts = 0
    max_attempts = 15

    while current_size < TOTAL_SIZE and attempts < max_attempts:
        attempts += 1
        headers = {"Range": f"bytes={current_size}-{TOTAL_SIZE - 1}"}
        print(f"\nAttempt {attempts}/{max_attempts}: Requesting bytes {current_size:,} to {TOTAL_SIZE - 1:,}...")

        try:
            with httpx.Client(follow_redirects=True, timeout=60.0) as client:
                with client.stream("GET", URL, headers=headers) as response:
                    if response.status_code not in (200, 206):
                        print(f"HTTP unexpected status: {response.status_code}")
                        time.sleep(3)
                        continue

                    with open(TARGET, mode) as f:
                        for chunk in response.iter_bytes(chunk_size=512 * 1024):
                            if chunk:
                                f.write(chunk)
                                current_size += len(chunk)
                                if current_size % (10 * 1024 * 1024) < len(chunk):
                                    pct = (current_size / TOTAL_SIZE) * 100
                                    print(f"Progress: {current_size / (1024*1024):.1f} MB / {TOTAL_SIZE / (1024*1024):.1f} MB ({pct:.1f}%)")
                    mode = "ab"
        except Exception as e:
            print(f"Connection error (will resume): {e}")
            current_size = TARGET.stat().st_size if TARGET.exists() else 0
            mode = "ab"
            time.sleep(2)

    if current_size == TOTAL_SIZE:
        print("\nDownload complete! Verifying SHA-256...")
        sha = hashlib.sha256()
        with open(TARGET, "rb") as f:
            while chunk := f.read(2 * 1024 * 1024):
                sha.update(chunk)
        calc_sha = sha.hexdigest()
        print(f"Calculated: {calc_sha}")
        print(f"Expected:   {EXPECTED_SHA256}")
        if calc_sha == EXPECTED_SHA256:
            print("SUCCESS: VIIRS Archive download verified!")
        else:
            print("WARNING: Checksum differs from NASA metadata header.")
    else:
        print(f"Incomplete download: {current_size} / {TOTAL_SIZE}")


if __name__ == "__main__":
    main()
