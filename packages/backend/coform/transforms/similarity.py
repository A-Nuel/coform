"""
Similarity transforms (rigid + uniform scale).
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .rigid import se2_matrix, se3_matrix_from_quat


def similarity2d_matrix(
    tx: float, ty: float, theta: float, scale: float
) -> NDArray[np.float64]:
    """3x3 similarity matrix."""
    c = np.cos(theta) * scale
    s = np.sin(theta) * scale
    return np.array(
        [
            [c, -s, tx],
            [s, c, ty],
            [0.0, 0.0, 1.0],
        ],
        dtype=np.float64,
    )


def similarity3d_matrix(
    t: NDArray[np.float64], q: NDArray[np.float64], scale: float
) -> NDArray[np.float64]:
    """4x4 similarity matrix (uniform scale)."""
    T = se3_matrix_from_quat(t, q)
    T[:3, :3] *= scale
    return T
