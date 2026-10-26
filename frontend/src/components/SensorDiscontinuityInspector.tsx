"use client";

import React from "react";
import { Scale, HelpCircle } from "lucide-react";
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
      <div className="bg-[#10141B] border border-[#28313D] rounded-xl p-8 text-center text-[#A4AFBF] flex flex-col items-center justify-center gap-2">
        <span className="w-5 h-5 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
        <span className="text-xs font-normal">Loading sensor disparity and sensitivity analysis...</span>
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
    <div className="bg-[#10141B] border border-[#28313D] rounded-xl p-5 shadow-sm flex flex-col gap-6">
      {/* Title */}
      <div className="border-b border-[#28313D] pb-3">
        <h2 className="text-base font-semibold text-[#F1F5F9] flex items-center gap-2 tracking-tight">
          <Scale className="w-4 h-4 text-[#F59E0B]" />
          Sensor discontinuity and cross-matching inspector
        </h2>
        <p className="text-xs text-[#A4AFBF] mt-0.5 font-normal">
          Quantifying the physical, orbital, and geometric drivers of the MODIS-to-VIIRS observation gap
        </p>
      </div>

      {/* Side-by-Side Sensor Card Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MODIS Card */}
        <div className="bg-[#090B0F] border border-[#28313D] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between border-b border-[#28313D] pb-2 mb-3">
            <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#A78BFA] inline-block" />
              MODIS (Terra &amp; Aqua)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#151A22] text-[#A4AFBF] font-mono border border-[#28313D]">
              1000m nadir footprint
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">Total detections:</span>
              <span className="font-semibold text-[#F1F5F9] font-mono tabular-nums">{comparisonData.modis_total_detections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">Candidate matched with VIIRS:</span>
              <span className="font-semibold text-[#34D399] font-mono tabular-nums">
                {Math.round(comparisonData.matched_fraction_modis * 100)}% ({comparisonData.matched_pairs_count} pairs)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">Sensor-unique detections:</span>
              <span className="font-semibold text-[#F59E0B] font-mono tabular-nums">{comparisonData.modis_only_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">Median FRP:</span>
              <span className="font-semibold text-[#F1F5F9] font-mono tabular-nums">{qModis ? `${qModis.p50} MW` : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">95th percentile FRP:</span>
              <span className="font-semibold text-[#F1F5F9] font-mono tabular-nums">{qModis ? `${qModis.p95} MW` : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* VIIRS Card */}
        <div className="bg-[#090B0F] border border-[#28313D] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between border-b border-[#28313D] pb-2 mb-3">
            <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] inline-block" />
              VIIRS (NOAA-20, NOAA-21, S-NPP)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#151A22] text-[#A4AFBF] font-mono border border-[#28313D]">
              375m nadir footprint
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">Total detections:</span>
              <span className="font-semibold text-[#F1F5F9] font-mono tabular-nums">{comparisonData.viirs_total_detections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">Candidate matched with MODIS:</span>
              <span className="font-semibold text-[#34D399] font-mono tabular-nums">
                {Math.round(comparisonData.matched_fraction_viirs * 100)}% ({comparisonData.matched_pairs_count} pairs)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">Sensor-unique detections:</span>
              <span className="font-semibold text-[#F87171] font-mono tabular-nums">{comparisonData.viirs_only_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">Median FRP:</span>
              <span className="font-semibold text-[#F1F5F9] font-mono tabular-nums">{qViirs ? `${qViirs.p50} MW` : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AFBF] font-normal">95th percentile FRP:</span>
              <span className="font-semibold text-[#F1F5F9] font-mono tabular-nums">{qViirs ? `${qViirs.p95} MW` : "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitivity Curve Sweep */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[#F1F5F9] tracking-tight">
          Spatial match tolerance sensitivity curve
        </h3>
        <p className="text-xs text-[#A4AFBF] font-normal">
          Cross-sensor match rate as spatial tolerance (d_max) scales from 500m to 2000m
        </p>
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensitivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#28313D" strokeDasharray="3 3" />
              <XAxis dataKey="tolerance" stroke="#A4AFBF" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#A4AFBF"
                fontSize={11}
                tickLine={false}
                domain={[0, 100]}
              />
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
              <Line
                type="monotone"
                dataKey="Matched %"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 3, fill: "#F59E0B" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Citation Notice */}
      <div className="bg-[#090B0F] border border-[#28313D] p-3.5 rounded-lg text-xs flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[#F1F5F9] font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>FRP non-summation constraint &bull; Li et al. (2018)</span>
        </div>
        <p className="text-[11px] text-[#A4AFBF] leading-relaxed font-normal">
          Because VIIRS 375 m pixels cover approximately 1/7th the ground area of a 1 km MODIS pixel, multiple VIIRS detections are frequently collocated within a single MODIS footprint. As demonstrated by <em>Li et al. (Remote Sensing of Environment, 2018)</em>, summing collocated FRP values introduces severe overestimation bias, and no universal scalar multiplier exists. FireChronicle strictly preserves separate FRP distributions and standardizes activity via equal-area spatial grid cell occupancy.
        </p>
      </div>
    </div>
  );
};
