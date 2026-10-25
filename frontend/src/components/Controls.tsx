"use client";

import React from "react";
import {
  MapPin,
  Calendar as CalendarIcon,
  Sliders,
  Filter,
  RotateCcw,
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

  return (
    <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
      {/* Tier 1: AOI Selector & Observation Window */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* AOI Preset Selector (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-neutral-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-200">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              Area of interest (AOI)
            </span>
            <span className="text-[11px] text-neutral-400 font-normal">
              Bounding coordinates
            </span>
          </label>
          <select
            value={selectedAoiId}
            onChange={(e) => {
              const found = presetAois.find((a) => a.id === e.target.value);
              if (found) onSelectAoi(found);
            }}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors"
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
            <label className="text-[13px] font-medium text-neutral-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
              Observation window (UTC)
            </label>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-neutral-500">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setStartDate("2024-08-10");
                  setEndDate("2024-08-15");
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors font-medium"
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
                className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                01–20 Aug (Full window)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-1/2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors"
              />
              <span className="absolute right-2.5 top-2.5 text-[11px] text-neutral-400 pointer-events-none hidden sm:inline">
                {formatDateLabel(startDate)}
              </span>
            </div>
            <span className="text-neutral-500 text-xs">&rarr;</span>
            <div className="relative w-1/2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors"
              />
              <span className="absolute right-2.5 top-2.5 text-[11px] text-neutral-400 pointer-events-none hidden sm:inline">
                {formatDateLabel(endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Single-Date Filter Banner */}
      {selectedDate && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-neutral-200">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span>
              Inspecting single date: <strong className="font-semibold text-white">{formatDateLabel(selectedDate)}</strong>
            </span>
            <span className="text-neutral-400 text-[11px] hidden sm:inline">
              (Map and details scoped to this day)
            </span>
          </div>
          {onClearSelectedDate && (
            <button
              onClick={onClearSelectedDate}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to full window
            </button>
          )}
        </div>
      )}

      {/* Tier 2: Harmonization Parameters & Display Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-neutral-900">
        {/* Equal-Area Grid Resolution (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="flex items-center gap-1.5 font-medium text-white">
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              Harmonization grid: {gridSizeKm.toFixed(1)} km
            </span>
            <span className="text-[11px] text-neutral-400">
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
            className="w-full accent-orange-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>0.5 km (Fine)</span>
            <span className="text-orange-400 font-mono tabular-nums">1.0 km (Nominal MODIS)</span>
            <span>3.0 km (Regional)</span>
          </div>
        </div>

        {/* Spatial Match Tolerance (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="flex items-center gap-1.5 font-medium text-white">
              <Sliders className="w-3.5 h-3.5 text-red-400" />
              Match tolerance: {spatialToleranceM}m
            </span>
            <span className="text-[11px] text-neutral-400">
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
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>500m (Strict)</span>
            <span className="text-red-400 font-mono tabular-nums">1000m (MODIS Nadir)</span>
            <span>2000m (Permissive)</span>
          </div>
        </div>

        {/* Sensor & Classification Selectors (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-neutral-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            Display filters
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors"
            >
              <option value="ALL">All sensors</option>
              <option value="MODIS">MODIS only (1 km)</option>
              <option value="VIIRS">VIIRS only (375 m)</option>
            </select>

            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors"
            >
              <option value="ALL">All records</option>
              <option value="matched">Matched pairs only</option>
              <option value="MODIS_only">MODIS unique only</option>
              <option value="VIIRS_only">VIIRS unique only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
