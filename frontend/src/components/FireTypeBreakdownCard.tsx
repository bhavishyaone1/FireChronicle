"use client";

import React, { useState, useEffect } from "react";
import { FireTypeBreakdownResponse } from "@/types";
import { fetchFireTypesBreakdown } from "@/lib/api";

interface FireTypeBreakdownCardProps {
  bbox?: [number, number, number, number];
  startDate?: string;
  endDate?: string;
  activeTypeFilter?: string;
  onSelectTypeFilter?: (type: string) => void;
  className?: string;
}

export function FireTypeBreakdownCard({
  bbox,
  startDate,
  endDate,
  activeTypeFilter = "ALL",
  onSelectTypeFilter,
  className = "",
}: FireTypeBreakdownCardProps) {
  const [data, setData] = useState<FireTypeBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetchFireTypesBreakdown({ bbox, startDate, endDate });
        if (mounted) setData(res);
      } catch (err) {
        console.warn("Could not load fire type breakdown:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [bbox, startDate, endDate]);

  const total = data?.total_detections || 0;
  const hasReported = data?.has_firms_reported_type || false;

  return (
    <div className={`bg-[#0c1017]/90 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md shadow-xl text-slate-200 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Thermal Anomaly Type Intelligence
            </h3>
            {hasReported ? (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                FIRMS Standard Quality
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                NRT Feed (Inferred Context)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Scientific Terminology: Thermal anomaly / active fire detection &bull; Not confirmed wildfire perimeters
          </p>
        </div>

        {onSelectTypeFilter && activeTypeFilter !== "ALL" && (
          <button
            onClick={() => onSelectTypeFilter("ALL")}
            className="text-xs text-orange-400 hover:text-orange-300 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/30 transition-colors"
          >
            Reset Filter ({activeTypeFilter})
          </button>
        )}
      </div>

      {/* Scientific Principle Notice */}
      <div className="mb-3.5 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
        <span className="text-orange-400 text-sm leading-none">&bull;</span>
        <div className="leading-snug">
          <strong className="text-slate-200 font-medium">NASA FIRMS Standard:</strong> Standard-quality data provides validated <code className="text-amber-300 font-mono">type</code> classes (0–3). In Near Real-Time (NRT) streams where the type field is absent, labels are strictly marked <span className="text-cyan-300 font-medium">Inferred (method)</span>. Type filtering is isolated from harmonized grid counts unless explicitly activated.
        </div>
      </div>

      {/* Main Content: Split between FIRMS Reported vs NRT Inferred */}
      <div className="space-y-4">
        {/* SECTION 1: REPORTED BY FIRMS */}
        {hasReported && data?.reported_by_firms && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reported by FIRMS (Standard Processing)
              </span>
              <span className="font-mono text-slate-400">
                {data.firms_reported_total.toLocaleString()} detections
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Type 0: Vegetation */}
              <div
                onClick={() => onSelectTypeFilter?.("VEGETATION")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  activeTypeFilter === "VEGETATION"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-200"
                    : "bg-slate-900/50 border-slate-800/80 hover:border-emerald-500/50 text-slate-300"
                }`}
                title="Method: FIRMS Standard Science Quality Active Fire Algorithm. Presumed vegetation fire."
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Type 0</div>
                <div className="text-xs font-medium text-slate-100 truncate">Vegetation</div>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                  {data.reported_by_firms.vegetation_type_0.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  {total > 0 ? ((data.reported_by_firms.vegetation_type_0 / total) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* Type 2: Static Land Source */}
              <div
                onClick={() => onSelectTypeFilter?.("STATIC")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  activeTypeFilter === "STATIC"
                    ? "bg-amber-500/20 border-amber-500 text-amber-200"
                    : "bg-slate-900/50 border-slate-800/80 hover:border-amber-500/50 text-slate-300"
                }`}
                title="Method: NASA FIRMS Global Industrial & Gas Flare Database. Permanent thermal emitters."
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Type 2</div>
                <div className="text-xs font-medium text-slate-100 truncate">Static Industrial</div>
                <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                  {data.reported_by_firms.other_static_land_source_type_2.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  {total > 0 ? ((data.reported_by_firms.other_static_land_source_type_2 / total) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* Type 3: Offshore */}
              <div
                onClick={() => onSelectTypeFilter?.("OFFSHORE")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  activeTypeFilter === "OFFSHORE"
                    ? "bg-blue-500/20 border-blue-500 text-blue-200"
                    : "bg-slate-900/50 border-slate-800/80 hover:border-blue-500/50 text-slate-300"
                }`}
                title="Method: NASA FIRMS Global Marine Land-Sea Mask. Marine gas flaring & oil rigs."
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Type 3</div>
                <div className="text-xs font-medium text-slate-100 truncate">Offshore Flaring</div>
                <div className="text-sm font-bold font-mono text-blue-400 mt-0.5">
                  {data.reported_by_firms.offshore_type_3.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  {total > 0 ? ((data.reported_by_firms.offshore_type_3 / total) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* Type 1: Volcano */}
              <div
                onClick={() => onSelectTypeFilter?.("VOLCANO")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  activeTypeFilter === "VOLCANO"
                    ? "bg-rose-500/20 border-rose-500 text-rose-200"
                    : "bg-slate-900/50 border-slate-800/80 hover:border-rose-500/50 text-slate-300"
                }`}
                title="Method: NASA FIRMS Global Volcanism Database Correlation."
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Type 1</div>
                <div className="text-xs font-medium text-slate-100 truncate">Volcano</div>
                <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
                  {data.reported_by_firms.active_volcano_type_1.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  {total > 0 ? ((data.reported_by_firms.active_volcano_type_1 / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: INFERRED CONTEXT FOR NRT DATA */}
        {data?.inferred_nrt && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5 text-amber-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Type not provided in NRT data &mdash; Inferred (Method)
              </span>
              <span className="font-mono text-slate-400">
                {data.nrt_inferred_total.toLocaleString()} detections
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Crop Residue */}
              <div
                onClick={() => onSelectTypeFilter?.("VEGETATION")}
                className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/70 hover:border-amber-500/40 transition-colors cursor-pointer"
                title="Method: Inferred (ISRO Bhuvan agricultural fire overlap & Copernicus 100m cropland mask during harvest season). Limit: Mixed farm-woodland edge pixels."
              >
                <div className="text-[10px] text-amber-400 font-medium">Inferred (Cropland/Bhuvan)</div>
                <div className="text-xs font-medium text-slate-200">Crop Residue</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                  {data.inferred_nrt.agricultural_context.toLocaleString()}
                </div>
              </div>

              {/* Forest Fire */}
              <div
                onClick={() => onSelectTypeFilter?.("VEGETATION")}
                className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/70 hover:border-emerald-500/40 transition-colors cursor-pointer"
                title="Method: Inferred (FSI Van Agni alert perimeter & Bhuvan forest type overlay). Limit: Cloud cover & understory attenuation."
              >
                <div className="text-[10px] text-emerald-400 font-medium">Inferred (Forest/FSI)</div>
                <div className="text-xs font-medium text-slate-200">Forest Context</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                  {data.inferred_nrt.forest_context.toLocaleString()}
                </div>
              </div>

              {/* Static Industrial */}
              <div
                onClick={() => onSelectTypeFilter?.("STATIC")}
                className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/70 hover:border-amber-500/40 transition-colors cursor-pointer"
                title="Method: Inferred (Persistence across >=3 passes at identical coordinates within 500m). Limit: Cannot separate gas flares from coal-seam smoldering."
              >
                <div className="text-[10px] text-amber-300 font-medium">Inferred (&ge;3 Day Persistence)</div>
                <div className="text-xs font-medium text-slate-200">Repeat Static Emitter</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                  {data.inferred_nrt.static_industrial_context.toLocaleString()}
                </div>
              </div>

              {/* Offshore */}
              <div
                onClick={() => onSelectTypeFilter?.("OFFSHORE")}
                className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/70 hover:border-blue-500/40 transition-colors cursor-pointer"
                title="Method: Inferred (Natural Earth 1:10m Land-Sea Boundary >5 km seaward). Limit: Intertidal mudflats and sandbars."
              >
                <div className="text-[10px] text-blue-400 font-medium">Inferred (Land-Sea Mask)</div>
                <div className="text-xs font-medium text-slate-200">Offshore Marine</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                  {data.inferred_nrt.offshore_context.toLocaleString()}
                </div>
              </div>

              {/* Volcano */}
              <div
                onClick={() => onSelectTypeFilter?.("VOLCANO")}
                className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/70 hover:border-rose-500/40 transition-colors cursor-pointer"
                title="Method: Inferred (Barren Island Active Crater Geological Perimeter [93.85°E, 12.28°N])."
              >
                <div className="text-[10px] text-rose-400 font-medium">Inferred (Geological Area)</div>
                <div className="text-xs font-medium text-slate-200">Volcanic Anomaly</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                  {data.inferred_nrt.volcanic_context.toLocaleString()}
                </div>
              </div>

              {/* Unclassified */}
              <div
                onClick={() => onSelectTypeFilter?.("UNCLASSIFIED")}
                className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/70 hover:border-slate-500 transition-colors cursor-pointer"
                title="Context: Ambiguous land cover or insufficient overlap; intentionally unclassified to preserve scientific integrity."
              >
                <div className="text-[10px] text-slate-400 font-medium">Inferred (Ambiguous)</div>
                <div className="text-xs font-medium text-slate-200">Unclassified</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                  {data.inferred_nrt.unclassified_context.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FireTypeBreakdownCard;
