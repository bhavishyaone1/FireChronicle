"use client";

import React from "react";
import {
  Home,
  Calendar,
  SlidersHorizontal,
  FileSpreadsheet,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Flame,
} from "lucide-react";
import { FireChronicleLogo } from "./FireChronicleLogo";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMethodology?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenMethodology }) => {
  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "events", label: "Candidate Events", icon: Flame },
    { id: "calendar", label: "Activity Calendar", icon: Calendar },
    { id: "compare", label: "Sensor Comparison", icon: SlidersHorizontal },
    { id: "audit", label: "Harmonization Audit", icon: FileSpreadsheet },
    { id: "anomalies", label: "Historical Patterns", icon: TrendingUp },
    { id: "methodology", label: "Methodology", icon: BookOpen },
  ];

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 bg-[#07080B] border-r border-[#1B1F2A] flex-col justify-between shrink-0 select-none z-30 h-full p-3.5">
      {/* Top Section: Logo & Nav */}
      <div className="flex flex-col gap-3.5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 pt-0.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <FireChronicleLogo size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-tight">
              FireChronicle
            </span>
            <span className="text-[11px] font-normal text-[#8E96A5] tracking-normal">
              Satellite Fire Intelligence
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 text-left ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500/25 via-orange-500/10 to-transparent border border-orange-500/60 text-white font-medium shadow-[0_0_18px_rgba(249,115,22,0.2)]"
                    : "text-[#9AA3B4] hover:text-[#F4F5F7] hover:bg-[#121622] font-normal border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-[#F97316]" : "text-[#717A8C]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Promo Card & NASA Branding */}
      <div className="flex flex-col gap-2.5 pt-2">
        {/* Tracking a safer, greener planet Promo Card */}
        <div className="relative rounded-2xl overflow-hidden border border-[#262B3A] bg-[#0E121B] shadow-lg group">
          {/* Earth from space background preview */}
          <div
            className="h-20 w-full bg-cover bg-center relative"
            style={{
              backgroundImage: `url('/earth_wildfire_card.jpg'), radial-gradient(ellipse at bottom, #1E3A8A 0%, #0B1120 70%)`,
            }}
          >
            {/* Atmospheric limb glow and wildfire spark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E121B] via-[#0E121B]/60 to-transparent" />
            <div className="absolute top-2.5 right-3.5 w-2 h-2 rounded-full bg-[#FF5500] shadow-[0_0_10px_#FF5500] animate-ping" />
            <div className="absolute top-2.5 right-3.5 w-2 h-2 rounded-full bg-[#FFAA00] shadow-[0_0_6px_#FFAA00]" />
          </div>

          <div className="p-3 pt-0 flex flex-col gap-1.5 relative z-10">
            <h4 className="text-xs font-semibold text-white leading-snug">
              Tracking a safer, greener planet
            </h4>
            <p className="text-[10px] text-[#8E96A5] leading-relaxed">
              Harmonizing MODIS &amp; VIIRS for a clearer view of active burning activity.
            </p>
            <button
              onClick={() => onOpenMethodology ? onOpenMethodology() : setActiveTab("methodology")}
              className="mt-0.5 inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-lg border border-[#F97316]/70 text-[#F97316] hover:bg-[#F97316]/10 text-[10px] font-medium transition-colors"
            >
              <span>Learn More</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* NASA Space Apps 2026 Footer */}
        <div className="flex items-center gap-2.5 px-1 text-xs text-[#7A8394]">
          <div className="w-5 h-5 rounded-full bg-[#0B3D91] flex items-center justify-center shrink-0 text-[8px] font-bold text-white shadow-sm">
            NASA
          </div>
          <span className="text-[11px] font-medium text-[#8E96A5]">
            NASA Space Apps 2026
          </span>
        </div>
      </div>
    </aside>
  );
};
