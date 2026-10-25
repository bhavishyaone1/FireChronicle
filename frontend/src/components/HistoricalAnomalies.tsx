"use client";

import React from "react";
import { TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { AnomalyResponse } from "@/types";

interface HistoricalAnomaliesProps {
  anomalyData: AnomalyResponse | null;
}

export const HistoricalAnomalies: React.FC<HistoricalAnomaliesProps> = ({ anomalyData }) => {
  if (!anomalyData) {
    return (
      <div className="bg-nasa-card border border-nasa-border rounded-xl p-6 text-center text-nasa-slate">
        Loading historical baseline and anomaly analytics...
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

  return (
    <div className="bg-nasa-card/90 border border-nasa-border rounded-xl p-5 shadow-lg flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-nasa-border/50 pb-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-nasa-cyan" />
            Historical Seasonality & Robust Anomaly Baseline
          </h2>
          <p className="text-xs text-nasa-slate mt-0.5">
            Non-parametric Median & Median Absolute Deviation (MAD) over {anomalyData.baseline_years.length} historical baseline years
          </p>
        </div>

        {/* Assessment Status Pill */}
        <div className="flex items-center gap-2">
          {anomalyMonths.length > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/60 border border-red-500 text-red-200 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              {anomalyMonths.length} Anomalous Month(s) Detected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-900/60 border border-green-500 text-green-200 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              Activity Within Historical Range
            </span>
          )}
        </div>
      </div>

      {/* Seasonal Profile Chart */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-nasa-slate mb-2">
          Monthly Burning Regime vs Multi-Year Baseline (Unique Active Cells)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <XAxis dataKey="month" stroke="#8d99ae" fontSize={11} />
              <YAxis stroke="#8d99ae" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b132b",
                  borderColor: "#3a506b",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
              <Bar dataKey="Historical Median" fill="#3a506b" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="75th Percentile" stroke="#fcbf49" strokeWidth={2} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="Observed 2024" stroke="#d62828" strokeWidth={3} dot={{ r: 4, fill: "#d62828" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assessment Text */}
      <div className="bg-nasa-dark/60 border border-nasa-border/40 rounded-lg p-3 text-xs">
        <span className="font-semibold text-white">Statistical Assessment: </span>
        <span className="text-gray-300">{anomalyData.overall_assessment}</span>
      </div>

      {/* Limitations / Integrity Warnings */}
      <div className="border border-nasa-border/40 rounded-lg p-3 text-[11px] text-nasa-slate space-y-1">
        <span className="font-semibold text-white block">Methodological Limitations:</span>
        {anomalyData.limitations.map((lim, idx) => (
          <p key={idx}>• {lim}</p>
        ))}
      </div>
    </div>
  );
};
