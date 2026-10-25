"use client";

import React from "react";
import { Flame, Satellite, ShieldCheck, Database, Layers } from "lucide-react";

interface HeaderProps {
  activeMode: string;
  isBackendConnected: boolean;
  isFirmsConfigured: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  isBackendConnected,
  isFirmsConfigured,
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: "overview", label: "Overview & Map" },
    { id: "calendar", label: "Activity Calendar" },
    { id: "compare", label: "Sensor Comparison" },
    { id: "anomalies", label: "Historical Seasonality" },
    { id: "methodology", label: "Provenance & Method" },
  ];

  return (
    <header className="border-b border-nasa-border/60 bg-nasa-dark/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nasa-orange to-nasa-red flex items-center justify-center shadow-lg shadow-nasa-red/20">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                FireChronicle
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-nasa-card text-nasa-cyan border border-nasa-border">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-xs text-nasa-slate">
              Cross-Sensor Harmonization of MODIS (1 km) and VIIRS (375 m) Active Fire Hotspots
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-nasa-card/80 border border-nasa-border text-nasa-slate">
            <ShieldCheck className="w-3.5 h-3.5 text-nasa-cyan" />
            <span className="text-gray-400">Mode:</span>
            <span className="font-semibold text-white">{activeMode}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-nasa-card/80 border border-nasa-border">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-gray-300">FastAPI + DuckDB</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-nasa-card/80 border border-nasa-border">
            <Satellite className="w-3.5 h-3.5 text-nasa-orange" />
            <span className="text-gray-400">FIRMS API:</span>
            <span className={isFirmsConfigured ? "text-green-400 font-medium" : "text-amber-400 font-medium"}>
              {isFirmsConfigured ? "Live Key Configured" : "Sample Baseline Fixtures"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto border-t border-nasa-border/30 pt-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-nasa-card text-nasa-cyan border-t-2 border-nasa-cyan"
                  : "text-nasa-slate hover:text-white hover:bg-nasa-card/40"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
