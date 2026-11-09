"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Database,
  Upload,
  User,
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
        return `${months[m]} ${parts[2]}`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  const formattedRange = `${formatDate(startDate)} – ${formatDate(endDate)}, ${startDate.split("-")[0] || "2024"}`;

  return (
    <header className="h-12 px-5 bg-transparent flex items-center justify-between shrink-0 z-20">
      {/* Left Empty or Subtle Title Indicator */}
      <div className="flex items-center gap-3">
        {/* Left area allows the page hero background to breathe */}
      </div>

      {/* Right Controls: Live Status Pill, Date Range Pill, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Live NASA FIRMS Data Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDataSourceDropdown(!showDataSourceDropdown)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#091F14]/90 hover:bg-[#0E2F1E] border border-[#166534]/50 text-[#4ADE80] text-xs font-medium transition-all shadow-[0_0_12px_rgba(34,197,94,0.15)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E] animate-pulse" />
            <span>Live NASA FIRMS Data</span>
          </button>

          {showDataSourceDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#10141E] border border-[#232938] rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#232938] pb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
                  NASA FIRMS Feed
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#171E2D] border border-[#263147] text-[#93C5FD] font-mono">
                  {isFirmsConfigured ? "Live API Connected" : "Verified 2024 Sample"}
                </span>
              </div>
              <p className="text-xs text-[#9AA3B4] leading-relaxed">
                {isFirmsConfigured
                  ? "Connected directly to NASA FIRMS API. Ingesting near-real-time thermal infrared observations."
                  : "Running verified benchmark dataset with full spatial cross-matching algorithms."}
              </p>
              {onOpenUploadModal && (
                <button
                  onClick={() => {
                    setShowDataSourceDropdown(false);
                    onOpenUploadModal();
                  }}
                  className="w-full text-center text-xs font-medium text-white hover:bg-[#1E2538] py-2 bg-[#171D2D] rounded-xl transition-colors border border-[#283248] flex items-center justify-center gap-1.5"
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
                  className="w-full text-center text-xs font-medium text-[#9AA3B4] hover:text-white py-1 transition-colors"
                >
                  View methodology &amp; citations &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date Range Pill */}
        <button
          onClick={onOpenDateSelector}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#121520]/90 hover:bg-[#181D2C] border border-[#232938] text-xs text-[#E2E8F0] font-medium transition-colors shadow-sm"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>{formattedRange}</span>
          <ChevronDown className="w-3 h-3 text-[#7B8596]" />
        </button>

        {/* User Profile Avatar */}
        <button
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EA580C] text-[#0A0B0E] flex items-center justify-center font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all"
          title="User Profile & Settings"
          aria-label="User Profile"
        >
          <User className="w-4 h-4 text-[#07080B]" />
        </button>
      </div>
    </header>
  );
};
