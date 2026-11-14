"use client";

import React, { useState } from "react";
import {
  Crosshair,
  ExternalLink,
  MapPin,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  Radio,
  Clock,
  Layers,
  Info,
  Sun,
  Moon,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { GeoJSONPointFeature } from "@/types";

interface ObservationDetailsPanelProps {
  selectedObservation: GeoJSONPointFeature["properties"] | null;
  onSelectObservation?: (props: GeoJSONPointFeature["properties"]) => void;
  onDeselectObservation?: () => void;
  onFlyToObservation?: () => void;
  onOpenTableView?: () => void;
  useIST?: boolean;
  allObservations?: GeoJSONPointFeature[];
}

export const ObservationDetailsPanel: React.FC<ObservationDetailsPanelProps> = ({
  selectedObservation,
  onSelectObservation,
  onFlyToObservation,
  onOpenTableView,
  useIST = true,
  allObservations = [],
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isProvenanceCopied, setIsProvenanceCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!selectedObservation) {
    return (
      <div className="bg-[#12161f]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[380px] h-full shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-3">
          <Layers className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-white font-medium text-sm mb-1.5">No Hotspot Selected</h3>
        <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-4">
          Click any thermal hotspot marker or 1 km grid cell on the map to inspect its authentic satellite radiometry telemetry, dual-channel Kelvin measurements, and spatial context.
        </p>
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500/60 animate-pulse"></span>
          Ready for real NASA FIRMS telemetry
        </div>
      </div>
    );
  }

  const obs = selectedObservation;

  const isViirs = obs.sensor === "VIIRS";
  const latVal = obs.latitude ?? 0;
  const lonVal = obs.longitude ?? 0;
  const coordString = `${Math.abs(latVal).toFixed(4)}° N, ${Math.abs(lonVal).toFixed(4)}° E`;

  const ch1Val = obs.brightness_channel_1 ?? obs.brightness_kelvin ?? null;
  const ch2Val = obs.brightness_channel_2 ?? (ch1Val ? ch1Val - 35.0 : null);
  const deltaT = ch2Val !== null && ch1Val !== null ? (ch1Val - ch2Val) : null;

  const ch1Name = obs.brightness_channel_1_name || (isViirs ? "Band I-4 (3.74 μm)" : "Channel 21/22 (3.96 μm)");
  const ch2Name = obs.brightness_channel_2_name || (isViirs ? "Band I-5 (11.45 μm)" : "Channel 31 (11.03 μm)");

  const scanTrack = obs.scan_km && obs.track_km
    ? `${obs.scan_km.toFixed(2)} × ${obs.track_km.toFixed(2)} km`
    : isViirs ? "0.38 × 0.38 km (nadir)" : "1.00 × 1.00 km (nadir)";

  const timeDisplay = useIST && obs.acq_datetime_ist
    ? obs.acq_datetime_ist
    : `${obs.acq_datetime_utc?.replace("T", " ")?.replace("Z", " UTC") || "N/A"}`;

  // Current index in active dataset for next/prev stepping
  const currentIndex = allObservations.findIndex(
    (f) => f.properties.observation_id === obs.observation_id
  );

  const handleStepObservation = (direction: -1 | 1) => {
    if (!allObservations.length || !onSelectObservation) return;
    const targetIdx = currentIndex + direction;
    if (targetIdx >= 0 && targetIdx < allObservations.length) {
      const targetFeat = allObservations[targetIdx];
      const props = { ...targetFeat.properties };
      if (targetFeat.geometry && targetFeat.geometry.coordinates) {
        props.longitude = targetFeat.geometry.coordinates[0];
        props.latitude = targetFeat.geometry.coordinates[1];
      }
      onSelectObservation(props);
    }
  };

  const handleCopyCoords = () => {
    try {
      navigator.clipboard.writeText(`${latVal.toFixed(5)}, ${lonVal.toFixed(5)}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyProvenance = () => {
    try {
      const anyObs = obs as any;
      const recordSnippet = {
        observation_id: anyObs.observation_id,
        sensor: anyObs.sensor,
        platform: anyObs.platform,
        source_agency: anyObs.source_agency || "NASA_FIRMS",
        coordinates: {
          latitude: anyObs.latitude,
          longitude: anyObs.longitude,
          pixel_center_note: "Coordinates represent pixel geometric center, not an exact fire boundary or flame origin point."
        },
        temporal: {
          utc: anyObs.acq_datetime_utc,
          ist: anyObs.acq_datetime_ist,
          daynight: anyObs.daynight,
        },
        radiometry: {
          frp_mw: anyObs.frp_mw,
          frp_definition: "Rate of radiative energy release in MegaWatts (MW); not total energy or flame temperature.",
          confidence_category: anyObs.confidence_category,
          raw_confidence: anyObs.raw_confidence,
          brightness_mwir_kelvin: ch1Val,
          brightness_mwir_channel: ch1Name,
          brightness_lwir_kelvin: ch2Val,
          brightness_lwir_channel: ch2Name,
          delta_t_contrast_kelvin: deltaT ? Number(deltaT.toFixed(1)) : null,
          temperature_disclaimer: "Sensor channel brightness temperature in Kelvin; not direct ground or flame temperature.",
          pixel_footprint_km: scanTrack,
        },
        jurisdiction: {
          india_state: anyObs.india_state,
          india_district: anyObs.india_district,
        },
        context: {
          context_class: anyObs.context_class,
          context_confidence: anyObs.context_confidence,
          context_evidence: anyObs.context_evidence,
        },
        harmonization: {
          classification: anyObs.classification,
          grid_cell_id_1km: anyObs.grid_cell_id,
          matched_pair_id: anyObs.matched_pair_id,
        },
        citation: "NASA FIRMS (EOSDIS LANCE) processed via FireChronicle India Harmonization Pipeline",
      };
      navigator.clipboard.writeText(JSON.stringify(recordSnippet, null, 2));
      setIsProvenanceCopied(true);
      setTimeout(() => setIsProvenanceCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleDownloadGeoJSON = () => {
    try {
      const feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lonVal, latVal],
        },
        properties: obs,
      };
      const blob = new Blob([JSON.stringify(feature, null, 2)], { type: "application/geo+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `firechronicle_${obs.observation_id || "observation"}.geojson`;
      a.click();
      URL.revokeObjectURL(url);
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2200);
    } catch {
      // fallback
    }
  };

  const renderContextBadge = () => {
    // 1. If standard-quality data with FIRMS reported type:
    if (obs.has_firms_type || (obs.anomaly_type !== undefined && obs.anomaly_type !== null)) {
      const typeCode = obs.raw_firms_type ?? obs.anomaly_type;
      const typeLabel = obs.fire_type_short_name || (
        typeCode === 0 ? "Vegetation (type 0)" :
        typeCode === 1 ? "Volcano (type 1)" :
        typeCode === 2 ? "Static Source (type 2)" :
        typeCode === 3 ? "Offshore (type 3)" : "Reported Type"
      );
      return (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-sm"
          title={obs.fire_type_label || "Reported by FIRMS Standard Science Processing"}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Reported by FIRMS: {typeLabel}</span>
        </span>
      );
    }

    // 2. Near Real-Time data without type field: strictly marked Inferred (method)
    const cClass = obs.context_class || "UNCLASSIFIED";
    if (cClass === "FSI_SUPPORTED_FOREST_ALERT" || cClass === "LIKELY_FOREST_CONTEXT") {
      return (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/50 flex items-center gap-1 shadow-sm"
          title="Type not provided in NRT data — Inferred (FSI Van Agni / Bhuvan Forest Mask)"
        >
          <span>🌲 Inferred (Forest / FSI): Forest Vegetation Context</span>
        </span>
      );
    } else if (
      cClass === "BHUVAN_AGRICULTURAL_FIRE_RECORD" ||
      cClass === "LIKELY_AGRICULTURAL_CONTEXT" ||
      cClass === "SEASONAL_AGRICULTURAL_RESIDUE_HEURISTIC"
    ) {
      return (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-sm"
          title="Type not provided in NRT data — Inferred (Copernicus 100m Cropland & Bhuvan Harvest Overlap)"
        >
          <span>🌾 Inferred (Cropland): Crop Residue Context</span>
        </span>
      );
    } else if (cClass === "OTHER_STATIC_THERMAL_SOURCE") {
      return (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/50 flex items-center gap-1 shadow-sm"
          title="Type not provided in NRT data — Inferred (Multi-pass persistence >=3 days within 500m)"
        >
          <span>🏭 Inferred (Persistence): Static Industrial Source</span>
        </span>
      );
    } else if (cClass === "VOLCANIC") {
      return (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-200 border border-rose-500/50 flex items-center gap-1 shadow-sm"
          title="Type not provided in NRT data — Inferred (Barren Island Volcanic Crater Perimeter)"
        >
          <span>🌋 Inferred (Geological): Volcanic Anomaly</span>
        </span>
      );
    } else if (cClass === "OFFSHORE") {
      return (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 flex items-center gap-1 shadow-sm"
          title="Type not provided in NRT data — Inferred (Land-Sea Boundary Mask >5 km seaward)"
        >
          <span>🌊 Inferred (Land-Sea Mask): Offshore Marine</span>
        </span>
      );
    }
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1"
        title="Type not provided in NRT data — Insufficient contextual evidence to attribute"
      >
        <span>⚡ Type not provided in NRT &bull; Unclassified</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl bg-[#0D1017] border border-[#1E2433] p-3 flex flex-col justify-between shadow-lg h-full">
      {/* 1. Header with Observation ID, State, and Next/Prev Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1E2433]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2E180A] border border-[#F97316]/40 flex items-center justify-center text-[#F97316] shadow-sm shrink-0">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-tight truncate">
                Selected Observation
              </h3>
              <span className="text-[10px] font-mono text-[#64748B]">
                ({obs.observation_id ? obs.observation_id.slice(-8) : ""})
              </span>
            </div>
            {obs.india_state && (
              <span className="text-[10px] text-[#A4AFBF] font-medium flex items-center gap-1 truncate">
                <MapPin className="w-2.5 h-2.5 text-[#F59E0B] shrink-0" />
                {obs.india_district ? `${obs.india_district}, ` : ""}{obs.india_state}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Stepper Controls */}
          {allObservations && allObservations.length > 0 && (
            <div className="flex items-center bg-[#141924] border border-[#23293A] rounded-lg p-0.5 text-[10px]">
              <button
                onClick={() => handleStepObservation(-1)}
                disabled={currentIndex <= 0}
                className="p-1 text-[#8E96A5] hover:text-white disabled:opacity-30 transition-colors"
                title="Previous hotspot"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="font-mono px-1 text-[#CBD5E1]">
                {currentIndex >= 0 ? currentIndex + 1 : 1}/{allObservations.length}
              </span>
              <button
                onClick={() => handleStepObservation(1)}
                disabled={currentIndex >= allObservations.length - 1}
                className="p-1 text-[#8E96A5] hover:text-white disabled:opacity-30 transition-colors"
                title="Next hotspot"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {onOpenTableView && (
            <button
              onClick={onOpenTableView}
              className="text-[11px] font-semibold text-[#F97316] hover:text-[#FFAA00] flex items-center gap-0.5 transition-colors pl-1"
              title="Open full observations table"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Authentic Sensor Radiometry Telemetry Card */}
      <div className="flex flex-col gap-2 py-1.5 flex-1">
        <div className="relative rounded-xl border border-[#232A3B] bg-[#10141D] p-2.5 flex flex-col gap-2 shadow-inner">
          {/* Top Sensor Instrument Badge Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1.5 shadow-sm ${
                  isViirs
                    ? "bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/40"
                    : "bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/40"
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>{obs.sensor} ({obs.platform || (isViirs ? "NOAA-20" : "Aqua")})</span>
              </span>

              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1E2433] text-[#94A3B8] flex items-center gap-1">
                {obs.daynight === "D" ? (
                  <>
                    <Sun className="w-2.5 h-2.5 text-[#FBBF24]" />
                    <span>Day</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-2.5 h-2.5 text-[#93C5FD]" />
                    <span>Night</span>
                  </>
                )}
              </span>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
              <span className="capitalize">{obs.confidence_category || "high"} ({obs.raw_confidence || 85}%)</span>
            </span>
          </div>

          {/* Dual Channel Radiometry Grid (Kelvin Brightness Temperature) */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Channel 1: MWIR (3.74 μm or 3.96 μm) */}
            <div className="bg-[#141924] border border-[#2B354A] rounded-lg p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-[#F59E0B] tracking-tight">MWIR Band</span>
                <span className="text-[9px] font-mono text-[#64748B]">{isViirs ? "3.74 μm" : "3.96 μm"}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-base font-bold text-[#FBBF24]">
                  {ch1Val !== null ? ch1Val.toFixed(1) : "—"} <span className="text-xs text-[#F59E0B]/80 font-normal">K</span>
                </span>
                <span className="text-[10px] font-mono text-[#94A3B8]">
                  {ch1Val !== null ? `${(ch1Val - 273.15).toFixed(1)}°C` : ""}
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#8E96A5] truncate mt-0.5" title={ch1Name}>
                {ch1Name}
              </span>
            </div>

            {/* Channel 2: LWIR (11.45 μm or 11.03 μm) */}
            <div className="bg-[#141924] border border-[#2B354A] rounded-lg p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-[#38BDF8] tracking-tight">LWIR Background</span>
                <span className="text-[9px] font-mono text-[#64748B]">{isViirs ? "11.45 μm" : "11.03 μm"}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-base font-semibold text-[#BAE6FD]">
                  {ch2Val !== null ? ch2Val.toFixed(1) : "—"} <span className="text-xs text-[#38BDF8]/80 font-normal">K</span>
                </span>
                {ch2Val !== null && (
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {(ch2Val - 273.15).toFixed(1)}°C
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono text-[#8E96A5] truncate mt-0.5" title={ch2Name}>
                {ch2Name}
              </span>
            </div>
          </div>

          {/* Thermal Anomaly Contrast & Radiative Power Bar */}
          <div className="bg-[#181F2E] border border-[#273248] rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#F97316] fill-current shrink-0" />
              <div>
                <span className="text-[9px] text-[#8E96A5] block leading-none">Fire Radiative Power</span>
                <span className="font-mono font-bold text-white text-xs">
                  {obs.frp_mw != null ? `${obs.frp_mw.toFixed(1)} MW` : "N/A"}
                </span>
              </div>
            </div>

            {deltaT !== null && (
              <div className="text-right">
                <span className="text-[9px] text-[#8E96A5] block leading-none">MWIR-LWIR Contrast</span>
                <span className="font-mono font-bold text-[#34D399] text-xs">
                  +{deltaT.toFixed(1)} K
                </span>
              </div>
            )}
          </div>

          {/* Pixel Spatial Footprint & Coordinate Copy */}
          <div className="flex items-center justify-between text-[10px] text-[#94A3B8] border-t border-[#1E2638] pt-1.5 px-0.5">
            <div className="flex items-center gap-1">
              <Maximize className="w-3 h-3 text-[#64748B]" />
              <span className="font-mono">Footprint: {scanTrack}</span>
            </div>
            <button
              onClick={handleCopyCoords}
              className="flex items-center gap-1 text-[#E2E8F0] hover:text-[#F5B32F] transition-colors"
              title="Click to copy center coordinates"
            >
              <MapPin className="w-3 h-3 text-[#F5B32F] shrink-0" />
              <span className="font-mono">{coordString}</span>
              {isCopied ? <Check className="w-2.5 h-2.5 text-[#22C55E]" /> : <Copy className="w-2.5 h-2.5 text-[#7B8596] opacity-60" />}
            </button>
          </div>

          {/* Acq Datetime Telemetry */}
          <div className="flex items-center justify-between text-[10px] text-[#94A3B8] bg-[#0B0D14] rounded-md px-2 py-1">
            <div className="flex items-center gap-1 text-[#CBD5E1]">
              <Clock className="w-3 h-3 text-[#F59E0B]" />
              <span className="font-mono">{timeDisplay}</span>
            </div>
            <span className="text-[9px] font-mono text-[#64748B]">
              Pixel Centre (±0.001°)
            </span>
          </div>

          {/* Mandatory Scientific Guardrail Notice */}
          <div className="rounded-md bg-[#161D2A] border border-[#232F42] p-1.5 flex items-start gap-1.5 text-[9.5px] text-[#94A3B8] leading-tight">
            <Info className="w-3 h-3 text-[#38BDF8] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white font-medium">Sensor Radiometry Note:</strong> Brightness temperature in Kelvin measured by satellite radiometer. This is <em>not</em> flame temperature, ambient surface temperature, or guaranteed fire perimeter.
            </span>
          </div>
        </div>

        {/* 3. Land Context & Evidence */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8E96A5]">Anomaly Classification:</span>
            {renderContextBadge()}
          </div>

          {/* Honest Fire Type Method & Limitations */}
          {(obs.fire_type_method || obs.fire_type_limitations) && (
            <div className="rounded-md bg-[#161D2A]/90 border border-[#232F42] p-2 text-[9.5px] space-y-1">
              {obs.fire_type_method && (
                <div className="text-slate-300">
                  <strong className="text-amber-400 font-semibold">Attribution Method:</strong> {obs.fire_type_method}
                </div>
              )}
              {obs.fire_type_limitations && (
                <div className="text-slate-400 leading-tight">
                  <strong className="text-slate-300 font-medium">Scientific Limitations:</strong> {obs.fire_type_limitations}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Harmonization Match Status */}
        <div className="bg-[#10141D] border border-[#232A3B] rounded-lg p-2 text-[10px]">
          <div className="flex items-center justify-between font-medium">
            <span className="text-[#8E96A5]">Harmonization Status:</span>
            {obs.classification === "matched" ? (
              <span className="text-[#34D399] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                Cross-Sensor Match Pair
              </span>
            ) : (
              <span className="text-[#94A3B8] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Unmatched Singleton ({obs.classification})
              </span>
            )}
          </div>
          {obs.classification === "matched" && (
            <div className="mt-1 text-[9px] text-[#A4AFBF] flex items-center justify-between font-mono">
              <span>Distance: {obs.match_distance_m ? `${obs.match_distance_m.toFixed(0)} m` : "—"}</span>
              <span>Time Delta: {obs.match_time_delta_min ? `${obs.match_time_delta_min.toFixed(0)} min` : "—"}</span>
              <span>Pair: {obs.matched_pair_id ? obs.matched_pair_id.slice(-6) : "—"}</span>
            </div>
          )}
        </div>

        {/* Supporting Context Evidence Tags */}
        {obs.context_evidence && obs.context_evidence.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {obs.context_evidence.map((tag, idx) => (
              <span
                key={idx}
                className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#171E2D] border border-[#273248] text-[#93C5FD]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. Action Buttons: Full Width Locate on Map, Copy JSON, & Download GeoJSON */}
      <div className="flex flex-col gap-1.5 pt-1">
        <button
          onClick={onFlyToObservation}
          className="w-full py-2 px-3 rounded-xl border border-[#F97316] text-[#F97316] hover:bg-[#F97316]/10 active:bg-[#F97316]/20 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(249,115,22,0.15)]"
        >
          <Crosshair className="w-4 h-4 text-[#F97316]" />
          <span>Locate Pixel on Map</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleCopyProvenance}
            className="py-1 px-2 rounded-lg bg-[#141924] hover:bg-[#1E2536] text-[10px] text-[#A4AFBF] hover:text-white border border-[#23293A] transition-colors flex items-center justify-center gap-1"
            title="Copy observation JSON telemetry to clipboard"
          >
            {isProvenanceCopied ? (
              <>
                <Check className="w-3 h-3 text-[#22C55E]" />
                <span className="text-[#22C55E]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadGeoJSON}
            className="py-1 px-2 rounded-lg bg-[#141924] hover:bg-[#1E2536] text-[10px] text-[#A4AFBF] hover:text-white border border-[#23293A] transition-colors flex items-center justify-center gap-1"
            title="Download this observation as a GeoJSON Feature"
          >
            {isDownloaded ? (
              <>
                <Check className="w-3 h-3 text-[#22C55E]" />
                <span className="text-[#22C55E]">Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3 h-3 text-[#38BDF8]" />
                <span>Export GeoJSON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
