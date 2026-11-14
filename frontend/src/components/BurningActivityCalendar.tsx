"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CalendarResponse } from "@/types";

interface BurningActivityCalendarProps {
  calendarData: CalendarResponse | null;
  onSelectDate: (date: string | null) => void;
  selectedDate: string | null;
  isLoading?: boolean;
}

export const BurningActivityCalendar: React.FC<BurningActivityCalendarProps> = ({
  calendarData,
  onSelectDate,
  selectedDate,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [monthOffset, setMonthOffset] = useState<number>(0);

  const days = calendarData?.days || [];
  const firstDateStr = days[0]?.date || "2026-03-01";
  const dateParts = firstDateStr.split("-").map(Number);
  const baseYear = dateParts[0] || 2026;
  const baseMonth = (dateParts[1] || 3) - 1; // 0-indexed

  // Active view date after applying month offset
  const activeDate = new Date(baseYear, baseMonth + monthOffset, 1);
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const displayMonthYear = `${monthNames[month]} ${year}`;

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells: {
    dayNum: number;
    inCurrentMonth: boolean;
    dateStr: string;
    status: "high" | "moderate" | "low" | "none";
    record?: any;
  }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    const pDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({ dayNum: d, inCurrentMonth: false, dateStr: pDateStr, status: "none" });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const padded = String(i).padStart(2, "0");
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${padded}`;
    const dayRecord = days.find((d) => d.date === dateStr);

    let status: "high" | "moderate" | "low" | "none" = "none";
    if (dayRecord) {
      if (dayRecord.unique_active_cells >= 6) status = "high";
      else if (dayRecord.unique_active_cells >= 3) status = "moderate";
      else if (dayRecord.unique_active_cells >= 1) status = "low";
    }

    calendarCells.push({ dayNum: i, inCurrentMonth: true, dateStr, status, record: dayRecord });
  }

  // Next month leading days up to 35 or 42
  const targetTotal = calendarCells.length <= 35 ? 35 : 42;
  const trailing = targetTotal - calendarCells.length;
  for (let i = 1; i <= trailing; i++) {
    const nextDate = new Date(year, month + 1, i);
    const nDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarCells.push({ dayNum: i, inCurrentMonth: false, dateStr: nDateStr, status: "none" });
  }

  const getDotColor = (status: "high" | "moderate" | "low" | "none") => {
    switch (status) {
      case "high":
        return "bg-[#EF4444]";
      case "moderate":
        return "bg-[#F97316]";
      case "low":
        return "bg-[#FBBF24]";
      default:
        return "bg-transparent";
    }
  };

  const hoveredCell = hoveredDay !== null ? calendarCells[hoveredDay] : null;

  return (
    <div className="rounded-2xl bg-[#0D1017] border border-[#1E2433] p-3 flex flex-col justify-between shadow-lg h-full relative">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1E2433]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2E180A] border border-[#F97316]/40 flex items-center justify-center text-[#F97316] shadow-sm">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight">
              Monthly Activity Calendar
            </h3>
            <span className="text-[10px] text-[#A4AFBF] font-medium">
              Daily active grid occupancy
            </span>
          </div>
        </div>

        {/* Month Selector Pill */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#141924] border border-[#23293A] text-xs font-semibold text-white">
          <button
            onClick={() => setMonthOffset((prev) => prev - 1)}
            className="p-0.5 text-[#7B8596] hover:text-white transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="w-16 text-center select-none">{displayMonthYear}</span>
          <button
            onClick={() => setMonthOffset((prev) => prev + 1)}
            className="p-0.5 text-[#7B8596] hover:text-white transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: Calendar Grid + Right Legend */}
      <div className="flex items-center justify-between gap-3 pt-1.5">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col gap-0.5">
          {/* Day Headers (Sun to Sat) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#6B7280]">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const isSelected = selectedDate === cell.dateStr;
              const hasActivity = cell.status !== "none";

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (cell.inCurrentMonth) {
                      onSelectDate(isSelected ? null : cell.dateStr);
                    }
                  }}
                  onMouseEnter={() => setHoveredDay(idx)}
                  onMouseLeave={() => setHoveredDay(null)}
                  disabled={!cell.inCurrentMonth}
                  className={`relative h-6 flex flex-col items-center justify-center rounded-lg text-xs font-mono transition-all ${
                    !cell.inCurrentMonth
                      ? "text-[#3A4454] cursor-default"
                      : isSelected
                      ? "bg-[#F97316] text-black font-bold shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                      : "text-[#E2E8F0] hover:bg-[#1A202E]"
                  }`}
                  title={
                    cell.inCurrentMonth && cell.record
                      ? `${cell.dateStr}: ${cell.record.unique_active_cells} active grid cells`
                      : cell.dateStr
                  }
                >
                  <span className="leading-none text-[11px]">{cell.dayNum}</span>
                  {cell.inCurrentMonth && hasActivity && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        isSelected ? "bg-black" : getDotColor(cell.status)
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Status Indicator Legend */}
        <div className="flex flex-col gap-2 pl-2 border-l border-[#1E2433] shrink-0 text-[10px] text-[#A4AFBF]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444]" />
            <span>High Activity (6+ cells)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] shadow-[0_0_6px_#F97316]" />
            <span>Moderate (3-5 cells)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] shadow-[0_0_6px_#FBBF24]" />
            <span>Low Detection (1-2)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#64748B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#334155]" />
            <span>Nominal / Inactive</span>
          </div>
        </div>
      </div>

      {/* Floating Day Info Toast on Hover */}
      {hoveredCell && hoveredCell.inCurrentMonth && hoveredCell.record && (
        <div className="absolute bottom-2 left-3 right-3 bg-[#111622]/95 backdrop-blur-md border border-[#23293A] rounded-lg px-2.5 py-1 text-[10px] font-mono flex items-center justify-between text-white pointer-events-none shadow-md z-10">
          <span className="text-[#F5B32F] font-semibold">{hoveredCell.dateStr}</span>
          <span className="text-[#38BDF8]">{hoveredCell.record.unique_active_cells} Active 1km Cells</span>
          <span className="text-[#C084FC]">
            {hoveredCell.record.modis_raw_count + hoveredCell.record.viirs_raw_count} Hotspots
          </span>
        </div>
      )}
    </div>
  );
};
