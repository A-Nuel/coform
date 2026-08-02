"""
Affine transforms (2D).
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def apply_affine2d(
    matrix: NDArray[np.float64], points: NDArray[np.float64]
) -> NDArray[np.float64]:
    """
    Apply 3x3 affine matrix to Nx2 points.
    """
    ones = np.ones((points.shape[0], 1), dtype=np.float64)
    homo = np.hstack([points, ones])
    transformed = (matrix @ homo.T).T
    return transformed[:, :2]
