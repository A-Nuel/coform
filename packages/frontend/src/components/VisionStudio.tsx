import React, { useState } from "react";
import type { ExperienceLevel } from "@coform/core";
import { Camera, Image as ImageIcon, Sliders, Check } from "lucide-react";

interface VisionStudioProps {
  experienceLevel: ExperienceLevel;
}

export const VisionStudio: React.FC<VisionStudioProps> = ({ experienceLevel }) => {
  // Camera intrinsics parameters
  const [fx, setFx] = useState(800);
  const [fy, setFy] = useState(800);
  const [cx, setCx] = useState(640);
  const [cy, setCy] = useState(360);

  // Keypoint pairs for Homography (4 points in source -> 4 points in target)
  const [srcPoints, setSrcPoints] = useState<[number, number][]>([
    [100, 100],
    [500, 100],
    [500, 400],
    [100, 400],
  ]);

  const [dstPoints, setDstPoints] = useState<[number, number][]>([
    [120, 90],
    [480, 110],
    [520, 430],
    [80, 390],
  ]);

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 shrink-0 border-r border-slate-800 bg-slate-900/80 p-5 overflow-y-auto space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Computer Vision & Photogrammetry</h2>
          </div>
          <p className="text-xs text-slate-400">Pinhole Camera Intrinsics ($K$) & 2D Keypoint Homography</p>
        </div>

        {experienceLevel === "beginner" && (
          <div className="rounded-xl bg-emerald-950/30 border border-emerald-800/40 p-3 text-xs text-emerald-200/90 space-y-1">
            <span className="font-semibold text-emerald-400">Beginner Guide:</span>
            <p>
              Camera Intrinsics ($f_x, f_y, c_x, c_y$) model how a 3D scene projects onto a 2D image sensor.
              Use 4 keypoint pairs to align, crop, or perspective-correct planar surfaces.
            </p>
          </div>
        )}

        {/* Camera Intrinsics Matrix K */}
        <section className="space-y-3 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Pinhole Camera Matrix $K$</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="block text-slate-400">
              Focal Length $f_x$ (px)
              <input
                type="number"
                value={fx}
                onChange={(e) => setFx(+e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white font-mono"
              />
            </label>
            <label className="block text-slate-400">
              Focal Length $f_y$ (px)
              <input
                type="number"
                value={fy}
                onChange={(e) => setFy(+e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="block text-slate-400">
              Principal Point $c_x$ (px)
              <input
                type="number"
                value={cx}
                onChange={(e) => setCx(+e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white font-mono"
              />
            </label>
            <label className="block text-slate-400">
              Principal Point $c_y$ (px)
              <input
                type="number"
                value={cy}
                onChange={(e) => setCy(+e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white font-mono"
              />
            </label>
          </div>
        </section>

        {/* Matrix K Preview */}
        <section className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intrinsic Matrix $K$</div>
          <pre className="text-xs font-mono text-emerald-300 bg-slate-950 p-2.5 rounded-lg overflow-x-auto border border-slate-800">
            {`[ [${fx.toFixed(1)},    0.0, ${cx.toFixed(1)}],
  [   0.0, ${fy.toFixed(1)}, ${cy.toFixed(1)}],
  [   0.0,    0.0,    1.0] ]`}
          </pre>
        </section>
      </div>

      {/* Main Vision Workbench Canvas */}
      <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">2D Keypoint Alignment & Homography Grid</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">4 Correspondences Matched</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Source Plane */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Source Plane (Target Object)</span>
              <div className="relative h-48 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                  <polygon
                    points={srcPoints.map((p) => `${(p[0] / 640) * 100}%,${(p[1] / 400) * 100}%`).join(" ")}
                    fill="rgba(16, 185, 129, 0.15)"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  {srcPoints.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={`${(p[0] / 640) * 100}%`}
                      cy={`${(p[1] / 400) * 100}%`}
                      r="5"
                      fill="#10b981"
                    />
                  ))}
                </svg>
                <span className="text-[10px] text-slate-600 uppercase font-mono">Original Polygon</span>
              </div>
            </div>

            {/* Target Plane */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Distorted / Warped Perspective</span>
              <div className="relative h-48 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                  <polygon
                    points={dstPoints.map((p) => `${(p[0] / 640) * 100}%,${(p[1] / 400) * 100}%`).join(" ")}
                    fill="rgba(6, 182, 212, 0.15)"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                  {dstPoints.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={`${(p[0] / 640) * 100}%`}
                      cy={`${(p[1] / 400) * 100}%`}
                      r="5"
                      fill="#06b6d4"
                    />
                  ))}
                </svg>
                <span className="text-[10px] text-slate-600 uppercase font-mono">Perspective Homography</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
