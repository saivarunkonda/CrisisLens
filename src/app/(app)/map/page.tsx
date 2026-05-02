"use client";

import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, CloudLightning, Activity, CloudRain, Wind, Flame } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Synthetic global hotspots for map demonstration
const hotspots = [
  { name: "Florida Coast", coordinates: [-81.5158, 27.6648], risk: 85, type: "hurricane", icon: Wind, color: "text-red-500", label: "Hurricane Trajectory" },
  { name: "Southern California", coordinates: [-118.2437, 34.0522], risk: 70, type: "heat", icon: Flame, color: "text-amber-500", label: "Extreme Heat/Wildfire" },
  { name: "Eastern Europe Border", coordinates: [24.0, 49.0], risk: 90, type: "security", icon: ShieldAlert, color: "text-red-600", label: "Geopolitical Alert" },
  { name: "Horn of Africa", coordinates: [45.0, 5.0], risk: 80, type: "food", icon: Activity, color: "text-amber-600", label: "Severe Resource Depletion" },
  { name: "Southeast Asia", coordinates: [100.9925, 15.8700], risk: 95, type: "flood", icon: CloudRain, color: "text-blue-500", label: "Catastrophic Flooding" },
];

export default function MapView() {
  const [mounted, setMounted] = useState(false);
  const [activeMarker, setActiveMarker] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full h-screen bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      
      {/* Control Banner */}
      <div className="p-6 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            Global Incident Tracking
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time geospatial plotting of active crisis trajectories.</p>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 text-sm">
          <button className="px-3 py-1.5 bg-white dark:bg-slate-700 shadow-sm rounded-md font-medium text-blue-600 dark:text-blue-400">All Risks</button>
          <button className="px-3 py-1.5 text-slate-600 dark:text-slate-300 font-medium">Weather</button>
          <button className="px-3 py-1.5 text-slate-600 dark:text-slate-300 font-medium">Security</button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 bg-[#e2e8f0] dark:bg-[#0f172a] overflow-hidden">
        {/* Tooltip Panel Display */}
        <AnimatePresence>
          {activeMarker && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute top-6 left-6 z-20 w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-xl"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 ${activeMarker.color}`}>
                  <activeMarker.icon className="w-5 h-5" />
                </div>
                <button onClick={() => setActiveMarker(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeMarker.name}</h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{activeMarker.label}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500">Risk Severity:</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-md ${activeMarker.risk >= 90 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {activeMarker.risk}/100
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Map */}
        <div className="w-full h-full p-4">
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 130 }} style={{ width: "100%", height: "100%" }}>
            <ZoomableGroup center={[0, 20]} zoom={1.2}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography 
                      key={geo.rsmKey} 
                      geography={geo} 
                      className="fill-slate-300 dark:fill-slate-700/50 stroke-slate-400 dark:stroke-slate-600 outline-none hover:fill-slate-400 dark:hover:fill-slate-600 transition-colors duration-300"
                    />
                  ))
                }
              </Geographies>

              {hotspots.map((h, i) => (
                <Marker key={i} coordinates={h.coordinates as [number, number]} onClick={() => setActiveMarker(h)}>
                  <motion.g
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: i * 0.1 }}
                    className="cursor-pointer"
                  >
                    {/* Pulsing Base */}
                    <circle r={12} fill={h.risk >= 90 ? "#ef4444" : "#f59e0b"} className="animate-ping opacity-70" />
                    {/* Solid Dot */}
                    <circle r={6} fill={h.risk >= 90 ? "#dc2626" : "#d97706"} stroke="#fff" strokeWidth={2} />
                  </motion.g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>
    </div>
  );
}
