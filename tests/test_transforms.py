"""Basic tests for Coform transform engine."""

import numpy as np
import pytest

from coform.transforms import (
    se2_matrix,
    se3_matrix_from_quat,
    apply_se2,
    apply_se3,
    compose_transforms,
)
from coform.models import Rigid2DTransform, Pose2D, Rigid3DTransform, Pose3D


def test_se2_identity():
    T = se2_matrix(0, 0, 0)
    assert np.allclose(T, np.eye(3))


def test_se2_apply():
    T = se2_matrix(1.0, 2.0, 0.0)
    pts = np.array([[0.0, 0.0], [1.0, 0.0]])
    out = apply_se2(T, pts)
    assert np.allclose(out[0], [1.0, 2.0])
    assert np.allclose(out[1], [2.0, 2.0])


def test_se3_from_quat():
    t = np.array([1.0, 0.0, 0.0])
    q = np.array([0.0, 0.0, 0.0, 1.0])  # identity quat
    T = se3_matrix_from_quat(t, q)
    assert np.allclose(T[:3, :3], np.eye(3))
    assert np.allclose(T[:3, 3], t)


def test_compose_rigid2d():
    t1 = Rigid2DTransform(type="rigid2d", pose=Pose2D(translation=[1, 0], rotation=0))
    t2 = Rigid2DTransform(type="rigid2d", pose=Pose2D(translation=[0, 2], rotation=0))
    M, typ = compose_transforms([t1, t2])
    assert typ == "homography"
    assert np.allclose(M[:2, 2], [1, 2])
