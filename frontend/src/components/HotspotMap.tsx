"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Table,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  Satellite as SatelliteIcon,
  Compass,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { GeoJSONFeatureCollection, GeoJSONPointFeature, PresetAoi } from "@/types";

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
}

const VECTOR_DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

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

export const HotspotMap: React.FC<HotspotMapProps> = ({
  geoJsonData,
  bbox,
  onSelectObservation,
  isLoading = false,
  presetAois = [],
  selectedAoiId,
  onSelectAoi,
  startDate = "2024-08-01",
  endDate = "2024-08-20",
  centerTarget = null,
  selectedObservationId = null,
  selectedObservation = null,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const haloMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [basemapType, setBasemapType] = useState<"satellite" | "vector">("satellite");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<{
    x: number;
    y: number;
    properties: GeoJSONPointFeature["properties"];
  } | null>(null);

  const [isLayersPanelExpanded, setIsLayersPanelExpanded] = useState(false);
  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showMatched, setShowMatched] = useState(true);
  const [showModisOnly, setShowModisOnly] = useState(true);
  const [showViirsOnly, setShowViirsOnly] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [layerOpacity, setLayerOpacity] = useState(85);
  const [displayInterval, setDisplayInterval] = useState<"all" | "day" | "week" | "month">("all");
  const [activeViewMode, setActiveViewMode] = useState<"map" | "heatmap" | "grid">("map");
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [showAccessibleTable, setShowAccessibleTable] = useState(false);

  const latestDataRef = useRef(geoJsonData);
  latestDataRef.current = geoJsonData;

  const setupLayers = useCallback((instance: maplibregl.Map) => {
    const currentData = latestDataRef.current || {
      type: "FeatureCollection",
      features: [],
    };

    if (instance.getSource("hotspots")) return;

    instance.addSource("hotspots", {
      type: "geojson",
      data: currentData,
      cluster: false,
    });

    // Cluster circles using restrained yellow-to-orange-to-red scale
    instance.addLayer({
      id: "clusters",
      type: "circle",
      source: "hotspots",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#FFD166",
          5,
          "#F5B32F",
          15,
          "#F47A24",
          30,
          "#E5484D",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          15,
          5,
          20,
          15,
          26,
        ],
        "circle-opacity": layerOpacity / 100,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
      },
    });

    try {
      instance.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "hotspots",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 11,
        },
        paint: {
          "text-color": "#090B0F",
        },
      });
    } catch {
      // glyphs fallback
    }

    // MODIS Footprint Layer (1.0 km nadir) - Violet
    instance.addLayer({
      id: "modis-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "sensor", "MODIS"]] as any,
      paint: {
        "circle-radius": 10,
        "circle-color": "#A78BFA",
        "circle-opacity": (layerOpacity / 100) * 0.7,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#8B5CF6",
      },
    });

    // VIIRS Point Layer (375 m nadir) - Cyan
    instance.addLayer({
      id: "viirs-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "sensor", "VIIRS"]] as any,
      paint: {
        "circle-radius": 5,
        "circle-color": "#38BDF8",
        "circle-opacity": layerOpacity / 100,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#0284C7",
      },
    });

    // Candidate Match Halo Layer - Green
    instance.addLayer({
      id: "matched-halo-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "classification", "matched"]] as any,
      paint: {
        "circle-radius": 13,
        "circle-color": "transparent",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#34D399",
        "circle-stroke-opacity": layerOpacity / 100,
      },
    });

    // Active Fire Glowing Red/Orange Concentric Halo Ring
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

    // Selected Observation Distinct Inner Halo Ring
    instance.addLayer({
      id: "selected-observation-halo",
      type: "circle",
      source: "hotspots",
      filter: ["==", "observation_id", ""],
      paint: {
        "circle-radius": 13,
        "circle-color": "#FFAA00",
        "circle-opacity": 0.45,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-opacity": 0.95,
      },
    });

    instance.on("click", "clusters", async (e) => {
      const feats = instance.queryRenderedFeatures(e.point, { layers: ["clusters"] });
      const clusterId = feats?.[0]?.properties?.cluster_id;
      const src = instance.getSource("hotspots") as maplibregl.GeoJSONSource;
      if (src && clusterId !== undefined) {
        try {
          const zoom = await src.getClusterExpansionZoom(clusterId);
          instance.easeTo({
            center: (feats[0].geometry as any).coordinates,
            zoom: zoom + 0.5,
          });
        } catch {
          instance.zoomIn();
        }
      }
    });

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

    const setPointer = () => {
      if (instance) instance.getCanvas().style.cursor = "pointer";
    };
    const resetPointer = () => {
      if (instance) instance.getCanvas().style.cursor = "";
    };

    const handleFeatureHover = (e: any) => {
      if (instance) instance.getCanvas().style.cursor = "pointer";
      if (e.features && e.features.length > 0) {
        setHoveredFeature({
          x: e.point.x,
          y: e.point.y,
          properties: e.features[0].properties,
        });
      }
    };

    const handleFeatureLeave = () => {
      if (instance) instance.getCanvas().style.cursor = "";
      setHoveredFeature(null);
    };

    instance.on("mouseenter", "clusters", setPointer);
    instance.on("mouseleave", "clusters", resetPointer);

    instance.on("mousemove", "modis-layer", handleFeatureHover);
    instance.on("mouseleave", "modis-layer", handleFeatureLeave);

    instance.on("mousemove", "viirs-layer", handleFeatureHover);
    instance.on("mouseleave", "viirs-layer", handleFeatureLeave);
  }, [layerOpacity, onSelectObservation]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      const centerLon = (bbox[0] + bbox[2]) / 2.0;
      const centerLat = (bbox[1] + bbox[3]) / 2.0;

      const currentStyle =
        basemapType === "satellite" ? SATELLITE_RASTER_STYLE : VECTOR_DARK_STYLE;

      const instance = new maplibregl.Map({
        container: mapContainer.current,
        style: currentStyle,
        center: [centerLon, centerLat],
        zoom: 9.5,
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
    } catch (err) {
      setMapError("Map initialization failed. Displaying fallback view.");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [basemapType, bbox, setupLayers]);

  useEffect(() => {
    if (map.current) {
      const timer = setTimeout(() => {
        map.current?.resize();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const src = map.current.getSource("hotspots") as maplibregl.GeoJSONSource;
    if (src && geoJsonData) {
      src.setData(geoJsonData);
    }
  }, [geoJsonData, isMapLoaded]);

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

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    try {
      if (map.current.getLayer("modis-layer")) {
        map.current.setLayoutProperty(
          "modis-layer",
          "visibility",
          showModis ? "visible" : "none"
        );
      }
      if (map.current.getLayer("viirs-layer")) {
        map.current.setLayoutProperty(
          "viirs-layer",
          "visibility",
          showViirs ? "visible" : "none"
        );
      }
      if (map.current.getLayer("matched-halo-layer")) {
        map.current.setLayoutProperty(
          "matched-halo-layer",
          "visibility",
          showMatched ? "visible" : "none"
        );
      }
    } catch {
      // ignore
    }
  }, [showModis, showViirs, showMatched, isMapLoaded]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    let targetCoords: [number, number] | null = null;
    if (selectedObservation?.longitude != null && selectedObservation?.latitude != null) {
      targetCoords = [selectedObservation.longitude, selectedObservation.latitude];
    } else if (centerTarget) {
      targetCoords = centerTarget;
    } else if (geoJsonData?.features && geoJsonData.features.length > 0) {
      const first = geoJsonData.features[0];
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
  }, [selectedObservation, centerTarget, geoJsonData, isMapLoaded]);

  const toggleBasemap = () => {
    if (!map.current) return;
    const nextType = basemapType === "satellite" ? "vector" : "satellite";
    setBasemapType(nextType);
    const nextStyle =
      nextType === "satellite" ? SATELLITE_RASTER_STYLE : VECTOR_DARK_STYLE;

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

  const currentAoi = presetAois.find((a) => a.id === selectedAoiId);
  const aoiDisplayName = currentAoi ? currentAoi.name.split("(")[0].trim() : "Regional AOI";

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#1E2433] bg-[#0D1017] shadow-lg flex flex-col transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none"
          : "h-[295px]"
      }`}
    >
      {/* 1. Map Card Top Toolbar */}
      <div className="h-12 px-3 sm:px-4 bg-[#0D1017] border-b border-[#1E2433] flex items-center justify-between shrink-0 z-20">
        {/* Left Segmented View Tabs */}
        <div className="flex items-center gap-1 bg-[#121622] p-1 rounded-xl border border-[#23293A]">
          <button
            onClick={() => setActiveViewMode("map")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeViewMode === "map"
                ? "bg-[#181E2E] text-[#F97316] border border-[#F97316]/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Map View</span>
          </button>
          <button
            onClick={() => setActiveViewMode("heatmap")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeViewMode === "heatmap"
                ? "bg-[#181E2E] text-[#F97316] border border-[#F97316]/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
          <button
            onClick={() => setActiveViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeViewMode === "grid"
                ? "bg-[#181E2E] text-[#F97316] border border-[#F97316]/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                : "text-[#8E96A5] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grid View</span>
          </button>
        </div>

        {/* Right Actions: Layers, Basemap, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Layers Popover Button */}
          <div className="relative">
            <button
              onClick={() => setIsLayersPanelExpanded(!isLayersPanelExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors"
            >
              <span>Layers</span>
              <ChevronDown className={`w-3 h-3 text-[#7B8596] transition-transform ${isLayersPanelExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Basemap Toggle Button */}
          <button
            onClick={toggleBasemap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-xs font-medium text-[#E2E8F0] transition-colors"
          >
            <span>Basemap</span>
            <ChevronDown className="w-3 h-3 text-[#7B8596]" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-[#121622] hover:bg-[#181D2C] border border-[#23293A] text-[#E2E8F0] transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-[#F5B32F]" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Container Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Floating Left: Zoom and Recenter Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
          <div className="flex flex-col bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] rounded-xl overflow-hidden shadow-md">
            <button
              onClick={() => map.current?.zoomIn()}
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#181D2C] font-bold text-base transition-colors"
              title="Zoom in"
            >
              +
            </button>
            <div className="h-px bg-[#23293A]" />
            <button
              onClick={() => map.current?.zoomOut()}
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#181D2C] font-bold text-base transition-colors"
              title="Zoom out"
            >
              −
            </button>
          </div>

          <button
            onClick={handleRecenter}
            className="w-8 h-8 rounded-xl bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] flex items-center justify-center text-[#F5B32F] hover:bg-[#181D2C] transition-colors shadow-md"
            title="Recenter Area of Interest"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Bottom: Horizontal Legend Strip */}
        <div className="absolute bottom-3.5 left-4 z-10 flex flex-wrap items-center gap-4 px-4 py-2 rounded-xl bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] text-xs font-semibold text-white shadow-lg pointer-events-auto">
          <span className="flex items-center gap-1.5 text-[#C084FC]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_6px_#A855F7]" />
            <span>MODIS</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#38BDF8]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
            <span>VIIRS</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#FBBF24]">
            <span className="w-2.5 h-2.5 rotate-45 bg-[#F5B32F] rounded-xs shadow-[0_0_6px_#F5B32F]" />
            <span>MODIS Only</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#F87171]">
            <span className="w-2.5 h-2.5 rotate-45 bg-[#EF4444] rounded-xs shadow-[0_0_6px_#EF4444]" />
            <span>VIIRS Only</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#34D399]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
            <span>Matched</span>
          </span>
        </div>

        {/* Floating Bottom-Right: NASA Pill Badge */}
        <div className="absolute bottom-3.5 right-4 z-10 px-3 py-1.5 rounded-xl bg-[#0D1017]/90 backdrop-blur-md border border-[#23293A] text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg">
          <span className="tracking-wider">NASA</span>
          <span className="w-3.5 h-3.5 rounded-full bg-[#1F2937] text-[9px] text-[#9CA3AF] flex items-center justify-center font-serif">i</span>
        </div>

        {/* Dropdown Layers Panel when Expanded */}
        {isLayersPanelExpanded && (
          <div className="absolute top-4 right-4 z-20 w-64 bg-[#0D1017]/95 backdrop-blur-md border border-[#23293A] rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#23293A]">
              <span className="font-semibold text-white">Map Layers</span>
              <button
                onClick={() => setIsLayersPanelExpanded(false)}
                className="text-[#8E96A5] hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center justify-between text-[#B1B7C1] hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                  <span>MODIS Footprints</span>
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
                  <span>VIIRS Detections</span>
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
                  <span>Candidate Matches</span>
                </span>
                <input
                  type="checkbox"
                  checked={showMatched}
                  onChange={(e) => setShowMatched(e.target.checked)}
                  className="rounded border-[#2A3039] bg-[#171A20] text-[#10B981] focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}

      {/* Live Cursor Coordinate & Zoom HUD Readout */}
      {cursorCoords && (
        <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-[#101216]/90 backdrop-blur border border-[#2A3039] text-[11px] font-mono tabular-nums text-[#B1B7C1] flex items-center gap-2 pointer-events-none shadow-sm">
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
          className="absolute z-30 pointer-events-none bg-[#101216]/95 backdrop-blur-md border border-[#2A3039] rounded-lg p-2.5 shadow-xl text-xs flex flex-col gap-1 min-w-[200px]"
          style={{
            left: Math.min(Math.max(hoveredFeature.x + 12, 10), (mapContainer.current?.clientWidth || 600) - 220),
            top: Math.min(Math.max(hoveredFeature.y - 10, 10), (mapContainer.current?.clientHeight || 500) - 130),
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
          <div className="flex items-center justify-between text-[10px] font-mono text-[#B1B7C1]">
            <span>{hoveredFeature.properties.acq_datetime_utc ? hoveredFeature.properties.acq_datetime_utc.replace("T", " ").replace("Z", " UTC") : ""}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#08090B]/50 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101216] border border-[#2A3039] text-[#F4F5F7] text-xs font-medium shadow-md">
            <span className="w-3 h-3 rounded-full border-2 border-[#F5B32F] border-t-transparent animate-spin" />
            <span>Harmonizing active fire observations...</span>
          </div>
        </div>
      )}
      </div>

      {/* Accessible Data Table Modal Overlay */}
      {showAccessibleTable && (
        <div className="absolute inset-4 z-30 bg-[#10141B]/95 backdrop-blur-md border border-[#28313D] rounded-xl p-4 flex flex-col shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#28313D]">
            <h4 className="text-sm font-medium text-[#F1F5F9] flex items-center gap-2">
              <Table className="w-4 h-4 text-[#F59E0B]" />
              Harmonized observations ({geoJsonData?.features?.length || 0} records)
            </h4>
            <button
              onClick={() => setShowAccessibleTable(false)}
              className="text-xs text-[#A4AFBF] hover:text-[#F1F5F9] px-2.5 py-1 rounded bg-[#151A22] border border-[#28313D]"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto mt-2">
            <table className="w-full text-left text-xs font-mono tabular-nums text-[#A4AFBF]">
              <thead className="bg-[#151A22] text-[#F1F5F9] font-sans font-medium sticky top-0 border-b border-[#28313D]">
                <tr>
                  <th className="p-2">Observation ID</th>
                  <th className="p-2">Sensor</th>
                  <th className="p-2">Platform</th>
                  <th className="p-2">Timestamp (UTC)</th>
                  <th className="p-2">FRP (MW)</th>
                  <th className="p-2">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#28313D]">
                {geoJsonData?.features.slice(0, 50).map((f) => (
                  <tr
                    key={f.properties.observation_id}
                    onClick={() => {
                      if (onSelectObservation) onSelectObservation(f.properties);
                      setShowAccessibleTable(false);
                    }}
                    className="hover:bg-[#151A22]/70 cursor-pointer text-xs"
                  >
                    <td className="p-2 truncate max-w-[120px] font-mono text-[#F1F5F9]">{f.properties.observation_id}</td>
                    <td className="p-2 font-sans">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                        f.properties.sensor === "MODIS"
                          ? "bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/40"
                          : "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40"
                      }`}>
                        {f.properties.sensor}
                      </span>
                    </td>
                    <td className="p-2 font-sans">{f.properties.platform}</td>
                    <td className="p-2 font-mono">{f.properties.acq_datetime_utc}</td>
                    <td className="p-2 text-[#F59E0B] font-mono font-medium">{f.properties.frp_mw?.toFixed(1) || "-"}</td>
                    <td className="p-2 font-sans">{f.properties.classification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
