import React, { useState } from "react";
import {
  eulerZYXToQuat,
  quatToEulerZYX,
  quatToRotMatrix,
  degToRad,
  radToDeg,
} from "@coform/core";
import type { ExperienceLevel, EulerConvention } from "@coform/core";
import { Binary, RefreshCw, Check, Copy } from "lucide-react";

interface LieGroupStudioProps {
  experienceLevel: ExperienceLevel;
}

export const LieGroupStudio: React.FC<LieGroupStudioProps> = ({ experienceLevel }) => {
  // Input representations
  const [rollDeg, setRollDeg] = useState(15);
  const [pitchDeg, setPitchDeg] = useState(30);
  const [yawDeg, setYawDeg] = useState(45);
  const [convention, setConvention] = useState<EulerConvention>("ZYX");

  // Quaternion state derived or editable
  const quat = eulerZYXToQuat(degToRad(rollDeg), degToRad(pitchDeg), degToRad(yawDeg));
  const R3x3 = quatToRotMatrix(quat);

  // Compute Matrix Properties
  const det =
    R3x3[0][0] * (R3x3[1][1] * R3x3[2][2] - R3x3[1][2] * R3x3[2][1]) -
    R3x3[0][1] * (R3x3[1][0] * R3x3[2][2] - R3x3[1][2] * R3x3[2][0]) +
    R3x3[0][2] * (R3x3[1][0] * R3x3[2][1] - R3x3[1][1] * R3x3[2][0]);

  const trace = R3x3[0][0] + R3x3[1][1] + R3x3[2][2];
  const rotAngleDeg = radToDeg(Math.acos(Math.min(1, Math.max(-1, (trace - 1) / 2))));

  const [copied, setCopied] = useState(false);

  const copyMatrix = () => {
    const jsonStr = JSON.stringify(
      {
        quaternion_xyzw: quat,
        euler_deg: { roll: rollDeg, pitch: pitchDeg, yaw: yawDeg, convention },
        rotation_matrix_3x3: R3x3,
        matrix_determinant: det,
        rotation_angle_deg: rotAngleDeg,
      },
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 shrink-0 border-r border-slate-800 bg-slate-900/80 p-5 overflow-y-auto space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Lie Group & Matrix Inspector</h2>
          </div>
          <p className="text-xs text-slate-400">Bidirectional Quaternion $\leftrightarrow$ Euler $\leftrightarrow$ $SO(3)$ Conversion</p>
        </div>

        {/* Euler Angle Inputs */}
        <section className="space-y-3 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <span>Euler Angles & Convention</span>
            <span className="text-[10px] text-slate-400">{convention}</span>
          </div>

          <label className="block text-xs text-slate-400">
            Roll $\phi$ (X-axis deg)
            <input
              type="range"
              min={-180}
              max={180}
              value={rollDeg}
              onChange={(e) => setRollDeg(+e.target.value)}
              className="mt-1 w-full"
            />
            <span className="float-right text-indigo-300 font-mono">{rollDeg}°</span>
          </label>

          <label className="block text-xs text-slate-400">
            Pitch $\theta$ (Y-axis deg)
            <input
              type="range"
              min={-90}
              max={90}
              value={pitchDeg}
              onChange={(e) => setPitchDeg(+e.target.value)}
              className="mt-1 w-full"
            />
            <span className="float-right text-indigo-300 font-mono">{pitchDeg}°</span>
          </label>

          <label className="block text-xs text-slate-400">
            Yaw $\psi$ (Z-axis deg)
            <input
              type="range"
              min={-180}
              max={180}
              value={yawDeg}
              onChange={(e) => setYawDeg(+e.target.value)}
              className="mt-1 w-full"
            />
            <span className="float-right text-indigo-300 font-mono">{yawDeg}°</span>
          </label>
        </section>

        {/* Quaternion Output */}
        <section className="space-y-2 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Quaternion $[q_x, q_y, q_z, q_w]$</span>
          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            {quat.map((v, i) => (
              <div key={i} className="rounded bg-slate-900 border border-slate-800 p-2 text-center text-cyan-300">
                {v.toFixed(3)}
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={copyMatrix}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/20"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Matrix JSON Copied!" : "Export Matrix JSON"}</span>
        </button>
      </div>

      {/* Main Matrix Inspector Display */}
      <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
        <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">$SO(3)$ Rotation Matrix (3x3)</h3>
            <span className="text-xs text-indigo-400 font-mono">Orthogonal $R^T R = I$</span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-sm">
            {R3x3.flatMap((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-center text-indigo-300 font-bold shadow-inner"
                >
                  {val.toFixed(4)}
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-xs">
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">Determinant $\det(R)$</span>
              <div className="text-base font-bold text-emerald-400 font-mono">{det.toFixed(6)}</div>
            </div>
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">Rotation Angle $\theta$</span>
              <div className="text-base font-bold text-cyan-400 font-mono">{rotAngleDeg.toFixed(2)}°</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
