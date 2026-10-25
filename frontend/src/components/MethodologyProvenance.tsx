"use client";

import React from "react";
import { BookOpen, ShieldAlert } from "lucide-react";

export const MethodologyProvenance: React.FC = () => {
  const stages = [
    { num: 1, title: "Ingestion and manifest", desc: "Retrieve verified NASA FIRMS CSVs with immutable SHA-256 retrieval manifests." },
    { num: 2, title: "Schema validation", desc: "Validate coordinate ranges ([-90, 90], [-180, 180]), ISO UTC timestamps, and physical FRP ceilings." },
    { num: 3, title: "Field normalization", desc: "Deterministic observation SHA-256 hash generation and confidence scale mapping." },
    { num: 4, title: "Defensible filtering", desc: "Preserve raw records in analytical store; apply transparent user-controlled confidence thresholds." },
    { num: 5, title: "Spatial analysis", desc: "Assign equal-area projected 1.0 km cylindrical grid cells to neutralize pixel footprint inflation." },
    { num: 6, title: "Temporal synchronization", desc: "Chronological alignment of overpass times using authentic UTC timestamps." },
    { num: 7, title: "Candidate cross-matching", desc: "Identify collocated detections within ≤ 1000m and ≤ 60 min orbital windows." },
    { num: 8, title: "Classification", desc: "Categorize records into matched pairs, MODIS-only detections, or VIIRS-only detections." },
    { num: 9, title: "Calendar aggregation", desc: "Synthesize daily burning calendars tracking unique active cells without collocated FRP summing." },
    { num: 10, title: "Uncertainty diagnostics", desc: "Conduct distance sensitivity sweeps and explicit orbital coverage accounting." },
    { num: 11, title: "Analytical Parquet export", desc: "Persist high-performance columnar analytical records in DuckDB and Apache Parquet." },
  ];

  return (
    <div className="bg-[#09090C] border border-neutral-900 rounded-2xl p-5 shadow-sm flex flex-col gap-6">
      {/* Title */}
      <div className="border-b border-neutral-900 pb-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 tracking-tight">
          <BookOpen className="w-4 h-4 text-orange-400" />
          Methodology, provenance, and scientific integrity
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5 font-normal">
          Complete scientific transparency and traceability behind the FireChronicle pipeline
        </p>
      </div>

      {/* Disclaimers & Integrity Alert */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-300 space-y-1.5 font-normal">
          <span className="font-semibold text-white block text-sm">
            Core scientific guardrails
          </span>
          <p className="leading-relaxed">
            &bull; <strong className="font-medium text-white">Thermal hotspots &ne; confirmed wildfires:</strong> Detections represent satellite-observed thermal infrared radiation anomalies. Sources include vegetation burns, prescribed agricultural clearing, industrial gas flaring, volcanoes, and geothermal vents. Hotspot points must never be cited as confirmed wildfire events without independent ground verification.
          </p>
          <p className="leading-relaxed">
            &bull; <strong className="font-medium text-white">Absence of detection &ne; absence of fire:</strong> Thick pyrocumulus smoke plumes, dense cloud decks, and orbital gaps obscure fire fronts from satellite radiometers. Zero detected hotspots does not indicate zero fire activity.
          </p>
          <p className="leading-relaxed">
            &bull; <strong className="font-medium text-white">Strict prohibition of blind FRP summation:</strong> Collocated MODIS and VIIRS detections capturing the same fire front must never have their Fire Radiative Power (MW) summed together.
          </p>
        </div>
      </div>

      {/* 11-Stage Pipeline */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 mb-3 tracking-tight">
          11-stage harmonization pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {stages.map((st) => (
            <div
              key={st.num}
              className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 flex flex-col justify-between shadow-sm"
            >
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-orange-400 font-medium">
                  Stage {st.num}
                </span>
                <h4 className="text-xs font-semibold text-white mt-2 mb-1">{st.title}</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Literature Citation */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
            Key scientific literature: Cross-sensor FRP comparison
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 font-mono">
            Peer-reviewed reference
          </span>
        </div>
        <p className="text-neutral-300 text-[11px] leading-relaxed font-normal">
          <strong className="font-medium text-white">Li, F., Zhang, X., Kondragunta, S., &amp; Roy, D. P. (2018).</strong> <em>Comparison of Fire Radiative Power Estimates From VIIRS and MODIS Observations.</em> Journal of Geophysical Research: Atmospheres, 123(9), 4545–4563. DOI:{" "}
          <a
            href="https://doi.org/10.1029/2017JD027823"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 underline hover:text-white"
          >
            10.1029/2017JD027823
          </a>
          .
        </p>
        <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
          <strong className="font-medium text-neutral-300">Methodological guidance:</strong> Li et al. demonstrate that cross-sensor Fire Radiative Power varies substantially with view angle, canopy obscuration, and fire size distribution. FireChronicle complies with their findings by prohibiting universal scalar FRP multipliers and strictly enforcing non-duplication of overlapping observations.
        </p>
      </div>
    </div>
  );
};
