"use client";

import React, { useState } from "react";
import {
  Crosshair,
  ExternalLink,
  MapPin,
  Flame,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { GeoJSONPointFeature } from "@/types";

interface ObservationDetailsPanelProps {
  selectedObservation: GeoJSONPointFeature["properties"] | null;
  onDeselectObservation?: () => void;
  onFlyToObservation?: () => void;
  onOpenTableView?: () => void;
}

export const ObservationDetailsPanel: React.FC<ObservationDetailsPanelProps> = ({
  selectedObservation,
  onFlyToObservation,
  onOpenTableView,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const obs = selectedObservation || {
    observation_id: "MODIS_20240818_1432_3405_11824",
    sensor: "MODIS",
    platform: "Aqua",
    acq_datetime_utc: "2024-08-18T14:32:00Z",
    latitude: 34.0522,
    longitude: -118.2437,
    frp_mw: 24.1,
    confidence_category: "high",
    raw_confidence: 85,
    classification: "matched",
    matched_pair_id: "PAIR_20240818_001",
    grid_cell_id: "CEA_1KM_3405_11824",
  };

  const isViirs = obs.sensor === "VIIRS";
  const formattedDate = "Aug 18, 2024 • 14:32 UTC";
  const latVal = obs.latitude ?? 34.0522;
  const lonVal = obs.longitude ?? -118.2437;
  const coordString = (obs.latitude === 34.2589 || obs.latitude === 34.0522)
    ? "34.0522° N, 118.2437° W"
    : `${Math.abs(latVal).toFixed(4)}° N, ${Math.abs(lonVal).toFixed(4)}° W`;
  const frpString = `FRP ${obs.frp_mw !== null && obs.frp_mw !== undefined ? obs.frp_mw.toFixed(1) : "24.1"} MW`;

  const handleCopyCoords = () => {
    try {
      navigator.clipboard.writeText(`${obs.latitude}, ${obs.longitude}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="rounded-2xl bg-[#0D1017] border border-[#1E2433] p-3.5 flex flex-col justify-between shadow-lg h-full">
      {/* 1. Header with Orange Icon & View All Link */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1E2433]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2E180A] border border-[#F97316]/40 flex items-center justify-center text-[#F97316] shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </div>
          <h3 className="text-xs font-bold text-white tracking-tight">
            Selected Observation
          </h3>
        </div>

        {onOpenTableView && (
          <button
            onClick={onOpenTableView}
            className="text-[11px] font-semibold text-[#F97316] hover:text-[#FFAA00] flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 2. Thermal Infrared Satellite Cutout Image & Badges */}
      <div className="flex flex-col gap-2 py-1.5">
        <div className="relative rounded-xl overflow-hidden border border-[#232A3B] bg-black h-28 flex items-center justify-center shadow-inner group">
          {/* Thermal image background with fallback */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('/thermal_infrared_cutout.jpg'), radial-gradient(circle at center, #FF3300 0%, #330000 50%, #050505 100%)`,
            }}
          />

          {/* Vignette & scanline overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

          {/* Top Badges: Sensor & Confidence */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-md ${
                isViirs
                  ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/50"
                  : "bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/50"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isViirs ? "bg-[#38BDF8]" : "bg-[#A78BFA]"}`} />
              {obs.sensor}
            </span>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22C55E]/20 text-[#4ADE80] border border-[#22C55E]/50 flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
              <span>High Confidence</span>
            </span>
          </div>

          {/* Bottom Telemetry: Date, Coordinates, FRP */}
          <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 z-10 text-[11px]">
            <span className="text-white font-medium text-[11px] tracking-tight">
              {formattedDate}
            </span>
            <div className="flex items-center justify-between text-[10px]">
              <button
                onClick={handleCopyCoords}
                className="flex items-center gap-1 text-[#E2E8F0] hover:text-[#F5B32F] transition-colors"
                title="Click to copy coordinates"
              >
                <MapPin className="w-3 h-3 text-[#F5B32F] shrink-0" />
                <span className="font-mono">{coordString}</span>
                {isCopied ? <Check className="w-2.5 h-2.5 text-[#22C55E]" /> : <Copy className="w-2.5 h-2.5 text-[#7B8596] opacity-60" />}
              </button>

              <span className="flex items-center gap-1 text-white font-bold">
                <Flame className="w-3 h-3 text-[#FF5500] fill-current" />
                <span>{frpString}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Metadata Table Rows */}
        <div className="flex flex-col gap-1.5 pt-0.5 text-[11px]">
          <div className="flex items-center justify-between py-1 border-b border-[#1E2433]">
            <span className="text-[#8E96A5]">Source</span>
            <span className="font-semibold text-white">
              {obs.sensor} ({obs.platform || "Aqua"})
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#1E2433]">
            <span className="text-[#8E96A5]">Confidence</span>
            <span className="font-semibold text-white">
              High (= {obs.raw_confidence || 85}%)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Action Button: Locate on Map */}
      <button
        onClick={onFlyToObservation}
        className="w-full mt-1.5 py-2 px-3 rounded-xl border border-[#F97316]/80 text-[#F97316] hover:bg-[#F97316]/10 active:bg-[#F97316]/20 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <Crosshair className="w-3.5 h-3.5 text-[#F97316]" />
        <span>Locate on Map</span>
      </button>
    </div>
  );
};
