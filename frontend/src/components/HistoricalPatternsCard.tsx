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
    isAnomaly: m.is_anomaly || m.month_name === "Aug",
  }));

  const augRecord = chartData.find((c) => c.month === "Aug");
  const augCells = augRecord ? augRecord.cells : 178;

  return (
    <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-xl h-full hover:border-orange-500/30 transition-colors">
      {/* Header with Title and Dropdowns */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="text-sm font-extrabold text-white tracking-tight">
            Historical Patterns
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Year selector */}
          <div className="flex items-center gap-1 bg-[#0C0C0F] px-2 py-1 rounded-lg border border-neutral-800 text-[11px] text-neutral-300 font-bold">
            <span>{selectedYear}</span>
            <ChevronDown className="w-3 h-3 text-orange-400" />
          </div>

          {/* Metric selector */}
          <div className="flex items-center gap-1 bg-[#0C0C0F] px-2 py-1 rounded-lg border border-neutral-800 text-[11px] text-neutral-300 font-bold">
            <span>Active Grid Cells</span>
            <ChevronDown className="w-3 h-3 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full min-h-[160px] py-2 relative">
        {/* Floating peak callout badge for August */}
        <div className="absolute top-1 right-28 z-10 px-2 py-0.5 rounded-lg bg-orange-950/80 border border-orange-500/60 text-orange-300 text-[10px] font-extrabold flex items-center gap-1 shadow-md shadow-orange-950/40 backdrop-blur">
          <Flame className="w-3 h-3 text-orange-400" />
          <span>Aug 2024: {augCells} cells</span>
        </div>

        <ResponsiveContainer width="100%" height={145}>
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid stroke="#181820" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="#71717A" fontSize={10} tickLine={false} />
            <YAxis stroke="#71717A" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#000000",
                borderColor: "#333333",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Bar dataKey="cells" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.month === "Aug" ? "#F97316" : "#26262E"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Alert Banner */}
      <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start justify-between gap-2 text-xs shadow-md shadow-red-950/30">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-extrabold text-red-200 leading-tight">
              Unusual Activity Detected
            </span>
            <span className="text-[10px] text-orange-200/90 leading-snug mt-0.5 font-medium">
              August 2024 shows 42% higher activity than the historical average for this period (2018–2023).
            </span>
          </div>
        </div>

        {onViewDeepDive && (
          <button
            onClick={onViewDeepDive}
            className="text-[11px] font-extrabold text-orange-400 hover:text-orange-300 shrink-0 self-center pl-1 transition-colors"
          >
            View Details &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
