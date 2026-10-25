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

  // Determine active day details
  const activeDay = selectedDate
    ? days.find((d) => d.date === selectedDate)
    : days.find((d) => d.unique_active_cells > 0) || days[0];

  const activeDayDateStr = activeDay?.date || "2024-08-12";
  const activeCells = activeDay?.unique_active_cells ?? 68;
  const modisRaw = activeDay?.modis_raw_count ?? 43;
  const viirsRaw = activeDay?.viirs_raw_count ?? 87;
  const matchedPairs = activeDay?.matched_active_cells ?? 32;

  // Format short date: "2024-08-12" -> "Aug 12, 2024"
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

  // Generate 31 calendar days for August 2024
  // August 1, 2024 was a Thursday (index 3 if Mon=0)
  const calendarCells = [];
  const startOffset = 3; // Thu
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

  // Activity heat color mapping
  const getCellHeatStyle = (cellDate: string) => {
    const dayRecord = days.find((d) => d.date === cellDate);
    if (!dayRecord || dayRecord.unique_active_cells === 0) {
      return "bg-[#162032] text-slate-400 hover:bg-[#1C2940]";
    }
    const val = dayRecord.unique_active_cells;
    if (val <= 2) return "bg-amber-900/60 text-amber-200 border-amber-700/60";
    if (val <= 5) return "bg-orange-800/80 text-orange-200 border-orange-600/80";
    if (val <= 10) return "bg-orange-600 text-white font-bold";
    return "bg-red-600 text-white font-extrabold shadow-sm shadow-red-500/40";
  };

  return (
    <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-xl h-full">
      {/* Header with Title and Segmented Interval */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Burning Activity Calendar
          </h3>
        </div>

        <div className="flex items-center bg-[#1E293B] p-0.5 rounded-lg border border-slate-700/60 text-[11px]">
          {(["daily", "weekly", "monthly"] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setViewInterval(interval)}
              className={`px-2.5 py-0.5 rounded-md font-medium capitalize transition-all ${
                viewInterval === interval
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid + Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-2.5">
        {/* Left: Month Navigator & 7x5 Calendar Grid (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-2">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-white">August 2024</span>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded-md bg-[#1E293B] hover:bg-[#283850] text-slate-300 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                className="p-1 rounded-md bg-[#1E293B] hover:bg-[#283850] text-slate-300 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
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
                : "bg-transparent text-slate-400";

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (c.inCurrentMonth) {
                      onSelectDate(isSelected ? null : c.dateStr);
                    }
                  }}
                  className={`h-7 rounded-md text-[11px] font-mono flex items-center justify-center transition-all ${heatClass} ${
                    isSelected ? "ring-2 ring-orange-400 scale-105 z-10 shadow-md shadow-orange-500/30" : ""
                  }`}
                >
                  {c.dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Activity Summary (5 cols) */}
        <div className="md:col-span-5 bg-[#131B2B] rounded-xl p-3 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                {formatDateDisplay(activeDayDateStr)}
              </span>
              {selectedDate && (
                <button
                  onClick={() => onSelectDate(null)}
                  className="text-[9px] text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Active Grid Cells
                </span>
                <span className="font-mono font-bold text-white">{activeCells}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  MODIS Detections
                </span>
                <span className="font-mono font-bold text-white">{modisRaw}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  VIIRS Detections
                </span>
                <span className="font-mono font-bold text-white">{viirsRaw}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Matched Pairs
                </span>
                <span className="font-mono font-bold text-white">{matchedPairs}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectDate(activeDayDateStr)}
            className="w-full mt-2 py-1 rounded-lg bg-[#1E293B] hover:bg-[#283850] text-orange-400 hover:text-orange-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <span>View Day Details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Footer Gradient Legend */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span>Low Activity</span>
        <div className="h-2 w-32 rounded-full bg-gradient-to-r from-[#162032] via-orange-500 to-red-600 border border-slate-700/60" />
        <span>High Activity</span>
      </div>
    </div>
  );
};
