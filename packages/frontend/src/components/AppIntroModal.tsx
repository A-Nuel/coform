import React, { useState } from "react";
import {
  Compass,
  Box,
  Layers,
  Sparkles,
  Code2,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Rocket,
  Bot,
  Camera,
  Binary,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { MathText } from "./MathText";

interface AppIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudio?: (studio: string) => void;
}

export const AppIntroModal: React.FC<AppIntroModalProps> = ({
  isOpen,
  onClose,
  onSelectStudio,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to Coform",
      subtitle: "Universal Coordinate Transformation & Kinematics Engine",
      badge: "PLATFORM OVERVIEW",
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong>Coform</strong> is an interactive engineering CAD studio designed for <strong>Robotics</strong>, <strong>Aerospace</strong>, <strong>Computer Vision</strong>, and <strong>Applied Linear Algebra</strong>.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
                <Box className="w-4 h-4" />
                <span>2D & 3D Workbench</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Directly enter coordinates or pick geometry primitives, stack action transformations, and see real-time delta displacements.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
                <Rocket className="w-4 h-4" />
                <span>Aerospace Radar</span>
              </div>
              <div className="text-[11px] text-slate-400">
                <MathText math="\text{WGS-84} \longleftrightarrow \text{ECEF} \longleftrightarrow \text{NED}" /> radar conversions with 3D missile ballistic trajectories.
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-400 font-bold font-mono">
                <Bot className="w-4 h-4" />
                <span>Robotics DH Chains</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Denavit-Hartenberg forward kinematics, industrial arm presets (UR5, SCARA), and live end-effector pose calculations.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold font-mono">
                <Binary className="w-4 h-4" />
                <span>Lie Groups SO(3)/SE(3)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Bidirectional Euler, Quaternion, Rotation Matrix, and SLERP interpolation with orthogonality verification.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Step 1: Input Coordinates & Shapes",
      subtitle: "Enter raw numbers or choose quick primitive templates",
      badge: "COORDINATE MANAGER",
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            In the <strong>Transformation Workbench</strong>, switch between <strong>2D Space</strong> and <strong>3D Space</strong> at any time.
          </p>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-cyan-400 font-bold text-xs">Coordinate Input Table</span>
              <span className="text-[10px] font-mono text-slate-500">2-WAY NUMERIC BINDING</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center text-slate-300">
                <div className="text-[9px] text-slate-500 font-bold">P1 (X, Y)</div>
                (-1.0, -1.0)
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center text-slate-300">
                <div className="text-[9px] text-slate-500 font-bold">P2 (X, Y)</div>
                (1.0, -1.0)
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center text-cyan-400">
                <div className="text-[9px] text-slate-500 font-bold">+ Add Point</div>
                Custom Vertices
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 <strong>Tip:</strong> Click any primitive button (Unit Square, Triangle, Arrow, Cube, Pyramid) to instantly populate geometric vertices.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 2: Stacking Transformation Actions",
      subtitle: "Chain translations, rotations, scalings, reflections, and shears",
      badge: "ACTION PIPELINE",
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Transformations are applied sequentially from top to bottom. Coform automatically concatenates them into a single homogeneous composite matrix:
          </p>
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 font-mono text-xs text-center text-cyan-300 font-bold">
            <MathText math="M_{\text{composite}} = M_n \cdot M_{n-1} \cdots M_1" display={true} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="font-bold text-slate-200">Dual Input Controls:</span>
              <span className="text-slate-400">Type exact numeric values in the input boxes OR drag tactile sliders.</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span className="font-bold text-slate-200">Enable/Disable Staging:</span>
              <span className="text-slate-400">Check/uncheck any action to immediately see its contribution to the final pose.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Step 3: Real-Time Dual Viewports & Telemetry",
      subtitle: "Observe displacements, vector trails, and resultant coordinate readouts",
      badge: "REAL-TIME VISUALIZATION",
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
              <span className="font-bold text-cyan-400 font-mono text-[11px]">2D Vector Canvas</span>
              <p className="text-[11px] text-slate-400">
                Renders the ghosted original shape, glowing active transformed shape, and dashed displacement vector arrows connecting each vertex.
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
              <span className="font-bold text-indigo-400 font-mono text-[11px]">3D Three.js WebGL Scene</span>
              <p className="text-[11px] text-slate-400">
                Interactive 3D orbit controls, orientation gizmo, luminous geometry meshes, and 3D vertex displacement lines.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-400 font-mono">
              <span>Resultant Table Telemetry:</span>
              <span className="text-amber-400 font-bold">Original P → Resultant P' + Δ Distance</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Step 4: On-Demand Polyglot Code Export",
      subtitle: "One-click generation for Python, C++, TypeScript, Rust, MATLAB, and API",
      badge: "CODE EXPORTER",
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Click the <strong>[ &lt;/&gt; Export as Code ]</strong> button in the top navigation bar or workbench at any time to open the synchronized multi-language export modal.
          </p>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="rounded bg-slate-900 border border-slate-800 p-2 text-center text-cyan-300 font-bold">
              Python (NumPy)
            </div>
            <div className="rounded bg-slate-900 border border-slate-800 p-2 text-center text-blue-300 font-bold">
              C++ (Eigen3)
            </div>
            <div className="rounded bg-slate-900 border border-slate-800 p-2 text-center text-indigo-300 font-bold">
              TypeScript
            </div>
            <div className="rounded bg-slate-900 border border-slate-800 p-2 text-center text-amber-300 font-bold">
              Rust (nalgebra)
            </div>
            <div className="rounded bg-slate-900 border border-slate-800 p-2 text-center text-emerald-300 font-bold">
              MATLAB
            </div>
            <div className="rounded bg-slate-900 border border-slate-800 p-2 text-center text-purple-300 font-bold">
              REST cURL
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Export ready-to-run scripts directly into your robotics stacks, computer vision pipelines, or academic homework solutions!
          </p>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl flex flex-col rounded-2xl border border-slate-800 bg-[#0c121e] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#080d18]">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Compass className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  {step.title}
                </h2>
                <span className="rounded-md bg-cyan-950 px-2 py-0.5 text-[9px] font-mono text-cyan-400 border border-cyan-800/50">
                  {step.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{step.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-950 border-b border-slate-800/60">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i === currentStep
                  ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  : i < currentStep
                  ? "bg-cyan-800"
                  : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#070a12]">
          {step.content}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3.5 bg-[#080d18]">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              currentStep === 0
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-4 py-1.5 text-xs font-bold text-white transition shadow-sm active:scale-95"
          >
            <span>{currentStep === steps.length - 1 ? "Start Exploring" : "Next Step"}</span>
            {currentStep === steps.length - 1 ? (
              <Zap className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
