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
    <header className="h-14 px-6 bg-[#090B0F] border-b border-[#28313D] flex items-center justify-between shrink-0 z-20">
      {/* Left: Project Purpose Subtitle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-normal text-[#A4AFBF] hidden sm:inline-block">
          Harmonizing <span className="text-[#A78BFA] font-medium">MODIS (1 km)</span> and{" "}
          <span className="text-[#38BDF8] font-medium">VIIRS (375 m)</span> satellite active fire observations
        </span>
      </div>

      {/* Right Controls: Data Source Dropdown, Date Range Pill */}
      <div className="flex items-center gap-2">
        {/* Data Source Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDataSourceDropdown(!showDataSourceDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10141B] hover:bg-[#151A22] border border-[#28313D] text-xs text-[#A4AFBF] hover:text-[#F1F5F9] transition-colors"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirmsConfigured ? "bg-[#34D399]" : "bg-[#F59E0B]"
              }`}
            />
            <span className="font-medium text-[#F1F5F9]">NASA FIRMS feed</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6E7A8A]" />
          </button>

          {showDataSourceDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#10141B] border border-[#28313D] rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#28313D] pb-2">
                <span className="text-xs font-medium text-[#F1F5F9] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Primary ingest source
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#151A22] border border-[#28313D] text-[#A4AFBF] font-mono">
                  {isFirmsConfigured ? "Live FIRMS API" : "Bundled benchmark"}
                </span>
              </div>
              <p className="text-xs text-[#A4AFBF] leading-relaxed font-normal">
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
                  className="w-full text-center text-xs font-medium text-[#F59E0B] hover:text-[#F59E0B]/80 py-1.5 bg-[#151A22] hover:bg-[#1E242E] rounded-lg transition-colors border border-[#28313D]"
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10141B] hover:bg-[#151A22] border border-[#28313D] text-xs text-[#A4AFBF] hover:text-[#F1F5F9] transition-colors"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="font-mono text-xs tabular-nums text-[#F1F5F9]">
            {formatDate(startDate)} &mdash; {formatDate(endDate)} UTC
          </span>
          <ChevronDown className="w-3 h-3 text-[#6E7A8A]" />
        </button>
      </div>
    </header>
  );
};
