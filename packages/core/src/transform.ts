/**
 * High-level transform helpers for the frontend (real-time preview).
 * Backend Python implementation is authoritative for production accuracy.
 */

import type {
  CoordinateSet,
  Transform,
  Mat3,
  Mat4,
  Pose2D,
  Pose3D,
} from "./types";
import {
  pose2DToMatrix,
  pose3DToMatrix,
  applyMat3ToPoint,
  applyMat4ToPoint,
  multiplyMat3,
  multiplyMat4,
  identity3,
  identity4,
} from "./math";

export function transformToMatrix(t: Transform): Mat3 | Mat4 {
  switch (t.type) {
    case "rigid2d":
    case "similarity2d": {
      const { translation, rotation, scale = 1 } = t.pose as Required<Pose2D>;
      return pose2DToMatrix(translation[0], translation[1], rotation, scale);
    }
    case "rigid3d":
    case "similarity3d": {
      const { translation, rotation, scale = 1 } = t.pose as Required<Pose3D>;
      return pose3DToMatrix(translation, rotation, scale);
    }
    case "affine2d":
    case "homography":
      return t.matrix;
    case "se3":
      return t.matrix;
    default:
      throw new Error(`Unsupported transform type`);
  }
}

export function applyTransformToCoordinates(
  t: Transform,
  coords: CoordinateSet
): CoordinateSet {
  const matrix = transformToMatrix(t);
  const dim = coords.dim;

  const points = coords.points.map((p) => {
    if (dim === 2) {
      const m = matrix as Mat3;
      return applyMat3ToPoint(m, [p[0], p[1]]);
    } else {
      const m = matrix as Mat4;
      return applyMat4ToPoint(m, [p[0], p[1], p[2]]);
    }
  });

  return {
    ...coords,
    id: `${coords.id}_transformed`,
    points,
    frameId: t.childFrame ?? coords.frameId,
  };
}

/** Compose transforms from right to left (T_n  ...  T_1) */
export function composeTransforms(transforms: Transform[]): Transform {
  if (transforms.length === 0) {
    throw new Error("Cannot compose empty transform list");
  }
  if (transforms.length === 1) return transforms[0];

  // Determine if we are in 2D or 3D space
  const is3D = transforms.some(
    (t) =>
      t.type === "rigid3d" ||
      t.type === "similarity3d" ||
      t.type === "se3"
  );

  if (is3D) {
    let acc = identity4();
    for (const t of transforms) {
      const m = transformToMatrix(t) as Mat4;
      acc = multiplyMat4(m, acc);
    }
    return {
      type: "se3",
      matrix: acc,
      parentFrame: transforms[0].parentFrame,
      childFrame: transforms[transforms.length - 1].childFrame,
    };
  } else {
    let acc = identity3();
    for (const t of transforms) {
      const m = transformToMatrix(t) as Mat3;
      acc = multiplyMat3(m, acc);
    }
    return {
      type: "homography",
      matrix: acc,
      parentFrame: transforms[0].parentFrame,
      childFrame: transforms[transforms.length - 1].childFrame,
    };
  }
}
