"use client";

import React from "react";
import {
  MapPin,
  Calendar as CalendarIcon,
  Sliders,
  Filter,
  RotateCcw,
  Check,
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
    <div className="bg-[#101216] border border-[#282D35] rounded-xl p-4 shadow-sm flex flex-col gap-4">
      {/* Tier 1: AOI Selector & Observation Window */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* AOI Preset Selector (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-1.5">
          <label
            htmlFor="aoi-selector"
            className="text-[13px] font-medium text-[#A4AAB5] flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5 text-[#F3F4F6]">
              <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
              Area of interest (AOI)
            </span>
            <span className="text-xs text-[#A4AAB5] font-normal">
              Bounding coordinates
            </span>
          </label>
          <select
            id="aoi-selector"
            value={selectedAoiId}
            onChange={(e) => {
              const found = presetAois.find((a) => a.id === e.target.value);
              if (found) onSelectAoi(found);
            }}
            className="w-full h-9 bg-[#090A0C] border border-[#282D35] rounded-lg px-3 text-xs text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
          >
            {presetAois.map((aoi) => (
              <option key={aoi.id} value={aoi.id}>
                {aoi.name} &bull; [{aoi.bbox.map((b) => b.toFixed(1)).join(", ")}]
              </option>
            ))}
          </select>
        </div>

        {/* Date Window & Quick Presets (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="start-date-input"
              className="text-[13px] font-medium text-[#A4AAB5] flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
              Observation window (UTC)
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#A4AAB5]">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setStartDate("2024-08-10");
                  setEndDate("2024-08-15");
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className={`px-2 py-0.5 rounded text-xs transition-colors duration-150 font-medium border ${
                  startDate === "2024-08-10" && endDate === "2024-08-15"
                    ? "bg-[#16191F] border-[#F59E0B] text-[#F59E0B]"
                    : "bg-[#090A0C] border-[#282D35] text-[#A4AAB5] hover:text-[#F3F4F6] hover:bg-[#16191F]"
                }`}
              >
                10–15 Aug (Fixture)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate("2024-08-01");
                  setEndDate("2024-08-20");
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className={`px-2 py-0.5 rounded text-xs transition-colors duration-150 font-medium border ${
                  startDate === "2024-08-01" && endDate === "2024-08-20"
                    ? "bg-[#16191F] border-[#F59E0B] text-[#F59E0B]"
                    : "bg-[#090A0C] border-[#282D35] text-[#A4AAB5] hover:text-[#F3F4F6] hover:bg-[#16191F]"
                }`}
              >
                01–20 Aug (Full window)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-1/2">
              <input
                id="start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className="w-full h-9 bg-[#090A0C] border border-[#282D35] rounded-lg px-3 text-xs font-mono tabular-nums text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
              />
            </div>
            <span className="text-[#A4AAB5] text-xs" aria-hidden="true">&rarr;</span>
            <div className="w-1/2">
              <input
                id="end-date-input"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className="w-full h-9 bg-[#090A0C] border border-[#282D35] rounded-lg px-3 text-xs font-mono tabular-nums text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Single-Date Filter Banner */}
      {selectedDate && (
        <div className="bg-[#16191F] border border-[#282D35] rounded-lg px-3 py-2 flex items-center justify-between text-xs text-[#F3F4F6]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>
              Inspecting single date: <strong className="font-semibold text-[#F3F4F6]">{formatDateLabel(selectedDate)}</strong>
            </span>
            <span className="text-[#A4AAB5] text-xs hidden sm:inline">
              (Map and details scoped to this day)
            </span>
          </div>
          {onClearSelectedDate && (
            <Button
              variant="subtle"
              size="sm"
              onClick={onClearSelectedDate}
              className="text-[#F59E0B] hover:text-[#fbbf24]"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset to full window
            </Button>
          )}
        </div>
      )}

      {/* Tier 2: Harmonization Parameters & Display Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-[#282D35]">
        {/* Equal-Area Grid Resolution (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-[#A4AAB5]">
            <span className="flex items-center gap-1.5 font-medium text-[#F3F4F6]">
              <Sliders className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
              Harmonization grid: {gridSizeKm.toFixed(1)} km
            </span>
            <span className="text-xs text-[#A4AAB5]">
              Equal-area cylindrical
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={gridSizeKm}
            onChange={(e) => setGridSizeKm(parseFloat(e.target.value))}
            className="w-full accent-[#F59E0B] cursor-pointer h-1.5 bg-[#090A0C] rounded-lg"
          />
          <div className="flex justify-between text-xs text-[#A4AAB5]">
            <span>0.5 km (Fine)</span>
            <span className="text-[#F59E0B] font-mono tabular-nums">1.0 km (Nominal MODIS)</span>
            <span>3.0 km (Regional)</span>
          </div>
        </div>

        {/* Spatial Match Tolerance (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-[#A4AAB5]">
            <span className="flex items-center gap-1.5 font-medium text-[#F3F4F6]">
              <Sliders className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
              Match tolerance: {spatialToleranceM}m
            </span>
            <span className="text-xs text-[#A4AAB5]">
              &le; 60 min orbital delta
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="2000"
            step="250"
            value={spatialToleranceM}
            onChange={(e) => setSpatialToleranceM(parseInt(e.target.value, 10))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#090A0C] rounded-lg"
          />
          <div className="flex justify-between text-xs text-[#A4AAB5]">
            <span>500m (Strict)</span>
            <span className="text-red-400 font-mono tabular-nums">1000m (MODIS Nadir)</span>
            <span>2000m (Permissive)</span>
          </div>
        </div>

        {/* Sensor & Classification Selectors + Action Buttons (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-[#A4AAB5] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#A4AAB5]" aria-hidden="true" />
              Display filters
            </label>
            <div className="flex items-center gap-1.5">
              <Button
                variant="subtle"
                size="sm"
                onClick={handleResetFilters}
                title="Reset all filters to defaults"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
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
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value)}
              className="w-full h-9 bg-[#090A0C] border border-[#282D35] rounded-lg px-2.5 text-xs text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
            >
              <option value="ALL">All sensors</option>
              <option value="MODIS">MODIS only (1 km)</option>
              <option value="VIIRS">VIIRS only (375 m)</option>
            </select>

            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="w-full h-9 bg-[#090A0C] border border-[#282D35] rounded-lg px-2.5 text-xs text-[#F3F4F6] focus-visible:outline-none focus-visible:border-[#F59E0B] transition-colors duration-150"
            >
              <option value="ALL">All records</option>
              <option value="matched">Candidate matches only</option>
              <option value="MODIS_only">MODIS unique only</option>
              <option value="VIIRS_only">VIIRS unique only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
