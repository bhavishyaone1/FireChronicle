"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, ToggleLeft, ToggleRight, Info, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { CalendarResponse, CalendarDaySummary } from "@/types";

interface BurningActivityCalendarProps {
  calendarData: CalendarResponse | null;
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
}

export const BurningActivityCalendar: React.FC<BurningActivityCalendarProps> = ({
  calendarData,
  onSelectDate,
  selectedDate,
}) => {
  const [metricMode, setMetricMode] = useState<"harmonized" | "raw">("harmonized");

  if (!calendarData || !calendarData.days.length) {
    return (
      <div className="bg-nasa-card border border-nasa-border rounded-xl p-6 text-center text-nasa-slate">
        No calendar observations available for the selected parameters.
      </div>
    );
  }

  const days = calendarData.days;

  // Calculate intensity color for heatmap cell
  const getCellBg = (day: CalendarDaySummary) => {
    const value = metricMode === "harmonized" ? day.unique_active_cells : day.total_raw_count;
    if (value === 0) return "bg-nasa-dark/60 border-nasa-border/40 text-nasa-slate";
    if (value <= 2) return "bg-amber-950/60 border-amber-800/60 text-amber-300";
    if (value <= 5) return "bg-orange-900/70 border-orange-700/70 text-orange-200";
    if (value <= 10) return "bg-red-900/80 border-red-700/80 text-red-100";
    return "bg-red-700 border-red-500 text-white font-bold shadow-sm shadow-red-500/50";
  };

  // Prepare chart data
  const chartData = days.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    fullDate: d.date,
    "Harmonized Cells": d.unique_active_cells,
    "Raw MODIS": d.modis_raw_count,
    "Raw VIIRS": d.viirs_raw_count,
  }));

  return (
    <div className="bg-nasa-card/90 border border-nasa-border rounded-xl p-4 shadow-lg flex flex-col gap-5">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-nasa-border/50 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-nasa-orange" />
            Burning-Activity Calendar Heatmap
          </h2>
          <p className="text-xs text-nasa-slate mt-0.5">
            Interpretable daily active-fire regime across the observation window
          </p>
        </div>

        {/* Metric Mode Toggle */}
        <div className="flex items-center gap-2 bg-nasa-dark p-1 rounded-lg border border-nasa-border">
          <button
            onClick={() => setMetricMode("harmonized")}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              metricMode === "harmonized"
                ? "bg-nasa-cyan text-nasa-dark font-semibold shadow"
                : "text-nasa-slate hover:text-white"
            }`}
          >
            Harmonized Active Cells
          </button>
          <button
            onClick={() => setMetricMode("raw")}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              metricMode === "raw"
                ? "bg-nasa-orange text-nasa-dark font-semibold shadow"
                : "text-nasa-slate hover:text-white"
            }`}
          >
            Raw Detection Counts
          </button>
        </div>
      </div>

      {/* Heatmap Grid Matrix */}
      <div>
        <div className="flex items-center justify-between text-xs text-nasa-slate mb-2">
          <span>Daily Intensity Matrix (Click day to filter map)</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-3 h-3 rounded bg-nasa-dark/60 border border-nasa-border/40 inline-block" /> 0
            <span className="w-3 h-3 rounded bg-amber-950/60 border border-amber-800/60 inline-block ml-1" /> Low
            <span className="w-3 h-3 rounded bg-orange-900/70 border border-orange-700/70 inline-block ml-1" /> Moderate
            <span className="w-3 h-3 rounded bg-red-700 border border-red-500 inline-block ml-1" /> High
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
          {days.map((day) => {
            const isSelected = selectedDate === day.date;
            const displayVal = metricMode === "harmonized" ? day.unique_active_cells : day.total_raw_count;
            return (
              <button
                key={day.date}
                onClick={() => onSelectDate(isSelected ? "" : day.date)}
                className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all ${getCellBg(
                  day
                )} ${
                  isSelected
                    ? "ring-2 ring-nasa-cyan ring-offset-2 ring-offset-nasa-dark scale-105"
                    : "hover:scale-102 hover:border-nasa-cyan/50"
                }`}
              >
                <span className="text-[10px] opacity-80">{day.date.slice(5)}</span>
                <span className="text-base font-bold my-0.5">{displayVal}</span>
                <span className="text-[9px] opacity-75">
                  {metricMode === "harmonized" ? "cells" : "points"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparative Time Series Chart */}
      <div className="border-t border-nasa-border/40 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-nasa-slate mb-2">
          Sensor Discontinuity vs Harmonized Metric Timeline
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="date" stroke="#8d99ae" fontSize={10} tickLine={false} />
              <YAxis stroke="#8d99ae" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b132b",
                  borderColor: "#3a506b",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
              <Bar dataKey="Harmonized Cells" fill="#48cae4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Raw MODIS" fill="#60a5fa" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Raw VIIRS" fill="#f77f00" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Footnote */}
      <div className="flex items-start gap-2 bg-nasa-dark/60 border border-nasa-border/40 rounded-lg p-2.5 text-xs text-nasa-slate">
        <Info className="w-4 h-4 text-nasa-cyan flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Scientific Context:</strong> Raw VIIRS point counts systematically exceed MODIS because the 375 m pixel resolves multiple detections inside a single 1 km² area. Switching to <em>Harmonized Active Cells</em> normalizes this difference, restoring comparability across historical satellite eras.
        </p>
      </div>
    </div>
  );
};
