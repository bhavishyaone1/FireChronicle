"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
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
  isLoading?: boolean;
}

export const FireActivityTrendCard: React.FC<FireActivityTrendCardProps> = ({
  calendarData,
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

  const timeseriesData = [
    { date: "Aug 01", MODIS: 14, VIIRS: 18 },
    { date: "Aug 06", MODIS: 21, VIIRS: 26 },
    { date: "Aug 11", MODIS: 12, VIIRS: 16 },
    { date: "Aug 16", MODIS: 24, VIIRS: 28 },
    { date: "Aug 20", MODIS: 15, VIIRS: 21 },
  ];

  return (
    <div className="rounded-2xl bg-[#0D1017] border border-[#1E2433] p-3.5 flex flex-col justify-between shadow-lg h-full">
      {/* Header with Title and Range Pills */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1E2433]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2E180A] border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-white tracking-tight">
            Fire Activity Trend
          </h3>
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
          <AreaChart data={timeseriesData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
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
            <YAxis stroke="#6B7280" fontSize={10} tickLine={false} domain={[0, 30]} ticks={[0, 10, 20, 30]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#10141F",
                borderColor: "#23293A",
                borderRadius: "10px",
                fontSize: "11px",
                color: "#FFFFFF",
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
