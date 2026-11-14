"""
Fire Type Intelligence & Honest Attribution Module.
Adheres strictly to NASA FIRMS standards:
1. Standard Science Processing (SP) data with `type` field:
   - 0 = Presumed vegetation fire
   - 1 = Active volcano
   - 2 = Other static land source
   - 3 = Offshore detection
   Labeled as "Reported by FIRMS: ...".
2. Near Real-Time (NRT) data without `type` field:
   Labeled as "Type not provided in NRT data" and offers inferred labels ONLY as clearly marked "Inferred (method)".
3. Strictly prohibits labeling any detection as "wildfire" (uses "thermal anomaly / active fire detection").
"""

from typing import Optional, List, Dict, Any


FIRMS_REPORTED_TYPE_MAP = {
    0: {
        "short_name": "Vegetation",
        "label": "Reported by FIRMS: Presumed vegetation fire (type 0)",
        "category": "VEGETATION",
        "description": "Standard-quality FIRMS processing classified this thermal anomaly as presumed vegetation burning based on land-cover and thermal signature.",
        "method": "FIRMS Standard Science Quality Active Fire Algorithm (Collection 6.1 / Collection 2)",
        "limitations": "Standard algorithm flags vegetation context from surface reflectance and land cover; does not certify wildfire ignition, fire perimeter, or human cause.",
    },
    1: {
        "short_name": "Active Volcano",
        "label": "Reported by FIRMS: Active volcano (type 1)",
        "category": "VOLCANO",
        "description": "Standard-quality FIRMS classified this anomaly as volcanic activity.",
        "method": "NASA FIRMS Global Volcanism Database Correlation",
        "limitations": "Covers mapped volcanic perimeters; does not capture submarine vents or newly emergent volcanic fissures.",
    },
    2: {
        "short_name": "Static Land Source",
        "label": "Reported by FIRMS: Other static land source (type 2)",
        "category": "STATIC",
        "description": "Standard-quality FIRMS classified this anomaly as a known permanent/static hot source (e.g. gas flaring, refinery, steel mill, cement plant).",
        "method": "NASA FIRMS Global Industrial & Gas Flare Database",
        "limitations": "Permanent industrial emitters; may occasionally coincide with surface vegetation fires immediately adjacent to the industrial footprint.",
    },
    3: {
        "short_name": "Offshore",
        "label": "Reported by FIRMS: Offshore detection (type 3)",
        "category": "OFFSHORE",
        "description": "Standard-quality FIRMS classified this anomaly as an offshore marine thermal detection (e.g. oil platform, offshore gas flaring).",
        "method": "NASA FIRMS Global Marine Land-Sea Mask",
        "limitations": "Detections over open water; does not characterize vessel activity or subsea venting.",
    },
}

NRT_INFERRED_METHOD_MAP = {
    "OFFSHORE": {
        "short_name": "Inferred Offshore",
        "label": "Type not provided in NRT data — Inferred (Land-Sea Boundary Mask): Offshore detection",
        "category": "OFFSHORE",
        "method": "Natural Earth 1:10m High-Resolution Land-Sea Boundary (>5 km seaward)",
        "limitations": "Spatial resolution of land-sea mask (~1 km) may misclassify near-shore intertidal mudflats, sand spits, or small barrier islands.",
    },
    "OTHER_STATIC_THERMAL_SOURCE": {
        "short_name": "Inferred Static Source",
        "label": "Type not provided in NRT data — Inferred (Persistence across >=3 days): Repeat-location static thermal source",
        "category": "STATIC",
        "method": "Multi-temporal spatial clustering persistence (>=3 satellite overpasses at identical coordinates across >=2 calendar dates within 500 m)",
        "limitations": "Cannot distinguish permanent industrial gas flares and steel mills from underground smoldering coal-seam fires or prolonged landfill fires.",
    },
    "BHUVAN_AGRICULTURAL_FIRE_RECORD": {
        "short_name": "Inferred Crop Residue",
        "label": "Type not provided in NRT data — Inferred (ISRO Bhuvan Active Agricultural Overlap): Cropland agricultural residue",
        "category": "VEGETATION",
        "method": "Direct spatio-temporal coincidence with official ISRO/NRSC Bhuvan Active Agricultural Fire point records",
        "limitations": "Restricted to declared agricultural harvest seasons (Kharif: Sep–Nov; Rabi: Apr–May) and states covered by Bhuvan monitoring bulletins.",
    },
    "LIKELY_AGRICULTURAL_CONTEXT": {
        "short_name": "Inferred Crop Residue",
        "label": "Type not provided in NRT data — Inferred (Land-Cover Cropland + Crop Season): Agricultural residue context",
        "category": "VEGETATION",
        "method": "Copernicus Global Land Cover 100m Cropland Mask cross-referenced with agricultural harvest windows (Punjab, Haryana, UP, MP)",
        "limitations": "Mixed agricultural-woodland edge pixels can introduce attribution ambiguity; small farm residue fires (<1 acre) may burn below satellite detection floors.",
    },
    "FSI_SUPPORTED_FOREST_ALERT": {
        "short_name": "Inferred Forest Fire",
        "label": "Type not provided in NRT data — Inferred (FSI Van Agni Forest Alert Overlap): Forest fire context",
        "category": "VEGETATION",
        "method": "Direct coincidence with Forest Survey of India (FSI Van Agni) alert perimeter and fire-prone forest grid",
        "limitations": "Covers designated government forest compartments; does not encompass private agro-forestry plantations or non-notified scrub.",
    },
    "LIKELY_FOREST_CONTEXT": {
        "short_name": "Inferred Forest Fire",
        "label": "Type not provided in NRT data — Inferred (Forest Type Layer Overlap): Forest vegetation context",
        "category": "VEGETATION",
        "method": "Bhuvan Forest Type and Density Layer overlap within notified forest boundaries during regional dry season (Feb–May)",
        "limitations": "High cloud cover in humid montane zones (e.g. Western Ghats) can obscure understory burning; crown canopy can attenuate thermal radiance.",
    },
    "VOLCANIC": {
        "short_name": "Inferred Volcanic",
        "label": "Type not provided in NRT data — Inferred (Geological Volcanic Perimeter): Active volcanic anomaly",
        "category": "VOLCANO",
        "method": "Barren Island Active Volcanic Crater Geological Perimeter [93.85°E, 12.28°N]",
        "limitations": "Geographically restricted to Barren Island (Andaman Sea); does not detect mud volcanoes or dormant caldera degassing.",
    },
}

DEFAULT_UNCLASSIFIED = {
    "short_name": "Unclassified",
    "label": "Type not provided in NRT data — Unclassified thermal anomaly",
    "category": "UNCLASSIFIED",
    "method": "Unclassified / Ambiguous landcover context",
    "limitations": "Insufficient contextual overlap or mixed landcover boundary; cannot be attributed with scientific confidence.",
}


def classify_fire_type(
    anomaly_type: Optional[int],
    context_class: Optional[str] = None,
    processing_status: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Produce rigorous, honest fire type attribution.
    
    If standard-quality data provides the FIRMS `type` field:
    Report as "Reported by FIRMS: <type>".
    
    If NRT data lacks `type`:
    Report as "Type not provided in NRT data" and mark inferred labels as "Inferred (<method>)".
    """
    # 1. Standard Science Processing (SP) with FIRMS type field provided
    if anomaly_type is not None:
        try:
            type_int = int(anomaly_type)
            if type_int in FIRMS_REPORTED_TYPE_MAP:
                info = FIRMS_REPORTED_TYPE_MAP[type_int]
                return {
                    "has_firms_type": True,
                    "raw_firms_type": type_int,
                    "fire_type_category": info["category"],
                    "short_name": info["short_name"],
                    "display_label": info["label"],
                    "source_provenance": "Reported by FIRMS",
                    "method": info["method"],
                    "limitations": info["limitations"],
                    "description": info["description"],
                    "is_inferred": False,
                }
        except (ValueError, TypeError):
            pass

    # 2. NRT data without type field: Offer inferred labels clearly marked as "Inferred (method)"
    c_key = str(context_class).upper() if context_class else "UNCLASSIFIED"
    if c_key in NRT_INFERRED_METHOD_MAP:
        info = NRT_INFERRED_METHOD_MAP[c_key]
        return {
            "has_firms_type": False,
            "raw_firms_type": None,
            "fire_type_category": info["category"],
            "short_name": info["short_name"],
            "display_label": info["label"],
            "source_provenance": "Type not provided in NRT data",
            "method": info["method"],
            "limitations": info["limitations"],
            "description": f"Inferred contextual classification using {info['method']}.",
            "is_inferred": True,
        }

    # 3. Fallback: Unclassified
    return {
        "has_firms_type": False,
        "raw_firms_type": None,
        "fire_type_category": DEFAULT_UNCLASSIFIED["category"],
        "short_name": DEFAULT_UNCLASSIFIED["short_name"],
        "display_label": DEFAULT_UNCLASSIFIED["label"],
        "source_provenance": "Type not provided in NRT data",
        "method": DEFAULT_UNCLASSIFIED["method"],
        "limitations": DEFAULT_UNCLASSIFIED["limitations"],
        "description": "Standard FIRMS type is absent in NRT feeds, and overlapping evidence was insufficient to assign an inferred category.",
        "is_inferred": True,
    }
