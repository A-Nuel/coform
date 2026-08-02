/**
 * Coform shared domain types.
 * These are the single source of truth for both frontend and backend clients.
 */

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

/** Row-major 3x3 matrix */
export type Mat3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

/** Row-major 4x4 matrix */
export type Mat4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

/** Quaternion [x, y, z, w] */
export type Quaternion = [number, number, number, number];

export interface Pose2D {
  translation: Vec2;
  /** Rotation in radians */
  rotation: number;
  /** Uniform scale (1.0 = rigid) */
  scale?: number;
}

export interface Pose3D {
  translation: Vec3;
  /** Preferred representation: quaternion [x, y, z, w] */
  rotation: Quaternion;
  /** Uniform scale (1.0 = rigid) */
  scale?: number;
}

export type TransformType =
  | "rigid2d"
  | "similarity2d"
  | "rigid3d"
  | "similarity3d"
  | "affine2d"
  | "homography"
  | "se3";

export interface TransformBase {
  id?: string;
  type: TransformType;
  /** Optional parent frame for transform trees */
  parentFrame?: string;
  /** Frame this transform defines */
  childFrame?: string;
}

export interface Rigid2DTransform extends TransformBase {
  type: "rigid2d";
  pose: Pose2D;
}

export interface Similarity2DTransform extends TransformBase {
  type: "similarity2d";
  pose: Required<Pose2D>;
}

export interface Rigid3DTransform extends TransformBase {
  type: "rigid3d";
  pose: Pose3D;
}

export interface Similarity3DTransform extends TransformBase {
  type: "similarity3d";
  pose: Required<Pose3D>;
}

export interface Affine2DTransform extends TransformBase {
  type: "affine2d";
  matrix: Mat3;
}

export interface HomographyTransform extends TransformBase {
  type: "homography";
  matrix: Mat3;
}

export interface SE3Transform extends TransformBase {
  type: "se3";
  matrix: Mat4;
}

export type Transform =
  | Rigid2DTransform
  | Similarity2DTransform
  | Rigid3DTransform
  | Similarity3DTransform
  | Affine2DTransform
  | HomographyTransform
  | SE3Transform;

export interface CoordinateSet {
  id: string;
  dim: 2 | 3;
  /** N x dim array of points */
  points: number[][];
  frameId?: string;
  /** Optional per-point covariances (N x dim x dim) */
  covariances?: number[][][];
  metadata?: Record<string, unknown>;
}

export interface ImageData {
  id: string;
  /** Base64 string or binary indicator handled by transport layer */
  data: string;
  width: number;
  height: number;
  format: "png" | "jpg" | "webp" | "jpeg";
  associatedCoords?: CoordinateSet;
  metadata?: Record<string, unknown>;
}

export interface TransformTreeNode {
  frameId: string;
  parentFrame?: string;
  transform: Transform;
  children?: string[];
}

export interface TransformTree {
  rootFrame: string;
  nodes: Record<string, TransformTreeNode>;
}

/** Standard request/response envelopes used by the API */
export interface ApplyTransformRequest {
  transform: Transform;
  coordinates?: CoordinateSet;
  image?: ImageData;
}

export interface ApplyTransformResponse {
  coordinates?: CoordinateSet;
  image?: ImageData;
  transformMatrix?: number[][];
}

export interface ComposeRequest {
  transforms: Transform[];
}

export interface ComposeResponse {
  result: Transform;
  matrix: number[][];
}
