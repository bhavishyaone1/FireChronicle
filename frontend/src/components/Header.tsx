"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  User,
  ChevronDown,
  Database,
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

  // Format date display: "2024-08-01" -> "01 Aug 2024"
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
    <header className="h-14 px-6 bg-black/95 backdrop-blur border-b border-neutral-900 flex items-center justify-between shrink-0 z-20">
      {/* Left: Project Purpose Subtitle */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-normal text-neutral-400 hidden sm:inline-block">
          Harmonizing <span className="text-orange-400 font-medium">MODIS (1 km)</span> and{" "}
          <span className="text-red-400 font-medium">VIIRS (375 m)</span> active fire hotspots
        </span>
      </div>

      {/* Right Controls: Data Source Dropdown, Date Range Pill, User Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Data Source Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDataSourceDropdown(!showDataSourceDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 transition-colors shadow-sm font-medium"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirmsConfigured ? "bg-orange-500" : "bg-red-500"
              }`}
            />
            <span>NASA FIRMS feed</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {showDataSourceDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0C0C0F] border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-orange-400" />
                  Primary ingest feed
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono">
                  {isFirmsConfigured ? "Live FIRMS API" : "Bundled benchmark"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
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
                  className="w-full text-center text-xs font-medium text-orange-400 hover:text-orange-300 py-1 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors border border-orange-500/20"
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 transition-colors shadow-sm font-medium"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-mono text-[11px] tabular-nums text-neutral-200">
            {formatDate(startDate)} &mdash; {formatDate(endDate)}
          </span>
          <ChevronDown className="w-3 h-3 text-neutral-500" />
        </button>

        {/* User / Profile Avatar */}
        <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shadow-sm cursor-pointer hover:border-neutral-700 transition-colors">
          <User className="w-3.5 h-3.5 text-neutral-300" />
        </div>
      </div>
    </header>
  );
};
