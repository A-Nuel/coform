import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Line } from "@react-three/drei";
import { dhToMatrix, degToRad, radToDeg } from "@coform/core";
import type { DHLink, ExperienceLevel } from "@coform/core";
import {
  Bot,
  Plus,
  Trash2,
  Sliders,
  RotateCcw,
  Layers,
  Sparkles,
  Maximize2,
  Copy,
  Check,
} from "lucide-react";

interface RoboticsStudioProps {
  experienceLevel: ExperienceLevel;
}

const ROBOT_PRESETS: { name: string; description: string; links: DHLink[] }[] = [
  {
    name: "Universal Robots UR5 (6-DOF)",
    description: "Standard 6-axis industrial articulated collaborative robot",
    links: [
      { id: "1", name: "Joint 1 (Base Yaw)", a: 0, alpha: degToRad(90), d: 0.089, theta: degToRad(30) },
      { id: "2", name: "Joint 2 (Shoulder)", a: -0.425, alpha: 0, d: 0, theta: degToRad(-45) },
      { id: "3", name: "Joint 3 (Elbow)", a: -0.392, alpha: 0, d: 0, theta: degToRad(60) },
      { id: "4", name: "Joint 4 (Wrist 1)", a: 0, alpha: degToRad(90), d: 0.109, theta: degToRad(-30) },
      { id: "5", name: "Joint 5 (Wrist 2)", a: 0, alpha: degToRad(-90), d: 0.094, theta: degToRad(45) },
      { id: "6", name: "Joint 6 (Flange)", a: 0, alpha: 0, d: 0.082, theta: degToRad(0) },
    ],
  },
  {
    name: "SCARA 4-DOF Manipulator",
    description: "Selective Compliance Articulated Robot Arm for high-speed assembly",
    links: [
      { id: "1", name: "Joint 1 (Shoulder)", a: 0.35, alpha: 0, d: 0.25, theta: degToRad(45) },
      { id: "2", name: "Joint 2 (Elbow)", a: 0.25, alpha: degToRad(180), d: 0, theta: degToRad(-60) },
      { id: "3", name: "Joint 3 (Prismatic Z)", a: 0, alpha: 0, d: 0.15, theta: 0 },
      { id: "4", name: "Joint 4 (Roll Tool)", a: 0, alpha: 0, d: 0.05, theta: degToRad(30) },
    ],
  },
  {
    name: "2-DOF Planar Articulated Arm",
    description: "Classic educational 2-link planar arm",
    links: [
      { id: "1", name: "Joint 1 (Base)", a: 0.5, alpha: 0, d: 0, theta: degToRad(35) },
      { id: "2", name: "Joint 2 (Elbow)", a: 0.4, alpha: 0, d: 0, theta: degToRad(45) },
    ],
  },
];

export const RoboticsStudio: React.FC<RoboticsStudioProps> = ({ experienceLevel }) => {
  const [links, setLinks] = useState<DHLink[]>(ROBOT_PRESETS[0].links);
  const [copied, setCopied] = useState(false);

  const updateLink = (id: string, key: keyof DHLink, val: number) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [key]: val } : l))
    );
  };

  const addJoint = () => {
    const nextNum = links.length + 1;
    setLinks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: `Joint ${nextNum}`,
        a: 0.2,
        alpha: 0,
        d: 0,
        theta: degToRad(20),
      },
    ]);
  };

  const removeJoint = (id: string) => {
    if (links.length <= 1) return;
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const resetJoints = () => {
    setLinks((prev) => prev.map((l) => ({ ...l, theta: 0 })));
  };

  // Compute Forward Kinematics Joint Matrices
  const jointMatrices: number[][][] = [];
  const jointPositions: [number, number, number][] = [[0, 0, 0]];

  let currentMat = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  links.forEach((link) => {
    const T = dhToMatrix(link.a, link.alpha, link.d, link.theta);
    const newMat = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          newMat[i][j] += currentMat[i][k] * T[k][j];
        }
      }
    }
    currentMat = newMat;
    jointMatrices.push(currentMat);
    // Three.js world mapping (X -> X, Z -> Y (up), -Y -> Z (forward))
    jointPositions.push([currentMat[0][3], currentMat[2][3], -currentMat[1][3]]);
  });

  const endEffectorPos = jointPositions[jointPositions.length - 1];
  const endEffectorMat = currentMat;

  const copyKinematics = () => {
    const data = {
      robot_dof: links.length,
      dh_links: links.map((l, i) => ({
        joint_index: i + 1,
        name: l.name,
        a_m: l.a,
        alpha_rad: l.alpha,
        d_m: l.d,
        theta_deg: radToDeg(l.theta),
      })),
      end_effector_position_xyz_m: [
        endEffectorMat[0][3],
        endEffectorMat[1][3],
        endEffectorMat[2][3],
      ],
      end_effector_homogeneous_matrix_4x4: endEffectorMat,
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
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Bot className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                Robotics Kinematics
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Denavit-Hartenberg Forward Kinematics Chain & $T_0^n$ Pose
            </p>
          </div>
          <span className="rounded-md bg-cyan-950/60 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-400 border border-cyan-800/50">
            {links.length} DOF CHAIN
          </span>
        </div>

        {experienceLevel === "beginner" && (
          <div className="rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 p-3.5 text-xs text-cyan-200/90 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Forward Kinematics Controls:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Adjust the <strong>Joint Angle ($\theta_i$)</strong> sliders to articulate the arm.
              Coform calculates homogeneous transformation matrices $A_i$ and cascades them to solve the 3D end-effector coordinate.
            </p>
          </div>
        )}

        {/* Robot Presets */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Industrial Robot Models</span>
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {ROBOT_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setLinks(p.links)}
                className="flex items-center justify-between rounded-lg bg-slate-900/90 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 px-3 py-2 text-left text-xs font-medium text-slate-300 hover:text-cyan-200 transition"
              >
                <div>
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.description}</div>
                </div>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400">
                  {p.links.length} DOF
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Links Control Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Kinematic Links (DH Parameters)</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={resetJoints}
                title="Zero all joint angles"
                className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Zero</span>
              </button>
              <button
                onClick={addJoint}
                className="flex items-center gap-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1 text-[11px] font-bold text-white transition shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Add Joint</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {links.map((link, idx) => {
              const deg = Math.round(radToDeg(link.theta));
              return (
                <div
                  key={link.id}
                  className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-950 text-[10px] font-mono font-bold text-cyan-400 border border-cyan-800/40">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{link.name}</span>
                    </div>
                    {links.length > 1 && (
                      <button
                        onClick={() => removeJoint(link.id)}
                        className="text-slate-500 hover:text-rose-400 transition p-1"
                        title="Remove Joint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Joint Angle Slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Joint Angle θ_{idx + 1}</span>
                      <input
                        type="number"
                        min={-180}
                        max={180}
                        value={deg}
                        onChange={(e) => updateLink(link.id, "theta", degToRad(+e.target.value))}
                        className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-xs text-cyan-300 font-mono text-right"
                      />
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={deg}
                      onChange={(e) => updateLink(link.id, "theta", degToRad(+e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Expert parameters (a, alpha, d) */}
                  {experienceLevel === "expert" && (
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/40 text-[10px]">
                      <div>
                        <label className="block text-slate-400 mb-0.5">Link $a$ (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={link.a}
                          onChange={(e) => updateLink(link.id, "a", +e.target.value)}
                          className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-0.5">Twist $\alpha$ (°)</label>
                        <input
                          type="number"
                          step="15"
                          value={Math.round(radToDeg(link.alpha))}
                          onChange={(e) => updateLink(link.id, "alpha", degToRad(+e.target.value))}
                          className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-0.5">Offset $d$ (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={link.d}
                          onChange={(e) => updateLink(link.id, "d", +e.target.value)}
                          className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Copy Report Button */}
        <button
          onClick={copyKinematics}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-cyan-600/25 active:scale-[0.99]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Kinematics Copied!" : "Export DH Matrix Tree"}</span>
        </button>
      </div>

      {/* Right 3D Visualizer & Matrix Chain */}
      <div className="flex-1 relative bg-[#070a12] flex flex-col overflow-hidden">
        {/* Top Floating Telemetry Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 grid grid-cols-2 md:grid-cols-3 gap-3 pointer-events-none">
          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">End-Effector [X, Y, Z]</span>
              <Bot className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-lg font-black text-cyan-400 font-mono tracking-tight mt-0.5">
              [{endEffectorMat[0][3].toFixed(3)}, {endEffectorMat[1][3].toFixed(3)}, {endEffectorMat[2][3].toFixed(3)}] <span className="text-xs font-normal text-cyan-400/70">m</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Base Coordinate Frame $T_0$</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Active DOF Links</span>
              <Layers className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-lg font-black text-indigo-400 font-mono tracking-tight mt-0.5">
              {links.length} Joint Actuators
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">DH Kinematic Cascade</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-emerald-500/30 hidden md:block">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Reach Radius</span>
              <Maximize2 className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono tracking-tight mt-0.5">
              {Math.sqrt(
                endEffectorMat[0][3] ** 2 + endEffectorMat[1][3] ** 2 + endEffectorMat[2][3] ** 2
              ).toFixed(3)} <span className="text-xs font-normal text-emerald-400/70">m</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Total Vector Span</div>
          </div>
        </div>

        {/* Three.js 3D Viewport */}
        <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [2.5, 2.0, 2.5], fov: 45 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />
            <pointLight position={[0, 2, 0]} intensity={0.6} color="#06b6d4" />

            <Grid
              infiniteGrid
              fadeDistance={10}
              sectionSize={1}
              sectionColor="#334155"
              cellColor="#0f172a"
              cellSize={0.2}
            />

            {/* Robot Base Mount */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.25, 0.08, 32]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Render Kinematic Chain Links and Servos */}
            {jointPositions.map((pos, i) => {
              const isLast = i === jointPositions.length - 1;
              const nextPos = jointPositions[i + 1];

              return (
                <group key={i}>
                  {/* Joint Pivot Sphere */}
                  <mesh position={pos}>
                    <sphereGeometry args={[isLast ? 0.06 : 0.08, 32, 32]} />
                    <meshStandardMaterial
                      color={isLast ? "#22d3ee" : i === 0 ? "#f59e0b" : "#64748b"}
                      emissive={isLast ? "#06b6d4" : "#000"}
                      emissiveIntensity={isLast ? 0.8 : 0}
                    />
                  </mesh>

                  {/* Connecting Link Line */}
                  {nextPos && (
                    <Line
                      points={[pos, nextPos]}
                      color={isLast ? "#22d3ee" : "#38bdf8"}
                      lineWidth={4}
                    />
                  )}
                </group>
              );
            })}

            {/* End-Effector Tool Pointer */}
            <mesh position={endEffectorPos}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={1.0} />
            </mesh>

            <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport axisColors={["#ef4444", "#22c55e", "#3b82f6"]} labelColor="#fff" />
            </GizmoHelper>
          </Canvas>
        </div>

        {/* Bottom Matrix Viewer HUD */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="hud-panel rounded-xl px-4 py-2 text-xs text-slate-300 pointer-events-auto flex items-center gap-4 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <span className="font-medium text-xs">Base Frame $T_0$</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="font-medium text-xs">Joint Articulations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span className="font-medium text-xs">Tool End-Effector</span>
            </div>
          </div>

          <div className="hud-panel rounded-xl px-3 py-2 text-[10px] font-mono text-cyan-300 pointer-events-auto shadow-lg hidden lg:block">
            $T_0^n$: [{endEffectorMat[0].map((v) => v.toFixed(2)).join(", ")}]
          </div>
        </div>
      </div>
    </div>
  );
};
