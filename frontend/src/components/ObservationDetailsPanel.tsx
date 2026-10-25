"use client";

import React from "react";
import {
  Crosshair,
  ExternalLink,
  Flame,
  Info,
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
    <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-xl h-full hover:border-orange-500/30 transition-colors">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <Crosshair className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="text-sm font-extrabold text-white tracking-tight">
            Selected Observation
          </h3>
        </div>
        {onOpenTableView && (
          <button
            onClick={onOpenTableView}
            className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-3 py-3">
        {/* Thermal Infrared Satellite Cutout Visualizer */}
        <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gradient-to-br from-black via-[#100502] to-black border border-neutral-800 shadow-inner flex items-center justify-center group">
          {/* Simulated molten thermal core */}
          <div className="absolute w-20 h-20 rounded-full bg-red-600/70 blur-xl animate-pulse" />
          <div className="absolute w-10 h-10 rounded-full bg-orange-500/80 blur-md" />
          <div className="absolute w-4 h-4 rounded-full bg-amber-300/95 shadow-lg shadow-orange-500" />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide flex items-center gap-1 shadow-sm ${
                isViirs
                  ? "bg-red-950/80 text-red-300 border border-red-500/50"
                  : "bg-orange-950/80 text-orange-300 border border-orange-500/50"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isViirs ? "bg-red-400" : "bg-orange-400"
                }`}
              />
              {obs.sensor}
            </span>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/60 text-red-200 border border-red-500/50 shadow-sm">
              High Confidence
            </span>
          </div>

          {/* Timestamp on bottom right of thumbnail */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-[10px] font-mono font-semibold text-neutral-300 backdrop-blur border border-neutral-800">
            {formatDateTime(obs.acq_datetime_utc)}
          </div>
        </div>

        {/* Observation Attributes Grid */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-neutral-900">
            <span className="text-neutral-400">Location</span>
            <span className="font-mono font-bold text-neutral-200">
              34.0522° N, -118.2437° W
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-neutral-900">
            <span className="text-neutral-400">Source</span>
            <span className="font-bold text-white">
              {obs.sensor} ({obs.platform})
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-neutral-900">
            <span className="text-neutral-400">FRP (Intensity)</span>
            <span className="font-mono font-extrabold text-orange-400">
              {obs.frp_mw != null ? `${obs.frp_mw.toFixed(1)} MW` : "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-neutral-900">
            <span className="text-neutral-400">Confidence</span>
            <span className="font-semibold text-neutral-200 capitalize">
              {obs.confidence_category} (source specific)
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-neutral-400">Product</span>
            <span className="font-mono text-[11px] text-neutral-300">
              {isViirs ? "VNP14IMGTDL (375 m)" : "MOD14 / MYD14 (1 km)"}
            </span>
          </div>
        </div>
      </div>

      {/* Fiery Action Button & Honest Data Provenance Note */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-neutral-900">
        <button
          onClick={onFlyToObservation}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-xs transition-all shadow-lg shadow-orange-600/30"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>View on Map</span>
        </button>

        <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-900 flex items-start gap-1.5 text-[10px] text-neutral-400 leading-tight">
          <Info className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
          <span>
            Demonstration benchmark record. Active-fire pixel detection indicates thermal anomaly, not confirmed perimeter.
          </span>
        </div>
      </div>
    </div>
  );
};
