"use client";

import React, { useState } from "react";
import {
  Satellite,
  Calendar as CalendarIcon,
  User,
  ChevronDown,
  Database,
  ExternalLink,
  Info,
  ShieldCheck,
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
    <header className="h-16 px-6 bg-[#0B0F17]/90 backdrop-blur border-b border-[#1E293B]/80 flex items-center justify-between shrink-0 z-20">
      {/* Left: Project Purpose Subtitle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 hidden sm:inline-block">
          Harmonizing MODIS &amp; VIIRS Hotspots for a Clearer View of Our Planet
        </span>
      </div>

      {/* Right Controls: Data Source Dropdown, Date Range Pill, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Data Source Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDataSourceDropdown(!showDataSourceDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131B2B] hover:bg-[#1A253A] border border-white/10 text-xs text-slate-200 transition-colors shadow-sm"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFirmsConfigured ? "bg-emerald-400" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="font-semibold text-white">NASA FIRMS Data</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showDataSourceDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#131B2B] border border-slate-700/80 rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  Primary Ingest Feed
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                  {isFirmsConfigured ? "Live FIRMS API" : "Bundled Benchmark"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
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
                  className="w-full text-center text-xs font-medium text-amber-400 hover:text-amber-300 py-1 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
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
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#131B2B] hover:bg-[#1A253A] border border-white/10 text-xs text-slate-200 transition-colors shadow-sm"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-300">
            {formatDate(startDate)} &mdash; {formatDate(endDate)}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* User / Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500/40 flex items-center justify-center text-slate-300 shadow-sm cursor-pointer hover:border-slate-400 transition-colors">
          <User className="w-4 h-4 text-slate-200" />
        </div>
      </div>
    </header>
  );
};
