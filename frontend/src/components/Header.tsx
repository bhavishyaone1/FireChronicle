"use client";

import React from "react";
import { Flame, Satellite, ShieldCheck, Database, Layers, AlertCircle, Sparkles } from "lucide-react";

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
    <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fire-mid to-fire-high flex items-center justify-center shadow-lg shadow-fire-high/20 shrink-0">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-text-primary flex items-center gap-1.5 font-mono">
                FireChronicle
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-accent-cyan border border-border font-medium">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Harmonization of MODIS (1 km) &amp; VIIRS (375 m) Hotspots &bull; Burning Activity Calendar
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-text-secondary">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="text-text-muted">Mode:</span>
            <span className="font-semibold text-text-primary font-mono">{activeMode}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span className="text-text-secondary text-[11px]">
              {isBackendConnected ? "FastAPI + DuckDB Active" : "Backend Offline"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border">
            <Satellite className="w-3.5 h-3.5 text-fire-mid" />
            <span className="text-text-muted">Data Engine:</span>
            <span
              className={`text-[11px] font-medium ${
                isFirmsConfigured ? "text-emerald-400" : "text-sky-300"
              }`}
            >
              {isFirmsConfigured ? "Live NASA FIRMS API" : "Authentic Sample Fixture"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto border-t border-border/40 pt-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-surface text-accent-cyan border-t-2 border-accent-cyan border-x border-border/60 shadow-sm"
                  : "text-text-secondary hover:text-white hover:bg-surface/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Honest Provenance Banner */}
      <div className="bg-surface-muted/80 border-t border-border px-4 py-1 text-[11px] text-text-muted flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan inline-block" />
            <span>
              <strong>Scientific Guardrail:</strong> Thermal hotspots quantify instantaneous radiative emission at satellite overpass &bull; Not burned area or predictive wildfire modeling.
            </span>
          </span>
          <span className="hidden md:inline font-mono text-[10px] text-text-secondary">
            MODIS MCD14DL (1 km) &bull; VIIRS VNP14IMGTDL (375 m)
          </span>
        </div>
      </div>
    </header>
  );
};
