"use client";

import React from "react";
import {
  Flame,
  LayoutDashboard,
  Calendar,
  SlidersHorizontal,
  TrendingUp,
  BookOpen,
  FileSpreadsheet,
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
    { id: "audit", label: "Harmonization audit", icon: FileSpreadsheet },
    { id: "anomalies", label: "Historical patterns", icon: TrendingUp },
    { id: "methodology", label: "How harmonization works", icon: BookOpen },
  ];

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 bg-[#090A0C] border-r border-[#282D35] flex-col justify-between shrink-0 select-none z-30">
      {/* Top Logo and Navigation */}
      <div className="p-4 flex flex-col gap-5">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-8 h-8 rounded-lg bg-[#16191F] border border-[#282D35] flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight text-[#F3F4F6] leading-none">
              FireChronicle
            </h1>
            <span className="text-[11px] font-normal text-[#A4AAB5] tracking-normal mt-1">
              Satellite fire activity intelligence
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
                    ? "bg-[#16191F] text-[#F3F4F6] border-l-2 border-[#F59E0B] font-medium"
                    : "text-[#A4AAB5] hover:text-[#F3F4F6] hover:bg-[#16191F]/50 font-normal"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#F59E0B]" : "text-[#727A88]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Summary Card & Metadata */}
      <div className="p-4 flex flex-col gap-3">
        <div className="rounded-xl bg-[#101216] border border-[#282D35] p-3 text-xs flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[#F59E0B]">
            Scientific purpose
          </span>
          <p className="text-[11px] font-normal text-[#A4AAB5] leading-relaxed">
            Harmonizing MODIS (1 km) and VIIRS (375 m) satellite hotspot detections into an interpretable burning activity calendar.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#727A88] px-1 pt-1 border-t border-[#1C2026]">
          <span>NASA Space Apps 2026</span>
          <span className="font-mono text-[10px]">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
