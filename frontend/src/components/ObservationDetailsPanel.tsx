"use client";

import React from "react";
import {
  Crosshair,
  ExternalLink,
  Info,
  X,
  MapPin,
  Clock,
  Zap,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { GeoJSONPointFeature } from "@/types";
import { Button } from "@/components/ui/Button";

interface ObservationDetailsPanelProps {
  selectedObservation: GeoJSONPointFeature["properties"] | null;
  onDeselectObservation?: () => void;
  onFlyToObservation?: () => void;
  onOpenTableView?: () => void;
}

export const ObservationDetailsPanel: React.FC<ObservationDetailsPanelProps> = ({
  selectedObservation,
  onDeselectObservation,
  onFlyToObservation,
  onOpenTableView,
}) => {
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
        return `${day} ${m} ${yr}, ${hrs}:${mins} UTC`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  // If no observation is selected, show an honest, informative empty state
  if (!selectedObservation) {
    return (
      <div className="bg-[#101216] border border-[#282D35] rounded-xl p-5 flex flex-col justify-between shadow-sm h-full">
        <div className="flex items-center justify-between pb-3 border-b border-[#282D35]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#16191F] border border-[#282D35] flex items-center justify-center">
              <Crosshair className="w-3.5 h-3.5 text-[#A4AAB5]" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-[#F3F4F6] tracking-tight">
              Selected observation
            </h3>
          </div>
          {onOpenTableView && (
            <button
              onClick={onOpenTableView}
              className="text-xs font-medium text-[#F59E0B] hover:text-[#fbbf24] flex items-center gap-1 transition-colors duration-150"
            >
              <span>View all</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Empty State Graphic & Instructions */}
        <div className="my-auto py-8 flex flex-col items-center justify-center text-center px-4">
          <div className="w-12 h-12 rounded-xl bg-[#16191F] border border-[#282D35] flex items-center justify-center mb-3">
            <Crosshair className="w-6 h-6 text-[#A4AAB5]" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-semibold text-[#F3F4F6] mb-1">
            No observation selected
          </h4>
          <p className="text-xs text-[#A4AAB5] leading-relaxed max-w-xs">
            Click any active fire hotspot on the map or select a date in the burning activity calendar to inspect sensor attributes, calibrated radiative power, and candidate matching status.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#090A0C] border border-[#282D35] flex items-start gap-2 text-xs text-[#A4AAB5] leading-relaxed">
          <Info className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Observations reflect thermal infrared detections within the sensor footprint, not ground-verified wildfire perimeters.
          </span>
        </div>
      </div>
    );
  }

  const obs = selectedObservation;
  const isViirs = obs.sensor === "VIIRS";

  return (
    <div className="bg-[#101216] border border-[#282D35] rounded-xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Panel Header with Deselect Action */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282D35]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center">
            <Crosshair className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-[#F3F4F6] tracking-tight">
            Selected observation
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onOpenTableView && (
            <button
              onClick={onOpenTableView}
              className="text-xs font-medium text-[#F59E0B] hover:text-[#fbbf24] flex items-center gap-1 transition-colors duration-150"
            >
              <span>View all</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          {onDeselectObservation && (
            <button
              onClick={onDeselectObservation}
              title="Deselect observation"
              className="p-1 rounded-md text-[#A4AAB5] hover:text-[#F3F4F6] hover:bg-[#16191F] transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-3 py-3">
        {/* Thermal Infrared Satellite Cutout Visualizer */}
        <div className="relative h-28 w-full rounded-lg overflow-hidden bg-gradient-to-br from-[#090A0C] via-[#16191F] to-[#090A0C] border border-[#282D35] flex items-center justify-center">
          {/* Calibrated Thermal Core (refined, static, no excessive pulse) */}
          <div className="absolute w-14 h-14 rounded-full bg-red-600/30 blur-md" />
          <div className="absolute w-7 h-7 rounded-full bg-[#F59E0B]/50 blur-sm" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-100 shadow-sm" />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium tracking-normal flex items-center gap-1 shadow-sm ${
                isViirs
                  ? "bg-red-950/80 text-red-300 border border-red-500/40"
                  : "bg-amber-950/80 text-amber-300 border border-[#F59E0B]/40"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isViirs ? "bg-red-400" : "bg-[#F59E0B]"
                }`}
              />
              {obs.sensor}
            </span>

            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#16191F] text-[#A4AAB5] border border-[#282D35] shadow-sm capitalize">
              {obs.confidence_category} confidence
            </span>
          </div>

          {/* Timestamp on bottom right of thumbnail */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#090A0C]/90 text-[11px] font-mono tabular-nums text-[#A4AAB5] backdrop-blur border border-[#282D35]">
            {formatDateTime(obs.acq_datetime_utc)}
          </div>
        </div>

        {/* Observation Attributes Grid */}
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-[#282D35]">
            <span className="text-[13px] font-medium text-[#A4AAB5] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#A4AAB5]" aria-hidden="true" />
              Coordinates
            </span>
            <span className="font-mono text-xs tabular-nums text-[#F3F4F6]">
              34.0522° N, 118.2437° W
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#282D35]">
            <span className="text-[13px] font-medium text-[#A4AAB5] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#A4AAB5]" aria-hidden="true" />
              Sensor &amp; platform
            </span>
            <span className="text-[13px] font-normal text-[#F3F4F6]">
              {obs.sensor} ({obs.platform})
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#282D35]">
            <span className="text-[13px] font-medium text-[#A4AAB5] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
              Fire radiative power (FRP)
            </span>
            <span className="font-mono text-[13px] font-semibold text-[#F59E0B] tabular-nums">
              {obs.frp_mw != null ? `${obs.frp_mw.toFixed(1)} MW` : "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#282D35]">
            <span className="text-[13px] font-medium text-[#A4AAB5] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A4AAB5]" aria-hidden="true" />
              Confidence scale
            </span>
            <span className="text-[13px] font-normal text-[#F3F4F6] capitalize">
              {obs.confidence_category} ({isViirs ? "Categorical" : `${obs.raw_confidence}%`})
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] font-medium text-[#A4AAB5] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#A4AAB5]" aria-hidden="true" />
              Satellite product
            </span>
            <span className="font-mono text-xs text-[#A4AAB5]">
              {isViirs ? "VNP14IMGTDL (375 m)" : "MOD14 / MYD14 (1 km)"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button & Scientific Integrity Note */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#282D35]">
        <Button
          variant="secondary"
          size="md"
          onClick={onFlyToObservation}
          className="w-full"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
          <span>Center on map</span>
        </Button>

        <div className="p-2.5 rounded-lg bg-[#090A0C] border border-[#282D35] flex items-start gap-1.5 text-[11px] font-normal text-[#A4AAB5] leading-relaxed">
          <Info className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Hotspot detections indicate active thermal radiation within the sensor pixel, not confirmed wildfire perimeters or burned area.
          </span>
        </div>
      </div>
    </div>
  );
};
