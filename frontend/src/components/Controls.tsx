"use client";

import React from "react";
import {
  MapPin,
  Calendar as CalendarIcon,
  Sliders,
  Filter,
  RotateCcw,
  Sparkles,
  Info,
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
  // Format date for unambiguous display (e.g., "10 Aug 2024")
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
    <div className="bg-surface border border-border rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Tier 1: AOI Selector, Observation Window, and Single-Date Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* AOI Preset Selector (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-accent-cyan">
              <MapPin className="w-4 h-4" />
              Area of Interest (AOI)
            </span>
            <span className="text-[10px] text-text-muted font-normal lowercase">
              bounding coordinates
            </span>
          </label>
          <select
            value={selectedAoiId}
            onChange={(e) => {
              const found = presetAois.find((a) => a.id === e.target.value);
              if (found) onSelectAoi(found);
            }}
            className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
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
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 text-fire-mid">
              <CalendarIcon className="w-4 h-4" />
              Observation Window (UTC)
            </label>
            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-text-muted">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setStartDate("2024-08-10");
                  setEndDate("2024-08-15");
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className="px-2 py-0.5 rounded bg-surface-muted hover:bg-surface-elevated border border-border text-text-primary transition-colors font-medium"
              >
                Aug 10–15 (Sample Fixture)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate("2024-08-01");
                  setEndDate("2024-08-20");
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className="px-2 py-0.5 rounded bg-surface-muted hover:bg-surface-elevated border border-border text-text-secondary hover:text-white transition-colors"
              >
                Aug 01–20 (Full Month)
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
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
              />
              <span className="absolute right-2.5 top-2.5 text-[10px] text-text-muted pointer-events-none hidden sm:inline">
                {formatDateLabel(startDate)}
              </span>
            </div>
            <span className="text-text-muted text-xs">&rarr;</span>
            <div className="relative w-1/2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (onClearSelectedDate) onClearSelectedDate();
                }}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
              />
              <span className="absolute right-2.5 top-2.5 text-[10px] text-text-muted pointer-events-none hidden sm:inline">
                {formatDateLabel(endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Single-Date Filter Banner (when a specific day is clicked in the calendar) */}
      {selectedDate && (
        <div className="bg-action/15 border border-action/40 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span>
              Inspecting single date: <strong>{formatDateLabel(selectedDate)}</strong>
            </span>
            <span className="text-text-muted text-[11px] hidden sm:inline">
              (Map and details scoped to this day)
            </span>
          </div>
          {onClearSelectedDate && (
            <button
              onClick={onClearSelectedDate}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-action/30 hover:bg-action text-white text-[11px] font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Full Window
            </button>
          )}
        </div>
      )}

      {/* Tier 2: Harmonization Parameters & Display Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-border/60">
        {/* Equal-Area Grid Resolution (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span className="flex items-center gap-1.5 text-text-primary">
              <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
              Harmonization Grid: {gridSizeKm.toFixed(1)} km
            </span>
            <span className="text-[10px] text-text-muted font-normal">
              Equal-Area Cylindrical
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={gridSizeKm}
            onChange={(e) => setGridSizeKm(parseFloat(e.target.value))}
            className="w-full accent-action cursor-pointer h-1.5 bg-surface-muted rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>0.5 km (Fine)</span>
            <span className="text-accent-cyan font-mono">1.0 km (Nominal MODIS)</span>
            <span>3.0 km (Regional)</span>
          </div>
        </div>

        {/* Spatial Match Tolerance (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span className="flex items-center gap-1.5 text-text-primary">
              <Sliders className="w-3.5 h-3.5 text-fire-mid" />
              Match Tolerance: {spatialToleranceM}m
            </span>
            <span className="text-[10px] text-text-muted font-normal">
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
            className="w-full accent-fire-mid cursor-pointer h-1.5 bg-surface-muted rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>500m (Strict)</span>
            <span className="text-fire-mid font-mono">1000m (MODIS Nadir)</span>
            <span>2000m (Permissive)</span>
          </div>
        </div>

        {/* Sensor & Classification Selectors (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            Display Filters
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
            >
              <option value="ALL">All Sensors</option>
              <option value="MODIS">MODIS Only (1 km)</option>
              <option value="VIIRS">VIIRS Only (375 m)</option>
            </select>

            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
            >
              <option value="ALL">All Records</option>
              <option value="matched">Matched Pairs Only</option>
              <option value="MODIS_only">MODIS Unique Only</option>
              <option value="VIIRS_only">VIIRS Unique Only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
