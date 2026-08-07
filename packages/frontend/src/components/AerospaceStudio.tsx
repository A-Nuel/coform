import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import {
  geodeticToECEF,
  ecefToNED,
  eulerZYXToQuat,
  degToRad,
  radToDeg,
} from "@coform/core";
import type { ExperienceLevel } from "@coform/core";
import { Rocket, MapPin, Compass, ArrowUpRight, Copy, Check } from "lucide-react";

interface AerospaceStudioProps {
  experienceLevel: ExperienceLevel;
}

export const AerospaceStudio: React.FC<AerospaceStudioProps> = ({ experienceLevel }) => {
  // Launch Pad / Reference Origin (Cape Canaveral / Custom)
  const [refLat, setRefLat] = useState(28.3922);
  const [refLon, setRefLon] = useState(-80.6077);
  const [refAlt, setRefAlt] = useState(10); // meters

  // Missile / Target Position (Geodetic or Local)
  const [targetLat, setTargetLat] = useState(28.4500);
  const [targetLon, setTargetLon] = useState(-80.5200);
  const [targetAlt, setTargetAlt] = useState(2500); // 2.5 km altitude

  // Missile Attitude (Euler ZYX Aerospace: Yaw, Pitch, Roll in degrees)
  const [yawDeg, setYawDeg] = useState(45);   // Heading / Azimuth
  const [pitchDeg, setPitchDeg] = useState(30); // Elevation Angle
  const [rollDeg, setRollDeg] = useState(0);

  const [copied, setCopied] = useState(false);

  // Computations
  const refECEF = geodeticToECEF(refLat, refLon, refAlt);
  const targetECEF = geodeticToECEF(targetLat, targetLon, targetAlt);
  const ned = ecefToNED(targetECEF, refLat, refLon, refAlt); // [North, East, Down]

  // Distance & Elevation metrics
  const north = ned[0];
  const east = ned[1];
  const up = -ned[2]; // Up = -Down
  const slantRange = Math.sqrt(north * north + east * east + up * up);
  const groundDistance = Math.sqrt(north * north + east * east);
  const azimuthRad = Math.atan2(east, north);
  const elevationRad = Math.atan2(up, groundDistance);

  // Quaternion attitude
  const quat = eulerZYXToQuat(
    degToRad(rollDeg),
    degToRad(pitchDeg),
    degToRad(yawDeg)
  );

  const copyResults = () => {
    const text = `Reference: Lat=${refLat}°, Lon=${refLon}°, Alt=${refAlt}m
Reference ECEF [m]: X=${refECEF[0].toFixed(2)}, Y=${refECEF[1].toFixed(2)}, Z=${refECEF[2].toFixed(2)}

Target GPS: Lat=${targetLat}°, Lon=${targetLon}°, Alt=${targetAlt}m
Target ECEF [m]: X=${targetECEF[0].toFixed(2)}, Y=${targetECEF[1].toFixed(2)}, Z=${targetECEF[2].toFixed(2)}

Local NED Frame [m]: North=${north.toFixed(2)}, East=${east.toFixed(2)}, Up=${up.toFixed(2)}
Slant Range: ${(slantRange / 1000).toFixed(3)} km | Ground Range: ${(groundDistance / 1000).toFixed(3)} km
Azimuth: ${radToDeg(azimuthRad).toFixed(2)}° | Elevation: ${radToDeg(elevationRad).toFixed(2)}°

Attitude Quaternion [x,y,z,w]: [${quat[0].toFixed(4)}, ${quat[1].toFixed(4)}, ${quat[2].toFixed(4)}, ${quat[3].toFixed(4)}]`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scale for Three.js 3D visualization (convert meters to visual km units)
  const vizTarget: [number, number, number] = [east / 1000, up / 1000, -north / 1000];

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Control Panel */}
      <div className="w-full lg:w-96 shrink-0 border-r border-slate-800 bg-slate-900/80 p-5 overflow-y-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Aerospace & Missile Frame</h2>
          </div>
          <p className="text-xs text-slate-400">
            WGS-84 Geodetic $\leftrightarrow$ ECEF $\leftrightarrow$ Local Tangent NED Frame
          </p>
        </div>

        {experienceLevel === "beginner" && (
          <div className="rounded-xl bg-amber-950/30 border border-amber-800/40 p-3 text-xs text-amber-200/90 space-y-1">
            <span className="font-semibold text-amber-400">Beginner Guide:</span>
            <p>
              Set the <strong>Reference Launch Origin</strong> and the <strong>Target Missile GPS</strong>.
              Coform automatically calculates ECEF coordinates and the local North-East-Down (NED) radar tracking vector.
            </p>
          </div>
        )}

        {/* Reference Origin Input */}
        <section className="space-y-3 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Launch Station / Ref Origin</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="block text-slate-400">
              Ref Latitude (°)
              <input
                type="number"
                step="0.0001"
                value={refLat}
                onChange={(e) => setRefLat(+e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white"
              />
            </label>
            <label className="block text-slate-400">
              Ref Longitude (°)
              <input
                type="number"
                step="0.0001"
                value={refLon}
                onChange={(e) => setRefLon(+e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white"
              />
            </label>
          </div>
          <label className="block text-xs text-slate-400">
            Ref Altitude (meters)
            <input
              type="number"
              value={refAlt}
              onChange={(e) => setRefAlt(+e.target.value)}
              className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white"
            />
          </label>
        </section>

        {/* Target Position Input */}
        <section className="space-y-3 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Rocket className="w-4 h-4" />
            <span>Target / Missile Position</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="block text-slate-400">
              Target Lat (°)
              <input
                type="number"
                step="0.0001"
                value={targetLat}
                onChange={(e) => setTargetLat(+e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white"
              />
            </label>
            <label className="block text-slate-400">
              Target Lon (°)
              <input
                type="number"
                step="0.0001"
                value={targetLon}
                onChange={(e) => setTargetLon(+e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-white"
              />
            </label>
          </div>
          <label className="block text-xs text-slate-400">
            Altitude (meters MSL)
            <input
              type="range"
              min={100}
              max={20000}
              step={100}
              value={targetAlt}
              onChange={(e) => setTargetAlt(+e.target.value)}
              className="mt-1 w-full"
            />
            <span className="float-right text-cyan-300 font-mono">{(targetAlt / 1000).toFixed(2)} km</span>
          </label>
        </section>

        {/* Missile Attitude Angles */}
        <section className="space-y-3 rounded-xl bg-slate-950/60 p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Flight Attitude (Yaw/Pitch/Roll)</span>
          </div>

          <label className="block text-xs text-slate-400">
            Yaw / Azimuth (°)
            <input
              type="range"
              min={0}
              max={360}
              value={yawDeg}
              onChange={(e) => setYawDeg(+e.target.value)}
              className="mt-1 w-full"
            />
            <span className="float-right text-emerald-300 font-mono">{yawDeg}°</span>
          </label>

          <label className="block text-xs text-slate-400">
            Pitch / Elevation (°)
            <input
              type="range"
              min={-90}
              max={90}
              value={pitchDeg}
              onChange={(e) => setPitchDeg(+e.target.value)}
              className="mt-1 w-full"
            />
            <span className="float-right text-emerald-300 font-mono">{pitchDeg}°</span>
          </label>
        </section>

        {/* Copy Report */}
        <button
          onClick={copyResults}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-amber-600/20"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Report Copied to Clipboard!" : "Copy Full Transformation Report"}</span>
        </button>
      </div>

      {/* 3D Visualization & Metrics Display */}
      <div className="flex-1 relative bg-slate-950 flex flex-col">
        {/* Top Floating Metrics Banner */}
        <div className="absolute top-4 left-4 right-4 z-10 grid grid-cols-2 md:grid-cols-4 gap-3 pointer-events-none">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 backdrop-blur pointer-events-auto">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Slant Range</div>
            <div className="text-lg font-black text-amber-400 font-mono">{(slantRange / 1000).toFixed(3)} km</div>
            <div className="text-[10px] text-slate-500">{slantRange.toFixed(1)} meters</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 backdrop-blur pointer-events-auto">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Ground Distance</div>
            <div className="text-lg font-black text-cyan-400 font-mono">{(groundDistance / 1000).toFixed(3)} km</div>
            <div className="text-[10px] text-slate-500">Local Tangent Ground</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 backdrop-blur pointer-events-auto">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Azimuth / Elevation</div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {radToDeg(azimuthRad).toFixed(1)}° / {radToDeg(elevationRad).toFixed(1)}°
            </div>
            <div className="text-[10px] text-slate-500">Radar Line of Sight</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 backdrop-blur pointer-events-auto">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">ECEF Target [X,Y,Z]</div>
            <div className="text-xs font-bold text-indigo-300 font-mono truncate">
              {(targetECEF[0] / 1000).toFixed(1)}k, {(targetECEF[1] / 1000).toFixed(1)}k km
            </div>
            <div className="text-[10px] text-slate-500">Earth-Centered Earth-Fixed</div>
          </div>
        </div>

        {/* Three.js Canvas */}
        <div className="flex-1">
          <Canvas camera={{ position: [15, 12, 15], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 20, 10]} intensity={1} />
            <Grid infiniteGrid fadeDistance={50} sectionColor="#475569" cellColor="#1e293b" />

            {/* Launch Station Origin (Red sphere) */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color="#f59e0b" emissive="#b45309" />
            </mesh>

            {/* Target Missile Position (Cyan Cone) */}
            <mesh position={vizTarget} rotation={[degToRad(-pitchDeg), degToRad(-yawDeg), 0]}>
              <coneGeometry args={[0.4, 1.2, 16]} />
              <meshStandardMaterial color="#06b6d4" emissive="#0891b2" />
            </mesh>

            <OrbitControls makeDefault />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport />
            </GizmoHelper>
          </Canvas>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 rounded-xl bg-slate-900/90 px-4 py-2.5 text-xs text-slate-300 backdrop-blur border border-slate-800 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
            <span>Launch Origin (0,0,0)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-cyan-400 inline-block" />
            <span>Target Missile Vector</span>
          </div>
          {experienceLevel === "expert" && (
            <div className="text-[10px] font-mono text-slate-400 border-l border-slate-700 pl-4">
              Quaternion: [{quat.map((v) => v.toFixed(3)).join(", ")}]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
