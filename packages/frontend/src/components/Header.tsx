import React from "react";
import type { DomainType, ExperienceLevel } from "@coform/core";
import {
  Rocket,
  Bot,
  Camera,
  Sparkles,
  Binary,
  GitFork,
  HelpCircle,
  ShieldCheck,
  Compass,
  Code2,
  Box,
} from "lucide-react";

export type StudioTab = "workbench" | DomainType | "tree";

interface HeaderProps {
  activeDomain: StudioTab;
  setActiveDomain: (domain: StudioTab) => void;
  experienceLevel: ExperienceLevel;
  setExperienceLevel: (level: ExperienceLevel) => void;
  backendConnected: boolean;
  onOpenPresets: () => void;
  onOpenCodeExport: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDomain,
  setActiveDomain,
  experienceLevel,
  setExperienceLevel,
  backendConnected,
  onOpenPresets,
  onOpenCodeExport,
  onOpenGuide,
}) => {
  const domains: {
    id: StudioTab;
    label: string;
    icon: React.ReactNode;
    color: string;
    activeBorder: string;
  }[] = [
    {
      id: "workbench",
      label: "2D/3D Workbench",
      icon: <Box className="w-4 h-4 text-cyan-400" />,
      color: "text-cyan-400",
      activeBorder: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
    },
    {
      id: "aerospace",
      label: "Aerospace",
      icon: <Rocket className="w-4 h-4 text-amber-400" />,
      color: "text-amber-400",
      activeBorder: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    },
    {
      id: "robotics",
      label: "Robotics DH",
      icon: <Bot className="w-4 h-4 text-blue-400" />,
      color: "text-blue-400",
      activeBorder: "border-blue-500/50 bg-blue-500/10 text-blue-300",
    },
    {
      id: "vision",
      label: "Vision",
      icon: <Camera className="w-4 h-4 text-emerald-400" />,
      color: "text-emerald-400",
      activeBorder: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    },
    {
      id: "math",
      label: "Lie Group",
      icon: <Binary className="w-4 h-4 text-indigo-400" />,
      color: "text-indigo-400",
      activeBorder: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300",
    },
    {
      id: "tree",
      label: "ROS 2 Tree",
      icon: <GitFork className="w-4 h-4 text-rose-400" />,
      color: "text-rose-400",
      activeBorder: "border-rose-500/50 bg-rose-500/10 text-rose-300",
    },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-[#080d18]/95 px-5 py-2.5 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/40">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-amber-500 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="h-full w-full rounded-[10.5px] bg-[#090d16] flex items-center justify-center font-mono font-black text-cyan-400 text-lg tracking-tighter">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-white font-mono">
              COFORM<span className="text-cyan-400">.</span>
            </h1>
            <span className="rounded-full bg-cyan-950/80 px-2 py-0.5 text-[9px] font-mono font-semibold tracking-wider text-cyan-300 border border-cyan-700/50">
              v1.0 STUDIO
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Universal Coordinate Transformation & Kinematics Engine
          </p>
        </div>
      </div>

      {/* Domain Navigation Pills */}
      <nav className="flex items-center gap-1.5 rounded-xl bg-slate-950/80 p-1 border border-slate-800/90 shadow-inner">
        {domains.map((d) => {
          const isActive = activeDomain === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDomain(d.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? `${d.activeBorder} shadow-sm border`
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              {d.icon}
              <span className="hidden md:inline">{d.label}</span>
              <span className="md:hidden">{d.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Control Utility Toolbar */}
      <div className="flex items-center gap-2.5">
        {/* Export as Code Button */}
        <button
          onClick={onOpenCodeExport}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/30 hover:to-indigo-600/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400/60 px-3 py-1.5 text-xs font-bold transition shadow-sm active:scale-95"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export as Code</span>
        </button>

        {/* Quick Tour / Interface Guide Trigger */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-3 py-1.5 text-xs font-semibold transition shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Quick Tour</span>
        </button>

        {/* Preset Templates Trigger */}
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-3 py-1.5 text-xs font-semibold transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Presets</span>
        </button>

        {/* Experience Level Switcher */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setExperienceLevel("beginner")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition text-[11px] font-medium ${
              experienceLevel === "beginner"
                ? "bg-cyan-600 text-white shadow-sm font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span className="hidden lg:inline">Beginner</span>
          </button>
          <button
            onClick={() => setExperienceLevel("expert")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition text-[11px] font-medium ${
              experienceLevel === "expert"
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden lg:inline">Expert CAD</span>
          </button>
        </div>
      </div>
    </header>
  );
};
