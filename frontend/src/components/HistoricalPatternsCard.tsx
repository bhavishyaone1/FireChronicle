"use client";

import React, { useState } from "react";
import { TrendingUp, AlertTriangle, ChevronDown, Flame } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { AnomalyResponse } from "@/types";

interface HistoricalPatternsCardProps {
  anomalyData: AnomalyResponse | null;
  isLoading?: boolean;
  onViewDeepDive?: () => void;
}

export const HistoricalPatternsCard: React.FC<HistoricalPatternsCardProps> = ({
  anomalyData,
  isLoading = false,
  onViewDeepDive,
}) => {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMetric, setSelectedMetric] = useState("active_cells");

  const monthsData = anomalyData?.months || [
    { month_name: "Jan", observed_active_cells: 12, median_active_cells: 10, is_anomaly: false },
    { month_name: "Feb", observed_active_cells: 14, median_active_cells: 12, is_anomaly: false },
    { month_name: "Mar", observed_active_cells: 18, median_active_cells: 15, is_anomaly: false },
    { month_name: "Apr", observed_active_cells: 25, median_active_cells: 20, is_anomaly: false },
    { month_name: "May", observed_active_cells: 45, median_active_cells: 38, is_anomaly: false },
    { month_name: "Jun", observed_active_cells: 85, median_active_cells: 65, is_anomaly: false },
    { month_name: "Jul", observed_active_cells: 130, median_active_cells: 95, is_anomaly: false },
    { month_name: "Aug", observed_active_cells: 178, median_active_cells: 125, is_anomaly: true },
    { month_name: "Sep", observed_active_cells: 140, median_active_cells: 110, is_anomaly: false },
    { month_name: "Oct", observed_active_cells: 70, median_active_cells: 55, is_anomaly: false },
    { month_name: "Nov", observed_active_cells: 30, median_active_cells: 25, is_anomaly: false },
    { month_name: "Dec", observed_active_cells: 15, median_active_cells: 12, is_anomaly: false },
  ];

  const chartData = monthsData.map((m) => ({
    month: m.month_name,
    cells: m.observed_active_cells,
    isAnomaly: Boolean(m.is_anomaly),
  }));

  const anomalousMonths = chartData.filter((c) => c.isAnomaly);
  const hasAnomaly = anomalousMonths.length > 0;
  const primaryAnomaly = anomalousMonths[0] || chartData[7]; // fallback to Aug record for display
  const primaryCells = primaryAnomaly.cells;

  return (
    <div className="bg-[#10141B] border border-[#28313D] rounded-xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Header with Title and Dropdowns */}
      <div className="flex items-center justify-between pb-3 border-b border-[#28313D]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F1F5F9] tracking-tight">
              Historical patterns
            </h3>
            <p className="text-xs text-[#A4AFBF] font-normal">
              Observed 2024 burning activity vs multi-year baseline (2018–2023)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Year selector */}
          <div className="flex items-center gap-1 bg-[#090B0F] px-2 py-1 rounded-lg border border-[#28313D] text-xs text-[#F1F5F9] font-medium">
            <span>{selectedYear}</span>
            <ChevronDown className="w-3 h-3 text-[#A4AFBF]" />
          </div>

          {/* Metric selector */}
          <div className="flex items-center gap-1 bg-[#090B0F] px-2 py-1 rounded-lg border border-[#28313D] text-xs text-[#F1F5F9] font-medium">
            <span>Active grid cells</span>
            <ChevronDown className="w-3 h-3 text-[#A4AFBF]" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full min-h-[160px] py-1.5 relative">
        {/* Floating peak callout badge */}
        <div className="absolute top-1 right-28 z-10 px-2 py-0.5 rounded-md bg-[#151A22] border border-[#28313D] text-[#F1F5F9] text-[11px] font-medium flex items-center gap-1 shadow-sm font-mono tabular-nums">
          <Flame className="w-3 h-3 text-[#F59E0B]" />
          <span>{primaryAnomaly.month} 2024: {primaryCells} cells</span>
        </div>

        <ResponsiveContainer width="100%" height={145}>
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid stroke="#28313D" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="#A4AFBF" fontSize={11} tickLine={false} />
            <YAxis stroke="#A4AFBF" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#10141B",
                borderColor: "#28313D",
                borderRadius: "8px",
                fontSize: "11px",
                color: "#F1F5F9",
                fontFamily: "var(--font-geist-sans), sans-serif",
              }}
            />
            <Bar dataKey="cells" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isAnomaly ? "#F59E0B" : "#1E242E"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Alert Banner */}
      <div className="p-2.5 rounded-xl bg-[#090B0F] border border-[#28313D] flex items-start justify-between gap-2 text-xs">
        <div className="flex items-start gap-2">
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              hasAnomaly ? "text-[#F59E0B]" : "text-[#34D399]"
            }`}
          />
          <div className="flex flex-col">
            <span className="font-medium text-[#F1F5F9] leading-tight">
              {hasAnomaly
                ? "Elevated seasonal activity detected"
                : "Nominal seasonal baseline"}
            </span>
            <span className="text-[11px] text-[#A4AFBF] leading-snug mt-0.5 font-normal">
              {hasAnomaly
                ? `${anomalousMonths.map((m) => m.month).join(", ")} 2024 exceeds robust Z >= 2.0 and the 75th percentile of the 2018–2023 baseline.`
                : "All observed months in 2024 remain within the historical non-parametric baseline."}
            </span>
          </div>
        </div>

        {onViewDeepDive && (
          <button
            onClick={onViewDeepDive}
            className="text-xs font-medium text-[#F59E0B] hover:text-[#fbbf24] shrink-0 self-center pl-1 transition-colors duration-150"
          >
            Details &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
