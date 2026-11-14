"use client";

import React from "react";
import { BarChart3, Lightbulb, ExternalLink } from "lucide-react";
import { SensorComparisonResponse } from "@/types";

interface SensorComparisonCardProps {
  comparisonData: SensorComparisonResponse | null;
  onViewDeepDive?: () => void;
}

export const SensorComparisonCard: React.FC<SensorComparisonCardProps> = ({
  comparisonData,
  onViewDeepDive,
}) => {
  const modisCount = comparisonData?.modis_total_detections ?? 0;
  const viirsCount = comparisonData?.viirs_total_detections ?? 0;
  const matchedCount = comparisonData?.matched_pairs_count ?? 0;
  const maxVal = Math.max(modisCount, viirsCount, matchedCount, 1);

  const bars = [
    { label: "MODIS (1km)", count: modisCount, color: "#8B5CF6", bgGrad: "from-[#8B5CF6] to-[#6D28D9]" },
    { label: "VIIRS (375m)", count: viirsCount, color: "#06B6D4", bgGrad: "from-[#06B6D4] to-[#0284C7]" },
    { label: "Candidate Pairs", count: matchedCount, color: "#10B981", bgGrad: "from-[#10B981] to-[#059669]" },
  ];

  const modisCi = comparisonData?.uncertainty?.modis_matched_fraction_ci;
  const mitigationPct = comparisonData?.discontinuity?.discontinuity_mitigation_percent;

  return (
    <div className="rounded-2xl bg-[#0D1017] border border-[#1E2433] p-3 flex flex-col justify-between shadow-lg h-full">
      {/* Header with Title and View Details Link */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1E2433]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2E180A] border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight">
              Cross-Sensor Agreement
            </h3>
            <span className="text-[10px] text-[#8E96A5]">
              MODIS C6.1 vs VIIRS C2
            </span>
          </div>
        </div>

        {onViewDeepDive && (
          <button
            onClick={onViewDeepDive}
            className="text-[11px] font-semibold text-[#F97316] hover:text-[#FFAA00] flex items-center gap-1 transition-colors"
          >
            <span>Harmonization Audit</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Content: Bar Chart (Left) + Key Insight Box (Right) */}
      <div className="grid grid-cols-12 gap-2.5 pt-1.5 items-end">
        {/* Left: 3 Vertical Bars */}
        <div className="col-span-6 flex items-end justify-between px-1 h-28">
          {bars.map((bar) => {
            const heightPercent = bar.count > 0 ? Math.max(Math.min(Math.round((bar.count / maxVal) * 100), 100), 12) : 4;

            return (
              <div key={bar.label} className="flex flex-col items-center gap-1 flex-1">
                {/* Count Label */}
                <span className="text-[10px] font-bold font-mono text-white leading-none">
                  {bar.count.toLocaleString()}
                </span>

                {/* Vertical Bar with Top Rounding and Subtle Glow */}
                <div className="w-5 sm:w-6 bg-[#151A26] rounded-t-lg overflow-hidden flex items-end h-[68px]">
                  <div
                    className={`w-full rounded-t-lg bg-gradient-to-t ${bar.bgGrad} transition-all duration-500`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Subtitle */}
                <span className="text-[9px] font-semibold text-[#8E96A5] text-center truncate max-w-[55px]">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Key Insight Callout Box with Empirical Uncertainty */}
        <div className="col-span-6 rounded-xl border border-[#F5B32F]/30 bg-[#16140D] p-2.5 flex flex-col gap-1 shadow-md self-center">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#F5B32F]">
            <Lightbulb className="w-3 h-3 fill-current" />
            <span>Uncertainty & Mitigation</span>
          </div>
          {modisCi ? (
            <p className="text-[10px] text-[#D1D5DB] leading-relaxed">
              MODIS matched: <strong className="text-white">{(modisCi.point_estimate * 100).toFixed(1)}%</strong>{" "}
              <span className="text-[#9CA3AF]">[95% CI: {(modisCi.ci_lower * 100).toFixed(1)}%–{(modisCi.ci_upper * 100).toFixed(1)}%, n={modisCi.sample_size_n}]</span>.
              {mitigationPct !== undefined && mitigationPct > 0 && (
                <span> 1 km grid mitigates <strong className="text-[#10B981]">{mitigationPct}%</strong> of point inflation.</span>
              )}
            </p>
          ) : (
            <p className="text-[10px] text-[#D1D5DB] leading-relaxed">
              Select time and spatial AOI to calculate cross-sensor matching uncertainty and grid-cell Jaccard concordance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
