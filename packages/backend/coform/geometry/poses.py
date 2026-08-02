"""Pose conversion utilities."""
from __future__ import annotations
import numpy as np
from numpy.typing import NDArray

def quat_to_rotmat(q: NDArray[np.float64]) -> NDArray[np.float64]:
    q = q / (np.linalg.norm(q) + 1e-15)
    x, y, z, w = q
    return np.array([
        [1 - 2*(y*y + z*z), 2*(x*y - w*z), 2*(x*z + w*y)],
        [2*(x*y + w*z), 1 - 2*(x*x + z*z), 2*(y*z - w*x)],
        [2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(x*x + y*y)],
    ], dtype=np.float64)
