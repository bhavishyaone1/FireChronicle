"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import { Controls } from "@/components/Controls";
import { MetricsCards } from "@/components/MetricsCards";
import { BurningActivityCalendar } from "@/components/BurningActivityCalendar";
import { SensorDiscontinuityInspector } from "@/components/SensorDiscontinuityInspector";
import { HistoricalAnomalies } from "@/components/HistoricalAnomalies";
import { MethodologyProvenance } from "@/components/MethodologyProvenance";
import {
  fetchHealth,
  fetchMetadata,
  fetchObservations,
  fetchCalendar,
  fetchComparison,
  fetchAnomalies,
} from "@/lib/api";
import {
  PresetAoi,
  GeoJSONFeatureCollection,
  CalendarResponse,
  SensorComparisonResponse,
  AnomalyResponse,
} from "@/types";

// Dynamic client import for MapLibre GL to avoid SSR window undefined errors
const HotspotMap = dynamic(
  () => import("@/components/HotspotMap").then((mod) => mod.HotspotMap),
  { ssr: false }
);

const DEFAULT_AOI: PresetAoi = {
  id: "socal",
  name: "Southern California (LA Basin)",
  bbox: [-118.6, 34.1, -117.8, 34.5],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isFirmsConfigured, setIsFirmsConfigured] = useState(false);
  const [activeMode, setActiveMode] = useState("HACKATHON_BUILD");
  const [presetAois, setPresetAois] = useState<PresetAoi[]>([DEFAULT_AOI]);
  const [selectedAoi, setSelectedAoi] = useState<PresetAoi>(DEFAULT_AOI);

  // Filter parameters
  const [startDate, setStartDate] = useState("2024-08-01");
  const [endDate, setEndDate] = useState("2024-08-20");
  const [gridSizeKm, setGridSizeKm] = useState(1.0);
  const [spatialToleranceM, setSpatialToleranceM] = useState(1000);
  const [sensorFilter, setSensorFilter] = useState("ALL");
  const [classificationFilter, setClassificationFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetched data state
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<SensorComparisonResponse | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load: health & metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const health = await fetchHealth();
        setIsBackendConnected(true);
        setIsFirmsConfigured(health.firms_configured);
        setActiveMode(health.active_mode);
      } catch (err) {
        setIsBackendConnected(false);
      }

      try {
        const meta = await fetchMetadata();
        if (meta.preset_aois && meta.preset_aois.length > 0) {
          setPresetAois(meta.preset_aois);
          setSelectedAoi(meta.preset_aois[0]);
        }
      } catch (err) {
        // Use default fallback presets
      }
    }
    loadMeta();
  }, []);

  // Main data fetch on filter change
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const bbox = selectedAoi.bbox;
      const targetStartDate = selectedDate || startDate;
      const targetEndDate = selectedDate || endDate;

      try {
        const [obs, cal, comp, anom] = await Promise.all([
          fetchObservations({
            bbox,
            startDate: targetStartDate,
            endDate: targetEndDate,
            sensor: sensorFilter,
            classification: classificationFilter,
          }).catch(() => null),
          fetchCalendar({
            bbox,
            startDate,
            endDate,
            gridSizeKm,
          }).catch(() => null),
          fetchComparison({
            bbox,
            startDate,
            endDate,
            spatialToleranceM,
          }).catch(() => null),
          fetchAnomalies({
            bbox,
            targetYear: 2024,
          }).catch(() => null),
        ]);

        if (obs) setGeoJsonData(obs);
        if (cal) setCalendarData(cal);
        if (comp) setComparisonData(comp);
        if (anom) setAnomalyData(anom);
      } catch (error) {
        console.error("Data load error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [
    selectedAoi,
    startDate,
    endDate,
    selectedDate,
    gridSizeKm,
    spatialToleranceM,
    sensorFilter,
    classificationFilter,
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        activeMode={activeMode}
        isBackendConnected={isBackendConnected}
        isFirmsConfigured={isFirmsConfigured}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* Controls Toolbar */}
        <Controls
          presetAois={presetAois}
          selectedAoiId={selectedAoi.id}
          onSelectAoi={(aoi) => {
            setSelectedAoi(aoi);
            setSelectedDate(null);
          }}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          gridSizeKm={gridSizeKm}
          setGridSizeKm={setGridSizeKm}
          spatialToleranceM={spatialToleranceM}
          setSpatialToleranceM={setSpatialToleranceM}
          sensorFilter={sensorFilter}
          setSensorFilter={setSensorFilter}
          classificationFilter={classificationFilter}
          setClassificationFilter={setClassificationFilter}
        />

        {/* Selected Date Filter Banner */}
        {selectedDate && (
          <div className="flex items-center justify-between px-4 py-2 bg-nasa-cyan/15 border border-nasa-cyan rounded-lg text-xs text-nasa-cyan">
            <span>
              Filtering detections to selected calendar date: <strong>{selectedDate}</strong>
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-white hover:underline font-semibold ml-3"
            >
              Clear Date Filter ✕
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <MetricsCards calendarData={calendarData} comparisonData={comparisonData} />

        {/* Dynamic Tab Views */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <HotspotMap
              geoJsonData={geoJsonData}
              bbox={selectedAoi.bbox}
              selectedDate={selectedDate}
            />
            <BurningActivityCalendar
              calendarData={calendarData}
              onSelectDate={(d) => setSelectedDate(d || null)}
              selectedDate={selectedDate}
            />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="space-y-4">
            <BurningActivityCalendar
              calendarData={calendarData}
              onSelectDate={(d) => setSelectedDate(d || null)}
              selectedDate={selectedDate}
            />
            <HotspotMap
              geoJsonData={geoJsonData}
              bbox={selectedAoi.bbox}
              selectedDate={selectedDate}
            />
          </div>
        )}

        {activeTab === "compare" && (
          <SensorDiscontinuityInspector comparisonData={comparisonData} />
        )}

        {activeTab === "anomalies" && (
          <HistoricalAnomalies anomalyData={anomalyData} />
        )}

        {activeTab === "methodology" && <MethodologyProvenance />}
      </main>

      <footer className="border-t border-nasa-border/40 py-4 bg-nasa-dark text-center text-xs text-nasa-slate">
        <p>
          FireChronicle — NASA International Space Apps Challenge 2026. Built with FastAPI, DuckDB, Next.js, and MapLibre GL.
        </p>
      </footer>
    </div>
  );
}
