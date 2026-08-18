import React, { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Line } from "@react-three/drei";
import * as THREE from "three";
import { dhToMatrix, degToRad, radToDeg } from "@coform/core";
import type { DHLink, ExperienceLevel } from "@coform/core";
import { CustomGLBModel } from "./CustomGLBModel";
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
  ChevronRight,
} from "lucide-react";
import { MathText } from "./MathText";

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

// High-Fidelity 3D Industrial Robotic Arm Components
const IndustrialLinkSegment: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  isLast?: boolean;
}> = ({ start, end, isLast = false }) => {
  const p0 = useMemo(() => new THREE.Vector3(...start), [start]);
  const p1 = useMemo(() => new THREE.Vector3(...end), [end]);
  const dir = useMemo(() => new THREE.Vector3().subVectors(p1, p0), [p0, p1]);
  const len = dir.length();
  const mid = useMemo(() => new THREE.Vector3().addVectors(p0, p1).multiplyScalar(0.5), [p0, p1]);

  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    if (len > 0.001) {
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }
    return q;
  }, [dir, len]);

  if (len < 0.01) return null;

  return (
    <group position={mid} quaternion={quat}>
      {/* Main Machined Aircraft-Grade Aluminum Arm Chassis (Bright Luminous Silver) */}
      <mesh>
        <cylinderGeometry args={[0.042, 0.05, len * 0.92, 24]} />
        <meshStandardMaterial
          color={isLast ? "#38bdf8" : "#f1f5f9"}
          metalness={0.75}
          roughness={0.2}
        />
      </mesh>

      {/* Cyber Neon Status Accent Stripe */}
      <mesh position={[0.044, 0, 0]}>
        <boxGeometry args={[0.008, len * 0.78, 0.015]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* Lower Joint Collar Cuff */}
      <mesh position={[0, -len * 0.44, 0]}>
        <cylinderGeometry args={[0.056, 0.056, 0.038, 24]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Upper Joint Collar Cuff */}
      <mesh position={[0, len * 0.44, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.038, 24]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
};

// Industrial Revolute Servo Actuator Motor Canister (High Contrast Metallic)
const IndustrialJointActuator: React.FC<{
  pos: [number, number, number];
  isFirst?: boolean;
  isEnd?: boolean;
}> = ({ pos, isFirst = false, isEnd = false }) => {
  return (
    <group position={pos}>
      {/* Heavy-Duty Motor Housing Drum (Cobalt Blue / Golden Amber) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.068, 0.068, 0.12, 28]} />
        <meshStandardMaterial
          color={isFirst ? "#f59e0b" : isEnd ? "#38bdf8" : "#0284c7"}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Outer Joint Bezel End Caps */}
      <mesh position={[0.062, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.058, 0.058, 0.018, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[-0.062, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.058, 0.058, 0.018, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Glowing Status LED Torus Ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.072, 0.007, 16, 32]} />
        <meshStandardMaterial
          color={isFirst ? "#fbbf24" : "#22d3ee"}
          emissive={isFirst ? "#f59e0b" : "#06b6d4"}
          emissiveIntensity={1.8}
        />
      </mesh>
    </group>
  );
};

// 2-Finger Industrial Parallel Gripper & Tool Center Point (TCP)
const IndustrialGripperTool: React.FC<{
  pos: [number, number, number];
}> = ({ pos }) => {
  return (
    <group position={pos}>
      {/* Tool Flange Adapter Plate */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.025, 24]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Gripper Actuator Transmission Gearbox Body */}
      <mesh position={[0, 0.058, 0]}>
        <boxGeometry args={[0.085, 0.048, 0.06]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Status LED Bar on Gripper */}
      <mesh position={[0, 0.058, 0.032]}>
        <boxGeometry args={[0.055, 0.009, 0.005]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={1.8} />
      </mesh>

      {/* Left Machined Finger Jaw */}
      <mesh position={[-0.03, 0.1, 0]}>
        <boxGeometry args={[0.014, 0.06, 0.024]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Left High-Grip Safety Red Pad */}
      <mesh position={[-0.022, 0.105, 0]}>
        <boxGeometry args={[0.005, 0.04, 0.02]} />
        <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={0.6} />
      </mesh>

      {/* Right Machined Finger Jaw */}
      <mesh position={[0.03, 0.1, 0]}>
        <boxGeometry args={[0.014, 0.06, 0.024]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Right High-Grip Safety Red Pad */}
      <mesh position={[0.022, 0.105, 0]}>
        <boxGeometry args={[0.005, 0.04, 0.02]} />
        <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={0.6} />
      </mesh>

      {/* Tool Center Point (TCP) Laser Beacon Focal Dot */}
      <mesh position={[0, 0.135, 0]}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
};

export const RoboticsStudio: React.FC<RoboticsStudioProps> = ({ experienceLevel }) => {
  const [links, setLinks] = useState<DHLink[]>(ROBOT_PRESETS[0].links);
  const [robotUnit, setRobotUnit] = useState<"mm" | "m">("mm");
  const [robotVizMode, setRobotVizMode] = useState<"glb_arm" | "procedural_fk">("glb_arm");
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
              Denavit-Hartenberg Forward Kinematics Chain & <MathText math="T_0^n" /> Pose
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Unit Selector */}
            <div className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-[10px]">
              {(["mm", "m"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setRobotUnit(u)}
                  className={`px-2 py-0.5 rounded-lg font-mono font-bold transition ${
                    robotUnit === u
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  title={`Unit: ${u === "mm" ? "Millimeters" : "Meters"}`}
                >
                  {u}
                </button>
              ))}
            </div>

            {/* 3D Model Selector Pills */}
            <div className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-[10px]">
              <button
                onClick={() => setRobotVizMode("glb_arm")}
                className={`px-2 py-0.5 rounded-lg font-mono font-bold transition ${
                  robotVizMode === "glb_arm"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                title="3D Industrial Robot Arm GLB Model"
              >
                Arm (GLB)
              </button>
              <button
                onClick={() => setRobotVizMode("procedural_fk")}
                className={`px-2 py-0.5 rounded-lg font-mono font-bold transition ${
                  robotVizMode === "procedural_fk"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                title="Articulated Forward Kinematics Chain"
              >
                FK Chain
              </button>
            </div>

            <span className="rounded-md bg-cyan-950/60 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-400 border border-cyan-800/50">
              {links.length} DOF
            </span>
          </div>
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
                      <span className="flex items-center gap-1">
                        <span>Joint Angle</span>
                        <MathText math={`\\theta_{${idx + 1}}`} />
                      </span>
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
                        <label className="block text-slate-400 mb-0.5 flex items-center gap-0.5">
                          <span>Link</span>
                          <MathText math="a" />
                          <span>(m)</span>
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={link.a}
                          onChange={(e) => updateLink(link.id, "a", +e.target.value)}
                          className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-0.5 flex items-center gap-0.5">
                          <span>Twist</span>
                          <MathText math="\alpha" />
                          <span>(°)</span>
                        </label>
                        <input
                          type="number"
                          step="15"
                          value={Math.round(radToDeg(link.alpha))}
                          onChange={(e) => updateLink(link.id, "alpha", degToRad(+e.target.value))}
                          className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-slate-200 font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-0.5 flex items-center gap-0.5">
                          <span>Offset</span>
                          <MathText math="d" />
                          <span>(m)</span>
                        </label>
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
              [{(endEffectorMat[0][3] * (robotUnit === "mm" ? 1000 : 1)).toFixed(1)}, {(endEffectorMat[1][3] * (robotUnit === "mm" ? 1000 : 1)).toFixed(1)}, {(endEffectorMat[2][3] * (robotUnit === "mm" ? 1000 : 1)).toFixed(1)}] <span className="text-xs font-normal text-cyan-400/70">{robotUnit}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Base Coordinate Frame <MathText math="T_0" />
            </div>
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
              {(Math.sqrt(
                endEffectorMat[0][3] ** 2 + endEffectorMat[1][3] ** 2 + endEffectorMat[2][3] ** 2
              ) * (robotUnit === "mm" ? 1000 : 1)).toFixed(1)} <span className="text-xs font-normal text-emerald-400/70">{robotUnit}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Total Vector Span ({robotUnit})</div>
          </div>
        </div>

        {/* Three.js 3D Viewport */}
        <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [2.5, 2.0, 2.5], fov: 45 }}>
            <ambientLight intensity={1.3} />
            <directionalLight position={[8, 12, 8]} intensity={1.8} castShadow />
            <directionalLight position={[-6, 6, -6]} intensity={0.8} color="#93c5fd" />
            <pointLight position={[0, 3, 0]} intensity={1.0} color="#06b6d4" />

            <Grid
              infiniteGrid
              fadeDistance={12}
              sectionSize={1}
              sectionColor="#475569"
              cellColor="#1e293b"
              cellSize={0.2}
            />

            {robotVizMode === "glb_arm" ? (
              <group position={[0, 0, 0]}>
                {/* 3D High-Fidelity Industrial Robot Arm GLB Model */}
                <Suspense
                  fallback={
                    <group position={[0, 0, 0]}>
                      {jointPositions.map((pos, i) => {
                        const nextPos = jointPositions[i + 1];
                        if (!nextPos) return null;
                        return (
                          <IndustrialLinkSegment
                            key={`fb-link-${i}`}
                            start={pos}
                            end={nextPos}
                            isLast={i === jointPositions.length - 2}
                          />
                        );
                      })}
                    </group>
                  }
                >
                  <CustomGLBModel url="/models/robot_arm.glb" scale={2.2} position={[0, 0, 0]} />
                </Suspense>

                {/* 3D Industrial Gripper End-Effector Tool Model */}
                <Suspense fallback={null}>
                  <CustomGLBModel url="/models/gripper.glb" scale={0.6} position={endEffectorPos} />
                </Suspense>
              </group>
            ) : (
              <>
                {/* Heavy-Duty Cast Industrial Robot Base Plinth */}
                <group position={[0, 0, 0]}>
                  {/* Floor Mounting Flange Base */}
                  <mesh position={[0, 0.04, 0]}>
                    <cylinderGeometry args={[0.26, 0.3, 0.08, 32]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
                  </mesh>

                  {/* Rotary Turntable Hub Ring */}
                  <mesh position={[0, 0.09, 0]}>
                    <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
                    <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
                  </mesh>

                  {/* Glowing Turntable Bezel LED */}
                  <mesh position={[0, 0.11, 0]}>
                    <torusGeometry args={[0.21, 0.006, 16, 32]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#06b6d4" emissiveIntensity={1.8} />
                  </mesh>
                </group>

                {/* Render High-Fidelity Machined Link Limbs */}
                {jointPositions.map((pos, i) => {
                  const nextPos = jointPositions[i + 1];
                  if (!nextPos) return null;
                  return (
                    <IndustrialLinkSegment
                      key={`link-seg-${i}`}
                      start={pos}
                      end={nextPos}
                      isLast={i === jointPositions.length - 2}
                    />
                  );
                })}

                {/* Render Revolute Joint Servo Motors */}
                {jointPositions.map((pos, i) => {
                  const isLast = i === jointPositions.length - 1;
                  if (isLast) return null; // End-effector is rendered separately
                  return (
                    <IndustrialJointActuator
                      key={`servo-joint-${i}`}
                      pos={pos}
                      isFirst={i === 0}
                      isEnd={i === jointPositions.length - 2}
                    />
                  );
                })}

                {/* Render Industrial 2-Finger Parallel Gripper Tool at TCP */}
                <IndustrialGripperTool pos={endEffectorPos} />
              </>
            )}

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
