import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { dhToMatrix, degToRad } from "@coform/core";
import type { DHLink, ExperienceLevel } from "@coform/core";
import { Bot, Layers, Plus, Trash2, Sliders } from "lucide-react";

interface RoboticsStudioProps {
  experienceLevel: ExperienceLevel;
}

export const RoboticsStudio: React.FC<RoboticsStudioProps> = ({ experienceLevel }) => {
  // DH Link Arm State (2-DOF by default, user can add joints)
  const [links, setLinks] = useState<DHLink[]>([
    { id: "1", name: "Joint 1 (Base)", a: 1.5, alpha: degToRad(90), d: 1.0, theta: degToRad(30) },
    { id: "2", name: "Joint 2 (Elbow)", a: 1.2, alpha: 0, d: 0, theta: degToRad(-45) },
  ]);

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
        a: 1.0,
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

  // Compute forward kinematics joint positions
  const jointPositions: [number, number, number][] = [[0, 0, 0]];
  let currentMat = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  links.forEach((link) => {
    const T = dhToMatrix(link.a, link.alpha, link.d, link.theta);
    // Multiply currentMat by T
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
    jointPositions.push([currentMat[0][3], currentMat[2][3], -currentMat[1][3]]); // Convert Y/Z for Three.js coordinates
  });

  const endEffectorPos = jointPositions[jointPositions.length - 1];

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Control Panel */}
      <div className="w-full lg:w-96 shrink-0 border-r border-slate-800 bg-slate-900/80 p-5 overflow-y-auto space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Robotics & Manipulator DH</h2>
          </div>
          <p className="text-xs text-slate-400">Denavit-Hartenberg Forward Kinematics Chain</p>
        </div>

        {experienceLevel === "beginner" && (
          <div className="rounded-xl bg-cyan-950/30 border border-cyan-800/40 p-3 text-xs text-cyan-200/90 space-y-1">
            <span className="font-semibold text-cyan-400">Beginner Guide:</span>
            <p>
              Move the joint angle sliders ($\theta$) to rotate the robotic arm links. Coform calculates the 3D end-effector position using DH transformation matrices.
            </p>
          </div>
        )}

        {/* Links list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kinematic Links</span>
            <button
              onClick={addJoint}
              className="flex items-center gap-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1 text-xs font-semibold text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Joint</span>
            </button>
          </div>

          {links.map((link, idx) => (
            <div key={link.id} className="rounded-xl bg-slate-950/60 p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">{link.name}</span>
                {links.length > 1 && (
                  <button
                    onClick={() => removeJoint(link.id)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Joint Angle theta Slider */}
              <label className="block text-xs text-slate-400">
                Joint Angle $\theta_{idx + 1}$ (deg)
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={Math.round((link.theta * 180) / Math.PI)}
                  onChange={(e) => updateLink(link.id, "theta", degToRad(+e.target.value))}
                  className="mt-1 w-full"
                />
                <span className="float-right text-cyan-400 font-mono font-bold">
                  {Math.round((link.theta * 180) / Math.PI)}°
                </span>
              </label>

              {/* Link length 'a' */}
              <label className="block text-xs text-slate-400">
                Link Length $a_{idx + 1}$ (m)
                <input
                  type="range"
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  value={link.a}
                  onChange={(e) => updateLink(link.id, "a", +e.target.value)}
                  className="mt-1 w-full"
                />
                <span className="float-right text-slate-300 font-mono">{link.a.toFixed(1)} m</span>
              </label>
            </div>
          ))}
        </section>
      </div>

      {/* 3D Visualization */}
      <div className="flex-1 relative bg-slate-950 flex flex-col">
        {/* Top Banner */}
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-3 pointer-events-none">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 backdrop-blur pointer-events-auto">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">End-Effector Position [X, Y, Z]</div>
            <div className="text-base font-black text-cyan-400 font-mono">
              [{endEffectorPos.map((v) => v.toFixed(2)).join(", ")}] m
            </div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 backdrop-blur pointer-events-auto">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Joint Count</div>
            <div className="text-base font-black text-indigo-400 font-mono">{links.length} DOF</div>
          </div>
        </div>

        <div className="flex-1">
          <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1} />
            <Grid infiniteGrid fadeDistance={30} sectionColor="#475569" cellColor="#1e293b" />

            {/* Render Robot Base */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.5, 0.2, 32]} />
              <meshStandardMaterial color="#334155" />
            </mesh>

            {/* Render Joint links as connected cylinders and spheres */}
            {jointPositions.map((pos, i) => (
              <group key={i}>
                <mesh position={pos}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshStandardMaterial color={i === jointPositions.length - 1 ? "#06b6d4" : "#64748b"} />
                </mesh>
              </group>
            ))}

            <OrbitControls makeDefault />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport />
            </GizmoHelper>
          </Canvas>
        </div>
      </div>
    </div>
  );
};
