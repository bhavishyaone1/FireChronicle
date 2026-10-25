"use client";

import React from "react";
import { Database, Clock, Flame, ShieldAlert } from "lucide-react";

interface HeroBannerProps {
  isFirmsConfigured?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ isFirmsConfigured = false }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-black via-[#140603] to-black border border-red-900/40 p-6 shadow-2xl shadow-red-950/20">
      {/* Visual atmospheric space/thermal horizon glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 right-10 w-80 h-40 rounded-full bg-orange-600/10 blur-2xl pointer-events-none" />
      
      {/* Subtle thermal ember texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Welcome Copy */}
        <div className="flex flex-col gap-1 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Welcome back,
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Explore fire activity across the globe
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed mt-0.5">
            Compare <span className="text-orange-400 font-semibold">MODIS</span> and{" "}
            <span className="text-red-400 font-semibold">VIIRS</span> detections, analyze patterns, and discover insights from historical satellite data.
          </p>
        </div>

        {/* Right Status Chips */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Data Source Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E0E12] border border-orange-500/30 shadow-sm backdrop-blur">
            <Database className="w-3.5 h-3.5 text-orange-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 leading-none">
                Data Source
              </span>
              <span className="text-xs font-extrabold text-white leading-tight">
                NASA FIRMS
              </span>
            </div>
          </div>

          {/* Latest Update Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E0E12] border border-red-500/30 shadow-sm backdrop-blur">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 leading-none">
                Latest Update
              </span>
              <span className="text-xs font-extrabold text-white leading-tight">
                Aug 20, 2024 23:45 UTC
              </span>
            </div>
          </div>

          {/* Mode Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 shadow-md shadow-red-950/40 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-400" />
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-white leading-tight">
                {isFirmsConfigured ? "Live Feed" : "Demo Mode"}
              </span>
              <span className="text-[9px] text-orange-300 leading-none font-medium">
                {isFirmsConfigured ? "FIRMS MAP_KEY active" : "Sample benchmark data"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
