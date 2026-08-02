import { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import type { Transform, CoordinateSet } from "@coform/core";
import { applyTransformToCoordinates, composeTransforms } from "@coform/core";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function PointCloud({ points, color = "#22d3ee" }: { points: number[][]; color?: string }) {
  if (!points.length) return null;
  const positions = new Float32Array(points.flatMap((p) => [p[0], p[1], p[2] ?? 0]));
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={color} sizeAttenuation />
    </points>
  );
}

export default function App() {
  const [tx, setTx] = useState(1.0);
  const [ty, setTy] = useState(0.5);
  const [tz, setTz] = useState(0.0);
  const [theta, setTheta] = useState(0.4);
  const [scale, setScale] = useState(1.0);
  const [dim, setDim] = useState<2 | 3>(3);
  const [status, setStatus] = useState<string>("Ready");
  const [resultMatrix, setResultMatrix] = useState<number[][] | null>(null);

  // Demo points
  const original: CoordinateSet = {
    id: "demo",
    dim,
    points:
      dim === 2
        ? [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0.5, 0.5],
          ]
        : [
            [0, 0, 0],
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0],
            [0.5, 0.5, 0.5],
            [0, 0, 1],
          ],
  };

  const transform: Transform =
    dim === 2
      ? {
          type: "similarity2d",
          pose: { translation: [tx, ty], rotation: theta, scale },
          childFrame: "transformed",
          parentFrame: "world",
        }
      : {
          type: "similarity3d",
          pose: {
            translation: [tx, ty, tz],
            rotation: [0, 0, Math.sin(theta / 2), Math.cos(theta / 2)], // simple Z rotation
            scale,
          },
          childFrame: "transformed",
          parentFrame: "world",
        };

  const transformed = applyTransformToCoordinates(transform, original);

  const applyOnBackend = useCallback(async () => {
    setStatus("Calling backend&");
    try {
      const res = await fetch(`${API_BASE}/transforms/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transform,
          coordinates: original,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResultMatrix(data.transformMatrix ?? data.transform_matrix);
      setStatus("Backend transform OK");
    } catch (e: any) {
      setStatus(`Backend error: ${e.message}`);
    }
  }, [transform, original]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-slate-950">
            C
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Coform</h1>
            <p className="text-xs text-slate-400">Coordinate transforms for CV & Robotics</p>
          </div>
        </div>
        <div className="text-sm text-slate-400">{status}</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar controls */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-900/80 p-5 space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
              Dimension
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setDim(2)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  dim === 2 ? "bg-cyan-600 text-white" : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setDim(3)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  dim === 3 ? "bg-cyan-600 text-white" : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                3D
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Similarity Transform
            </h2>

            <label className="block text-xs text-slate-400">
              Translation X
              <input
                type="range"
                min={-3}
                max={3}
                step={0.05}
                value={tx}
                onChange={(e) => setTx(+e.target.value)}
                className="mt-1 w-full"
              />
              <span className="float-right">{tx.toFixed(2)}</span>
            </label>

            <label className="block text-xs text-slate-400">
              Translation Y
              <input
                type="range"
                min={-3}
                max={3}
                step={0.05}
                value={ty}
                onChange={(e) => setTy(+e.target.value)}
                className="mt-1 w-full"
              />
              <span className="float-right">{ty.toFixed(2)}</span>
            </label>

            {dim === 3 && (
              <label className="block text-xs text-slate-400">
                Translation Z
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.05}
                  value={tz}
                  onChange={(e) => setTz(+e.target.value)}
                  className="mt-1 w-full"
                />
                <span className="float-right">{tz.toFixed(2)}</span>
              </label>
            )}

            <label className="block text-xs text-slate-400">
              Rotation (rad)
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step={0.02}
                value={theta}
                onChange={(e) => setTheta(+e.target.value)}
                className="mt-1 w-full"
              />
              <span className="float-right">{theta.toFixed(2)}</span>
            </label>

            <label className="block text-xs text-slate-400">
              Scale
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.05}
                value={scale}
                onChange={(e) => setScale(+e.target.value)}
                className="mt-1 w-full"
              />
              <span className="float-right">{scale.toFixed(2)}</span>
            </label>
          </section>

          <section className="space-y-2">
            <button
              onClick={applyOnBackend}
              className="w-full rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 transition"
            >
              Apply on Backend (high accuracy)
            </button>
            <p className="text-xs text-slate-500">
              Frontend uses pure TS for real-time preview. Backend (Python) is authoritative.
            </p>
          </section>

          {resultMatrix && (
            <section>
              <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-400">
                Backend Matrix
              </h2>
              <pre className="overflow-x-auto rounded bg-slate-950 p-2 text-[10px] text-cyan-300">
                {JSON.stringify(resultMatrix, null, 1)}
              </pre>
            </section>
          )}
        </aside>

        {/* 3D / 2D Viewer */}
        <main className="relative flex-1 bg-slate-950">
          <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <Grid infiniteGrid fadeDistance={30} sectionColor="#334155" cellColor="#1e293b" />
            <PointCloud points={original.points} color="#94a3b8" />
            <PointCloud points={transformed.points} color="#22d3ee" />
            <OrbitControls makeDefault />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport />
            </GizmoHelper>
          </Canvas>

          <div className="absolute bottom-4 left-4 rounded-md bg-slate-900/80 px-3 py-2 text-xs text-slate-400 backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400 mr-2" /> Original
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 ml-4 mr-2" /> Transformed
          </div>
        </main>
      </div>
    </div>
  );
}
