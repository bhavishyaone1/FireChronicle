"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Database,
  ExternalLink,
  Upload,
} from "lucide-react";

interface HeaderProps {
  activeMode: string;
  isBackendConnected: boolean;
  isFirmsConfigured: boolean;
  startDate: string;
  endDate: string;
  onOpenDateSelector?: () => void;
  onOpenProvenance?: () => void;
  onOpenUploadModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  isBackendConnected,
  isFirmsConfigured,
  startDate,
  endDate,
  onOpenDateSelector,
  onOpenProvenance,
  onOpenUploadModal,
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
    <header className="h-16 px-6 bg-[#08090B] border-b border-[#2A3039] flex items-center justify-between shrink-0 z-20">
      {/* Left: Project Purpose Subtitle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-normal text-[#B1B7C1] hidden sm:inline-block">
          Harmonizing <span className="text-[#A78BFA] font-medium">MODIS (1 km)</span> and{" "}
          <span className="text-[#38BDF8] font-medium">VIIRS (375 m)</span> active-fire observations
        </span>
      </div>

      {/* Right Controls: Data Source Dropdown, Quick Upload, Date Range Pill */}
      <div className="flex items-center gap-2">
        {/* Data Source Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDataSourceDropdown(!showDataSourceDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101216] hover:bg-[#171A20] border border-[#2A3039] text-xs text-[#B1B7C1] hover:text-[#F4F5F7] transition-colors"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirmsConfigured ? "bg-[#34D399]" : "bg-[#F5B32F]"
              }`}
            />
            <span className="font-medium text-[#F4F5F7]">
              {isFirmsConfigured ? "NASA FIRMS live API" : "NASA FIRMS feed"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#858D99]" />
          </button>

          {showDataSourceDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#101216] border border-[#2A3039] rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#2A3039] pb-2">
                <span className="text-xs font-medium text-[#F4F5F7] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#F5B32F]" />
                  Primary ingest source
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171A20] border border-[#2A3039] text-[#B1B7C1] font-mono">
                  {isFirmsConfigured ? "Live FIRMS API" : "Bundled benchmark"}
                </span>
              </div>
              <p className="text-xs text-[#B1B7C1] leading-relaxed font-normal">
                {isFirmsConfigured
                  ? "Connected directly to NASA FIRMS API (MAP_KEY configured). Ingests near-real-time active fire records."
                  : "Running verified NASA FIRMS benchmark sample (10–15 Aug 2024). All spatial cross-matching algorithms are active."}
              </p>
              {onOpenUploadModal && (
                <button
                  onClick={() => {
                    setShowDataSourceDropdown(false);
                    onOpenUploadModal();
                  }}
                  className="w-full text-center text-xs font-medium text-[#F4F5F7] hover:bg-[#1D222A] py-1.5 bg-[#171A20] rounded-lg transition-colors border border-[#2A3039] flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#F5B32F]" />
                  <span>Upload custom FIRMS CSV</span>
                </button>
              )}
              {onOpenProvenance && (
                <button
                  onClick={() => {
                    setShowDataSourceDropdown(false);
                    onOpenProvenance();
                  }}
                  className="w-full text-center text-xs font-medium text-[#B1B7C1] hover:text-[#F4F5F7] hover:bg-[#171A20] py-1 transition-colors"
                >
                  View methodology &amp; citations &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Upload Button */}
        {onOpenUploadModal && (
          <button
            onClick={onOpenUploadModal}
            title="Import custom NASA FIRMS CSV dataset"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101216] hover:bg-[#171A20] border border-[#2A3039] text-xs text-[#B1B7C1] hover:text-[#F4F5F7] transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#F5B32F]" />
            <span className="hidden sm:inline font-medium text-[#F4F5F7]">Upload CSV</span>
          </button>
        )}

        {/* Date Range Pill */}
        <button
          onClick={onOpenDateSelector}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101216] hover:bg-[#171A20] border border-[#2A3039] text-xs text-[#B1B7C1] hover:text-[#F4F5F7] transition-colors"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#F5B32F]" />
          <span className="font-mono text-xs tabular-nums text-[#F4F5F7]">
            {formatDate(startDate)} &mdash; {formatDate(endDate)} UTC
          </span>
          <ChevronDown className="w-3 h-3 text-[#858D99]" />
        </button>
      </div>
    </header>
  );
};
