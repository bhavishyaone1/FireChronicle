"use client";

import React from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { AnomalyResponse } from "@/types";

interface HistoricalAnomaliesProps {
  anomalyData: AnomalyResponse | null;
  isLoading?: boolean;
}

export const HistoricalAnomalies: React.FC<HistoricalAnomaliesProps> = ({
  anomalyData,
  isLoading = false,
}) => {
  if (isLoading || !anomalyData) {
    return (
      <div className="bg-[#10141B] border border-[#28313D] rounded-xl p-8 text-center text-[#A4AFBF] flex flex-col items-center justify-center gap-2">
        <span className="w-5 h-5 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
        <span className="text-xs font-normal">Loading multi-year robust baseline analytics...</span>
      </div>
    );
  }

  const chartData = anomalyData.months.map((m) => ({
    month: m.month_name,
    "Historical Median": m.median_active_cells,
    "75th Percentile": m.p75_active_cells,
    "Observed 2024": m.observed_active_cells,
    isAnomaly: m.is_anomaly,
    zScore: m.deviation_z_score,
  }));

  const anomalyMonths = anomalyData.months.filter((m) => m.is_anomaly);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;

    return (
      <div className="bg-[#10141B] border border-[#28313D] p-3 rounded-lg shadow-xl text-xs flex flex-col gap-1.5 min-w-[200px]">
        <div className="font-semibold text-[#F1F5F9] border-b border-[#28313D] pb-1 flex items-center justify-between">
          <span>{label} 2024 activity</span>
          {data.isAnomaly ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 font-medium">
              Anomaly
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#151A22] border border-[#28313D] text-[#A4AFBF] font-medium">
              Nominal
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-[#F59E0B] font-medium">Observed active cells:</span>
            <span className="font-mono tabular-nums font-semibold text-[#F1F5F9]">
              {data["Observed 2024"] !== null ? `${data["Observed 2024"]} cells` : "No data"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#A4AFBF]">Historical median:</span>
            <span className="font-mono tabular-nums text-[#F1F5F9]">
              {data["Historical Median"]} cells
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-400">75th percentile (p75):</span>
            <span className="font-mono tabular-nums text-[#F1F5F9]">
              {data["75th Percentile"]} cells
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-[#28313D]">
            <span className="text-[#A4AFBF]">Robust Z-score (MAD):</span>
            <span
              className={`font-mono tabular-nums font-semibold ${
                data.isAnomaly ? "text-red-400" : "text-[#F1F5F9]"
              }`}
            >
              {data.zScore !== null ? `${data.zScore > 0 ? "+" : ""}${data.zScore}` : "N/A"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#10141B] border border-[#28313D] rounded-xl p-5 shadow-sm flex flex-col gap-6">
      {/* Header & Status Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#28313D] pb-3">
        <div>
          <h2 className="text-base font-semibold text-[#F1F5F9] flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
            Historical seasonality and robust anomaly baseline
          </h2>
          <p className="text-xs text-[#A4AFBF] mt-0.5 font-normal">
            Non-parametric median and median absolute deviation (MAD) over {anomalyData.baseline_years.length} historical baseline years ({anomalyData.baseline_years.join(", ")})
          </p>
        </div>

        {/* Assessment Status Pill */}
        <div className="flex items-center gap-2">
          {anomalyMonths.length > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-medium shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              {anomalyMonths.length} anomalous month(s) detected (Z &ge; 2.0 &amp; &gt; p75)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#151A22] border border-[#28313D] text-[#A4AFBF] text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              All 2024 months within nominal historical baseline
            </span>
          )}
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="#28313D" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#A4AFBF" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#A4AFBF"
              fontSize={11}
              tickLine={false}
              label={{
                value: "Active Grid Cells (1 km)",
                angle: -90,
                position: "insideLeft",
                fill: "#A4AFBF",
                fontSize: 11,
                dy: 60,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: 15,
                fontSize: 11,
                color: "#A4AFBF",
                fontFamily: "var(--font-geist-sans), sans-serif",
              }}
            />
            <Bar
              dataKey="Observed 2024"
              fill="#F59E0B"
              radius={[3, 3, 0, 0]}
              barSize={24}
            />
            <Line
              type="monotone"
              dataKey="Historical Median"
              stroke="#A4AFBF"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#A4AFBF" }}
            />
            <Line
              type="monotone"
              dataKey="75th Percentile"
              stroke="#FDE047"
              strokeWidth={2}
              dot={{ r: 3, fill: "#FDE047" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Methodology Explanatory Callout */}
      <div className="bg-[#090B0F] border border-[#28313D] p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#F1F5F9] text-xs">
            Why non-parametric percentiles and MAD instead of mean &plusmn; standard deviation?
          </p>
          <p className="text-[#A4AFBF] text-[11px] font-normal leading-relaxed">
            Wildfire occurrences exhibit heavy-tailed (log-normal or Pareto) distributions rather than a Gaussian bell curve. Calculating simple mean and variance distorts baseline expectations due to extreme historical mega-fire seasons. FireChronicle computes robust Median and Median Absolute Deviation (MAD), requiring deviations to exceed both robust Z &ge; 2.0 and the 75th percentile threshold.
          </p>
        </div>
      </div>
    </div>
  );
};
