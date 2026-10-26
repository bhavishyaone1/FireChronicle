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
      return "bg-[#151A22]/40 text-[#A4AFBF]/40 hover:bg-[#151A22]";
    }
    if (dayRecord.coverage_status === "no_pass" || dayRecord.coverage_status === "cloud_obscured") {
      return "bg-[#151A22]/30 text-[#A4AFBF]/30 border border-dashed border-[#28313D]";
    }
    if (dayRecord.unique_active_cells === 0) {
      return "bg-[#151A22]/60 text-[#A4AFBF]/60 hover:bg-[#151A22] hover:text-[#F1F5F9]";
    }
    const val = dayRecord.unique_active_cells;
    if (val <= 2) return "bg-[#FDE047]/15 text-[#FDE047] border border-[#FDE047]/30";
    if (val <= 5) return "bg-[#F59E0B]/25 text-[#FBBF24] border border-[#F59E0B]/40";
    if (val <= 10) return "bg-[#EA580C]/35 text-[#FB923C] border border-[#EA580C]/50";
    return "bg-[#DC2626]/45 text-red-100 border border-[#DC2626]/60";
  };

  return (
    <div className="bg-[#10141B] border border-[#28313D] rounded-xl p-4 flex flex-col justify-between shadow-sm h-full">
      {/* Header with Title and Segmented Interval */}
      <div className="flex items-center justify-between pb-3 border-b border-[#28313D]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F1F5F9] tracking-tight">
              Burning activity calendar
            </h3>
            <p className="text-xs text-[#A4AFBF] font-normal">
              Daily count of unique active 1.0 km grid cells
            </p>
          </div>
        </div>

        <div className="flex items-center bg-[#090B0F] p-0.5 rounded-lg border border-[#28313D] text-xs">
          {(["daily", "weekly", "monthly"] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setViewInterval(interval)}
              className={`px-2.5 py-0.5 rounded-md font-medium capitalize transition-colors ${
                viewInterval === interval
                  ? "bg-[#151A22] text-[#F1F5F9] border border-[#28313D] font-semibold"
                  : "text-[#A4AFBF] hover:text-[#F1F5F9]"
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
            <span className="text-[13px] font-semibold text-[#F1F5F9]">August 2024</span>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded-md bg-[#090B0F] hover:bg-[#151A22] text-[#A4AFBF] hover:text-[#F1F5F9] transition-colors border border-[#28313D]"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                className="p-1 rounded-md bg-[#090B0F] hover:bg-[#151A22] text-[#A4AFBF] hover:text-[#F1F5F9] transition-colors border border-[#28313D]"
                aria-label="Next month"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#A4AFBF]">
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
                : "bg-transparent text-[#28313D]";
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
                    isSelected ? "ring-2 ring-[#F59E0B] font-bold bg-[#28313D] z-10" : ""
                  }`}
                >
                  {c.dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Activity Summary */}
        <div className="md:col-span-5 bg-[#090B0F] rounded-xl p-3 border border-[#28313D] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDayDateStr}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center justify-between border-b border-[#28313D] pb-1.5">
                <span className="text-xs font-semibold text-[#F1F5F9] flex items-center gap-1.5 font-mono tabular-nums">
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
                  <span className="text-[#A4AFBF] flex items-center gap-1.5 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    Active grid cells
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#F1F5F9]">{activeCells}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A4AFBF] flex items-center gap-1.5 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                    MODIS detections
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#A78BFA]">{modisRaw}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A4AFBF] flex items-center gap-1.5 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                    VIIRS detections
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#38BDF8]">{viirsRaw}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A4AFBF] flex items-center gap-1.5 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                    Candidate matches
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#34D399]">{matchedPairs}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => onSelectDate(activeDayDateStr)}
            className="w-full mt-2 py-1.5 rounded-lg bg-[#151A22] hover:bg-[#1E242E] text-[#F1F5F9] text-xs font-medium flex items-center justify-center gap-1 transition-colors duration-150 border border-[#28313D]"
          >
            <span>Inspect selected day</span>
            <ExternalLink className="w-3 h-3 text-[#F59E0B]" />
          </button>
        </div>
      </div>

      {/* Footer Gradient Legend & Metric Definition */}
      <div className="pt-2 border-t border-[#28313D] flex flex-col gap-1.5 text-[11px] text-[#A4AFBF]">
        <div className="flex items-center justify-between">
          <span>0 (Nominal)</span>
          <div className="h-1.5 w-28 rounded-full bg-gradient-to-r from-[#FDE047] via-[#F59E0B] via-[#EA580C] to-[#DC2626]" />
          <span>High (10+ cells)</span>
        </div>
        <p className="text-[10px] text-[#A4AFBF]/70 leading-tight">
          Metric: Distinct 1.0 km equal-area grid cells with active thermal radiation per 24h UTC window.
        </p>
      </div>
    </div>
  );
};
