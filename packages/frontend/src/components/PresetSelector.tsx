import React from "react";
import type { DomainType } from "@coform/core";
import { Rocket, Bot, Camera, Compass, X } from "lucide-react";

interface PresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (domain: DomainType, presetId: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const presets = [
    {
      id: "missile-tracking",
      domain: "aerospace" as DomainType,
      title: "Missile Target Tracking",
      subtitle: "Aerospace & Defense",
      icon: <Rocket className="w-6 h-6 text-amber-400" />,
      description: "Convert GPS target coordinates (WGS-84) to launch pad ECEF and local missile body NED radar tracking frames.",
      badge: "WGS-84 / ECEF / NED",
    },
    {
      id: "drone-camera",
      domain: "aerospace" as DomainType,
      title: "Drone Gimbal Camera to GPS",
      subtitle: "Aviation & UAVs",
      icon: <Compass className="w-6 h-6 text-orange-400" />,
      description: "Map drone camera pixel detections to real-world latitude/longitude coordinates via gimbal Euler pitch/yaw angles.",
      badge: "Gimbal RPY + Geodetic",
    },
    {
      id: "robot-arm-dh",
      domain: "robotics" as DomainType,
      title: "2-DOF Robot Arm Kinematics",
      subtitle: "Robotics & Automation",
      icon: <Bot className="w-6 h-6 text-cyan-400" />,
      description: "Forward kinematics chain for a robotic manipulator using Denavit-Hartenberg (DH) parameters.",
      badge: "DH Kinematic Chain",
    },
    {
      id: "camera-homography",
      domain: "vision" as DomainType,
      title: "Planar Image Homography Warping",
      subtitle: "Computer Vision & Photogrammetry",
      icon: <Camera className="w-6 h-6 text-emerald-400" />,
      description: "Match 4 keypoint pairs between two images to compute 3x3 Homography and warp perspective in real-time.",
      badge: "3x3 Planar Homography",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Select Industry Domain Preset</h2>
            <p className="text-xs text-slate-400">Choose a pre-configured template for your specific use case</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelectPreset(p.domain, p.id);
                onClose();
              }}
              className="group relative cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-5 transition-all hover:border-cyan-500/50 hover:bg-slate-800/40 hover:shadow-lg hover:shadow-cyan-500/5"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-slate-900 p-3 border border-slate-800 group-hover:border-cyan-500/30">
                  {p.icon}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{p.subtitle}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-medium text-cyan-400 border border-slate-700">
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">{p.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            Cancel & Keep Current Custom Session
          </button>
        </div>
      </div>
    </div>
  );
};
