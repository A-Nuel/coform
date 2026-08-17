import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Line, Text } from "@react-three/drei";
import {
  geodeticToECEF,
  ecefToNED,
  eulerZYXToQuat,
  degToRad,
  radToDeg,
} from "@coform/core";
import type { ExperienceLevel } from "@coform/core";
import {
  Rocket,
  MapPin,
  Compass,
  Copy,
  Check,
  Navigation,
  Globe,
  Radio,
  Eye,
  Crosshair,
  Layers,
} from "lucide-react";

interface AerospaceStudioProps {
  experienceLevel: ExperienceLevel;
}

const SPACEPORT_PRESETS = [
  { name: "Cape Canaveral SLC-40", lat: 28.5621, lon: -80.5772, alt: 10 },
  { name: "Starbase Boca Chica", lat: 25.9972, lon: -97.1561, alt: 5 },
  { name: "Vandenberg SFB SLC-4E", lat: 34.632, lon: -120.611, alt: 110 },
  { name: "Guiana Space Centre", lat: 5.239, lon: -52.768, alt: 15 },
  { name: "Baikonur Cosmodrome", lat: 45.965, lon: 63.305, alt: 90 },
];

const TARGET_PRESETS = [
  { name: "Low-Altitude Radar Track", latOffset: 0.08, lonOffset: 0.08, alt: 3500, yaw: 45, pitch: 15, roll: 0 },
  { name: "Atmospheric Interceptor", latOffset: 0.25, lonOffset: 0.15, alt: 18000, yaw: 65, pitch: 42, roll: 10 },
  { name: "Suborbital Boost Phase", latOffset: 0.5, lonOffset: 0.4, alt: 65000, yaw: 90, pitch: 60, roll: 5 },
];

export const AerospaceStudio: React.FC<AerospaceStudioProps> = ({ experienceLevel }) => {
  // Launch Station Reference Origin (WGS-84)
  const [refLat, setRefLat] = useState(28.5621);
  const [refLon, setRefLon] = useState(-80.5772);
  const [refAlt, setRefAlt] = useState(10); // meters

  // Missile / Target Position (WGS-84)
  const [targetLat, setTargetLat] = useState(28.72);
  const [targetLon, setTargetLon] = useState(-80.42);
  const [targetAlt, setTargetAlt] = useState(12000); // 12 km MSL

  // Missile Flight Attitude (Euler ZYX in degrees: Yaw=Azimuth, Pitch=Elevation, Roll)
  const [yawDeg, setYawDeg] = useState(55);
  const [pitchDeg, setPitchDeg] = useState(35);
  const [rollDeg, setRollDeg] = useState(10);

  const [copied, setCopied] = useState(false);

  // Computations
  const refECEF = geodeticToECEF(refLat, refLon, refAlt);
  const targetECEF = geodeticToECEF(targetLat, targetLon, targetAlt);
  const ned = ecefToNED(targetECEF, refLat, refLon, refAlt); // [North, East, Down]

  const north = ned[0];
  const east = ned[1];
  const up = -ned[2]; // Up = -Down
  const slantRange = Math.sqrt(north * north + east * east + up * up);
  const groundDistance = Math.sqrt(north * north + east * east);
  const azimuthRad = Math.atan2(east, north);
  const elevationRad = Math.atan2(up, groundDistance);

  // Quaternion Attitude [x, y, z, w]
  const quat = eulerZYXToQuat(
    degToRad(rollDeg),
    degToRad(pitchDeg),
    degToRad(yawDeg)
  );

  const copyResults = () => {
    const report = {
      reference_station: {
        wgs84_lat_deg: refLat,
        wgs84_lon_deg: refLon,
        altitude_m: refAlt,
        ecef_xyz_m: refECEF,
      },
      target_vehicle: {
        wgs84_lat_deg: targetLat,
        wgs84_lon_deg: targetLon,
        altitude_msl_m: targetAlt,
        ecef_xyz_m: targetECEF,
      },
      local_tangent_ned_m: {
        north_m: north,
        east_m: east,
        up_m: up,
        slant_range_m: slantRange,
        ground_range_m: groundDistance,
        azimuth_deg: radToDeg(azimuthRad),
        elevation_deg: radToDeg(elevationRad),
      },
      flight_attitude: {
        yaw_deg: yawDeg,
        pitch_deg: pitchDeg,
        roll_deg: rollDeg,
        quaternion_xyzw: quat,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scaled 3D coordinates for Three.js (meters -> km scale)
  const vizTarget: [number, number, number] = [east / 1000, up / 1000, -north / 1000];
  const vizGroundFootprint: [number, number, number] = [east / 1000, 0, -north / 1000];

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#080c14]">
      {/* Sidebar Control Panel */}
      <div className="w-full lg:w-[410px] shrink-0 border-r border-slate-800/80 bg-[#0c121e]/90 p-5 overflow-y-auto space-y-5">
        {/* Domain Title & Subheading */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Rocket className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                Aerospace & Radar
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              WGS-84 Geodetic $\leftrightarrow$ ECEF $\leftrightarrow$ Local Tangent NED Radar
            </p>
          </div>
          <span className="rounded-md bg-amber-950/60 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-400 border border-amber-800/50">
            WGS-84 ELLIPSOID
          </span>
        </div>

        {experienceLevel === "beginner" && (
          <div className="rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 p-3.5 text-xs text-amber-200/90 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>How Aerospace Radar Coordinate Conversion Works:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              1. Choose a <strong>Launch Station / Radar Origin</strong> (GPS Latitude & Longitude).<br />
              2. Adjust the <strong>Target Missile Position</strong> and <strong>Altitude</strong>.<br />
              3. Coform computes the 3D ECEF vector and relative <strong>Azimuth, Elevation & Slant Range</strong>.
            </p>
          </div>
        )}

        {/* Spaceport Presets */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-amber-400" />
            <span>Launch Base Presets</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {SPACEPORT_PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setRefLat(p.lat);
                  setRefLon(p.lon);
                  setRefAlt(p.alt);
                }}
                className="truncate rounded-lg bg-slate-900/90 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-300 hover:text-amber-200 transition"
              >
                {p.name.split(" ")[0]} ({p.lat.toFixed(1)}°)
              </button>
            ))}
          </div>
        </div>

        {/* Reference Origin Station */}
        <section className="space-y-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
              <MapPin className="w-3.5 h-3.5" />
              <span>Launch Origin Station</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">ORIGIN (0,0,0)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Latitude (° N/S)</label>
              <input
                type="number"
                step="0.0001"
                value={refLat}
                onChange={(e) => setRefLat(+e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-amber-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Longitude (° E/W)</label>
              <input
                type="number"
                step="0.0001"
                value={refLon}
                onChange={(e) => setRefLon(+e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-amber-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Ground Elevation (MSL)</span>
              <span className="font-mono text-amber-400">{refAlt} m</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={5}
              value={refAlt}
              onChange={(e) => setRefAlt(+e.target.value)}
              className="w-full accent-amber-500"
            />
          </div>
        </section>

        {/* Target Vehicle Position */}
        <section className="space-y-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Target / Vehicle GPS</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">TRACKING</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Target Lat (°)</label>
              <input
                type="number"
                step="0.0001"
                value={targetLat}
                onChange={(e) => setTargetLat(+e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:border-cyan-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Target Lon (°)</label>
              <input
                type="number"
                step="0.0001"
                value={targetLon}
                onChange={(e) => setTargetLon(+e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:border-cyan-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Target Altitude (m)</span>
              <input
                type="number"
                step="100"
                min={500}
                max={50000}
                value={targetAlt}
                onChange={(e) => setTargetAlt(+e.target.value)}
                className="w-20 rounded bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-xs text-cyan-300 font-mono text-right"
              />
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={250}
              value={targetAlt}
              onChange={(e) => setTargetAlt(+e.target.value)}
              className="w-full accent-cyan-500"
            />
          </div>
        </section>

        {/* Missile Flight Attitude (Yaw/Pitch/Roll) */}
        <section className="space-y-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              <Compass className="w-3.5 h-3.5" />
              <span>Attitude Gyro (Yaw/Pitch/Roll)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">AEROSPACE ZYX</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Heading / Yaw ($\psi$)</span>
                <input
                  type="number"
                  value={yawDeg}
                  onChange={(e) => setYawDeg(+e.target.value)}
                  className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-xs text-emerald-300 font-mono text-right"
                />
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={yawDeg}
                onChange={(e) => setYawDeg(+e.target.value)}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Pitch Elevation ($\theta$)</span>
                <input
                  type="number"
                  value={pitchDeg}
                  onChange={(e) => setPitchDeg(+e.target.value)}
                  className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-xs text-emerald-300 font-mono text-right"
                />
              </div>
              <input
                type="range"
                min={-90}
                max={90}
                value={pitchDeg}
                onChange={(e) => setPitchDeg(+e.target.value)}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Bank / Roll ($\phi$)</span>
                <input
                  type="number"
                  value={rollDeg}
                  onChange={(e) => setRollDeg(+e.target.value)}
                  className="w-16 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-xs text-emerald-300 font-mono text-right"
                />
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={rollDeg}
                onChange={(e) => setRollDeg(+e.target.value)}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Copy Report Action */}
        <button
          onClick={copyResults}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-amber-600/25 active:scale-[0.99]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Telemetry Copied to Clipboard!" : "Export Full Radar Telemetry"}</span>
        </button>
      </div>

      {/* 3D Visualization & Telemetry HUD */}
      <div className="flex-1 relative bg-[#070a12] flex flex-col overflow-hidden">
        {/* Top HUD Telemetry Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 grid grid-cols-2 md:grid-cols-4 gap-3 pointer-events-none">
          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Slant Range</span>
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
            </div>
            <div className="text-xl font-black text-amber-400 font-mono tracking-tight mt-0.5">
              {(slantRange / 1000).toFixed(3)} <span className="text-xs text-amber-400/70 font-normal">km</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{slantRange.toFixed(1)} meters LOS</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Ground Track</span>
              <Navigation className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-400 font-mono tracking-tight mt-0.5">
              {(groundDistance / 1000).toFixed(3)} <span className="text-xs text-cyan-400/70 font-normal">km</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Local Tangent Plane</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Azimuth / Elev</span>
              <Crosshair className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
              {radToDeg(azimuthRad).toFixed(1)}° <span className="text-xs text-slate-500 font-normal">/</span> {radToDeg(elevationRad).toFixed(1)}°
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Radar Beam Look Angle</div>
          </div>

          <div className="hud-panel rounded-xl p-3 shadow-lg pointer-events-auto border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Target ECEF (km)</span>
              <Layers className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-sm font-bold text-indigo-300 font-mono tracking-tight mt-1 truncate">
              [{(targetECEF[0] / 1000).toFixed(1)}, {(targetECEF[1] / 1000).toFixed(1)}, {(targetECEF[2] / 1000).toFixed(1)}]
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Earth-Centered Earth-Fixed</div>
          </div>
        </div>

        {/* Three.js 3D Viewport */}
        <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [20, 16, 20], fov: 45 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[15, 25, 15]} intensity={1.2} />
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#f59e0b" />

            {/* Local Tangent Plane Infinite Grid */}
            <Grid
              infiniteGrid
              fadeDistance={60}
              sectionSize={5}
              sectionColor="#334155"
              cellColor="#0f172a"
              cellSize={1}
            />

            {/* Launch Station Origin (Gold Sphere + Beacon) */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.4, 32, 32]} />
              <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.6} />
            </mesh>

            {/* Ground Footprint Marker (beneath missile) */}
            <mesh position={vizGroundFootprint}>
              <cylinderGeometry args={[0.6, 0.6, 0.05, 32]} />
              <meshStandardMaterial color="#06b6d4" transparent opacity={0.4} />
            </mesh>

            {/* Altitude Dropdown Line (Target to Ground) */}
            <Line
              points={[vizTarget, vizGroundFootprint]}
              color="#06b6d4"
              lineWidth={1.5}
              dashed
              dashScale={2}
              dashSize={0.5}
              gapSize={0.3}
            />

            {/* Radar Line of Sight (LOS) Beam (Origin to Target) */}
            <Line
              points={[[0, 0, 0], vizTarget]}
              color="#f59e0b"
              lineWidth={2.5}
            />

            {/* Ground Range Line (Origin to Ground Footprint) */}
            <Line
              points={[[0, 0, 0], vizGroundFootprint]}
              color="#38bdf8"
              lineWidth={1.5}
            />

            {/* Target Missile Cone Body */}
            <group position={vizTarget} rotation={[degToRad(-pitchDeg), degToRad(-yawDeg), degToRad(rollDeg)]}>
              <mesh position={[0, 0.6, 0]}>
                <coneGeometry args={[0.35, 1.2, 32]} />
                <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.8} />
              </mesh>
              <mesh position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.25, 0.25, 0.8, 32]} />
                <meshStandardMaterial color="#0284c7" />
              </mesh>
            </group>

            <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport axisColors={["#ef4444", "#22c55e", "#3b82f6"]} labelColor="#fff" />
            </GizmoHelper>
          </Canvas>
        </div>

        {/* Bottom Legend & Status HUD */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="hud-panel rounded-xl px-4 py-2 text-xs text-slate-300 pointer-events-auto flex items-center gap-4 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <span className="font-medium text-xs">Origin Radar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="font-medium text-xs">Target Vehicle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-5 rounded bg-amber-500/70" />
              <span className="text-[11px] text-slate-400">Slant Range LOS</span>
            </div>
          </div>

          <div className="hud-panel rounded-xl px-3 py-2 text-[11px] font-mono text-slate-400 pointer-events-auto shadow-lg hidden md:block">
            Attitude Quaternion: [{quat.map((v) => v.toFixed(3)).join(", ")}]
          </div>
        </div>
      </div>
    </div>
  );
};
