"use client";

import React from "react";
import { Flame, Satellite, Link2, Grid } from "lucide-react";
import { CalendarResponse, SensorComparisonResponse, GeoJSONFeatureCollection } from "@/types";

interface MetricsCardsProps {
  calendarData: CalendarResponse | null;
  comparisonData: SensorComparisonResponse | null;
  geoJsonData: GeoJSONFeatureCollection | null;
  selectedDate?: string | null;
  isLoading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  calendarData,
  comparisonData,
  geoJsonData,
  selectedDate,
  isLoading = false,
}) => {
  const isDataAvailable = geoJsonData !== null;
  const features = geoJsonData?.features || [];

  // SCIENTIFIC SOURCE OF TRUTH:
  // Derived directly from the active filtered observations (respects AOI, dates, sensor filters, and single-date focus)
  const rawModis = isDataAvailable
    ? features.filter((f) => f.properties.sensor === "MODIS").length
    : null;

  const rawViirs = isDataAvailable
    ? features.filter((f) => f.properties.sensor === "VIIRS").length
    : null;

  const matchedPairs = isDataAvailable
    ? (comparisonData?.matched_pairs_count ?? 0)
    : null;

  // Unique active grid cells: count of distinct occupied grid IDs
  const distinctGridIds = isDataAvailable
    ? new Set(features.map((f) => f.properties.grid_cell_id).filter(Boolean))
    : null;
  const uniqueCells = distinctGridIds !== null ? distinctGridIds.size : null;

  const days = calendarData?.days || [];

  // Helper to generate clean, minimal SVG sparklines
  const generateSparkline = (values: number[], strokeColor: string) => {
    if (!values || values.length === 0 || Math.max(...values) === 0) {
      return (
        <svg className="w-16 h-5 overflow-visible" viewBox="0 0 64 20" aria-hidden="true">
          <line
            x1="0"
            y1="10"
            x2="64"
            y2="10"
            stroke="#282D35"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        </svg>
      );
    }

    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const width = 64;
    const height = 20;
    const padding = 2;

    const points = values.map((val, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return (
      <svg className="w-16 h-5 overflow-visible" viewBox="0 0 64 20" aria-hidden="true">
        <path
          d={`M ${points.join(" L ")}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const modisSparkline = days.map((d) => d.modis_raw_count);
  const viirsSparkline = days.map((d) => d.viirs_raw_count);
  const matchedSparkline = days.map((d) => d.matched_active_cells);
  const cellsSparkline = days.map((d) => d.unique_active_cells);

  const renderValue = (val: number | null) => {
    if (val === null) return "—";
    return val.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-26 bg-[#101216] border border-[#282D35] rounded-xl p-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. MODIS Detections */}
      <div className="bg-[#101216] border border-[#282D35] rounded-xl p-4 flex flex-col justify-between shadow-sm">
        {/* Metric Name First */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#A4AAB5]">
            MODIS detections
          </span>
          <Flame className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
        </div>

        {/* Main Value Second */}
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[28px] font-semibold text-[#F3F4F6] font-mono tabular-nums leading-none tracking-tight">
            {renderValue(rawModis)}
          </span>
          <div className="shrink-0">
            {selectedDate ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16191F] text-[#F59E0B] font-mono border border-[#282D35]">
                Single day
              </span>
            ) : (
              generateSparkline(modisSparkline, "#F59E0B")
            )}
          </div>
        </div>

        {/* Concise Explanation Below */}
        <div className="pt-2 border-t border-[#282D35] flex items-center justify-between text-xs text-[#A4AAB5]">
          <span>Terra and Aqua satellites</span>
          <span className="font-mono text-[11px] text-[#A4AAB5]">1.0 km nadir</span>
        </div>
      </div>

      {/* 2. VIIRS Detections */}
      <div className="bg-[#101216] border border-[#282D35] rounded-xl p-4 flex flex-col justify-between shadow-sm">
        {/* Metric Name First */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#A4AAB5]">
            VIIRS detections
          </span>
          <Satellite className="w-4 h-4 text-red-400" aria-hidden="true" />
        </div>

        {/* Main Value Second */}
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[28px] font-semibold text-[#F3F4F6] font-mono tabular-nums leading-none tracking-tight">
            {renderValue(rawViirs)}
          </span>
          <div className="shrink-0">
            {selectedDate ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16191F] text-red-400 font-mono border border-[#282D35]">
                Single day
              </span>
            ) : (
              generateSparkline(viirsSparkline, "#EF4444")
            )}
          </div>
        </div>

        {/* Concise Explanation Below */}
        <div className="pt-2 border-t border-[#282D35] flex items-center justify-between text-xs text-[#A4AAB5]">
          <span>NOAA-20/21 &amp; S-NPP</span>
          <span className="font-mono text-[11px] text-[#A4AAB5]">375 m nadir</span>
        </div>
      </div>

      {/* 3. Candidate Sensor Matches */}
      <div className="bg-[#101216] border border-[#282D35] rounded-xl p-4 flex flex-col justify-between shadow-sm">
        {/* Metric Name First */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#A4AAB5]">
            Candidate sensor matches
          </span>
          <Link2 className="w-4 h-4 text-blue-400" aria-hidden="true" />
        </div>

        {/* Main Value Second */}
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[28px] font-semibold text-[#F3F4F6] font-mono tabular-nums leading-none tracking-tight">
            {renderValue(matchedPairs)}
          </span>
          <div className="shrink-0">
            {selectedDate ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16191F] text-blue-400 font-mono border border-[#282D35]">
                Single day
              </span>
            ) : (
              generateSparkline(matchedSparkline, "#3B82F6")
            )}
          </div>
        </div>

        {/* Concise Explanation Below */}
        <div className="pt-2 border-t border-[#282D35] flex items-center justify-between text-xs text-[#A4AAB5]">
          <span>Within 1.0 km &amp; 60 min</span>
          <span className="font-mono text-[11px] text-blue-400">Collocated pairs</span>
        </div>
      </div>

      {/* 4. Unique Active Grid Cells */}
      <div className="bg-[#101216] border border-[#282D35] rounded-xl p-4 flex flex-col justify-between shadow-sm">
        {/* Metric Name First */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#A4AAB5]">
            Unique active grid cells
          </span>
          <Grid className="w-4 h-4 text-emerald-400" aria-hidden="true" />
        </div>

        {/* Main Value Second */}
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[28px] font-semibold text-[#F3F4F6] font-mono tabular-nums leading-none tracking-tight">
            {renderValue(uniqueCells)}
          </span>
          <div className="shrink-0">
            {selectedDate ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16191F] text-emerald-400 font-mono border border-[#282D35]">
                Single day
              </span>
            ) : (
              generateSparkline(cellsSparkline, "#10B981")
            )}
          </div>
        </div>

        {/* Concise Explanation Below (removed -55.9% bias badge) */}
        <div className="pt-2 border-t border-[#282D35] flex items-center justify-between text-xs text-[#A4AAB5]">
          <span>1.0 km equal-area grid</span>
          <span className="font-mono text-[11px] text-emerald-400">
            Distinct cells
          </span>
        </div>
      </div>
    </div>
  );
};
