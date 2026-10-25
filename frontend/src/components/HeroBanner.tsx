"use client";

import React from "react";
import { Database, Clock, Info } from "lucide-react";

interface HeroBannerProps {
  isFirmsConfigured?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ isFirmsConfigured = false }) => {
  return (
    <div className="rounded-xl bg-[#101216] border border-[#282D35] p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Recommended Title and Subtitle */}
        <div className="flex flex-col gap-1 max-w-2xl">
          <h2 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-[#F3F4F6] leading-tight">
            Fire activity overview
          </h2>
          <p className="text-sm font-normal text-[#A4AAB5] leading-relaxed">
            Explore and compare satellite observations of active fire.
          </p>
        </div>

        {/* Right Status Chips */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Data Source Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#16191F] border border-[#282D35] text-xs">
            <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#A4AAB5] leading-none">
                Data source
              </span>
              <span className="text-xs font-medium text-[#F3F4F6] mt-0.5">
                NASA FIRMS
              </span>
            </div>
          </div>

          {/* Latest Observation Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#16191F] border border-[#282D35] text-xs">
            <Clock className="w-3.5 h-3.5 text-[#A4AAB5]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#A4AAB5] leading-none">
                Latest observation
              </span>
              <span className="text-xs font-mono tabular-nums text-[#F3F4F6] mt-0.5">
                20 Aug 2024 23:45 UTC
              </span>
            </div>
          </div>

          {/* Demonstration Mode Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#16191F] border border-[#282D35] text-xs">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirmsConfigured ? "bg-[#10B981]" : "bg-[#F59E0B]"
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#F3F4F6]">
                {isFirmsConfigured ? "Live satellite feed" : "Demonstration data"}
              </span>
              <span className="text-[10px] text-[#A4AAB5] mt-0.5">
                {isFirmsConfigured ? "Active FIRMS key" : "Verified sample benchmark"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
