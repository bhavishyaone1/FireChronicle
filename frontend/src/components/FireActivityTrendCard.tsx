"use client";

import React, { useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CalendarResponse } from "@/types";

interface FireActivityTrendCardProps {
  calendarData: CalendarResponse | null;
  onSelectDate?: (date: string | null) => void;
  selectedDate?: string | null;
  isLoading?: boolean;
}

export const FireActivityTrendCard: React.FC<FireActivityTrendCardProps> = ({
  calendarData,
  onSelectDate,
  selectedDate,
}) => {
  const [activeRange, setActiveRange] = useState("1M");

  const ranges = ["7D", "30D", "3M", "1M", "1Y"];

  const formatShortDate = (iso: string) => {
    try {
      const parts = iso.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = parseInt(parts[1], 10) - 1;
        return `${months[m]} ${parts[2]}`;
      }
    } catch {
      // fallback
    }
    return iso.slice(5);
  };

  const timeseriesData = React.useMemo(() => {
    if (!calendarData || !calendarData.days || calendarData.days.length === 0) {
      return [
        { date: "Mar 01", fullDate: "2026-03-01", MODIS: 124, VIIRS: 876, mean_frp: 32.4 },
        { date: "Mar 02", fullDate: "2026-03-02", MODIS: 142, VIIRS: 910, mean_frp: 35.1 },
        { date: "Mar 03", fullDate: "2026-03-03", MODIS: 98, VIIRS: 720, mean_frp: 29.8 },
        { date: "Mar 04", fullDate: "2026-03-04", MODIS: 110, VIIRS: 830, mean_frp: 31.0 },
        { date: "Mar 05", fullDate: "2026-03-05", MODIS: 135, VIIRS: 890, mean_frp: 34.2 },
        { date: "Mar 06", fullDate: "2026-03-06", MODIS: 150, VIIRS: 940, mean_frp: 36.5 },
        { date: "Mar 07", fullDate: "2026-03-07", MODIS: 115, VIIRS: 820, mean_frp: 30.2 },
      ];
    }

    let all = calendarData.days;
    let sliceCount = all.length;
    if (activeRange === "7D") sliceCount = 7;
    else if (activeRange === "30D" || activeRange === "1M") sliceCount = 30;
    else if (activeRange === "3M") sliceCount = 90;
    else if (activeRange === "1Y") sliceCount = 365;

    const sliced = all.slice(-sliceCount);

    return sliced.map((d) => ({
      date: formatShortDate(d.date),
      fullDate: d.date,
      MODIS: d.modis_raw_count,
      VIIRS: d.viirs_raw_count,
      mean_frp: d.mean_frp_viirs || d.mean_frp_modis || 0,
      matched: d.matched_active_cells || 0,
    }));
  }, [calendarData, activeRange]);

  const maxVal = React.useMemo(() => {
    let m = 20;
    for (const d of timeseriesData) {
      if (d.MODIS > m) m = d.MODIS;
      if (d.VIIRS > m) m = d.VIIRS;
    }
    return Math.ceil(m / 10) * 10;
  }, [timeseriesData]);

  return (
    <div className="rounded-2xl bg-[#0D1017] border border-[#1E2433] p-3 flex flex-col justify-between shadow-lg h-full">
      {/* Header with Title and Range Pills */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1E2433]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2E180A] border border-[#F97316]/40 flex items-center justify-center text-[#F97316] shadow-sm">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight">
              Fire Activity Trend
            </h3>
            {selectedDate && (
              <span className="text-[10px] text-[#F59E0B] font-mono flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                Filtered: {selectedDate}
              </span>
            )}
          </div>
        </div>

        {/* Range Selector Pills */}
        <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-lg border border-[#23293A] text-[10px]">
          {ranges.map((r) => {
            const isActive = activeRange === r;
            return (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={`px-1.5 py-0.5 rounded-md font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#F59E0B] to-[#EA580C] text-[#0A0B0E] shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    : "text-[#8E96A5] hover:text-white"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="flex-1 w-full min-h-[120px] pt-1">
        <ResponsiveContainer width="100%" height={118}>
          <AreaChart
            data={timeseriesData}
            margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length && onSelectDate) {
                const targetDate = state.activePayload[0].payload.fullDate;
                onSelectDate(selectedDate === targetDate ? null : targetDate);
              }
            }}
          >
            <defs>
              <linearGradient id="trendModisGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="trendViirsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6B7280" fontSize={10} tickLine={false} domain={[0, maxVal]} />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#0C0F17]/95 border border-[#23293A] rounded-xl p-2.5 shadow-xl text-xs flex flex-col gap-1 min-w-[140px] pointer-events-none">
                      <div className="font-semibold text-white border-b border-[#1E2433] pb-1 flex items-center justify-between">
                        <span>{data.fullDate || label}</span>
                        <span className="text-[10px] text-[#A4AFBF] font-normal">Click to filter</span>
                      </div>
                      <div className="flex items-center justify-between text-[#38BDF8]">
                        <span>VIIRS 375m:</span>
                        <span className="font-mono font-bold">{data.VIIRS}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#C084FC]">
                        <span>MODIS 1km:</span>
                        <span className="font-mono font-bold">{data.MODIS}</span>
                      </div>
                      {data.mean_frp > 0 && (
                        <div className="flex items-center justify-between text-[#F59E0B] border-t border-[#1E2433] pt-1">
                          <span>Mean FRP:</span>
                          <span className="font-mono font-bold">{data.mean_frp.toFixed(1)} MW</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="VIIRS"
              stroke="#06B6D4"
              strokeWidth={2}
              fill="url(#trendViirsGrad)"
            />
            <Area
              type="monotone"
              dataKey="MODIS"
              stroke="#A855F7"
              strokeWidth={2}
              fill="url(#trendModisGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
