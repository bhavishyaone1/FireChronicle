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
    <aside className="hidden md:flex md:w-60 lg:w-64 bg-[#090B0F] border-r border-[#28313D] flex-col justify-between shrink-0 select-none z-30">
      {/* Top Logo and Navigation */}
      <div className="p-4 flex flex-col gap-5">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-8 h-8 rounded-lg bg-[#151A22] border border-[#28313D] flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight text-[#F1F5F9] leading-none">
              FireChronicle
            </h1>
            <span className="text-[11px] font-normal text-[#A4AFBF] tracking-normal mt-1">
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
                    ? "bg-[#151A22] text-[#F1F5F9] border-l-2 border-[#F59E0B] font-medium"
                    : "text-[#A4AFBF] hover:text-[#F1F5F9] hover:bg-[#151A22]/50 font-normal"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#F59E0B]" : "text-[#6E7A8A]"
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
        <div className="rounded-xl bg-[#10141B] border border-[#28313D] p-3 text-xs flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[#F59E0B]">
            Scientific purpose
          </span>
          <p className="text-[11px] font-normal text-[#A4AFBF] leading-relaxed">
            Harmonizing MODIS (1 km) and VIIRS (375 m) satellite hotspot detections into an interpretable burning activity calendar.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#6E7A8A] px-1 pt-1 border-t border-[#1C232C]">
          <span>NASA Space Apps 2026</span>
          <span className="font-mono text-[10px]">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
