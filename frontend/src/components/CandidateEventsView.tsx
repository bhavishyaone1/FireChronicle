"use client";

import React, { useState, useEffect } from "react";
import { Flame, Clock, MapPin, Layers, AlertTriangle, ArrowRight, ShieldCheck, Crosshair } from "lucide-react";
import { CandidateEvent, CandidateEventsResponse } from "@/types";
import { fetchCandidateEvents } from "@/lib/api";
import { INDIAN_STATES_LIST } from "./Controls";

interface CandidateEventsViewProps {
  bbox: [number, number, number, number];
  startDate: string;
  endDate: string;
  selectedState?: string;
  onSelectEvent?: (event: CandidateEvent) => void;
  onFlyToCentroid?: (coords: [number, number]) => void;
  useIST?: boolean;
}

const INDIAN_STATES_CANDIDATE = INDIAN_STATES_LIST;

export const CandidateEventsView: React.FC<CandidateEventsViewProps> = ({
  bbox,
  startDate,
  endDate,
  selectedState,
  onFlyToCentroid,
  useIST = true,
}) => {
  const [activeState, setActiveState] = useState<string>(selectedState || "ALL");
  const [eventsData, setEventsData] = useState<CandidateEventsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedState) {
      setActiveState(selectedState);
    }
  }, [selectedState]);

  const bboxKey = bbox ? bbox.join(",") : "";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchCandidateEvents({
      bbox,
      startDate,
      endDate,
      state: activeState !== "ALL" ? activeState : undefined,
    })
      .then((res) => {
        if (isMounted) {
          setEventsData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load candidate events:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bboxKey, startDate, endDate, activeState]);

  const events = eventsData?.candidate_events || [];

  return (
    <div className="flex flex-col gap-5 p-5 text-[#F1F5F9]">
      {/* 1. Header & Scientific Caveat Banner */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1606] border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                India Candidate Fire Events
              </h1>
              <p className="text-xs text-[#94A3B8]">
                Multi-pass spatio-temporal cluster grouping across repeat satellite overpasses (1.5 km radius, 24h gap threshold).
              </p>
            </div>
          </div>

          {/* Quick State Filter */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-[#10141F] border border-[#23293A] rounded-xl px-3 py-1.5 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
            <select
              value={activeState}
              onChange={(e) => setActiveState(e.target.value)}
              className="bg-transparent text-xs text-[#E2E8F0] focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-[#10141F]">All Indian States</option>
              {INDIAN_STATES_CANDIDATE.filter(s => s !== "ALL").map((st) => (
                <option key={st} value={st} className="bg-[#10141F]">{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scientific disclaimer notice */}
        <div className="p-3 bg-[#111622] border border-[#1E2738] rounded-xl flex items-start gap-2.5 text-xs text-[#A4AFBF] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#E2E8F0]">Scientific Inference Principle:</strong> Satellite detections from repeat passes do not constitute separate ground fires without event grouping. Conversely, a grouped candidate event is an algorithmic inference, not an official field-confirmed incident.
          </div>
        </div>
      </div>

      {/* 2. Key Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0F131C] border border-[#1E2536] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#7D889B]">Candidate Events</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">{events.length}</span>
            <span className="text-xs text-[#94A3B8]">clusters</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F131C] border border-[#1E2536] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#7D889B]">Contributing Detections</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-[#F59E0B]">
              {eventsData?.total_participating_observations || 0}
            </span>
            <span className="text-xs text-[#94A3B8]">points</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F131C] border border-[#1E2536] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#7D889B]">FSI Large Fire Candidates</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-[#EF4444]">
              {events.filter(e => e.is_large_fire_candidate).length}
            </span>
            <span className="text-xs text-[#94A3B8]">&ge;3 contiguous VIIRS pixels</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F131C] border border-[#1E2536] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#7D889B]">Avg Cluster Persistence</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-[#38BDF8]">
              {events.length > 0
                ? (events.reduce((acc, e) => acc + e.duration_hours, 0) / events.length).toFixed(1)
                : "0.0"}
            </span>
            <span className="text-xs text-[#94A3B8]">hours</span>
          </div>
        </div>
      </div>

      {/* 3. Candidate Event List */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#E2E8F0]">
          Active Candidate Clusters ({events.length})
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#64748B] bg-[#0E121B] rounded-xl border border-[#1C2333]">
            Grouping satellite overpasses across equal-area projected space...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] bg-[#0E121B] rounded-xl border border-[#1C2333]">
            No multi-detection events found for current date and spatial filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {events.map((evt) => {
              const isSelected = selectedEventId === evt.event_id;
              return (
                <div
                  key={evt.event_id}
                  onClick={() => setSelectedEventId(evt.event_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "bg-[#161C2A] border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-[#0E121B] border-[#1C2333] hover:border-[#2C374D] hover:bg-[#121622]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">
                          {evt.event_id}
                        </span>
                        {evt.is_large_fire_candidate && (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#FCA5A5] border border-[#EF4444]/40 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>LFF Candidate</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#A4AFBF] mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#F5B32F]" />
                        <span>{evt.india_district ? `${evt.india_district}, ` : ""}{evt.india_state}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#1A2130] text-[#93C5FD] border border-[#273248]">
                      {evt.total_detections} obs
                    </span>
                  </div>

                  {/* Telemetry info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#090C12] p-2.5 rounded-lg border border-[#181F2E]">
                    <div>
                      <span className="text-[10px] text-[#717E94] block">Max FRP</span>
                      <span className="font-mono font-semibold text-[#F59E0B]">
                        {evt.max_frp_mw !== null ? `${evt.max_frp_mw.toFixed(1)} MW` : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#717E94] block">Max Brightness</span>
                      <span className="font-mono font-semibold text-white">
                        {evt.max_brightness_kelvin !== null ? `${evt.max_brightness_kelvin.toFixed(1)} K` : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#717E94] block">Duration</span>
                      <span className="font-mono text-[#38BDF8]">
                        {evt.duration_hours > 0 ? `${evt.duration_hours} hrs` : "< 1 hr"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#717E94] block">Sensors</span>
                      <span className="font-mono text-[#CBD5E1]">
                        {evt.sensor_breakdown.MODIS}M • {evt.sensor_breakdown.VIIRS}V
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#1C2333] text-xs">
                    <span className="text-[10px] text-[#64748B]">
                      Centroid: {evt.centroid.latitude.toFixed(3)}°N, {evt.centroid.longitude.toFixed(3)}°E
                    </span>
                    {onFlyToCentroid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFlyToCentroid([evt.centroid.longitude, evt.centroid.latitude]);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>Locate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
