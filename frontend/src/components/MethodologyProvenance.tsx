"use client";

import React from "react";
import { BookOpen, ShieldAlert, Award, ExternalLink, Database, CheckCircle2 } from "lucide-react";

export const MethodologyProvenance: React.FC = () => {
  const stages = [
    { num: 1, title: "Ingestion & Manifest", desc: "Retrieve verified NASA FIRMS CSVs with immutable SHA-256 retrieval manifests." },
    { num: 2, title: "Schema Validation", desc: "Validate coordinate ranges ([-90, 90], [-180, 180]), ISO UTC timestamps, and physical FRP ceilings." },
    { num: 3, title: "Field Normalization", desc: "Deterministic observation SHA-256 hash generation and confidence scale mapping." },
    { num: 4, title: "Defensible Filtering", desc: "Preserve raw records in analytical store; apply transparent user-controlled confidence thresholds." },
    { num: 5, title: "Spatial Analysis", desc: "Assign equal-area projected 1.0 km cylindrical grid cells to neutralize pixel footprint inflation." },
    { num: 6, title: "Temporal Synchronization", desc: "Chronological alignment of overpass times using authentic UTC timestamps." },
    { num: 7, title: "Candidate Cross-Matching", desc: "Identify collocated detections within ≤ 1000m and ≤ 60 min orbital windows." },
    { num: 8, title: "Classification", desc: "Categorize records into matched pairs, MODIS-only detections, or VIIRS-only detections." },
    { num: 9, title: "Calendar Aggregation", desc: "Synthesize daily burning calendars tracking unique active cells without collocated FRP summing." },
    { num: 10, title: "Uncertainty Diagnostics", desc: "Conduct distance sensitivity sweeps and explicit orbital coverage accounting." },
    { num: 11, title: "Analytical Parquet Export", desc: "Persist high-performance columnar analytical records in DuckDB and Apache Parquet." },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-xl flex flex-col gap-6">
      {/* Title */}
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent-cyan" />
          Methodology, Provenance &amp; Scientific Integrity
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Complete scientific transparency and traceability behind the FireChronicle pipeline
        </p>
      </div>

      {/* Disclaimers & Integrity Alert */}
      <div className="bg-red-950/60 border border-red-500/80 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-xs text-red-200 space-y-1.5">
          <span className="font-bold text-red-100 block text-sm">
            Non-Negotiable Scientific Guardrails
          </span>
          <p className="leading-relaxed">
            &bull; <strong>Thermal Hotspots &ne; Confirmed Wildfires:</strong> Detections represent satellite-observed thermal infrared radiation anomalies. Sources include vegetation burns, prescribed agricultural clearing, industrial gas flaring, volcanoes, and geothermal vents. Hotspot points must never be cited as confirmed wildfire events without independent ground verification.
          </p>
          <p className="leading-relaxed">
            &bull; <strong>Absence of Detection &ne; Absence of Fire:</strong> Thick pyrocumulus smoke plumes, dense cloud decks, and orbital gaps obscure fire fronts from satellite radiometers. &ldquo;Zero detected hotspots&rdquo; does not indicate zero fire activity.
          </p>
          <p className="leading-relaxed">
            &bull; <strong>Strict Prohibition of Blind FRP Summation:</strong> Collocated MODIS and VIIRS detections capturing the same fire front must never have their Fire Radiative Power (MW) summed together.
          </p>
        </div>
      </div>

      {/* 11-Stage Pipeline */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
          11-Stage Harmonization Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {stages.map((st) => (
            <div
              key={st.num}
              className="bg-surface-elevated border border-border rounded-lg p-3 flex flex-col justify-between shadow-sm"
            >
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan font-bold">
                  Stage {st.num}
                </span>
                <h4 className="text-xs font-bold text-text-primary mt-2 mb-1">{st.title}</h4>
                <p className="text-[11px] text-text-muted leading-relaxed">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Literature Citation */}
      <div className="bg-surface-elevated border border-border rounded-xl p-4 text-xs space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-text-primary flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-accent-cyan" />
            Key Scientific Literature: Cross-Sensor FRP Comparison
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-200 border border-accent-violet/60 font-mono">
            Peer-Reviewed Reference
          </span>
        </div>
        <p className="text-text-secondary text-[11px] leading-relaxed">
          <strong>Li, F., Zhang, X., Kondragunta, S., &amp; Roy, D. P. (2018).</strong> <em>Comparison of Fire Radiative Power Estimates From VIIRS and MODIS Observations.</em> Journal of Geophysical Research: Atmospheres, 123(9), 4545–4563. DOI:{" "}
          <a
            href="https://doi.org/10.1029/2017JD027823"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-cyan underline hover:text-white"
          >
            10.1029/2017JD027823
          </a>
          .
        </p>
        <p className="text-[11px] text-text-muted leading-relaxed">
          <strong>Key Methodological Guidance:</strong> Li et al. demonstrate that cross-sensor Fire Radiative Power varies substantially with view angle, canopy obscuration, and fire size distribution. FireChronicle complies with their findings by <em>prohibiting universal scalar FRP multipliers</em> and strictly enforcing <em>non-duplication</em> of overlapping observations.
        </p>
      </div>

      {/* NASA Attribution & Citations */}
      <div className="border-t border-border/60 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-text-secondary">
        <div>
          <span className="font-semibold text-text-primary block">Official NASA FIRMS Attribution:</span>
          <p className="text-[11px] text-text-muted mt-0.5">
            &ldquo;We acknowledge the use of data and imagery from NASA&rsquo;s Fire Information for Resource Management System (FIRMS) (https://firms.modaps.eosdis.nasa.gov/), part of the NASA Earth Observing System Data and Information System (EOSDIS).&rdquo;
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://firms.modaps.eosdis.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-surface-muted border border-border hover:border-accent-cyan text-text-primary text-xs flex items-center gap-1.5 transition-colors font-medium"
          >
            NASA FIRMS Portal <ExternalLink className="w-3.5 h-3.5 text-accent-cyan" />
          </a>
        </div>
      </div>
    </div>
  );
};
