"""India Boundary and Jurisdictional Attribution Service.

Provides spatial point-in-polygon assignment for India national territory,
States, Union Territories, and key fire-monitoring districts.
"""

from typing import Optional, Tuple, Dict, Any, List
from shapely.geometry import Point, Polygon, MultiPolygon, box
from shapely.strtree import STRtree


# National Envelope for initial spatial filtering
INDIA_BBOX = {
    "west": 68.1,
    "south": 6.5,
    "east": 97.4,
    "north": 37.1,
}

# Simplified administrative boundaries for core Indian fire-monitoring states
# Polygons defined in (longitude, latitude) coordinates
STATE_POLYGONS: Dict[str, Dict[str, Any]] = {
    "Punjab": {
        "polygon": Polygon([
            (73.85, 30.00), (74.20, 31.00), (74.80, 32.05), (75.80, 32.50),
            (76.80, 31.30), (76.95, 30.80), (76.85, 30.20), (76.30, 29.80),
            (75.30, 29.60), (74.40, 29.80), (73.85, 30.00)
        ]),
        "districts": [
            ("Ludhiana", box(75.60, 30.70, 76.15, 31.10)),
            ("Sangrur", box(75.60, 30.00, 76.10, 30.45)),
            ("Amritsar", box(74.70, 31.45, 75.20, 31.90)),
            ("Patiala", box(76.10, 30.10, 76.60, 30.55)),
            ("Bathinda", box(74.75, 29.90, 75.30, 30.40)),
            ("Firozpur", box(74.30, 30.70, 74.90, 31.25)),
            ("Tarn Taran", box(74.70, 31.10, 75.15, 31.50)),
            ("Jalandhar", box(75.30, 31.10, 75.80, 31.55)),
            ("Kapurthala", box(75.15, 31.20, 75.50, 31.60)),
            ("Fatehgarh Sahib", box(76.20, 30.50, 76.50, 30.80)),
        ]
    },
    "Haryana": {
        "polygon": Polygon([
            (74.45, 29.50), (75.00, 30.15), (76.90, 30.90), (77.60, 30.50),
            (77.40, 29.70), (77.30, 28.10), (76.80, 27.80), (75.80, 28.00),
            (75.20, 28.60), (74.50, 29.00), (74.45, 29.50)
        ]),
        "districts": [
            ("Karnal", box(76.70, 29.50, 77.20, 29.95)),
            ("Kaithal", box(76.20, 29.60, 76.70, 30.10)),
            ("Kurukshetra", box(76.60, 29.85, 77.10, 30.25)),
            ("Fatehabad", box(75.30, 29.40, 75.90, 29.90)),
            ("Sirsa", box(74.60, 29.30, 75.30, 29.95)),
            ("Jind", box(76.00, 29.15, 76.60, 29.60)),
            ("Ambala", box(76.70, 30.20, 77.20, 30.60)),
            ("Hisar", box(75.50, 28.90, 76.10, 29.45)),
        ]
    },
    "Uttarakhand": {
        "polygon": Polygon([
            (77.55, 30.30), (78.30, 31.45), (79.30, 31.45), (80.70, 30.70),
            (81.05, 30.10), (80.30, 28.80), (79.40, 28.80), (78.70, 29.40),
            (77.70, 29.90), (77.55, 30.30)
        ]),
        "districts": [
            ("Chamoli", box(79.20, 30.20, 80.10, 31.00)),
            ("Almora", box(79.35, 29.45, 79.95, 29.95)),
            ("Nainital", box(79.20, 29.10, 79.75, 29.50)),
            ("Pauri Garhwal", box(78.50, 29.60, 79.20, 30.20)),
            ("Tehri Garhwal", box(78.30, 30.15, 78.90, 30.60)),
            ("Dehradun", box(77.60, 29.95, 78.30, 30.55)),
            ("Uttarkashi", box(78.00, 30.60, 79.20, 31.45)),
            ("Pithoragarh", box(80.00, 29.60, 80.60, 30.40)),
        ]
    },
    "Himachal Pradesh": {
        "polygon": Polygon([
            (75.60, 31.80), (76.20, 33.25), (77.50, 33.25), (78.90, 32.10),
            (78.70, 31.10), (77.50, 30.40), (76.40, 30.80), (75.60, 31.80)
        ]),
        "districts": [
            ("Shimla", box(77.10, 30.90, 77.80, 31.50)),
            ("Kullu", box(77.00, 31.50, 77.65, 32.25)),
            ("Kangra", box(75.80, 31.80, 76.70, 32.40)),
            ("Mandi", box(76.70, 31.40, 77.20, 31.95)),
            ("Chamba", box(75.80, 32.30, 76.80, 33.15)),
        ]
    },
    "Madhya Pradesh": {
        "polygon": Polygon([
            (74.05, 22.00), (74.80, 24.60), (76.50, 25.80), (78.50, 26.85),
            (82.00, 24.50), (82.75, 23.80), (81.80, 21.80), (78.50, 21.40),
            (75.50, 21.30), (74.05, 22.00)
        ]),
        "districts": [
            ("Balaghat", box(80.00, 21.50, 80.70, 22.20)),
            ("Mandla", box(80.10, 22.20, 80.85, 22.95)),
            ("Dindori", box(80.80, 22.50, 81.60, 23.20)),
            ("Hoshangabad", box(77.50, 22.20, 78.40, 22.90)),
            ("Umaria", box(80.60, 23.30, 81.25, 23.95)),
            ("Seoni", box(79.40, 21.70, 80.20, 22.50)),
            ("Chhindwara", box(78.50, 21.60, 79.40, 22.60)),
            ("Betul", box(77.40, 21.40, 78.30, 22.20)),
        ]
    },
    "Chhattisgarh": {
        "polygon": Polygon([
            (80.30, 17.80), (80.80, 21.00), (81.80, 23.80), (83.80, 24.10),
            (84.40, 22.50), (82.80, 19.50), (81.50, 18.00), (80.30, 17.80)
        ]),
        "districts": [
            ("Bastar", box(81.60, 18.80, 82.25, 19.60)),
            ("Dantewada", box(81.10, 18.40, 81.70, 19.10)),
            ("Bijapur", box(80.40, 18.20, 81.10, 19.20)),
            ("Surguja", box(82.80, 22.80, 83.60, 23.80)),
            ("Korba", box(82.30, 22.20, 83.10, 22.90)),
            ("Kanker", box(81.10, 19.80, 81.80, 20.60)),
        ]
    },
    "Odisha": {
        "polygon": Polygon([
            (81.40, 18.20), (82.50, 20.50), (84.00, 22.50), (86.80, 22.50),
            (87.50, 21.50), (85.80, 19.50), (84.80, 19.00), (81.40, 18.20)
        ]),
        "districts": [
            ("Mayurbhanj", box(85.80, 21.40, 86.80, 22.40)),
            ("Kandhamal", box(83.60, 19.80, 84.50, 20.80)),
            ("Sambalpur", box(83.70, 21.10, 84.50, 21.80)),
            ("Koraput", box(82.20, 18.40, 83.20, 19.20)),
        ]
    },
    "Karnataka": {
        "polygon": Polygon([
            (74.05, 14.80), (74.80, 17.50), (76.80, 18.40), (77.80, 16.50),
            (78.40, 13.50), (76.80, 11.60), (75.50, 12.00), (74.05, 14.80)
        ]),
        "districts": [
            ("Chamarajanagar", box(76.70, 11.60, 77.40, 12.20)),
            ("Kodagu", box(75.50, 11.90, 76.10, 12.60)),
            ("Uttara Kannada", box(74.20, 14.10, 75.10, 15.20)),
            ("Shivamogga", box(74.90, 13.80, 75.80, 14.40)),
            ("Chikmagalur", box(75.30, 13.10, 76.10, 13.80)),
        ]
    },
    "Kerala": {
        "polygon": Polygon([
            (74.85, 12.50), (75.80, 11.80), (76.80, 10.50), (77.40, 8.50),
            (76.80, 8.80), (76.20, 9.80), (75.50, 11.20), (74.85, 12.50)
        ]),
        "districts": [
            ("Wayanad", box(75.80, 11.50, 76.40, 11.95)),
            ("Idukki", box(76.70, 9.60, 77.30, 10.30)),
            ("Palakkad", box(76.30, 10.50, 76.90, 11.10)),
        ]
    },
    "Assam": {
        "polygon": Polygon([
            (89.70, 26.20), (90.20, 27.20), (94.00, 27.80), (95.80, 27.50),
            (95.20, 26.80), (93.50, 25.50), (92.50, 24.50), (90.50, 25.50),
            (89.70, 26.20)
        ]),
        "districts": [
            ("Golaghat", box(93.60, 26.20, 94.20, 26.80)),
            ("Karbi Anglong", box(93.00, 25.70, 93.80, 26.40)),
            ("Dima Hasao", box(92.60, 25.00, 93.30, 25.60)),
            ("Sonitpur", box(92.50, 26.50, 93.40, 27.00)),
        ]
    },
    "Uttar Pradesh": {
        "polygon": Polygon([
            (77.10, 28.50), (77.50, 30.30), (80.00, 28.50), (84.30, 27.40),
            (84.60, 24.00), (82.50, 24.20), (79.00, 24.50), (77.50, 27.50),
            (77.10, 28.50)
        ]),
        "districts": [
            ("Pilibhit", box(79.60, 28.30, 80.20, 28.90)),
            ("Lakhimpur Kheri", box(80.30, 27.80, 81.30, 28.50)),
            ("Bareilly", box(79.20, 28.20, 79.80, 28.70)),
            ("Shahjahanpur", box(79.60, 27.70, 80.20, 28.20)),
            ("Mathura", box(77.30, 27.30, 77.80, 27.80)),
        ]
    },
    "Rajasthan": {
        "polygon": Polygon([
            (69.50, 26.50), (70.50, 29.50), (74.00, 30.20), (77.00, 28.00),
            (77.80, 26.80), (76.50, 24.00), (74.00, 23.50), (71.00, 24.50),
            (69.50, 26.50)
        ]),
        "districts": [
            ("Hanumangarh", box(74.20, 29.10, 75.30, 29.95)),
            ("Ganganagar", box(73.50, 29.50, 74.30, 30.15)),
            ("Alwar", box(76.30, 27.30, 77.00, 28.10)),
        ]
    },
}

# Broader India polygon union (convex / simplified boundary envelope)
INDIA_TERRITORY_POLYGON = Polygon([
    (68.5, 23.5), (69.5, 22.0), (72.5, 18.5), (73.5, 15.0),
    (75.5, 12.0), (77.5, 8.0), (78.5, 9.5), (80.5, 13.0),
    (82.5, 16.5), (85.0, 19.5), (87.5, 21.5), (89.0, 22.0),
    (92.0, 21.0), (93.5, 24.0), (96.5, 27.5), (95.0, 28.5),
    (92.0, 28.0), (88.5, 27.5), (85.5, 27.5), (81.0, 30.5),
    (79.0, 32.0), (77.0, 35.5), (74.5, 36.8), (73.5, 33.5),
    (72.0, 30.0), (70.5, 27.5), (68.5, 23.5)
])


def is_within_india(lat: float, lon: float) -> bool:
    """Check if geographic coordinate lies within Indian territory."""
    if not (INDIA_BBOX["south"] <= lat <= INDIA_BBOX["north"] and
            INDIA_BBOX["west"] <= lon <= INDIA_BBOX["east"]):
        return False
    pt = Point(lon, lat)
    return INDIA_TERRITORY_POLYGON.contains(pt) or INDIA_TERRITORY_POLYGON.touches(pt)


def attribute_india_jurisdiction(lat: float, lon: float) -> Tuple[Optional[str], Optional[str]]:
    """
    Spatially join a point to an Indian State/UT and District.
    Returns: (state_name, district_name)
    """
    pt = Point(lon, lat)
    
    # 1. Test against defined state polygons
    for state_name, state_data in STATE_POLYGONS.items():
        poly = state_data["polygon"]
        if poly.contains(pt) or poly.touches(pt):
            # Point is in this state, now check districts
            for district_name, d_box in state_data.get("districts", []):
                if d_box.contains(pt) or d_box.touches(pt):
                    return state_name, district_name
            # Fallback to state with unknown district
            return state_name, None

    # 2. If within India bbox or broad territory
    if is_within_india(lat, lon):
        # Heuristic state assignment based on coarse latitude/longitude quadrants
        if lat >= 31.0 and lon <= 77.0:
            return "Jammu & Kashmir", None
        elif lat >= 32.0 and lon > 77.0:
            return "Ladakh", None
        elif 24.0 <= lat <= 28.5 and 88.0 <= lon <= 96.0:
            return "Northeastern Region", None
        elif 15.0 <= lat <= 20.0 and 78.0 <= lon <= 81.0:
            return "Telangana / Andhra Pradesh", None
        elif 10.0 <= lat <= 14.0 and 77.0 <= lon <= 80.5:
            return "Tamil Nadu", None
        elif 21.5 <= lat <= 27.5 and 85.0 <= lon <= 89.0:
            return "West Bengal / Jharkhand", None
        return "India (National)", None

    return None, None
