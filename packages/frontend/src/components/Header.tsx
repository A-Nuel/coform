import React from "react";
import type { DomainType, ExperienceLevel } from "@coform/core";
import { Rocket, Bot, Camera, Sparkles, Binary, HelpCircle, ShieldCheck } from "lucide-react";

interface HeaderProps {
  activeDomain: DomainType;
  setActiveDomain: (domain: DomainType) => void;
  experienceLevel: ExperienceLevel;
  setExperienceLevel: (level: ExperienceLevel) => void;
  backendConnected: boolean;
  onOpenPresets: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDomain,
  setActiveDomain,
  experienceLevel,
  setExperienceLevel,
  backendConnected,
  onOpenPresets,
}) => {
  const domains: { id: DomainType; label: string; icon: React.ReactNode }[] = [
    { id: "aerospace", label: "Aerospace & Missiles", icon: <Rocket className="w-4 h-4 text-amber-400" /> },
    { id: "robotics", label: "Robotics & Kinematics", icon: <Bot className="w-4 h-4 text-cyan-400" /> },
    { id: "vision", label: "Computer Vision", icon: <Camera className="w-4 h-4 text-emerald-400" /> },
    { id: "math", label: "Lie Group & Math", icon: <Binary className="w-4 h-4 text-indigo-400" /> },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3 backdrop-blur sticky top-0 z-50">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-amber-500 p-[2px] shadow-lg shadow-cyan-500/20">
          <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center font-black text-cyan-400 text-lg tracking-tighter">
            C
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">Coform</h1>
            <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cyan-400 border border-cyan-800/50">
              Universal Platform
            </span>
          </div>
          <p className="text-xs text-slate-400">Industry-Grade Coordinate Transformation & Kinematics Engine</p>
        </div>
      </div>

      {/* Domain Workspace Tabs */}
      <nav className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDomain(d.id)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeDomain === d.id
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            {d.icon}
            <span>{d.label}</span>
          </button>
        ))}
      </nav>

      {/* Experience Level & Status Controls */}
      <div className="flex items-center gap-3">
        {/* Preset Templates button */}
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 text-xs font-medium transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Domain Presets</span>
        </button>

        {/* Experience Level Switcher */}
        <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
          <button
            onClick={() => setExperienceLevel("beginner")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              experienceLevel === "beginner" ? "bg-cyan-600 text-white font-medium" : "text-slate-400 hover:text-white"
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Beginner</span>
          </button>
          <button
            onClick={() => setExperienceLevel("expert")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              experienceLevel === "expert" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Expert / Industry</span>
          </button>
        </div>

        {/* Backend Connectivity pill */}
        <div className="flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs border border-slate-800">
          <span className={`h-2 w-2 rounded-full ${backendConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <span className="text-slate-300 font-mono text-[11px]">
            {backendConnected ? "Backend Python 64-bit Active" : "Frontend Pure TS Mode"}
          </span>
        </div>
      </div>
    </header>
  );
};
