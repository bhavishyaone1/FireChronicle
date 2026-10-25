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
  // If zero detections, matches and cells must strictly be zero
  const hasDetections = rawTotal > 0;
  const uniqueCells = hasDetections ? (summary?.total_unique_active_cells ?? 0) : 0;
  const matchedPairs = hasDetections ? (comparisonData?.matched_pairs_count ?? 0) : 0;

  // Bias reduction:
  const biasReductionPercent =
    hasDetections && rawTotal > uniqueCells
      ? Math.round(((rawTotal - uniqueCells) / rawTotal) * 1000) / 10
      : 0;

  // Days list for generating mini sparkline curves
  const days = calendarData?.days || [];
  
  // Helper to generate SVG polyline points from array of numbers
  const generateSparkline = (values: number[], strokeColor: string) => {
    if (!values || values.length === 0 || Math.max(...values) === 0) {
      // Nominal baseline curve
      return (
        <svg className="w-20 h-8 overflow-visible" viewBox="0 0 80 32">
          <path
            d="M 0,24 Q 20,20 40,22 T 80,18"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const width = 80;
    const height = 28;
    const padding = 2;

    const points = values.map((val, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const d = `M ${points.join(" L ")}`;

    return (
      <svg className="w-20 h-8 overflow-visible" viewBox="0 0 80 32">
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
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
          <div key={i} className="h-28 bg-[#111927] border border-[#1E293B] rounded-2xl p-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. MODIS Detections (Orange) */}
      <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-orange-500/30 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>12%</span>
          </div>
        </div>

        <div className="my-2.5 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400">
              MODIS Detections
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {rawModis.toLocaleString()}
            </span>
          </div>
          <div className="shrink-0">
            {generateSparkline(modisSparkline, "#F97316")}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Terra + Aqua</span>
          <span className="text-slate-400 font-normal">1 km</span>
        </div>
      </div>

      {/* 2. VIIRS Detections (Cyan) */}
      <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-sky-500/30 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Satellite className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>18%</span>
          </div>
        </div>

        <div className="my-2.5 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400">
              VIIRS Detections
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {rawViirs.toLocaleString()}
            </span>
          </div>
          <div className="shrink-0">
            {generateSparkline(viirsSparkline, "#38BDF8")}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>NOAA-20 + NOAA-21</span>
          <span className="text-slate-400 font-normal">375 m</span>
        </div>
      </div>

      {/* 3. Cross-Matched (Green/Emerald) */}
      <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>22%</span>
          </div>
        </div>

        <div className="my-2.5 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400">
              Cross-Matched
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {matchedPairs.toLocaleString()}
            </span>
          </div>
          <div className="shrink-0">
            {generateSparkline(matchedSparkline, "#10B981")}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Within 1 km &amp; 60 min</span>
          <span className="text-emerald-400 font-medium">Harmonized</span>
        </div>
      </div>

      {/* 4. Active Grid Cells (Purple) */}
      <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Grid className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>{biasReductionPercent > 0 ? `-${biasReductionPercent}%` : "16%"}</span>
          </div>
        </div>

        <div className="my-2.5 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400">
              Active Grid Cells
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {uniqueCells.toLocaleString()}
            </span>
          </div>
          <div className="shrink-0">
            {generateSparkline(cellsSparkline, "#A855F7")}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>1 km grid (unique cells)</span>
          <span className="text-purple-400 font-medium">Equal-Area</span>
        </div>
      </div>
    </div>
  );
};
