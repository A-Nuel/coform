import React, { useState, useEffect } from "react";
import type { DomainType, ExperienceLevel } from "@coform/core";
import { Header, type StudioTab } from "./components/Header";
import { PresetSelector } from "./components/PresetSelector";
import { TransformationWorkbench } from "./components/TransformationWorkbench";
import { AerospaceStudio } from "./components/AerospaceStudio";
import { RoboticsStudio } from "./components/RoboticsStudio";
import { VisionStudio } from "./components/VisionStudio";
import { LieGroupStudio } from "./components/LieGroupStudio";
import { TransformTreeStudio } from "./components/TransformTreeStudio";
import { CodeExportModal, type PipelineAction } from "./components/CodeExportModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function App() {
  const [activeDomain, setActiveDomain] = useState<StudioTab>("workbench");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);

  // Code Export Modal State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [exportDim, setExportDim] = useState<2 | 3>(2);
  const [exportPoints, setExportPoints] = useState<number[][]>([
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]);
  const [exportActions, setExportActions] = useState<PipelineAction[]>([
    {
      id: "1",
      type: "translation",
      name: "Translation (Δx=1.5, Δy=1.0)",
      enabled: true,
      params: { dx: 1.5, dy: 1.0 },
    },
  ]);
  const [exportMatrix, setExportMatrix] = useState<number[][]>([
    [1, 0, 1.5],
    [0, 1, 1.0],
    [0, 0, 1],
  ]);

  // Ping backend on startup
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => {
        if (res.ok) setBackendConnected(true);
      })
      .catch(() => setBackendConnected(false));
  }, []);

  const handleSelectPreset = (domain: StudioTab, _presetId: string) => {
    setActiveDomain(domain);
  };

  const handleOpenCodeExport = (
    dim: 2 | 3,
    points: number[][],
    actions: PipelineAction[],
    compositeMatrix: number[][]
  ) => {
    setExportDim(dim);
    setExportPoints(points);
    setExportActions(actions);
    setExportMatrix(compositeMatrix);
    setIsCodeModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-[#080c14] text-slate-100 font-sans antialiased overflow-hidden select-none">
      {/* Universal CAD HUD Header */}
      <Header
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        experienceLevel={experienceLevel}
        setExperienceLevel={setExperienceLevel}
        backendConnected={backendConnected}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenCodeExport={() => setIsCodeModalOpen(true)}
      />

      {/* Main Studio Viewport Area */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <div className="flex-1 overflow-hidden relative">
          {activeDomain === "workbench" && (
            <TransformationWorkbench
              experienceLevel={experienceLevel}
              onOpenCodeExport={handleOpenCodeExport}
            />
          )}
          {activeDomain === "aerospace" && (
            <AerospaceStudio experienceLevel={experienceLevel} />
          )}
          {activeDomain === "robotics" && (
            <RoboticsStudio experienceLevel={experienceLevel} />
          )}
          {activeDomain === "vision" && (
            <VisionStudio experienceLevel={experienceLevel} />
          )}
          {activeDomain === "math" && (
            <LieGroupStudio experienceLevel={experienceLevel} />
          )}
          {activeDomain === "tree" && (
            <TransformTreeStudio experienceLevel={experienceLevel} />
          )}
        </div>
      </main>

      {/* Industry Domain Preset Modal */}
      <PresetSelector
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      {/* On-Demand Polyglot Code Export Modal */}
      <CodeExportModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        dim={exportDim}
        points={exportPoints}
        actions={exportActions}
        compositeMatrix={exportMatrix}
      />
    </div>
  );
}
