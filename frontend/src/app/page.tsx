"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { Controls } from "@/components/Controls";
import { MetricsCards } from "@/components/MetricsCards";
import { ObservationDetailsPanel } from "@/components/ObservationDetailsPanel";
import { BurningActivityCalendar } from "@/components/BurningActivityCalendar";
import { SensorComparisonCard } from "@/components/SensorComparisonCard";
import { FireActivityTrendCard } from "@/components/FireActivityTrendCard";
import { HistoricalPatternsCard } from "@/components/HistoricalPatternsCard";
import { SensorDiscontinuityInspector } from "@/components/SensorDiscontinuityInspector";
import { HistoricalAnomalies } from "@/components/HistoricalAnomalies";
import { MethodologyProvenance } from "@/components/MethodologyProvenance";
import { HarmonizationAuditView } from "@/components/HarmonizationAuditView";
import { CandidateEventsView } from "@/components/CandidateEventsView";
import { CsvImportModal } from "@/components/CsvImportModal";
import { SatelliteStatusPanel } from "@/components/SatelliteStatusPanel";
import { FireTypeBreakdownCard } from "@/components/FireTypeBreakdownCard";
import { DataFlowExplainerModal } from "@/components/DataFlowExplainerModal";
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
  DatasetProvenance,
} from "@/types";
import { MapViewMode } from "@/components/HotspotMap";

// Dynamic import for MapLibre GL to ensure client-only execution
const HotspotMap = dynamic(
  () => import("@/components/HotspotMap").then((mod) => mod.HotspotMap),
  { ssr: false }
);

const DEFAULT_AOI: PresetAoi = {
  id: "india_all",
  name: "Republic of India (National)",
  bbox: [68.1, 6.5, 97.4, 37.1],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");

  // Synchronize active tab with URL hash for deep-linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "events", "calendar", "compare", "audit", "anomalies", "methodology"].includes(hash)) {
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
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [useIST, setUseIST] = useState<boolean>(true);

  // Filter parameters: Default to March 01 - March 07, 2026 (Real NASA FIRMS Canonical Archive)
  const [startDate, setStartDate] = useState("2026-03-01");
  const [endDate, setEndDate] = useState("2026-03-07");
  const [gridSizeKm, setGridSizeKm] = useState(1.0);
  const [spatialToleranceM, setSpatialToleranceM] = useState(1000);
  const [sensorFilter, setSensorFilter] = useState("ALL");
  const [classificationFilter, setClassificationFilter] = useState("ALL");
  const [fireTypeFilter, setFireTypeFilter] = useState("ALL");
  const [isDataExplainerOpen, setIsDataExplainerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [matchingMethod, setMatchingMethod] = useState("greedy");
  const [mapActiveViewMode, setMapActiveViewMode] = useState<MapViewMode>("points");

  // Selected Observation for inspection panel
  const [selectedObservation, setSelectedObservation] = useState<
    GeoJSONPointFeature["properties"] | null
  >(null);
  const selectedObservationRef = useRef(selectedObservation);
  useEffect(() => {
    selectedObservationRef.current = selectedObservation;
  }, [selectedObservation]);

  const [mapCenterTarget, setMapCenterTarget] = useState<[number, number] | null>(null);
  const [provenance, setProvenance] = useState<DatasetProvenance | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Fetched data states
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<SensorComparisonResponse | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Health and metadata initial load
  const loadMeta = useCallback(async () => {
    try {
      const health = await fetchHealth();
      setIsBackendConnected(true);
      setIsFirmsConfigured(health.firms_configured);
      setActiveMode(health.active_mode);
      if (health.provenance) {
        setProvenance(health.provenance);
      }
    } catch {
      setIsBackendConnected(false);
    }

    try {
      const meta = await fetchMetadata();
      if (meta.preset_aois && meta.preset_aois.length > 0) {
        setPresetAois(meta.preset_aois);
        const indiaDefault = meta.preset_aois.find((a) => a.id === "india_all") || meta.preset_aois[0];
        if (indiaDefault) {
          setSelectedAoi(indiaDefault);
        }
      }
      if (meta.provenance) {
        setProvenance(meta.provenance);
      }
    } catch {
      // Fallback default remains active
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

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
          state: selectedState !== "ALL" ? selectedState : undefined,
          fireType: fireTypeFilter !== "ALL" ? fireTypeFilter : undefined,
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
          method: matchingMethod,
        }).catch((err) => {
          console.error("fetchComparison error:", err);
          return null;
        }),
        fetchAnomalies({
          bbox,
          targetYear: 2026,
        }).catch((err) => {
          console.error("fetchAnomalies error:", err);
          return null;
        }),
      ]);

      setGeoJsonData(obs);
      setCalendarData(cal);
      setComparisonData(comp);
      setAnomalyData(anom);
      if (obs?.metadata?.provenance) {
        setProvenance(obs.metadata.provenance);
      }

      if (!obs && !cal) {
        setApiError("Backend telemetry request failed. Verify FastAPI server on port 8001.");
      } else {
        setApiError(null);
      }

      // Keep selected observation synchronized with filtered results
      if (obs && obs.features && obs.features.length > 0) {
        const curId = selectedObservationRef.current?.observation_id;
        const currentMatch = curId
          ? obs.features.find((f) => f.properties.observation_id === curId)
          : null;
        if (!currentMatch) {
          // Select highest FRP genuine observation from loaded features
          const sorted = [...obs.features].sort(
            (a, b) => (b.properties.frp_mw || 0) - (a.properties.frp_mw || 0)
          );
          const top = sorted[0];
          const props = { ...top.properties };
          if (top.geometry && top.geometry.coordinates) {
            props.longitude = top.geometry.coordinates[0];
            props.latitude = top.geometry.coordinates[1];
          }
          setSelectedObservation(props);
        }
      } else {
        setSelectedObservation(null);
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
    fireTypeFilter,
    matchingMethod,
    selectedState,
  ]);

  // Derive true latest record date from active dataset
  const latestRecordDate = React.useMemo(() => {
    if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
      return null;
    }
    const dates = geoJsonData.features
      .map((f) => f.properties.acq_datetime_utc)
      .filter(Boolean)
      .sort();
    return dates[dates.length - 1] || null;
  }, [geoJsonData]);

  // Aggregate detection counts per Indian state for intuitive dropdown feedback
  const stateCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!geoJsonData || !geoJsonData.features) return counts;
    for (const f of geoJsonData.features) {
      const st = f.properties?.india_state;
      if (st) {
        counts[st] = (counts[st] || 0) + 1;
      }
    }
    return counts;
  }, [geoJsonData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090B] text-[#F4F5F7] font-sans antialiased">
      {/* 1. Left Persistent Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* 2. Main Scrollable Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative bg-[#07080B]">
        {/* Top Panoramic Atmospheric Wildfire Background across Header & Hero */}
        <div
          className="absolute top-0 right-0 w-full md:w-[78%] h-[275px] bg-no-repeat bg-right-top bg-cover pointer-events-none opacity-85 z-0"
          style={{
            backgroundImage: `url('/wildfire_header_bg.jpg')`,
            WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0) 100%)",
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        />

        {/* Top Header Navigation */}
        <Header
          activeMode={activeMode}
          isBackendConnected={isBackendConnected}
          isFirmsConfigured={isFirmsConfigured}
          startDate={startDate}
          endDate={endDate}
          provenance={provenance}
          onOpenDateSelector={() => {
            // Cycle through high-yield canonical date presets
            if (startDate === "2026-03-01" && endDate === "2026-03-07") {
              setStartDate("2026-04-11");
              setEndDate("2026-04-17");
            } else if (startDate === "2026-04-11" && endDate === "2026-04-17") {
              setStartDate("2026-03-26");
              setEndDate("2026-04-24");
            } else if (startDate === "2026-03-26" && endDate === "2026-04-24") {
              setStartDate("2026-03-01");
              setEndDate("2026-04-30");
            } else if (startDate === "2026-03-01" && endDate === "2026-04-30") {
              setStartDate("2025-11-09");
              setEndDate("2026-11-09");
            } else {
              setStartDate("2026-03-01");
              setEndDate("2026-03-07");
            }
            setSelectedDate(null);
          }}
          onOpenProvenance={() => handleTabChange("methodology")}
          onOpenUploadModal={() => setIsCsvModalOpen(true)}
          onOpenDataExplainer={() => setIsDataExplainerOpen(true)}
        />

        <DataFlowExplainerModal
          isOpen={isDataExplainerOpen}
          onClose={() => setIsDataExplainerOpen(false)}
          observationsData={geoJsonData}
          comparisonData={comparisonData}
        />

        <CsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          onImportSuccess={() => {
            loadData();
            loadMeta();
          }}
        />

        {/* Mobile Tab Navigation Strip (< 768px screens) */}
        <nav
          className="md:hidden flex items-center overflow-x-auto gap-1 px-4 py-2 bg-[#090B0F] border-b border-[#28313D] shrink-0"
          aria-label="Mobile section navigation"
        >
          {[
            { id: "overview", label: "Overview" },
            { id: "events", label: "Events" },
            { id: "calendar", label: "Calendar" },
            { id: "compare", label: "Comparison" },
            { id: "audit", label: "Audit" },
            { id: "anomalies", label: "Patterns" },
            { id: "methodology", label: "Methodology" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.id
                  ? "bg-[#151A22] text-[#F59E0B] border border-[#28313D]"
                  : "text-[#A4AFBF] hover:text-[#F1F5F9]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-2.5 sm:p-3 space-y-2 max-w-[1720px] w-full mx-auto relative z-10">
          {(!isBackendConnected || apiError) && (
            <div className="rounded-xl border border-amber-500/50 bg-amber-950/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  <strong className="text-white">Notice:</strong> Showing bundled sample data — API unreachable ({apiError || "Backend server offline"}).
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-900/60 border border-amber-600/50 font-mono text-[10px] text-amber-300">
                Bundled Sample Mode
              </span>
            </div>
          )}

          {/* Satellite Constellation Operational Status Banner (Collapsible) */}
          <SatelliteStatusPanel defaultExpanded={false} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-2"
            >
              {/* OVERVIEW TAB (Primary Visual Target) */}
              {activeTab === "overview" && (
            <>
              {/* Welcome / Hero Banner - Problem Statement & Core USP Showcase */}
              <HeroBanner
                isFirmsConfigured={isFirmsConfigured}
                provenance={provenance}
                latestRecordDate={latestRecordDate}
                onOpenDataExplainer={() => setIsDataExplainerOpen(true)}
                onSelectTab={handleTabChange}
              />

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
                selectedState={selectedState}
                setSelectedState={setSelectedState}
                stateCounts={stateCounts}
                totalCount={geoJsonData?.total_count || geoJsonData?.features?.length || 0}
                useIST={useIST}
                setUseIST={setUseIST}
                selectedDate={selectedDate}
                onClearSelectedDate={() => setSelectedDate(null)}
                fireTypeFilter={fireTypeFilter}
                setFireTypeFilter={setFireTypeFilter}
                onApplyFilters={() => loadData()}
              />

              {/* 4 Interactive KPI Summary Cards */}
              <MetricsCards
                calendarData={calendarData}
                comparisonData={comparisonData}
                geoJsonData={geoJsonData}
                selectedDate={selectedDate}
                isLoading={isLoading}
                sensorFilter={sensorFilter}
                onSelectSensor={(sensor) => {
                  setSensorFilter((prev) => (prev === sensor ? "ALL" : sensor));
                }}
                classificationFilter={classificationFilter}
                onSelectClassification={(cls) => {
                  setClassificationFilter((prev) => (prev === cls ? "ALL" : cls));
                }}
                onSelectGridMode={() => {
                  setMapActiveViewMode("grid");
                }}
                isGridModeActive={mapActiveViewMode === "grid"}
                provenance={provenance}
              />

              {/* Thermal Anomaly Type Breakdown & Honest Attribution Card */}
              <FireTypeBreakdownCard
                bbox={selectedAoi.bbox}
                startDate={startDate}
                endDate={endDate}
                activeTypeFilter={fireTypeFilter}
                onSelectTypeFilter={(t) => setFireTypeFilter(t)}
              />

              {/* Main Center Workspace: Map (70%) + Selected Observation (30%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
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
                    selectedObservationId={selectedObservation?.observation_id}
                    selectedObservation={selectedObservation}
                    selectedState={selectedState}
                    activeViewMode={mapActiveViewMode}
                    onViewModeChange={(m) => setMapActiveViewMode(m)}
                  />
                </div>

                <div className="lg:col-span-4 h-full">
                  <ObservationDetailsPanel
                    selectedObservation={selectedObservation}
                    onSelectObservation={(props) => {
                      setSelectedObservation(props);
                      if (props?.longitude != null && props?.latitude != null) {
                        setMapCenterTarget([props.longitude, props.latitude]);
                      }
                    }}
                    onDeselectObservation={() => setSelectedObservation(null)}
                    onFlyToObservation={() => {
                      if (selectedObservation?.longitude != null && selectedObservation?.latitude != null) {
                        setMapCenterTarget([selectedObservation.longitude, selectedObservation.latitude]);
                      }
                    }}
                    onOpenTableView={() => {
                      handleTabChange("audit");
                    }}
                    useIST={useIST}
                    allObservations={geoJsonData?.features || []}
                  />
                </div>
              </div>

              {/* Bottom 3-Card Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <FireActivityTrendCard
                  calendarData={calendarData}
                  isLoading={isLoading}
                  onSelectDate={(d) => setSelectedDate(d)}
                  selectedDate={selectedDate}
                />

                <BurningActivityCalendar
                  calendarData={calendarData}
                  onSelectDate={(d) => setSelectedDate(d)}
                  selectedDate={selectedDate}
                  isLoading={isLoading}
                />

                <SensorComparisonCard
                  comparisonData={comparisonData}
                  onViewDeepDive={() => handleTabChange("compare")}
                />
              </div>
            </>
          )}

          {/* DEDICATED DEEP DIVE TABS */}
          {activeTab === "events" && (
            <CandidateEventsView
              bbox={selectedAoi.bbox}
              startDate={startDate}
              endDate={endDate}
              selectedState={selectedState !== "ALL" ? selectedState : undefined}
              useIST={useIST}
              onFlyToCentroid={(coords) => {
                setMapCenterTarget(coords);
                handleTabChange("overview");
              }}
            />
          )}

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
                selectedObservationId={selectedObservation?.observation_id}
              />
            </div>
          )}

          {activeTab === "compare" && (
            <SensorDiscontinuityInspector
              comparisonData={comparisonData}
              isLoading={isLoading}
            />
          )}

          {activeTab === "audit" && (
            <HarmonizationAuditView
              geoJsonData={geoJsonData}
              comparisonData={comparisonData}
              selectedAoi={selectedAoi}
              startDate={startDate}
              endDate={endDate}
              selectedDate={selectedDate}
              gridSizeKm={gridSizeKm}
              spatialToleranceM={spatialToleranceM}
              provenance={provenance}
              activeMethod={matchingMethod}
              onChangeMethod={(m) => setMatchingMethod(m)}
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
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Scientific Footer & Provenance Strip */}
        <footer className="border-t border-[#2A3039] py-3.5 px-6 bg-[#08090B] text-xs text-[#B1B7C1] mt-auto shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 max-w-[1720px] mx-auto">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span>
                Data sources: <span className="text-[#F5B32F] font-medium">NASA FIRMS</span> &bull; <span className="text-[#A78BFA] font-medium">MODIS C6.1 (Terra/Aqua)</span> &bull; <span className="text-[#38BDF8] font-medium">VIIRS C2 (NOAA-20/21)</span>
              </span>
              <span className="text-[#858D99] hidden sm:inline">&bull;</span>
              <span className="font-mono text-[11px] text-[#858D99]">
                Period: {startDate} &rarr; {endDate} UTC
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#858D99]">
              <button
                onClick={() => handleTabChange("methodology")}
                className="hover:text-[#F4F5F7] transition-colors underline underline-offset-2"
              >
                Methodology &amp; provenance
              </button>
              <span>&bull;</span>
              <span>Not an official NASA product. For scientific exploration only.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
