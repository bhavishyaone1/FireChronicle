"use client";

import React from "react";
import {
  Crosshair,
  ExternalLink,
  Flame,
  Info,
  Layers,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { GeoJSONPointFeature } from "@/types";

interface ObservationDetailsPanelProps {
  selectedObservation: GeoJSONPointFeature["properties"] | null;
  onFlyToObservation?: () => void;
  onOpenTableView?: () => void;
}

export const ObservationDetailsPanel: React.FC<ObservationDetailsPanelProps> = ({
  selectedObservation,
  onFlyToObservation,
  onOpenTableView,
}) => {
  // If no observation is actively selected, show a representative default or prompt
  const obs = selectedObservation || {
    observation_id: "viirs_sample_20240812_01",
    sensor: "VIIRS" as const,
    platform: "NOAA-21" as const,
    acq_datetime_utc: "2024-08-12T19:42:00Z",
    confidence_category: "high" as const,
    raw_confidence: "nominal",
    frp_mw: 8.4,
    daynight: "D" as const,
    classification: "matched" as const,
  };

  // Format UTC timestamp: "2024-08-12T19:42:00Z" -> "Aug 12, 2024 19:42"
  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = months[d.getUTCMonth()];
        const day = String(d.getUTCDate()).padStart(2, "0");
        const yr = d.getUTCFullYear();
        const hrs = String(d.getUTCHours()).padStart(2, "0");
        const mins = String(d.getUTCMinutes()).padStart(2, "0");
        return `${m} ${day}, ${yr} ${hrs}:${mins}`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  const isViirs = obs.sensor === "VIIRS";

  return (
    <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-xl h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Selected Observation
          </h3>
        </div>
        {onOpenTableView && (
          <button
            onClick={onOpenTableView}
            className="text-[11px] font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-3 py-3">
        {/* Thermal Infrared Satellite Cutout Visualizer */}
        <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-950 via-stone-900 to-black border border-slate-700/60 shadow-inner flex items-center justify-center group">
          {/* Simulated thermal heat glow core */}
          <div className="absolute w-16 h-16 rounded-full bg-orange-600/60 blur-xl animate-pulse" />
          <div className="absolute w-8 h-8 rounded-full bg-amber-400/80 blur-md" />
          <div className="absolute w-3 h-3 rounded-full bg-white/95 shadow-lg shadow-amber-300" />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 shadow-sm ${
                isViirs
                  ? "bg-sky-500/30 text-sky-300 border border-sky-400/40"
                  : "bg-purple-500/30 text-purple-300 border border-purple-400/40"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isViirs ? "bg-sky-400" : "bg-purple-400"
                }`}
              />
              {obs.sensor}
            </span>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/70 text-red-300 border border-red-500/40 shadow-sm">
              High Confidence
            </span>
          </div>

          {/* Timestamp on bottom right of thumbnail */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-mono text-slate-300 backdrop-blur">
            {formatDateTime(obs.acq_datetime_utc)}
          </div>
        </div>

        {/* Observation Attributes Grid */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Location</span>
            <span className="font-mono font-medium text-slate-200">
              34.0522° N, -118.2437° W
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Source</span>
            <span className="font-medium text-slate-200">
              {obs.sensor} ({obs.platform})
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">FRP (Intensity)</span>
            <span className="font-mono font-bold text-amber-400">
              {obs.frp_mw != null ? `${obs.frp_mw.toFixed(1)} MW` : "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Confidence</span>
            <span className="font-medium text-slate-200 capitalize">
              {obs.confidence_category} (source specific)
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Product</span>
            <span className="font-mono text-[11px] text-slate-300">
              {isViirs ? "VNP14IMGTDL (375 m)" : "MOD14 / MYD14 (1 km)"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button & Honest Data Provenance Note */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
        <button
          onClick={onFlyToObservation}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#1E293B] hover:bg-[#283850] text-sky-400 hover:text-sky-300 border border-sky-500/20 text-xs font-semibold transition-all shadow-sm"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>View on Map</span>
        </button>

        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-1.5 text-[10px] text-slate-400 leading-tight">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Demonstration benchmark record. Active-fire pixel detection indicates thermal anomaly, not confirmed perimeter.
          </span>
        </div>
      </div>
    </div>
  );
};
