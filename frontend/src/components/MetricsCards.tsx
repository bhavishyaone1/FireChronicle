"use client";

import React from "react";
import { Satellite, Link2, Grid, Check, Filter, Database } from "lucide-react";
import { CalendarResponse, SensorComparisonResponse, GeoJSONFeatureCollection, DatasetProvenance } from "@/types";

interface MetricsCardsProps {
  calendarData: CalendarResponse | null;
  comparisonData: SensorComparisonResponse | null;
  geoJsonData: GeoJSONFeatureCollection | null;
  selectedDate?: string | null;
  isLoading?: boolean;
  sensorFilter?: string;
  onSelectSensor?: (sensor: string) => void;
  classificationFilter?: string;
  onSelectClassification?: (classification: string) => void;
  onSelectGridMode?: () => void;
  isGridModeActive?: boolean;
  provenance?: DatasetProvenance | null;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  comparisonData,
  geoJsonData,
  isLoading = false,
  sensorFilter = "ALL",
  onSelectSensor,
  classificationFilter = "ALL",
  onSelectClassification,
  onSelectGridMode,
  isGridModeActive = false,
  provenance,
}) => {
  const isDataAvailable = geoJsonData !== null;
  const features = geoJsonData?.features || [];

  // Derived directly from the active filtered observations — zero phantom fallbacks
  const rawModis = isDataAvailable
    ? features.filter((f) => f.properties.sensor === "MODIS").length
    : 0;

  const rawViirs = isDataAvailable
    ? features.filter((f) => f.properties.sensor === "VIIRS").length
    : 0;

  const matchedPairs = isDataAvailable
    ? (comparisonData?.matched_pairs_count ?? 0)
    : 0;

  const distinctGridIds = isDataAvailable
    ? new Set(features.map((f) => f.properties.grid_cell_id).filter(Boolean))
    : null;
  const uniqueCells = distinctGridIds !== null ? distinctGridIds.size : 0;

  // Source chip label based on active provenance
  const sourceLabel = provenance?.label || "NASA FIRMS Telemetry";

  // Render glowing neon wave SVG with area gradient fill
  const renderNeonWave = (color: string, gradId: string) => {
    return (
      <svg className="w-24 h-10 overflow-visible" viewBox="0 0 100 40" fill="none" aria-hidden="true">
        <defs>
          <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id={`area-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path
          d="M 0,28 C 15,12 30,35 50,18 C 70,5 85,28 100,12 L 100,40 L 0,40 Z"
          fill={`url(#area-${gradId})`}
        />
        <path
          d="M 0,28 C 15,12 30,35 50,18 C 70,5 85,28 100,12"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter={`url(#glow-${gradId})`}
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-[#10141F] border border-[#1E2433] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const isModisActive = sensorFilter === "MODIS";
  const isViirsActive = sensorFilter === "VIIRS";
  const isMatchedActive = classificationFilter === "matched";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. MODIS Detections Card (Interactive) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectSensor && onSelectSensor("MODIS")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectSensor && onSelectSensor("MODIS");
          }
        }}
        title="Click to filter map to MODIS observations (1 km nadir)"
        className={`relative rounded-xl p-3 px-3.5 bg-gradient-to-b from-[#111320] to-[#161427] border transition-all duration-200 cursor-pointer select-none group flex items-center justify-between ${
          isModisActive
            ? "border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-[#A855F7]"
            : "border-[#8B5CF6]/35 shadow-[0_4px_24px_rgba(139,92,246,0.1)] hover:border-[#A78BFA]/70 hover:scale-[1.01]"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icon Box */}
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors shadow-sm ${
              isModisActive
                ? "bg-[#A855F7] border-[#C084FC] text-black font-bold"
                : "bg-[#2D1B4E]/80 border-[#8B5CF6]/50 text-[#C084FC] group-hover:border-[#A855F7]"
            }`}
          >
            <Satellite className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#9AA3B4]">MODIS Detections</span>
              {isModisActive && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#A855F7]/20 text-[#D8B4FE] border border-[#A855F7]/40 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Active
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white leading-none">
                {rawModis.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#A855F7]/15 text-[#C084FC] border border-[#A855F7]/30">
                1.0 km nadir
              </span>
            </div>
            <span className="text-[11px] text-[#788294] mt-0.5 font-normal">Terra &amp; Aqua • MODIS C6.1</span>
          </div>
        </div>

        {/* Right Neon Wave */}
        <div className="shrink-0 pl-1">
          {renderNeonWave("#A855F7", "modis")}
        </div>
      </div>

      {/* 2. VIIRS Detections Card (Interactive) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectSensor && onSelectSensor("VIIRS")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectSensor && onSelectSensor("VIIRS");
          }
        }}
        title="Click to filter map to VIIRS observations (375 m nadir)"
        className={`relative rounded-xl p-3 px-3.5 bg-gradient-to-b from-[#0E1622] to-[#102230] border transition-all duration-200 cursor-pointer select-none group flex items-center justify-between ${
          isViirsActive
            ? "border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.35)] ring-1 ring-[#38BDF8]"
            : "border-[#0284C7]/35 shadow-[0_4px_24px_rgba(2,132,199,0.1)] hover:border-[#38BDF8]/70 hover:scale-[1.01]"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icon Box */}
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors shadow-sm ${
              isViirsActive
                ? "bg-[#38BDF8] border-[#7DD3FC] text-black font-bold"
                : "bg-[#0E2838]/80 border-[#06B6D4]/50 text-[#38BDF8] group-hover:border-[#38BDF8]"
            }`}
          >
            <Satellite className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#9AA3B4]">VIIRS Detections</span>
              {isViirsActive && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#38BDF8]/20 text-[#7DD3FC] border border-[#38BDF8]/40 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Active
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white leading-none">
                {rawViirs.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#7DD3FC] border border-[#38BDF8]/30">
                375 m nadir
              </span>
            </div>
            <span className="text-[11px] text-[#788294] mt-0.5 font-normal">NOAA-20 / 21 &amp; S-NPP • C2</span>
          </div>
        </div>

        {/* Right Neon Wave */}
        <div className="shrink-0 pl-1">
          {renderNeonWave("#06B6D4", "viirs")}
        </div>
      </div>

      {/* 3. Candidate Matches Card (Interactive) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectClassification && onSelectClassification("matched")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectClassification && onSelectClassification("matched");
          }
        }}
        title="Click to view candidate cross-sensor matches (within 1 km & 60 min)"
        className={`relative rounded-xl p-3 px-3.5 bg-gradient-to-b from-[#0D1A16] to-[#11261E] border transition-all duration-200 cursor-pointer select-none group flex items-center justify-between ${
          isMatchedActive
            ? "border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-[#10B981]"
            : "border-[#059669]/35 shadow-[0_4px_24px_rgba(16,185,129,0.1)] hover:border-[#34D399]/70 hover:scale-[1.01]"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icon Box */}
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors shadow-sm ${
              isMatchedActive
                ? "bg-[#10B981] border-[#6EE7B7] text-black font-bold"
                : "bg-[#0D2B1E]/80 border-[#10B981]/50 text-[#34D399] group-hover:border-[#10B981]"
            }`}
          >
            <Link2 className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#9AA3B4]">Candidate Matches</span>
              {isMatchedActive && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#10B981]/20 text-[#6EE7B7] border border-[#10B981]/40 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Active
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white leading-none">
                {matchedPairs.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#6EE7B7] border border-[#10B981]/30">
                1 km / 60 min
              </span>
            </div>
            <span className="text-[11px] text-[#788294] mt-0.5 font-normal">Spatio-temporal correspondence</span>
          </div>
        </div>

        {/* Right Neon Wave */}
        <div className="shrink-0 pl-1">
          {renderNeonWave("#10B981", "matches")}
        </div>
      </div>

      {/* 4. Active Grid Cells Card (Interactive) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectGridMode && onSelectGridMode()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectGridMode && onSelectGridMode();
          }
        }}
        title="Click to view 1.0 km Equal-Area Grid occupancy on map"
        className={`relative rounded-xl p-3 px-3.5 bg-gradient-to-b from-[#18140E] to-[#251B0F] border transition-all duration-200 cursor-pointer select-none group flex items-center justify-between ${
          isGridModeActive
            ? "border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-[#F59E0B]"
            : "border-[#D97706]/35 shadow-[0_4px_24px_rgba(245,158,11,0.1)] hover:border-[#F5B32F]/70 hover:scale-[1.01]"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icon Box */}
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors shadow-sm ${
              isGridModeActive
                ? "bg-[#F59E0B] border-[#FDE68A] text-black font-bold"
                : "bg-[#33200D]/80 border-[#F59E0B]/50 text-[#FBBF24] group-hover:border-[#F59E0B]"
            }`}
          >
            <Grid className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#9AA3B4]">Active Grid Cells</span>
              {isGridModeActive && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#F59E0B]/20 text-[#FDE68A] border border-[#F59E0B]/40 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> 1 km Grid
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white leading-none">
                {uniqueCells.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#FDE68A] border border-[#F59E0B]/30">
                Lambert CEA
              </span>
            </div>
            <span className="text-[11px] text-[#788294] mt-0.5 font-normal">Resolution-invariant cell aggregation</span>
          </div>
        </div>

        {/* Right Neon Wave */}
        <div className="shrink-0 pl-1">
          {renderNeonWave("#F5B32F", "grid")}
        </div>
      </div>
    </div>
  );
};
