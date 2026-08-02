"""
Transform composition and simple transform tree support.
Mirrors ROS tf-style parent-child relationships.
"""

from __future__ import annotations

from typing import Dict, List, Optional

import numpy as np
from numpy.typing import NDArray

from ..models import Transform
from .rigid import se2_matrix, se3_matrix_from_quat, invert_se2, invert_se3
from .similarity import similarity2d_matrix, similarity3d_matrix


def transform_to_matrix(t: Transform) -> NDArray[np.float64]:
    """Convert any supported Transform model into a NumPy matrix."""
    if t.type in ("rigid2d", "similarity2d"):
        pose = t.pose
        scale = getattr(pose, "scale", 1.0) or 1.0
        if t.type == "rigid2d":
            return se2_matrix(pose.translation[0], pose.translation[1], pose.rotation)
        return similarity2d_matrix(
            pose.translation[0], pose.translation[1], pose.rotation, scale
        )

    if t.type in ("rigid3d", "similarity3d"):
        pose = t.pose
        t_vec = np.asarray(pose.translation, dtype=np.float64)
        q = np.asarray(pose.rotation, dtype=np.float64)
        scale = getattr(pose, "scale", 1.0) or 1.0
        if t.type == "rigid3d":
            return se3_matrix_from_quat(t_vec, q)
        return similarity3d_matrix(t_vec, q, scale)

    if t.type in ("affine2d", "homography"):
        return np.asarray(t.matrix, dtype=np.float64)

    if t.type == "se3":
        return np.asarray(t.matrix, dtype=np.float64)

    raise ValueError(f"Unsupported transform type: {t.type}")


def compose_matrices(matrices: List[NDArray[np.float64]]) -> NDArray[np.float64]:
    """
    Compose a list of matrices from right to left:
    result = M_n @ ... @ M_2 @ M_1
    """
    if not matrices:
        raise ValueError("Cannot compose empty matrix list")

    result = matrices[0]
    for m in matrices[1:]:
        result = m @ result
    return result


def compose_transforms(transforms: List[Transform]) -> tuple[NDArray[np.float64], str]:
    """
    Compose a sequence of transforms.
    Returns (matrix, inferred_type).
    """
    if not transforms:
        raise ValueError("Cannot compose empty transform list")

    mats = [transform_to_matrix(t) for t in transforms]
    composed = compose_matrices(mats)

    # Infer result type
    is_3d = any(
        t.type in ("rigid3d", "similarity3d", "se3") for t in transforms
    )
    result_type = "se3" if is_3d else "homography"
    return composed, result_type


class TransformTree:
    """
    Lightweight in-memory transform tree.
    Frames are identified by string IDs.
    """

    def __init__(self, root_frame: str = "world"):
        self.root_frame = root_frame
        self._transforms: Dict[str, Transform] = {}  # child_frame -> transform

    def set_transform(self, transform: Transform) -> None:
        if not transform.child_frame:
            raise ValueError("Transform must have child_frame set")
        self._transforms[transform.child_frame] = transform

    def lookup_transform(
        self, target_frame: str, source_frame: str
    ) -> Optional[NDArray[np.float64]]:
        """
        Compute the transform that takes points from source_frame into target_frame.
        Returns None if the path cannot be resolved.
        """
        if target_frame == source_frame:
            # Identity of appropriate size is hard without knowing dimensionality;
            # caller should handle identity specially if needed.
            return None

        # Simple implementation: walk from source up to root collecting transforms,
        # then from target up to root, and invert the target path.
        # For production this would be expanded with a proper graph + caching.

        path_source = self._path_to_root(source_frame)
        path_target = self._path_to_root(target_frame)

        if path_source is None or path_target is None:
            return None

        # Find common ancestor
        common = None
        for f in path_source:
            if f in path_target:
                common = f
                break
        if common is None:
            return None

        # Build matrices
        # source -> common
        mats_s: List[NDArray[np.float64]] = []
        cur = source_frame
        while cur != common:
            t = self._transforms.get(cur)
            if t is None:
                return None
            mats_s.append(transform_to_matrix(t))
            cur = t.parent_frame or self.root_frame

        # target -> common (will invert)
        mats_t: List[NDArray[np.float64]] = []
        cur = target_frame
        while cur != common:
            t = self._transforms.get(cur)
            if t is None:
                return None
            mats_t.append(transform_to_matrix(t))
            cur = t.parent_frame or self.root_frame

        # Compose: inv(target->common) @ (source->common)
        T_s = compose_matrices(mats_s) if mats_s else np.eye(4)
        T_t = compose_matrices(mats_t) if mats_t else np.eye(4)

        # Invert T_t
        if T_t.shape[0] == 3:
            T_t_inv = invert_se2(T_t)
        else:
            T_t_inv = invert_se3(T_t)

        return T_t_inv @ T_s

    def _path_to_root(self, frame: str) -> Optional[List[str]]:
        path = []
        cur = frame
        seen = set()
        while cur and cur not in seen:
            path.append(cur)
            seen.add(cur)
            if cur == self.root_frame:
                return path
            t = self._transforms.get(cur)
            if t is None:
                return None
            cur = t.parent_frame or self.root_frame
        return None
