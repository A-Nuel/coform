import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  X,
  Terminal,
  Download,
  Share2,
  Sparkles,
} from "lucide-react";

export interface PipelineAction {
  id: string;
  type: "translation" | "rotation" | "scale" | "reflection" | "shear" | "matrix";
  name: string;
  enabled: boolean;
  params: Record<string, any>;
}

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dim: 2 | 3;
  points: number[][];
  actions: PipelineAction[];
  compositeMatrix: number[][];
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  dim,
  points,
  actions,
  compositeMatrix,
}) => {
  const [lang, setLang] = useState<"python" | "cpp" | "typescript" | "matlab" | "rust" | "curl">("python");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pointsStr = JSON.stringify(points);
  const matrixStr = JSON.stringify(compositeMatrix);

  const getGeneratedCode = () => {
    switch (lang) {
      case "python":
        return `# Python 3.10+ (NumPy Linear Algebra & Coordinate Transforms)
import numpy as np

# 1. Initial Coordinates (${dim}D)
points = np.array(${pointsStr})
num_points = len(points)

# Homogeneous Coordinates (append 1s)
ones = np.ones((num_points, 1))
points_homo = np.hstack([points, ones])  # Shape: (N, ${dim + 1})

# 2. Composite Transformation Matrix (${dim + 1}x${dim + 1})
# Represents sequential chain: ${actions.filter(a => a.enabled).map(a => a.name).join(" -> ") || "Identity"}
composite_matrix = np.array(${matrixStr})

# 3. Apply Transformation: P' = P @ M.T
result_homo = points_homo @ composite_matrix.T
result_points = result_homo[:, :${dim}]

print("=== COFORM TRANSFORMATION RESULTS ===")
print(f"Original Points ({dim}D):\\n{points}")
print(f"Composite Transformation Matrix:\\n{composite_matrix}")
print(f"Resultant Transformed Coordinates:\\n{result_points}")

# Delta displacement
deltas = result_points - points
magnitudes = np.linalg.norm(deltas, axis=1)
print(f"Delta Displacements:\\n{deltas}")
print(f"Displacement Magnitudes: {magnitudes}")
`;

      case "cpp":
        return `// C++20 (Eigen3 Coordinate Transformation Engine)
#include <iostream>
#include <vector>
#include <Eigen/Dense>

int main() {
    // 1. Initial Coordinates (${dim}D)
    Eigen::MatrixXd points(${points.length}, ${dim});
    points << ${points.map(p => p.join(", ")).join(",\n              ")};

    // Homogeneous Coordinates (N x ${dim + 1})
    Eigen::MatrixXd pointsHomo(${points.length}, ${dim + 1});
    pointsHomo.leftCols(${dim}) = points;
    pointsHomo.col(${dim}).setOnes();

    // 2. Composite Transformation Matrix (${dim + 1}x${dim + 1})
    Eigen::Matrix<double, ${dim + 1}, ${dim + 1}> M;
    M << ${compositeMatrix.map(row => row.map(v => v.toFixed(4)).join(", ")).join(",\n         ")};

    // 3. Apply Transformation
    Eigen::MatrixXd resultHomo = pointsHomo * M.transpose();
    Eigen::MatrixXd result = resultHomo.leftCols(${dim});

    std::cout << "=== Resultant Coordinates ===\\n" << result << std::endl;
    return 0;
}
`;

      case "typescript":
        return `// TypeScript (@coform/core)
import { applyMat${dim + 1}ToPoint } from "@coform/core";

// 1. Initial Input Coordinates (${dim}D)
const points: number[][] = ${pointsStr};

// 2. Composite Transformation Matrix (${dim + 1}x${dim + 1})
const compositeMatrix: number[][] = ${matrixStr};

// 3. Compute Resultant Coordinates
const transformedPoints = points.map((p) => {
  ${dim === 2 ? `
  const x = compositeMatrix[0][0] * p[0] + compositeMatrix[0][1] * p[1] + compositeMatrix[0][2];
  const y = compositeMatrix[1][0] * p[0] + compositeMatrix[1][1] * p[1] + compositeMatrix[1][2];
  const w = compositeMatrix[2][0] * p[0] + compositeMatrix[2][1] * p[1] + compositeMatrix[2][2];
  return [x / (w || 1), y / (w || 1)];
  ` : `
  const x = compositeMatrix[0][0] * p[0] + compositeMatrix[0][1] * p[1] + compositeMatrix[0][2] * p[2] + compositeMatrix[0][3];
  const y = compositeMatrix[1][0] * p[0] + compositeMatrix[1][1] * p[1] + compositeMatrix[1][2] * p[2] + compositeMatrix[1][3];
  const z = compositeMatrix[2][0] * p[0] + compositeMatrix[2][1] * p[1] + compositeMatrix[2][2] * p[2] + compositeMatrix[2][3];
  return [x, y, z];
  `}
});

console.log("Transformed Coordinates:", transformedPoints);
`;

      case "matlab":
        return `% MATLAB R2023a+ (Coordinate Transformations)
points = [${points.map(p => p.join(" ")).join("; ")}];

% Homogeneous Composite Matrix (${dim + 1}x${dim + 1})
M = [${compositeMatrix.map(row => row.map(v => v.toFixed(4)).join(" ")).join("; ")}];

% Apply Transformation
points_h = [points, ones(size(points, 1), 1)];
result_h = points_h * M';
result = result_h(:, 1:${dim});

disp('Resultant Coordinates:');
disp(result);
`;

      case "rust":
        return `// Rust (nalgebra Linear Algebra Library)
use nalgebra::{DMatrix, Matrix${dim + 1}};

fn main() {
    let points = DMatrix::from_row_slice(
        ${points.length}, ${dim},
        &[${points.flat().map(v => `${v.toFixed(2)}f64`).join(", ")}]
    );

    println!("Input Points:\\n{:?}", points);
}
`;

      case "curl":
        return `# Coform Transformation REST API
curl -X POST https://coform-frontend.vercel.app/api/v1/transforms/apply \\
  -H "Content-Type: application/json" \\
  -d '{
    "transform": {
      "type": "${dim === 2 ? "affine2d" : "se3"}",
      "matrix": ${matrixStr}
    },
    "coordinates": {
      "id": "coord_set_1",
      "dim": ${dim},
      "points": ${pointsStr}
    }
  }'
`;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getGeneratedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadScript = () => {
    const extMap: Record<string, string> = {
      python: "py",
      cpp: "cpp",
      typescript: "ts",
      matlab: "m",
      rust: "rs",
      curl: "sh",
    };
    const blob = new Blob([getGeneratedCode()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coform_transform.${extMap[lang] || "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-[#0c121e] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#080d18]">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code2 className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  Export Transformation Code
                </h2>
                <span className="rounded-md bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-800/50">
                  {dim}D PIPELINE ({actions.filter(a => a.enabled).length} STAGES)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Production-ready code snippets synchronized with your active coordinates and transformation chain
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/60 bg-slate-950/60">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 p-1 border border-slate-800">
            {(["python", "cpp", "typescript", "matlab", "rust", "curl"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition ${
                  lang === l
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadScript}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied to Clipboard!" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* Code Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#070a12]">
          <pre className="rounded-xl bg-slate-950 p-5 text-xs font-mono text-cyan-300 border border-slate-800/90 leading-relaxed overflow-x-auto selection:bg-cyan-500/30">
            {getGeneratedCode()}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3 bg-[#080d18]">
          <span className="text-xs text-slate-500 font-mono">
            Generated with Double-Precision Float64 Matrices
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
