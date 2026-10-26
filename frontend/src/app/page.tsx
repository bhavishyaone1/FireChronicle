"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { Controls } from "@/components/Controls";
import { MetricsCards } from "@/components/MetricsCards";
import { ObservationDetailsPanel } from "@/components/ObservationDetailsPanel";
import { BurningActivityCalendar } from "@/components/BurningActivityCalendar";
import { SensorComparisonCard } from "@/components/SensorComparisonCard";
import { HistoricalPatternsCard } from "@/components/HistoricalPatternsCard";
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
  GeoJSONPointFeature,
  CalendarResponse,
  SensorComparisonResponse,
  AnomalyResponse,
} from "@/types";

// Dynamic import for MapLibre GL to ensure client-only execution
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

  // Synchronize active tab with URL hash for deep-linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "calendar", "compare", "anomalies", "methodology"].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.location.hash = tab;
    }
  };
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isFirmsConfigured, setIsFirmsConfigured] = useState(false);
  const [activeMode, setActiveMode] = useState("HACKATHON_BUILD");
  const [presetAois, setPresetAois] = useState<PresetAoi[]>([DEFAULT_AOI]);
  const [selectedAoi, setSelectedAoi] = useState<PresetAoi>(DEFAULT_AOI);

  // Filter parameters: Default to Aug 01 - Aug 20, 2024 (as in reference visual)
  const [startDate, setStartDate] = useState("2024-08-01");
  const [endDate, setEndDate] = useState("2024-08-20");
  const [gridSizeKm, setGridSizeKm] = useState(1.0);
  const [spatialToleranceM, setSpatialToleranceM] = useState(1000);
  const [sensorFilter, setSensorFilter] = useState("ALL");
  const [classificationFilter, setClassificationFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Selected Observation for inspection panel
  const [selectedObservation, setSelectedObservation] = useState<
    GeoJSONPointFeature["properties"] | null
  >(null);
  const [mapCenterTarget, setMapCenterTarget] = useState<[number, number] | null>(null);

  // Fetched data states
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<SensorComparisonResponse | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Health and metadata initial load
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
        // Fallback default remains active
      }
    }
    loadMeta();
  }, []);

  // Main synchronized data fetch
  const loadData = useCallback(async () => {
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
        }).catch((err) => {
          console.error("fetchObservations error:", err);
          return null;
        }),
        fetchCalendar({
          bbox,
          startDate,
          endDate,
          gridSizeKm,
        }).catch((err) => {
          console.error("fetchCalendar error:", err);
          return null;
        }),
        fetchComparison({
          bbox,
          startDate: targetStartDate,
          endDate: targetEndDate,
          spatialToleranceM,
        }).catch((err) => {
          console.error("fetchComparison error:", err);
          return null;
        }),
        fetchAnomalies({
          bbox,
          targetYear: 2024,
        }).catch((err) => {
          console.error("fetchAnomalies error:", err);
          return null;
        }),
      ]);

      setGeoJsonData(obs);
      setCalendarData(cal);
      setComparisonData(comp);
      setAnomalyData(anom);

      // Auto-select first observation if available and none selected yet
      if (obs && obs.features && obs.features.length > 0 && !selectedObservation) {
        const first = obs.features[0];
        const props = { ...first.properties };
        if (first.geometry && first.geometry.coordinates) {
          props.longitude = first.geometry.coordinates[0];
          props.latitude = first.geometry.coordinates[1];
        }
        setSelectedObservation(props);
      }
    } catch (error) {
      console.error("Data synchronization error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedAoi,
    startDate,
    endDate,
    selectedDate,
    gridSizeKm,
    spatialToleranceM,
    sensorFilter,
    classificationFilter,
    selectedObservation,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-neutral-100 font-sans antialiased">
      {/* 1. Left Persistent Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* 2. Main Scrollable Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden">
        {/* Top Header Navigation */}
        <Header
          activeMode={activeMode}
          isBackendConnected={isBackendConnected}
          isFirmsConfigured={isFirmsConfigured}
          startDate={startDate}
          endDate={endDate}
          onOpenDateSelector={() => {
            // Quick toggle for dates
            if (startDate === "2024-08-10") {
              setStartDate("2024-08-01");
              setEndDate("2024-08-20");
            } else {
              setStartDate("2024-08-10");
              setEndDate("2024-08-15");
            }
          }}
          onOpenProvenance={() => handleTabChange("methodology")}
        />

        {/* Mobile Tab Navigation Strip (< 768px screens) */}
        <nav
          className="md:hidden flex items-center overflow-x-auto gap-1 px-4 py-2 bg-[#090A0C] border-b border-[#282D35] shrink-0"
          aria-label="Mobile section navigation"
        >
          {[
            { id: "overview", label: "Overview" },
            { id: "calendar", label: "Calendar" },
            { id: "compare", label: "Comparison" },
            { id: "anomalies", label: "Patterns" },
            { id: "methodology", label: "Methodology" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.id
                  ? "bg-[#16191F] text-[#F59E0B] border border-[#282D35]"
                  : "text-[#A4AAB5] hover:text-[#F3F4F6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-5 space-y-5 max-w-[1720px] w-full mx-auto">
          {/* OVERVIEW TAB (Primary Visual Target) */}
          {activeTab === "overview" && (
            <>
              {/* Welcome / Hero Banner */}
              <HeroBanner isFirmsConfigured={isFirmsConfigured} />

              {/* Observation Filters & Harmonization Controls */}
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
                selectedDate={selectedDate}
                onClearSelectedDate={() => setSelectedDate(null)}
                onApplyFilters={() => loadData()}
              />

              {/* 4 KPI Summary Cards */}
              <MetricsCards
                calendarData={calendarData}
                comparisonData={comparisonData}
                isLoading={isLoading}
              />

              {/* Main Center Workspace: Map (70%) + Selected Observation (30%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8">
                  <HotspotMap
                    geoJsonData={geoJsonData}
                    bbox={selectedAoi.bbox}
                    onSelectObservation={(props) => setSelectedObservation(props)}
                    isLoading={isLoading}
                    presetAois={presetAois}
                    selectedAoiId={selectedAoi.id}
                    onSelectAoi={(aoi) => {
                      setSelectedAoi(aoi);
                      setSelectedDate(null);
                    }}
                    startDate={startDate}
                    endDate={endDate}
                    centerTarget={mapCenterTarget}
                  />
                </div>

                <div className="lg:col-span-4 h-full">
                  <ObservationDetailsPanel
                    selectedObservation={selectedObservation}
                    onDeselectObservation={() => setSelectedObservation(null)}
                    onFlyToObservation={() => {
                      if (selectedObservation?.longitude != null && selectedObservation?.latitude != null) {
                        setMapCenterTarget([selectedObservation.longitude, selectedObservation.latitude]);
                      }
                    }}
                    onOpenTableView={() => {
                      // Can open accessible table or jump to records
                    }}
                  />
                </div>
              </div>

              {/* Bottom 3-Card Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <BurningActivityCalendar
                  calendarData={calendarData}
                  onSelectDate={(d) => setSelectedDate(d)}
                  selectedDate={selectedDate}
                  isLoading={isLoading}
                  onViewDeepDive={() => handleTabChange("calendar")}
                />

                <SensorComparisonCard
                  calendarData={calendarData}
                  comparisonData={comparisonData}
                  isLoading={isLoading}
                  onViewDeepDive={() => handleTabChange("compare")}
                />

                <HistoricalPatternsCard
                  anomalyData={anomalyData}
                  isLoading={isLoading}
                  onViewDeepDive={() => handleTabChange("anomalies")}
                />
              </div>
            </>
          )}

          {/* DEDICATED DEEP DIVE TABS */}
          {activeTab === "calendar" && (
            <div className="space-y-5">
              <BurningActivityCalendar
                calendarData={calendarData}
                onSelectDate={(d) => setSelectedDate(d)}
                selectedDate={selectedDate}
                isLoading={isLoading}
              />
              <HotspotMap
                geoJsonData={geoJsonData}
                bbox={selectedAoi.bbox}
                onSelectObservation={(props) => setSelectedObservation(props)}
                isLoading={isLoading}
                presetAois={presetAois}
                selectedAoiId={selectedAoi.id}
                onSelectAoi={setSelectedAoi}
                startDate={startDate}
                endDate={endDate}
                centerTarget={mapCenterTarget}
              />
            </div>
          )}

          {activeTab === "compare" && (
            <SensorDiscontinuityInspector
              comparisonData={comparisonData}
              isLoading={isLoading}
            />
          )}

          {activeTab === "anomalies" && (
            <HistoricalAnomalies
              anomalyData={anomalyData}
              isLoading={isLoading}
            />
          )}

          {activeTab === "methodology" && <MethodologyProvenance />}
        </main>

        {/* Global Scientific Footer */}
        <footer className="border-t border-[#282D35] py-4 px-6 bg-[#090A0C] text-xs text-[#A4AAB5] mt-auto shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1720px] mx-auto">
            <span>
              Data sources: <span className="text-[#F59E0B] font-medium">NASA FIRMS</span> &bull; <span className="text-[#F59E0B]">MODIS (Terra/Aqua)</span> &bull; <span className="text-red-400">VIIRS (NOAA-20/21)</span>
            </span>
            <span className="text-xs text-[#A4AAB5] font-normal">
              Not an official NASA product. For educational and research purposes only.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
