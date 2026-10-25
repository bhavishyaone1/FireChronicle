"use client";

import React from "react";
import { Database, Clock } from "lucide-react";

interface HeroBannerProps {
  isFirmsConfigured?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ isFirmsConfigured = false }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-black via-neutral-950 to-black border border-neutral-800/80 p-5 shadow-lg">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Welcome Copy: Exact 28px weight 600 Title and 14px weight 400 Body */}
        <div className="flex flex-col gap-1 max-w-2xl">
          <span className="text-xs font-normal text-neutral-400">
            Overview
          </span>
          <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-white leading-tight">
            Explore fire activity across the globe
          </h2>
          <p className="text-sm font-normal text-neutral-300 leading-relaxed mt-0.5">
            Compare MODIS and VIIRS active-fire hotspot detections, analyze temporal patterns, and discover insights from satellite data.
          </p>
        </div>

        {/* Right Status Chips */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Data Source Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 shadow-sm">
            <Database className="w-3.5 h-3.5 text-orange-400" />
            <div className="flex flex-col">
              <span className="text-[11px] font-normal text-neutral-400 leading-none">
                Data source
              </span>
              <span className="text-[13px] font-semibold text-white leading-tight mt-0.5">
                NASA FIRMS
              </span>
            </div>
          </div>

          {/* Latest Update Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <div className="flex flex-col">
              <span className="text-[11px] font-normal text-neutral-400 leading-none">
                Latest update
              </span>
              <span className="text-[12px] font-mono tabular-nums font-medium text-white leading-tight mt-0.5">
                20 Aug 2024 23:45 UTC
              </span>
            </div>
          </div>

          {/* Mode Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-red-900/50 text-red-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-white leading-tight">
                {isFirmsConfigured ? "Live feed" : "Demo mode"}
              </span>
              <span className="text-[11px] text-neutral-400 leading-none mt-0.5">
                {isFirmsConfigured ? "FIRMS key active" : "Sample benchmark data"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
