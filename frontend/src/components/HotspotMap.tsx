"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Table,
  Crosshair,
  Focus,
  ChevronDown,
  Map as MapIcon,
  Flame,
  LayoutGrid,
  Activity,
  Thermometer,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sliders,
  Radio,
  Info,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { GeoJSONFeatureCollection, GeoJSONPointFeature, PresetAoi } from "@/types";
import { fetchStatesGeoJson } from "@/lib/api";

export type MapViewMode = "points" | "density" | "frp" | "brightness" | "grid" | "fire_types";
export type FrpSensorFilter = "ALL" | "MODIS" | "VIIRS";
export type BrightnessChannel = "ch1" | "ch2";

interface HotspotMapProps {
  geoJsonData: GeoJSONFeatureCollection | null;
  bbox: [number, number, number, number];
  onSelectObservation?: (props: GeoJSONPointFeature["properties"]) => void;
  isLoading?: boolean;
  presetAois?: PresetAoi[];
  selectedAoiId?: string;
  onSelectAoi?: (aoi: PresetAoi) => void;
  startDate?: string;
  endDate?: string;
  centerTarget?: [number, number] | null;
  selectedObservationId?: string | null;
  selectedObservation?: GeoJSONPointFeature["properties"] | null;
  selectedState?: string;
  activeViewMode?: MapViewMode;
  onViewModeChange?: (mode: MapViewMode) => void;
}

const VECTOR_DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";
const VECTOR_STREETS_STYLE = "https://tiles.openfreemap.org/styles/positron";

const SATELLITE_RASTER_STYLE: any = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution:
        "&copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community",
    },
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster",
      source: "esri-satellite",
    },
  ],
};

const R_EARTH_AUTHALIC_KM = 6371.0088;

// Zoom-scaled circle radii for crisp, uncluttered visualization across all zoom levels
const MODIS_BASE_RADIUS: any = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3, 3.2,
  6, 5.5,
  9, 8.5,
  12, 12.0,
];

const MODIS_FRP_RADIUS: any = [
  "*",
  ["interpolate", ["linear"], ["zoom"], 3, 0.55, 7, 1.0, 11, 1.45],
  [
    "interpolate",
    ["linear"],
    ["sqrt", ["coalesce", ["get", "frp_mw"], 1]],
    0, 4.5,
    3, 7.5,
    7, 11.5,
    14, 16.5,
  ],
];

const VIIRS_BASE_RADIUS: any = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3, 2.2,
  6, 4.0,
  9, 6.0,
  12, 9.0,
];

const VIIRS_FRP_RADIUS: any = [
  "*",
  ["interpolate", ["linear"], ["zoom"], 3, 0.55, 7, 1.0, 11, 1.45],
  [
    "interpolate",
    ["linear"],
    ["sqrt", ["coalesce", ["get", "frp_mw"], 1]],
    0, 3.0,
    3, 5.5,
    7, 8.5,
    14, 13.0,
  ],
];

const MATCHED_HALO_RADIUS: any = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3, 6,
  6, 10,
  9, 14,
  12, 20,
];

function computeGridCellBounds(lat: number, lon: number, gridSizeKm: number = 1.0) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const xKm = R_EARTH_AUTHALIC_KM * lonRad;
  const yKm = R_EARTH_AUTHALIC_KM * Math.sin(latRad);
  const gridX = Math.floor(xKm / gridSizeKm);
  const gridY = Math.floor(yKm / gridSizeKm);

  const xMin = gridX * gridSizeKm;
  const xMax = (gridX + 1) * gridSizeKm;
  const yMin = gridY * gridSizeKm;
  const yMax = (gridY + 1) * gridSizeKm;

  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const west = toDeg(xMin / R_EARTH_AUTHALIC_KM);
  const east = toDeg(xMax / R_EARTH_AUTHALIC_KM);
  const south = toDeg(Math.asin(Math.max(-1.0, Math.min(1.0, yMin / R_EARTH_AUTHALIC_KM))));
  const north = toDeg(Math.asin(Math.max(-1.0, Math.min(1.0, yMax / R_EARTH_AUTHALIC_KM))));

  return { west, south, east, north, cellId: `grid_${gridSizeKm}km_${gridY}_${gridX}` };
}

function buildGridCellsGeoJson(features: any[]): any {
  if (!features || features.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const cellMap = new Map<string, {
    bounds: { west: number; south: number; east: number; north: number; cellId: string };
    count: number;
    maxFrp: number;
    sensors: Set<string>;
    topObservation: any;
    state?: string;
  }>();

  for (const feat of features) {
    const coords = (feat.geometry as any)?.coordinates;
    if (!coords || coords.length < 2) continue;
    const lon = coords[0];
    const lat = coords[1];
    const frp = feat.properties?.frp_mw || 0;
    const sensor = feat.properties?.sensor || "UNKNOWN";

    const bounds = computeGridCellBounds(lat, lon, 1.0);
    const cellKey = bounds.cellId;

    if (!cellMap.has(cellKey)) {
      cellMap.set(cellKey, {
        bounds,
        count: 1,
        maxFrp: frp,
        sensors: new Set([sensor]),
        topObservation: feat.properties,
        state: feat.properties?.india_state || undefined,
      });
    } else {
      const entry = cellMap.get(cellKey)!;
      entry.count += 1;
      if (frp > entry.maxFrp) {
        entry.maxFrp = frp;
        entry.topObservation = feat.properties;
      }
      entry.sensors.add(sensor);
    }
  }

  const polygonFeatures = Array.from(cellMap.entries()).map(([cellId, d]) => {
    const { west, south, east, north } = d.bounds;
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ],
        ],
      },
      properties: {
        cell_id: cellId,
        count: d.count,
        max_frp: d.maxFrp,
        sensors: Array.from(d.sensors).join(" + "),
        india_state: d.state || "India",
        top_observation: d.topObservation,
      },
    };
  });

  return {
    type: "FeatureCollection",
    features: polygonFeatures,
  };
}

export const HotspotMap: React.FC<HotspotMapProps> = ({
  geoJsonData,
  bbox,
  onSelectObservation,
  isLoading = false,
  presetAois = [],
  selectedAoiId,
  onSelectAoi,
  startDate = "2026-03-01",
  endDate = "2026-03-07",
  centerTarget = null,
  selectedObservationId = null,
  selectedObservation = null,
  selectedState = "ALL",
  activeViewMode,
  onViewModeChange,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const haloMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // 5 Mandatory Map Modes
  const [viewMode, setViewMode] = useState<MapViewMode>(activeViewMode || "points");

  useEffect(() => {
    if (activeViewMode && activeViewMode !== viewMode) {
      setViewMode(activeViewMode);
    }
  }, [activeViewMode, viewMode]);

  const switchViewMode = (m: MapViewMode) => {
    setViewMode(m);
    if (onViewModeChange) {
      onViewModeChange(m);
    }
  };
  const [sizeByFrp, setSizeByFrp] = useState<boolean>(false);
  const [frpSensorFilter, setFrpSensorFilter] = useState<FrpSensorFilter>("ALL");
  const [brightnessChannel, setBrightnessChannel] = useState<BrightnessChannel>("ch1");

  // Basemap & Context Overlays
  const [basemapType, setBasemapType] = useState<"satellite" | "dark" | "streets">("satellite");
  const [showStateBorders, setShowStateBorders] = useState<boolean>(true);
  const [showFsiCue, setShowFsiCue] = useState<boolean>(false);
  const [showBhuvanCue, setShowBhuvanCue] = useState<boolean>(false);
  const [showFirmsWms, setShowFirmsWms] = useState<boolean>(false);
  const [statesGeoJson, setStatesGeoJson] = useState<any>(null);

  // Timeline Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);
  const [timelineDate, setTimelineDate] = useState<string | null>(null); // null = "all"

  // UI Panels & Hover
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<{ x: number; y: number; properties: any } | null>(null);
  const [hoveredGridCell, setHoveredGridCell] = useState<{ x: number; y: number; properties: any } | null>(null);
  const [isLayersPanelExpanded, setIsLayersPanelExpanded] = useState(false);
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [showAccessibleTable, setShowAccessibleTable] = useState(false);

  // Layer filters
  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showMatched, setShowMatched] = useState(true);
  const [layerOpacity, setLayerOpacity] = useState(85);

  // Load official Indian states boundaries
  useEffect(() => {
    fetchStatesGeoJson()
      .then((data) => setStatesGeoJson(data))
      .catch((err) => console.warn("Failed to load states GeoJSON:", err));
  }, []);

  // Compute unique sorted observation dates for timeline playback
  const availableDates = useMemo(() => {
    if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
      return [];
    }
    const dates = new Set<string>();
    for (const f of geoJsonData.features) {
      const dt = f.properties?.acq_datetime_utc;
      if (dt) {
        dates.add(dt.slice(0, 10));
      }
    }
    return Array.from(dates).sort();
  }, [geoJsonData]);

  // Filter features according to timeline scrubber & FRP sensor filter
  const filteredFeatures = useMemo(() => {
    if (!geoJsonData || !geoJsonData.features) return [];
    let feats = geoJsonData.features;

    // Timeline single-day filter
    if (timelineDate && timelineDate !== "ALL") {
      feats = feats.filter((f) => f.properties?.acq_datetime_utc?.startsWith(timelineDate));
    }

    // FRP intensity mode sensor choice
    if (viewMode === "frp" && frpSensorFilter !== "ALL") {
      feats = feats.filter((f) => f.properties?.sensor === frpSensorFilter);
    }

    return feats;
  }, [geoJsonData, timelineDate, viewMode, frpSensorFilter]);

  // Count excluded zero/null FRP records for Mode C
  const excludedFrpCount = useMemo(() => {
    if (!geoJsonData || !geoJsonData.features) return 0;
    return geoJsonData.features.filter((f) => f.properties?.frp_mw == null || f.properties?.frp_mw <= 0).length;
  }, [geoJsonData]);

  // Timeline playback timer
  useEffect(() => {
    if (!isPlaying || availableDates.length === 0) return;

    const intervalMs = Math.round(1100 / playbackSpeed);
    const timer = setInterval(() => {
      setTimelineDate((prev) => {
        if (!prev || prev === "ALL") return availableDates[0];
        const idx = availableDates.indexOf(prev);
        if (idx === -1 || idx >= availableDates.length - 1) {
          return availableDates[0]; // loop
        }
        return availableDates[idx + 1];
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, availableDates]);

  // Setup all 5 Map Modes and Context Layers in MapLibre
  const setupLayers = useCallback((instance: maplibregl.Map) => {
    const currentFeats = filteredFeatures;
    const currentData = {
      type: "FeatureCollection",
      features: currentFeats,
    };

    // 1. Hotspots Source
    if (!instance.getSource("hotspots")) {
      instance.addSource("hotspots", {
        type: "geojson",
        data: currentData as any,
        cluster: false,
      });
    }

    // 2. States Boundaries Source
    if (!instance.getSource("india-states") && statesGeoJson) {
      instance.addSource("india-states", {
        type: "geojson",
        data: statesGeoJson,
      });

      instance.addLayer({
        id: "states-fill",
        type: "fill",
        source: "india-states",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "name"], selectedState || ""],
            "#F59E0B",
            "#38BDF8"
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "name"], selectedState || ""],
            0.15,
            0.02
          ],
        },
      });

      instance.addLayer({
        id: "states-line",
        type: "line",
        source: "india-states",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "name"], selectedState || ""],
            "#F59E0B",
            "#475569"
          ],
          "line-width": [
            "case",
            ["==", ["get", "name"], selectedState || ""],
            2.5,
            1.2
          ],
          "line-dasharray": [2, 2],
          "line-opacity": 0.85,
        },
      });
    }

    // 3. Mode B: Detection Density Heatmap (Weight = 1 Record)
    if (!instance.getLayer("mode-b-density-heatmap")) {
      instance.addLayer({
        id: "mode-b-density-heatmap",
        type: "heatmap",
        source: "hotspots",
        layout: { visibility: "none" },
        paint: {
          // Mandatory: pure detection count smoothing, weight = 1
          "heatmap-weight": 1.0,
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 0.8,
            6, 1.8,
            10, 3.2,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.15, "rgba(56, 189, 248, 0.45)",  // Cyan
            0.35, "rgba(52, 211, 153, 0.70)",  // Emerald
            0.60, "rgba(245, 179, 47, 0.85)",  // Amber
            0.80, "rgba(249, 115, 22, 0.95)",  // Orange
            1.00, "rgba(239, 68, 68, 1.00)",   // Red
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 14,
            6, 22,
            9, 36,
            13, 50,
          ],
          "heatmap-opacity": 0.82,
        },
      });
    }

    // 4. Mode C: FRP-Weighted Intensity Heatmap (Weight = ln(1 + FRP))
    if (!instance.getLayer("mode-c-frp-heatmap")) {
      instance.addLayer({
        id: "mode-c-frp-heatmap",
        type: "heatmap",
        source: "hotspots",
        layout: { visibility: "none" },
        paint: {
          // Mandatory: relative FRP-weighted intensity using ln(1 + FRP)
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["ln", ["+", ["coalesce", ["get", "frp_mw"], 0], 1]],
            0, 0.05,
            1.0, 0.25,
            2.5, 0.55,
            4.0, 0.80,
            6.0, 1.00,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 1.0,
            7, 2.4,
            11, 4.2,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.15, "rgba(168, 85, 247, 0.5)",  // Violet
            0.35, "rgba(56, 189, 248, 0.75)", // Cyan
            0.60, "rgba(245, 158, 11, 0.90)", // Radiant Amber
            0.80, "rgba(249, 115, 22, 0.95)", // High FRP Orange
            1.00, "rgba(255, 30, 0, 1.00)",   // Intense Anomaly Red
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 16,
            6, 26,
            9, 42,
            13, 56,
          ],
          "heatmap-opacity": 0.88,
        },
      });
    }

    // 5. Mode E: 1 km Equal-Area Grid Cells (CEA)
    if (!instance.getSource("grid-cells")) {
      instance.addSource("grid-cells", {
        type: "geojson",
        data: buildGridCellsGeoJson(currentFeats),
      });

      instance.addLayer({
        id: "grid-cells-fill",
        type: "fill",
        source: "grid-cells",
        layout: { visibility: "none" },
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "count"], 1],
            1, "#F59E0B",
            3, "#F97316",
            6, "#EF4444",
          ],
          "fill-opacity": 0.42,
        },
      });

      instance.addLayer({
        id: "grid-cells-line",
        type: "line",
        source: "grid-cells",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#F59E0B",
          "line-width": 1.5,
          "line-opacity": 0.85,
        },
      });
    }

    // 6. Mode D: Brightness Temperature (Kelvin Scale Sequential View)
    if (!instance.getLayer("mode-d-brightness-circles")) {
      instance.addLayer({
        id: "mode-d-brightness-circles",
        type: "circle",
        source: "hotspots",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 4,
            7, 7,
            11, 12,
          ],
          // Sequential thermal palette for Kelvin radiometry
          "circle-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "brightness_channel_1"], ["get", "brightness_kelvin"], 310],
            290, "#1E1B4B", // Cool ambient background
            315, "#6D28D9", // Deep violet
            335, "#BE123C", // Rose red
            350, "#EA580C", // Intense orange
            370, "#FBBF24", // Radiative thermal peak
          ],
          "circle-opacity": layerOpacity / 100,
          "circle-stroke-width": 1.2,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-opacity": 0.75,
        },
      });
    }

    // 7. Mode A: Hotspot Points (MODIS Violet + VIIRS Cyan + Matches)
    if (!instance.getLayer("modis-layer")) {
      instance.addLayer({
        id: "modis-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", "sensor", "MODIS"] as any,
        paint: {
          "circle-radius": sizeByFrp ? MODIS_FRP_RADIUS : MODIS_BASE_RADIUS,
          "circle-color": "#A78BFA",
          "circle-opacity": (layerOpacity / 100) * 0.75,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#8B5CF6",
        },
      });
    }

    if (!instance.getLayer("viirs-layer")) {
      instance.addLayer({
        id: "viirs-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", "sensor", "VIIRS"] as any,
        paint: {
          "circle-radius": sizeByFrp ? VIIRS_FRP_RADIUS : VIIRS_BASE_RADIUS,
          "circle-color": "#38BDF8",
          "circle-opacity": layerOpacity / 100,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#0284C7",
        },
      });
    }

    // Candidate Match Halo Layer - Green
    if (!instance.getLayer("matched-halo-layer")) {
      instance.addLayer({
        id: "matched-halo-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", "classification", "matched"] as any,
        paint: {
          "circle-radius": MATCHED_HALO_RADIUS,
          "circle-color": "transparent",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#34D399",
          "circle-stroke-opacity": layerOpacity / 100,
        },
      });
    }

    // 8. FSI Large Fire Alerts Overlay Layer
    if (!instance.getLayer("fsi-cue-layer")) {
      instance.addLayer({
        id: "fsi-cue-layer",
        type: "circle",
        source: "hotspots",
        filter: [
          "any",
          ["==", ["get", "is_large_fire_candidate"], true],
          ["==", ["get", "context_class"], "FSI_SUPPORTED_FOREST_ALERT"],
        ] as any,
        layout: { visibility: showFsiCue ? "visible" : "none" },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 6,
            7, 12,
            11, 18,
          ],
          "circle-color": "rgba(239, 68, 68, 0.15)",
          "circle-stroke-width": 2.2,
          "circle-stroke-color": "#EF4444",
          "circle-stroke-opacity": 0.9,
        },
      });
    }

    // 9. Bhuvan Agricultural Fire Cues Overlay Layer
    if (!instance.getLayer("bhuvan-cue-layer")) {
      instance.addLayer({
        id: "bhuvan-cue-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", ["get", "context_class"], "BHUVAN_AGRICULTURAL_FIRE_RECORD"] as any,
        layout: { visibility: showBhuvanCue ? "visible" : "none" },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 5,
            7, 10,
            11, 16,
          ],
          "circle-color": "rgba(16, 185, 129, 0.15)",
          "circle-stroke-width": 2.0,
          "circle-stroke-color": "#10B981",
          "circle-stroke-opacity": 0.85,
        },
      });
    }

    // 10. NASA GIBS WMS Active Fire Layer
    if (!instance.getSource("nasa-firms-gibs") && showFirmsWms) {
      try {
        instance.addSource("nasa-firms-gibs", {
          type: "raster",
          tiles: [
            "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Thermal_Anomalies_All/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
          ],
          tileSize: 256,
          attribution: "&copy; NASA EOSDIS GIBS / FIRMS",
        });

        const beforeLayer = instance.getLayer("modis-layer") ? "modis-layer" : undefined;
        instance.addLayer(
          {
            id: "nasa-firms-gibs-layer",
            type: "raster",
            source: "nasa-firms-gibs",
            paint: {
              "raster-opacity": 0.65,
            },
          },
          beforeLayer
        );
      } catch (err) {
        console.warn("NASA GIBS layer registration:", err);
      }
    }

    // 11. Mode: Fire Types & Identification Layer
    if (!instance.getLayer("mode-fire-types-circles")) {
      instance.addLayer({
        id: "mode-fire-types-circles",
        type: "circle",
        source: "hotspots",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": sizeByFrp ? VIIRS_FRP_RADIUS : VIIRS_BASE_RADIUS,
          "circle-color": [
            "match",
            ["get", "context_class"],
            "LIKELY_FOREST_CONTEXT", "#EF4444",
            "FSI_SUPPORTED_FOREST_ALERT", "#DC2626",
            "LIKELY_AGRICULTURAL_CONTEXT", "#F59E0B",
            "BHUVAN_AGRICULTURAL_FIRE_RECORD", "#10B981",
            "SEASONAL_AGRICULTURAL_RESIDUE_HEURISTIC", "#F59E0B",
            "OTHER_STATIC_THERMAL_SOURCE", "#A855F7",
            "VOLCANIC", "#FF5500",
            "OFFSHORE", "#06B6D4",
            /* fallback */ "#94A3B8"
          ],
          "circle-opacity": layerOpacity / 100,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-opacity": 0.85,
        },
      });
    }

    // Selected Observation Active Glowing Halo Ring
    if (!instance.getLayer("selected-observation-halo-glow")) {
      instance.addLayer({
        id: "selected-observation-halo-glow",
        type: "circle",
        source: "hotspots",
        filter: ["==", "observation_id", ""],
        paint: {
          "circle-radius": 24,
          "circle-color": "#EF4444",
          "circle-opacity": 0.35,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#FF5500",
          "circle-stroke-opacity": 0.85,
        },
      });
    }

    // Interactions
    const handlePointClick = (e: any) => {
      if (!e.features || !e.features.length) return;
      const feat = e.features[0];
      const props = { ...feat.properties };
      if (feat.geometry && feat.geometry.coordinates) {
        props.longitude = feat.geometry.coordinates[0];
        props.latitude = feat.geometry.coordinates[1];
      }
      if (onSelectObservation) {
        onSelectObservation(props);
      }
    };

    instance.on("click", "modis-layer", handlePointClick);
    instance.on("click", "viirs-layer", handlePointClick);
    instance.on("click", "mode-d-brightness-circles", handlePointClick);
    instance.on("click", "mode-fire-types-circles", handlePointClick);
    instance.on("click", "fsi-cue-layer", handlePointClick);
    instance.on("click", "bhuvan-cue-layer", handlePointClick);

    const setPointer = () => {
      if (instance) instance.getCanvas().style.cursor = "pointer";
    };
    const resetPointer = () => {
      if (instance) instance.getCanvas().style.cursor = "";
    };

    const handleFeatureHover = (e: any) => {
      setPointer();
      if (e.features && e.features.length > 0) {
        setHoveredFeature({
          x: e.point.x,
          y: e.point.y,
          properties: e.features[0].properties,
        });
      }
    };

    const handleFeatureLeave = () => {
      resetPointer();
      setHoveredFeature(null);
    };

    instance.on("mousemove", "modis-layer", handleFeatureHover);
    instance.on("mouseleave", "modis-layer", handleFeatureLeave);
    instance.on("mousemove", "viirs-layer", handleFeatureHover);
    instance.on("mouseleave", "viirs-layer", handleFeatureLeave);
    instance.on("mousemove", "mode-d-brightness-circles", handleFeatureHover);
    instance.on("mouseleave", "mode-d-brightness-circles", handleFeatureLeave);
    instance.on("mousemove", "mode-fire-types-circles", handleFeatureHover);
    instance.on("mouseleave", "mode-fire-types-circles", handleFeatureLeave);
    instance.on("mousemove", "fsi-cue-layer", handleFeatureHover);
    instance.on("mouseleave", "fsi-cue-layer", handleFeatureLeave);
    instance.on("mousemove", "bhuvan-cue-layer", handleFeatureHover);
    instance.on("mouseleave", "bhuvan-cue-layer", handleFeatureLeave);

    // Grid Cell Hover & Click
    instance.on("mousemove", "grid-cells-fill", (e: any) => {
      setPointer();
      if (e.features && e.features.length > 0) {
        setHoveredGridCell({
          x: e.point.x,
          y: e.point.y,
          properties: e.features[0].properties,
        });
      }
    });
    instance.on("mouseleave", "grid-cells-fill", () => {
      resetPointer();
      setHoveredGridCell(null);
    });
    instance.on("click", "grid-cells-fill", (e: any) => {
      if (!e.features || !e.features.length) return;
      const feat = e.features[0];
      if (feat.properties?.top_observation) {
        try {
          const topObs = typeof feat.properties.top_observation === "string"
            ? JSON.parse(feat.properties.top_observation)
            : feat.properties.top_observation;
          if (onSelectObservation) onSelectObservation(topObs);
        } catch {
          // ignore
        }
      }
    });
  }, [
    filteredFeatures,
    statesGeoJson,
    selectedState,
    sizeByFrp,
    layerOpacity,
    onSelectObservation,
    showBhuvanCue,
    showFirmsWms,
    showFsiCue,
  ]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      const centerLon = (bbox[0] + bbox[2]) / 2.0;
      const centerLat = (bbox[1] + bbox[3]) / 2.0;
      const initialZoom = Math.abs(bbox[2] - bbox[0]) > 10 ? 4.8 : 8.5;

      const currentStyle =
        basemapType === "satellite"
          ? SATELLITE_RASTER_STYLE
          : basemapType === "streets"
          ? VECTOR_STREETS_STYLE
          : VECTOR_DARK_STYLE;

      const instance = new maplibregl.Map({
        container: mapContainer.current,
        style: currentStyle,
        center: [centerLon, centerLat],
        zoom: initialZoom,
        attributionControl: false,
      });

      instance.on("load", () => {
        map.current = instance;
        setIsMapLoaded(true);
        setupLayers(instance);
      });

      instance.on("mousemove", (e) => {
        setCursorCoords({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
          zoom: Math.round(instance.getZoom() * 10) / 10,
        });
      });

      instance.on("mouseout", () => {
        setCursorCoords(null);
      });

      instance.on("webglcontextlost", () => {
        setMapError("WebGL context lost. Please reload the page to restore the 3D map canvas.");
      });
    } catch {
      setMapError("Map initialization failed. Displaying fallback view.");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [basemapType, bbox, setupLayers]);

  // Update Data Sources when features or states change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const src = map.current.getSource("hotspots") as maplibregl.GeoJSONSource;
    if (src) {
      src.setData({
        type: "FeatureCollection",
        features: filteredFeatures,
      });
    }
    const gridSrc = map.current.getSource("grid-cells") as maplibregl.GeoJSONSource;
    if (gridSrc) {
      gridSrc.setData(buildGridCellsGeoJson(filteredFeatures));
    }
    const statesSrc = map.current.getSource("india-states") as maplibregl.GeoJSONSource;
    if (statesSrc && statesGeoJson) {
      statesSrc.setData(statesGeoJson);
    }
  }, [filteredFeatures, statesGeoJson, isMapLoaded]);

  // Toggle Visibility for the 6 Active View Modes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const m = map.current;
    try {
      // Mode B: Density Heatmap
      if (m.getLayer("mode-b-density-heatmap")) {
        m.setLayoutProperty("mode-b-density-heatmap", "visibility", viewMode === "density" ? "visible" : "none");
      }
      // Mode C: FRP Intensity Heatmap
      if (m.getLayer("mode-c-frp-heatmap")) {
        m.setLayoutProperty("mode-c-frp-heatmap", "visibility", viewMode === "frp" ? "visible" : "none");
      }
      // Mode D: Brightness Temperature Circles
      if (m.getLayer("mode-d-brightness-circles")) {
        m.setLayoutProperty("mode-d-brightness-circles", "visibility", viewMode === "brightness" ? "visible" : "none");
      }
      // Mode E: Grid Cells
      if (m.getLayer("grid-cells-fill")) {
        m.setLayoutProperty("grid-cells-fill", "visibility", viewMode === "grid" ? "visible" : "none");
      }
      if (m.getLayer("grid-cells-line")) {
        m.setLayoutProperty("grid-cells-line", "visibility", viewMode === "grid" ? "visible" : "none");
      }
      // Mode F: Fire Types (AI Classification)
      if (m.getLayer("mode-fire-types-circles")) {
        m.setLayoutProperty("mode-fire-types-circles", "visibility", viewMode === "fire_types" ? "visible" : "none");
      }
      // Mode A: Points
      if (m.getLayer("modis-layer")) {
        m.setLayoutProperty("modis-layer", "visibility", viewMode === "points" && showModis ? "visible" : "none");
      }
      if (m.getLayer("viirs-layer")) {
        m.setLayoutProperty("viirs-layer", "visibility", viewMode === "points" && showViirs ? "visible" : "none");
      }
      if (m.getLayer("matched-halo-layer")) {
        m.setLayoutProperty("matched-halo-layer", "visibility", viewMode === "points" && showMatched ? "visible" : "none");
      }
      // State Borders
      if (m.getLayer("states-fill") && m.getLayer("states-line")) {
        const vis = showStateBorders ? "visible" : "none";
        m.setLayoutProperty("states-fill", "visibility", vis);
        m.setLayoutProperty("states-line", "visibility", vis);
      }
    } catch {
      // ignore
    }
  }, [viewMode, showModis, showViirs, showMatched, showStateBorders, isMapLoaded]);

  // Update Point Sizing Expression dynamically when sizeByFrp changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const m = map.current;
    try {
      if (m.getLayer("modis-layer")) {
        m.setPaintProperty(
          "modis-layer",
          "circle-radius",
          sizeByFrp ? MODIS_FRP_RADIUS : MODIS_BASE_RADIUS
        );
      }
      if (m.getLayer("viirs-layer")) {
        m.setPaintProperty(
          "viirs-layer",
          "circle-radius",
          sizeByFrp ? VIIRS_FRP_RADIUS : VIIRS_BASE_RADIUS
        );
      }
      if (m.getLayer("mode-fire-types-circles")) {
        m.setPaintProperty(
          "mode-fire-types-circles",
          "circle-radius",
          sizeByFrp ? VIIRS_FRP_RADIUS : VIIRS_BASE_RADIUS
        );
      }
    } catch {
      // ignore
    }
  }, [sizeByFrp, isMapLoaded]);

  // Contextual Overlays Toggles Effect (FSI, Bhuvan, NASA FIRMS WMS)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const m = map.current;
    try {
      if (m.getLayer("fsi-cue-layer")) {
        m.setLayoutProperty("fsi-cue-layer", "visibility", showFsiCue ? "visible" : "none");
      }
      if (m.getLayer("bhuvan-cue-layer")) {
        m.setLayoutProperty("bhuvan-cue-layer", "visibility", showBhuvanCue ? "visible" : "none");
      }

      if (showFirmsWms) {
        if (!m.getSource("nasa-firms-gibs")) {
          m.addSource("nasa-firms-gibs", {
            type: "raster",
            tiles: [
              "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Thermal_Anomalies_All/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
            ],
            tileSize: 256,
            attribution: "&copy; NASA EOSDIS GIBS / FIRMS",
          });
        }
        if (!m.getLayer("nasa-firms-gibs-layer")) {
          const beforeLayer = m.getLayer("modis-layer") ? "modis-layer" : undefined;
          m.addLayer(
            {
              id: "nasa-firms-gibs-layer",
              type: "raster",
              source: "nasa-firms-gibs",
              paint: { "raster-opacity": 0.65 },
            },
            beforeLayer
          );
        } else {
          m.setLayoutProperty("nasa-firms-gibs-layer", "visibility", "visible");
        }
      } else {
        if (m.getLayer("nasa-firms-gibs-layer")) {
          m.setLayoutProperty("nasa-firms-gibs-layer", "visibility", "none");
        }
      }
    } catch (err) {
      console.warn("Error updating context overlay layers:", err);
    }
  }, [showFsiCue, showBhuvanCue, showFirmsWms, isMapLoaded]);

  // Dynamic Opacity updates across active layers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const m = map.current;
    try {
      const alpha = layerOpacity / 100;
      if (m.getLayer("modis-layer")) {
        m.setPaintProperty("modis-layer", "circle-opacity", alpha * 0.75);
      }
      if (m.getLayer("viirs-layer")) {
        m.setPaintProperty("viirs-layer", "circle-opacity", alpha);
      }
      if (m.getLayer("matched-halo-layer")) {
        m.setPaintProperty("matched-halo-layer", "circle-stroke-opacity", alpha);
      }
      if (m.getLayer("mode-d-brightness-circles")) {
        m.setPaintProperty("mode-d-brightness-circles", "circle-opacity", alpha);
      }
      if (m.getLayer("mode-fire-types-circles")) {
        m.setPaintProperty("mode-fire-types-circles", "circle-opacity", alpha);
      }
    } catch {
      // ignore
    }
  }, [layerOpacity, isMapLoaded]);

  // Update Brightness Temperature Channel Expression
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const m = map.current;
    try {
      if (m.getLayer("mode-d-brightness-circles")) {
        const propName = brightnessChannel === "ch1" ? "brightness_channel_1" : "brightness_channel_2";
        m.setPaintProperty("mode-d-brightness-circles", "circle-color", [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", propName], ["get", "brightness_kelvin"], 300],
          brightnessChannel === "ch1" ? 300 : 270, "#1E1B4B",
          brightnessChannel === "ch1" ? 320 : 285, "#6D28D9",
          brightnessChannel === "ch1" ? 340 : 300, "#BE123C",
          brightnessChannel === "ch1" ? 355 : 315, "#EA580C",
          brightnessChannel === "ch1" ? 370 : 330, "#FBBF24",
        ]);
      }
    } catch {
      // ignore
    }
  }, [brightnessChannel, isMapLoaded]);

  // Fit bounds when bbox changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    try {
      map.current.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 40, duration: 800, maxZoom: 12 }
      );
    } catch {
      // ignore
    }
  }, [bbox, isMapLoaded]);

  // Center target on selection
  useEffect(() => {
    if (!map.current || !isMapLoaded || !centerTarget) return;
    try {
      map.current.flyTo({
        center: centerTarget,
        zoom: 12,
        duration: 900,
      });
    } catch {
      // ignore
    }
  }, [centerTarget, isMapLoaded]);

  // Concentric Halo Marker for Selected Observation
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    let targetCoords: [number, number] | null = null;
    if (selectedObservation?.longitude != null && selectedObservation?.latitude != null) {
      targetCoords = [selectedObservation.longitude, selectedObservation.latitude];
    } else if (centerTarget) {
      targetCoords = centerTarget;
    } else if (filteredFeatures && filteredFeatures.length > 0) {
      const first = filteredFeatures[0];
      if (first.geometry && first.geometry.coordinates) {
        targetCoords = [first.geometry.coordinates[0], first.geometry.coordinates[1]];
      }
    }

    if (targetCoords) {
      if (!haloMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "fire-concentric-halo-marker pointer-events-none";
        el.style.width = "64px";
        el.style.height = "64px";
        el.style.position = "relative";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.zIndex = "40";
        el.innerHTML = `
          <div style="position: absolute; width: 64px; height: 64px; border-radius: 50%; background: radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, rgba(249, 115, 22, 0.35) 50%, rgba(0, 0, 0, 0) 75%); animation: pulse 2.2s infinite ease-in-out;"></div>
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 3.5px solid #FF5500; background: radial-gradient(circle, rgba(255, 68, 0, 0.85) 0%, rgba(220, 38, 38, 0.5) 100%); box-shadow: 0 0 25px #FF3B00;"></div>
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #FFFFFF; background: #FF3B00; box-shadow: 0 0 14px #FF5500;"></div>
          <div style="position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 0 8px #FFFFFF;"></div>
        `;
        haloMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(targetCoords)
          .addTo(map.current);
      } else {
        haloMarkerRef.current.setLngLat(targetCoords);
      }
    }
  }, [selectedObservation, centerTarget, filteredFeatures, isMapLoaded]);

  // Basemap switch
  const setBasemap = (type: "satellite" | "dark" | "streets") => {
    if (!map.current) return;
    setBasemapType(type);
    setShowBasemapMenu(false);
    const nextStyle =
      type === "satellite"
        ? SATELLITE_RASTER_STYLE
        : type === "streets"
        ? VECTOR_STREETS_STYLE
        : VECTOR_DARK_STYLE;

    map.current.setStyle(nextStyle);
    map.current.once("style.load", () => {
      if (map.current) {
        setupLayers(map.current);
      }
    });
  };

  const handleRecenter = () => {
    if (!map.current) return;
    map.current.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 40, duration: 800 }
    );
  };

  const handleFitToDetections = useCallback(() => {
    if (!map.current || !filteredFeatures || filteredFeatures.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    filteredFeatures.forEach((f) => {
      const coords = f.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        bounds.extend([coords[0], coords[1]]);
      }
    });
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 10,
        duration: 900,
      });
    }
  }, [filteredFeatures]);

  // Handle map canvas resize on fullscreen toggle
  useEffect(() => {
    if (map.current) {
      const timer = setTimeout(() => {
        map.current?.resize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  // Keyboard shortcut: Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Timeline date controls
  const handleTimelineStep = (direction: -1 | 1) => {
    if (availableDates.length === 0) return;
    if (!timelineDate || timelineDate === "ALL") {
      setTimelineDate(direction === 1 ? availableDates[0] : availableDates[availableDates.length - 1]);
      return;
    }
    const idx = availableDates.indexOf(timelineDate);
    if (idx === -1) {
      setTimelineDate(availableDates[0]);
      return;
    }
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < availableDates.length) {
      setTimelineDate(availableDates[nextIdx]);
    }
  };

  const currentAoi = presetAois.find((a) => a.id === selectedAoiId);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#1E2433] bg-[#0D1017] shadow-lg flex flex-col transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none"
          : "h-[390px] lg:h-[410px]"
      }`}
    >
      {/* 1. Map Top Mode Bar & Global Controls */}
      <div className="min-h-12 px-3 py-1 bg-[#0D1017] border-b border-[#1E2433] flex flex-wrap items-center justify-between gap-2 shrink-0 z-20">
        {/* Left: 5 Mandatory Mode Buttons */}
        <div className="flex items-center gap-1 bg-[#121622] p-1 rounded-xl border border-[#23293A]">
          <button
            data-view-btn="points"
            onClick={() => switchViewMode("points")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "points"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
            title="Mode A: Active-fire detection pixels"
          >
            <MapIcon className={`w-3.5 h-3.5 ${viewMode === "points" ? "text-black" : "text-[#A855F7]"}`} />
            <span>Points</span>
          </button>

          <button
            data-view-btn="density"
            onClick={() => switchViewMode("density")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "density"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
            title="Mode B: Spatial smoothing of detection counts (Weight = 1)"
          >
            <Activity className={`w-3.5 h-3.5 ${viewMode === "density" ? "text-black" : "text-[#38BDF8]"}`} />
            <span>Density</span>
          </button>

          <button
            data-view-btn="frp"
            onClick={() => switchViewMode("frp")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "frp"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
            title="Mode C: Relative FRP-weighted intensity surface"
          >
            <Flame className={`w-3.5 h-3.5 ${viewMode === "frp" ? "text-black" : "text-[#F97316]"}`} />
            <span>FRP Intensity</span>
          </button>

          <button
            data-view-btn="brightness"
            onClick={() => switchViewMode("brightness")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "brightness"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
            title="Mode D: Sensor-channel brightness temperature (Kelvin)"
          >
            <Thermometer className={`w-3.5 h-3.5 ${viewMode === "brightness" ? "text-black" : "text-[#EC4899]"}`} />
            <span>Radiometry</span>
          </button>

          <button
            data-view-btn="grid"
            onClick={() => switchViewMode("grid")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "grid"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
            title="Mode E: 1 km Equal-Area Grid summary"
          >
            <LayoutGrid className={`w-3.5 h-3.5 ${viewMode === "grid" ? "text-black" : "text-[#10B981]"}`} />
            <span>1 km Grid</span>
          </button>

          <button
            data-view-btn="fire_types"
            onClick={() => switchViewMode("fire_types")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "fire_types"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
            title="Mode F: AI Fire Type Identification & Context Classification"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${viewMode === "fire_types" ? "text-black" : "text-[#EF4444]"}`} />
            <span>Fire Types</span>
          </button>
        </div>

        {/* Center / Mode-Specific Param Controls */}
        <div className="flex items-center gap-2">
          {/* Mode A: Size by FRP Toggle */}
          {viewMode === "points" && (
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121622] border border-[#23293A] text-[11px] font-medium text-[#E2E8F0] cursor-pointer hover:border-[#F59E0B]">
              <input
                type="checkbox"
                checked={sizeByFrp}
                onChange={(e) => setSizeByFrp(e.target.checked)}
                className="rounded border-[#334155] bg-[#1E2433] text-[#F59E0B] focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-[#FBBF24]">Size by FRP</span>
            </label>
          )}

          {/* Mode C: Sensor Choice for FRP (MODIS / VIIRS / ALL) */}
          {viewMode === "frp" && (
            <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-lg border border-[#23293A] text-[10px]">
              {(["ALL", "MODIS", "VIIRS"] as FrpSensorFilter[]).map((sf) => (
                <button
                  key={sf}
                  onClick={() => setFrpSensorFilter(sf)}
                  className={`px-2 py-0.5 rounded font-mono ${
                    frpSensorFilter === sf
                      ? "bg-[#F97316] text-black font-bold"
                      : "text-[#8E96A5] hover:text-white"
                  }`}
                >
                  {sf}
                </button>
              ))}
            </div>
          )}

          {/* Mode D: Channel Selector (Ch 1 MWIR vs Ch 2 LWIR) */}
          {viewMode === "brightness" && (
            <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-lg border border-[#23293A] text-[10px]">
              <button
                onClick={() => setBrightnessChannel("ch1")}
                className={`px-2 py-0.5 rounded font-mono ${
                  brightnessChannel === "ch1"
                    ? "bg-[#EC4899] text-white font-bold"
                    : "text-[#8E96A5] hover:text-white"
                }`}
                title="Channel 1 / Band I-4: ~3.74–3.96 μm MWIR"
              >
                MWIR (3.9 μm)
              </button>
              <button
                onClick={() => setBrightnessChannel("ch2")}
                className={`px-2 py-0.5 rounded font-mono ${
                  brightnessChannel === "ch2"
                    ? "bg-[#38BDF8] text-black font-bold"
                    : "text-[#8E96A5] hover:text-white"
                }`}
                title="Channel 2 / Band I-5: ~11.03–11.45 μm LWIR"
              >
                LWIR (11.2 μm)
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Layers, Basemap, Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Layers Popover Button */}
          <div className="relative">
            <button
              onClick={() => setIsLayersPanelExpanded(!isLayersPanelExpanded)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Layers</span>
              <ChevronDown className={`w-3 h-3 text-[#7B8596] transition-transform ${isLayersPanelExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Basemap Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors"
            >
              <MapIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="capitalize">{basemapType}</span>
              <ChevronDown className="w-3 h-3 text-[#7B8596]" />
            </button>

            {showBasemapMenu && (
              <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-[#0D1017] border border-[#23293A] rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 text-xs animate-in fade-in">
                {(["satellite", "dark", "streets"] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBasemap(b)}
                    className={`w-full text-left px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      basemapType === b ? "bg-[#1E2433] text-[#F59E0B] font-bold" : "text-[#A4AFBF] hover:text-white"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-[#E2E8F0] transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-[#F5B32F]" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Floating Left: Zoom and Recenter Controls */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <div className="flex flex-col bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] rounded-xl overflow-hidden shadow-md">
            <button
              onClick={() => map.current?.zoomIn()}
              className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#181D2C] font-bold text-sm transition-colors"
              title="Zoom in"
            >
              +
            </button>
            <div className="h-px bg-[#23293A]" />
            <button
              onClick={() => map.current?.zoomOut()}
              className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#181D2C] font-bold text-sm transition-colors"
              title="Zoom out"
            >
              −
            </button>
          </div>

          <button
            onClick={handleRecenter}
            className="w-7 h-7 rounded-xl bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] flex items-center justify-center text-[#F5B32F] hover:bg-[#181D2C] transition-colors shadow-md"
            title="Recenter India / AOI"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFitToDetections}
            className="w-7 h-7 rounded-xl bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] flex items-center justify-center text-[#38BDF8] hover:bg-[#181D2C] transition-colors shadow-md"
            title="Fit map view to active detections"
          >
            <Focus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Dynamic Legend Adapted to Active Mode */}
        <div className="absolute bottom-14 left-3 z-10 max-w-sm rounded-xl bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] p-2 text-xs text-white shadow-lg pointer-events-auto">
          {viewMode === "points" && (
            <div className="flex flex-wrap items-center gap-3 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5 text-[#C084FC]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_6px_#A855F7]" />
                <span>MODIS</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
                <span>VIIRS</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#34D399]">
                <span className="w-3 h-3 rounded-full border-2 border-[#10B981] bg-transparent" />
                <span>Matched Halo</span>
              </span>
              {sizeByFrp && (
                <span className="text-[10px] font-mono text-[#F59E0B]">
                  • Sized by FRP (MW)
                </span>
              )}
            </div>
          )}

          {viewMode === "density" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-[#38BDF8]">Low Density</span>
                <span className="text-[#EF4444]">High Density</span>
              </div>
              <div className="h-2 w-48 rounded bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-red-500 shadow-sm" />
              <div className="flex items-center justify-between text-[9px] text-[#94A3B8] font-mono">
                <span>Weight = 1.0 / record</span>
                <span>{filteredFeatures.length} detections</span>
              </div>
              <span className="text-[8.5px] text-[#64748B] italic leading-tight">
                Density smoothing of detection counts, not ground flame temperature.
              </span>
            </div>
          )}

          {viewMode === "frp" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-[#C084FC]">0.1 MW</span>
                <span className="text-[#F97316]">50 MW</span>
                <span className="text-[#FF2200]">500+ MW</span>
              </div>
              <div className="h-2 w-48 rounded bg-gradient-to-r from-purple-500 via-cyan-400 via-amber-400 via-orange-500 to-red-600 shadow-sm" />
              <div className="flex items-center justify-between text-[9px] text-[#94A3B8] font-mono">
                <span>Relative FRP Index (ln[1+FRP])</span>
                <span>{frpSensorFilter}</span>
              </div>
              {excludedFrpCount > 0 && (
                <span className="text-[8.5px] text-[#F59E0B] font-mono">
                  {excludedFrpCount} records with null/0 FRP excluded from weighting
                </span>
              )}
            </div>
          )}

          {viewMode === "brightness" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-[#818CF8]">
                  {brightnessChannel === "ch1" ? "300 K (27°C)" : "270 K (-3°C)"}
                </span>
                <span className="text-[#FBBF24]">
                  {brightnessChannel === "ch1" ? "370+ K (97°C)" : "330+ K (57°C)"}
                </span>
              </div>
              <div className="h-2 w-48 rounded bg-gradient-to-r from-indigo-950 via-purple-700 via-rose-700 via-orange-600 to-amber-400 shadow-sm" />
              <span className="text-[8.5px] text-[#94A3B8] leading-tight">
                {brightnessChannel === "ch1"
                  ? "MWIR ~3.74–3.96 μm Wien displacement channel."
                  : "LWIR ~11.03–11.45 μm ambient earth surface channel."}{" "}
                Not flame temperature.
              </span>
            </div>
          )}

          {viewMode === "grid" && (
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-[#F59E0B] font-bold">1 km Equal-Area Grid:</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#F59E0B] rounded-xs opacity-75" />
                <span>1-2</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#F97316] rounded-xs opacity-75" />
                <span>3-5</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-xs opacity-75" />
                <span>6+ fires</span>
              </span>
            </div>
          )}

          {viewMode === "fire_types" && (
            <div className="flex flex-col gap-1.5 font-semibold text-[11px]">
              <div className="text-[10px] font-bold text-white flex items-center justify-between">
                <span>AI Fire Type & Context Inference</span>
                <span className="text-[#38BDF8] font-mono text-[9px]">LULC + Radiometry</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-[10px]">
                <span className="flex items-center gap-1 text-[#EF4444]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_5px_#EF4444]" />
                  <span>Forest Active Fire</span>
                </span>
                <span className="flex items-center gap-1 text-[#F59E0B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_5px_#F59E0B]" />
                  <span>Agri Stubble</span>
                </span>
                <span className="flex items-center gap-1 text-[#A855F7]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_5px_#A855F7]" />
                  <span>Industrial / Flare</span>
                </span>
                <span className="flex items-center gap-1 text-[#06B6D4]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shadow-[0_0_5px_#06B6D4]" />
                  <span>Offshore</span>
                </span>
                <span className="flex items-center gap-1 text-[#94A3B8]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
                  <span>Thermal Anomaly</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom-Right: NASA Attribution & Record Count */}
        <div className="absolute bottom-14 right-3 z-10 px-2.5 py-1 rounded-xl bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] text-[10px] font-mono text-[#CBD5E1] flex items-center gap-2 shadow-lg">
          <span className="text-[#F59E0B] font-bold">{filteredFeatures.length}</span>
          <span className="text-[#64748B]">/</span>
          <span>{geoJsonData?.features?.length || 0} Records</span>
          <span className="text-[#64748B]">|</span>
          <span className="tracking-wider text-white font-bold">NASA FIRMS</span>
        </div>

        {/* 3. Docked Daily Timeline Playback Controller */}
        <div className="absolute bottom-0 inset-x-0 h-11 bg-[#090C12]/95 backdrop-blur-md border-t border-[#1E2433] px-3 flex items-center justify-between z-20">
          {/* Play/Pause & Step Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-black flex items-center justify-center font-bold shadow-md transition-colors"
              title={isPlaying ? "Pause playback" : "Play daily animation"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => handleTimelineStep(-1)}
              disabled={availableDates.length <= 1}
              className="p-1 rounded-lg bg-[#141924] hover:bg-[#1E2536] text-[#A4AFBF] hover:text-white border border-[#23293A] disabled:opacity-40 transition-colors"
              title="Previous Day"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleTimelineStep(1)}
              disabled={availableDates.length <= 1}
              className="p-1 rounded-lg bg-[#141924] hover:bg-[#1E2536] text-[#A4AFBF] hover:text-white border border-[#23293A] disabled:opacity-40 transition-colors"
              title="Next Day"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTimelineDate("ALL")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors ${
                !timelineDate || timelineDate === "ALL"
                  ? "bg-[#1E2433] text-[#F59E0B] border-[#F59E0B]/50 font-bold"
                  : "bg-[#121622] text-[#8E96A5] border-[#23293A] hover:text-white"
              }`}
              title="Show entire selected date range"
            >
              ALL
            </button>
          </div>

          {/* Date Slider & Scrub Bar */}
          <div className="flex-1 mx-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <span className="text-[11px] font-mono text-white font-bold shrink-0 min-w-[76px]">
              {timelineDate && timelineDate !== "ALL" ? timelineDate : "All Dates"}
            </span>

            {availableDates.length > 0 ? (
              <input
                type="range"
                min={0}
                max={availableDates.length - 1}
                value={
                  timelineDate && timelineDate !== "ALL"
                    ? Math.max(0, availableDates.indexOf(timelineDate))
                    : availableDates.length - 1
                }
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setTimelineDate(availableDates[idx] || "ALL");
                }}
                className="w-full h-1.5 bg-[#1E2433] rounded-lg appearance-none cursor-pointer accent-[#F97316]"
              />
            ) : (
              <div className="w-full h-1.5 bg-[#1E2433] rounded-lg" />
            )}
          </div>

          {/* Speed Selector (1x, 2x, 5x) */}
          <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-lg border border-[#23293A] text-[10px] font-mono">
            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  playbackSpeed === spd
                    ? "bg-[#F59E0B] text-black font-bold"
                    : "text-[#8E96A5] hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Layers Panel when Expanded */}
        {isLayersPanelExpanded && (
          <div className="absolute top-3 right-3 z-30 w-72 bg-[#0D1017]/95 backdrop-blur-md border border-[#23293A] rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#23293A]">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#F59E0B]" />
                Map Layers & Context
              </span>
              <button
                onClick={() => setIsLayersPanelExpanded(false)}
                className="text-[#8E96A5] hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Sensors (Mode A)
              </span>

              <label className="flex items-center justify-between text-[#B1B7C1] hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                  <span>MODIS Footprints (1 km)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showModis}
                  onChange={(e) => setShowModis(e.target.checked)}
                  className="rounded border-[#2A3039] bg-[#171A20] text-[#A855F7] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-[#B1B7C1] hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  <span>VIIRS Hotspots (375 m)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showViirs}
                  onChange={(e) => setShowViirs(e.target.checked)}
                  className="rounded border-[#2A3039] bg-[#171A20] text-[#38BDF8] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-[#B1B7C1] hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Candidate Cross-Sensor Matches</span>
                </span>
                <input
                  type="checkbox"
                  checked={showMatched}
                  onChange={(e) => setShowMatched(e.target.checked)}
                  className="rounded border-[#2A3039] bg-[#171A20] text-[#10B981] focus:ring-0"
                />
              </label>

              <div className="h-px bg-[#23293A] my-1" />

              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Administrative & Context Overlays
              </span>

              <label className="flex items-center justify-between text-[#B1B7C1] hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span>Indian State Boundaries</span>
                </span>
                <input
                  type="checkbox"
                  checked={showStateBorders}
                  onChange={(e) => setShowStateBorders(e.target.checked)}
                  className="rounded border-[#2A3039] bg-[#171A20] text-[#F59E0B] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-[#B1B7C1] hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full border border-[#EF4444] bg-[#EF4444]/30" />
                  <span>FSI Large Fire Alerts</span>
                </span>
                <input
                  type="checkbox"
                  checked={showFsiCue}
                  onChange={(e) => setShowFsiCue(e.target.checked)}
                  className="rounded border-[#2A3039] bg-[#171A20] text-[#EF4444] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-[#B1B7C1] hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full border border-[#10B981] bg-[#10B981]/30" />
                  <span>Bhuvan Agri Fire Cues</span>
                </span>
                <input
                  type="checkbox"
                  checked={showBhuvanCue}
                  onChange={(e) => setShowBhuvanCue(e.target.checked)}
                  className="rounded border-[#2A3039] bg-[#171A20] text-[#10B981] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-[#B1B7C1] hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                  <span>NASA FIRMS GIBS WMS</span>
                </span>
                <input
                  type="checkbox"
                  checked={showFirmsWms}
                  onChange={(e) => setShowFirmsWms(e.target.checked)}
                  className="rounded border-[#2A3039] bg-[#171A20] text-[#F43F5E] focus:ring-0"
                />
              </label>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#8E96A5] text-[11px]">Layer Opacity</span>
                <span className="text-white font-mono text-[11px]">{layerOpacity}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1E2433] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
              />
            </div>
          </div>
        )}

        {/* Live Cursor Coordinate HUD Readout */}
        {cursorCoords && (
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-[#101216]/90 backdrop-blur border border-[#2A3039] text-[10px] font-mono tabular-nums text-[#B1B7C1] flex items-center gap-2 pointer-events-none shadow-sm">
            <span className="text-[#F4F5F7]">{Math.abs(cursorCoords.lat).toFixed(4)}° {cursorCoords.lat >= 0 ? "N" : "S"}</span>
            <span className="text-[#858D99]">&bull;</span>
            <span className="text-[#F4F5F7]">{Math.abs(cursorCoords.lng).toFixed(4)}° {cursorCoords.lng >= 0 ? "E" : "W"}</span>
            <span className="text-[#858D99]">&bull;</span>
            <span className="text-[#F5B32F]">z{cursorCoords.zoom.toFixed(1)}</span>
          </div>
        )}

        {/* Interactive Hotspot Feature Hover Tooltip Card */}
        {hoveredFeature && (
          <div
            className="absolute z-30 pointer-events-none bg-[#101216]/95 backdrop-blur-md border border-[#2A3039] rounded-lg p-2.5 shadow-xl text-xs flex flex-col gap-1 min-w-[210px]"
            style={{
              left: Math.min(Math.max(hoveredFeature.x + 12, 10), (mapContainer.current?.clientWidth || 600) - 230),
              top: Math.min(Math.max(hoveredFeature.y - 10, 10), (mapContainer.current?.clientHeight || 500) - 150),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#2A3039] pb-1">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  hoveredFeature.properties.sensor === "VIIRS"
                    ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40"
                    : "bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/40"
                }`}
              >
                {hoveredFeature.properties.sensor} ({hoveredFeature.properties.platform})
              </span>
              <span className="font-mono text-[10px] text-[#B1B7C1] capitalize">
                {hoveredFeature.properties.confidence_category}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#B1B7C1]">Fire Radiative Power:</span>
              <span className="font-mono font-semibold text-[#F5B32F]">
                {hoveredFeature.properties.frp_mw != null ? `${hoveredFeature.properties.frp_mw.toFixed(1)} MW` : "N/A"}
              </span>
            </div>
            {hoveredFeature.properties.brightness_channel_1 != null && (
              <div className="flex items-center justify-between text-[10px] font-mono text-[#E2E8F0]">
                <span className="text-[#8E96A5]">MWIR Radiometry:</span>
                <span className="text-[#FBBF24]">
                  {Number(hoveredFeature.properties.brightness_channel_1).toFixed(1)} K
                  {hoveredFeature.properties.brightness_channel_2 != null && (
                    <span className="text-[#34D399] ml-1.5 font-bold">
                      (+{(Number(hoveredFeature.properties.brightness_channel_1) - Number(hoveredFeature.properties.brightness_channel_2)).toFixed(1)} K)
                    </span>
                  )}
                </span>
              </div>
            )}
            {hoveredFeature.properties.context_class && (
              <div className="flex items-center justify-between text-[10px] font-medium border-t border-[#2A3039] pt-1">
                <span className="text-[#8E96A5]">Anomaly Type:</span>
                <span className="text-[#F59E0B]">
                  {hoveredFeature.properties.fire_type_short_name || (
                    hoveredFeature.properties.context_class === "LIKELY_FOREST_CONTEXT" || hoveredFeature.properties.context_class === "FSI_SUPPORTED_FOREST_ALERT" ? "🌲 Forest Vegetation Context" :
                    hoveredFeature.properties.context_class === "LIKELY_AGRICULTURAL_CONTEXT" || hoveredFeature.properties.context_class === "BHUVAN_AGRICULTURAL_FIRE_RECORD" || hoveredFeature.properties.context_class === "SEASONAL_AGRICULTURAL_RESIDUE_HEURISTIC" ? "🌾 Crop Residue" :
                    hoveredFeature.properties.context_class === "OTHER_STATIC_THERMAL_SOURCE" ? "🏭 Static Industrial Flare" :
                    hoveredFeature.properties.context_class === "VOLCANIC" ? "🌋 Volcanic" :
                    hoveredFeature.properties.context_class === "OFFSHORE" ? "🌊 Offshore Marine" : "⚡ Thermal Anomaly"
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8E96A5]">
              <span>{hoveredFeature.properties.india_district ? `${hoveredFeature.properties.india_district}, ` : ""}{hoveredFeature.properties.india_state || "India"}</span>
              <span>{hoveredFeature.properties.acq_datetime_utc ? hoveredFeature.properties.acq_datetime_utc.slice(0, 16).replace("T", " ") : ""}</span>
            </div>
          </div>
        )}

        {/* 1 km Equal-Area Grid Cell Hover Tooltip Card */}
        {hoveredGridCell && viewMode === "grid" && (
          <div
            className="absolute z-30 pointer-events-none bg-[#101216]/95 backdrop-blur-md border border-[#F59E0B]/50 rounded-lg p-2.5 shadow-xl text-xs flex flex-col gap-1 min-w-[200px]"
            style={{
              left: Math.min(Math.max(hoveredGridCell.x + 12, 10), (mapContainer.current?.clientWidth || 600) - 230),
              top: Math.min(Math.max(hoveredGridCell.y - 10, 10), (mapContainer.current?.clientHeight || 500) - 150),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#2A3039] pb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                1 km Equal-Area Grid Cell
              </span>
              <span className="font-mono text-[10px] text-[#B1B7C1]">
                {hoveredGridCell.properties.india_state}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#B1B7C1]">Detections in Cell:</span>
              <span className="font-mono font-bold text-white">
                {hoveredGridCell.properties.count}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#B1B7C1]">Peak Radiative Power:</span>
              <span className="font-mono font-semibold text-[#F5B32F]">
                {hoveredGridCell.properties.max_frp != null ? `${Number(hoveredGridCell.properties.max_frp).toFixed(1)} MW` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
              <span>Sensors:</span>
              <span className="text-[#38BDF8]">{hoveredGridCell.properties.sensors}</span>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#08090B]/50 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101216] border border-[#2A3039] text-[#F4F5F7] text-xs font-medium shadow-md">
              <span className="w-3 h-3 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
              <span>Harmonizing active fire observations...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
