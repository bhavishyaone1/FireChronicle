"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
} from "lucide-react";
import { CalendarResponse, CalendarDaySummary } from "@/types";

interface BurningActivityCalendarProps {
  calendarData: CalendarResponse | null;
  onSelectDate: (date: string | null) => void;
  selectedDate: string | null;
  isLoading?: boolean;
  onViewDeepDive?: () => void;
}

export const BurningActivityCalendar: React.FC<BurningActivityCalendarProps> = ({
  calendarData,
  onSelectDate,
  selectedDate,
  isLoading = false,
  onViewDeepDive,
}) => {
  const [viewInterval, setViewInterval] = useState<"daily" | "weekly" | "monthly">("daily");

  const days = calendarData?.days || [];

  const activeDay = selectedDate
    ? days.find((d) => d.date === selectedDate)
    : days.find((d) => d.unique_active_cells > 0) || days[0];

  const activeDayDateStr = activeDay?.date || "2024-08-12";
  const activeCells = activeDay?.unique_active_cells ?? 68;
  const modisRaw = activeDay?.modis_raw_count ?? 43;
  const viirsRaw = activeDay?.viirs_raw_count ?? 87;
  const matchedPairs = activeDay?.matched_active_cells ?? 32;

  const formatDateDisplay = (iso: string) => {
    try {
      const parts = iso.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = parseInt(parts[1], 10) - 1;
        return `${months[m]} ${parts[2]}, ${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  const calendarCells = [];
  const startOffset = 3;
  const totalDaysInMonth = 31;

  for (let i = 0; i < startOffset; i++) {
    calendarCells.push({ dayNum: 29 + i, inCurrentMonth: false, dateStr: `2024-07-${29 + i}` });
  }
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dayPadded = String(i).padStart(2, "0");
    calendarCells.push({
      dayNum: i,
      inCurrentMonth: true,
      dateStr: `2024-08-${dayPadded}`,
    });
  }
  const remaining = 35 - calendarCells.length;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({
      dayNum: i,
      inCurrentMonth: false,
      dateStr: `2024-09-0${i}`,
    });
  }

  // Black, Red & Orange Heatmap Color Mapping
  const getCellHeatStyle = (cellDate: string) => {
    const dayRecord = days.find((d) => d.date === cellDate);
    if (!dayRecord || dayRecord.unique_active_cells === 0) {
      return "bg-[#0E0E12] text-neutral-500 hover:bg-[#181820]";
    }
    const val = dayRecord.unique_active_cells;
    if (val <= 2) return "bg-[#451A03] text-amber-200 border border-amber-600/50";
    if (val <= 5) return "bg-[#9A3412] text-orange-100 border border-orange-500/60 font-bold";
    if (val <= 10) return "bg-[#DC2626] text-white font-extrabold shadow-sm shadow-red-500/30";
    return "bg-[#EF4444] text-white font-black shadow-md shadow-red-600/50";
  };

  return (
    <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-xl h-full hover:border-orange-500/30 transition-colors">
      {/* Header with Title and Segmented Interval */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="text-sm font-extrabold text-white tracking-tight">
            Burning Activity Calendar
          </h3>
        </div>

        <div className="flex items-center bg-[#0C0C0F] p-0.5 rounded-lg border border-neutral-800 text-[11px]">
          {(["daily", "weekly", "monthly"] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setViewInterval(interval)}
              className={`px-2.5 py-1 rounded-md font-bold capitalize transition-all ${
                viewInterval === interval
                  ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md shadow-orange-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid + Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-2.5">
        {/* Left: Month Navigator & 7x5 Calendar Grid */}
        <div className="md:col-span-7 flex flex-col gap-2">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-white">August 2024</span>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded-md bg-[#0C0C0F] hover:bg-neutral-800 text-neutral-300 hover:text-orange-400 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                className="p-1 rounded-md bg-[#0C0C0F] hover:bg-neutral-800 text-neutral-300 hover:text-orange-400 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((c, idx) => {
              const isSelected = selectedDate === c.dateStr;
              const heatClass = c.inCurrentMonth
                ? getCellHeatStyle(c.dateStr)
                : "bg-transparent text-neutral-700";

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (c.inCurrentMonth) {
                      onSelectDate(isSelected ? null : c.dateStr);
                    }
                  }}
                  className={`h-7 rounded-md text-[11px] font-mono font-semibold flex items-center justify-center transition-all ${heatClass} ${
                    isSelected ? "ring-2 ring-orange-400 scale-105 z-10 shadow-lg shadow-orange-500/50" : ""
                  }`}
                >
                  {c.dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Activity Summary */}
        <div className="md:col-span-5 bg-[#0C0C0F] rounded-xl p-3 border border-neutral-900 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {formatDateDisplay(activeDayDateStr)}
              </span>
              {selectedDate && (
                <button
                  onClick={() => onSelectDate(null)}
                  className="text-[9px] text-orange-400 hover:text-orange-300 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Active Grid Cells
                </span>
                <span className="font-mono font-bold text-white">{activeCells}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  MODIS Detections
                </span>
                <span className="font-mono font-bold text-orange-400">{modisRaw}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  VIIRS Detections
                </span>
                <span className="font-mono font-bold text-red-400">{viirsRaw}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Matched Pairs
                </span>
                <span className="font-mono font-bold text-amber-400">{matchedPairs}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectDate(activeDayDateStr)}
            className="w-full mt-2 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md shadow-orange-600/30"
          >
            <span>View Day Details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Footer Gradient Legend */}
      <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400">
        <span className="font-semibold">Low Activity</span>
        <div className="h-2 w-32 rounded-full bg-gradient-to-r from-[#0E0E12] via-[#EA580C] to-[#EF4444] border border-neutral-800" />
        <span className="text-orange-400 font-bold">High Activity</span>
      </div>
    </div>
  );
};
