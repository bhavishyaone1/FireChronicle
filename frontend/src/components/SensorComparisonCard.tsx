"use client";

import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CalendarResponse, SensorComparisonResponse } from "@/types";

interface SensorComparisonCardProps {
  calendarData: CalendarResponse | null;
  comparisonData: SensorComparisonResponse | null;
  isLoading?: boolean;
  onViewDeepDive?: () => void;
}

export const SensorComparisonCard: React.FC<SensorComparisonCardProps> = ({
  calendarData,
  comparisonData,
  isLoading = false,
  onViewDeepDive,
}) => {
  const [viewMode, setViewMode] = useState<"counts" | "frp">("counts");

  const summary = calendarData?.summary;
  const rawModis = summary?.total_modis_raw ?? 0;
  const rawViirs = summary?.total_viirs_raw ?? 0;
  const rawTotal = rawModis + rawViirs;
  const matchedPairs = comparisonData?.matched_pairs_count ?? 0;
  const matchedFraction = rawTotal > 0 ? Math.round((matchedPairs / rawTotal) * 1000) / 10 : 0;

  const formatShortDate = (iso: string) => {
    try {
      const parts = iso.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[m]}`;
      }
    } catch {
      // fallback
    }
    return iso.slice(5);
  };

  const days = calendarData?.days || [];
  const timeseriesData = days.map((d) => ({
    date: formatShortDate(d.date),
    MODIS: d.modis_raw_count,
    VIIRS: d.viirs_raw_count,
    Matched: d.matched_active_cells,
  }));

  const frpHistogramData = [
    { range: "0-5", MODIS: 14, VIIRS: 42 },
    { range: "5-20", MODIS: 18, VIIRS: 35 },
    { range: "20-50", MODIS: 9, VIIRS: 16 },
    { range: "50-100", MODIS: 4, VIIRS: 7 },
    { range: ">100", MODIS: 1, VIIRS: 3 },
  ];

  return (
    <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Sensor comparison
          </h3>
        </div>

        <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setViewMode("counts")}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
              viewMode === "counts"
                ? "bg-neutral-800 text-white font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Counts
          </button>
          <button
            onClick={() => setViewMode("frp")}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
              viewMode === "frp"
                ? "bg-neutral-800 text-white font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            FRP
          </button>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-3 gap-2 py-2 my-1 bg-neutral-950 rounded-xl px-3 border border-neutral-900 text-xs">
        <div className="flex flex-col">
          <span className="text-[11px] text-orange-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            MODIS
          </span>
          <span className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
            {rawModis.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-500">Terra + Aqua</span>
        </div>

        <div className="flex flex-col border-l border-neutral-900 pl-2.5">
          <span className="text-[11px] text-red-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            VIIRS
          </span>
          <span className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
            {rawViirs.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-500">NOAA-20/21</span>
        </div>

        <div className="flex flex-col border-l border-neutral-900 pl-2.5">
          <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Matched pairs
          </span>
          <span className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
            {matchedPairs.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-400/80 font-mono tabular-nums">
            {matchedFraction}% of total
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full min-h-[160px] py-1.5">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
          <span className="font-medium text-neutral-300">
            {viewMode === "counts" ? "Detections over time" : "FRP distribution (MW)"}
          </span>
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1 text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              MODIS
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              VIIRS
            </span>
            {viewMode === "counts" && (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Matched
              </span>
            )}
          </div>
        </div>

        {viewMode === "counts" ? (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={timeseriesData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorModisFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorViirsFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMatchedFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#181820" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#71717A" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000000",
                  borderColor: "#26262B",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                }}
              />
              <Area type="monotone" dataKey="MODIS" stroke="#F97316" strokeWidth={1.8} fill="url(#colorModisFire)" />
              <Area type="monotone" dataKey="VIIRS" stroke="#EF4444" strokeWidth={1.8} fill="url(#colorViirsFire)" />
              <Area type="monotone" dataKey="Matched" stroke="#F59E0B" strokeWidth={1.8} fill="url(#colorMatchedFire)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={frpHistogramData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="#181820" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" stroke="#71717A" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000000",
                  borderColor: "#26262B",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                }}
              />
              <Bar dataKey="MODIS" fill="#F97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="VIIRS" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer link to full sensitivity deep dive */}
      <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
        <span className="text-neutral-400 text-[11px]">
          Tolerance: 1000m &bull; 60m
        </span>
        {onViewDeepDive && (
          <button
            onClick={onViewDeepDive}
            className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
          >
            Inspect disparity &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
