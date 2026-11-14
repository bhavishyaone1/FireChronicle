"use client";

import React, { useState, useEffect } from "react";
import { SatelliteConfigPayload } from "@/types";
import { SATELLITE_STATUS_CONFIG } from "@/config/satellites";
import { fetchSatellites } from "@/lib/api";

interface SatelliteStatusPanelProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function SatelliteStatusPanel({
  className = "",
  defaultExpanded = false,
}: SatelliteStatusPanelProps) {
  const [data, setData] = useState<SatelliteConfigPayload>(SATELLITE_STATUS_CONFIG);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const dynamicData = await fetchSatellites();
        if (mounted && dynamicData?.satellites?.length > 0) {
          setData(dynamicData);
        }
      } catch (err) {
        console.warn("Using offline verified satellite configuration:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const getStatusBadge = (statusType: string) => {
    if (statusType === "ended") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Ended
        </span>
      );
    }
    if (statusType === "active_drifting") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Active (Drifting)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    );
  };

  return (
    <div className={`bg-[#0c1017]/90 border border-slate-800/80 rounded-xl backdrop-blur-md shadow-lg text-slate-200 overflow-hidden ${className}`}>
      {/* 1. Header Bar - Clickable to expand/collapse */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between px-3.5 py-2 sm:py-2.5 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 cursor-pointer select-none transition-colors hover:bg-slate-800/50 ${
          isExpanded ? "border-b border-slate-800/80" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-semibold tracking-wide text-slate-100 uppercase shrink-0">
              Satellite Constellation Status
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-mono tracking-wider uppercase rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
              Verified: {data.last_verified_utc}
            </span>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="text-slate-600">&bull;</span>
              <span className="text-emerald-400 font-medium">4 Active</span>
              <span className="text-slate-500">(Terra, Aqua, NOAA-20/21)</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-rose-400 font-medium">1 Archive</span>
              <span className="text-slate-500">(S-NPP ended 2026-11-02)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={data.verification_source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 hover:underline transition-colors px-2 py-0.5 rounded bg-orange-500/5 border border-orange-500/20"
          >
            <span>FIRMS Docs</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            type="button"
            className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors flex items-center gap-1 border border-slate-700"
            title={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            <span>{isExpanded ? "Collapse" : "View Sensor Lifespans"}</span>
            <svg
              className={`w-3 h-3 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Expanded Content: Timeline Bar & Detailed Table */}
      {isExpanded && (
        <>
          {/* Visual Sensor Timeline Bar */}
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/60">
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>2000 (MODIS Terra Launch)</span>
                <span>2012 (VIIRS S-NPP)</span>
                <span>2018 (NOAA-20)</span>
                <span>2023 (NOAA-21)</span>
                <span className="text-rose-400 font-bold">2026-11-02 (S-NPP End)</span>
                <span>2027 (MODIS EOL)</span>
              </div>
              {/* Constellation Tracks */}
              <div className="space-y-1">
                {/* MODIS Track */}
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] font-bold text-amber-400/90 tracking-wider">MODIS</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full"
                      style={{ width: "95%" }}
                      title="MODIS (Terra 2000–Jan 2027, Aqua 2002–Sep 2027)"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-20 text-right">2000–2027</span>
                </div>
                {/* VIIRS Track */}
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] font-bold text-cyan-400/90 tracking-wider">VIIRS</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 relative overflow-hidden flex">
                    <div
                      className="h-full bg-slate-600 rounded-l-full"
                      style={{ width: "42%" }}
                      title="Pre-VIIRS (2000–2012)"
                    />
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-400"
                      style={{ width: "58%" }}
                      title="VIIRS Era (2012–Present; S-NPP ended Nov 02, 2026; NOAA-20 & NOAA-21 operational)"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-20 text-right">2012–Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Sensor Rows */}
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/70 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2 px-3">Platform</th>
                  <th className="py-2 px-3">Sensor &amp; Resolution</th>
                  <th className="py-2 px-3">Overpass Schedule</th>
                  <th className="py-2 px-3">Operational Status</th>
                  <th className="py-2 px-3">Data in View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-normal">
                {data.satellites.map((sat) => {
                  const isEnded = sat.status_type === "ended";
                  return (
                    <tr
                      key={sat.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isEnded ? "bg-rose-950/10 text-slate-300" : ""
                      }`}
                    >
                      {/* Platform */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <span>{sat.name}</span>
                          {isEnded && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-900/40 text-rose-300 font-mono">
                              ARCHIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {sat.operational_span}
                        </div>
                      </td>

                      {/* Sensor & Resolution */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-200">
                          {sat.sensor}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sat.resolution}
                        </div>
                      </td>

                      {/* Overpass */}
                      <td className="py-2.5 px-3">
                        <div className="text-slate-300">{sat.overpass_times}</div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          <div>{getStatusBadge(sat.status_type)}</div>
                          <span className="text-[11px] text-slate-400">
                            {sat.status}
                          </span>
                        </div>
                      </td>

                      {/* Data in View Range */}
                      <td className="py-2.5 px-3 font-mono text-xs">
                        {sat.loaded_count && sat.loaded_count > 0 ? (
                          <div>
                            <span className="text-emerald-400 font-semibold">
                              {sat.loaded_count.toLocaleString()} obs
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {sat.loaded_first_date} &rarr; {sat.loaded_last_date}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            None in current filter
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
