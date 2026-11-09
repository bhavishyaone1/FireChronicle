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
  selectedDate?: string | null;
  onClearSelectedDate?: () => void;
  onApplyFilters?: () => void;
}

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
  selectedDate,
  onClearSelectedDate,
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
    ? `Single: ${formatDateLabel(selectedDate)}`
    : `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}, 2024`;

  const handleResetFilters = () => {
    setStartDate("2024-08-01");
    setEndDate("2024-08-20");
    setGridSizeKm(1.0);
    setSpatialToleranceM(1000);
    setSensorFilter("ALL");
    setClassificationFilter("ALL");
    if (onClearSelectedDate) onClearSelectedDate();
    if (onApplyFilters) onApplyFilters();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Horizontal Translucent Capsule Filter Bar */}
      <div className="bg-[#0C0F17]/90 backdrop-blur-md border border-[#1E2433] rounded-xl p-1.5 px-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        {/* Left Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Global / AOI Selector */}
          <div className="relative">
            <label htmlFor="aoi-select" className="sr-only">Select Region or Area of Interest</label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-[#F5B32F]" />
              <select
                id="aoi-select"
                aria-label="Select Region or Area of Interest"
                value={selectedAoiId}
                onChange={(e) => {
                  const found = presetAois.find((a) => a.id === e.target.value);
                  if (found) onSelectAoi(found);
                }}
                className="bg-transparent text-xs text-[#E2E8F0] focus:outline-none cursor-pointer pr-1"
              >
                {presetAois.map((aoi) => (
                  <option key={aoi.id} value={aoi.id} className="bg-[#10141F]">
                    {aoi.name.replace("Southern California (LA Basin)", "S. California (LA)")}
                  </option>
                ))}
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
                  if (val === "2024-08-01_2024-08-20") {
                    setStartDate("2024-08-01");
                    setEndDate("2024-08-20");
                    if (onClearSelectedDate) onClearSelectedDate();
                  } else if (val === "2024-08-10_2024-08-15") {
                    setStartDate("2024-08-10");
                    setEndDate("2024-08-15");
                    if (onClearSelectedDate) onClearSelectedDate();
                  } else if (val === "2024-08-16_2024-08-20") {
                    setStartDate("2024-08-16");
                    setEndDate("2024-08-20");
                    if (onClearSelectedDate) onClearSelectedDate();
                  }
                }}
                className="bg-transparent text-xs text-[#E2E8F0] focus:outline-none cursor-pointer pr-1"
              >
                <option value="2024-08-01_2024-08-20" className="bg-[#10141F]">
                  Aug 01 – Aug 20, 2024
                </option>
                <option value="2024-08-10_2024-08-15" className="bg-[#10141F]">
                  Aug 10 – Aug 15, 2024 (Peak)
                </option>
                <option value="2024-08-16_2024-08-20" className="bg-[#10141F]">
                  Aug 16 – Aug 20, 2024
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

          {/* 4. Advanced Settings Button */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showAdvanced
                ? "bg-[#181E2E] text-[#F5B32F] border border-[#F5B32F]/50"
                : "bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-[#E2E8F0]"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-[#F5B32F]" />
            <span>Advanced Settings</span>
            <ChevronDown className={`w-3 h-3 text-[#7B8596] transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Right Action Buttons: Reset & Apply Filters */}
        <div className="flex items-center gap-2">
          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#9AA3B4] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          {/* Apply Filters Vibrant Gradient Button */}
          <button
            onClick={() => {
              if (onApplyFilters) onApplyFilters();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#F59E0B] via-[#F97316] to-[#EA580C] hover:from-[#FBBF24] hover:to-[#F97316] text-[#0A0B0E] font-bold text-xs shadow-[0_0_16px_rgba(245,158,11,0.35)] active:scale-95 transition-all"
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
