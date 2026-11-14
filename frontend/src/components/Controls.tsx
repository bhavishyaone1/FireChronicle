"use client";

import React, { useState } from "react";
import {
  Globe,
  Calendar as CalendarIcon,
  Layers,
  Settings2,
  RotateCcw,
  Filter,
  ChevronDown,
  MapPin,
  Clock,
} from "lucide-react";
import { PresetAoi } from "@/types";

interface ControlsProps {
  presetAois: PresetAoi[];
  selectedAoiId: string;
  onSelectAoi: (aoi: PresetAoi) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  gridSizeKm: number;
  setGridSizeKm: (g: number) => void;
  spatialToleranceM: number;
  setSpatialToleranceM: (t: number) => void;
  sensorFilter: string;
  setSensorFilter: (s: string) => void;
  classificationFilter: string;
  setClassificationFilter: (c: string) => void;
  selectedState?: string;
  setSelectedState?: (s: string) => void;
  stateCounts?: Record<string, number>;
  totalCount?: number;
  useIST?: boolean;
  setUseIST?: (b: boolean) => void;
  selectedDate?: string | null;
  onClearSelectedDate?: () => void;
  fireTypeFilter?: string;
  setFireTypeFilter?: (t: string) => void;
  onApplyFilters?: () => void;
}

export const INDIAN_STATES_LIST = [
  "ALL",
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const Controls: React.FC<ControlsProps> = ({
  presetAois,
  selectedAoiId,
  onSelectAoi,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  gridSizeKm,
  setGridSizeKm,
  spatialToleranceM,
  setSpatialToleranceM,
  sensorFilter,
  setSensorFilter,
  classificationFilter,
  setClassificationFilter,
  selectedState = "ALL",
  setSelectedState,
  stateCounts = {},
  totalCount,
  useIST = true,
  setUseIST,
  selectedDate,
  onClearSelectedDate,
  fireTypeFilter,
  setFireTypeFilter,
  onApplyFilters,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatDateLabel = (isoDate: string) => {
    try {
      const parts = isoDate.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${months[mIdx]} ${parts[2]}`;
      }
    } catch {
      // fallback
    }
    return isoDate;
  };

  const formattedDateRange = selectedDate
    ? `Single: ${formatDateLabel(selectedDate)}, ${selectedDate.split("-")[0]}`
    : `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}, ${startDate.split("-")[0] || "2026"}`;

  const handleResetFilters = () => {
    setStartDate("2026-03-01");
    setEndDate("2026-03-07");
    setGridSizeKm(1.0);
    setSpatialToleranceM(1000);
    setSensorFilter("ALL");
    setClassificationFilter("ALL");
    if (setSelectedState) setSelectedState("ALL");
    if (onClearSelectedDate) onClearSelectedDate();
    if (onApplyFilters) onApplyFilters();
  };


  return (
    <div className="flex flex-col gap-3">
      {/* Horizontal Translucent Capsule Filter Bar */}
      <div className="bg-[#0C0F17]/90 backdrop-blur-md border border-[#1E2433] rounded-xl p-1.5 px-3 flex items-center justify-between gap-2 shadow-lg overflow-x-auto">
        {/* Left Filter Dropdowns */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Global / AOI Selector */}
          <div className="relative">
            <label htmlFor="aoi-select" className="sr-only">Select Region or Area of Interest</label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-[#F5B32F]" />
              <select
                id="aoi-select"
                aria-label="Select Region or Area of Interest"
                value={selectedState !== "ALL" ? `state_${selectedState}` : selectedAoiId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith("state_")) {
                    const st = val.replace("state_", "");
                    if (setSelectedState) setSelectedState(st);
                    const indAoi = presetAois.find((a) => a.id === "india_all") || presetAois[0];
                    if (indAoi) onSelectAoi(indAoi);
                  } else {
                    if (setSelectedState) setSelectedState("ALL");
                    const found = presetAois.find((a) => a.id === val);
                    if (found) onSelectAoi(found);
                  }
                  if (onApplyFilters) onApplyFilters();
                }}
                className="bg-transparent text-xs text-[#E2E8F0] focus:outline-none cursor-pointer pr-1"
              >
                <option value="global" className="bg-[#10141F]">Global</option>
                <option value="india_all" className="bg-[#10141F]">Republic of India (National)</option>
                {INDIAN_STATES_LIST.filter(s => s !== "ALL").map((st) => {
                  const cnt = stateCounts[st] || 0;
                  return (
                    <option key={st} value={`state_${st}`} className="bg-[#10141F]">
                      {st}{cnt > 0 ? ` (${cnt})` : ""}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3 h-3 text-[#7B8596] pointer-events-none" />
            </div>
          </div>

          {/* 2. Date Range Preset Selector */}
          <div className="relative">
            <label htmlFor="date-range-select" className="sr-only">Select Date Range Window</label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer">
              <CalendarIcon className="w-3.5 h-3.5 text-[#F5B32F]" />
              <select
                id="date-range-select"
                aria-label="Select Date Range Window"
                value={selectedDate ? "custom" : `${startDate}_${endDate}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "2026-04-11_2026-04-17") {
                    setStartDate("2026-04-11");
                    setEndDate("2026-04-17");
                    if (onClearSelectedDate) onClearSelectedDate();
                  } else if (val === "2026-03-26_2026-04-24") {
                    setStartDate("2026-03-26");
                    setEndDate("2026-04-24");
                    if (onClearSelectedDate) onClearSelectedDate();
                  } else if (val === "2026-03-01_2026-04-30") {
                    setStartDate("2026-03-01");
                    setEndDate("2026-04-30");
                    if (onClearSelectedDate) onClearSelectedDate();
                  } else if (val === "2025-11-09_2026-11-09") {
                    setStartDate("2025-11-09");
                    setEndDate("2026-11-09");
                    if (onClearSelectedDate) onClearSelectedDate();
                  } else if (val === "2026-03-01_2026-03-07") {
                    setStartDate("2026-03-01");
                    setEndDate("2026-03-07");
                    if (onClearSelectedDate) onClearSelectedDate();
                  } else if (val === "2025-11-10_2025-11-16") {
                    setStartDate("2025-11-10");
                    setEndDate("2025-11-16");
                    if (onClearSelectedDate) onClearSelectedDate();
                  } else if (val === "2026-05-01_2026-05-07") {
                    setStartDate("2026-05-01");
                    setEndDate("2026-05-07");
                    if (onClearSelectedDate) onClearSelectedDate();
                  }
                  if (onApplyFilters) onApplyFilters();
                }}
                className="bg-transparent text-xs text-[#E2E8F0] focus:outline-none cursor-pointer pr-1"
              >
                <option value="2026-04-11_2026-04-17" className="bg-[#10141F]">
                  Apr 11 – Apr 17, 2026 (Peak 7-Day Window • 88k obs)
                </option>
                <option value="2026-03-26_2026-04-24" className="bg-[#10141F]">
                  Mar 26 – Apr 24, 2026 (Peak 30-Day Window • 309k obs)
                </option>
                <option value="2026-03-01_2026-04-30" className="bg-[#10141F]">
                  Mar 01 – Apr 30, 2026 (Pre-Monsoon Peak • 560k obs)
                </option>
                <option value="2025-11-09_2026-11-09" className="bg-[#10141F]">
                  Nov 09, 2025 – Nov 09, 2026 (All Data • 1.13M obs)
                </option>
                <option value="2026-03-01_2026-03-07" className="bg-[#10141F]">
                  Mar 01 – Mar 07, 2026 (NASA Archive Baseline)
                </option>
                <option value="2025-11-10_2025-11-16" className="bg-[#10141F]">
                  Nov 10 – Nov 16, 2025 (Kharif Stubble Season)
                </option>
                <option value="2026-05-01_2026-05-07" className="bg-[#10141F]">
                  May 01 – May 07, 2026 (Rabi Wheat Harvest)
                </option>
                {selectedDate && (
                  <option value="custom" className="bg-[#10141F]">
                    {formattedDateRange}
                  </option>
                )}
              </select>
              <ChevronDown className="w-3 h-3 text-[#7B8596] pointer-events-none" />
            </div>
          </div>

          {/* 3. Sensor Selector */}
          <div className="relative">
            <label htmlFor="sensor-select" className="sr-only">Select Satellite Sensor Filter</label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer">
              <Layers className="w-3.5 h-3.5 text-[#F5B32F]" />
              <select
                id="sensor-select"
                aria-label="Select Satellite Sensor Filter"
                value={sensorFilter}
                onChange={(e) => setSensorFilter(e.target.value)}
                className="bg-transparent text-xs text-[#E2E8F0] focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-[#10141F]">All Sensors</option>
                <option value="MODIS" className="bg-[#10141F]">MODIS Only (1.0 km)</option>
                <option value="VIIRS" className="bg-[#10141F]">VIIRS Only (375 m)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#7B8596] pointer-events-none" />
            </div>
          </div>

          {/* 3b. Fire / Anomaly Type Selector */}
          {setFireTypeFilter && (
            <div className="relative">
              <label htmlFor="fire-type-select" className="sr-only">Select Thermal Anomaly Type Filter</label>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <select
                  id="fire-type-select"
                  aria-label="Select Thermal Anomaly Type Filter"
                  value={fireTypeFilter || "ALL"}
                  onChange={(e) => {
                    setFireTypeFilter(e.target.value);
                    if (onApplyFilters) onApplyFilters();
                  }}
                  className="bg-transparent text-xs text-[#E2E8F0] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ALL" className="bg-[#10141F]">All Types (Grid Unfiltered)</option>
                  <option value="VEGETATION" className="bg-[#10141F]">Vegetation / Biomass</option>
                  <option value="STATIC" className="bg-[#10141F]">Static Industrial / Flare</option>
                  <option value="OFFSHORE" className="bg-[#10141F]">Offshore Marine Detection</option>
                  <option value="VOLCANO" className="bg-[#10141F]">Active Volcano</option>
                  <option value="UNCLASSIFIED" className="bg-[#10141F]">Unclassified Context</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#7B8596] pointer-events-none" />
              </div>
            </div>
          )}

          {/* 4. Advanced Settings Button */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showAdvanced
                ? "bg-[#181E2E] text-[#F5B32F] border border-[#F5B32F]/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                : "bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-[#E2E8F0]"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-[#F5B32F]" />
            <span>Advanced Settings</span>
            <ChevronDown className={`w-3 h-3 text-[#7B8596] transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Right Action Buttons: Reset & Apply Filters */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#9AA3B4] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          {/* Apply Filters Radiant Orange Gradient Button */}
          <button
            onClick={() => {
              if (onApplyFilters) onApplyFilters();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#F59E0B] via-[#F97316] to-[#EA580C] hover:from-[#FBBF24] hover:to-[#F97316] text-[#0A0B0E] font-bold text-xs shadow-[0_0_18px_rgba(245,158,11,0.4)] active:scale-95 transition-all"
          >
            <Filter className="w-3.5 h-3.5 fill-current" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {/* Expandable Advanced Settings Drawer */}
      {showAdvanced && (
        <div className="bg-[#0C0F17]/95 border border-[#1E2433] rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div>
            <label className="text-[11px] font-semibold text-[#8E96A5] block mb-1">
              Equal-Area Grid Resolution ({gridSizeKm} km)
            </label>
            <select
              value={gridSizeKm}
              onChange={(e) => setGridSizeKm(parseFloat(e.target.value))}
              className="w-full h-8 bg-[#121622] border border-[#23293A] rounded-lg px-2 text-[#E2E8F0] text-xs focus:outline-none focus:border-[#F5B32F]"
            >
              <option value={0.5}>0.5 km (High resolution)</option>
              <option value={1.0}>1.0 km (Standard Lambert CEA)</option>
              <option value={2.0}>2.0 km (Regional aggregation)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#8E96A5] block mb-1">
              Cross-Sensor Match Distance (&le; {spatialToleranceM}m)
            </label>
            <select
              value={spatialToleranceM}
              onChange={(e) => setSpatialToleranceM(parseInt(e.target.value, 10))}
              className="w-full h-8 bg-[#121622] border border-[#23293A] rounded-lg px-2 text-[#E2E8F0] text-xs focus:outline-none focus:border-[#F5B32F]"
            >
              <option value={500}>500 m (Strict nadir collocation)</option>
              <option value={1000}>1000 m (Standard MODIS footprint)</option>
              <option value={1500}>1500 m (Expanded view angle)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#8E96A5] block mb-1">
              Classification Sub-Filter
            </label>
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="w-full h-8 bg-[#121622] border border-[#23293A] rounded-lg px-2 text-[#E2E8F0] text-xs focus:outline-none focus:border-[#F5B32F]"
            >
              <option value="ALL">All records</option>
              <option value="matched">Candidate matches only</option>
              <option value="MODIS_only">MODIS unique only</option>
              <option value="VIIRS_only">VIIRS unique only</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
