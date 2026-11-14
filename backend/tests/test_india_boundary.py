"""Unit tests for India jurisdictional boundary and point-in-polygon assignment."""

import pytest
from backend.app.services.india_boundary import is_within_india, attribute_india_jurisdiction


def test_is_within_india_positive_points():
    # New Delhi
    assert is_within_india(28.6139, 77.2090) is True
    # Ludhiana, Punjab
    assert is_within_india(30.9010, 75.8573) is True
    # Chamoli, Uttarakhand
    assert is_within_india(30.4000, 79.3500) is True
    # Balaghat, Madhya Pradesh
    assert is_within_india(21.8000, 80.2000) is True
    # Wayanad, Kerala
    assert is_within_india(11.6854, 76.1320) is True


def test_is_within_india_negative_points():
    # London
    assert is_within_india(51.5074, -0.1278) is False
    # Los Angeles
    assert is_within_india(34.0522, -118.2437) is False
    # Central Indian Ocean far south
    assert is_within_india(0.0, 78.0) is False
    # Beijing, China
    assert is_within_india(39.9042, 116.4074) is False


def test_attribute_india_state_and_district_punjab():
    # Coordinate in Ludhiana district, Punjab
    state, district = attribute_india_jurisdiction(30.90, 75.85)
    assert state == "Punjab"
    assert district == "Ludhiana"


def test_attribute_india_state_and_district_uttarakhand():
    # Coordinate in Chamoli district, Uttarakhand
    state, district = attribute_india_jurisdiction(30.45, 79.40)
    assert state == "Uttarakhand"
    assert district == "Chamoli"


def test_attribute_india_state_and_district_madhya_pradesh():
    # Coordinate in Balaghat district, MP
    state, district = attribute_india_jurisdiction(21.85, 80.25)
    assert state == "Madhya Pradesh"
    assert district == "Balaghat"


def test_attribute_india_boundary_fallback():
    # Coordinate outside known state polygons but inside territory
    state, _ = attribute_india_jurisdiction(34.00, 75.00)
    assert state in ("Jammu & Kashmir", "India (National)")
