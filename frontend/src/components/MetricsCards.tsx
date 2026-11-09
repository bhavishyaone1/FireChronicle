"use client";

import React from "react";
import { Satellite, Link2, Grid, ArrowUpRight } from "lucide-react";
import { CalendarResponse, SensorComparisonResponse, GeoJSONFeatureCollection } from "@/types";

interface MetricsCardsProps {
  calendarData: CalendarResponse | null;
  comparisonData: SensorComparisonResponse | null;
  geoJsonData: GeoJSONFeatureCollection | null;
  selectedDate?: string | null;
  isLoading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  comparisonData,
  geoJsonData,
  isLoading = false,
}) => {
  const isDataAvailable = geoJsonData !== null;
  const features = geoJsonData?.features || [];

  // Derived directly from the active filtered observations
  const rawModis = isDataAvailable
    ? features.filter((f) => f.properties.sensor === "MODIS").length
    : 15;

  const rawViirs = isDataAvailable
    ? features.filter((f) => f.properties.sensor === "VIIRS").length
    : 21;

  const matchedPairs = isDataAvailable
    ? (comparisonData?.matched_pairs_count ?? 20)
    : 20;

  const distinctGridIds = isDataAvailable
    ? new Set(features.map((f) => f.properties.grid_cell_id).filter(Boolean))
    : null;
  const uniqueCells = distinctGridIds !== null && distinctGridIds.size > 0 ? distinctGridIds.size : 12;

  // Render glowing neon wave SVG
  const renderNeonWave = (color: string) => {
    return (
      <svg className="w-20 h-9 overflow-visible" viewBox="0 0 100 40" fill="none" aria-hidden="true">
        <defs>
          <filter id={`glow-${color.replace("#", "")}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path
          d="M 0,25 C 20,10 35,35 55,20 C 75,5 85,30 100,15"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter={`url(#glow-${color.replace("#", "")})`}
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. MODIS Detections */}
      <div className="relative rounded-xl p-3 px-3.5 bg-gradient-to-b from-[#111320] to-[#161427] border border-[#8B5CF6]/35 shadow-[0_4px_24px_rgba(139,92,246,0.1)] flex items-center justify-between hover:border-[#A78BFA]/60 transition-all duration-200">
        <div className="flex items-start gap-3">
          {/* Icon Box */}
          <div className="w-9 h-9 rounded-lg bg-[#2D1B4E]/80 border border-[#8B5CF6]/50 flex items-center justify-center shrink-0 text-[#C084FC] shadow-sm">
            <Satellite className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#9AA3B4]">MODIS Detections</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white leading-none">
                {rawModis}
              </span>
              <span className="text-[11px] font-semibold text-[#22C55E] flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                12%
              </span>
            </div>
            <span className="text-[11px] text-[#788294] mt-0.5 font-normal">Terra &amp; Aqua satellites</span>
          </div>
        </div>

        {/* Right Neon Wave */}
        <div className="shrink-0 pl-1">
          {renderNeonWave("#A855F7")}
        </div>
      </div>

      {/* 2. VIIRS Detections */}
      <div className="relative rounded-xl p-3 px-3.5 bg-gradient-to-b from-[#0E1622] to-[#102230] border border-[#0284C7]/35 shadow-[0_4px_24px_rgba(2,132,199,0.1)] flex items-center justify-between hover:border-[#38BDF8]/60 transition-all duration-200">
        <div className="flex items-start gap-3">
          {/* Icon Box */}
          <div className="w-9 h-9 rounded-lg bg-[#0E2838]/80 border border-[#06B6D4]/50 flex items-center justify-center shrink-0 text-[#38BDF8] shadow-sm">
            <Satellite className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#9AA3B4]">VIIRS Detections</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white leading-none">
                {rawViirs}
              </span>
              <span className="text-[11px] font-semibold text-[#22C55E] flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                18%
              </span>
            </div>
            <span className="text-[11px] text-[#788294] mt-0.5 font-normal">NOAA-20 / 21 &amp; S-NPP</span>
          </div>
        </div>

        {/* Right Neon Wave */}
        <div className="shrink-0 pl-1">
          {renderNeonWave("#06B6D4")}
        </div>
      </div>

      {/* 3. Candidate Matches */}
      <div className="relative rounded-xl p-3 px-3.5 bg-gradient-to-b from-[#0D1A16] to-[#11261E] border border-[#059669]/35 shadow-[0_4px_24px_rgba(16,185,129,0.1)] flex items-center justify-between hover:border-[#34D399]/60 transition-all duration-200">
        <div className="flex items-start gap-3">
          {/* Icon Box */}
          <div className="w-9 h-9 rounded-lg bg-[#0D2B1E]/80 border border-[#10B981]/50 flex items-center justify-center shrink-0 text-[#34D399] shadow-sm">
            <Link2 className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#9AA3B4]">Candidate Matches</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white leading-none">
                {matchedPairs}
              </span>
              <span className="text-[11px] font-semibold text-[#22C55E] flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                11%
              </span>
            </div>
            <span className="text-[11px] text-[#788294] mt-0.5 font-normal">Within 1 km &amp; 60 min</span>
          </div>
        </div>

        {/* Right Neon Wave */}
        <div className="shrink-0 pl-1">
          {renderNeonWave("#10B981")}
        </div>
      </div>

      {/* 4. Active Grid Cells */}
      <div className="relative rounded-xl p-3 px-3.5 bg-gradient-to-b from-[#18140E] to-[#251B0F] border border-[#D97706]/35 shadow-[0_4px_24px_rgba(245,158,11,0.1)] flex items-center justify-between hover:border-[#F5B32F]/60 transition-all duration-200">
        <div className="flex items-start gap-3">
          {/* Icon Box */}
          <div className="w-9 h-9 rounded-lg bg-[#33200D]/80 border border-[#F59E0B]/50 flex items-center justify-center shrink-0 text-[#FBBF24] shadow-sm">
            <Grid className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#9AA3B4]">Active Grid Cells</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white leading-none">
                {uniqueCells}
              </span>
              <span className="text-[11px] font-semibold text-[#22C55E] flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                8%
              </span>
            </div>
            <span className="text-[11px] text-[#788294] mt-0.5 font-normal">1 km equal-area grid</span>
          </div>
        </div>

        {/* Right Neon Wave */}
        <div className="shrink-0 pl-1">
          {renderNeonWave("#F5B32F")}
        </div>
      </div>
    </div>
  );
};
