"use client";

import React from "react";
import {
  Flame,
  LayoutDashboard,
  Calendar,
  SlidersHorizontal,
  TrendingUp,
  BookOpen,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "calendar", label: "Activity Calendar", icon: Calendar },
    { id: "compare", label: "Sensor Comparison", icon: SlidersHorizontal },
    { id: "anomalies", label: "Historical Patterns", icon: TrendingUp },
    { id: "methodology", label: "Methodology", icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-[#0B0F17] border-r border-[#1E293B]/80 flex flex-col justify-between shrink-0 select-none z-30">
      {/* Top Logo and Navigation */}
      <div className="p-5 flex flex-col gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/40 shrink-0">
            <Flame className="w-6 h-6 text-white fill-white/20" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              FireChronicle
            </h1>
            <span className="text-[11px] font-medium text-slate-400 tracking-wide">
              Satellite Fire Activity Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5 pt-2" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#1E293B] text-white shadow-inner border border-white/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#131B2B]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-amber-400" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Inspiration Card & Space Apps Badge */}
      <div className="p-5 flex flex-col gap-4">
        {/* Curved Space Orbit Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111C2E] to-[#0A111E] border border-sky-900/30 p-4 shadow-xl">
          {/* Subtle star particles / atmospheric curvature glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-blue-600/15 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-sky-400 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Earth Observation</span>
            </div>
            <p className="text-xs font-bold text-white leading-tight">
              Better data. <br />
              Safer tomorrow.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              FireChronicle turns satellite observations into actionable insights for a safer, more sustainable planet.
            </p>
          </div>
        </div>

        {/* Space Apps Challenge Signature */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-medium text-slate-300">NASA Space Apps 2026</span>
          </div>
          <span className="text-slate-400 font-mono">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
