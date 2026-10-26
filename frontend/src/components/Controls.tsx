"use client";

import React, { useState } from "react";
import {
  MapPin,
  Calendar as CalendarIcon,
  Sliders,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";
import { PresetAoi } from "@/types";
import { Button } from "@/components/ui/Button";

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
        return `${parts[2]} ${months[mIdx]} ${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return isoDate;
  };

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
    <div className="bg-[#101216] border border-[#282D35] rounded-xl p-3.5 shadow-sm flex flex-col gap-3">
      {/* Primary Accessible Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* 1. Region / AOI (3 cols) */}
        <div className="md:col-span-3 flex flex-col gap-1">
          <label
            htmlFor="aoi-selector"
            className="text-[12px] font-medium text-[#A4AAB5] flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5 text-[#F3F4F6]">
              <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
              Region / AOI
            </span>
          </label>
          <select
            id="aoi-selector"
            value={selectedAoiId}
            onChange={(e) => {
              const found = presetAois.find((a) => a.id === e.target.value);
              if (found) onSelectAoi(found);
            }}
            className="w-full h-8.5 bg-[#090A0C] border border-[#282D35] rounded-lg px-2.5 text-xs text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
          >
            {presetAois.map((aoi) => (
              <option key={aoi.id} value={aoi.id}>
                {aoi.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Observation Window & Presets (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="start-date-input"
              className="text-[12px] font-medium text-[#A4AAB5] flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
              Date range (UTC)
            </label>
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setStartDate("2024-08-10");
                  setEndDate("2024-08-15");
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors font-medium border ${
                  startDate === "2024-08-10" && endDate === "2024-08-15"
                    ? "bg-[#16191F] border-[#F59E0B] text-[#F59E0B]"
                    : "bg-[#090A0C] border-[#282D35] text-[#A4AAB5] hover:text-[#F3F4F6]"
                }`}
              >
                10–15 Aug
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate("2024-08-01");
                  setEndDate("2024-08-20");
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors font-medium border ${
                  startDate === "2024-08-01" && endDate === "2024-08-20"
                    ? "bg-[#16191F] border-[#F59E0B] text-[#F59E0B]"
                    : "bg-[#090A0C] border-[#282D35] text-[#A4AAB5] hover:text-[#F3F4F6]"
                }`}
              >
                01–20 Aug
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              id="start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (onClearSelectedDate) onClearSelectedDate();
              }}
              className="w-1/2 h-8.5 bg-[#090A0C] border border-[#282D35] rounded-lg px-2 text-xs font-mono tabular-nums text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
            />
            <span className="text-[#A4AAB5] text-xs">&rarr;</span>
            <input
              id="end-date-input"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (onClearSelectedDate) onClearSelectedDate();
              }}
              className="w-1/2 h-8.5 bg-[#090A0C] border border-[#282D35] rounded-lg px-2 text-xs font-mono tabular-nums text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
            />
          </div>
        </div>

        {/* 3. Primary Sensor Selector (2 cols) */}
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[12px] font-medium text-[#A4AAB5] flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#A4AAB5]" aria-hidden="true" />
            Sensor
          </label>
          <select
            value={sensorFilter}
            onChange={(e) => setSensorFilter(e.target.value)}
            className="w-full h-8.5 bg-[#090A0C] border border-[#282D35] rounded-lg px-2 text-xs text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
          >
            <option value="ALL">All sensors</option>
            <option value="MODIS">MODIS only (1 km)</option>
            <option value="VIIRS">VIIRS only (375 m)</option>
          </select>
        </div>

        {/* 4. Action Buttons & Advanced Toggle (3 cols) */}
        <div className="md:col-span-3 flex items-center justify-end gap-1.5 pt-1 md:pt-0">
          <Button
            variant="subtle"
            size="sm"
            onClick={handleResetFilters}
            title="Reset filters to standard defaults"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>

          <Button
            variant="subtle"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="border-[#282D35] text-[#A4AAB5] hover:text-[#F3F4F6]"
            title="Toggle advanced harmonization settings"
          >
            <Sliders className="w-3 h-3 mr-1 text-[#F59E0B]" />
            <span>Settings</span>
            {showAdvanced ? (
              <ChevronUp className="w-3 h-3 ml-1" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-1" />
            )}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onApplyFilters}
          >
            Apply filters
          </Button>
        </div>
      </div>

      {/* Active Focused Date Banner */}
      {selectedDate && (
        <div className="bg-[#16191F] border border-[#F59E0B]/40 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-[#F3F4F6]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
            <span>
              Focused date: <strong className="font-semibold text-[#F3F4F6]">{formatDateLabel(selectedDate)}</strong>
            </span>
            <span className="text-[#A4AAB5] text-[11px] hidden sm:inline">
              &bull; Every panel is filtered to this 24h UTC period
            </span>
          </div>
          {onClearSelectedDate && (
            <Button
              variant="subtle"
              size="sm"
              onClick={onClearSelectedDate}
              className="text-[#F59E0B] hover:text-[#fbbf24] font-medium"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Back to full range
            </Button>
          )}
        </div>
      )}

      {/* Collapsible Advanced Settings Section */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-[#282D35] bg-[#090A0C]/50 rounded-lg p-3">
          {/* Harmonization Grid Size (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-[#A4AAB5]">
              <span className="font-medium text-[#F3F4F6] flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#F59E0B]" />
                Grid size: {gridSizeKm.toFixed(1)} km
              </span>
              <span>Equal-area cylindrical</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.5"
              value={gridSizeKm}
              onChange={(e) => setGridSizeKm(parseFloat(e.target.value))}
              className="w-full accent-[#F59E0B] cursor-pointer h-1.5 bg-[#16191F] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#727A88]">
              <span>0.5 km (Fine)</span>
              <span className="text-[#F59E0B]">1.0 km (Nominal MODIS)</span>
              <span>3.0 km (Regional)</span>
            </div>
          </div>

          {/* Spatial Match Tolerance (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-[#A4AAB5]">
              <span className="font-medium text-[#F3F4F6] flex items-center gap-1">
                <Sliders className="w-3 h-3 text-red-400" />
                Match tolerance: {spatialToleranceM}m
              </span>
              <span>&le; 60 min orbital delta</span>
            </div>
            <input
              type="range"
              min="500"
              max="2000"
              step="250"
              value={spatialToleranceM}
              onChange={(e) => setSpatialToleranceM(parseInt(e.target.value, 10))}
              className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#16191F] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#727A88]">
              <span>500m (Strict)</span>
              <span className="text-red-400">1000m (MODIS Nadir)</span>
              <span>2000m (Permissive)</span>
            </div>
          </div>

          {/* Classification Filter (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#A4AAB5]">
              Record classification
            </label>
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="w-full h-8 bg-[#16191F] border border-[#282D35] rounded-lg px-2 text-xs text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
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
