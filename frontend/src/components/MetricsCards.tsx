"use client";

import React from "react";
import { Grid, Eye, CheckCircle2, Zap, Flame, Scale } from "lucide-react";
import { CalendarResponse, SensorComparisonResponse } from "@/types";

interface MetricsCardsProps {
  calendarData: CalendarResponse | null;
  comparisonData: SensorComparisonResponse | null;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  calendarData,
  comparisonData,
}) => {
  const summary = calendarData?.summary;
  const uniqueCells = summary?.total_unique_active_cells || 0;
  const rawModis = summary?.total_modis_raw || 0;
  const rawViirs = summary?.total_viirs_raw || 0;
  const viirsRatio = summary?.ratio_viirs_to_modis || 0;
  const matchedPairs = comparisonData?.matched_pairs_count || 0;
  const jaccard = comparisonData?.spatial_agreement_jaccard || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      {/* 1. Harmonized Metric */}
      <div className="col-span-2 bg-gradient-to-br from-nasa-card to-nasa-card/60 border-2 border-nasa-cyan/60 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-nasa-cyan flex items-center gap-1.5">
            <Grid className="w-4 h-4" />
            Harmonized Active Cells
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan font-mono font-medium">
            1.0 km Equal-Area
          </span>
        </div>
        <div className="my-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{uniqueCells}</span>
          <span className="text-xs text-nasa-slate ml-2">occupied cells</span>
        </div>
        <p className="text-[11px] text-gray-300 leading-tight">
          Reduces sensor resolution bias by collapsing multi-pixel VIIRS clusters within 1 km cells.
        </p>
      </div>

      {/* 2. Raw MODIS Count */}
      <div className="bg-nasa-card/80 border border-nasa-border rounded-xl p-3 flex flex-col justify-between">
        <div className="text-xs font-medium text-nasa-slate flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          Raw MODIS
        </div>
        <div className="my-1">
          <span className="text-2xl font-bold text-blue-300">{rawModis}</span>
          <span className="text-[10px] text-nasa-slate ml-1">pts (1 km)</span>
        </div>
        <span className="text-[10px] text-gray-400">Terra & Aqua</span>
      </div>

      {/* 3. Raw VIIRS Count */}
      <div className="bg-nasa-card/80 border border-nasa-border rounded-xl p-3 flex flex-col justify-between">
        <div className="text-xs font-medium text-nasa-slate flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-nasa-orange" />
          Raw VIIRS
        </div>
        <div className="my-1">
          <span className="text-2xl font-bold text-nasa-orange">{rawViirs}</span>
          <span className="text-[10px] text-nasa-slate ml-1">pts (375m)</span>
        </div>
        <span className="text-[10px] text-amber-300 font-mono">
          {viirsRatio > 0 ? `${viirsRatio}x MODIS count` : "No ratio"}
        </span>
      </div>

      {/* 4. Matched Pairs */}
      <div className="bg-nasa-card/80 border border-nasa-border rounded-xl p-3 flex flex-col justify-between">
        <div className="text-xs font-medium text-nasa-slate flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          Cross-Matched
        </div>
        <div className="my-1">
          <span className="text-2xl font-bold text-green-300">{matchedPairs}</span>
          <span className="text-[10px] text-nasa-slate ml-1">pairs</span>
        </div>
        <span className="text-[10px] text-gray-400">Within ≤ 1km & ≤ 60m</span>
      </div>

      {/* 5. Spatial Jaccard Agreement */}
      <div className="bg-nasa-card/80 border border-nasa-border rounded-xl p-3 flex flex-col justify-between">
        <div className="text-xs font-medium text-nasa-slate flex items-center gap-1">
          <Scale className="w-3.5 h-3.5 text-purple-400" />
          Spatial Jaccard
        </div>
        <div className="my-1">
          <span className="text-2xl font-bold text-purple-300">{jaccard}</span>
          <span className="text-[10px] text-nasa-slate ml-1">/ 1.0</span>
        </div>
        <span className="text-[10px] text-gray-400">Cell Overlap Ratio</span>
      </div>
    </div>
  );
};
