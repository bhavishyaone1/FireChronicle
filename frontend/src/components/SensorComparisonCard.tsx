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
    <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3039]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F5B32F]/10 border border-[#F5B32F]/25 flex items-center justify-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#F5B32F]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F4F5F7] tracking-tight">
              Sensor comparison
            </h3>
            <p className="text-xs text-[#B1B7C1] font-normal">
              Detections over time by instrument and candidate correspondences
            </p>
          </div>
        </div>

        <div className="flex items-center bg-[#08090B] p-0.5 rounded-lg border border-[#2A3039] text-xs">
          <button
            onClick={() => setViewMode("counts")}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              viewMode === "counts"
                ? "bg-[#171A20] text-[#F4F5F7] border border-[#2A3039] font-semibold"
                : "text-[#B1B7C1] hover:text-[#F4F5F7]"
            }`}
          >
            Counts
          </button>
          <button
            onClick={() => setViewMode("frp")}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              viewMode === "frp"
                ? "bg-[#171A20] text-[#F4F5F7] border border-[#2A3039] font-semibold"
                : "text-[#B1B7C1] hover:text-[#F4F5F7]"
            }`}
          >
            FRP (MW)
          </button>
        </div>
      </div>

      {/* Numerical Comparison Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 py-2 border-b border-[#2A3039] text-xs">
        <div className="flex flex-col">
          <span className="text-[#B1B7C1] text-[11px]">MODIS raw:</span>
          <span className="font-mono tabular-nums font-semibold text-[#A78BFA]">
            {rawModis}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#B1B7C1] text-[11px]">VIIRS raw:</span>
          <span className="font-mono tabular-nums font-semibold text-[#38BDF8]">
            {rawViirs}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#B1B7C1] text-[11px]">Candidate pairs:</span>
          <span className="font-mono tabular-nums font-semibold text-[#34D399]">
            {matchedPairs} ({matchedFraction}%)
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full min-h-[160px] py-1.5">
        <div className="flex items-center justify-between text-xs text-[#B1B7C1] mb-1">
          <span className="font-medium text-[#F4F5F7]">
            {viewMode === "counts" ? "Detections over time (UTC)" : "FRP quantiles by sensor (MW)"}
          </span>
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1 text-[#A78BFA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
              MODIS
            </span>
            <span className="flex items-center gap-1 text-[#38BDF8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              VIIRS
            </span>
            {viewMode === "counts" && (
              <span className="flex items-center gap-1 text-[#34D399]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                Candidate pairs
              </span>
            )}
          </div>
        </div>

        {viewMode === "counts" ? (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={timeseriesData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorModisFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorViirsFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMatchedFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2A3039" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#B1B7C1" fontSize={11} tickLine={false} />
              <YAxis stroke="#B1B7C1" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101216",
                  borderColor: "#2A3039",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#F4F5F7",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                }}
              />
              <Area type="monotone" dataKey="MODIS" stroke="#A78BFA" strokeWidth={1.8} fill="url(#colorModisFire)" />
              <Area type="monotone" dataKey="VIIRS" stroke="#38BDF8" strokeWidth={1.8} fill="url(#colorViirsFire)" />
              <Area type="monotone" dataKey="Matched" stroke="#34D399" strokeWidth={1.8} fill="url(#colorMatchedFire)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : hasFrpData ? (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={frpQuantilesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#2A3039" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="metric" stroke="#B1B7C1" fontSize={11} tickLine={false} />
              <YAxis stroke="#B1B7C1" fontSize={11} tickLine={false} unit=" MW" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101216",
                  borderColor: "#2A3039",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#F4F5F7",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                }}
              />
              <Bar dataKey="MODIS" fill="#A78BFA" radius={[3, 3, 0, 0]} />
              <Bar dataKey="VIIRS" fill="#38BDF8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[140px] flex items-center justify-center text-xs text-[#858D99] bg-[#08090B] rounded-lg border border-[#2A3039]">
            No active FRP measurements in current selection
          </div>
        )}
      </div>

      {/* Footer link to full sensitivity deep dive */}
      <div className="pt-2 border-t border-[#2A3039] flex items-center justify-between text-xs">
        <span className="text-[#B1B7C1] text-[11px]" title="Jaccard index of 1.0 km grid cell co-occurrence">
          Tolerance: 1.0 km &bull; 60 min &bull; Jaccard: <strong className="text-[#F4F5F7] font-mono">{jaccard.toFixed(2)}</strong>
        </span>
        {onViewDeepDive && (
          <button
            onClick={onViewDeepDive}
            className="text-[#F5B32F] hover:text-[#F47A24] font-medium transition-colors duration-150 flex items-center gap-1"
          >
            <span>Full comparison</span>
            <span>&rarr;</span>
          </button>
        )}
      </div>
    </div>
  );
};
