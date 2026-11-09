"use client";

import React from "react";
import { DatasetProvenance } from "@/types";

interface HeroBannerProps {
  isFirmsConfigured?: boolean;
  provenance?: DatasetProvenance | null;
  latestRecordDate?: string | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = () => {
  return (
    <div className="relative pt-1 pb-1">
      {/* Warm Ambient Glow behind Title */}
      <div className="absolute -top-4 left-0 w-96 h-24 bg-orange-600/10 blur-3xl pointer-events-none" />

      {/* Main Title Row with Vertical Ember Gradient Accent */}
      <div className="relative z-10 flex items-center gap-3.5">
        {/* Vertical glowing gradient line */}
        <div className="w-1.5 h-11 rounded-full bg-gradient-to-b from-[#FFAA00] via-[#FF6600] to-[#E52E06] shadow-[0_0_14px_rgba(255,102,0,0.7)] shrink-0" />

        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-white flex items-center gap-2 leading-none">
            <span>Fire</span>
            <span className="text-[#FF7A1A]">Activity</span>
            <span>Overview</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-[#9AA3B4] mt-1.5 font-normal">
            Explore and analyse satellite observations of active fires across the globe.
          </p>
        </div>
      </div>
    </div>
  );
};
