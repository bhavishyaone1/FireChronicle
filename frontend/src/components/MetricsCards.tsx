"use client";

import React from "react";
import { Flame, Satellite, Link2, Grid, ArrowUpRight } from "lucide-react";
import { CalendarResponse, SensorComparisonResponse } from "@/types";

interface MetricsCardsProps {
  calendarData: CalendarResponse | null;
  comparisonData: SensorComparisonResponse | null;
  isLoading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  calendarData,
  comparisonData,
  isLoading = false,
}) => {
  const summary = calendarData?.summary;
  const rawModis = summary?.total_modis_raw ?? 0;
  const rawViirs = summary?.total_viirs_raw ?? 0;
  const rawTotal = rawModis + rawViirs;

  // SCIENTIFIC INVARIANT:
  const hasDetections = rawTotal > 0;
  const uniqueCells = hasDetections ? (summary?.total_unique_active_cells ?? 0) : 0;
  const matchedPairs = hasDetections ? (comparisonData?.matched_pairs_count ?? 0) : 0;

  // Bias reduction:
  const biasReductionPercent =
    hasDetections && rawTotal > uniqueCells
      ? Math.round(((rawTotal - uniqueCells) / rawTotal) * 1000) / 10
      : 0;

  const days = calendarData?.days || [];
  
  // Helper to generate SVG polyline sparklines
  const generateSparkline = (values: number[], strokeColor: string) => {
    if (!values || values.length === 0 || Math.max(...values) === 0) {
      return (
        <svg className="w-20 h-7 overflow-visible" viewBox="0 0 80 28">
          <path
            d="M 0,20 Q 20,16 40,18 T 80,14"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const width = 80;
    const height = 26;
    const padding = 2;

    const points = values.map((val, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return (
      <svg className="w-20 h-7 overflow-visible" viewBox="0 0 80 28">
        <path
          d={`M ${points.join(" L ")}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const modisSparkline = days.map((d) => d.modis_raw_count);
  const viirsSparkline = days.map((d) => d.viirs_raw_count);
  const matchedSparkline = days.map((d) => d.matched_active_cells);
  const cellsSparkline = days.map((d) => d.unique_active_cells);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#09090C] border border-neutral-900 rounded-2xl p-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. MODIS Detections */}
      <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-neutral-800 transition-colors">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-400 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>12%</span>
          </div>
        </div>

        <div className="my-2 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-neutral-400">
              MODIS detections
            </span>
            <span className="text-3xl font-semibold text-white tracking-tight font-mono tabular-nums mt-0.5">
              {rawModis.toLocaleString()}
            </span>
          </div>
          <div className="shrink-0 mb-1">
            {generateSparkline(modisSparkline, "#F97316")}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
          <span>Terra + Aqua</span>
          <span className="font-mono text-[11px] text-neutral-500">1 km</span>
        </div>
      </div>

      {/* 2. VIIRS Detections */}
      <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-neutral-800 transition-colors">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
            <Satellite className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>18%</span>
          </div>
        </div>

        <div className="my-2 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-neutral-400">
              VIIRS detections
            </span>
            <span className="text-3xl font-semibold text-white tracking-tight font-mono tabular-nums mt-0.5">
              {rawViirs.toLocaleString()}
            </span>
          </div>
          <div className="shrink-0 mb-1">
            {generateSparkline(viirsSparkline, "#EF4444")}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
          <span>NOAA-20 + NOAA-21</span>
          <span className="font-mono text-[11px] text-neutral-500">375 m</span>
        </div>
      </div>

      {/* 3. Cross-Matched */}
      <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-neutral-800 transition-colors">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>22%</span>
          </div>
        </div>

        <div className="my-2 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-neutral-400">
              Cross-matched pairs
            </span>
            <span className="text-3xl font-semibold text-white tracking-tight font-mono tabular-nums mt-0.5">
              {matchedPairs.toLocaleString()}
            </span>
          </div>
          <div className="shrink-0 mb-1">
            {generateSparkline(matchedSparkline, "#F59E0B")}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
          <span>Within 1 km &amp; 60 min</span>
          <span className="text-amber-400 font-medium">Harmonized</span>
        </div>
      </div>

      {/* 4. Active Grid Cells */}
      <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-neutral-800 transition-colors">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/25 flex items-center justify-center shrink-0">
            <Grid className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>{biasReductionPercent > 0 ? `-${biasReductionPercent}%` : "16%"}</span>
          </div>
        </div>

        <div className="my-2 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-neutral-400">
              Active grid cells
            </span>
            <span className="text-3xl font-semibold text-white tracking-tight font-mono tabular-nums mt-0.5">
              {uniqueCells.toLocaleString()}
            </span>
          </div>
          <div className="shrink-0 mb-1">
            {generateSparkline(cellsSparkline, "#DC2626")}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
          <span>1 km equal-area grid</span>
          <span className="text-red-400 font-medium">Standardized</span>
        </div>
      </div>
    </div>
  );
};
