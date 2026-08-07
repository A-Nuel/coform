import React, { useState, useEffect } from "react";
import type { DomainType, ExperienceLevel } from "@coform/core";
import { Header } from "./components/Header";
import { PresetSelector } from "./components/PresetSelector";
import { AerospaceStudio } from "./components/AerospaceStudio";
import { RoboticsStudio } from "./components/RoboticsStudio";
import { VisionStudio } from "./components/VisionStudio";
import { LieGroupStudio } from "./components/LieGroupStudio";
import { CodeGeneratorStudio } from "./components/CodeGeneratorStudio";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function App() {
  const [activeDomain, setActiveDomain] = useState<DomainType>("aerospace");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);

  // Ping backend on startup
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.ok && setBackendConnected(true))
      .catch(() => setBackendConnected(false));
  }, []);

  const handleSelectPreset = (domain: DomainType, presetId: string) => {
    setActiveDomain(domain);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Header Bar */}
      <Header
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        experienceLevel={experienceLevel}
        setExperienceLevel={setExperienceLevel}
        backendConnected={backendConnected}
        onOpenPresets={() => setIsPresetsOpen(true)}
      />

      {/* Main Studio Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {activeDomain === "aerospace" && <AerospaceStudio experienceLevel={experienceLevel} />}
        {activeDomain === "robotics" && <RoboticsStudio experienceLevel={experienceLevel} />}
        {activeDomain === "vision" && <VisionStudio experienceLevel={experienceLevel} />}
        {activeDomain === "math" && <LieGroupStudio experienceLevel={experienceLevel} />}

        {/* Bottom Polyglot Code Bar */}
        <div className="border-t border-slate-800 bg-slate-900/60 p-4">
          <CodeGeneratorStudio activeDomain={activeDomain} />
        </div>
      </div>

      {/* Preset Modal */}
      <PresetSelector
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}
