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
    { id: "calendar", label: "Activity calendar", icon: Calendar },
    { id: "compare", label: "Sensor comparison", icon: SlidersHorizontal },
    { id: "anomalies", label: "Historical patterns", icon: TrendingUp },
    { id: "methodology", label: "Methodology", icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-black border-r border-neutral-900 flex flex-col justify-between shrink-0 select-none z-30">
      {/* Top Logo and Navigation */}
      <div className="p-5 flex flex-col gap-6">
        {/* Brand Logo with Refined Restrained Hierarchy */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-red-600 to-rose-700 flex items-center justify-center shadow-md shadow-orange-600/25 ring-1 ring-orange-400/30 shrink-0">
            <Flame className="w-5 h-5 text-white fill-white/20" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[15px] font-semibold tracking-tight text-white leading-none">
              FireChronicle
            </h1>
            <span className="text-[11px] font-normal text-neutral-400 tracking-normal mt-1">
              Satellite fire activity intelligence
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-neutral-900/90 text-white border-l-2 border-orange-500 font-semibold"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-orange-400" : "text-neutral-500"
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Inspiration Card & Space Apps Badge */}
      <div className="p-5 flex flex-col gap-3.5">
        {/* Obsidian Space/Thermal Card */}
        <div className="relative overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800/80 p-3.5 shadow-lg">
          <div className="relative z-10 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Earth observation</span>
            </div>
            <p className="text-xs font-semibold text-white leading-snug">
              Better data. <br />
              <span className="text-orange-400 font-medium">Safer tomorrow.</span>
            </p>
            <p className="text-[11px] font-normal text-neutral-400 leading-relaxed">
              Harmonizing satellite observations into actionable insights for fire research and resource planning.
            </p>
          </div>
        </div>

        {/* Space Apps Challenge Signature */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-900">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="font-normal text-neutral-300">NASA Space Apps 2026</span>
          </div>
          <span className="text-neutral-500 font-mono text-[10px]">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
