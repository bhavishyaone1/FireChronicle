"use client";

import React, { useState } from "react";
import {
  Satellite,
  Calendar as CalendarIcon,
  User,
  ChevronDown,
  Database,
  Flame,
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

  // Format date display: "2024-08-01" -> "Aug 01, 2024"
  const formatDate = (iso: string) => {
    try {
      const parts = iso.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = parseInt(parts[1], 10) - 1;
        return `${months[m]} ${parts[2]}, ${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  return (
    <header className="h-16 px-6 bg-black/95 backdrop-blur border-b border-neutral-900 flex items-center justify-between shrink-0 z-20">
      {/* Left: Project Purpose Subtitle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-neutral-300 hidden sm:inline-block">
          Harmonizing <span className="text-orange-400 font-bold">MODIS</span> &amp;{" "}
          <span className="text-red-400 font-bold">VIIRS</span> Hotspots for a Clearer View of Our Planet
        </span>
      </div>

      {/* Right Controls: Data Source Dropdown, Date Range Pill, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Data Source Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDataSourceDropdown(!showDataSourceDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0C0C0E] hover:bg-[#141418] border border-orange-500/30 hover:border-orange-500/60 text-xs text-neutral-200 transition-colors shadow-sm"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFirmsConfigured ? "bg-orange-500 shadow-sm shadow-orange-500" : "bg-red-500 animate-pulse shadow-sm shadow-red-500"
              }`}
            />
            <span className="font-bold text-white">NASA FIRMS Data</span>
            <ChevronDown className="w-3.5 h-3.5 text-orange-400" />
          </button>

          {showDataSourceDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0C0C0E] border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-orange-400" />
                  Primary Ingest Feed
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-mono font-bold">
                  {isFirmsConfigured ? "Live FIRMS API" : "Bundled Benchmark"}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {isFirmsConfigured
                  ? "Connected directly to NASA FIRMS API (MAP_KEY active). Ingests near-real-time standard active fire observations."
                  : "Running verified NASA FIRMS sample fixture (Aug 10–15, 2024). All spatial cross-matching and burning activity calendar algorithms are active."}
              </p>
              {onOpenProvenance && (
                <button
                  onClick={() => {
                    setShowDataSourceDropdown(false);
                    onOpenProvenance();
                  }}
                  className="w-full text-center text-xs font-bold text-orange-400 hover:text-orange-300 py-1 bg-orange-500/15 hover:bg-orange-500/25 rounded-lg transition-colors border border-orange-500/30"
                >
                  View Data Provenance &amp; Citations &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date Range Pill */}
        <button
          onClick={onOpenDateSelector}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0C0C0E] hover:bg-[#141418] border border-orange-500/30 hover:border-orange-500/60 text-xs text-neutral-200 transition-colors shadow-sm"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-semibold text-neutral-200">
            {formatDate(startDate)} &mdash; {formatDate(endDate)}
          </span>
          <ChevronDown className="w-3 h-3 text-orange-400" />
        </button>

        {/* User / Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-900 via-orange-950 to-red-950 border border-orange-500/50 flex items-center justify-center text-orange-300 shadow-md shadow-orange-950/40 cursor-pointer hover:border-orange-400 transition-colors">
          <User className="w-4 h-4 text-orange-200" />
        </div>
      </div>
    </header>
  );
};
