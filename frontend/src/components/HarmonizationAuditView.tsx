"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  ShieldCheck,
  Layers,
} from "lucide-react";
import {
  GeoJSONFeatureCollection,
  SensorComparisonResponse,
  DatasetProvenance,
  PresetAoi,
} from "@/types";
import { getExportUrl } from "@/lib/api";

interface HarmonizationAuditViewProps {
  geoJsonData: GeoJSONFeatureCollection | null;
  comparisonData: SensorComparisonResponse | null;
  selectedAoi: PresetAoi;
  startDate: string;
  endDate: string;
  selectedDate?: string | null;
  gridSizeKm: number;
  spatialToleranceM: number;
  temporalToleranceMin?: number;
  provenance?: DatasetProvenance | null;
  activeMethod: string;
  onChangeMethod: (method: string) => void;
  isLoading?: boolean;
}

export const HarmonizationAuditView: React.FC<HarmonizationAuditViewProps> = ({
  geoJsonData,
  comparisonData,
  selectedAoi,
  startDate,
  endDate,
  selectedDate,
  gridSizeKm,
  spatialToleranceM,
  temporalToleranceMin = 60,
  provenance,
  activeMethod,
  onChangeMethod,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("ALL");
  const [sensorFilter, setSensorFilter] = useState("ALL");

  const effectiveStart = selectedDate || startDate;
  const effectiveEnd = selectedDate || endDate;

  // Extract features
  const features = useMemo(() => geoJsonData?.features || [], [geoJsonData]);

  // Filtered rows for the audit ledger
  const filteredRows = useMemo(() => {
    return features.filter((feat) => {
      const p = feat.properties;
      if (sensorFilter !== "ALL" && p.sensor !== sensorFilter) return false;
      if (classificationFilter !== "ALL" && p.classification !== classificationFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const idMatch = p.observation_id.toLowerCase().includes(term);
        const cellMatch = (p.grid_cell_id || "").toLowerCase().includes(term);
        const pairMatch = (p.matched_pair_id || "").toLowerCase().includes(term);
        if (!idMatch && !cellMatch && !pairMatch) return false;
      }
      return true;
    });
  }, [features, sensorFilter, classificationFilter, searchTerm]);

  // Download URLs
  const geoJsonExportUrl = getExportUrl({
    bbox: selectedAoi.bbox,
    startDate: effectiveStart,
    endDate: effectiveEnd,
    sensor: sensorFilter !== "ALL" ? sensorFilter : undefined,
    classification: classificationFilter !== "ALL" ? classificationFilter : undefined,
    format: "geojson",
  });

  const csvExportUrl = getExportUrl({
    bbox: selectedAoi.bbox,
    startDate: effectiveStart,
    endDate: effectiveEnd,
    sensor: sensorFilter !== "ALL" ? sensorFilter : undefined,
    classification: classificationFilter !== "ALL" ? classificationFilter : undefined,
    format: "csv",
  });

  // Calculate unique active grid cells
  const distinctGridCells = new Set(features.map((f) => f.properties.grid_cell_id).filter(Boolean));
  const rawCount = features.length;
  const uniqueCells = distinctGridCells.size;
  const biasReduction = rawCount > 0 ? Math.round(((rawCount - uniqueCells) / rawCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Data Provenance Bar */}
      <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#F5B32F]/10 border border-[#F5B32F]/30 text-[#F5B32F]">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-semibold text-[#F4F5F7] tracking-tight">
                Harmonization audit &amp; verification ledger
              </h2>
            </div>
            <p className="text-xs text-[#B1B7C1] mt-1">
              Deterministic traceability across raw satellite inputs, spatio-temporal matches, and equal-area grid aggregation.
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <a
              href={geoJsonExportUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171A20] hover:bg-[#1D222A] text-xs font-medium text-[#F4F5F7] border border-[#2A3039] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B32F]"
            >
              <Download className="w-3.5 h-3.5 text-[#F5B32F]" />
              Export GeoJSON
            </a>
            <a
              href={csvExportUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5B32F] hover:bg-[#F47A24] text-xs font-semibold text-[#08090B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B32F]"
            >
              <Download className="w-3.5 h-3.5 text-[#08090B]" />
              Export CSV
            </a>
          </div>
        </div>

        {/* Provenance and Parameters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1D222A] text-xs">
          <div>
            <span className="text-[#858D99] block text-[11px]">Data provenance</span>
            <span className="font-semibold text-[#F5B32F]">{provenance?.label || "SYNTHETIC DEMO"}</span>
          </div>
          <div>
            <span className="text-[#858D99] block text-[11px]">Region &amp; window</span>
            <span className="text-[#F4F5F7] font-mono tabular-nums">{selectedAoi.name} ({effectiveStart} to {effectiveEnd})</span>
          </div>
          <div>
            <span className="text-[#858D99] block text-[11px]">Matching thresholds</span>
            <span className="text-[#F4F5F7] font-mono tabular-nums">&le; {spatialToleranceM}m &bull; &le; {temporalToleranceMin}min</span>
          </div>
          <div>
            <span className="text-[#858D99] block text-[11px]">Grid projection</span>
            <span className="text-[#F4F5F7]">Lambert Cylindrical Equal-Area ({gridSizeKm} km)</span>
          </div>
        </div>
      </div>

      {/* 2. Before vs After Harmonization Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#B1B7C1]">
            <span>Raw satellite detections</span>
            <Database className="w-3.5 h-3.5 text-[#858D99]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#F4F5F7]">{rawCount}</span>
            <span className="text-xs text-[#858D99]">MODIS + VIIRS points</span>
          </div>
          <span className="text-[11px] text-[#858D99] mt-2 block">
            Subject to sensor footprint inflation (375m pixels covering 1/7th of 1km MODIS).
          </span>
        </div>

        <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#B1B7C1]">
            <span>Harmonized unique active cells</span>
            <Layers className="w-3.5 h-3.5 text-[#F5B32F]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#F5B32F]">{uniqueCells}</span>
            <span className="text-xs text-[#B1B7C1]">distinct 1.0 km cells</span>
          </div>
          <span className="text-[11px] text-[#34D399] mt-2 block font-medium">
            &darr; {biasReduction}% point-density inflation eliminated
          </span>
        </div>

        <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#B1B7C1]">
            <span>Spatial agreement (Jaccard)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#34D399]">
              {comparisonData?.spatial_agreement_jaccard ?? "—"}
            </span>
            <span className="text-xs text-[#858D99]">grid overlap index</span>
          </div>
          <span className="text-[11px] text-[#858D99] mt-2 block">
            Intersection / Union of active equal-area cells between MODIS and VIIRS.
          </span>
        </div>
      </div>

      {/* 3. Algorithm Comparison: Greedy Baseline vs Optimal Assignment */}
      <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#2A3039] gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F4F5F7]">
              Matching algorithm comparison &amp; ambiguity analysis
            </h3>
            <p className="text-xs text-[#B1B7C1] mt-0.5">
              Evaluating baseline 1-to-many nearest-neighbor clustering against global 1-to-1 optimal bipartite assignment.
            </p>
          </div>

          {/* Algorithm Toggle */}
          <div className="flex items-center gap-1 bg-[#08090B] p-1 rounded-lg border border-[#2A3039]">
            <button
              onClick={() => onChangeMethod("greedy")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeMethod === "greedy"
                  ? "bg-[#171A20] text-[#F5B32F] border border-[#2A3039]"
                  : "text-[#B1B7C1] hover:text-[#F4F5F7]"
              }`}
            >
              Greedy 1-to-many (Baseline)
            </button>
            <button
              onClick={() => onChangeMethod("global_assignment")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeMethod === "global_assignment"
                  ? "bg-[#171A20] text-[#F5B32F] border border-[#2A3039]"
                  : "text-[#B1B7C1] hover:text-[#F4F5F7]"
              }`}
            >
              Global 1-to-1 Optimal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Method A */}
          <div className={`p-4 rounded-xl border transition-all ${
            activeMethod === "greedy"
              ? "bg-[#171A20]/60 border-[#F5B32F]/50 ring-1 ring-[#F5B32F]/20"
              : "bg-[#08090B] border-[#2A3039]"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F4F5F7]">
                Method A: Greedy Nearest-Neighbor (1-to-Many)
              </span>
              {activeMethod === "greedy" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5B32F]/20 text-[#F5B32F] border border-[#F5B32F]/40">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#B1B7C1] mt-1 leading-relaxed">
              Maps each VIIRS 375m detection to its closest MODIS detection. Allows multiple VIIRS detections inside one MODIS 1km footprint.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs pt-2 border-t border-[#2A3039]/60 font-mono tabular-nums">
              <div>
                <span className="text-[#858D99] text-[10px] block">Pairs formed</span>
                <span className="font-semibold text-[#F4F5F7]">
                  {comparisonData?.algorithm_comparison?.greedy_1toMany?.pairs_count ?? comparisonData?.matched_pairs_count ?? 0}
                </span>
              </div>
              <div>
                <span className="text-[#858D99] text-[10px] block">MODIS matched</span>
                <span className="text-[#A78BFA]">
                  {comparisonData?.algorithm_comparison?.greedy_1toMany?.modis_matched ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-[#858D99] text-[10px] block">Mean distance</span>
                <span className="text-[#F4F5F7]">
                  {comparisonData?.algorithm_comparison?.greedy_1toMany?.mean_distance_m ? `${comparisonData.algorithm_comparison.greedy_1toMany.mean_distance_m}m` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Method B */}
          <div className={`p-4 rounded-xl border transition-all ${
            activeMethod === "global_assignment"
              ? "bg-[#171A20]/60 border-[#F5B32F]/50 ring-1 ring-[#F5B32F]/20"
              : "bg-[#08090B] border-[#2A3039]"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F4F5F7]">
                Method B: Hungarian Global Assignment (1-to-1)
              </span>
              {activeMethod === "global_assignment" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5B32F]/20 text-[#F5B32F] border border-[#F5B32F]/40">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#B1B7C1] mt-1 leading-relaxed">
              Solves the global minimum-cost bipartite assignment on composite distance and time delta. Strictly enforces 1-to-1 matching.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs pt-2 border-t border-[#2A3039]/60 font-mono tabular-nums">
              <div>
                <span className="text-[#858D99] text-[10px] block">Pairs formed</span>
                <span className="font-semibold text-[#F4F5F7]">
                  {comparisonData?.algorithm_comparison?.global_assignment_1to1?.pairs_count ?? 0}
                </span>
              </div>
              <div>
                <span className="text-[#858D99] text-[10px] block">MODIS matched</span>
                <span className="text-[#A78BFA]">
                  {comparisonData?.algorithm_comparison?.global_assignment_1to1?.modis_matched ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-[#858D99] text-[10px] block">Mean distance</span>
                <span className="text-[#F4F5F7]">
                  {comparisonData?.algorithm_comparison?.global_assignment_1to1?.mean_distance_m ? `${comparisonData.algorithm_comparison.global_assignment_1to1.mean_distance_m}m` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ambiguity notice */}
        {comparisonData?.ambiguity_stats && (
          <div className="mt-4 p-3 rounded-lg bg-[#08090B] border border-[#2A3039] flex items-center justify-between text-xs text-[#B1B7C1]">
            <span className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#F5B32F]" />
              Ambiguity report: <span className="text-[#F4F5F7] font-mono tabular-nums font-medium">{comparisonData.ambiguity_stats.total_ambiguous_detections}</span> observations had &ge; 2 candidates within matching thresholds.
            </span>
            <span className="text-[11px] text-[#858D99]">
              MODIS: {comparisonData.ambiguity_stats.ambiguous_modis_count} &bull; VIIRS: {comparisonData.ambiguity_stats.ambiguous_viirs_count}
            </span>
          </div>
        )}
      </div>

      {/* 4. Interactive Observations Audit Ledger Table */}
      <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-[#2A3039] gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F4F5F7]">
              Observation records &amp; attribute ledger ({filteredRows.length} shown)
            </h3>
            <p className="text-xs text-[#B1B7C1] mt-0.5">
              Original sensor measurements, source confidence, FRP, matched attributes, and assigned equal-area grid IDs.
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#858D99]" />
              <input
                type="text"
                placeholder="Search ID, cell, or pair..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#08090B] border border-[#2A3039] rounded-lg text-[#F4F5F7] placeholder-[#858D99] focus-visible:outline-none focus-visible:border-[#F5B32F]"
              />
            </div>

            <select
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value)}
              className="text-xs bg-[#08090B] border border-[#2A3039] rounded-lg px-2.5 py-1 text-[#F4F5F7] focus-visible:outline-none focus-visible:border-[#F5B32F]"
            >
              <option value="ALL">All Sensors</option>
              <option value="MODIS">MODIS only</option>
              <option value="VIIRS">VIIRS only</option>
            </select>

            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="text-xs bg-[#08090B] border border-[#2A3039] rounded-lg px-2.5 py-1 text-[#F4F5F7] focus-visible:outline-none focus-visible:border-[#F5B32F]"
            >
              <option value="ALL">All Classifications</option>
              <option value="matched">Candidate matches only</option>
              <option value="MODIS_only">MODIS-unique</option>
              <option value="VIIRS_only">VIIRS-unique</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto mt-4 max-h-[460px] border border-[#2A3039] rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08090B] text-[#B1B7C1] border-b border-[#2A3039] sticky top-0 z-10 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-medium">Record ID</th>
                <th className="py-2.5 px-3 font-medium">Sensor &amp; Sat</th>
                <th className="py-2.5 px-3 font-medium">UTC Timestamp</th>
                <th className="py-2.5 px-3 font-medium">Coordinates</th>
                <th className="py-2.5 px-3 font-medium">Confidence</th>
                <th className="py-2.5 px-3 font-medium">FRP (MW)</th>
                <th className="py-2.5 px-3 font-medium">Classification</th>
                <th className="py-2.5 px-3 font-medium">Match Details</th>
                <th className="py-2.5 px-3 font-medium">Grid Cell ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D222A] text-[#F4F5F7] font-mono tabular-nums">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#858D99] font-sans">
                    No active observations match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((feat) => {
                  const p = feat.properties;
                  const isModis = p.sensor === "MODIS";
                  return (
                    <tr key={p.observation_id} className="hover:bg-[#171A20]/60 transition-colors">
                      <td className="py-2 px-3 font-medium text-[#F4F5F7] font-mono text-[11px]">
                        {p.observation_id.slice(0, 10)}...
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className={`inline-flex items-center gap-1 font-semibold ${isModis ? "text-[#A78BFA]" : "text-[#38BDF8]"}`}>
                          {p.sensor}
                        </span>
                        <span className="text-[#858D99] text-[11px] block">{p.platform}</span>
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        {p.acq_datetime_utc.replace("T", " ").replace("Z", " UTC")}
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        {p.latitude?.toFixed(4)}&deg;, {p.longitude?.toFixed(4)}&deg;
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className="capitalize text-xs text-[#F4F5F7] font-medium">{p.confidence_category}</span>
                        <span className="text-[#858D99] text-[10px] block font-mono">({p.raw_confidence})</span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-[#F4F5F7]">
                        {p.frp_mw !== null && p.frp_mw !== undefined ? `${p.frp_mw} MW` : "—"}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          p.classification === "matched"
                            ? "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40"
                            : p.classification === "MODIS_only"
                            ? "bg-[#F5B32F]/20 text-[#F5B32F] border border-[#F5B32F]/40"
                            : "bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/40"
                        }`}>
                          {p.classification === "matched" ? "candidate match" : p.classification.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        {p.matched_pair_id ? (
                          <div>
                            <span className="text-[#34D399] font-medium block">
                              {p.match_distance_m ?? 0}m &bull; {p.match_time_delta_min ?? 0}m
                            </span>
                            <span className="text-[10px] text-[#858D99]">
                              Score: {p.match_score ?? "—"} {p.is_ambiguous ? "⚠️ Ambiguous" : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#858D99]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[#B1B7C1]">
                        {p.grid_cell_id || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Scientific Limitations & Operational Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Suomi-NPP Cessation Card */}
        <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#E5484D]/10 border border-[#E5484D]/30 text-[#E5484D] shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-semibold text-[#F4F5F7]">
                NASA Suomi-NPP Lifecycle &amp; Cessation Notice
              </h4>
              <p className="text-[11px] text-[#B1B7C1] mt-1 leading-relaxed">
                NASA has announced the cessation of Suomi-NPP science data product delivery effective November 1, 2026. FireChronicle incorporates automated product redirection to supported operational VIIRS constellations on NOAA-20 and NOAA-21.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#1D222A] text-[11px] text-[#858D99]">
            Supported live products: <span className="text-[#F5B32F]">VIIRS_NOAA20_SP</span> &bull; <span className="text-[#F5B32F]">VIIRS_NOAA21_SP</span>
          </div>
        </div>

        {/* FRP Non-Summation Constraint */}
        <div className="bg-[#101216] border border-[#2A3039] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-semibold text-[#F4F5F7]">
                FRP Non-Summation &amp; Physical Ground Truth
              </h4>
              <p className="text-[11px] text-[#B1B7C1] mt-1 leading-relaxed">
                As demonstrated by Li et al. (2018), additive summation of FRP across collocated 1km MODIS and 375m VIIRS detections introduces severe double-counting bias. Distributions must be preserved separately.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#1D222A] text-[11px] text-[#858D99]">
            Citation: Li, F., et al., Remote Sensing of Environment (2018).
          </div>
        </div>
      </div>
    </div>
  );
};
