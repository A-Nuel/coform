"""
WGS-84 Geodetic, ECEF, and Local Tangent Plane (NED/ENU) transformation math for Python backend.
"""

from __future__ import annotations
import math
import numpy as np

WGS84_A = 6378137.0  # meters
WGS84_F = 1.0 / 298.257223563
WGS84_E2 = 2.0 * WGS84_F - WGS84_F ** 2


def geodetic_to_ecef(lat_deg: float, lon_deg: float, alt_m: float) -> tuple[float, float, float]:
    """Convert Latitude, Longitude (degrees) and Altitude (meters) to ECEF (X, Y, Z meters)."""
    phi = math.radians(lat_deg)
    lam = math.radians(lon_deg)
    sin_phi = math.sin(phi)
    cos_phi = math.cos(phi)
    sin_lam = math.sin(lam)
    cos_lam = math.cos(lam)

    N = WGS84_A / math.sqrt(1.0 - WGS84_E2 * (sin_phi ** 2))

    x = (N + alt_m) * cos_phi * cos_lam
    y = (N + alt_m) * cos_phi * sin_lam
    z = (N * (1.0 - WGS84_E2) + alt_m) * sin_phi
    return x, y, z


def ecef_to_geodetic(x: float, y: float, z: float) -> tuple[float, float, float]:
    """Convert ECEF (X, Y, Z meters) to Latitude, Longitude (degrees) and Altitude (meters)."""
    lon = math.degrees(math.atan2(y, x))
    p = math.sqrt(x ** 2 + y ** 2)

    phi = math.atan2(z, p * (1.0 - WGS84_E2))
    old_phi = 0.0
    N = WGS84_A
    iter_count = 0

    while abs(phi - old_phi) > 1e-12 and iter_count < 20:
        old_phi = phi
        sin_phi = math.sin(phi)
        N = WGS84_A / math.sqrt(1.0 - WGS84_E2 * (sin_phi ** 2))
        phi = math.atan2(z + WGS84_E2 * N * sin_phi, p)
        iter_count += 1

    alt = p / math.cos(phi) - N
    return math.degrees(phi), lon, alt


def ecef_to_ned(
    x: float, y: float, z: float, ref_lat: float, ref_lon: float, ref_alt: float
) -> tuple[float, float, float]:
    """Convert ECEF point to North-East-Down (NED) relative to reference origin."""
    rx, ry, rz = geodetic_to_ecef(ref_lat, ref_lon, ref_alt)
    dx, dy, dz = x - rx, y - ry, z - rz

    phi = math.radians(ref_lat)
    lam = math.radians(ref_lon)
    s_phi, c_phi = math.sin(phi), math.cos(phi)
    s_lam, c_lam = math.sin(lam), math.cos(lam)

    north = -s_phi * c_lam * dx - s_phi * s_lam * dy + c_phi * dz
    east = -s_lam * dx + c_lam * dy
    down = -c_phi * c_lam * dx - c_phi * s_lam * dy - s_phi * dz
    return north, east, down
