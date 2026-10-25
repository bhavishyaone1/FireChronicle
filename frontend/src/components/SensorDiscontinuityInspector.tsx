"use client";

import React from "react";
import { Scale, CheckCircle, AlertCircle, TrendingUp, HelpCircle, Layers, Sliders } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { SensorComparisonResponse } from "@/types";

interface SensorDiscontinuityInspectorProps {
  comparisonData: SensorComparisonResponse | null;
  isLoading?: boolean;
}

export const SensorDiscontinuityInspector: React.FC<SensorDiscontinuityInspectorProps> = ({
  comparisonData,
  isLoading = false,
}) => {
  if (isLoading || !comparisonData) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-secondary flex flex-col items-center justify-center gap-2">
        <span className="w-5 h-5 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
        <span className="text-xs">Loading sensor disparity and sensitivity sweep analysis...</span>
      </div>
    );
  }

  const sensitivityData = comparisonData.sensitivity_curve.map((p) => ({
    tolerance: `${p.tolerance_m}m`,
    "Matched %": Math.round(p.matched_fraction * 100),
    "Pairs Count": p.matched_pairs,
  }));

  const qModis = comparisonData.frp_quantiles_modis;
  const qViirs = comparisonData.frp_quantiles_viirs;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-xl flex flex-col gap-6">
      {/* Title */}
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Scale className="w-5 h-5 text-accent-cyan" />
          Sensor Discontinuity &amp; Cross-Matching Inspector
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Quantifying the physical, orbital, and geometric drivers of the MODIS-to-VIIRS observation gap
        </p>
      </div>

      {/* Side-by-Side Sensor Card Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MODIS Card */}
        <div className="bg-surface-elevated border border-accent-violet/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <span className="font-bold text-accent-violet flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-violet inline-block" />
              MODIS (Terra &amp; Aqua)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-accent-violet/60 text-purple-200 font-mono">
              1000m Nadir Footprint
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Detections:</span>
              <span className="font-bold text-text-primary font-mono">{comparisonData.modis_total_detections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Matched with VIIRS:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {Math.round(comparisonData.matched_fraction_modis * 100)}% ({comparisonData.matched_pairs_count} pairs)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Sensor-Unique Detections:</span>
              <span className="font-bold text-accent-violet font-mono">{comparisonData.modis_only_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Median FRP (MW):</span>
              <span className="font-bold text-text-primary font-mono">{qModis ? `${qModis.p50} MW` : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Peak FRP (MW):</span>
              <span className="font-bold text-fire-mid font-mono">{qModis ? `${qModis.max} MW` : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* VIIRS Card */}
        <div className="bg-surface-elevated border border-viirs-cyan/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <span className="font-bold text-viirs-cyan flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-viirs-cyan inline-block" />
              VIIRS (S-NPP, NOAA-20, NOAA-21)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950/80 border border-viirs-cyan/60 text-sky-200 font-mono">
              375m I-Band Footprint
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Detections:</span>
              <span className="font-bold text-text-primary font-mono">{comparisonData.viirs_total_detections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Matched with MODIS:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {Math.round(comparisonData.matched_fraction_viirs * 100)}% ({comparisonData.matched_pairs_count} pairs)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Sensor-Unique Detections:</span>
              <span className="font-bold text-viirs-cyan font-mono">{comparisonData.viirs_only_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Median FRP (MW):</span>
              <span className="font-bold text-text-primary font-mono">{qViirs ? `${qViirs.p50} MW` : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Peak FRP (MW):</span>
              <span className="font-bold text-fire-mid font-mono">{qViirs ? `${qViirs.max} MW` : "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitivity Sweep Curve */}
      <div className="border-t border-border/60 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-accent-cyan" />
            Candidate Match Yield vs Spatial Distance Tolerance (d_max)
          </h3>
          <span className="text-[11px] text-text-muted">
            Sweep across 500m, 1000m, 1500m, 2000m thresholds (&Delta;t &le; 60 min)
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensitivityData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid stroke="#26364B" strokeDasharray="3 3" opacity={0.5} />
              <XAxis dataKey="tolerance" stroke="#8493A8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#8493A8"
                fontSize={11}
                tickLine={false}
                domain={[0, 100]}
                label={{
                  value: "% Matched Yield",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#8493A8",
                  fontSize: 10,
                  dy: 40,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101827",
                  borderColor: "#26364B",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="Matched %"
                stroke="#40C4D8"
                strokeWidth={3}
                dot={{ r: 4, fill: "#40C4D8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Citation Notice */}
      <div className="bg-surface-elevated border border-border p-3.5 rounded-lg text-xs flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-accent-cyan font-semibold">
          <HelpCircle className="w-4 h-4" />
          <span>FRP Non-Summation Constraint &bull; Li et al. (2018)</span>
        </div>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Because VIIRS 375 m pixels cover approximately 1/7th the ground area of a 1 km MODIS pixel, multiple VIIRS detections are frequently collocated within a single MODIS footprint. As demonstrated by <em>Li et al. (Remote Sensing of Environment, 2018)</em>, summing collocated FRP values introduces severe overestimation bias, and no universal scalar multiplier exists. FireChronicle strictly preserves separate FRP distributions and standardizes activity via equal-area spatial grid cell occupancy.
        </p>
      </div>
    </div>
  );
};
