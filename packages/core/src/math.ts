/**
 * Pure TypeScript math utilities for Coform.
 * Double-precision focused. Used by frontend for real-time preview.
 * Backend (Python) remains the source of truth for highest accuracy.
 */

import type { Mat3, Mat4, Quaternion, Vec2, Vec3 } from "./types";

export function identity3(): Mat3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

export function identity4(): Mat4 {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 2D rotation matrix from angle (radians) */
export function rotationMatrix2D(theta: number): Mat3 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

/** Build 2D rigid/similarity matrix */
export function pose2DToMatrix(
  tx: number,
  ty: number,
  theta: number,
  scale = 1
): Mat3 {
  const c = Math.cos(theta) * scale;
  const s = Math.sin(theta) * scale;
  return [
    [c, -s, tx],
    [s, c, ty],
    [0, 0, 1],
  ];
}

/** Quaternion to rotation matrix (3x3) */
export function quatToRotMatrix(q: Quaternion): Mat3 {
  const [x, y, z, w] = q;
  const xx = x * x,
    yy = y * y,
    zz = z * z;
  const xy = x * y,
    xz = x * z,
    yz = y * z;
  const wx = w * x,
    wy = w * y,
    wz = w * z;

  return [
    [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)],
    [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)],
    [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)],
  ];
}

/** Build SE(3) matrix from translation + quaternion + optional scale */
export function pose3DToMatrix(
  t: Vec3,
  q: Quaternion,
  scale = 1
): Mat4 {
  const R = quatToRotMatrix(q);
  return [
    [R[0][0] * scale, R[0][1] * scale, R[0][2] * scale, t[0]],
    [R[1][0] * scale, R[1][1] * scale, R[1][2] * scale, t[1]],
    [R[2][0] * scale, R[2][1] * scale, R[2][2] * scale, t[2]],
    [0, 0, 0, 1],
  ];
}

export function multiplyMat3(a: Mat3, b: Mat3): Mat3 {
  const r: Mat3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
    }
  }
  return r;
}

export function multiplyMat4(a: Mat4, b: Mat4): Mat4 {
  const r: Mat4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      r[i][j] =
        a[i][0] * b[0][j] +
        a[i][1] * b[1][j] +
        a[i][2] * b[2][j] +
        a[i][3] * b[3][j];
    }
  }
  return r;
}

/** Apply 3x3 matrix to 2D point (homogeneous) */
export function applyMat3ToPoint(m: Mat3, p: Vec2): Vec2 {
  const x = m[0][0] * p[0] + m[0][1] * p[1] + m[0][2];
  const y = m[1][0] * p[0] + m[1][1] * p[1] + m[1][2];
  const w = m[2][0] * p[0] + m[2][1] * p[1] + m[2][2];
  if (Math.abs(w) < 1e-12) return [x, y];
  return [x / w, y / w];
}

/** Apply 4x4 matrix to 3D point */
export function applyMat4ToPoint(m: Mat4, p: Vec3): Vec3 {
  const x = m[0][0] * p[0] + m[0][1] * p[1] + m[0][2] * p[2] + m[0][3];
  const y = m[1][0] * p[0] + m[1][1] * p[1] + m[1][2] * p[2] + m[1][3];
  const z = m[2][0] * p[0] + m[2][1] * p[1] + m[2][2] * p[2] + m[2][3];
  const w = m[3][0] * p[0] + m[3][1] * p[1] + m[3][2] * p[2] + m[3][3];
  if (Math.abs(w) < 1e-12) return [x, y, z];
  return [x / w, y / w, z / w];
}

export function normalizeQuat(q: Quaternion): Quaternion {
  const [x, y, z, w] = q;
  const n = Math.sqrt(x * x + y * y + z * z + w * w);
  if (n < 1e-12) return [0, 0, 0, 1];
  return [x / n, y / n, z / n, w / n];
}

/** Simple SLERP (spherical linear interpolation) */
export function slerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
  let [x1, y1, z1, w1] = normalizeQuat(q1);
  let [x2, y2, z2, w2] = normalizeQuat(q2);

  let dot = x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2;
  if (dot < 0) {
    x2 = -x2;
    y2 = -y2;
    z2 = -z2;
    w2 = -w2;
    dot = -dot;
  }

  if (dot > 0.9995) {
    // Linear fallback
    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);
    const z = z1 + t * (z2 - z1);
    const w = w1 + t * (w2 - w1);
    return normalizeQuat([x, y, z, w]);
  }

  const theta = Math.acos(Math.min(1, Math.max(-1, dot)));
  const sinTheta = Math.sin(theta);
  const a = Math.sin((1 - t) * theta) / sinTheta;
  const b = Math.sin(t * theta) / sinTheta;

  return [
    a * x1 + b * x2,
    a * y1 + b * y2,
    a * z1 + b * z2,
    a * w1 + b * w2,
  ];
}

const WGS84_A = 6378137.0;
const WGS84_F = 1 / 298.257223563;
const WGS84_E2 = 2 * WGS84_F - WGS84_F * WGS84_F;

export function geodeticToECEF(lat: number, lon: number, alt: number): Vec3 {
  const phi = degToRad(lat);
  const lambda = degToRad(lon);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinPhi * sinPhi);

  const x = (N + alt) * cosPhi * cosLambda;
  const y = (N + alt) * cosPhi * sinLambda;
  const z = (N * (1 - WGS84_E2) + alt) * sinPhi;

  return [x, y, z];
}

/** Convert ECEF (X, Y, Z meters) to WGS-84 Geodetic (Lat, Lon in deg, Alt in meters) */
export function ecefToGeodetic(x: number, y: number, z: number): { lat: number; lon: number; alt: number } {
  const lon = radToDeg(Math.atan2(y, x));
  const p = Math.sqrt(x * x + y * y);
  
  let phi = Math.atan2(z, p * (1 - WGS84_E2));
  let oldPhi = 0;
  let N = WGS84_A;
  let iter = 0;

  while (Math.abs(phi - oldPhi) > 1e-12 && iter < 20) {
    oldPhi = phi;
    const sinPhi = Math.sin(phi);
    N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinPhi * sinPhi);
    phi = Math.atan2(z + WGS84_E2 * N * sinPhi, p);
    iter++;
  }

  const sinPhi = Math.sin(phi);
  const alt = p / Math.cos(phi) - N;

  return { lat: radToDeg(phi), lon, alt };
}

/** ECEF point to Local Tangent Plane NED (North-East-Down meters) relative to reference lat/lon/alt */
export function ecefToNED(pEcef: Vec3, refLat: number, refLon: number, refAlt: number): Vec3 {
  const refEcef = geodeticToECEF(refLat, refLon, refAlt);
  const dx = pEcef[0] - refEcef[0];
  const dy = pEcef[1] - refEcef[1];
  const dz = pEcef[2] - refEcef[2];

  const phi = degToRad(refLat);
  const lambda = degToRad(refLon);

  const sPhi = Math.sin(phi);
  const cPhi = Math.cos(phi);
  const sLam = Math.sin(lambda);
  const cLam = Math.cos(lambda);

  const north = -sPhi * cLam * dx - sPhi * sLam * dy + cPhi * dz;
  const east = -sLam * dx + cLam * dy;
  const down = -cPhi * cLam * dx - cPhi * sLam * dy - sPhi * dz;

  return [north, east, down];
}

// --- Euler Angle & Rotation Conventions ---

/** Convert Roll, Pitch, Yaw (ZYX aerospace sequence, in radians) to Quaternion [x, y, z, w] */
export function eulerZYXToQuat(roll: number, pitch: number, yaw: number): Quaternion {
  const cy = Math.cos(yaw * 0.5);
  const sy = Math.sin(yaw * 0.5);
  const cp = Math.cos(pitch * 0.5);
  const sp = Math.sin(pitch * 0.5);
  const cr = Math.cos(roll * 0.5);
  const sr = Math.sin(roll * 0.5);

  const w = cr * cp * cy + sr * sp * sy;
  const x = sr * cp * cy - cr * sp * sy;
  const y = cr * sp * cy + sr * cp * sy;
  const z = cr * cp * sy - sr * sp * cy;

  return [x, y, z, w];
}

/** Convert Quaternion [x, y, z, w] to Roll, Pitch, Yaw (ZYX aerospace sequence, in radians) */
export function quatToEulerZYX(q: Quaternion): { roll: number; pitch: number; yaw: number } {
  const [x, y, z, w] = q;

  // roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // pitch (y-axis rotation)
  const sinp = 2 * (w * y - z * x);
  let pitch = 0;
  if (Math.abs(sinp) >= 1) pitch = (Math.sign(sinp) * Math.PI) / 2;
  else pitch = Math.asin(sinp);

  // yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return { roll, pitch, yaw };
}

// --- Denavit-Hartenberg (DH) Parameters for Robotics ---

export function dhToMatrix(a: number, alpha: number, d: number, theta: number): Mat4 {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return [
    [ct, -st * ca, st * sa, a * ct],
    [st, ct * ca, -ct * sa, a * st],
    [0, sa, ca, d],
    [0, 0, 0, 1],
  ];
}

// --- Camera Projection & Intrinsics ---

export function cameraIntrinsicsMatrix(fx: number, fy: number, cx: number, cy: number, s = 0): Mat3 {
  return [
    [fx, s, cx],
    [0, fy, cy],
    [0, 0, 1],
  ];
}

export function project3DTo2DPlane(p3d: Vec3, K: Mat3): Vec2 | null {
  const [X, Y, Z] = p3d;
  if (Z <= 1e-6) return null; // Behind or on camera plane

  const u = (K[0][0] * X + K[0][1] * Y + K[0][2] * Z) / Z;
  const v = (K[1][1] * Y + K[1][2] * Z) / Z;

  return [u, v];
}

