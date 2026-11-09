"use client";

import React from "react";
import {
  LayoutDashboard,
  Calendar,
  SlidersHorizontal,
  TrendingUp,
  BookOpen,
  FileSpreadsheet,
} from "lucide-react";
import { FireChronicleLogo } from "./FireChronicleLogo";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "calendar", label: "Activity calendar", icon: Calendar },
    { id: "compare", label: "Sensor comparison", icon: SlidersHorizontal },
    { id: "audit", label: "Harmonization audit", icon: FileSpreadsheet },
    { id: "anomalies", label: "Historical patterns", icon: TrendingUp },
    { id: "methodology", label: "Methodology & citations", icon: BookOpen },
  ];

  return (
    <aside className="hidden md:flex md:w-56 lg:w-60 bg-[#08090B] border-r border-[#2A3039] flex-col justify-between shrink-0 select-none z-30">
      {/* Top Logo and Navigation */}
      <div className="p-3.5 flex flex-col gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-8 h-8 rounded-lg bg-[#101216] border border-[#2A3039] flex items-center justify-center shrink-0">
            <FireChronicleLogo size={18} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight text-[#F4F5F7] leading-none">
              FireChronicle
            </h1>
            <span className="text-[11px] font-normal text-[#B1B7C1] tracking-normal mt-1">
              Satellite fire intelligence
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 text-left ${
                  isActive
                    ? "bg-[#171A20] text-[#F4F5F7] border-l-2 border-[#F5B32F] font-medium"
                    : "text-[#B1B7C1] hover:text-[#F4F5F7] hover:bg-[#101216] font-normal"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#F5B32F]" : "text-[#858D99]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Summary Card & Metadata */}
      <div className="p-3.5 flex flex-col gap-3">
        <div className="rounded-xl bg-[#101216] border border-[#2A3039] p-3 text-xs flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[#F5B32F]">
            Scientific purpose
          </span>
          <p className="text-[11px] font-normal text-[#B1B7C1] leading-relaxed">
            Harmonizing MODIS (1 km) and VIIRS (375 m) active-fire observations into an interpretable burning activity calendar.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#858D99] px-1 pt-1 border-t border-[#1C232C]">
          <span>NASA FIRMS Core</span>
          <span className="font-mono text-[10px]">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
