"use client";

import React from "react";
import { MapPin, Calendar as CalendarIcon, Sliders, Filter } from "lucide-react";
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
}) => {
  return (
    <div className="bg-nasa-card/90 border border-nasa-border rounded-xl p-4 shadow-lg flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* AOI Preset Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-nasa-slate flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-nasa-cyan" />
            Area of Interest (AOI)
          </label>
          <select
            value={selectedAoiId}
            onChange={(e) => {
              const found = presetAois.find((a) => a.id === e.target.value);
              if (found) onSelectAoi(found);
            }}
            className="w-full bg-nasa-dark border border-nasa-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-nasa-cyan"
          >
            {presetAois.map((aoi) => (
              <option key={aoi.id} value={aoi.id}>
                {aoi.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Window */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-nasa-slate flex items-center gap-1.5 mb-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-nasa-orange" />
            Observation Window (UTC)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 bg-nasa-dark border border-nasa-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-nasa-cyan"
            />
            <span className="text-nasa-slate text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 bg-nasa-dark border border-nasa-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-nasa-cyan"
            />
          </div>
        </div>

        {/* Harmonization Grid & Tolerance */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-nasa-slate flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-nasa-amber" />
              Grid Cell: {gridSizeKm} km
            </span>
            <span className="text-[10px] text-gray-400">Tolerance: {spatialToleranceM}m</span>
          </label>
          <div className="flex gap-3">
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.5"
              value={gridSizeKm}
              onChange={(e) => setGridSizeKm(parseFloat(e.target.value))}
              className="w-1/2 accent-nasa-cyan cursor-pointer"
            />
            <input
              type="range"
              min="500"
              max="2000"
              step="250"
              value={spatialToleranceM}
              onChange={(e) => setSpatialToleranceM(parseInt(e.target.value))}
              className="w-1/2 accent-nasa-orange cursor-pointer"
            />
          </div>
        </div>

        {/* Sensor & Match Filter */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-nasa-slate flex items-center gap-1.5 mb-1.5">
            <Filter className="w-3.5 h-3.5 text-green-400" />
            Display Filters
          </label>
          <div className="flex gap-2">
            <select
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value)}
              className="w-1/2 bg-nasa-dark border border-nasa-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-nasa-cyan"
            >
              <option value="ALL">All Sensors</option>
              <option value="MODIS">MODIS Only (1 km)</option>
              <option value="VIIRS">VIIRS Only (375 m)</option>
            </select>

            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="w-1/2 bg-nasa-dark border border-nasa-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-nasa-cyan"
            >
              <option value="ALL">All Matches</option>
              <option value="matched">Matched Cross-Sensor</option>
              <option value="MODIS_only">MODIS Unmatched</option>
              <option value="VIIRS_only">VIIRS Unmatched</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
