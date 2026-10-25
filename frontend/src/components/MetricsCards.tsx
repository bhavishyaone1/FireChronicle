"use client";

import React from "react";
import { Grid, Eye, CheckCircle2, Flame, Scale, ShieldAlert, Sparkles } from "lucide-react";
import { CalendarResponse, SensorComparisonResponse } from "@/types";

interface MetricsCardsProps {
  calendarData: CalendarResponse | null;
  comparisonData: SensorComparisonResponse | null;
  isLoading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  calendarData,
  comparisonData,
  isLoading = false,
}) => {
  const summary = calendarData?.summary;
  const rawModis = summary?.total_modis_raw ?? 0;
  const rawViirs = summary?.total_viirs_raw ?? 0;
  const rawTotal = rawModis + rawViirs;

  // SCIENTIFIC INVARIANT ENFORCEMENT:
  // If zero raw observations were detected by either sensor, collocated matches and agreement MUST be zero.
  // This prevents contradictory states (e.g., 0 raw points but 20 matches, or 0 active cells with Jaccard 0.6).
  const hasDetections = rawTotal > 0;
  const uniqueCells = hasDetections ? (summary?.total_unique_active_cells ?? 0) : 0;
  const matchedPairs = hasDetections ? (comparisonData?.matched_pairs_count ?? 0) : 0;
  const jaccard = hasDetections ? (comparisonData?.spatial_agreement_jaccard ?? 0.0) : 0.0;
  const viirsRatio = hasDetections && rawModis > 0 ? (summary?.ratio_viirs_to_modis ?? 0) : 0;

  // Calculate resolution point density bias reduction:
  // (Raw Points - Unique Active Grid Cells) / Raw Points
  const biasReductionPercent =
    hasDetections && rawTotal > uniqueCells
      ? Math.round(((rawTotal - uniqueCells) / rawTotal) * 1000) / 10
      : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 animate-pulse">
        <div className="col-span-2 bg-surface border border-border rounded-xl p-4 h-28" />
        <div className="bg-surface border border-border rounded-xl p-3 h-28" />
        <div className="bg-surface border border-border rounded-xl p-3 h-28" />
        <div className="bg-surface border border-border rounded-xl p-3 h-28" />
        <div className="bg-surface border border-border rounded-xl p-3 h-28" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      {/* 1. PRIMARY METRIC: Harmonized Active Cells (1.0 km Equal-Area) */}
      <div className="col-span-2 bg-gradient-to-br from-surface to-surface-elevated border-2 border-accent-cyan/80 rounded-xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-cyan/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-cyan flex items-center gap-1.5">
            <Grid className="w-4 h-4 text-accent-cyan" />
            Harmonized Active Cells
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan font-mono font-medium">
            1.0 km Equal-Area
          </span>
        </div>

        <div className="my-2 z-10 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-text-primary tracking-tight font-mono">
            {uniqueCells}
          </span>
          <span className="text-xs text-text-secondary font-medium">
            {uniqueCells === 1 ? "distinct cell" : "distinct cells"}
          </span>
          {biasReductionPercent > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-medium ml-auto">
              -{biasReductionPercent}% Density Bias
            </span>
          )}
        </div>

        <p className="text-[11px] text-text-muted leading-tight z-10">
          {hasDetections
            ? `Standardizes resolution: collapses ${rawTotal} raw multi-pixel sensor points into ${uniqueCells} standardized equal-area spatial cells.`
            : "No active thermal anomalies detected for the selected spatial-temporal parameters."}
        </p>
      </div>

      {/* 2. Raw MODIS Count (1000m) */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="text-xs font-semibold text-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-violet inline-block" />
            Raw MODIS
          </span>
          <span className="text-[10px] text-text-muted font-mono">1 km</span>
        </div>
        <div className="my-1.5">
          <span className="text-2xl font-bold text-accent-violet font-mono">{rawModis}</span>
          <span className="text-[10px] text-text-muted ml-1.5">detections</span>
        </div>
        <span className="text-[10px] text-text-muted">Terra & Aqua (C6.1)</span>
      </div>

      {/* 3. Raw VIIRS Count (375m) */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="text-xs font-semibold text-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-viirs-cyan inline-block" />
            Raw VIIRS
          </span>
          <span className="text-[10px] text-text-muted font-mono">375 m</span>
        </div>
        <div className="my-1.5">
          <span className="text-2xl font-bold text-viirs-cyan font-mono">{rawViirs}</span>
          <span className="text-[10px] text-text-muted ml-1.5">detections</span>
        </div>
        <span className="text-[10px] text-text-secondary font-mono">
          {viirsRatio > 0 ? `${viirsRatio}x MODIS count` : "SNPP / NOAA-20"}
        </span>
      </div>

      {/* 4. Cross-Matched Pairs */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="text-xs font-semibold text-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Cross-Matched
          </span>
          <span className="text-[10px] text-text-muted font-mono">&le; 1km / &le; 60m</span>
        </div>
        <div className="my-1.5">
          <span className="text-2xl font-bold text-emerald-300 font-mono">{matchedPairs}</span>
          <span className="text-[10px] text-text-muted ml-1.5">pairs</span>
        </div>
        <span className="text-[10px] text-text-muted">
          {hasDetections && matchedPairs > 0
            ? `${comparisonData?.modis_only_count ?? 0} MODIS / ${comparisonData?.viirs_only_count ?? 0} VIIRS unique`
            : "No collocated matches"}
        </span>
      </div>

      {/* 5. Spatial Agreement (Jaccard) */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="text-xs font-semibold text-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-accent-cyan" />
            Spatial Jaccard
          </span>
          <span className="text-[10px] text-text-muted font-mono">Agreement</span>
        </div>
        <div className="my-1.5">
          <span className="text-2xl font-bold text-text-primary font-mono">{jaccard.toFixed(3)}</span>
          <span className="text-[10px] text-text-muted ml-1.5">/ 1.0</span>
        </div>
        <span className="text-[10px] text-text-muted">Active Cell Overlap</span>
      </div>
    </div>
  );
};
