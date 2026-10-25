"use client";

import React from "react";
import {
  Crosshair,
  ExternalLink,
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
        return `${day} ${m} ${yr} ${hrs}:${mins} UTC`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  const isViirs = obs.sensor === "VIIRS";

  return (
    <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center">
            <Crosshair className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Observation details
          </h3>
        </div>
        {onOpenTableView && (
          <button
            onClick={onOpenTableView}
            className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-3 py-3">
        {/* Thermal Infrared Satellite Cutout Visualizer */}
        <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gradient-to-br from-black via-[#0D0402] to-black border border-neutral-800/80 shadow-inner flex items-center justify-center group">
          {/* Simulated molten thermal core */}
          <div className="absolute w-16 h-16 rounded-full bg-red-600/50 blur-lg animate-pulse" />
          <div className="absolute w-8 h-8 rounded-full bg-orange-500/70 blur-sm" />
          <div className="absolute w-3 h-3 rounded-full bg-amber-200/90 shadow-sm shadow-orange-500" />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium tracking-normal flex items-center gap-1 shadow-sm ${
                isViirs
                  ? "bg-red-950/70 text-red-300 border border-red-500/40"
                  : "bg-orange-950/70 text-orange-300 border border-orange-500/40"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isViirs ? "bg-red-400" : "bg-orange-400"
                }`}
              />
              {obs.sensor}
            </span>

            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-700 shadow-sm">
              High confidence
            </span>
          </div>

          {/* Timestamp on bottom right of thumbnail */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[11px] font-mono tabular-nums text-neutral-300 backdrop-blur border border-neutral-800">
            {formatDateTime(obs.acq_datetime_utc)}
          </div>
        </div>

        {/* Observation Attributes Grid */}
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-900">
            <span className="text-[13px] font-medium text-neutral-400">Location</span>
            <span className="font-mono text-xs tabular-nums text-neutral-200">
              34.0522° N, 118.2437° W
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-neutral-900">
            <span className="text-[13px] font-medium text-neutral-400">Platform</span>
            <span className="text-[13px] font-normal text-white">
              {obs.sensor} ({obs.platform})
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-neutral-900">
            <span className="text-[13px] font-medium text-neutral-400">FRP (Radiative power)</span>
            <span className="font-mono text-[13px] font-semibold text-orange-400 tabular-nums">
              {obs.frp_mw != null ? `${obs.frp_mw.toFixed(1)} MW` : "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-neutral-900">
            <span className="text-[13px] font-medium text-neutral-400">Confidence category</span>
            <span className="text-[13px] font-normal text-neutral-300 capitalize">
              {obs.confidence_category} (source specific)
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] font-medium text-neutral-400">Product schema</span>
            <span className="font-mono text-xs text-neutral-400">
              {isViirs ? "VNP14IMGTDL (375 m)" : "MOD14 / MYD14 (1 km)"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button & Honest Data Provenance Note */}
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-900">
        <button
          onClick={onFlyToObservation}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-orange-400 hover:text-orange-300 border border-neutral-800 font-medium text-xs transition-all shadow-sm"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Center on map</span>
        </button>

        <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-900 flex items-start gap-1.5 text-[11px] font-normal text-neutral-400 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
          <span>
            Active fire detection indicates thermal anomaly within pixel footprint, not a delineated wildfire perimeter.
          </span>
        </div>
      </div>
    </div>
  );
};
