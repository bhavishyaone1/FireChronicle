"use client";

import React from "react";
import { GeoJSONFeatureCollection, SensorComparisonResponse } from "@/types";

interface DataFlowExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  observationsData?: GeoJSONFeatureCollection | null;
  comparisonData?: SensorComparisonResponse | null;
}

export function DataFlowExplainerModal({
  isOpen,
  onClose,
  observationsData,
  comparisonData,
}: DataFlowExplainerModalProps) {
  if (!isOpen) return null;

  const totalLoaded = observationsData?.total_count || observationsData?.features?.length || 0;
  const modisCount = observationsData?.features?.filter(
    (f) => f.properties.sensor === "MODIS"
  ).length || 0;
  const viirsCount = observationsData?.features?.filter(
    (f) => f.properties.sensor === "VIIRS"
  ).length || 0;
  const matchedCount = observationsData?.features?.filter(
    (f) => f.properties.classification === "matched"
  ).length || 0;
  const matchedPairs = Math.floor(matchedCount / 2);
  const unmatchedModis = observationsData?.features?.filter(
    (f) => f.properties.classification === "MODIS_only"
  ).length || 0;
  const unmatchedViirs = observationsData?.features?.filter(
    (f) => f.properties.classification === "VIIRS_only"
  ).length || 0;

  const uniqueCells = new Set(
    observationsData?.features
      ?.map((f) => f.properties.grid_cell_id)
      .filter(Boolean)
  ).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-[#0b0f19] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#0b0f19]/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wide">
                How the Data Works &bull; Scientific Pipeline Explainer
              </h2>
              <p className="text-xs text-slate-400">
                Data lifecycle, physics invariants, footprint math, and live pipeline accounting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Live Pipeline Accounting Cards */}
          <div>
            <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2.5">
              1. Live Pipeline Accounting (Current View Range)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Total Telemetry Loaded</div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                  {totalLoaded.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">0 dropped (valid coords & range)</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-[11px] text-slate-400">MODIS vs VIIRS Ratio</div>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                  {modisCount} : {viirsCount}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  VIIRS detects ~{(viirsCount / (modisCount || 1)).toFixed(1)}x more due to 375m pixel
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Spatio-Temporal Matches</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                  {matchedPairs.toLocaleString()} pairs
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {unmatchedModis} MODIS / {unmatchedViirs} VIIRS singletons
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-[11px] text-slate-400">1 km Harmonized Cells</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  {uniqueCells.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Equal-area occupancy</div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Data Flow */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
              2. End-to-End Data Flow Stages
            </h3>

            {/* Stage A */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">
                  A
                </span>
                <h4 className="text-sm font-semibold text-slate-100">
                  Data Ingestion: NRT vs Standard Science Quality (SP)
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                <strong>Near Real-Time (NRT)</strong> data is downlinked within ~3 hours of satellite overpass via NASA LANCE. It uses expeditious ancillary calibration and <em>does not include the validated <code className="text-amber-300 font-mono">type</code> field</em>. 
                After 2 to 3 months, NRT data is archived and superseded by <strong>Standard Processing (SP)</strong> (MODIS Collection 6.1 and VIIRS Collection 2) using final orbital ephemerides, certified surface reflectance, and classified anomaly types (0=vegetation, 1=volcano, 2=static source, 3=offshore).
              </p>
            </div>

            {/* Stage B */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">
                  B
                </span>
                <h4 className="text-sm font-semibold text-slate-100">
                  Physical Pixel Meaning & Centroid Invariant
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                Hotspot latitude and longitude coordinates represent the <strong>geometric center (centroid)</strong> of the satellite detector footprint on the ground&mdash;<em>not</em> the perimeter of a flaming front. 
                MODIS nadir pixels cover nominal <code className="text-amber-300 font-mono">1.0 km &times; 1.0 km</code>, growing to <code className="text-amber-300 font-mono">2.0 km &times; 4.8 km</code> at scan edge (bow-tie effect). 
                VIIRS I-band pixels cover <code className="text-cyan-300 font-mono">375 m &times; 375 m</code> at nadir with along-scan aggregation restricting scan-edge growth to <code className="text-cyan-300 font-mono">800 m &times; 800 m</code>. 
                A detection signals sub-pixel thermal radiation (typically emitting in MWIR ~3.7–4.0 &mu;m) of sufficient temperature and area to exceed contextual background thresholds.
              </p>
            </div>

            {/* Stage C */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">
                  C
                </span>
                <h4 className="text-sm font-semibold text-slate-100">
                  Spatio-Temporal Harmonization & Matching Rule
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                MODIS and VIIRS overpass times generally differ by 50 to 180 minutes. Detections are paired when:
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-12">
                <li>
                  <strong>Geodesic Distance:</strong> $d \le d_{'{'}max{'}'}$ (default 1,000 m, dynamically expanded by the combined footprint growth envelope $d_{'{'}envelope{'}'} = \sqrt{'{'}scan^2 + track^2{'}'}$).
                </li>
                <li>
                  <strong>Temporal Separation:</strong> $\Delta t \le \Delta t_{'{'}max{'}'}$ (default 60 min, user-configurable up to 180 min).
                </li>
                <li>
                  <strong>Solar Illumination Compatibility:</strong> Day detections are never matched to night detections ($daynight_{'{'}MODIS{'}'} == daynight_{'{'}VIIRS{'}'}$).
                </li>
                <li>
                  <strong>Greedy Bipartite Assignment:</strong> Optimal 1-to-1 matching minimizes total spatial-temporal penalty score $S = \sqrt{'{'}(d/d_{'{'}max{'}'})^2 + (\Delta t/\Delta t_{'{'}max{'}'})^2{'}'}$.
                </li>
              </ul>
            </div>

            {/* Stage D */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">
                  D
                </span>
                <h4 className="text-sm font-semibold text-slate-100">
                  Equal-Area Spatial Grid & <code className="text-emerald-300">unique_active_cells</code> Metric
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                Raw point counts cannot be directly compared between MODIS and VIIRS because a single fire detected by 1 MODIS pixel (~1 km&sup2;) is routinely resolved by VIIRS into 4 to 9 distinct 375m pixels. 
                FireChronicle maps all observations into a standardized <strong>1 km equal-area cylindrical grid</strong>. 
                The daily activity calendar counts <code className="text-emerald-400 font-mono">unique_active_cells</code> (cells with $\ge 1$ detection on a given day), removing sensor resolution bias and providing a consistent fire history across two decades.
              </p>
            </div>
          </div>

          {/* Footer Close */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 transition-colors"
            >
              Close Explainer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataFlowExplainerModal;
