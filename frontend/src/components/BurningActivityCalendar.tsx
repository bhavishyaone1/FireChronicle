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

  const activeDayDateStr = activeDay?.date || (days[0]?.date ?? "2024-08-01");
  const activeCells = activeDay?.unique_active_cells ?? 0;
  const modisRaw = activeDay?.modis_raw_count ?? 0;
  const viirsRaw = activeDay?.viirs_raw_count ?? 0;
  const matchedPairs = activeDay?.matched_active_cells ?? 0;

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
    if (!dayRecord) {
      return "bg-[#16191F]/40 text-[#A4AAB5]/40 hover:bg-[#16191F]";
    }
    if (dayRecord.coverage_status === "no_pass" || dayRecord.coverage_status === "cloud_obscured") {
      return "bg-[#16191F]/30 text-[#A4AAB5]/30 border border-dashed border-[#282D35]";
    }
    if (dayRecord.unique_active_cells === 0) {
      return "bg-[#16191F]/60 text-[#A4AAB5]/60 hover:bg-[#16191F] hover:text-[#F3F4F6]";
    }
    const val = dayRecord.unique_active_cells;
    if (val <= 2) return "bg-[#451A03] text-amber-200 border border-amber-600/40";
    if (val <= 5) return "bg-[#9A3412] text-orange-100 border border-orange-500/50";
    if (val <= 10) return "bg-[#C2410C] text-white";
    return "bg-[#EF4444] text-white";
  };

  return (
    <div className="bg-[#101216] border border-[#282D35] rounded-xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Header with Title and Segmented Interval */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282D35]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F3F4F6] tracking-tight">
              Burning activity calendar
            </h3>
            <p className="text-xs text-[#A4AAB5] font-normal">
              Daily count of unique active 1.0 km grid cells
            </p>
          </div>
        </div>

        <div className="flex items-center bg-[#090A0C] p-0.5 rounded-lg border border-[#282D35] text-xs">
          {(["daily", "weekly", "monthly"] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setViewInterval(interval)}
              className={`px-2.5 py-0.5 rounded-md font-medium capitalize transition-colors ${
                viewInterval === interval
                  ? "bg-[#16191F] text-[#F3F4F6] border border-[#282D35] font-semibold"
                  : "text-[#A4AAB5] hover:text-[#F3F4F6]"
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
            <span className="text-[13px] font-semibold text-[#F3F4F6]">August 2024</span>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded-md bg-[#090A0C] hover:bg-[#16191F] text-[#A4AAB5] hover:text-[#F3F4F6] transition-colors border border-[#282D35]"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                className="p-1 rounded-md bg-[#090A0C] hover:bg-[#16191F] text-[#A4AAB5] hover:text-[#F3F4F6] transition-colors border border-[#282D35]"
                aria-label="Next month"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#A4AAB5]">
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
                : "bg-transparent text-[#282D35]";
              const dayRecord = days.find((d) => d.date === c.dateStr);

              return (
                <button
                  key={idx}
                  data-date={c.dateStr}
                  title={
                    c.inCurrentMonth
                      ? `${c.dateStr}: ${
                          dayRecord
                            ? `${dayRecord.unique_active_cells} active cells, ${dayRecord.modis_raw_count} MODIS, ${dayRecord.viirs_raw_count} VIIRS`
                            : "No active cells recorded"
                        }`
                      : undefined
                  }
                  onClick={() => {
                    if (c.inCurrentMonth) {
                      onSelectDate(isSelected ? null : c.dateStr);
                    }
                  }}
                  className={`h-7 rounded-md text-xs font-mono tabular-nums font-medium flex items-center justify-center transition-colors duration-150 motion-reduce:transition-none ${heatClass} ${
                    isSelected ? "ring-2 ring-[#F59E0B] font-bold bg-[#282D35] z-10" : ""
                  }`}
                >
                  {c.dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Activity Summary */}
        <div className="md:col-span-5 bg-[#090A0C] rounded-xl p-3 border border-[#282D35] flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-[#282D35] pb-1.5">
              <span className="text-xs font-semibold text-[#F3F4F6] flex items-center gap-1.5 font-mono tabular-nums">
                <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                {formatDateDisplay(activeDayDateStr)}
              </span>
              {selectedDate && (
                <button
                  onClick={() => onSelectDate(null)}
                  className="text-[11px] text-[#F59E0B] hover:text-[#fbbf24] font-medium transition-colors duration-150"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A4AAB5] flex items-center gap-1.5 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active grid cells
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#F3F4F6]">{activeCells}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#A4AAB5] flex items-center gap-1.5 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  MODIS detections
                </span>
                <span className="font-mono tabular-nums font-semibold text-amber-400">{modisRaw}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#A4AAB5] flex items-center gap-1.5 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  VIIRS detections
                </span>
                <span className="font-mono tabular-nums font-semibold text-red-400">{viirsRaw}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#A4AAB5] flex items-center gap-1.5 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Candidate matches
                </span>
                <span className="font-mono tabular-nums font-semibold text-blue-400">{matchedPairs}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectDate(activeDayDateStr)}
            className="w-full mt-2 py-1.5 rounded-lg bg-[#16191F] hover:bg-[#20252E] text-[#F3F4F6] text-xs font-medium flex items-center justify-center gap-1 transition-colors duration-150 border border-[#282D35]"
          >
            <span>Inspect selected day</span>
            <ExternalLink className="w-3 h-3 text-[#F59E0B]" />
          </button>
        </div>
      </div>

      {/* Footer Gradient Legend & Metric Definition */}
      <div className="pt-2 border-t border-[#282D35] flex flex-col gap-1.5 text-[11px] text-[#A4AAB5]">
        <div className="flex items-center justify-between">
          <span>0 (Nominal)</span>
          <div className="h-1.5 w-28 rounded-full bg-gradient-to-r from-[#451A03] via-[#C2410C] to-[#EF4444]" />
          <span>High (10+ cells)</span>
        </div>
        <p className="text-[10px] text-[#A4AAB5]/70 leading-tight">
          Metric: Distinct 1.0 km equal-area grid cells with active thermal radiation per 24h UTC window.
        </p>
      </div>
    </div>
  );
};
