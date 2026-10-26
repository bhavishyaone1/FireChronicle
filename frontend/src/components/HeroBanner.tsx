"use client";

import React from "react";
import { Database, Clock, AlertTriangle } from "lucide-react";
import { DatasetProvenance } from "@/types";

interface HeroBannerProps {
  isFirmsConfigured?: boolean;
  provenance?: DatasetProvenance | null;
  latestRecordDate?: string | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  isFirmsConfigured = false,
  provenance,
  latestRecordDate,
}) => {
  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "No records in selected filter";
    try {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = months[d.getUTCMonth()];
        const day = String(d.getUTCDate()).padStart(2, "0");
        const yr = d.getUTCFullYear();
        const hrs = String(d.getUTCHours()).padStart(2, "0");
        const mins = String(d.getUTCMinutes()).padStart(2, "0");
        return `${day} ${m} ${yr}, ${hrs}:${mins} UTC`;
      }
    } catch {
      // fallback
    }
    return iso;
  };

  const isLive = provenance?.is_live || isFirmsConfigured;
  const isSynthetic = provenance?.is_synthetic ?? !isLive;
  const isUploaded = provenance?.provenance_type === "UPLOADED_NASA_FIRMS_CSV";

  const provenanceLabel = isLive
    ? "LIVE NASA FIRMS"
    : isUploaded
    ? "UPLOADED NASA FIRMS CSV"
    : "SYNTHETIC DEMONSTRATION DATA";

  const provenanceSubtitle = isLive
    ? "Direct satellite API stream"
    : isUploaded
    ? "User-imported FIRMS observations"
    : "Illustrative fixture (not real observations)";

  const dataSourceName = isLive
    ? "NASA FIRMS API"
    : isUploaded
    ? "NASA FIRMS CSV"
    : "NASA FIRMS Benchmark (Sample)";

  return (
    <div className="rounded-xl bg-[#10141B] border border-[#28313D] p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Recommended Title and Subtitle */}
        <div className="flex flex-col gap-1 max-w-2xl">
          <h2 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-[#F1F5F9] leading-tight">
            Fire activity overview
          </h2>
          <p className="text-sm font-normal text-[#A4AFBF] leading-relaxed">
            Explore and compare satellite observations of active fire.
          </p>
        </div>

        {/* Right Status Chips */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Data Source Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151A22] border border-[#28313D] text-xs">
            <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#A4AFBF] leading-none">
                Data source
              </span>
              <span className="text-xs font-medium text-[#F1F5F9] mt-0.5">
                {dataSourceName}
              </span>
            </div>
          </div>

          {/* Latest Record Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151A22] border border-[#28313D] text-xs">
            <Clock className="w-3.5 h-3.5 text-[#A4AFBF]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#A4AFBF] leading-none">
                Latest record in selected dataset
              </span>
              <span className="text-xs font-mono tabular-nums text-[#F1F5F9] mt-0.5">
                {formatDateTime(latestRecordDate)}
              </span>
            </div>
          </div>

          {/* Data Provenance Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
              isLive
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : isUploaded
                ? "bg-blue-950/40 border-blue-500/40 text-blue-200"
                : "bg-amber-950/40 border-amber-500/40 text-amber-200"
            }`}
            title={provenance?.description}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive
                  ? "bg-[#34D399]"
                  : isUploaded
                  ? "bg-[#38BDF8]"
                  : "bg-[#F59E0B]"
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold leading-tight tracking-tight">
                {provenanceLabel}
              </span>
              <span className="text-[10px] opacity-80 mt-0.5">
                {provenanceSubtitle}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
