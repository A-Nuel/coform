import React, { useState } from "react";
import type { ExperienceLevel, TransformTree, TransformTreeNode, Mat4 } from "@coform/core";
import { identity4, multiplyMat4, pose3DToMatrix, eulerZYXToQuat, degToRad } from "@coform/core";
import {
  GitFork,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  Copy,
  Check,
  RotateCw,
  Box,
  Compass,
} from "lucide-react";

interface TransformTreeStudioProps {
  experienceLevel: ExperienceLevel;
}

interface FrameItem {
  id: string;
  name: string;
  parent: string;
  tx: number;
  ty: number;
  tz: number;
  roll: number;
  pitch: number;
  yaw: number;
}

const DEFAULT_FRAMES: FrameItem[] = [
  { id: "world", name: "world", parent: "", tx: 0, ty: 0, tz: 0, roll: 0, pitch: 0, yaw: 0 },
  { id: "odom", name: "odom", parent: "world", tx: 1.5, ty: 0.5, tz: 0, roll: 0, pitch: 0, yaw: 15 },
  { id: "base_link", name: "base_link", parent: "odom", tx: 0.8, ty: 0.2, tz: 0.1, roll: 0, pitch: 0, yaw: 25 },
  { id: "camera_link", name: "camera_link", parent: "base_link", tx: 0.2, ty: 0.0, tz: 0.5, roll: 0, pitch: 15, yaw: 0 },
  { id: "optical_frame", name: "camera_optical_frame", parent: "camera_link", tx: 0, ty: 0, tz: 0, roll: -90, pitch: 0, yaw: -90 },
  { id: "target_obj", name: "detected_target", parent: "optical_frame", tx: 0.1, ty: 0.2, tz: 1.8, roll: 0, pitch: 0, yaw: 0 },
];

export const TransformTreeStudio: React.FC<TransformTreeStudioProps> = ({ experienceLevel }) => {
  const [frames, setFrames] = useState<FrameItem[]>(DEFAULT_FRAMES);
  const [sourceFrame, setSourceFrame] = useState<string>("world");
  const [targetFrame, setTargetFrame] = useState<string>("target_obj");
  const [copied, setCopied] = useState(false);

  const updateFrame = (id: string, key: keyof FrameItem, val: any) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  const addFrame = () => {
    const nextNum = frames.length + 1;
    const parentId = frames[frames.length - 1]?.id || "world";
    setFrames((prev) => [
      ...prev,
      {
        id: `frame_${nextNum}`,
        name: `custom_frame_${nextNum}`,
        parent: parentId,
        tx: 0.5,
        ty: 0.0,
        tz: 0.2,
        roll: 0,
        pitch: 0,
        yaw: 10,
      },
    ]);
  };

  const removeFrame = (id: string) => {
    if (id === "world" || frames.length <= 2) return;
    setFrames((prev) => prev.filter((f) => f.id !== id));
  };

  // Compute local 4x4 matrix for each frame relative to its parent
  const getLocalMatrix = (f: FrameItem): Mat4 => {
    const q = eulerZYXToQuat(degToRad(f.roll), degToRad(f.pitch), degToRad(f.yaw));
    return pose3DToMatrix([f.tx, f.ty, f.tz], q);
  };

  // Compute world matrix for a given frame by walking up parent hierarchy
  const getWorldMatrix = (frameId: string): Mat4 => {
    const frame = frames.find((f) => f.id === frameId);
    if (!frame || !frame.parent) return identity4();
    const parentMat = getWorldMatrix(frame.parent);
    const localMat = getLocalMatrix(frame);
    return multiplyMat4(parentMat, localMat);
  };

  const worldToSource = getWorldMatrix(sourceFrame);
  const worldToTarget = getWorldMatrix(targetFrame);

  // Invert 4x4 rigid transform (R^T and -R^T * t)
  const invertRigid = (m: Mat4): Mat4 => {
    const R_T = [
      [m[0][0], m[1][0], m[2][0]],
      [m[0][1], m[1][1], m[2][1]],
      [m[0][2], m[1][2], m[2][2]],
    ];
    const t = [m[0][3], m[1][3], m[2][3]];
    const invT = [
      -(R_T[0][0] * t[0] + R_T[0][1] * t[1] + R_T[0][2] * t[2]),
      -(R_T[1][0] * t[0] + R_T[1][1] * t[1] + R_T[1][2] * t[2]),
      -(R_T[2][0] * t[0] + R_T[2][1] * t[1] + R_T[2][2] * t[2]),
    ];
    return [
      [R_T[0][0], R_T[0][1], R_T[0][2], invT[0]],
      [R_T[1][0], R_T[1][1], R_T[1][2], invT[1]],
      [R_T[2][0], R_T[2][1], R_T[2][2], invT[2]],
      [0, 0, 0, 1],
    ];
  };

  // Target relative to Source = inv(worldToSource) * worldToTarget
  const relativeTransform: Mat4 = multiplyMat4(invertRigid(worldToSource), worldToTarget);

  const copyTreeData = () => {
    const data = {
      source_frame: sourceFrame,
      target_frame: targetFrame,
      relative_transform_matrix_4x4: relativeTransform,
      relative_translation_xyz_m: [
        relativeTransform[0][3],
        relativeTransform[1][3],
        relativeTransform[2][3],
      ],
      all_frames: frames,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#080c14]">
      {/* Left Sidebar Frame Hierarchy List */}
      <div className="w-full lg:w-[420px] shrink-0 border-r border-slate-800/80 bg-[#0c121e]/90 p-5 overflow-y-auto space-y-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <GitFork className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                ROS 2 Frame Graph
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              `tf2` Dynamic Coordinate Transform Tree & Cascader
            </p>
          </div>
          <button
            onClick={addFrame}
            className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white transition shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>Add Frame</span>
          </button>
        </div>

        {/* Query Lookup Selection */}
        <section className="space-y-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono">
            <span>Lookup Transform Query</span>
            <span className="text-[10px] text-slate-400">tf2 buffer</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Target Frame (To)</label>
              <select
                value={targetFrame}
                onChange={(e) => setTargetFrame(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-rose-300 font-mono"
              >
                {frames.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Source Frame (From)</label>
              <select
                value={sourceFrame}
                onChange={(e) => setSourceFrame(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-cyan-300 font-mono"
              >
                {frames.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Frames List Editor */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {frames.map((f, idx) => (
            <div
              key={f.id}
              className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-950 text-[10px] font-mono font-bold text-rose-400 border border-rose-800/40">
                    {idx}
                  </span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{f.name}</span>
                </div>
                {f.id !== "world" && (
                  <button
                    onClick={() => removeFrame(f.id)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {f.id !== "world" && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="block text-slate-400 mb-0.5">Parent Frame</label>
                    <select
                      value={f.parent}
                      onChange={(e) => updateFrame(f.id, "parent", e.target.value)}
                      className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono"
                    >
                      {frames
                        .filter((parentCand) => parentCand.id !== f.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Yaw Rotation (°)</label>
                    <input
                      type="number"
                      value={f.yaw}
                      onChange={(e) => updateFrame(f.id, "yaw", +e.target.value)}
                      className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={copyTreeData}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-rose-600/25 active:scale-[0.99]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Transform Copied!" : "Export Query Transform Matrix"}</span>
        </button>
      </div>

      {/* Right Canvas: Visual Tree Cascade & Matrix Output */}
      <div className="flex-1 relative bg-[#070a12] p-5 flex flex-col items-center justify-center space-y-5 overflow-y-auto">
        {/* Top Query Result Card */}
        <div className="w-full max-w-xl rounded-2xl border border-slate-800/90 bg-[#0c121e]/90 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <span className="text-cyan-400">{sourceFrame}</span>
              <ArrowRight className="w-4 h-4 text-rose-400" />
              <span className="text-rose-400">{targetFrame}</span>
            </div>
            <span className="rounded bg-rose-950/80 px-2 py-0.5 text-[10px] font-mono text-rose-300 border border-rose-800/50">
              CASCADED 4x4
            </span>
          </div>

          {/* 4x4 Relative Matrix */}
          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            {relativeTransform.flatMap((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-center text-rose-300 font-bold"
                >
                  {val.toFixed(3)}
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Relative Translation $[X, Y, Z]$:</span>
            <span className="text-rose-400 font-bold">
              [{relativeTransform[0][3].toFixed(3)}, {relativeTransform[1][3].toFixed(3)}, {relativeTransform[2][3].toFixed(3)}] m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
