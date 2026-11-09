"use client";

import React from "react";
import { Flame, Satellite, Link2, Grid, Info } from "lucide-react";
import { motion } from "motion/react";
import { CalendarResponse, SensorComparisonResponse, GeoJSONFeatureCollection } from "@/types";

interface MetricsCardsProps {
  calendarData: CalendarResponse | null;
  comparisonData: SensorComparisonResponse | null;
  geoJsonData: GeoJSONFeatureCollection | null;
  selectedDate?: string | null;
  isLoading?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
};

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
          <div key={i} className="h-26 bg-[#10141B] border border-[#28313D] rounded-xl p-4" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
    >
      {/* 1. MODIS Detections */}
      <motion.div
        variants={cardVariants}
        className="bg-[#101216] hover:bg-[#171A20] border border-[#2A3039] hover:border-[#A78BFA]/50 hover:shadow-[0_0_15px_rgba(167,139,250,0.12)] transition-all duration-200 rounded-xl p-4 flex flex-col justify-between shadow-sm"
      >
        {/* Metric Name First */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" title="Count of thermal infrared pixel anomalies detected by MODIS on Terra & Aqua satellites">
            <span className="text-[13px] font-medium text-[#B1B7C1]">
              MODIS detections
            </span>
            <Info className="w-3 h-3 text-[#858D99] hover:text-[#A78BFA] transition-colors" />
          </div>
          <Flame className="w-4 h-4 text-[#A78BFA]" aria-hidden="true" />
        </div>

        {/* Main Value Second */}
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[28px] font-semibold text-[#F4F5F7] font-mono tabular-nums leading-none tracking-tight">
            {renderValue(rawModis)}
          </span>
          <div className="shrink-0">
            {selectedDate ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171A20] text-[#A78BFA] font-mono border border-[#2A3039]">
                Single day
              </span>
            ) : (
              generateSparkline(modisSparkline, "#A78BFA")
            )}
          </div>
        </div>

        {/* Concise Explanation Below */}
        <div className="pt-2 border-t border-[#2A3039] flex items-center justify-between text-xs text-[#B1B7C1]">
          <span>Terra &amp; Aqua satellites</span>
          <span className="font-mono text-[11px] text-[#A78BFA]">1.0 km nadir</span>
        </div>
      </motion.div>

      {/* 2. VIIRS Detections */}
      <motion.div
        variants={cardVariants}
        className="bg-[#101216] hover:bg-[#171A20] border border-[#2A3039] hover:border-[#38BDF8]/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.12)] transition-all duration-200 rounded-xl p-4 flex flex-col justify-between shadow-sm"
      >
        {/* Metric Name First */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" title="Count of 375 m thermal anomalies detected by VIIRS on Suomi-NPP & NOAA-20/21">
            <span className="text-[13px] font-medium text-[#B1B7C1]">
              VIIRS detections
            </span>
            <Info className="w-3 h-3 text-[#858D99] hover:text-[#38BDF8] transition-colors" />
          </div>
          <Satellite className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
        </div>

        {/* Main Value Second */}
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[28px] font-semibold text-[#F4F5F7] font-mono tabular-nums leading-none tracking-tight">
            {renderValue(rawViirs)}
          </span>
          <div className="shrink-0">
            {selectedDate ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171A20] text-[#38BDF8] font-mono border border-[#2A3039]">
                Single day
              </span>
            ) : (
              generateSparkline(viirsSparkline, "#38BDF8")
            )}
          </div>
        </div>

        {/* Concise Explanation Below */}
        <div className="pt-2 border-t border-[#2A3039] flex items-center justify-between text-xs text-[#B1B7C1]">
          <span>NOAA-20/21 &amp; S-NPP</span>
          <span className="font-mono text-[11px] text-[#38BDF8]">375 m nadir</span>
        </div>
      </motion.div>

      {/* 3. Candidate Sensor Matches */}
      <motion.div
        variants={cardVariants}
        className="bg-[#101216] hover:bg-[#171A20] border border-[#2A3039] hover:border-[#34D399]/50 hover:shadow-[0_0_15px_rgba(52,211,153,0.12)] transition-all duration-200 rounded-xl p-4 flex flex-col justify-between shadow-sm"
      >
        {/* Metric Name First */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" title="Collocated MODIS and VIIRS detections within 1.0 km spatial distance and ≤60 minutes delta">
            <span className="text-[13px] font-medium text-[#B1B7C1]">
              Candidate correspondences
            </span>
            <Info className="w-3 h-3 text-[#858D99] hover:text-[#34D399] transition-colors" />
          </div>
          <Link2 className="w-4 h-4 text-[#34D399]" aria-hidden="true" />
        </div>

        {/* Main Value Second */}
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[28px] font-semibold text-[#F4F5F7] font-mono tabular-nums leading-none tracking-tight">
            {renderValue(matchedPairs)}
          </span>
          <div className="shrink-0">
            {selectedDate ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171A20] text-[#34D399] font-mono border border-[#2A3039]">
                Single day
              </span>
            ) : (
              generateSparkline(matchedSparkline, "#34D399")
            )}
          </div>
        </div>

        {/* Concise Explanation Below */}
        <div className="pt-2 border-t border-[#2A3039] flex items-center justify-between text-xs text-[#B1B7C1]">
          <span>Within 1.0 km &amp; 60 min</span>
          <span className="font-mono text-[11px] text-[#34D399]">Collocated pairs</span>
        </div>
      </motion.div>

      {/* 4. Unique Active Grid Cells */}
      <motion.div
        variants={cardVariants}
        className="bg-[#101216] hover:bg-[#171A20] border border-[#2A3039] hover:border-[#F5B32F]/50 hover:shadow-[0_0_15px_rgba(245,179,47,0.12)] transition-all duration-200 rounded-xl p-4 flex flex-col justify-between shadow-sm"
      >
        {/* Metric Name First */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" title="Distinct occupied 1.0 km equal-area cylindrical grid cells with active thermal radiation">
            <span className="text-[13px] font-medium text-[#B1B7C1]">
              Unique active grid cells
            </span>
            <Info className="w-3 h-3 text-[#858D99] hover:text-[#F5B32F] transition-colors" />
          </div>
          <Grid className="w-4 h-4 text-[#F5B32F]" aria-hidden="true" />
        </div>

        {/* Main Value Second */}
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[28px] font-semibold text-[#F4F5F7] font-mono tabular-nums leading-none tracking-tight">
            {renderValue(uniqueCells)}
          </span>
          <div className="shrink-0">
            {selectedDate ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171A20] text-[#F5B32F] font-mono border border-[#2A3039]">
                Single day
              </span>
            ) : (
              generateSparkline(cellsSparkline, "#F5B32F")
            )}
          </div>
        </div>

        {/* Concise Explanation Below */}
        <div className="pt-2 border-t border-[#2A3039] flex items-center justify-between text-xs text-[#B1B7C1]">
          <span>1.0 km equal-area grid</span>
          <span className="font-mono text-[11px] text-[#F5B32F]">
            Distinct cells
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
