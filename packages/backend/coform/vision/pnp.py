"""
Perspective-n-Point (PnP) pose estimation.
"""

from __future__ import annotations

from typing import Optional, Tuple

import cv2
import numpy as np
from numpy.typing import NDArray


def solve_pnp(
    object_points: NDArray[np.float64],
    image_points: NDArray[np.float64],
    camera_matrix: NDArray[np.float64],
    dist_coeffs: Optional[NDArray[np.float64]] = None,
    flags: int = cv2.SOLVEPNP_ITERATIVE,
) -> Tuple[NDArray[np.float64], NDArray[np.float64], bool]:
    """
    Solve PnP.

    object_points: (N, 3)
    image_points: (N, 2)
    camera_matrix: (3, 3)
    returns: (rvec, tvec, success)
    """
    if dist_coeffs is None:
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

    success, rvec, tvec = cv2.solvePnP(
        object_points.astype(np.float64),
        image_points.astype(np.float64),
        camera_matrix.astype(np.float64),
        dist_coeffs,
        flags=flags,
    )
    return rvec, tvec, bool(success)


def rvec_tvec_to_se3(
    rvec: NDArray[np.float64], tvec: NDArray[np.float64]
) -> NDArray[np.float64]:
    """Convert OpenCV rvec/tvec to 4x4 SE(3) matrix."""
    R, _ = cv2.Rodrigues(rvec)
    T = np.eye(4, dtype=np.float64)
    T[:3, :3] = R
    T[:3, 3] = tvec.ravel()
    return T
