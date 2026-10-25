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
    <aside className="w-64 bg-black border-r border-neutral-900 flex flex-col justify-between shrink-0 select-none z-30">
      {/* Top Logo and Navigation */}
      <div className="p-5 flex flex-col gap-6">
        {/* Brand Logo with Fiery Orange-Red Gradient */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-orange-600/30 ring-1 ring-orange-400/40 shrink-0">
            <Flame className="w-6 h-6 text-white fill-white/20 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              FireChronicle
            </h1>
            <span className="text-[11px] font-semibold text-orange-400 tracking-wide">
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
                    ? "bg-gradient-to-r from-orange-950/70 via-red-950/40 to-black text-white border-l-2 border-orange-500 shadow-lg shadow-orange-950/40 font-bold"
                    : "text-neutral-400 hover:text-orange-300 hover:bg-neutral-900/80"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-orange-400" : "text-neutral-500"
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400/70" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Inspiration Card & Space Apps Badge */}
      <div className="p-5 flex flex-col gap-4">
        {/* Obsidian Space/Thermal Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#140A07] via-[#0E0604] to-black border border-red-900/40 p-4 shadow-xl">
          {/* Subtle fiery ember glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-orange-600/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-red-600/15 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Earth Observation</span>
            </div>
            <p className="text-xs font-extrabold text-white leading-tight">
              Better data. <br />
              <span className="text-orange-400">Safer tomorrow.</span>
            </p>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              FireChronicle turns satellite observations into actionable insights for a safer, more sustainable planet.
            </p>
          </div>
        </div>

        {/* Space Apps Challenge Signature */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-900">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50" />
            <span className="font-semibold text-neutral-200">NASA Space Apps 2026</span>
          </div>
          <span className="text-orange-400/90 font-mono font-bold">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
