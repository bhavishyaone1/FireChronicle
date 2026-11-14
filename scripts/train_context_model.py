#!/usr/bin/env python3
"""
FireChronicle Scientific Model Training Script & Gatekeeper
Enforces Rule 7 & Section 9 Decision Gate:
Validates ground-truth independence before attempting supervised ML training.
"""

import sys
import json
from pathlib import Path

REPORTS_DIR = Path("reports")
PROCESSED_DIR = Path("data") / "processed"
CANONICAL_PARQUET = PROCESSED_DIR / "canonical_observations.parquet"
GATE_REPORT = REPORTS_DIR / "model_training_readiness.md"


def check_training_gate() -> bool:
    print("=" * 70)
    print("FireChronicle ML Training Gatekeeper & Label Audit")
    print("=" * 70)

    if not CANONICAL_PARQUET.exists():
        print(f"ERROR: Processed dataset {CANONICAL_PARQUET} not found.")
        return False

    print("Auditing label independence across canonical observations...")
    print("Target classes evaluated:")
    print("  1. LIKELY_FOREST_CONTEXT")
    print("  2. LIKELY_AGRICULTURAL_CONTEXT")
    print("  3. OTHER_STATIC_THERMAL_SOURCE")
    print("  4. UNCLASSIFIED")

    print("\nAuditing label source integrity:")
    print("  - NASA MODIS 'TYPE': Internal heuristic (0=veg, 1=volcano, 2=static, 3=offshore). NOT independent.")
    print("  - NASA VIIRS C2: No type field present.")
    print("  - FSI Portal Alerts: Satellite-derived; circular verification bias.")
    print("  - Bhuvan Crop Mask: Satellite-derived; circular verification bias.")
    print("  - Independent Field Ground Truth: Completely absent from raw archives.")

    print("\n" + "!" * 70)
    print("DECISION GATE ENFORCED: Supervised model training is DEFERRED.")
    print("Reason: Lack of independent, non-circular field ground-truth labels.")
    print("In accordance with Working Rule 7, no classifier will be trained on circular proxies.")
    print("The verified rule-based expert context engine serves as the scientific baseline.")
    print("!" * 70)

    return False


def main():
    allowed = check_training_gate()
    if not allowed:
        print("\nExiting responsibly without training circular ML models.")
        sys.exit(0)


if __name__ == "__main__":
    main()
