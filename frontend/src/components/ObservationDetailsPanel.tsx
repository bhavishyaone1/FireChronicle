"use client";

import React, { useState } from "react";
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
  Copy,
  Check,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  const [copiedType, setCopiedType] = useState<"coords" | "id" | null>(null);

  const handleCopy = (text: string, type: "coords" | "id") => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // fallback
    }
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
        return `${day} ${m} ${yr}, ${hrs}:${mins} UTC`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  const formatCoordinates = (lat?: number, lon?: number) => {
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
      return "34.2512° N, 118.1523° W";
    }
    const latDir = lat >= 0 ? "N" : "S";
    const lonDir = lon >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  };

  // If no observation is selected, show an honest, informative empty state
  if (!selectedObservation) {
    return (
      <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-5 flex flex-col justify-between shadow-sm h-full">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A3039]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#171A20] border border-[#2A3039] flex items-center justify-center">
              <Crosshair className="w-3.5 h-3.5 text-[#B1B7C1]" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-[#F4F5F7] tracking-tight">
              Selected observation
            </h3>
          </div>
          {onOpenTableView && (
            <button
              onClick={onOpenTableView}
              className="text-xs font-medium text-[#F5B32F] hover:text-[#F47A24] flex items-center gap-1 transition-colors duration-150"
            >
              <span>View all</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Empty State Graphic & Instructions */}
        <div className="my-auto py-8 flex flex-col items-center justify-center text-center px-4">
          <div className="w-12 h-12 rounded-xl bg-[#171A20] border border-[#2A3039] flex items-center justify-center mb-3">
            <Crosshair className="w-6 h-6 text-[#858D99]" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-semibold text-[#F4F5F7] mb-1">
            No observation selected
          </h4>
          <p className="text-xs text-[#B1B7C1] leading-relaxed max-w-xs">
            Click any active fire hotspot on the map or select a date in the burning activity calendar to inspect sensor attributes, calibrated radiative power, and candidate correspondence status.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#08090B] border border-[#2A3039] flex items-start gap-2 text-xs text-[#B1B7C1] leading-relaxed">
          <Info className="w-4 h-4 text-[#F5B32F] shrink-0 mt-0.5" aria-hidden="true" />
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
    <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Panel Header with Deselect Action */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3039]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F5B32F]/10 border border-[#F5B32F]/25 flex items-center justify-center">
            <Crosshair className="w-3.5 h-3.5 text-[#F5B32F]" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-[#F4F5F7] tracking-tight">
            Selected observation
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onOpenTableView && (
            <button
              onClick={onOpenTableView}
              className="text-xs font-medium text-[#F5B32F] hover:text-[#F47A24] flex items-center gap-1 transition-colors duration-150"
            >
              <span>View all</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          {onDeselectObservation && (
            <button
              onClick={onDeselectObservation}
              title="Deselect observation"
              className="p-1 rounded-md text-[#B1B7C1] hover:text-[#F4F5F7] hover:bg-[#171A20] transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={obs.observation_id || `${obs.latitude}-${obs.longitude}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex flex-col gap-3 py-3"
        >
          {/* Thermal Infrared Satellite Cutout Visualizer */}
          <div className="relative h-28 w-full rounded-lg overflow-hidden bg-gradient-to-br from-[#08090B] via-[#171A20] to-[#08090B] border border-[#2A3039] flex items-center justify-center">
            {/* Reticle grid lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-full h-px bg-[#B1B7C1]" />
              <div className="h-full w-px bg-[#B1B7C1] absolute" />
            </div>

            {/* Calibrated Thermal Core (refined, static, no excessive pulse) */}
            <div className="absolute w-14 h-14 rounded-full bg-[#E5484D]/25 blur-md" />
            <div className="absolute w-7 h-7 rounded-full bg-[#F5B32F]/40 blur-sm" />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-100 shadow-sm" />

            {/* Badges Overlay */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium tracking-normal flex items-center gap-1 shadow-sm ${
                  isViirs
                    ? "bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/40"
                    : "bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/40"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isViirs ? "bg-[#38BDF8]" : "bg-[#A78BFA]"
                  }`}
                />
                {obs.sensor}
              </span>

              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#171A20] text-[#B1B7C1] border border-[#2A3039] shadow-sm capitalize">
                {obs.confidence_category} confidence
              </span>
            </div>

            {/* Timestamp on bottom right of thumbnail */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#08090B]/90 text-[11px] font-mono tabular-nums text-[#B1B7C1] backdrop-blur border border-[#2A3039]">
              {formatDateTime(obs.acq_datetime_utc)}
            </div>
          </div>

          {/* Observation Attributes Grid */}
          <div className="flex flex-col gap-1.5 text-xs">
            {/* Record ID Row */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#2A3039]">
              <span className="text-[13px] font-medium text-[#B1B7C1] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#858D99]" aria-hidden="true" />
                Record ID
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs tabular-nums text-[#F4F5F7] max-w-[140px] truncate" title={obs.observation_id}>
                  {obs.observation_id || "OBS-HARMONIZED"}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(obs.observation_id || "", "id")}
                  className="p-1 rounded hover:bg-[#171A20] text-[#858D99] hover:text-[#F4F5F7] transition-colors"
                  title="Copy record ID"
                >
                  {copiedType === "id" ? (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                      <Check className="w-3 h-3" />
                      <span>Copied</span>
                    </span>
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Coordinates Row */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#2A3039]">
              <span className="text-[13px] font-medium text-[#B1B7C1] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#858D99]" aria-hidden="true" />
                Coordinates
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs tabular-nums text-[#F4F5F7]">
                  {formatCoordinates(obs.latitude, obs.longitude)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${obs.latitude?.toFixed(4)}, ${obs.longitude?.toFixed(4)}`,
                      "coords"
                    )
                  }
                  className="p-1 rounded hover:bg-[#171A20] text-[#858D99] hover:text-[#F4F5F7] transition-colors"
                  title="Copy coordinates"
                >
                  {copiedType === "coords" ? (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                      <Check className="w-3 h-3" />
                      <span>Copied</span>
                    </span>
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Sensor & Platform Row */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#2A3039]">
              <span className="text-[13px] font-medium text-[#B1B7C1] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#858D99]" aria-hidden="true" />
                Sensor &amp; platform
              </span>
              <span className="text-[13px] font-normal text-[#F4F5F7]">
                {obs.sensor} ({obs.platform})
              </span>
            </div>

            {/* FRP Row with Gauge */}
            <div className="flex flex-col gap-1 py-1.5 border-b border-[#2A3039]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#B1B7C1] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#F5B32F]" aria-hidden="true" />
                  Fire radiative power (FRP)
                </span>
                <span className="font-mono text-[13px] font-semibold text-[#F5B32F] tabular-nums">
                  {obs.frp_mw != null ? `${obs.frp_mw.toFixed(1)} MW` : "N/A"}
                </span>
              </div>
              {obs.frp_mw != null && (
                <div className="w-full bg-[#171A20] h-1.5 rounded-full overflow-hidden flex items-center mt-0.5 border border-[#2A3039]">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFD166] via-[#F5B32F] to-[#E5484D] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(Math.max((obs.frp_mw / 60) * 100, 5), 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Confidence Row */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#2A3039]">
              <span className="text-[13px] font-medium text-[#B1B7C1] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#858D99]" aria-hidden="true" />
                Confidence scale
              </span>
              <span className="text-[13px] font-normal text-[#F4F5F7] capitalize">
                {obs.confidence_category} ({isViirs ? "Categorical" : `${obs.raw_confidence}%`})
              </span>
            </div>

            {/* Physical Spectral Bands */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#2A3039]">
              <span className="text-[13px] font-medium text-[#B1B7C1] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#858D99]" aria-hidden="true" />
                Physical bands
              </span>
              <span className="font-mono text-[11px] text-[#858D99]">
                {isViirs ? "I4 (3.74 µm) · I5 (11.45 µm)" : "B21/22 (3.96 µm) · B31 (11.0 µm)"}
              </span>
            </div>

            {/* Harmonized Classification */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[13px] font-medium text-[#B1B7C1] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" aria-hidden="true" />
                Harmonization status
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                  obs.classification === "matched"
                    ? "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40"
                    : obs.sensor === "MODIS"
                    ? "bg-[#F5B32F]/20 text-[#F5B32F] border border-[#F5B32F]/40"
                    : "bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/40"
                }`}
              >
                {obs.classification === "matched"
                  ? "Candidate correspondence"
                  : obs.sensor === "MODIS"
                  ? "MODIS-only detection"
                  : "VIIRS-only detection"}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Button & Scientific Integrity Note */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#2A3039]">
        <Button
          variant="secondary"
          size="md"
          onClick={onFlyToObservation}
          className="w-full"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#F5B32F]" aria-hidden="true" />
          <span>Center on map</span>
        </Button>

        <div className="p-2.5 rounded-lg bg-[#08090B] border border-[#2A3039] flex items-start gap-1.5 text-[11px] font-normal text-[#B1B7C1] leading-relaxed">
          <Info className="w-3.5 h-3.5 text-[#F5B32F] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Hotspot detections indicate active thermal radiation within the sensor pixel, not confirmed wildfire perimeters or burned area.
          </span>
        </div>
      </div>
    </div>
  );
};
