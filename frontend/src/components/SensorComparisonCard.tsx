"use client";

import React, { useState } from "react";
import { SlidersHorizontal, BarChart3, TrendingUp, Layers } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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

  // Format short date: "2024-08-10" -> "Aug 10"
  const formatShortDate = (iso: string) => {
    try {
      const parts = iso.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = parseInt(parts[1], 10) - 1;
        return `${months[m]} ${parts[2]}`;
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

  // FRP Histogram data
  const frpHistogramData = [
    { range: "0-5", MODIS: 14, VIIRS: 42 },
    { range: "5-20", MODIS: 18, VIIRS: 35 },
    { range: "20-50", MODIS: 9, VIIRS: 16 },
    { range: "50-100", MODIS: 4, VIIRS: 7 },
    { range: ">100", MODIS: 1, VIIRS: 3 },
  ];

  return (
    <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-xl h-full">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Sensor Comparison
          </h3>
        </div>

        <div className="flex items-center bg-[#1E293B] p-0.5 rounded-lg border border-slate-700/60 text-[11px]">
          <button
            onClick={() => setViewMode("counts")}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
              viewMode === "counts"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Counts
          </button>
          <button
            onClick={() => setViewMode("frp")}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
              viewMode === "frp"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            FRP
          </button>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-3 gap-2 py-2.5 my-1 bg-[#131B2B] rounded-xl px-3 border border-slate-800/80 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            MODIS
          </span>
          <span className="text-sm font-bold text-white font-mono mt-0.5">
            {rawModis.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-400">Terra + Aqua</span>
        </div>

        <div className="flex flex-col border-l border-slate-800/80 pl-2.5">
          <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            VIIRS
          </span>
          <span className="text-sm font-bold text-white font-mono mt-0.5">
            {rawViirs.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-400">NOAA-20/21</span>
        </div>

        <div className="flex flex-col border-l border-slate-800/80 pl-2.5">
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Matched Pairs
          </span>
          <span className="text-sm font-bold text-white font-mono mt-0.5">
            {matchedPairs.toLocaleString()}
          </span>
          <span className="text-[9px] text-emerald-400/80 font-mono">
            {matchedFraction}% of total
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full min-h-[160px] py-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="font-semibold text-slate-300">
            {viewMode === "counts" ? "Detections Over Time" : "FRP Distribution (MW)"}
          </span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              MODIS
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              VIIRS
            </span>
            {viewMode === "counts" && (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Matched
              </span>
            )}
          </div>
        </div>

        {viewMode === "counts" ? (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={timeseriesData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorModis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorViirs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMatched" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Area type="monotone" dataKey="MODIS" stroke="#A78BFA" strokeWidth={2} fill="url(#colorModis)" />
              <Area type="monotone" dataKey="VIIRS" stroke="#38BDF8" strokeWidth={2} fill="url(#colorViirs)" />
              <Area type="monotone" dataKey="Matched" stroke="#34D399" strokeWidth={2} fill="url(#colorMatched)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={frpHistogramData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="MODIS" fill="#A78BFA" radius={[4, 4, 0, 0]} />
              <Bar dataKey="VIIRS" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer link to full sensitivity deep dive */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">
          Spatial tolerance: 1000m &bull; Time: 60m
        </span>
        {onViewDeepDive && (
          <button
            onClick={onViewDeepDive}
            className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
          >
            Inspect Discontinuity &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
