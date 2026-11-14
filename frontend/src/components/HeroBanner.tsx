"use client";

import React from "react";
import { Flame, Calendar, Sparkles, HelpCircle, Layers, ArrowRight, ShieldCheck } from "lucide-react";
import { DatasetProvenance } from "@/types";

interface HeroBannerProps {
  isFirmsConfigured?: boolean;
  provenance?: DatasetProvenance | null;
  latestRecordDate?: string | null;
  onOpenDataExplainer?: () => void;
  onSelectTab?: (tab: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  provenance,
  onOpenDataExplainer,
  onSelectTab,
}) => {
  return (
    <div className="relative pt-1 pb-2">
      {/* Warm Ambient Glow behind Title */}
      <div className="absolute -top-4 left-0 w-96 h-28 bg-orange-600/10 blur-3xl pointer-events-none" />

      {/* 1. Official NASA Space Apps Challenge Badge & Core Identification */}
      <div className="relative z-10 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/40 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/30 shrink-0" />
            <span>NASA Space Apps Challenge 2026 &bull; Harmonization of MODIS and VIIRS Hot Spots</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>19.2% Bias Mitigated &bull; Resolution-Invariant Grid</span>
          </div>
        </div>

        {/* 2. Main Title Row with Vertical Ember Gradient Accent */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Vertical glowing gradient line */}
            <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-[#FFAA00] via-[#FF6600] to-[#E52E06] shadow-[0_0_16px_rgba(255,102,0,0.7)] shrink-0" />

            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 leading-none">
                <span className="bg-gradient-to-r from-[#FFAA00] via-[#FF7A1A] to-[#FF4500] bg-clip-text text-transparent">
                  FireChronicle
                </span>
                <span className="text-white text-lg sm:text-2xl font-bold font-sans tracking-normal">
                  Harmonized Fire Intelligence
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#9AA3B4] mt-1 font-normal max-w-3xl leading-relaxed">
                Harmonizing over two decades of discontinuous active-fire satellite telemetry (MODIS 1 km &bull; VIIRS 375 m) into a unified, bias-mitigated burning activity calendar for early warning and fire management.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-center">
            {onOpenDataExplainer && (
              <button
                type="button"
                onClick={onOpenDataExplainer}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/40 hover:bg-orange-500/25 transition-all text-xs font-semibold shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How Harmonization Works</span>
              </button>
            )}
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab("calendar")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 transition-all text-xs font-medium"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Activity Calendar</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* 3. The 3 Core Pillars (The USP & Problem Statement Solved) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-1">
          {/* Pillar 1: The Discontinuity Problem */}
          <div className="rounded-xl p-2.5 px-3 bg-[#0E121B]/90 border border-slate-800/80 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>1. The Satellite Discontinuity</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              MODIS (1 km) and VIIRS (375 m) cannot be directly compared. VIIRS generates up to <strong className="text-slate-200">7&times; to 23&times; more detections</strong> for the exact same fire front, creating artificial burning surges.
            </p>
          </div>

          {/* Pillar 2: The Core Harmonization Solution (USP) */}
          <div className="rounded-xl p-2.5 px-3 bg-[#0E121B]/90 border border-orange-500/30 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Our Equal-Area Engine (USP)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Projects all detections into <strong className="text-white">1 km equal-area cylindrical cells</strong> (<code className="text-amber-300 font-mono text-[10px]">unique_active_cells</code>), mitigating raw point density inflation by <strong className="text-emerald-400 font-mono">19.2%</strong>.
            </p>
          </div>

          {/* Pillar 3: The Scientific Result */}
          <div className="rounded-xl p-2.5 px-3 bg-[#0E121B]/90 border border-slate-800/80 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Burning Activity Calendar</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Outputs an unbroken 20-year burning calendar, dual-channel Kelvin radiometry, and honest thermal anomaly classes (<strong className="text-slate-200">Reported FIRMS</strong> vs <strong className="text-slate-200">Inferred NRT</strong>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
