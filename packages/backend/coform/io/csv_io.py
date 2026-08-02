"""
CSV import / export for coordinate sets.
"""

from __future__ import annotations

import csv
import io
from typing import List

from ..models import CoordinateSet


def coordinates_to_csv(coords: CoordinateSet) -> str:
    """Serialize CoordinateSet to CSV string."""
    output = io.StringIO()
    writer = csv.writer(output)
    header = ["x", "y"] if coords.dim == 2 else ["x", "y", "z"]
    writer.writerow(header)
    for p in coords.points:
        writer.writerow(p)
    return output.getvalue()


def csv_to_coordinates(
    csv_text: str, id: str = "imported", dim: int | None = None
) -> CoordinateSet:
    """Parse CSV text into a CoordinateSet."""
    reader = csv.reader(io.StringIO(csv_text.strip()))
    rows = list(reader)
    if not rows:
        raise ValueError("Empty CSV")

    # Detect header
    start = 0
    try:
        float(rows[0][0])
    except ValueError:
        start = 1

    points: List[List[float]] = []
    for row in rows[start:]:
        if not row:
            continue
        points.append([float(v) for v in row])

    if not points:
        raise ValueError("No numeric points found")

    inferred_dim = len(points[0])
    if dim is not None and dim != inferred_dim:
        raise ValueError(f"Expected dim={dim}, got {inferred_dim}")

    return CoordinateSet(
        id=id,
        dim=inferred_dim,  # type: ignore
        points=points,
    )
