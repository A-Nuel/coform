"""
Example: apply a rigid 2D transform and print results.
"""

from coform.models import Rigid2DTransform, Pose2D, CoordinateSet
from coform.transforms import transform_to_matrix, apply_se2
import numpy as np

def main():
    transform = Rigid2DTransform(
        type="rigid2d",
        pose=Pose2D(translation=[2.0, 1.0], rotation=0.5),
        parent_frame="world",
        child_frame="robot",
    )

    matrix = transform_to_matrix(transform)
    print("Transform matrix:")
    print(matrix)

    points = np.array([[0.0, 0.0], [1.0, 0.0], [0.0, 1.0]])
    transformed = apply_se2(matrix, points)
    print("\nTransformed points:")
    print(transformed)

if __name__ == "__main__":
    main()
