"""Tests for Lambert Cylindrical Equal-Area (CEA) grid projection and reversal."""

import math
import pytest
from backend.app.services.normalizer import (
    compute_grid_cell_id,
    get_grid_cell_bounds,
    R_EARTH_AUTHALIC_KM,
)


def test_equal_area_spherical_conservation():
    """
    Verify that in Lambert Cylindrical Equal-Area projection:
    Delta x * Delta y = R^2 * Delta lambda * Delta(sin phi) == Spherical Area.
    Every discrete grid cell [x, x+S] x [y, y+S] possesses exactly S^2 area.
    """
    cell_id = compute_grid_cell_id(lat=34.25, lon=-118.15, grid_size_km=1.0)
    assert cell_id.startswith("grid_1.0km_")

    bounds = get_grid_cell_bounds(cell_id)
    west, south, east, north = bounds["west"], bounds["south"], bounds["east"], bounds["north"]

    # Compute actual spherical surface area in km^2
    # Area = R^2 * (lambda2 - lambda1) * (sin(phi2) - sin(phi1))
    d_lambda = math.radians(east - west)
    d_sin_phi = math.sin(math.radians(north)) - math.sin(math.radians(south))
    spherical_area = (R_EARTH_AUTHALIC_KM ** 2) * d_lambda * d_sin_phi

    # Must equal 1.0 km^2 within numerical float precision
    assert pytest.approx(spherical_area, rel=1e-5) == 1.0


def test_equal_area_across_latitude_transects():
    """
    Verify that 1 km grid cells at equator (0 deg), mid-latitude (35 deg), and high latitude (65 deg)
    all conserve exactly 1.0 km^2 on the authalic sphere.
    """
    test_latitudes = [0.0, 35.0, 65.0, -42.0]
    for lat in test_latitudes:
        cell_id = compute_grid_cell_id(lat=lat, lon=-118.0, grid_size_km=1.0)
        bounds = get_grid_cell_bounds(cell_id)
        d_lambda = math.radians(bounds["east"] - bounds["west"])
        d_sin_phi = math.sin(math.radians(bounds["north"])) - math.sin(math.radians(bounds["south"]))
        area = (R_EARTH_AUTHALIC_KM ** 2) * d_lambda * d_sin_phi
        assert pytest.approx(area, rel=1e-5) == 1.0, f"Failed equal-area test at latitude {lat}"


def test_grid_reversal_contains_original_point():
    """Verify that reversing a cell ID yields a bounding box enclosing the original point."""
    test_points = [
        (34.2512, -118.1523),
        (-18.542, -56.891),
        (-35.281, 149.128),
        (0.001, 0.001),
    ]
    for lat, lon in test_points:
        cell_id = compute_grid_cell_id(lat=lat, lon=lon, grid_size_km=1.0)
        bounds = get_grid_cell_bounds(cell_id)
        assert bounds["west"] <= lon <= bounds["east"] + 1e-5
        assert bounds["south"] <= lat <= bounds["north"] + 1e-5
