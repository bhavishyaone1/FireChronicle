"use client";

import React from "react";
import { TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, Info } from "lucide-react";
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
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-secondary flex flex-col items-center justify-center gap-2">
        <span className="w-5 h-5 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
        <span className="text-xs">Loading multi-year robust baseline analytics...</span>
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

  // Custom rich tooltip ensuring 100% transparent readability
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;

    return (
      <div className="bg-surface-elevated/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl text-xs flex flex-col gap-1.5 min-w-[200px]">
        <div className="font-bold text-text-primary border-b border-border/70 pb-1 flex items-center justify-between">
          <span>{label} 2024 Activity</span>
          {data.isAnomaly ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 font-bold">
              ANOMALY
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-medium">
              NOMINAL
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-fire-mid font-medium">Observed Burning:</span>
            <span className="font-mono font-bold text-text-primary">
              {data["Observed 2024"] !== null ? `${data["Observed 2024"]} cells` : "No data"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-accent-cyan">Historical Median:</span>
            <span className="font-mono text-text-secondary">
              {data["Historical Median"]} cells
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-300">75th Percentile (p75):</span>
            <span className="font-mono text-text-secondary">
              {data["75th Percentile"]} cells
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/50">
            <span className="text-text-muted">Robust Z-Score (MAD):</span>
            <span
              className={`font-mono font-bold ${
                data.isAnomaly ? "text-red-400" : "text-text-primary"
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
    <div className="bg-surface border border-border rounded-xl p-5 shadow-xl flex flex-col gap-6">
      {/* Header & Status Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-cyan" />
            Historical Seasonality &amp; Robust Anomaly Baseline
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Non-parametric Median &amp; Median Absolute Deviation (MAD) over {anomalyData.baseline_years.length} historical baseline years ({anomalyData.baseline_years.join(", ")})
          </p>
        </div>

        {/* Assessment Status Pill */}
        <div className="flex items-center gap-2">
          {anomalyMonths.length > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500 text-red-200 text-xs font-semibold shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              {anomalyMonths.length} Anomalous Month(s) Detected (Z &ge; 2.0 &amp; &gt; p75)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs font-semibold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              2024 Activity Within Historical Baseline
            </span>
          )}
        </div>
      </div>

      {/* Seasonal Profile Chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Monthly Burning Regime vs Multi-Year Baseline (Unique Active Cells)
          </h3>
          <span className="text-[11px] text-text-muted">
            Hover points for robust Z-scores &amp; percentile bounds
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid stroke="#26364B" strokeDasharray="3 3" opacity={0.5} />
              <XAxis dataKey="month" stroke="#8493A8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#8493A8"
                fontSize={11}
                tickLine={false}
                label={{
                  value: "Active Grid Cells",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#8493A8",
                  fontSize: 10,
                  dy: 40,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                iconType="circle"
              />

              {/* 1. Bar: Observed 2024 Activity */}
              <Bar
                dataKey="Observed 2024"
                fill="#FB923C"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />

              {/* 2. Line: Historical Median */}
              <Line
                type="monotone"
                dataKey="Historical Median"
                stroke="#40C4D8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#40C4D8" }}
              />

              {/* 3. Line: 75th Percentile upper threshold */}
              <Line
                type="monotone"
                dataKey="75th Percentile"
                stroke="#FDE68A"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Methodology & Assessment Note */}
      <div className="bg-surface-elevated border border-border p-3.5 rounded-lg text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-text-primary">
            Non-Parametric Anomaly Detection Methodology
          </span>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Wildfire activity follows extreme, non-Gaussian distributions with prolonged zero-activity months. Traditional Gaussian means and standard deviations falsely inflate thresholds and produce spurious anomalies. FireChronicle computes the <strong>Median</strong> and <strong>Median Absolute Deviation (MAD)</strong> across 5 historical baseline years (scaled by 1.4826). A month is strictly classified as anomalous only if its robust Z-score exceeds 2.0, its active cells strictly surpass the historical 75th percentile, and the absolute elevation exceeds baseline noise.
          </p>
        </div>
      </div>
    </div>
  );
};
