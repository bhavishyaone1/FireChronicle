"use client";

import React from "react";
import { BookOpen, ShieldAlert, Award, ExternalLink, Database } from "lucide-react";

export const MethodologyProvenance: React.FC = () => {
  const stages = [
    { num: 1, title: "Ingestion & Manifest", desc: "Retrieve verified NASA FIRMS CSVs with immutable SHA-256 retrieval manifests." },
    { num: 2, title: "Schema Validation", desc: "Check coordinates (-90 to 90, -180 to 180), UTC times, and physical FRP ceilings." },
    { num: 3, title: "Field Normalization", desc: "Create stable observation_id hash and standardize confidence categories." },
    { num: 4, title: "Defensible Filtering", desc: "Preserve raw records; provide user toggles for confidence and thermal anomaly types." },
    { num: 5, title: "Spatial Analysis", desc: "Assign equal-area projected 1.0 km analysis grid cells to eliminate pixel distortion." },
    { num: 6, title: "Temporal Synchronization", desc: "Use real UTC acquisition timestamps to synchronize overpass windows." },
    { num: 7, title: "Candidate Cross-Matching", desc: "Correlate collocated observations within ≤1000m and ≤60 minutes." },
    { num: 8, title: "Classification", desc: "Label records as matched, MODIS_only, or VIIRS_only based on overpass overlap." },
    { num: 9, title: "Calendar Aggregation", desc: "Compute unique_active_cells alongside raw counts without double-counting collocated FRP." },
    { num: 10, title: "Uncertainty Diagnostics", desc: "Report orbital coverage status, missingness, and distance sensitivity sweeps." },
    { num: 11, title: "Analytical Parquet Export", desc: "Persist high-throughput analytical records into DuckDB and Parquet." },
  ];

  return (
    <div className="bg-nasa-card/90 border border-nasa-border rounded-xl p-5 shadow-lg flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-nasa-cyan" />
          Methodology, Provenance & Scientific Integrity
        </h2>
        <p className="text-xs text-nasa-slate mt-1">
          Complete scientific transparency and traceability behind the FireChronicle pipeline
        </p>
      </div>

      {/* Disclaimers & Integrity Alert */}
      <div className="bg-red-950/40 border border-red-700/60 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-red-200 space-y-1">
          <span className="font-bold text-red-100 block text-sm">
            Non-Negotiable Scientific Principles
          </span>
          <p>
            • <strong>Thermal Hotspots ≠ Confirmed Wildfires:</strong> Detections represent satellite-observed thermal infrared energy anomalies. Sources include vegetation fires, agricultural burns, gas flaring, volcanoes, and industrial heat. Detections must not be represented as confirmed wildfires without independent ground incident validation.
          </p>
          <p>
            • <strong>Absence of Detection ≠ Absence of Fire:</strong> Thick pyrocumulus smoke plumes, cloud cover, and orbital gaps prevent satellite observation. "Zero detected hotspots" must never be conflated with "no fire".
          </p>
          <p>
            • <strong>Prohibition of Blind FRP Summation:</strong> Collocated MODIS and VIIRS detections describing the same flame front must never have their Fire Radiative Power (MW) summed together.
          </p>
        </div>
      </div>

      {/* 11-Stage Pipeline */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-nasa-slate mb-3">
          11-Stage Harmonization Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {stages.map((st) => (
            <div key={st.num} className="bg-nasa-dark/70 border border-nasa-border/50 rounded-lg p-3">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan font-semibold">
                Stage {st.num}
              </span>
              <h4 className="text-xs font-bold text-white mt-1.5 mb-1">{st.title}</h4>
              <p className="text-[11px] text-gray-400 leading-snug">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Literature Citation */}
      <div className="bg-nasa-dark/60 border border-nasa-border/40 rounded-xl p-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-nasa-cyan" />
            Key Scientific Literature: Cross-Sensor FRP Comparison
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-500/40 font-mono">
            Peer-Reviewed Reference
          </span>
        </div>
        <p className="text-gray-300 text-[11px] leading-relaxed">
          <strong>Li, F., Zhang, X., Kondragunta, S., & Roy, D. P. (2018).</strong> <em>Comparison of Fire Radiative Power Estimates From VIIRS and MODIS Observations.</em> Journal of Geophysical Research: Atmospheres, 123(9), 4545–4563. DOI: <a href="https://doi.org/10.1029/2017JD027823" target="_blank" rel="noopener noreferrer" className="text-nasa-cyan underline">10.1029/2017JD027823</a>.
        </p>
        <p className="text-[11px] text-nasa-slate">
          <strong>Key Methodological Guidance:</strong> Li et al. demonstrate that cross-sensor Fire Radiative Power varies substantially across view angles, canopy cover, and sub-pixel fire geometry. FireChronicle adheres to their recommendation by <em>prohibiting universal multiplicative FRP corrections</em> and strictly enforcing <em>non-duplication</em> of overlapping observations.
        </p>
      </div>

      {/* NASA Attribution & Citations */}
      <div className="border-t border-nasa-border/40 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-nasa-slate">
        <div>
          <span className="font-semibold text-white block">Official NASA FIRMS Citation:</span>
          <p className="text-[11px] text-gray-400 mt-0.5">
            "We acknowledge the use of data and imagery from NASA's Fire Information for Resource Management System (FIRMS) (https://firms.modaps.eosdis.nasa.gov/), part of the NASA Earth Observing System Data and Information System (EOSDIS)."
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://firms.modaps.eosdis.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded bg-nasa-dark border border-nasa-border hover:border-nasa-cyan text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            NASA FIRMS Portal <ExternalLink className="w-3 h-3 text-nasa-cyan" />
          </a>
        </div>
      </div>
    </div>
  );
};
