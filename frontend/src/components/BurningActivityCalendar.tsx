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
        return `${parts[2]} ${months[m]} ${parts[0]}`;
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

  const getCellHeatStyle = (cellDate: string) => {
    const dayRecord = days.find((d) => d.date === cellDate);
    if (!dayRecord || dayRecord.unique_active_cells === 0) {
      return "bg-neutral-900/60 text-neutral-500 hover:bg-neutral-800";
    }
    const val = dayRecord.unique_active_cells;
    if (val <= 2) return "bg-[#451A03] text-amber-200 border border-amber-600/40";
    if (val <= 5) return "bg-[#9A3412] text-orange-100 border border-orange-500/50";
    if (val <= 10) return "bg-[#DC2626] text-white";
    return "bg-[#EF4444] text-white";
  };

  return (
    <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Header with Title and Segmented Interval */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Burning activity calendar
          </h3>
        </div>

        <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
          {(["daily", "weekly", "monthly"] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setViewInterval(interval)}
              className={`px-2.5 py-0.5 rounded-md font-medium capitalize transition-all ${
                viewInterval === interval
                  ? "bg-neutral-800 text-white font-semibold"
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
          <div className="flex items-center justify-between px-1">
            <span className="text-[13px] font-semibold text-white">August 2024</span>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded-md bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                className="p-1 rounded-md bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-neutral-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

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
                  className={`h-7 rounded-md text-xs font-mono tabular-nums font-medium flex items-center justify-center transition-all ${heatClass} ${
                    isSelected ? "ring-2 ring-orange-500 scale-105 z-10" : ""
                  }`}
                >
                  {c.dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Activity Summary */}
        <div className="md:col-span-5 bg-neutral-950 rounded-xl p-3 border border-neutral-900 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5 font-mono tabular-nums">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                {formatDateDisplay(activeDayDateStr)}
              </span>
              {selectedDate && (
                <button
                  onClick={() => onSelectDate(null)}
                  className="text-[11px] text-orange-400 hover:text-orange-300 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Active grid cells
                </span>
                <span className="font-mono tabular-nums font-semibold text-white">{activeCells}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  MODIS detections
                </span>
                <span className="font-mono tabular-nums font-semibold text-orange-400">{modisRaw}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  VIIRS detections
                </span>
                <span className="font-mono tabular-nums font-semibold text-red-400">{viirsRaw}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Matched pairs
                </span>
                <span className="font-mono tabular-nums font-semibold text-amber-400">{matchedPairs}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectDate(activeDayDateStr)}
            className="w-full mt-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-orange-400 hover:text-orange-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors border border-neutral-800"
          >
            <span>Inspect selected day</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Footer Gradient Legend */}
      <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Low activity</span>
        <div className="h-1.5 w-28 rounded-full bg-gradient-to-r from-neutral-800 via-[#EA580C] to-[#EF4444]" />
        <span>High activity</span>
      </div>
    </div>
  );
};
