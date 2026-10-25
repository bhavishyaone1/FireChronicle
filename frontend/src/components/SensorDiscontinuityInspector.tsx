"use client";

import React from "react";
import { Scale, CheckCircle, AlertCircle, TrendingUp, HelpCircle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { SensorComparisonResponse } from "@/types";

interface SensorDiscontinuityInspectorProps {
  comparisonData: SensorComparisonResponse | null;
}

export const SensorDiscontinuityInspector: React.FC<SensorDiscontinuityInspectorProps> = ({
  comparisonData,
}) => {
  if (!comparisonData) {
    return (
      <div className="bg-nasa-card border border-nasa-border rounded-xl p-6 text-center text-nasa-slate">
        Loading sensor comparison analysis...
      </div>
    );
  }

  const sensitivityData = comparisonData.sensitivity_curve.map((p) => ({
    tolerance: `${p.tolerance_m}m`,
    "Matched Fraction": Math.round(p.matched_fraction * 100),
    "Matched Pairs": p.matched_pairs,
  }));

  const qModis = comparisonData.frp_quantiles_modis;
  const qViirs = comparisonData.frp_quantiles_viirs;

  return (
    <div className="bg-nasa-card/90 border border-nasa-border rounded-xl p-5 shadow-lg flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-400" />
          Sensor Discontinuity & Cross-Matching Inspector
        </h2>
        <p className="text-xs text-nasa-slate mt-1">
          Revealing the physical and geometric causes of the MODIS-to-VIIRS historical data jump
        </p>
      </div>

      {/* Side-by-Side Sensor Card Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MODIS Card */}
        <div className="bg-nasa-dark/80 border border-blue-500/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-nasa-border/40 pb-2 mb-3">
            <span className="font-bold text-blue-300">MODIS (Terra & Aqua)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-200">1000 m Nadir</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-nasa-slate">Total Detections:</span>
              <span className="font-bold text-white">{comparisonData.modis_total_detections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nasa-slate">Cross-Matched with VIIRS:</span>
              <span className="font-bold text-green-400">
                {Math.round(comparisonData.matched_fraction_modis * 100)}% ({comparisonData.matched_pairs_count} pairs)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-nasa-slate">MODIS-Only Detections:</span>
              <span className="font-bold text-blue-300">{comparisonData.modis_only_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nasa-slate">Median FRP (MW):</span>
              <span className="font-bold text-white">{qModis ? `${qModis.p50} MW` : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nasa-slate">Peak FRP (MW):</span>
              <span className="font-bold text-nasa-orange">{qModis ? `${qModis.max} MW` : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* VIIRS Card */}
        <div className="bg-nasa-dark/80 border border-orange-500/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-nasa-border/40 pb-2 mb-3">
            <span className="font-bold text-nasa-orange">VIIRS (S-NPP & NOAA-20)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-orange-900/60 text-orange-200">375 m Nadir</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-nasa-slate">Total Detections:</span>
              <span className="font-bold text-white">{comparisonData.viirs_total_detections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nasa-slate">Cross-Matched with MODIS:</span>
              <span className="font-bold text-green-400">
                {Math.round(comparisonData.matched_fraction_viirs * 100)}% ({comparisonData.matched_pairs_count} pairs)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-nasa-slate">VIIRS-Only Detections:</span>
              <span className="font-bold text-orange-400">{comparisonData.viirs_only_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nasa-slate">Median FRP (MW):</span>
              <span className="font-bold text-white">{qViirs ? `${qViirs.p50} MW` : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nasa-slate">Peak FRP (MW):</span>
              <span className="font-bold text-nasa-orange">{qViirs ? `${qViirs.max} MW` : "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitivity Curve Chart */}
      <div className="border border-nasa-border/60 rounded-xl p-4 bg-nasa-dark/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-nasa-slate mb-3 flex items-center justify-between">
          <span>Spatial Matching Tolerance Sensitivity Curve</span>
          <span className="text-[11px] text-nasa-cyan font-mono">Temporal Window: ±60 min</span>
        </h3>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensitivityData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2541" />
              <XAxis dataKey="tolerance" stroke="#8d99ae" fontSize={11} />
              <YAxis unit="%" stroke="#8d99ae" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b132b",
                  borderColor: "#3a506b",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="Matched Fraction"
                stroke="#48cae4"
                strokeWidth={3}
                dot={{ r: 5, fill: "#48cae4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-nasa-slate mt-2 text-center">
          Demonstrates percentage of MODIS detections with collocated VIIRS observations across distance thresholds (500m to 2000m).
        </p>
      </div>

      {/* Notes & Principles */}
      <div className="bg-nasa-dark/70 border border-nasa-border/50 rounded-lg p-3 text-xs space-y-1.5">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-nasa-cyan" />
          Harmonization Principles:
        </span>
        {comparisonData.notes.map((note, idx) => (
          <p key={idx} className="text-gray-300 pl-5 text-[11px]">
            • {note}
          </p>
        ))}
      </div>
    </div>
  );
};
