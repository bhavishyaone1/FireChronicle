"use client";

import React from "react";
import { Database, Clock, Sparkles, CheckCircle2 } from "lucide-react";

interface HeroBannerProps {
  isFirmsConfigured?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ isFirmsConfigured = false }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D1526] via-[#101A30] to-[#0D1526] border border-sky-900/30 p-6 shadow-xl">
      {/* Visual atmospheric space horizon glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 right-10 w-80 h-40 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
      
      {/* Subtle star particle simulation dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Welcome Copy */}
        <div className="flex flex-col gap-1 max-w-2xl">
          <span className="text-xs font-medium text-slate-400">Welcome back,</span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Explore fire activity across the globe
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
            Compare MODIS and VIIRS detections, analyze patterns, and discover insights from historical satellite data.
          </p>
        </div>

        {/* Right Status Chips */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Data Source Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131E33]/90 border border-slate-700/60 shadow-sm backdrop-blur">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 leading-none">
                Data Source
              </span>
              <span className="text-xs font-bold text-white leading-tight">
                NASA FIRMS
              </span>
            </div>
          </div>

          {/* Latest Update Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131E33]/90 border border-slate-700/60 shadow-sm backdrop-blur">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 leading-none">
                Latest Update
              </span>
              <span className="text-xs font-bold text-white leading-tight">
                Aug 20, 2024 23:45 UTC
              </span>
            </div>
          </div>

          {/* Mode Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 shadow-sm backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">
                {isFirmsConfigured ? "Live Feed" : "Demo Mode"}
              </span>
              <span className="text-[9px] text-emerald-400/80 leading-none">
                {isFirmsConfigured ? "FIRMS MAP_KEY active" : "Sample benchmark data"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
