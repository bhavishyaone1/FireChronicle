"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const days = calendarData?.days || [];

  const displayDate = hoveredDate || selectedDate;
  const activeDay = displayDate
    ? days.find((d) => d.date === displayDate)
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
      return "bg-[#171A20]/40 text-[#B1B7C1]/40 hover:bg-[#171A20]";
    }
    if (dayRecord.coverage_status === "no_pass" || dayRecord.coverage_status === "cloud_obscured") {
      return "bg-[#171A20]/30 text-[#858D99]/40 border border-dashed border-[#2A3039]";
    }
    if (dayRecord.unique_active_cells === 0) {
      return "bg-[#171A20]/60 text-[#B1B7C1]/60 hover:bg-[#171A20] hover:text-[#F4F5F7]";
    }
    const val = dayRecord.unique_active_cells;
    if (val <= 2) return "bg-[#FFD166]/15 text-[#FFD166] border border-[#FFD166]/30";
    if (val <= 5) return "bg-[#F5B32F]/25 text-[#F5B32F] border border-[#F5B32F]/40";
    if (val <= 10) return "bg-[#F47A24]/35 text-[#F47A24] border border-[#F47A24]/50";
    return "bg-[#E5484D]/45 text-red-100 border border-[#E5484D]/60";
  };

  return (
    <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Header with Title and Segmented Interval */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3039]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F5B32F]/10 border border-[#F5B32F]/25 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-[#F5B32F]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F4F5F7] tracking-tight">
              Burning activity calendar
            </h3>
            <p className="text-xs text-[#B1B7C1] font-normal">
              Daily count of unique active 1.0 km grid cells
            </p>
          </div>
        </div>

        <div className="flex items-center bg-[#08090B] p-0.5 rounded-lg border border-[#2A3039] text-xs">
          {(["daily", "weekly", "monthly"] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setViewInterval(interval)}
              className={`px-2.5 py-0.5 rounded-md font-medium capitalize transition-colors ${
                viewInterval === interval
                  ? "bg-[#171A20] text-[#F4F5F7] border border-[#2A3039] font-semibold"
                  : "text-[#B1B7C1] hover:text-[#F4F5F7]"
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
            <span className="text-[13px] font-semibold text-[#F4F5F7]">August 2024</span>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded-md bg-[#08090B] hover:bg-[#171A20] text-[#B1B7C1] hover:text-[#F4F5F7] transition-colors border border-[#2A3039]"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                className="p-1 rounded-md bg-[#08090B] hover:bg-[#171A20] text-[#B1B7C1] hover:text-[#F4F5F7] transition-colors border border-[#2A3039]"
                aria-label="Next month"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#B1B7C1]">
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
              const isHovered = hoveredDate === c.dateStr;
              const heatClass = c.inCurrentMonth
                ? getCellHeatStyle(c.dateStr)
                : "bg-transparent text-[#2A3039]";
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
                  onMouseEnter={() => {
                    if (c.inCurrentMonth) setHoveredDate(c.dateStr);
                  }}
                  onMouseLeave={() => setHoveredDate(null)}
                  onClick={() => {
                    if (c.inCurrentMonth) {
                      onSelectDate(isSelected ? null : c.dateStr);
                    }
                  }}
                  className={`h-7 rounded-md text-xs font-mono tabular-nums font-medium flex items-center justify-center transition-all duration-150 motion-reduce:transition-none ${heatClass} ${
                    isSelected
                      ? "ring-2 ring-[#F5B32F] font-bold bg-[#2A3039] z-10 scale-105"
                      : isHovered
                      ? "ring-1 ring-[#F4F5F7]/60 z-10 scale-105"
                      : "hover:scale-105"
                  }`}
                >
                  {c.dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Activity Summary */}
        <div className="md:col-span-5 bg-[#08090B] rounded-xl p-3 border border-[#2A3039] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDayDateStr}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center justify-between border-b border-[#2A3039] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#F5B32F]" />
                  <span className="text-xs font-semibold text-[#F4F5F7] font-mono tabular-nums">
                    {formatDateDisplay(activeDayDateStr)}
                  </span>
                  {hoveredDate && hoveredDate !== selectedDate && (
                    <span className="text-[10px] px-1 rounded bg-[#171A20] text-[#B1B7C1] border border-[#2A3039] leading-none py-0.5">
                      Preview
                    </span>
                  )}
                  {selectedDate === activeDayDateStr && (
                    <span className="text-[10px] px-1 rounded bg-[#F5B32F]/20 text-[#F5B32F] border border-[#F5B32F]/40 leading-none py-0.5 font-medium">
                      Focused
                    </span>
                  )}
                </div>
                {selectedDate && (
                  <button
                    onClick={() => onSelectDate(null)}
                    className="text-[11px] text-[#F5B32F] hover:text-[#F47A24] font-medium transition-colors duration-150"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#B1B7C1] flex items-center gap-1.5 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5B32F]" />
                    Active grid cells
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#F4F5F7]">{activeCells}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#B1B7C1] flex items-center gap-1.5 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                    MODIS detections
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#A78BFA]">{modisRaw}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#B1B7C1] flex items-center gap-1.5 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                    VIIRS detections
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#38BDF8]">{viirsRaw}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#B1B7C1] flex items-center gap-1.5 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                    Candidate correspondences
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#34D399]">{matchedPairs}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => onSelectDate(activeDayDateStr)}
            className="w-full mt-2 py-1.5 rounded-lg bg-[#171A20] hover:bg-[#1D222A] text-[#F4F5F7] text-xs font-medium flex items-center justify-center gap-1 transition-colors duration-150 border border-[#2A3039]"
          >
            <span>Inspect selected day</span>
            <ExternalLink className="w-3 h-3 text-[#F5B32F]" />
          </button>
        </div>
      </div>

      {/* Footer Gradient Legend & Metric Definition */}
      <div className="pt-2 border-t border-[#2A3039] flex flex-col gap-1.5 text-[11px] text-[#B1B7C1]">
        <div className="flex items-center justify-between">
          <span>0 (Nominal)</span>
          <div className="h-1.5 w-28 rounded-full bg-gradient-to-r from-[#FFD166] via-[#F5B32F] via-[#F47A24] to-[#E5484D]" />
          <span>High (10+ cells)</span>
        </div>
        <p className="text-[10px] text-[#858D99] leading-tight">
          Metric: Distinct 1.0 km equal-area grid cells with active thermal radiation per 24h UTC window.
        </p>
      </div>
    </div>
  );
};
