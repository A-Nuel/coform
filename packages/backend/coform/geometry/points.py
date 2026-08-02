"""Point cloud / coordinate helpers."""
from __future__ import annotations
import numpy as np
from numpy.typing import NDArray

def centroid(points: NDArray[np.float64]) -> NDArray[np.float64]:
    return points.mean(axis=0)
