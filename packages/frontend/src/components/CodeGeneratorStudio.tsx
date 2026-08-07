import React, { useState } from "react";
import type { DomainType } from "@coform/core";
import { Code2, Copy, Check, Download, Terminal } from "lucide-react";

interface CodeGeneratorStudioProps {
  activeDomain: DomainType;
}

export const CodeGeneratorStudio: React.FC<CodeGeneratorStudioProps> = ({ activeDomain }) => {
  const [lang, setLang] = useState<"python" | "cpp" | "typescript" | "matlab" | "rust">("python");
  const [copied, setCopied] = useState(false);

  const snippets = {
    python: `# Python 3.10+ (NumPy + SciPy + Coform)
import numpy as np
from scipy.spatial.transform import Rotation as R

# Define 3D Rigid Transform SE(3)
translation = np.array([10.5, 5.0, 2500.0])  # meters
r = R.from_euler('zyx', [45.0, 30.0, 0.0], degrees=True)
rot_matrix = r.as_matrix()

# 4x4 Homogeneous Matrix
T = np.eye(4)
T[:3, :3] = rot_matrix
T[:3, 3] = translation

print("SE(3) Transformation Matrix:\\n", T)
`,
    cpp: `// C++20 (Eigen3 Library)
#include <iostream>
#include <Eigen/Dense>
#include <Eigen/Geometry>

int main() {
    Eigen::Vector3d translation(10.5, 5.0, 2500.0);
    Eigen::AngleAxisd roll(0.0, Eigen::Vector3d::UnitX());
    Eigen::AngleAxisd pitch(M_PI / 6.0, Eigen::Vector3d::UnitY());
    Eigen::AngleAxisd yaw(M_PI / 4.0, Eigen::Vector3d::UnitZ());

    Eigen::Quaterniond q = yaw * pitch * roll;
    Eigen::Matrix4d T = Eigen::Matrix4d::Identity();
    T.block<3,3>(0,0) = q.toRotationMatrix();
    T.block<3,1>(0,3) = translation;

    std::cout << "SE(3) Matrix:\\n" << T << std::endl;
    return 0;
}
`,
    typescript: `// TypeScript (@coform/core)
import { eulerZYXToQuat, pose3DToMatrix, degToRad } from "@coform/core";

const q = eulerZYXToQuat(degToRad(0), degToRad(30), degToRad(45));
const mat4 = pose3DToMatrix([10.5, 5.0, 2500.0], q);

console.log("SE(3) Matrix:", mat4);
`,
    matlab: `% MATLAB R2023a+
translation = [10.5; 5.0; 2500.0];
r = rotm2tform(eul2rotm([deg2rad(45) deg2rad(30) 0], 'ZYX'));
r(1:3, 4) = translation;

disp("SE(3) Matrix:");
disp(r);
`,
    rust: `// Rust (nalgebra crate)
use nalgebra::{Isometry3, Translation3, UnitQuaternion, Vector3};

fn main() {
    let t = Translation3::new(10.5, 5.0, 2500.0);
    let q = UnitQuaternion::from_euler_angles(0.0, 30.0f64.to_radians(), 45.0f64.to_radians());
    let iso = Isometry3::from_parts(t, q);

    println!("SE(3) Matrix:\\n{}", iso.to_homogeneous());
}
`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Polyglot Code Generator</h3>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          {(["python", "cpp", "typescript", "matlab", "rust"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-md font-semibold uppercase transition ${
                lang === l ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <pre className="rounded-xl bg-slate-950 p-4 text-xs font-mono text-cyan-300 overflow-x-auto border border-slate-800 leading-relaxed">
          {snippets[lang]}
        </pre>
        <button
          onClick={copyCode}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white border border-slate-700 transition backdrop-blur"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied!" : "Copy Code"}</span>
        </button>
      </div>
    </div>
  );
};
