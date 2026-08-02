"""
Projective / Homography transforms.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def apply_homography(
    H: NDArray[np.float64], points: NDArray[np.float64]
) -> NDArray[np.float64]:
    """
    Apply 3x3 homography to Nx2 points.
    Handles perspective division.
    """
    ones = np.ones((points.shape[0], 1), dtype=np.float64)
    homo = np.hstack([points, ones])
    transformed = (H @ homo.T).T
    w = transformed[:, 2:3]
    w = np.where(np.abs(w) < 1e-12, 1e-12, w)
    return transformed[:, :2] / w
