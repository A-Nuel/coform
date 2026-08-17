import React, { useState } from "react";
import type { DomainType } from "@coform/core";
import {
  Rocket,
  Bot,
  Camera,
  Binary,
  GitFork,
  Compass,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface PresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (domain: DomainType | "tree", presetId: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [filter, setFilter] = useState<string>("all");

  if (!isOpen) return null;

  const presets = [
    {
      id: "missile-tracking",
      domain: "aerospace" as DomainType,
      category: "aerospace",
      title: "Cape Canaveral Missile Radar Tracking",
      subtitle: "Aerospace & Defense",
      icon: <Rocket className="w-5 h-5 text-amber-400" />,
      description:
        "WGS-84 Geodetic target coordinates to Launch Station ECEF and local NED line-of-sight radar metrics.",
      badge: "WGS-84 / ECEF / NED",
      accent: "border-amber-500/30 hover:border-amber-400 group-hover:shadow-amber-500/10",
      pill: "text-amber-400 bg-amber-950/60 border-amber-800/40",
    },
    {
      id: "drone-gimbal",
      domain: "aerospace" as DomainType,
      category: "aerospace",
      title: "Drone Gimbal Pitch/Yaw to Geodetic",
      subtitle: "Aviation & UAVs",
      icon: <Compass className="w-5 h-5 text-orange-400" />,
      description:
        "Map UAV gimbal orientation angles and altitude directly to geographic coordinates on Earth's ellipsoid.",
      badge: "Gimbal Euler ZYX",
      accent: "border-orange-500/30 hover:border-orange-400 group-hover:shadow-orange-500/10",
      pill: "text-orange-400 bg-orange-950/60 border-orange-800/40",
    },
    {
      id: "ur5-robot",
      domain: "robotics" as DomainType,
      category: "robotics",
      title: "Universal Robots UR5 (6-DOF)",
      subtitle: "Robotics & Automation",
      icon: <Bot className="w-5 h-5 text-cyan-400" />,
      description:
        "6-axis articulated industrial robotic arm with Denavit-Hartenberg parameter table and forward kinematics.",
      badge: "6-DOF DH Parameters",
      accent: "border-cyan-500/30 hover:border-cyan-400 group-hover:shadow-cyan-500/10",
      pill: "text-cyan-400 bg-cyan-950/60 border-cyan-800/40",
    },
    {
      id: "scara-robot",
      domain: "robotics" as DomainType,
      category: "robotics",
      title: "SCARA 4-DOF Pick & Place",
      subtitle: "High-Speed Manufacturing",
      icon: <Bot className="w-5 h-5 text-blue-400" />,
      description:
        "Selective Compliance Articulated Robot Arm kinematic model for high-precision PCB assembly and pick-and-place.",
      badge: "4-DOF SCARA",
      accent: "border-blue-500/30 hover:border-blue-400 group-hover:shadow-blue-500/10",
      pill: "text-blue-400 bg-blue-950/60 border-blue-800/40",
    },
    {
      id: "camera-intrinsics",
      domain: "vision" as DomainType,
      category: "vision",
      title: "Pinhole Camera Intrinsics & 3D Reprojection",
      subtitle: "Computer Vision & Photogrammetry",
      icon: <Camera className="w-5 h-5 text-emerald-400" />,
      description:
        "Derive 3x3 Camera Intrinsic Matrix K ($f_x, f_y, c_x, c_y$) and reproject 3D metric world points to 2D image pixels.",
      badge: "3x3 Pinhole Matrix K",
      accent: "border-emerald-500/30 hover:border-emerald-400 group-hover:shadow-emerald-500/10",
      pill: "text-emerald-400 bg-emerald-950/60 border-emerald-800/40",
    },
    {
      id: "planar-homography",
      domain: "vision" as DomainType,
      category: "vision",
      title: "Interactive 4-Point Homography Warper",
      subtitle: "Perspective Rectification",
      icon: <Camera className="w-5 h-5 text-teal-400" />,
      description:
        "4-point correspondence solver for projective planar rectification, perspective correction, and image warping.",
      badge: "3x3 Homography H",
      accent: "border-teal-500/30 hover:border-teal-400 group-hover:shadow-teal-500/10",
      pill: "text-teal-400 bg-teal-950/60 border-teal-800/40",
    },
    {
      id: "lie-so3",
      domain: "math" as DomainType,
      category: "math",
      title: "Lie Group SO(3) & Unit Quaternion",
      subtitle: "Mathematical Physics",
      icon: <Binary className="w-5 h-5 text-indigo-400" />,
      description:
        "Bidirectional conversion between Euler angles, unit quaternions, axis-angle, and 3x3 orthogonal rotation matrices.",
      badge: "SO(3) / SE(3) / Quat",
      accent: "border-indigo-500/30 hover:border-indigo-400 group-hover:shadow-indigo-500/10",
      pill: "text-indigo-400 bg-indigo-950/60 border-indigo-800/40",
    },
    {
      id: "ros2-tf2",
      domain: "tree" as any,
      category: "tree",
      title: "ROS 2 Autonomous Navigation tf2 Tree",
      subtitle: "ROS 2 Robotics Middleware",
      icon: <GitFork className="w-5 h-5 text-rose-400" />,
      description:
        "Standard ROS 2 mobile robot frame cascade: map -> odom -> base_link -> camera_link -> optical_frame.",
      badge: "ROS 2 tf2 Tree",
      accent: "border-rose-500/30 hover:border-rose-400 group-hover:shadow-rose-500/10",
      pill: "text-rose-400 bg-rose-950/60 border-rose-800/40",
    },
  ];

  const filteredPresets =
    filter === "all" ? presets : presets.filter((p) => p.category === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-[#0c121e] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#080d18]">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Industry Domain Preset Templates
              </h2>
              <p className="text-xs text-slate-400">
                Instantly load pre-configured aerospace, robotics, vision, and Lie group scenarios
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800/60 bg-slate-950/60 overflow-x-auto">
          {[
            { id: "all", label: "All Templates" },
            { id: "aerospace", label: "Aerospace" },
            { id: "robotics", label: "Robotics DH" },
            { id: "vision", label: "Computer Vision" },
            { id: "math", label: "Lie Group Math" },
            { id: "tree", label: "ROS 2 tf2" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold font-mono transition ${
                filter === cat.id
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPresets.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelectPreset(p.domain, p.id);
                onClose();
              }}
              className={`group relative cursor-pointer rounded-xl border bg-slate-950/70 p-4 transition-all duration-200 hover:bg-[#111927] hover:shadow-lg ${p.accent}`}
            >
              <div className="flex items-start gap-3.5">
                <div className="rounded-xl bg-slate-900 p-2.5 border border-slate-800 shrink-0">
                  {p.icon}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider truncate">
                      {p.subtitle}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-mono font-bold shrink-0 border ${p.pill}`}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {p.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3 bg-[#080d18]">
          <span className="text-xs text-slate-400 font-mono">
            {filteredPresets.length} Templates Available
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
