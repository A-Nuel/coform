import React, { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Line } from "@react-three/drei";
import type { ExperienceLevel, Mat3, Mat4 } from "@coform/core";
import { CustomGLBModel } from "./CustomGLBModel";
import {
  identity3,
  identity4,
  multiplyMat3,
  multiplyMat4,
  degToRad,
  radToDeg,
} from "@coform/core";
import {
  Layers,
  Plus,
  Trash2,
  Sliders,
  RotateCw,
  Move,
  Maximize2,
  FlipHorizontal,
  Box,
  Copy,
  Check,
  Code2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Grid as GridIcon,
  Edit3,
} from "lucide-react";
import { MathText } from "./MathText";
import type { PipelineAction } from "./CodeExportModal";

interface TransformationWorkbenchProps {
  experienceLevel: ExperienceLevel;
  onOpenCodeExport: (dim: 2 | 3, points: number[][], actions: PipelineAction[], compositeMatrix: number[][]) => void;
}

// 2D Shape Primitives
const PRIMITIVES_2D: Record<string, { name: string; points: number[][] }> = {
  square: {
    name: "Unit Square",
    points: [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ],
  },
  triangle: {
    name: "Equilateral Triangle",
    points: [
      [-1.5, -1],
      [1.5, -1],
      [0, 1.6],
    ],
  },
  arrow: {
    name: "Direction Arrow",
    points: [
      [0, 2],
      [-1, 0],
      [-0.4, 0],
      [-0.4, -2],
      [0.4, -2],
      [0.4, 0],
      [1, 0],
    ],
  },
  letter_f: {
    name: "Asymmetric 'F'",
    points: [
      [0, -2],
      [0, 2],
      [1.5, 2],
      [1.5, 1.4],
      [0.6, 1.4],
      [0.6, 0.4],
      [1.2, 0.4],
      [1.2, -0.2],
      [0.6, -0.2],
      [0.6, -2],
    ],
  },
};

// 3D Shape Primitives
const PRIMITIVES_3D: Record<string, { name: string; points: number[][] }> = {
  cube: {
    name: "Unit Cube (8 Vertices)",
    points: [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ],
  },
  pyramid: {
    name: "Square Pyramid (5 Vertices)",
    points: [
      [-1.5, -1, -1.5],
      [1.5, -1, -1.5],
      [1.5, -1, 1.5],
      [-1.5, -1, 1.5],
      [0, 1.8, 0],
    ],
  },
  triad: {
    name: "Coordinate Axis Triad",
    points: [
      [0, 0, 0],
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, 2],
    ],
  },
};

export type LengthUnit = "mm" | "m" | "in";

export const TransformationWorkbench: React.FC<TransformationWorkbenchProps> = ({
  experienceLevel,
  onOpenCodeExport,
}) => {
  // Dimension state: 2D or 3D
  const [dim, setDim] = useState<2 | 3>(2);

  // Industry Standard Unit System: mm (Default CAD / Robotics standard), m, in
  const [unit, setUnit] = useState<LengthUnit>("mm");

  // Input Points state
  const [points, setPoints] = useState<number[][]>(PRIMITIVES_2D.square.points);

  // 3D View Mode: "cad" (CAD Part GLB) vs "points" (Point Cloud Primitives)
  const [view3DMode, setView3DMode] = useState<"cad" | "points">("cad");

  // Transformation Action Pipeline
  const [actions, setActions] = useState<PipelineAction[]>([
    {
      id: "1",
      type: "translation",
      name: "Translation",
      enabled: true,
      params: { dx: 1.5, dy: 1.0, dz: 0.0 },
    },
    {
      id: "2",
      type: "rotation",
      name: "Rotation",
      enabled: true,
      params: { angleDeg: 30, rollDeg: 0, pitchDeg: 0, yawDeg: 30 },
    },
    {
      id: "3",
      type: "scale",
      name: "Scaling",
      enabled: true,
      params: { sx: 1.2, sy: 1.2, sz: 1.0, uniform: true },
    },
  ]);

  const [copiedCoords, setCopiedCoords] = useState(false);

  // Switch dimension and load appropriate default primitive
  const handleDimChange = (newDim: 2 | 3) => {
    setDim(newDim);
    if (newDim === 2) {
      setPoints(PRIMITIVES_2D.square.points);
    } else {
      setPoints(PRIMITIVES_3D.cube.points);
    }
  };

  // Point Management
  const updatePointCoord = (pointIndex: number, axisIndex: number, val: number) => {
    setPoints((prev) => {
      const next = prev.map((p, idx) => {
        if (idx !== pointIndex) return p;
        const newP = [...p];
        newP[axisIndex] = val;
        return newP;
      });
      return next;
    });
  };

  const addCustomPoint = () => {
    setPoints((prev) => [
      ...prev,
      dim === 2 ? [0, 0] : [0, 0, 0],
    ]);
  };

  const removeCustomPoint = (idx: number) => {
    if (points.length <= 1) return;
    setPoints((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add Action to Pipeline
  const addAction = (type: PipelineAction["type"]) => {
    const id = String(Date.now());
    let newAction: PipelineAction;

    switch (type) {
      case "translation":
        newAction = {
          id,
          type: "translation",
          name: "Translation",
          enabled: true,
          params: { dx: 1.0, dy: 1.0, dz: 1.0 },
        };
        break;
      case "rotation":
        newAction = {
          id,
          type: "rotation",
          name: "Rotation",
          enabled: true,
          params: { angleDeg: 45, rollDeg: 0, pitchDeg: 0, yawDeg: 45 },
        };
        break;
      case "scale":
        newAction = {
          id,
          type: "scale",
          name: "Scale",
          enabled: true,
          params: { sx: 1.5, sy: 1.5, sz: 1.5, uniform: true },
        };
        break;
      case "reflection":
        newAction = {
          id,
          type: "reflection",
          name: "Reflection",
          enabled: true,
          params: { axis: "x" },
        };
        break;
      case "shear":
        newAction = {
          id,
          type: "shear",
          name: "Shear",
          enabled: true,
          params: { shx: 0.5, shy: 0.0 },
        };
        break;
      default:
        newAction = {
          id,
          type: "translation",
          name: "Translation",
          enabled: true,
          params: { dx: 0, dy: 0, dz: 0 },
        };
    }

    setActions((prev) => [...prev, newAction]);
  };

  const updateActionParam = (id: string, paramKey: string, val: any) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, params: { ...a.params, [paramKey]: val } } : a
      )
    );
  };

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  // Convert individual action to a 3x3 (2D) or 4x4 (3D) transformation matrix
  const getActionMatrix = (action: PipelineAction): number[][] => {
    if (dim === 2) {
      switch (action.type) {
        case "translation": {
          const { dx = 0, dy = 0 } = action.params;
          return [
            [1, 0, dx],
            [0, 1, dy],
            [0, 0, 1],
          ];
        }
        case "rotation": {
          const rad = degToRad(action.params.angleDeg || 0);
          const c = Math.cos(rad);
          const s = Math.sin(rad);
          return [
            [c, -s, 0],
            [s, c, 0],
            [0, 0, 1],
          ];
        }
        case "scale": {
          const { sx = 1, sy = 1 } = action.params;
          return [
            [sx, 0, 0],
            [0, sy, 0],
            [0, 0, 1],
          ];
        }
        case "reflection": {
          const axis = action.params.axis || "x";
          if (axis === "x") {
            return [
              [1, 0, 0],
              [0, -1, 0],
              [0, 0, 1],
            ];
          } else if (axis === "y") {
            return [
              [-1, 0, 0],
              [0, 1, 0],
              [0, 0, 1],
            ];
          } else {
            return [
              [-1, 0, 0],
              [0, -1, 0],
              [0, 0, 1],
            ];
          }
        }
        case "shear": {
          const { shx = 0, shy = 0 } = action.params;
          return [
            [1, shx, 0],
            [shy, 1, 0],
            [0, 0, 1],
          ];
        }
        default:
          return identity3();
      }
    } else {
      // 3D Matrices (4x4)
      switch (action.type) {
        case "translation": {
          const { dx = 0, dy = 0, dz = 0 } = action.params;
          return [
            [1, 0, 0, dx],
            [0, 1, 0, dy],
            [0, 0, 1, dz],
            [0, 0, 0, 1],
          ];
        }
        case "rotation": {
          const yaw = degToRad(action.params.yawDeg || 0);
          const pitch = degToRad(action.params.pitchDeg || 0);
          const roll = degToRad(action.params.rollDeg || 0);

          const cy = Math.cos(yaw), sy = Math.sin(yaw);
          const cp = Math.cos(pitch), sp = Math.sin(pitch);
          const cr = Math.cos(roll), sr = Math.sin(roll);

          return [
            [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr, 0],
            [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr, 0],
            [-sp, cp * sr, cp * cr, 0],
            [0, 0, 0, 1],
          ];
        }
        case "scale": {
          const { sx = 1, sy = 1, sz = 1 } = action.params;
          return [
            [sx, 0, 0, 0],
            [0, sy, 0, 0],
            [0, 0, sz, 0],
            [0, 0, 0, 1],
          ];
        }
        case "reflection": {
          const axis = action.params.axis || "xy";
          if (axis === "xy") {
            return [
              [1, 0, 0, 0],
              [0, 1, 0, 0],
              [0, 0, -1, 0],
              [0, 0, 0, 1],
            ];
          } else {
            return [
              [-1, 0, 0, 0],
              [0, 1, 0, 0],
              [0, 0, 1, 0],
              [0, 0, 0, 1],
            ];
          }
        }
        default:
          return identity4();
      }
    }
  };

  // Compute Composite Transformation Matrix: M = M_k * ... * M_1
  const compositeMatrix = useMemo(() => {
    if (dim === 2) {
      let acc = identity3();
      actions
        .filter((a) => a.enabled)
        .forEach((a) => {
          const m = getActionMatrix(a) as Mat3;
          acc = multiplyMat3(m, acc);
        });
      return acc;
    } else {
      let acc = identity4();
      actions
        .filter((a) => a.enabled)
        .forEach((a) => {
          const m = getActionMatrix(a) as Mat4;
          acc = multiplyMat4(m, acc);
        });
      return acc;
    }
  }, [dim, actions]);

  // Compute Resultant Transformed Points: P' = M * P
  const transformedPoints = useMemo(() => {
    return points.map((p) => {
      const px = p[0] ?? 0;
      const py = p[1] ?? 0;
      const pz = p[2] ?? 0;

      if (dim === 2) {
        const x = compositeMatrix[0][0] * px + compositeMatrix[0][1] * py + compositeMatrix[0][2];
        const y = compositeMatrix[1][0] * px + compositeMatrix[1][1] * py + compositeMatrix[1][2];
        const w = compositeMatrix[2][0] * px + compositeMatrix[2][1] * py + compositeMatrix[2][2];
        return [x / (w || 1), y / (w || 1)];
      } else {
        const m = compositeMatrix as Mat4;
        const x = m[0][0] * px + m[0][1] * py + m[0][2] * pz + m[0][3];
        const y = m[1][0] * px + m[1][1] * py + m[1][2] * pz + m[1][3];
        const z = m[2][0] * px + m[2][1] * py + m[2][2] * pz + m[2][3];
        return [x, y, z];
      }
    });
  }, [dim, points, compositeMatrix]);

  // Copy resultant coordinates as CSV / JSON
  const copyResultantCoords = () => {
    const data = transformedPoints.map((tp, i) => ({
      index: i + 1,
      original: points[i],
      transformed: tp,
      delta: tp.map((v, axisIdx) => +(v - points[i][axisIdx]).toFixed(4)),
    }));
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Convert SVG coordinates for 2D Viewport (Center at 250, 250, scale 25px per unit)
  const toSvgCoords = (x: number, y: number): [number, number] => {
    const scale = 25;
    return [250 + x * scale, 250 - y * scale];
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#080c14]">
      {/* LEFT PANEL: Input Coordinates & Action Pipeline */}
      <div className="w-full lg:w-[430px] shrink-0 border-r border-slate-800/80 bg-[#0c121e]/95 p-4 overflow-y-auto space-y-5">
        {/* Dimension & Title Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Box className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Transformation Workbench
              </h2>
              <p className="text-[10px] text-slate-400">
                Coordinate Engine & Action Chaining
              </p>
            </div>
          </div>

          {/* 2D / 3D & Unit System Controls */}
          <div className="flex items-center gap-1.5">
            {/* Unit Selector */}
            <div className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-[10px]">
              {(["mm", "m", "in"] as LengthUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-2 py-0.5 rounded-lg font-mono font-bold transition ${
                    unit === u
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  title={`Measurement Unit: ${u === "mm" ? "Millimeters (CAD Standard)" : u === "m" ? "Meters" : "Inches"}`}
                >
                  {u}
                </button>
              ))}
            </div>

            {/* 2D / 3D Toggle */}
            <div className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => handleDimChange(2)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition ${
                  dim === 2
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2D
              </button>
              <button
                onClick={() => handleDimChange(3)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition ${
                  dim === 3
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3D
              </button>
            </div>

            {/* 3D Mode Selector Pills (CAD Part vs Point Cloud) */}
            {dim === 3 && (
              <div className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-[10px]">
                <button
                  onClick={() => setView3DMode("cad")}
                  className={`px-2 py-0.5 rounded-lg font-mono font-bold transition ${
                    view3DMode === "cad"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  title="3D Mechanical CAD Component"
                >
                  CAD (GLB)
                </button>
                <button
                  onClick={() => setView3DMode("points")}
                  className={`px-2 py-0.5 rounded-lg font-mono font-bold transition ${
                    view3DMode === "points"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  title="3D Point Cloud & Primitives"
                >
                  Points
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 1. Coordinate Inputs: Manual Points Entry & Presets */}
        <section className="space-y-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Input Coordinates ({unit})</span>
            </span>
            <button
              onClick={addCustomPoint}
              className="flex items-center gap-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono font-bold transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add Point</span>
            </button>
          </div>

          {/* Direct Coordinate Inputs Rows */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {points.map((p, pIdx) => (
              <div key={pIdx} className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono font-bold text-slate-400 w-6">
                  P{pIdx + 1}
                </span>
                <div className="flex items-center gap-1 flex-1">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[9px] text-slate-500 font-mono">X:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={p[0]}
                      onChange={(e) => updatePointCoord(pIdx, 0, +e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700/80 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono text-center outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[9px] text-slate-500 font-mono">Y:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={p[1]}
                      onChange={(e) => updatePointCoord(pIdx, 1, +e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-700/80 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono text-center outline-none focus:border-cyan-500"
                    />
                  </div>
                  {dim === 3 && (
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[9px] text-slate-500 font-mono">Z:</span>
                      <input
                        type="number"
                        step="0.1"
                        value={p[2] ?? 0}
                        onChange={(e) => updatePointCoord(pIdx, 2, +e.target.value)}
                        className="w-full rounded bg-slate-950 border border-slate-700/80 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono text-center outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>
                {points.length > 1 && (
                  <button
                    onClick={() => removeCustomPoint(pIdx)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick Shape Presets */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-[10px] font-mono text-slate-400 mb-1">Quick Primitive Templates:</div>
            <div className="grid grid-cols-2 gap-1.5">
              {dim === 2
                ? Object.entries(PRIMITIVES_2D).map(([key, prim]) => (
                    <button
                      key={key}
                      onClick={() => setPoints(prim.points)}
                      className="truncate rounded bg-slate-900 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 px-2 py-1 text-left text-[10px] font-medium text-slate-300 hover:text-cyan-200 transition"
                    >
                      {prim.name}
                    </button>
                  ))
                : Object.entries(PRIMITIVES_3D).map(([key, prim]) => (
                    <button
                      key={key}
                      onClick={() => setPoints(prim.points)}
                      className="truncate rounded bg-slate-900 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/40 px-2 py-1 text-left text-[10px] font-medium text-slate-300 hover:text-indigo-200 transition"
                    >
                      {prim.name}
                    </button>
                  ))}
            </div>
          </div>
        </section>

        {/* 2. Transformation Pipeline Deck */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Transformation Action Pipeline</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              {actions.filter((a) => a.enabled).length} ACTIVE STAGES
            </span>
          </div>

          {/* Add Action Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => addAction("translation")}
              className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition"
            >
              <Move className="w-3 h-3 text-cyan-400" />
              <span>+ Translate</span>
            </button>
            <button
              onClick={() => addAction("rotation")}
              className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition"
            >
              <RotateCw className="w-3 h-3 text-indigo-400" />
              <span>+ Rotate</span>
            </button>
            <button
              onClick={() => addAction("scale")}
              className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition"
            >
              <Maximize2 className="w-3 h-3 text-emerald-400" />
              <span>+ Scale</span>
            </button>
            <button
              onClick={() => addAction("reflection")}
              className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition"
            >
              <FlipHorizontal className="w-3 h-3 text-amber-400" />
              <span>+ Reflect</span>
            </button>
          </div>

          {/* Action List Cards */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {actions.map((action, idx) => (
              <div
                key={action.id}
                className={`rounded-xl border p-3 space-y-2.5 transition-all ${
                  action.enabled
                    ? "bg-slate-950/80 border-slate-800"
                    : "bg-slate-950/30 border-slate-800/40 opacity-50"
                }`}
              >
                {/* Action Card Header */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAction(action.id)}
                      className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                        action.enabled
                          ? "bg-cyan-500 border-cyan-400 text-black"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {action.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className="text-xs font-bold text-slate-200 font-mono">
                      #{idx + 1} {action.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeAction(action.id)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Translation: Number Input + Slider Dual Controls */}
                {action.type === "translation" && (
                  <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">ΔX shift</span>
                        <input
                          type="number"
                          step="0.1"
                          value={action.params.dx}
                          onChange={(e) => updateActionParam(action.id, "dx", +e.target.value)}
                          className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-[10px] text-cyan-300 font-mono text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        step={0.1}
                        value={action.params.dx}
                        onChange={(e) => updateActionParam(action.id, "dx", +e.target.value)}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">ΔY shift</span>
                        <input
                          type="number"
                          step="0.1"
                          value={action.params.dy}
                          onChange={(e) => updateActionParam(action.id, "dy", +e.target.value)}
                          className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-[10px] text-cyan-300 font-mono text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        step={0.1}
                        value={action.params.dy}
                        onChange={(e) => updateActionParam(action.id, "dy", +e.target.value)}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    {dim === 3 && (
                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400">ΔZ shift</span>
                          <input
                            type="number"
                            step="0.1"
                            value={action.params.dz}
                            onChange={(e) => updateActionParam(action.id, "dz", +e.target.value)}
                            className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-[10px] text-cyan-300 font-mono text-right"
                          />
                        </div>
                        <input
                          type="range"
                          min={-5}
                          max={5}
                          step={0.1}
                          value={action.params.dz}
                          onChange={(e) => updateActionParam(action.id, "dz", +e.target.value)}
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Rotation: Number Input + Slider Dual Controls */}
                {action.type === "rotation" && (
                  <div className="space-y-2 text-[11px]">
                    {dim === 2 ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400">Angle (θ deg)</span>
                          <input
                            type="number"
                            value={action.params.angleDeg}
                            onChange={(e) => updateActionParam(action.id, "angleDeg", +e.target.value)}
                            className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-[10px] text-indigo-300 font-mono text-right"
                          />
                        </div>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={action.params.angleDeg}
                          onChange={(e) => updateActionParam(action.id, "angleDeg", +e.target.value)}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-0.5">Yaw (°)</label>
                          <input
                            type="number"
                            value={action.params.yawDeg}
                            onChange={(e) => updateActionParam(action.id, "yawDeg", +e.target.value)}
                            className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono text-[10px]"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-0.5">Pitch (°)</label>
                          <input
                            type="number"
                            value={action.params.pitchDeg}
                            onChange={(e) => updateActionParam(action.id, "pitchDeg", +e.target.value)}
                            className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono text-[10px]"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-0.5">Roll (°)</label>
                          <input
                            type="number"
                            value={action.params.rollDeg}
                            onChange={(e) => updateActionParam(action.id, "rollDeg", +e.target.value)}
                            className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono text-[10px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Scale: Number Input + Slider Dual Controls */}
                {action.type === "scale" && (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">Scale X</span>
                        <input
                          type="number"
                          step="0.1"
                          value={action.params.sx}
                          onChange={(e) => updateActionParam(action.id, "sx", +e.target.value)}
                          className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-[10px] text-emerald-300 font-mono text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={action.params.sx}
                        onChange={(e) => updateActionParam(action.id, "sx", +e.target.value)}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">Scale Y</span>
                        <input
                          type="number"
                          step="0.1"
                          value={action.params.sy}
                          onChange={(e) => updateActionParam(action.id, "sy", +e.target.value)}
                          className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-[10px] text-emerald-300 font-mono text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={action.params.sy}
                        onChange={(e) => updateActionParam(action.id, "sy", +e.target.value)}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {action.type === "reflection" && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Reflect Across:</span>
                    {["x", "y", "origin"].map((axis) => (
                      <button
                        key={axis}
                        onClick={() => updateActionParam(action.id, "axis", axis)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition ${
                          action.params.axis === axis
                            ? "bg-amber-600 text-white"
                            : "bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {axis}-axis
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Export Action Button */}
        <button
          onClick={() => onOpenCodeExport(dim, points, actions, compositeMatrix)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-cyan-600/25 active:scale-[0.99]"
        >
          <Code2 className="w-4 h-4" />
          <span>Export as Code (Python / C++ / Rust / TS)</span>
        </button>
      </div>

      {/* CENTER PANEL: Real-Time Dual Viewport (2D SVG Grid / 3D Three.js) */}
      <div className="flex-1 relative bg-[#070a12] flex flex-col overflow-hidden">
        {/* Top HUD Telemetry Banner */}
        <div className="absolute top-4 left-4 right-4 z-10 grid grid-cols-2 md:grid-cols-3 gap-3 pointer-events-none">
          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Active Space</span>
              <Box className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-lg font-black text-cyan-400 font-mono tracking-tight mt-0.5">
              {dim}D Cartesian
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {points.length} Geometry Vertices
            </div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Pipeline Chaining</span>
              <Layers className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-lg font-black text-indigo-400 font-mono tracking-tight mt-0.5">
              {actions.filter((a) => a.enabled).length} Actions Composed
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              <MathText math="M_{\text{composite}} = M_k \cdots M_1" />
            </div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-emerald-500/30 hidden md:block">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Max Displacement</span>
              <Maximize2 className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono tracking-tight mt-0.5">
              {Math.max(
                ...transformedPoints.map((tp, i) => {
                  const dx = tp[0] - points[i][0];
                  const dy = tp[1] - points[i][1];
                  const dz = dim === 3 ? tp[2] - (points[i][2] ?? 0) : 0;
                  return Math.sqrt(dx * dx + dy * dy + dz * dz);
                })
              ).toFixed(2)}{" "}
              <span className="text-xs font-normal text-emerald-400/70">{unit}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Delta <MathText math="\|P_i' - P_i\|" /> ({unit})
            </div>
          </div>
        </div>

        {/* Main Viewport Content */}
        <div className="flex-1 w-full h-full flex items-center justify-center p-4">
          {dim === 2 ? (
            /* 2D Interactive SVG Vector Grid */
            <div className="relative w-[500px] h-[500px] rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 500 500">
                {/* Metric Grid Lines */}
                <defs>
                  <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridPattern)" />

                {/* X and Y Axes */}
                <line x1="0" y1="250" x2="500" y2="250" stroke="#475569" strokeWidth="1.5" />
                <line x1="250" y1="0" x2="250" y2="500" stroke="#475569" strokeWidth="1.5" />

                {/* Displacement Vector Arrows (Original -> Transformed) */}
                {points.map((p, i) => {
                  const [origX, origY] = toSvgCoords(p[0], p[1]);
                  const [transX, transY] = toSvgCoords(transformedPoints[i][0], transformedPoints[i][1]);
                  return (
                    <line
                      key={`arrow-${i}`}
                      x1={origX}
                      y1={origY}
                      x2={transX}
                      y2={transY}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  );
                })}

                {/* Original Shape (Ghost) */}
                <polygon
                  points={points.map((p) => toSvgCoords(p[0], p[1]).join(",")).join(" ")}
                  fill="rgba(100, 116, 139, 0.15)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                {/* Original Vertices */}
                {points.map((p, i) => {
                  const [cx, cy] = toSvgCoords(p[0], p[1]);
                  return <circle key={`orig-${i}`} cx={cx} cy={cy} r="4" fill="#64748b" />;
                })}

                {/* Transformed Shape (Glowing Active) */}
                <polygon
                  points={transformedPoints.map((p) => toSvgCoords(p[0], p[1]).join(",")).join(" ")}
                  fill="rgba(6, 182, 212, 0.2)"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />

                {/* Transformed Vertices with Coordinates Tooltip */}
                {transformedPoints.map((p, i) => {
                  const [cx, cy] = toSvgCoords(p[0], p[1]);
                  return (
                    <g key={`trans-${i}`} className="group cursor-pointer">
                      <circle cx={cx} cy={cy} r="6" fill="#22d3ee" stroke="#080c14" strokeWidth="2" />
                      <text
                        x={cx + 8}
                        y={cy - 8}
                        fill="#22d3ee"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        P{i + 1}({p[0].toFixed(1)}, {p[1].toFixed(1)})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            /* 3D WebGL Three.js Viewport */
            <div className="w-full h-full cursor-grab active:cursor-grabbing">
              <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 15, 10]} intensity={1.2} />

                <Grid infiniteGrid fadeDistance={15} sectionSize={2} sectionColor="#334155" cellColor="#0f172a" cellSize={0.5} />

                {view3DMode === "cad" ? (
                  <>
                    {/* Ghost Original Mechanical CAD Component */}
                    <Suspense fallback={null}>
                      <CustomGLBModel url="/models/cad_part.glb" scale={0.7} ghost opacity={0.35} />
                    </Suspense>

                    {/* Resultant Transformed Mechanical CAD Component */}
                    <Suspense fallback={null}>
                      <CustomGLBModel url="/models/cad_part.glb" scale={0.7} matrix4x4={compositeMatrix} />
                    </Suspense>
                  </>
                ) : (
                  <>
                    {/* Render Original 3D Vertices (Ghost) */}
                    {points.map((p, i) => (
                      <mesh key={`3d-orig-${i}`} position={[p[0], p[1], p[2] ?? 0]}>
                        <sphereGeometry args={[0.08, 16, 16]} />
                        <meshStandardMaterial color="#64748b" transparent opacity={0.5} />
                      </mesh>
                    ))}

                    {/* Render Transformed 3D Vertices (Luminous) */}
                    {transformedPoints.map((p, i) => (
                      <mesh key={`3d-trans-${i}`} position={[p[0], p[1], p[2]]}>
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.8} />
                      </mesh>
                    ))}

                    {/* Displacement Trails */}
                    {points.map((p, i) => (
                      <Line
                        key={`3d-line-${i}`}
                        points={[
                          [p[0], p[1], p[2] ?? 0],
                          [transformedPoints[i][0], transformedPoints[i][1], transformedPoints[i][2]],
                        ]}
                        color="#f59e0b"
                        lineWidth={1.5}
                        dashed
                        dashScale={3}
                      />
                    ))}
                  </>
                )}

                <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
                <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                  <GizmoViewport axisColors={["#ef4444", "#22c55e", "#3b82f6"]} labelColor="#fff" />
                </GizmoHelper>
              </Canvas>
            </div>
          )}
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="hud-panel rounded-xl px-4 py-2 text-xs text-slate-300 pointer-events-auto flex items-center gap-4 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span className="font-medium text-xs">Original Input P</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="font-medium text-xs">Resultant Transformed P'</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-4 rounded bg-amber-400/80" />
              <span className="text-[11px] text-slate-400">Δ Displacement Vector</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Resultant Coordinates Table & Composite Matrix */}
      <div className="w-full lg:w-[380px] shrink-0 border-l border-slate-800/80 bg-[#0c121e]/95 p-4 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              Resultant Coordinates
            </h3>
          </div>
          <button
            onClick={copyResultantCoords}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition"
          >
            {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedCoords ? "Copied!" : "Copy Data"}</span>
          </button>
        </div>

        {/* Resultant Coordinates Comparison Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Original ({unit})</th>
                <th className="p-2 text-left text-cyan-400">Resultant P' ({unit})</th>
                <th className="p-2 text-left text-amber-400">Δ ({unit})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {points.map((p, i) => {
                const tp = transformedPoints[i];
                const dx = tp[0] - p[0];
                const dy = tp[1] - p[1];
                const dz = dim === 3 ? tp[2] - (p[2] ?? 0) : 0;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                return (
                  <tr key={i} className="hover:bg-slate-900/50 transition">
                    <td className="p-2 text-slate-500 font-bold">P{i + 1}</td>
                    <td className="p-2 text-slate-400">
                      ({p.map((v) => v.toFixed(1)).join(", ")})
                    </td>
                    <td className="p-2 text-cyan-300 font-semibold">
                      ({tp.map((v) => v.toFixed(2)).join(", ")})
                    </td>
                    <td className="p-2 text-amber-400">{dist.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Composite Matrix Display */}
        <section className="rounded-xl bg-slate-950/80 p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Composite Matrix ({dim + 1}x{dim + 1})
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              <MathText math="M = M_k \cdots M_1" />
            </span>
          </div>

          <div
            className={`grid gap-1.5 font-mono text-xs ${
              dim === 2 ? "grid-cols-3" : "grid-cols-4"
            }`}
          >
            {compositeMatrix.flatMap((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-center text-cyan-300 font-bold"
                >
                  {val.toFixed(2)}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
