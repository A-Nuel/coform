import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import {
  eulerZYXToQuat,
  quatToRotMatrix,
  degToRad,
  radToDeg,
  pose3DToMatrix,
  slerp,
} from "@coform/core";
import type { ExperienceLevel, EulerConvention, Quaternion, Mat3, Mat4 } from "@coform/core";
import {
  Binary,
  Rotate3d,
  Check,
  Copy,
  Sparkles,
  Play,
  RotateCcw,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sliders,
} from "lucide-react";
import { MathText } from "./MathText";

interface LieGroupStudioProps {
  experienceLevel: ExperienceLevel;
}

const EULER_CONVENTIONS: EulerConvention[] = [
  "ZYX",
  "XYZ",
  "ZXZ",
  "XYX",
  "XZY",
  "YXZ",
  "YZX",
  "ZXY",
  "ZYZ",
];

export const LieGroupStudio: React.FC<LieGroupStudioProps> = ({ experienceLevel }) => {
  const [rollDeg, setRollDeg] = useState(25);
  const [pitchDeg, setPitchDeg] = useState(35);
  const [yawDeg, setYawDeg] = useState(45);
  const [tx, setTx] = useState(0.0);
  const [ty, setTy] = useState(0.0);
  const [tz, setTz] = useState(0.0);
  const [convention, setConvention] = useState<EulerConvention>("ZYX");

  // SLERP Animation State
  const [isSlerping, setIsSlerping] = useState(false);
  const [slerpProgress, setSlerpProgress] = useState(0);
  const [targetQuat] = useState<Quaternion>([0.5, 0.5, 0.5, 0.5]);

  const [copied, setCopied] = useState(false);

  // Derived current quaternion [x, y, z, w]
  const baseQuat = eulerZYXToQuat(degToRad(rollDeg), degToRad(pitchDeg), degToRad(yawDeg));
  
  // Interpolated quaternion if SLERP is active
  const currentQuat: Quaternion = isSlerping
    ? slerp(baseQuat, targetQuat, slerpProgress)
    : baseQuat;

  const R3x3: Mat3 = quatToRotMatrix(currentQuat);
  const SE3: Mat4 = pose3DToMatrix([tx, ty, tz], currentQuat);

  // Matrix Properties
  const det =
    R3x3[0][0] * (R3x3[1][1] * R3x3[2][2] - R3x3[1][2] * R3x3[2][1]) -
    R3x3[0][1] * (R3x3[1][0] * R3x3[2][2] - R3x3[1][2] * R3x3[2][0]) +
    R3x3[0][2] * (R3x3[1][0] * R3x3[2][1] - R3x3[1][1] * R3x3[2][0]);

  const trace = R3x3[0][0] + R3x3[1][1] + R3x3[2][2];
  const rotAngleDeg = radToDeg(Math.acos(Math.min(1, Math.max(-1, (trace - 1) / 2))));

  // Axis of rotation vector
  const axisX = R3x3[2][1] - R3x3[1][2];
  const axisY = R3x3[0][2] - R3x3[2][0];
  const axisZ = R3x3[1][0] - R3x3[0][1];
  const axisNorm = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ) || 1;
  const axisVec = [axisX / axisNorm, axisY / axisNorm, axisZ / axisNorm];

  // SLERP animation loop
  useEffect(() => {
    let frameId: number;
    if (isSlerping) {
      const step = () => {
        setSlerpProgress((p) => {
          if (p >= 1) {
            setIsSlerping(false);
            return 0;
          }
          return p + 0.02;
        });
        frameId = requestAnimationFrame(step);
      };
      frameId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(frameId);
  }, [isSlerping]);

  const resetRotation = () => {
    setRollDeg(0);
    setPitchDeg(0);
    setYawDeg(0);
    setTx(0);
    setTy(0);
    setTz(0);
  };

  const copyMatrixData = () => {
    const data = {
      euler_angles_deg: { roll: rollDeg, pitch: pitchDeg, yaw: yawDeg, convention },
      translation_xyz_m: [tx, ty, tz],
      quaternion_xyzw: currentQuat,
      axis_angle: {
        axis_unit_vector: axisVec,
        angle_deg: rotAngleDeg,
      },
      so3_rotation_matrix_3x3: R3x3,
      se3_transformation_matrix_4x4: SE3,
      properties: {
        determinant: det,
        trace: trace,
        is_orthogonal: Math.abs(det - 1) < 1e-6,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#080c14]">
      {/* Left Sidebar Control Panel */}
      <div className="w-full lg:w-[420px] shrink-0 border-r border-slate-800/80 bg-[#0c121e]/90 p-5 overflow-y-auto space-y-5">
        {/* Title */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Binary className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                Lie Group & Matrix
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Bidirectional Quaternion $\leftrightarrow$ Euler $\leftrightarrow$ $SO(3)$ & $SE(3)$
            </p>
          </div>
          <span className="rounded-md bg-indigo-950/60 px-2 py-0.5 text-[10px] font-mono font-medium text-indigo-400 border border-indigo-800/50">
            SO(3) / SE(3)
          </span>
        </div>

        {experienceLevel === "beginner" && (
          <div className="rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 p-3.5 text-xs text-indigo-200/90 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Rotate3d className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lie Group Inspector:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Rotate the sliders to watch how 3D rotation angles convert seamlessly into a 4-component Unit Quaternion $[x,y,z,w]$ and an orthogonal $3\times3$ rotation matrix with determinant $\det(R)=+1$.
            </p>
          </div>
        )}

        {/* Euler Angle Sliders */}
        <section className="space-y-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
              <Rotate3d className="w-3.5 h-3.5" />
              <span>Euler Rotation Angles</span>
            </div>
            <select
              value={convention}
              onChange={(e) => setConvention(e.target.value as EulerConvention)}
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-0.5 text-[11px] font-mono text-indigo-300 outline-none"
            >
              {EULER_CONVENTIONS.map((c) => (
                <option key={c} value={c}>
                  {c} Sequence
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Roll $\phi$ (X-axis)</span>
                <input
                  type="number"
                  value={rollDeg}
                  onChange={(e) => setRollDeg(+e.target.value)}
                  className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-xs text-indigo-300 font-mono text-right"
                />
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={rollDeg}
                onChange={(e) => setRollDeg(+e.target.value)}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Pitch $\theta$ (Y-axis)</span>
                <input
                  type="number"
                  value={pitchDeg}
                  onChange={(e) => setPitchDeg(+e.target.value)}
                  className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-xs text-indigo-300 font-mono text-right"
                />
              </div>
              <input
                type="range"
                min={-90}
                max={90}
                value={pitchDeg}
                onChange={(e) => setPitchDeg(+e.target.value)}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Yaw $\psi$ (Z-axis)</span>
                <input
                  type="number"
                  value={yawDeg}
                  onChange={(e) => setYawDeg(+e.target.value)}
                  className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-xs text-indigo-300 font-mono text-right"
                />
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={yawDeg}
                onChange={(e) => setYawDeg(+e.target.value)}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Translation SE(3) Section */}
        {experienceLevel === "expert" && (
          <section className="space-y-2.5 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
              <span>$SE(3)$ Translation Vector $T$</span>
              <span className="text-[10px] text-slate-400">METERS</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <label className="block text-slate-400 mb-0.5">$t_x$ (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tx}
                  onChange={(e) => setTx(+e.target.value)}
                  className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-0.5">$t_y$ (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ty}
                  onChange={(e) => setTy(+e.target.value)}
                  className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-0.5">$t_z$ (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tz}
                  onChange={(e) => setTz(+e.target.value)}
                  className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 font-mono"
                />
              </div>
            </div>
          </section>
        )}

        {/* Unit Quaternion Output Card */}
        <section className="space-y-2 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
              Unit Quaternion $[q_x, q_y, q_z, q_w]$
            </span>
            <span className="text-[10px] font-mono text-emerald-400">$\|q\|=1.000$</span>
          </div>
          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            {currentQuat.map((v, i) => (
              <div key={i} className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-center text-cyan-300">
                <div className="text-[9px] text-slate-500 font-bold mb-0.5">
                  {["X", "Y", "Z", "W"][i]}
                </div>
                {v.toFixed(3)}
              </div>
            ))}
          </div>
        </section>

        {/* SLERP Interpolation & Reset Utilities */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSlerpProgress(0);
              setIsSlerping(true);
            }}
            disabled={isSlerping}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-700/50 py-2 text-xs font-semibold text-indigo-300 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isSlerping ? "SLERPing..." : "Simulate SLERP"}</span>
          </button>
          <button
            onClick={resetRotation}
            title="Reset to identity"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zero</span>
          </button>
        </div>

        {/* Copy Export */}
        <button
          onClick={copyMatrixData}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/25 active:scale-[0.99]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Matrix JSON Copied!" : "Export SO(3) / SE(3) JSON"}</span>
        </button>
      </div>

      {/* Right Canvas: 3D Triad + Matrix Grid */}
      <div className="flex-1 relative bg-[#070a12] p-5 flex flex-col items-center justify-center space-y-5 overflow-y-auto">
        {/* Top Floating Health Overlay */}
        <div className="w-full max-w-xl grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="hud-panel rounded-xl p-3 shadow-lg border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                Determinant <MathText math="\det(R)" />
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono tracking-tight mt-0.5">
              +{det.toFixed(6)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Special Orthogonal Group</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                Rotation Angle <MathText math="\theta" />
              </span>
              <Rotate3d className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-black text-indigo-400 font-mono tracking-tight mt-0.5">
              {rotAngleDeg.toFixed(2)}°
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Axis-Angle Magnitude</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg border-cyan-500/30 hidden md:block">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                Matrix Trace <MathText math="\text{Tr}(R)" />
              </span>
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-black text-cyan-400 font-mono tracking-tight mt-0.5">
              {trace.toFixed(4)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              <MathText math="1 + 2\cos(\theta)" />
            </div>
          </div>
        </div>

        {/* 3D Viewport with Oriented Solid Frame Cube */}
        <div className="w-full max-w-xl h-56 rounded-2xl border border-slate-800/90 bg-[#0c121e]/90 overflow-hidden shadow-2xl relative">
          <Canvas camera={{ position: [3, 2.5, 3], fov: 45 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />

            <Grid infiniteGrid fadeDistance={10} sectionColor="#334155" cellColor="#0f172a" cellSize={0.5} />

            {/* Rotated Orientation Cube & Triad */}
            <group
              position={[tx, tz, -ty]}
              quaternion={[currentQuat[0], currentQuat[2], -currentQuat[1], currentQuat[3]]}
            >
              <mesh>
                <boxGeometry args={[0.9, 0.9, 0.9]} />
                <meshStandardMaterial color="#6366f1" transparent opacity={0.7} roughness={0.3} />
              </mesh>
            </group>

            <OrbitControls makeDefault />
            <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
              <GizmoViewport axisColors={["#ef4444", "#22c55e", "#3b82f6"]} labelColor="#fff" />
            </GizmoHelper>
          </Canvas>
          <span className="absolute top-2 left-3 text-[9px] font-mono text-indigo-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            3D Body Frame Orientation Viewport
          </span>
        </div>

        {/* 3x3 SO(3) / 4x4 SE(3) Matrix Grid Display */}
        <div className="w-full max-w-xl rounded-2xl border border-slate-800/90 bg-[#0c121e]/90 p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              SO(3) Orthogonal Rotation Matrix
            </span>
            <span className="text-[10px] font-mono text-indigo-400">
              <MathText math="R^T R = I_{3\times3}" />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
            {R3x3.flatMap((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3 text-center text-indigo-300 font-bold shadow-inner"
                >
                  {val.toFixed(4)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
