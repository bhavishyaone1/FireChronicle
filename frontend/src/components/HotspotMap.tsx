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

const VECTOR_DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

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

  const [basemapType, setBasemapType] = useState<"satellite" | "vector">("satellite");

  const [isLayersPanelExpanded, setIsLayersPanelExpanded] = useState(true);
  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showMatched, setShowMatched] = useState(true);
  const [showModisOnly, setShowModisOnly] = useState(true);
  const [showViirsOnly, setShowViirsOnly] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [layerOpacity, setLayerOpacity] = useState(85);
  const [displayInterval, setDisplayInterval] = useState<"all" | "day" | "week" | "month">("all");
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
      cluster: true,
      clusterMaxZoom: 8,
      clusterRadius: 35,
    });

    instance.addLayer({
      id: "clusters",
      type: "circle",
      source: "hotspots",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#F59E0B",
          5,
          "#F97316",
          15,
          "#EF4444",
          30,
          "#DC2626",
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

    instance.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "hotspots",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    instance.addLayer({
      id: "modis-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "sensor", "MODIS"]] as any,
      paint: {
        "circle-radius": 11,
        "circle-color": "#F97316",
        "circle-opacity": (layerOpacity / 100) * 0.7,
        "circle-stroke-width": 1.8,
        "circle-stroke-color": "#EA580C",
      },
    });

    instance.addLayer({
      id: "viirs-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "sensor", "VIIRS"]] as any,
      paint: {
        "circle-radius": 5.5,
        "circle-color": "#EF4444",
        "circle-opacity": layerOpacity / 100,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#DC2626",
      },
    });

    instance.addLayer({
      id: "matched-halo-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "classification", "matched"]] as any,
      paint: {
        "circle-radius": 15,
        "circle-color": "transparent",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FBBF24",
        "circle-stroke-opacity": layerOpacity / 100,
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
      const props = e.features[0].properties;
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

    instance.on("mouseenter", "clusters", setPointer);
    instance.on("mouseleave", "clusters", resetPointer);
    instance.on("mouseenter", "modis-layer", setPointer);
    instance.on("mouseleave", "modis-layer", resetPointer);
    instance.on("mouseenter", "viirs-layer", setPointer);
    instance.on("mouseleave", "viirs-layer", resetPointer);
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

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-neutral-900 shadow-md bg-black">
      {/* Map Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Left: Map Layers Panel */}
      <div className="absolute top-4 left-4 z-10 w-64 bg-black/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 text-xs">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-semibold text-white tracking-tight">
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Map layers</span>
          </div>
          <button
            onClick={() => setIsLayersPanelExpanded(!isLayersPanelExpanded)}
            className="text-neutral-400 hover:text-white p-0.5 rounded transition-colors"
          >
            {isLayersPanelExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {isLayersPanelExpanded && (
          <div className="flex flex-col gap-2">
            {/* Checkboxes List */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center justify-between text-neutral-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2 font-normal text-xs">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>MODIS (Terra/Aqua)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showModis}
                  onChange={(e) => setShowModis(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-orange-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-neutral-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2 font-normal text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>VIIRS (NOAA-20/21)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showViirs}
                  onChange={(e) => setShowViirs(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-red-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-neutral-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2 font-normal text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Matched pairs</span>
                </span>
                <input
                  type="checkbox"
                  checked={showMatched}
                  onChange={(e) => setShowMatched(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-neutral-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2 font-normal text-xs">
                  <span className="w-2 h-2 rounded-full bg-orange-600" />
                  <span>MODIS only</span>
                </span>
                <input
                  type="checkbox"
                  checked={showModisOnly}
                  onChange={(e) => setShowModisOnly(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-orange-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-neutral-300 hover:text-white cursor-pointer py-0.5">
                <span className="flex items-center gap-2 font-normal text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-700" />
                  <span>VIIRS only</span>
                </span>
                <input
                  type="checkbox"
                  checked={showViirsOnly}
                  onChange={(e) => setShowViirsOnly(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-red-700 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-neutral-400 hover:text-neutral-300 cursor-pointer py-0.5">
                <span className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-sm border border-neutral-600" />
                  <span>Grid overlay (1 km)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showGridOverlay}
                  onChange={(e) => setShowGridOverlay(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-orange-500 focus:ring-0"
                />
              </label>
            </div>

            {/* Opacity Slider */}
            <div className="flex flex-col gap-1 pt-1.5 border-t border-neutral-800">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Opacity</span>
                <span className="font-mono tabular-nums text-neutral-300">{layerOpacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(Number(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Region Selector */}
            {presetAois.length > 0 && onSelectAoi && (
              <div className="flex flex-col gap-1 pt-1.5 border-t border-neutral-800">
                <label className="text-[11px] font-medium text-neutral-400">
                  Region
                </label>
                <select
                  value={selectedAoiId}
                  onChange={(e) => {
                    const found = presetAois.find((a) => a.id === e.target.value);
                    if (found) onSelectAoi(found);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
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
            <div className="flex flex-col gap-0.5 pt-1 border-t border-neutral-800 text-[11px]">
              <span className="font-medium text-neutral-400">Observation window</span>
              <span className="font-mono tabular-nums text-neutral-300 text-[11px]">
                {startDate} &mdash; {endDate}
              </span>
            </div>

            {/* Display Interval buttons */}
            <div className="flex items-center justify-between bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
              {(["all", "day", "week", "month"] as const).map((inter) => (
                <button
                  key={inter}
                  onClick={() => setDisplayInterval(inter)}
                  className={`px-2 py-1 rounded font-medium capitalize transition-all ${
                    displayInterval === inter
                      ? "bg-neutral-800 text-white font-semibold"
                      : "text-neutral-400 hover:text-white"
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
        <div className="w-8 h-8 rounded-xl bg-black/90 backdrop-blur border border-neutral-800 flex items-center justify-center text-orange-400 shadow-md">
          <Compass className="w-4 h-4" />
        </div>

        <div className="flex flex-col bg-black/90 backdrop-blur border border-neutral-800 rounded-xl overflow-hidden shadow-md">
          <button
            onClick={() => map.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-neutral-800 text-sm transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <div className="h-px bg-neutral-800" />
          <button
            onClick={() => map.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-neutral-800 text-sm transition-colors"
            title="Zoom out"
          >
            -
          </button>
        </div>

        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-black/90 backdrop-blur border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 shadow-md transition-colors"
          title="Recenter Map"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={toggleBasemap}
          className="w-8 h-8 rounded-xl bg-black/90 backdrop-blur border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 shadow-md transition-colors"
          title={`Switch to ${basemapType === "satellite" ? "dark vector" : "satellite imagery"}`}
        >
          {basemapType === "satellite" ? (
            <MapIcon className="w-4 h-4 text-orange-400" />
          ) : (
            <SatelliteIcon className="w-4 h-4 text-red-400" />
          )}
        </button>

        <button
          onClick={() => setShowAccessibleTable(!showAccessibleTable)}
          className={`w-8 h-8 rounded-xl bg-black/90 backdrop-blur border border-neutral-800 flex items-center justify-center shadow-md transition-colors ${
            showAccessibleTable ? "text-orange-400 bg-neutral-900 border-neutral-700" : "text-neutral-300 hover:text-white hover:bg-neutral-800"
          }`}
          title="Toggle observation table"
        >
          <Table className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Bottom-Right: Fire Intensity (FRP) Legend & Attribution */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1">
        <div className="px-3 py-1.5 rounded-xl bg-black/90 backdrop-blur border border-neutral-800 shadow-md flex flex-col gap-1 text-[11px]">
          <span className="font-medium text-neutral-200">
            Fire intensity (FRP)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 text-[10px]">Low</span>
            <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-[#450A0A] via-[#EA580C] via-[#EF4444] to-[#FDE047]" />
            <span className="text-neutral-400 text-[10px]">High</span>
          </div>
        </div>

        <div className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur text-[10px] text-neutral-500 font-mono flex items-center gap-1.5 border border-neutral-900">
          <span>&copy; OpenStreetMap</span>
          <span>&bull;</span>
          <span>NASA FIRMS / ESRI</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/90 border border-neutral-800 text-neutral-200 text-xs font-medium shadow-md">
            <span className="w-3 h-3 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            <span>Harmonizing observations...</span>
          </div>
        </div>
      )}

      {/* Accessible Data Table Modal Overlay */}
      {showAccessibleTable && (
        <div className="absolute inset-4 z-30 bg-black/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex flex-col shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-orange-400" />
              Harmonized observations ({geoJsonData?.features?.length || 0} records)
            </h4>
            <button
              onClick={() => setShowAccessibleTable(false)}
              className="text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto mt-2">
            <table className="w-full text-left text-xs font-mono tabular-nums text-neutral-300">
              <thead className="bg-[#0C0C0F] text-neutral-400 font-sans font-medium sticky top-0 border-b border-neutral-800">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">Sensor</th>
                  <th className="p-2">Platform</th>
                  <th className="p-2">Timestamp (UTC)</th>
                  <th className="p-2">FRP (MW)</th>
                  <th className="p-2">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {geoJsonData?.features.slice(0, 50).map((f) => (
                  <tr
                    key={f.properties.observation_id}
                    onClick={() => {
                      if (onSelectObservation) onSelectObservation(f.properties);
                      setShowAccessibleTable(false);
                    }}
                    className="hover:bg-neutral-900/60 cursor-pointer"
                  >
                    <td className="p-2 truncate max-w-[120px] font-mono">{f.properties.observation_id}</td>
                    <td className="p-2 text-white font-sans font-medium">{f.properties.sensor}</td>
                    <td className="p-2 font-sans">{f.properties.platform}</td>
                    <td className="p-2 font-mono">{f.properties.acq_datetime_utc}</td>
                    <td className="p-2 text-orange-400 font-mono font-medium">{f.properties.frp_mw?.toFixed(1) || "-"}</td>
                    <td className="p-2 font-sans text-neutral-400">{f.properties.classification}</td>
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
