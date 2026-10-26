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
  const rawModis = comparisonData?.modis_total_detections ?? summary?.total_modis_raw ?? 0;
  const rawViirs = comparisonData?.viirs_total_detections ?? summary?.total_viirs_raw ?? 0;
  const rawTotal = rawModis + rawViirs;
  const matchedPairs = comparisonData?.matched_pairs_count ?? 0;
  const jaccard = comparisonData?.spatial_agreement_jaccard ?? 0.0;
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

  // Mathematically authentic FRP Quantiles derived from actual observations
  const qMod = comparisonData?.frp_quantiles_modis;
  const qVii = comparisonData?.frp_quantiles_viirs;
  const hasFrpData = Boolean(qMod || qVii);

  const frpQuantilesData = [
    { metric: "p25", MODIS: qMod?.p25 ?? 0, VIIRS: qVii?.p25 ?? 0 },
    { metric: "Median (p50)", MODIS: qMod?.p50 ?? 0, VIIRS: qVii?.p50 ?? 0 },
    { metric: "p75", MODIS: qMod?.p75 ?? 0, VIIRS: qVii?.p75 ?? 0 },
    { metric: "p95", MODIS: qMod?.p95 ?? 0, VIIRS: qVii?.p95 ?? 0 },
  ];

  return (
    <div className="bg-[#101216] border border-[#282D35] rounded-xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282D35]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F3F4F6] tracking-tight">
              Sensor comparison
            </h3>
            <p className="text-xs text-[#A4AAB5] font-normal">
              Detections over time by instrument and candidate matches
            </p>
          </div>
        </div>

        <div className="flex items-center bg-[#090A0C] p-0.5 rounded-lg border border-[#282D35] text-xs">
          <button
            onClick={() => setViewMode("counts")}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              viewMode === "counts"
                ? "bg-[#16191F] text-[#F3F4F6] border border-[#282D35] font-semibold"
                : "text-[#A4AAB5] hover:text-[#F3F4F6]"
            }`}
          >
            Counts
          </button>
          <button
            onClick={() => setViewMode("frp")}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              viewMode === "frp"
                ? "bg-[#16191F] text-[#F3F4F6] border border-[#282D35] font-semibold"
                : "text-[#A4AAB5] hover:text-[#F3F4F6]"
            }`}
          >
            FRP (MW)
          </button>
        </div>
      </div>

      {/* Numerical Comparison Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 py-2 border-b border-[#282D35] text-xs">
        <div className="flex flex-col">
          <span className="text-[#A4AAB5] text-[11px]">MODIS raw:</span>
          <span className="font-mono tabular-nums font-semibold text-[#F59E0B]">
            {rawModis}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#A4AAB5] text-[11px]">VIIRS raw:</span>
          <span className="font-mono tabular-nums font-semibold text-red-400">
            {rawViirs}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#A4AAB5] text-[11px]">Matched pairs:</span>
          <span className="font-mono tabular-nums font-semibold text-blue-400">
            {matchedPairs} ({matchedFraction}%)
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full min-h-[160px] py-1.5">
        <div className="flex items-center justify-between text-xs text-[#A4AAB5] mb-1">
          <span className="font-medium text-[#F3F4F6]">
            {viewMode === "counts" ? "Detections over time (UTC)" : "FRP quantiles by sensor (MW)"}
          </span>
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1 text-[#F59E0B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              MODIS
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              VIIRS
            </span>
            {viewMode === "counts" && (
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
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
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorViirsFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMatchedFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#282D35" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#A4AAB5" fontSize={11} tickLine={false} />
              <YAxis stroke="#A4AAB5" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101216",
                  borderColor: "#282D35",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#F3F4F6",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                }}
              />
              <Area type="monotone" dataKey="MODIS" stroke="#F59E0B" strokeWidth={1.8} fill="url(#colorModisFire)" />
              <Area type="monotone" dataKey="VIIRS" stroke="#EF4444" strokeWidth={1.8} fill="url(#colorViirsFire)" />
              <Area type="monotone" dataKey="Matched" stroke="#3B82F6" strokeWidth={1.8} fill="url(#colorMatchedFire)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : hasFrpData ? (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={frpQuantilesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#282D35" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="metric" stroke="#A4AAB5" fontSize={11} tickLine={false} />
              <YAxis stroke="#A4AAB5" fontSize={11} tickLine={false} unit=" MW" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101216",
                  borderColor: "#282D35",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#F3F4F6",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                }}
              />
              <Bar dataKey="MODIS" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              <Bar dataKey="VIIRS" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[140px] flex items-center justify-center text-xs text-[#A4AAB5]">
            No active FRP measurements in current selection
          </div>
        )}
      </div>

      {/* Footer link to full sensitivity deep dive */}
      <div className="pt-2 border-t border-[#282D35] flex items-center justify-between text-xs">
        <span className="text-[#A4AAB5] text-[11px]" title="Jaccard index of 1.0 km grid cell co-occurrence">
          Tolerance: 1.0 km &bull; 60 min &bull; Jaccard: <strong className="text-[#F3F4F6] font-mono">{jaccard.toFixed(2)}</strong>
        </span>
        {onViewDeepDive && (
          <button
            onClick={onViewDeepDive}
            className="text-[#F59E0B] hover:text-[#fbbf24] font-medium transition-colors duration-150 flex items-center gap-1"
          >
            <span>Inspect disparity</span>
            <span>&rarr;</span>
          </button>
        )}
      </div>
    </div>
  );
};
