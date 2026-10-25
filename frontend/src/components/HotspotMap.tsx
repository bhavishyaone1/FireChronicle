"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  CheckCircle2,
  Flame,
  Maximize2,
  Table,
  Crosshair,
  Sliders,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  Satellite as SatelliteIcon,
  Compass,
  Download,
  AlertCircle,
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
}

// 1. OpenFreeMap Dark style - Keyless vector tiles, zero watermarks
const VECTOR_DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

// 2. Genuine Satellite Imagery style (ESRI World Imagery) - Keyless raster tiles, zero watermarks
const SATELLITE_RASTER_STYLE: any = {
  version: 8,
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
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Basemap style toggle: "satellite" | "vector"
  const [basemapType, setBasemapType] = useState<"satellite" | "vector">("satellite");

  // Floating Layer Controls
  const [isLayersPanelExpanded, setIsLayersPanelExpanded] = useState(true);
  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showMatched, setShowMatched] = useState(true);
  const [showModisOnly, setShowModisOnly] = useState(true);
  const [showViirsOnly, setShowViirsOnly] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [layerOpacity, setLayerOpacity] = useState(70);
  const [displayInterval, setDisplayInterval] = useState<"all" | "day" | "week" | "month">("all");
  const [showAccessibleTable, setShowAccessibleTable] = useState(false);

  const latestDataRef = useRef(geoJsonData);
  latestDataRef.current = geoJsonData;

  // Add hotspot sources & layers
  const setupLayers = useCallback((instance: maplibregl.Map) => {
    const currentData = latestDataRef.current || {
      type: "FeatureCollection",
      features: [],
    };

    if (instance.getSource("hotspots")) return;

    // Source with clustering for low zoom
    instance.addSource("hotspots", {
      type: "geojson",
      data: currentData,
      cluster: true,
      clusterMaxZoom: 8,
      clusterRadius: 35,
    });

    // 1. Cluster circles (zoom < 9)
    instance.addLayer({
      id: "clusters",
      type: "circle",
      source: "hotspots",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#FB923C",
          5,
          "#F97316",
          15,
          "#EF4444",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          16,
          5,
          22,
          15,
          28,
        ],
        "circle-opacity": layerOpacity / 100,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // 2. Cluster count text
    instance.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "hotspots",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // 3. MODIS Footprint Layer (1km) - Violet (#A78BFA)
    instance.addLayer({
      id: "modis-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "sensor", "MODIS"]] as any,
      paint: {
        "circle-radius": 11,
        "circle-color": "#A78BFA",
        "circle-opacity": (layerOpacity / 100) * 0.65,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#8B5CF6",
      },
    });

    // 4. VIIRS Point Layer (375m) - Cyan (#38BDF8)
    instance.addLayer({
      id: "viirs-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "sensor", "VIIRS"]] as any,
      paint: {
        "circle-radius": 5.5,
        "circle-color": "#38BDF8",
        "circle-opacity": layerOpacity / 100,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#0284C7",
      },
    });

    // 5. Matched Cross-Sensor Halo - Emerald / White dual ring (#34D399)
    instance.addLayer({
      id: "matched-halo-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "classification", "matched"]] as any,
      paint: {
        "circle-radius": 15,
        "circle-color": "transparent",
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#34D399",
        "circle-stroke-opacity": layerOpacity / 100,
      },
    });

    // Cluster click: Zoom in
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

    // Point click: Select observation
    const handlePointClick = (e: any) => {
      if (!e.features || !e.features.length) return;
      const props = e.features[0].properties;
      if (onSelectObservation) {
        onSelectObservation(props);
      }
    };

    instance.on("click", "modis-layer", handlePointClick);
    instance.on("click", "viirs-layer", handlePointClick);

    // Hover cursor styling
    const setPointer = () => {
      if (instance) instance.getCanvas().style.cursor = "pointer";
    };
    const resetPointer = () => {
      if (instance) instance.getCanvas().style.cursor = "";
    };

    instance.on("mouseenter", "clusters", setPointer);
    instance.on("mouseleave", "clusters", resetPointer);
    instance.on("mouseenter", "modis-layer", setPointer);
    instance.on("mouseleave", "modis-layer", resetPointer);
    instance.on("mouseenter", "viirs-layer", setPointer);
    instance.on("mouseleave", "viirs-layer", resetPointer);
  }, [layerOpacity, onSelectObservation]);

  // Initialize MapLibre
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

      instance.on("error", (e) => {
        if (e && e.error && e.error.message && !e.error.message.includes("tile")) {
          setMapError("Basemap service degraded. Data layers and table remain functional.");
        }
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

  // Update GeoJSON data dynamically
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const src = map.current.getSource("hotspots") as maplibregl.GeoJSONSource;
    if (src && geoJsonData) {
      src.setData(geoJsonData);
    }
  }, [geoJsonData, isMapLoaded]);

  // Auto fitBounds on bounding box change
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

  // Layer Visibility Toggles
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

  // Switch basemap between satellite and vector
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

  // Recenter to AOI
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

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-[#1E293B] shadow-2xl bg-black">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Left: Map Layers Panel */}
      <div className="absolute top-4 left-4 z-10 w-64 bg-[#0B0F17]/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-3 text-xs transition-all">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white tracking-tight">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Map Layers</span>
          </div>
          <button
            onClick={() => setIsLayersPanelExpanded(!isLayersPanelExpanded)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          >
            {isLayersPanelExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {isLayersPanelExpanded && (
          <div className="flex flex-col gap-2.5">
            {/* Checkboxes List */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>MODIS (Terra/Aqua)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showModis}
                  onChange={(e) => setShowModis(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>VIIRS (NOAA-20/21)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showViirs}
                  onChange={(e) => setShowViirs(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Matched Pairs</span>
                </span>
                <input
                  type="checkbox"
                  checked={showMatched}
                  onChange={(e) => setShowMatched(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>MODIS Only</span>
                </span>
                <input
                  type="checkbox"
                  checked={showModisOnly}
                  onChange={(e) => setShowModisOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>VIIRS Only</span>
                </span>
                <input
                  type="checkbox"
                  checked={showViirsOnly}
                  onChange={(e) => setShowViirsOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-slate-400 hover:text-slate-300 cursor-pointer py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm border border-slate-500" />
                  <span>Grid Overlay (1 km)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showGridOverlay}
                  onChange={(e) => setShowGridOverlay(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0"
                />
              </label>
            </div>

            {/* Opacity Slider */}
            <div className="flex flex-col gap-1 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Opacity</span>
                <span className="font-mono">{layerOpacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Region Selector */}
            {presetAois.length > 0 && onSelectAoi && (
              <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Region
                </label>
                <select
                  value={selectedAoiId}
                  onChange={(e) => {
                    const found = presetAois.find((a) => a.id === e.target.value);
                    if (found) onSelectAoi(found);
                  }}
                  className="w-full bg-[#131B2B] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                >
                  {presetAois.map((aoi) => (
                    <option key={aoi.id} value={aoi.id}>
                      {aoi.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time Range */}
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-800 text-[10px]">
              <span className="uppercase font-bold text-slate-400">Time Range</span>
              <span className="font-mono text-slate-300">
                {startDate} &mdash; {endDate}
              </span>
            </div>

            {/* Display Interval buttons: All | Day | Week | Month */}
            <div className="flex items-center justify-between bg-[#131B2B] p-0.5 rounded-lg border border-slate-800 text-[10px]">
              {(["all", "day", "week", "month"] as const).map((inter) => (
                <button
                  key={inter}
                  onClick={() => setDisplayInterval(inter)}
                  className={`px-2 py-0.5 rounded font-medium capitalize transition-all ${
                    displayInterval === inter
                      ? "bg-sky-500 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {inter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Right: Controls Toolstrip */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Compass indicator */}
        <div className="w-9 h-9 rounded-xl bg-[#0B0F17]/90 backdrop-blur border border-slate-700/80 flex items-center justify-center text-sky-400 shadow-xl">
          <Compass className="w-4 h-4 animate-spin-slow" />
        </div>

        {/* Zoom In / Out */}
        <div className="flex flex-col bg-[#0B0F17]/90 backdrop-blur border border-slate-700/80 rounded-xl overflow-hidden shadow-xl">
          <button
            onClick={() => map.current?.zoomIn()}
            className="w-9 h-9 flex items-center justify-center text-white hover:bg-slate-800 font-bold text-base transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <div className="h-px bg-slate-800" />
          <button
            onClick={() => map.current?.zoomOut()}
            className="w-9 h-9 flex items-center justify-center text-white hover:bg-slate-800 font-bold text-base transition-colors"
            title="Zoom out"
          >
            -
          </button>
        </div>

        {/* Recenter */}
        <button
          onClick={handleRecenter}
          className="w-9 h-9 rounded-xl bg-[#0B0F17]/90 backdrop-blur border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 shadow-xl transition-colors"
          title="Recenter Map"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Basemap Toggle: Satellite vs Dark Vector */}
        <button
          onClick={toggleBasemap}
          className="w-9 h-9 rounded-xl bg-[#0B0F17]/90 backdrop-blur border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 shadow-xl transition-colors"
          title={`Switch to ${basemapType === "satellite" ? "Dark Vector" : "Satellite Imagery"}`}
        >
          {basemapType === "satellite" ? (
            <MapIcon className="w-4 h-4 text-emerald-400" />
          ) : (
            <SatelliteIcon className="w-4 h-4 text-sky-400" />
          )}
        </button>

        {/* Accessible Data Table Toggle */}
        <button
          onClick={() => setShowAccessibleTable(!showAccessibleTable)}
          className={`w-9 h-9 rounded-xl bg-[#0B0F17]/90 backdrop-blur border border-slate-700/80 flex items-center justify-center shadow-xl transition-colors ${
            showAccessibleTable ? "text-amber-400 bg-amber-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
          title="Toggle Accessible Data Table"
        >
          <Table className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Bottom-Right: Fire Intensity (FRP) Legend & Attribution */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1.5">
        {/* FRP Legend Card */}
        <div className="px-3 py-2 rounded-xl bg-[#0B0F17]/90 backdrop-blur border border-slate-700/80 shadow-2xl flex flex-col gap-1 text-[10px]">
          <span className="font-bold text-white">Fire Intensity (FRP)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Low</span>
            <div className="h-2 w-28 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 to-red-600 border border-slate-700/60" />
            <span className="text-slate-400">High</span>
          </div>
        </div>

        {/* Attribution Bar */}
        <div className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur text-[9px] text-slate-400 font-mono flex items-center gap-2">
          <span>&copy; OpenStreetMap contributors</span>
          <span>&bull;</span>
          <span>Imagery: NASA / USGS / ESRI</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B0F17]/90 border border-slate-700 text-white text-xs font-semibold shadow-2xl">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
            <span>Harmonizing observations...</span>
          </div>
        </div>
      )}

      {/* Accessible Data Table Modal Overlay */}
      {showAccessibleTable && (
        <div className="absolute inset-4 z-30 bg-[#0B0F17]/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 flex flex-col shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-sky-400" />
              Harmonized Observations ({geoJsonData?.features?.length || 0} records)
            </h4>
            <button
              onClick={() => setShowAccessibleTable(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto mt-2">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-[#131B2B] text-slate-400 sticky top-0">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">Sensor</th>
                  <th className="p-2">Platform</th>
                  <th className="p-2">UTC Timestamp</th>
                  <th className="p-2">FRP (MW)</th>
                  <th className="p-2">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {geoJsonData?.features.slice(0, 50).map((f) => (
                  <tr
                    key={f.properties.observation_id}
                    onClick={() => {
                      if (onSelectObservation) onSelectObservation(f.properties);
                      setShowAccessibleTable(false);
                    }}
                    className="hover:bg-slate-800/60 cursor-pointer"
                  >
                    <td className="p-2 truncate max-w-[120px]">{f.properties.observation_id}</td>
                    <td className="p-2">{f.properties.sensor}</td>
                    <td className="p-2">{f.properties.platform}</td>
                    <td className="p-2">{f.properties.acq_datetime_utc}</td>
                    <td className="p-2 text-amber-400">{f.properties.frp_mw?.toFixed(1) || "-"}</td>
                    <td className="p-2">{f.properties.classification}</td>
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
