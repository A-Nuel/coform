import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Line } from "@react-three/drei";
import { cameraIntrinsicsMatrix, project3DTo2DPlane } from "@coform/core";
import type { ExperienceLevel, Mat3 } from "@coform/core";
import {
  Camera,
  Sliders,
  Image as ImageIcon,
  Check,
  Copy,
  Sparkles,
  Maximize2,
  Scan,
  RefreshCw,
} from "lucide-react";

interface VisionStudioProps {
  experienceLevel: ExperienceLevel;
}

const CAMERA_PRESETS = [
  { name: "Intel RealSense D435", fx: 640, fy: 640, cx: 640, cy: 360, res: "1280x720" },
  { name: "Industrial HD 1080p", fx: 1250, fy: 1250, cx: 960, cy: 540, res: "1920x1080" },
  { name: "Autonomous Vehicle Cam", fx: 850, fy: 850, cx: 640, cy: 400, res: "1280x800" },
  { name: "Micro Drone FPV", fx: 420, fy: 420, cx: 320, cy: 240, res: "640x480" },
];

export const VisionStudio: React.FC<VisionStudioProps> = ({ experienceLevel }) => {
  // Camera intrinsics parameters
  const [fx, setFx] = useState(640);
  const [fy, setFy] = useState(640);
  const [cx, setCx] = useState(640);
  const [cy, setCy] = useState(360);
  const [skew, setSkew] = useState(0);

  // 3D Test Point in World (for camera projection test)
  const [target3DX, setTarget3DX] = useState(0.5);
  const [target3DY, setTarget3DY] = useState(0.2);
  const [target3DZ, setTarget3DZ] = useState(2.5); // Depth in meters

  // Keypoint pairs for Homography (4 points in source -> 4 points in target)
  const [srcPoints] = useState<[number, number][]>([
    [60, 60],
    [340, 60],
    [340, 240],
    [60, 240],
  ]);

  const [dstPoints, setDstPoints] = useState<[number, number][]>([
    [80, 50],
    [320, 70],
    [360, 260],
    [40, 230],
  ]);

  const [activeHandle, setActiveHandle] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute Intrinsic Matrix K
  const K: Mat3 = cameraIntrinsicsMatrix(fx, fy, cx, cy, skew);

  // Project 3D point into 2D camera image
  const projected2D = project3DTo2DPlane([target3DX, target3DY, target3DZ], K);

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeHandle === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(390, Math.round(((e.clientX - rect.left) / rect.width) * 400)));
    const y = Math.max(10, Math.min(290, Math.round(((e.clientY - rect.top) / rect.height) * 300)));

    setDstPoints((prev) => {
      const next = [...prev];
      next[activeHandle] = [x, y];
      return next as [number, number][];
    });
  };

  const resetHomography = () => {
    setDstPoints([
      [80, 50],
      [320, 70],
      [360, 260],
      [40, 230],
    ]);
  };

  const copyVisionData = () => {
    const data = {
      camera_intrinsics_K: K,
      focal_length_px: { fx, fy },
      principal_point_px: { cx, cy },
      projected_3d_test_point: {
        world_xyz_m: [target3DX, target3DY, target3DZ],
        image_uv_px: projected2D,
      },
      planar_homography_keypoints: {
        source_quad: srcPoints,
        destination_quad: dstPoints,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#080c14]">
      {/* Left Sidebar Control Panel */}
      <div className="w-full lg:w-[410px] shrink-0 border-r border-slate-800/80 bg-[#0c121e]/90 p-5 overflow-y-auto space-y-5">
        {/* Title */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Camera className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                Computer Vision
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Pinhole Camera Intrinsics ($K$) & 2D Keypoint Homography
            </p>
          </div>
          <span className="rounded-md bg-emerald-950/60 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-800/50">
            PINHOLE MODEL
          </span>
        </div>

        {experienceLevel === "beginner" && (
          <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-3.5 text-xs text-emerald-200/90 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Scan className="w-3.5 h-3.5 text-emerald-400" />
              <span>Camera Geometry Guide:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>Matrix $K$</strong> translates 3D metric coordinates into 2D image pixels $(u, v)$.
              In the right panel, drag the 4 corner handles to interactively calculate planar homography perspective warping.
            </p>
          </div>
        )}

        {/* Camera Sensor Presets */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Standard Camera Profiles</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {CAMERA_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setFx(p.fx);
                  setFy(p.fy);
                  setCx(p.cx);
                  setCy(p.cy);
                }}
                className="truncate rounded-lg bg-slate-900/90 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-300 hover:text-emerald-200 transition"
              >
                <div className="truncate font-semibold text-white">{p.name}</div>
                <div className="text-[9px] text-slate-400 font-mono">{p.res}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Camera Intrinsics Inputs */}
        <section className="space-y-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              <Sliders className="w-3.5 h-3.5" />
              <span>Pinhole Matrix $K$ Parameters</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">PIXELS</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Focal $f_x$ (px)</label>
              <input
                type="number"
                value={fx}
                onChange={(e) => setFx(+e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Focal $f_y$ (px)</label>
              <input
                type="number"
                value={fy}
                onChange={(e) => setFy(+e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Center $c_x$ (px)</label>
              <input
                type="number"
                value={cx}
                onChange={(e) => setCx(+e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Center $c_y$ (px)</label>
              <input
                type="number"
                value={cy}
                onChange={(e) => setCy(+e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>
        </section>

        {/* 3D Target Reprojection Test */}
        <section className="space-y-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
              3D Point Reprojection Test
            </span>
            <span className="text-[10px] font-mono text-slate-400">$(X, Y, Z) \to (u, v)$</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <label className="block text-slate-400 mb-0.5">X (m)</label>
              <input
                type="number"
                step="0.1"
                value={target3DX}
                onChange={(e) => setTarget3DX(+e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-0.5">Y (m)</label>
              <input
                type="number"
                step="0.1"
                value={target3DY}
                onChange={(e) => setTarget3DY(+e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-0.5">Z Depth (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={target3DZ}
                onChange={(e) => setTarget3DZ(+e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 font-mono"
              />
            </div>
          </div>

          {projected2D && (
            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Image Plane Pixel:</span>
              <span className="text-emerald-400 font-bold">
                {`u = ${projected2D[0].toFixed(1)} px,  v = ${projected2D[1].toFixed(1)} px`}
              </span>
            </div>
          )}
        </section>

        {/* Matrix K Inspector */}
        <section className="rounded-xl bg-slate-950/80 p-3.5 border border-slate-800 space-y-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Computed Intrinsic Matrix $K$ (3x3)
          </span>
          <pre className="text-xs font-mono text-emerald-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed overflow-x-auto">
{`[ [ ${fx.toFixed(1)},    0.0,  ${cx.toFixed(1)} ],
  [   0.0,  ${fy.toFixed(1)},  ${cy.toFixed(1)} ],
  [   0.0,    0.0,    1.0 ] ]`}
          </pre>
        </section>

        {/* Export Button */}
        <button
          onClick={copyVisionData}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-emerald-600/25 active:scale-[0.99]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Vision Parameters Copied!" : "Export Intrinsics & Keypoints"}</span>
        </button>
      </div>

      {/* Right Canvas: 3D Frustum + Interactive 2D Homography */}
      <div className="flex-1 relative bg-[#070a12] p-5 flex flex-col items-center justify-center space-y-5 overflow-y-auto">
        {/* Top HUD Banner */}
        <div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="hud-panel rounded-xl p-3 shadow-lg border-emerald-500/30">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Sensor Resolution</div>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
              {(cx * 2).toFixed(0)} x {(cy * 2).toFixed(0)} <span className="text-xs font-normal text-slate-400">px</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Aspect: {((cx * 2) / (cy * 2)).toFixed(2)}:1</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg border-cyan-500/30">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Horizontal FOV</div>
            <div className="text-base font-black text-cyan-400 font-mono mt-0.5">
              {(2 * Math.atan(cx / fx) * (180 / Math.PI)).toFixed(1)}°
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Field of View</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg border-indigo-500/30 hidden md:block">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Homography Grid</div>
            <div className="text-base font-black text-indigo-400 font-mono mt-0.5">
              4 Matched Pairs
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Planar Transformation</div>
          </div>
        </div>

        {/* Interactive 2D Planar Homography Warper Box */}
        <div className="w-full max-w-2xl rounded-2xl border border-slate-800/90 bg-[#0c121e]/90 p-5 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Interactive Planar Homography Warper (Drag Vertices)
              </h3>
            </div>
            <button
              onClick={resetHomography}
              title="Reset corners"
              className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 text-[10px] font-medium text-slate-300 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Reference Plane */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                Source Reference Plane $(X, Y)$
              </span>
              <div className="relative h-56 rounded-xl bg-slate-950/90 border border-slate-800/90 flex items-center justify-center overflow-hidden shadow-inner">
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#smallGrid)" />

                  <polygon
                    points={srcPoints.map((p) => `${p[0]},${p[1]}`).join(" ")}
                    fill="rgba(16, 185, 129, 0.12)"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  {srcPoints.map((p, idx) => (
                    <circle key={idx} cx={p[0]} cy={p[1]} r="5" fill="#10b981" />
                  ))}
                </svg>
                <span className="absolute bottom-2 left-2 text-[9px] font-mono text-emerald-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  Original Metric Quad
                </span>
              </div>
            </div>

            {/* Target Warped Plane with Draggable Handles */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-cyan-400 font-mono">
                Warped Perspective (Interactive Drag)
              </span>
              <div className="relative h-56 rounded-xl bg-slate-950/90 border border-slate-800/90 flex items-center justify-center overflow-hidden shadow-inner cursor-crosshair">
                <svg
                  className="w-full h-full select-none"
                  viewBox="0 0 400 300"
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={() => setActiveHandle(null)}
                  onMouseLeave={() => setActiveHandle(null)}
                >
                  <rect width="100%" height="100%" fill="url(#smallGrid)" />

                  <polygon
                    points={dstPoints.map((p) => `${p[0]},${p[1]}`).join(" ")}
                    fill="rgba(6, 182, 212, 0.2)"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                  {dstPoints.map((p, idx) => (
                    <g
                      key={idx}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveHandle(idx);
                      }}
                      className="cursor-pointer group"
                    >
                      <circle
                        cx={p[0]}
                        cy={p[1]}
                        r="10"
                        fill="rgba(6, 182, 212, 0.2)"
                        stroke="#22d3ee"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={p[0]}
                        cy={p[1]}
                        r="4.5"
                        fill={activeHandle === idx ? "#f43f5e" : "#06b6d4"}
                      />
                    </g>
                  ))}
                </svg>
                <span className="absolute bottom-2 left-2 text-[9px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  Homography Matrix H (3x3) Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
