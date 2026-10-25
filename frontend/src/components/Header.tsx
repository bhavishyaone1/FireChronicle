"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Database,
  ExternalLink,
} from "lucide-react";

interface HeaderProps {
  activeMode: string;
  isBackendConnected: boolean;
  isFirmsConfigured: boolean;
  startDate: string;
  endDate: string;
  onOpenDateSelector?: () => void;
  onOpenProvenance?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  isBackendConnected,
  isFirmsConfigured,
  startDate,
  endDate,
  onOpenDateSelector,
  onOpenProvenance,
}) => {
  const [showDataSourceDropdown, setShowDataSourceDropdown] = useState(false);

  const formatDate = (iso: string) => {
    try {
      const parts = iso.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[m]} ${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  return (
    <header className="h-14 px-6 bg-[#090A0C] border-b border-[#282D35] flex items-center justify-between shrink-0 z-20">
      {/* Left: Project Purpose Subtitle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-normal text-[#A4AAB5] hidden sm:inline-block">
          Harmonizing <span className="text-[#F3F4F6] font-medium">MODIS (1 km)</span> and{" "}
          <span className="text-[#F3F4F6] font-medium">VIIRS (375 m)</span> satellite active fire observations
        </span>
      </div>

      {/* Right Controls: Data Source Dropdown, Date Range Pill */}
      <div className="flex items-center gap-2">
        {/* Data Source Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDataSourceDropdown(!showDataSourceDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101216] hover:bg-[#16191F] border border-[#282D35] text-xs text-[#A4AAB5] hover:text-[#F3F4F6] transition-colors"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirmsConfigured ? "bg-[#10B981]" : "bg-[#F59E0B]"
              }`}
            />
            <span className="font-medium text-[#F3F4F6]">NASA FIRMS feed</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#727A88]" />
          </button>

          {showDataSourceDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#101216] border border-[#282D35] rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#282D35] pb-2">
                <span className="text-xs font-medium text-[#F3F4F6] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Primary ingest source
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16191F] border border-[#282D35] text-[#A4AAB5] font-mono">
                  {isFirmsConfigured ? "Live FIRMS API" : "Bundled benchmark"}
                </span>
              </div>
              <p className="text-xs text-[#A4AAB5] leading-relaxed font-normal">
                {isFirmsConfigured
                  ? "Connected directly to NASA FIRMS API (MAP_KEY configured). Ingests near-real-time active fire records."
                  : "Running verified NASA FIRMS benchmark sample (10–15 Aug 2024). All spatial cross-matching algorithms are active."}
              </p>
              {onOpenProvenance && (
                <button
                  onClick={() => {
                    setShowDataSourceDropdown(false);
                    onOpenProvenance();
                  }}
                  className="w-full text-center text-xs font-medium text-[#F59E0B] hover:text-[#F59E0B]/80 py-1.5 bg-[#16191F] hover:bg-[#1E2229] rounded-lg transition-colors border border-[#282D35]"
                >
                  View data provenance and citations &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date Range Pill */}
        <button
          onClick={onOpenDateSelector}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101216] hover:bg-[#16191F] border border-[#282D35] text-xs text-[#A4AAB5] hover:text-[#F3F4F6] transition-colors"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="font-mono text-xs tabular-nums text-[#F3F4F6]">
            {formatDate(startDate)} &mdash; {formatDate(endDate)} UTC
          </span>
          <ChevronDown className="w-3 h-3 text-[#727A88]" />
        </button>
      </div>
    </header>
  );
};
