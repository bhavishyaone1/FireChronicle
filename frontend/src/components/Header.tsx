"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Database,
  Upload,
  User,
  AlertTriangle,
  Radio,
  Info,
} from "lucide-react";
import { DatasetProvenance } from "@/types";

interface HeaderProps {
  activeMode: string;
  isBackendConnected: boolean;
  connectionStatus?: "connecting" | "connected" | "warming_up" | "offline";
  isFirmsConfigured: boolean;
  startDate: string;
  endDate: string;
  provenance?: DatasetProvenance | null;
  onOpenDateSelector?: () => void;
  onOpenProvenance?: () => void;
  onOpenUploadModal?: () => void;
  onOpenDataExplainer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isBackendConnected,
  connectionStatus = "connected",
  isFirmsConfigured,
  startDate,
  endDate,
  provenance,
  onOpenDateSelector,
  onOpenProvenance,
  onOpenUploadModal,
  onOpenDataExplainer,
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

  const formattedRange = `${formatDate(startDate)} – ${formatDate(endDate)}, ${startDate.split("-")[0] || "2026"}`;

  // Provenance Badge Styling
  const getProvenanceBadge = () => {
    if (connectionStatus === "connecting" || connectionStatus === "warming_up") {
      return {
        pillClass: "bg-[#251A08]/90 hover:bg-[#34240B] border-[#D97706]/60 text-[#FCD34D] shadow-[0_0_12px_rgba(245,158,11,0.2)]",
        dotClass: "bg-[#F59E0B] shadow-[0_0_6px_#F59E0B] animate-pulse",
        label: connectionStatus === "warming_up" ? "Connecting to Engine..." : "Initializing Telemetry...",
        chipText: "Cloud Engine Synchronizing",
      };
    }
    if (!isBackendConnected) {
      return {
        pillClass: "bg-[#2A0F12]/90 hover:bg-[#3D1418] border-[#991B1B]/60 text-[#FCA5A5] shadow-[0_0_12px_rgba(239,68,68,0.2)]",
        dotClass: "bg-[#EF4444] shadow-[0_0_6px_#EF4444]",
        label: "Offline / Standby",
        chipText: "Bundled Sample Data",
      };
    }
    if (provenance?.provenance_type === "LIVE_NASA_FIRMS") {
      return {
        pillClass: "bg-[#091F14]/90 hover:bg-[#0E2F1E] border-[#166534]/50 text-[#4ADE80] shadow-[0_0_12px_rgba(34,197,94,0.15)]",
        dotClass: "bg-[#22C55E] shadow-[0_0_6px_#22C55E] animate-pulse",
        label: "Live NASA FIRMS Data",
        chipText: "Live API Connected",
      };
    }
    if (provenance?.provenance_type === "UPLOADED_NASA_FIRMS_CSV") {
      return {
        pillClass: "bg-[#08222E]/90 hover:bg-[#0D2F3E] border-[#0E7490]/60 text-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.2)]",
        dotClass: "bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]",
        label: "User Uploaded CSV",
        chipText: "Custom FIRMS CSV",
      };
    }
    if (provenance?.provenance_type === "SYNTHETIC_DEMO") {
      return {
        pillClass: "bg-[#251508]/90 hover:bg-[#341F0E] border-[#C2410C]/60 text-[#FB923C] shadow-[0_0_12px_rgba(249,115,22,0.2)]",
        dotClass: "bg-[#F97316] shadow-[0_0_6px_#F97316]",
        label: "Bundled Sample Data",
        chipText: "Synthetic Demo Fixture",
      };
    }
    return {
      pillClass: "bg-[#1E1906]/90 hover:bg-[#2D250A] border-[#A16207]/60 text-[#FBBF24] shadow-[0_0_12px_rgba(245,158,11,0.2)]",
      dotClass: "bg-[#EAB308] shadow-[0_0_6px_#EAB308]",
      label: "NASA FIRMS Archive (1.13M Records)",
      chipText: "Verified NASA Archive",
    };
  };

  const badge = getProvenanceBadge();

  return (
    <header className="h-12 px-5 bg-transparent flex items-center justify-between shrink-0 z-20">
      {/* Left Empty or Subtle Title Indicator */}
      <div className="flex items-center gap-3">
        {/* Left area allows the page hero background to breathe */}
      </div>

      {/* Right Controls: Dynamic Provenance Pill, Date Range Pill, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Data Provenance Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDataSourceDropdown(!showDataSourceDropdown)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${badge.pillClass}`}
            title="Click to inspect data source provenance and telemetry integrity"
          >
            <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
            <span>{badge.label}</span>
          </button>

          {showDataSourceDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#10141E] border border-[#232938] rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#232938] pb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Data Provenance
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#171E2D] border border-[#263147] text-[#93C5FD] font-mono">
                  {badge.chipText}
                </span>
              </div>
              <p className="text-xs text-[#9AA3B4] leading-relaxed">
                {provenance?.description || (
                  isBackendConnected
                    ? "Verified NASA FIRMS Collection 6.1 (MODIS) and Collection 2 (VIIRS) canonical archive for India."
                    : "Backend server is currently offline or unreachable. Displaying local bundled demonstration data."
                )}
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

        {/* How Data Works Button */}
        {onOpenDataExplainer && (
          <button
            onClick={onOpenDataExplainer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121520]/90 hover:bg-[#181D2C] border border-[#232938] text-xs text-[#E2E8F0] hover:text-[#F5B32F] font-medium transition-colors shadow-sm"
            title="How the Data Works: Ingestion, matching, and harmonization"
          >
            <Info className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden sm:inline">How Data Works</span>
          </button>
        )}

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
