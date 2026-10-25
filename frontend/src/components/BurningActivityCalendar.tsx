"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { CalendarResponse, CalendarDaySummary } from "@/types";

interface BurningActivityCalendarProps {
  calendarData: CalendarResponse | null;
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
  isLoading?: boolean;
}

export const BurningActivityCalendar: React.FC<BurningActivityCalendarProps> = ({
  calendarData,
  onSelectDate,
  selectedDate,
  isLoading = false,
}) => {
  const [metricMode, setMetricMode] = useState<"harmonized" | "raw">("harmonized");

  // Format date helper: "YYYY-MM-DD" -> "10 Aug"
  const formatShortDate = (isoDate: string) => {
    try {
      const parts = isoDate.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[mIdx]}`;
      }
    } catch {
      // fallback
    }
    return isoDate.slice(5);
  };

  const formatFullDate = (isoDate: string) => {
    try {
      const parts = isoDate.split("-");
      if (parts.length === 3) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[mIdx]} ${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return isoDate;
  };

  if (isLoading || !calendarData || !calendarData.days.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-secondary flex flex-col items-center justify-center gap-2">
        <span className="w-5 h-5 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
        <span className="text-xs">Loading burning activity calendar...</span>
      </div>
    );
  }

  const days = calendarData.days;

  // Calculate intensity color for heatmap cell
  const getCellBg = (day: CalendarDaySummary) => {
    const value = metricMode === "harmonized" ? day.unique_active_cells : day.total_raw_count;
    if (value === 0) return "bg-surface-elevated/40 border-border text-text-muted hover:border-text-secondary";
    if (value <= 2) return "bg-amber-950/70 border-amber-800 text-amber-200 hover:border-amber-500";
    if (value <= 5) return "bg-orange-950/80 border-orange-700 text-orange-200 hover:border-orange-400";
    if (value <= 10) return "bg-red-950/90 border-red-700 text-red-200 hover:border-red-400";
    return "bg-fire-high border-red-400 text-white font-bold shadow-md shadow-fire-high/30";
  };

  // Prepare chart data with unambiguous date strings
  const chartData = days.map((d) => ({
    date: formatShortDate(d.date),
    fullDate: d.date,
    "Harmonized Cells": d.unique_active_cells,
    "Raw MODIS (1km)": d.modis_raw_count,
    "Raw VIIRS (375m)": d.viirs_raw_count,
  }));

  const activeDaysCount = days.filter((d) => d.unique_active_cells > 0).length;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-fire-mid" />
            Burning-Activity Calendar Heatmap
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Interpretable daily active burning regime &bull; {activeDaysCount} of {days.length} days with detected active fire
          </p>
        </div>

        {/* Metric Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-border text-xs">
          <button
            onClick={() => setMetricMode("harmonized")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              metricMode === "harmonized"
                ? "bg-action text-white shadow-sm"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Harmonized Active Cells
          </button>
          <button
            onClick={() => setMetricMode("raw")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              metricMode === "raw"
                ? "bg-fire-mid text-white shadow-sm"
                : "text-text-secondary hover:text-white"
            }`}
          >
            Raw Detection Counts
          </button>
        </div>
      </div>

      {/* Heatmap Grid Matrix */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-secondary mb-2.5">
          <span className="font-semibold text-text-primary">
            Daily Fire Activity Matrix {selectedDate ? `(Filtered to ${formatShortDate(selectedDate)})` : "(Click day to filter map & details)"}
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-surface-elevated/40 border border-border inline-block" /> 0
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-950/70 border border-amber-800 inline-block" /> 1–2
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-orange-950/80 border border-orange-700 inline-block" /> 3–5
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-950/90 border border-red-700 inline-block" /> 6–10
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-fire-high border border-red-400 inline-block" /> &gt;10
            </span>
            {selectedDate && (
              <button
                onClick={() => onSelectDate("")}
                className="ml-2 flex items-center gap-1 text-[10px] text-accent-cyan hover:underline"
              >
                <RotateCcw className="w-3 h-3" /> Clear Selection
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 gap-2">
          {days.map((day) => {
            const isSelected = selectedDate === day.date;
            const displayVal = metricMode === "harmonized" ? day.unique_active_cells : day.total_raw_count;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(isSelected ? "" : day.date)}
                title={`${formatFullDate(day.date)}: ${day.unique_active_cells} active cells (${day.modis_raw_count} MODIS, ${day.viirs_raw_count} VIIRS)`}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${getCellBg(
                  day
                )} ${
                  isSelected
                    ? "ring-2 ring-accent-cyan ring-offset-2 ring-offset-background scale-105 border-accent-cyan"
                    : "hover:scale-102"
                }`}
              >
                <span className="text-[10px] font-mono tracking-tight opacity-90">{formatShortDate(day.date)}</span>
                <span className="text-lg font-extrabold my-0.5 font-mono">{displayVal}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-75 font-mono">
                  {metricMode === "harmonized" ? "cells" : "points"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparative Time Series Chart */}
      <div className="border-t border-border/60 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Multi-Sensor Discontinuity vs Harmonized Timeline
          </h3>
          <span className="text-[11px] text-text-muted">
            Highlights resolution point inflation (VIIRS cyan vs MODIS violet)
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid stroke="#26364B" strokeDasharray="3 3" opacity={0.5} />
              <XAxis dataKey="date" stroke="#8493A8" fontSize={11} tickLine={false} />
              <YAxis stroke="#8493A8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101827",
                  borderColor: "#26364B",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
              <Bar dataKey="Harmonized Cells" fill="#40C4D8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Raw MODIS (1km)" fill="#A78BFA" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Raw VIIRS (375m)" fill="#38BDF8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Footnote */}
      <div className="flex items-start gap-2.5 bg-surface-elevated border border-border rounded-lg p-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong className="text-text-primary">Scientific Standardization:</strong> Raw VIIRS point counts systematically exceed MODIS because its 375 m pixel footprint resolves multiple detections across the perimeter of a single fire front. Aggregating detections into <em>Harmonized Active Cells</em> eliminates this artificial point inflation, enabling honest cross-decadal trend analysis across the 2000–present observation record.
        </p>
      </div>
    </div>
  );
};
