import React, { useState } from "react";
import type { DomainType } from "@coform/core";
import {
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Download,
  Share2,
} from "lucide-react";

interface CodeGeneratorStudioProps {
  activeDomain: DomainType | "tree";
}

export const CodeGeneratorStudio: React.FC<CodeGeneratorStudioProps> = ({ activeDomain }) => {
  const [lang, setLang] = useState<"python" | "cpp" | "typescript" | "matlab" | "rust" | "curl">("python");
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const getSnippet = () => {
    switch (activeDomain) {
      case "aerospace":
        return {
          python: `# Python 3.10+ (NumPy + SciPy Aerospace WGS-84 / NED)
import numpy as np

WGS84_A = 6378137.0
WGS84_F = 1.0 / 298.257223563
WGS84_E2 = 2 * WGS84_F - WGS84_F**2

def geodetic_to_ecef(lat_deg, lon_deg, alt_m):
    phi = np.radians(lat_deg)
    lam = np.radians(lon_deg)
    N = WGS84_A / np.sqrt(1.0 - WGS84_E2 * np.sin(phi)**2)
    x = (N + alt_m) * np.cos(phi) * np.cos(lam)
    y = (N + alt_m) * np.cos(phi) * np.sin(lam)
    z = (N * (1.0 - WGS84_E2) + alt_m) * np.sin(phi)
    return np.array([x, y, z])

ref_ecef = geodetic_to_ecef(28.5621, -80.5772, 10.0)
target_ecef = geodetic_to_ecef(28.7200, -80.4200, 12000.0)
print(f"Target ECEF [m]: {target_ecef}")
`,
          cpp: `// C++20 (Eigen3 Library Aerospace WGS-84)
#include <iostream>
#include <cmath>
#include <Eigen/Dense>

constexpr double WGS84_A = 6378137.0;
constexpr double WGS84_E2 = 0.00669437999014;

Eigen::Vector3d geodeticToECEF(double lat_deg, double lon_deg, double alt_m) {
    double phi = lat_deg * M_PI / 180.0;
    double lam = lon_deg * M_PI / 180.0;
    double sPhi = std::sin(phi);
    double N = WGS84_A / std::sqrt(1.0 - WGS84_E2 * sPhi * sPhi);
    return Eigen::Vector3d(
        (N + alt_m) * std::cos(phi) * std::cos(lam),
        (N + alt_m) * std::cos(phi) * std::sin(lam),
        (N * (1.0 - WGS84_E2) + alt_m) * sPhi
    );
}

int main() {
    auto target = geodeticToECEF(28.72, -80.42, 12000.0);
    std::cout << "Target ECEF:\\n" << target << std::endl;
    return 0;
}
`,
          typescript: `// TypeScript (@coform/core)
import { geodeticToECEF, ecefToNED } from "@coform/core";

const refOrigin = geodeticToECEF(28.5621, -80.5772, 10);
const targetECEF = geodeticToECEF(28.72, -80.42, 12000);
const nedRadar = ecefToNED(targetECEF, 28.5621, -80.5772, 10);

console.log("Local Radar Vector [North, East, Down] m:", nedRadar);
`,
          matlab: `% MATLAB R2023a+ (Aerospace Blockset)
wgs84 = wgs84Ellipsoid('meters');
[x, y, z] = geodetic2ecef(wgs84, 28.72, -80.42, 12000);
[az, elev, slantRange] = ecef2aer(x, y, z, 28.5621, -80.5772, 10, wgs84);

fprintf('Slant Range: %.2f km | Azimuth: %.2f deg\\n', slantRange/1000, az);
`,
          rust: `// Rust (nalgebra crate WGS-84 Geodetic)
use nalgebra::Vector3;

fn geodetic_to_ecef(lat: f64, lon: f64, alt: f64) -> Vector3<f64> {
    let a = 6378137.0f64;
    let e2 = 0.00669437999014f64;
    let phi = lat.to_radians();
    let lam = lon.to_radians();
    let n = a / (1.0 - e2 * phi.sin().powi(2)).sqrt();
    Vector3::new(
        (n + alt) * phi.cos() * lam.cos(),
        (n + alt) * phi.cos() * lam.sin(),
        (n * (1.0 - e2) + alt) * phi.sin(),
    )
}
`,
          curl: `# Coform API Health & Coordinate Request
curl -X POST https://coform-frontend.vercel.app/api/v1/transforms/apply \\
  -H "Content-Type: application/json" \\
  -d '{"transform": {"type": "se3", "matrix": [[1,0,0,0],[0,1,0,0],[0,0,1,12000],[0,0,0,1]]}}'
`,
        }[lang];

      case "robotics":
        return {
          python: `# Python 3.10+ (NumPy DH Kinematics Chain)
import numpy as np

def dh_matrix(a, alpha, d, theta):
    ct, st = np.cos(theta), np.sin(theta)
    ca, sa = np.cos(alpha), np.sin(alpha)
    return np.array([
        [ct, -st*ca,  st*sa, a*ct],
        [st,  ct*ca, -ct*sa, a*st],
        [0,   sa,     ca,    d   ],
        [0,   0,      0,     1   ]
    ])

# UR5 6-DOF Forward Kinematics
T01 = dh_matrix(0, np.pi/2, 0.089, np.radians(30))
T12 = dh_matrix(-0.425, 0, 0, np.radians(-45))
T_end = T01 @ T12
print("End-Effector Pose T_0^n:\\n", T_end)
`,
          cpp: `// C++20 (Eigen3 DH Matrix)
#include <iostream>
#include <Eigen/Dense>

Eigen::Matrix4d dhMatrix(double a, double alpha, double d, double theta) {
    Eigen::Matrix4d T;
    double ct = std::cos(theta), st = std::sin(theta);
    double ca = std::cos(alpha), sa = std::sin(alpha);
    T << ct, -st*ca,  st*sa, a*ct,
         st,  ct*ca, -ct*sa, a*st,
         0,   sa,     ca,    d,
         0,   0,      0,     1;
    return T;
}
`,
          typescript: `// TypeScript (@coform/core)
import { dhToMatrix, multiplyMat4, degToRad } from "@coform/core";

const T1 = dhToMatrix(0, degToRad(90), 0.089, degToRad(30));
const T2 = dhToMatrix(-0.425, 0, 0, degToRad(-45));
const T_chain = multiplyMat4(T1, T2);

console.log("End-Effector Pose:", T_chain);
`,
          matlab: `% MATLAB (Robotics System Toolbox)
L1 = Link('d', 0.089, 'a', 0, 'alpha', pi/2);
L2 = Link('d', 0, 'a', -0.425, 'alpha', 0);
robot = SerialLink([L1 L2], 'name', 'UR5');
T = robot.fkine([deg2rad(30) deg2rad(-45)]);
disp(T);
`,
          rust: `// Rust (nalgebra DH Transform)
use nalgebra::Matrix4;

fn dh_matrix(a: f64, alpha: f64, d: f64, theta: f64) -> Matrix4<f64> {
    let (ct, st) = (theta.cos(), theta.sin());
    let (ca, sa) = (alpha.cos(), alpha.sin());
    Matrix4::new(
        ct, -st*ca,  st*sa, a*ct,
        st,  ct*ca, -ct*sa, a*st,
        0.0, sa,     ca,    d,
        0.0, 0.0,    0.0,   1.0,
    )
}
`,
          curl: `# Call Coform Kinematics Transform API
curl -X POST http://localhost:8000/api/v1/transforms/compose \\
  -H "Content-Type: application/json" \\
  -d '{"transforms": [{"type": "se3", "matrix": [[1,0,0,0],[0,1,0,0],[0,0,1,0.089],[0,0,0,1]]}]}'
`,
        }[lang];

      default:
        return {
          python: `# Python 3.10+ (SciPy Spatial Rotation SO3 / SE3)
import numpy as np
from scipy.spatial.transform import Rotation as R

# Quaternion [x, y, z, w] to 3x3 Rotation Matrix
r = R.from_euler('zyx', [45.0, 35.0, 25.0], degrees=True)
R_mat = r.as_matrix()
print("SO(3) Rotation Matrix:\\n", R_mat)
`,
          cpp: `// C++20 (Eigen3 Geometry)
#include <iostream>
#include <Eigen/Geometry>

int main() {
    Eigen::AngleAxisd roll(25.0 * M_PI / 180.0, Eigen::Vector3d::UnitX());
    Eigen::AngleAxisd pitch(35.0 * M_PI / 180.0, Eigen::Vector3d::UnitY());
    Eigen::AngleAxisd yaw(45.0 * M_PI / 180.0, Eigen::Vector3d::UnitZ());
    Eigen::Quaterniond q = yaw * pitch * roll;
    std::cout << "SO(3):\\n" << q.toRotationMatrix() << std::endl;
    return 0;
}
`,
          typescript: `// TypeScript (@coform/core)
import { eulerZYXToQuat, quatToRotMatrix, degToRad } from "@coform/core";

const q = eulerZYXToQuat(degToRad(25), degToRad(35), degToRad(45));
const rot3x3 = quatToRotMatrix(q);
console.log("SO(3) Matrix:", rot3x3);
`,
          matlab: `% MATLAB R2023a+
R = eul2rotm([deg2rad(45) deg2rad(35) deg2rad(25)], 'ZYX');
disp('SO(3) Rotation Matrix:');
disp(R);
`,
          rust: `// Rust (nalgebra UnitQuaternion)
use nalgebra::UnitQuaternion;

fn main() {
    let q = UnitQuaternion::from_euler_angles(
        25.0f64.to_radians(),
        35.0f64.to_radians(),
        45.0f64.to_radians()
    );
    println!("SO(3):\\n{}", q.to_rotation_matrix());
}
`,
          curl: `# Query Lie Group Transform Endpoint
curl -X GET http://localhost:8000/api/v1/health
`,
        }[lang];
    }
  };

  const copyCode = () => {
    const text = getSnippet() || "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-[#0c121e]/95 p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code2 className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              Polyglot Code Generator
            </h3>
          </div>

          {/* Language Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800/90 text-xs">
            {(["python", "cpp", "typescript", "matlab", "rust", "curl"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase transition ${
                  lang === l
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Copied!" : "Copy Snippet"}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 p-1 text-slate-400 hover:text-white transition"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable / Collapsible Code Block */}
      <div className={`mt-3 transition-all duration-300 ${isExpanded ? "max-h-96" : "max-h-36"} overflow-y-auto`}>
        <pre className="rounded-xl bg-slate-950/90 p-3 text-xs font-mono text-cyan-300 border border-slate-800/90 leading-relaxed overflow-x-auto selection:bg-cyan-500/30">
          {getSnippet()}
        </pre>
      </div>
    </div>
  );
};
