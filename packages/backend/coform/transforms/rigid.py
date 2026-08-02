"""
Rigid transforms (SE(2) and SE(3)).
High numerical accuracy using float64.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def se2_matrix(tx: float, ty: float, theta: float) -> NDArray[np.float64]:
    """Build 3x3 SE(2) matrix."""
    c, s = np.cos(theta), np.sin(theta)
    return np.array(
        [
            [c, -s, tx],
            [s, c, ty],
            [0.0, 0.0, 1.0],
        ],
        dtype=np.float64,
    )


def se3_matrix_from_quat(
    t: NDArray[np.float64], q: NDArray[np.float64]
) -> NDArray[np.float64]:
    """
    Build 4x4 SE(3) matrix from translation (3,) and quaternion (4,) [x,y,z,w].
    """
    q = q / (np.linalg.norm(q) + 1e-15)
    x, y, z, w = q

    xx, yy, zz = x * x, y * y, z * z
    xy, xz, yz = x * y, x * z, y * z
    wx, wy, wz = w * x, w * y, w * z

    R = np.array(
        [
            [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)],
            [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)],
            [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)],
        ],
        dtype=np.float64,
    )

    T = np.eye(4, dtype=np.float64)
    T[:3, :3] = R
    T[:3, 3] = t
    return T


def invert_se2(T: NDArray[np.float64]) -> NDArray[np.float64]:
    """Invert a 3x3 SE(2) matrix."""
    R = T[:2, :2]
    t = T[:2, 2]
    R_inv = R.T
    t_inv = -R_inv @ t
    out = np.eye(3, dtype=np.float64)
    out[:2, :2] = R_inv
    out[:2, 2] = t_inv
    return out


def invert_se3(T: NDArray[np.float64]) -> NDArray[np.float64]:
    """Invert a 4x4 SE(3) matrix."""
    R = T[:3, :3]
    t = T[:3, 3]
    R_inv = R.T
    t_inv = -R_inv @ t
    out = np.eye(4, dtype=np.float64)
    out[:3, :3] = R_inv
    out[:3, 3] = t_inv
    return out


def apply_se2(T: NDArray[np.float64], points: NDArray[np.float64]) -> NDArray[np.float64]:
    """
    Apply SE(2) to Nx2 points.
    points: (N, 2)
    returns: (N, 2)
    """
    ones = np.ones((points.shape[0], 1), dtype=np.float64)
    homo = np.hstack([points, ones])
    transformed = (T @ homo.T).T
    return transformed[:, :2]


def apply_se3(T: NDArray[np.float64], points: NDArray[np.float64]) -> NDArray[np.float64]:
    """
    Apply SE(3) to Nx3 points.
    points: (N, 3)
    returns: (N, 3)
    """
    ones = np.ones((points.shape[0], 1), dtype=np.float64)
    homo = np.hstack([points, ones])
    transformed = (T @ homo.T).T
    return transformed[:, :3]
