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
  centerTarget?: [number, number] | null;
  selectedObservationId?: string | null;
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
  centerTarget = null,
  selectedObservationId = null,
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
          "#FDE047",
          5,
          "#F59E0B",
          15,
          "#EA580C",
          30,
          "#DC2626",
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

    // MODIS Footprint Layer (1.0 km nadir) - Violet
    instance.addLayer({
      id: "modis-layer",
      type: "circle",
      source: "hotspots",
      filter: ["all", ["!has", "point_count"], ["==", "sensor", "MODIS"]] as any,
      paint: {
        "circle-radius": 10,
        "circle-color": "#8B5CF6",
        "circle-opacity": (layerOpacity / 100) * 0.7,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#7C3AED",
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
        "circle-color": "#06B6D4",
        "circle-opacity": layerOpacity / 100,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#0891B2",
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
        "circle-stroke-color": "#10B981",
        "circle-stroke-opacity": layerOpacity / 100,
      },
    });

    // Selected Observation Distinct Halo Ring
    instance.addLayer({
      id: "selected-observation-halo",
      type: "circle",
      source: "hotspots",
      filter: ["==", "observation_id", ""],
      paint: {
        "circle-radius": 15,
        "circle-color": "transparent",
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#F1F5F9",
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
    try {
      if (map.current.getLayer("selected-observation-halo")) {
        map.current.setFilter("selected-observation-halo", [
          "==",
          "observation_id",
          selectedObservationId || "",
        ]);
      }
    } catch {
      // ignore
    }
  }, [selectedObservationId, isMapLoaded]);

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
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-[#28313D] bg-[#090B0F]">
      {/* Top Map Title Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10141B]/90 backdrop-blur border border-[#28313D] text-xs">
        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
        <span className="font-medium text-[#F1F5F9]">Interactive hotspot map</span>
        <span className="text-[#A4AFBF] text-[11px] hidden sm:inline">&bull; {aoiDisplayName}</span>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Basemap degraded error alert banner if needed */}
      {mapError && (
        <div className="absolute top-12 right-14 z-20 px-3 py-1.5 bg-[#151A22]/95 border border-amber-500/50 rounded-lg text-amber-200 text-xs flex items-center gap-2 shadow-lg backdrop-blur">
          <span>{mapError}</span>
          <button
            onClick={() => setMapError(null)}
            className="text-amber-400 hover:text-amber-100 font-bold ml-1 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Floating Left: Map Layers Panel */}
      <div className="absolute top-14 left-3 z-10 w-64 bg-[#10141B]/95 backdrop-blur-md border border-[#28313D] rounded-xl p-3 shadow-lg flex flex-col gap-2.5 text-xs">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#28313D]">
          <div className="flex items-center gap-2 font-medium text-[#F1F5F9]">
            <Layers className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Map layers &amp; legend</span>
          </div>
          <button
            onClick={() => setIsLayersPanelExpanded(!isLayersPanelExpanded)}
            className="text-[#A4AFBF] hover:text-[#F1F5F9] p-0.5 rounded transition-colors"
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
              <label className="flex items-center justify-between text-[#A4AFBF] hover:text-[#F1F5F9] cursor-pointer py-0.5">
                <span className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                  <span>MODIS (1.0 km footprint)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showModis}
                  onChange={(e) => setShowModis(e.target.checked)}
                  className="rounded border-[#28313D] bg-[#151A22] text-[#8B5CF6] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-[#A4AFBF] hover:text-[#F1F5F9] cursor-pointer py-0.5">
                <span className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                  <span>VIIRS (375 m footprint)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showViirs}
                  onChange={(e) => setShowViirs(e.target.checked)}
                  className="rounded border-[#28313D] bg-[#151A22] text-[#06B6D4] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-[#A4AFBF] hover:text-[#F1F5F9] cursor-pointer py-0.5">
                <span className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Candidate cross-matches</span>
                </span>
                <input
                  type="checkbox"
                  checked={showMatched}
                  onChange={(e) => setShowMatched(e.target.checked)}
                  className="rounded border-[#28313D] bg-[#151A22] text-[#10B981] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-[#A4AFBF] hover:text-[#F1F5F9] cursor-pointer py-0.5">
                <span className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-sm border border-[#6E7A8A]" />
                  <span>1.0 km equal-area grid</span>
                </span>
                <input
                  type="checkbox"
                  checked={showGridOverlay}
                  onChange={(e) => setShowGridOverlay(e.target.checked)}
                  className="rounded border-[#28313D] bg-[#151A22] text-[#F59E0B] focus:ring-0"
                />
              </label>
            </div>

            {/* Opacity Slider */}
            <div className="flex flex-col gap-1 pt-1.5 border-t border-[#28313D]">
              <div className="flex items-center justify-between text-[11px] text-[#A4AFBF]">
                <span>Layer opacity</span>
                <span className="font-mono tabular-nums text-[#F1F5F9]">{layerOpacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(Number(e.target.value))}
                className="w-full h-1 bg-[#28313D] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
              />
            </div>

            {/* Region Selector */}
            {presetAois.length > 0 && onSelectAoi && (
              <div className="flex flex-col gap-1 pt-1.5 border-t border-[#28313D]">
                <label className="text-[11px] font-medium text-[#A4AFBF]">
                  Region
                </label>
                <select
                  value={selectedAoiId}
                  onChange={(e) => {
                    const found = presetAois.find((a) => a.id === e.target.value);
                    if (found) onSelectAoi(found);
                  }}
                  className="w-full bg-[#151A22] border border-[#28313D] rounded-lg px-2 py-1 text-xs text-[#F1F5F9] focus:outline-none"
                >
                  {presetAois.map((aoi) => (
                    <option key={aoi.id} value={aoi.id}>
                      {aoi.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Display Interval buttons */}
            <div className="flex items-center justify-between bg-[#151A22] p-0.5 rounded-lg border border-[#28313D] text-[11px] mt-1">
              {(["all", "day", "week", "month"] as const).map((inter) => (
                <button
                  key={inter}
                  onClick={() => setDisplayInterval(inter)}
                  className={`px-2 py-1 rounded font-medium capitalize transition-all ${
                    displayInterval === inter
                      ? "bg-[#28313D] text-[#F1F5F9]"
                      : "text-[#A4AFBF] hover:text-[#F1F5F9]"
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
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <div className="w-8 h-8 rounded-lg bg-[#10141B]/90 backdrop-blur border border-[#28313D] flex items-center justify-center text-[#A4AFBF] shadow-sm">
          <Compass className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col bg-[#10141B]/90 backdrop-blur border border-[#28313D] rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => map.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center text-[#F1F5F9] hover:bg-[#151A22] text-sm transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <div className="h-px bg-[#28313D]" />
          <button
            onClick={() => map.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center text-[#F1F5F9] hover:bg-[#151A22] text-sm transition-colors"
            title="Zoom out"
          >
            -
          </button>
        </div>

        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-lg bg-[#10141B]/90 backdrop-blur border border-[#28313D] flex items-center justify-center text-[#A4AFBF] hover:text-[#F1F5F9] hover:bg-[#151A22] shadow-sm transition-colors"
          title="Recenter map"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleBasemap}
          className="w-8 h-8 rounded-lg bg-[#10141B]/90 backdrop-blur border border-[#28313D] flex items-center justify-center text-[#A4AFBF] hover:text-[#F1F5F9] hover:bg-[#151A22] shadow-sm transition-colors"
          title={`Switch to ${basemapType === "satellite" ? "dark vector" : "satellite imagery"}`}
        >
          {basemapType === "satellite" ? (
            <MapIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
          ) : (
            <SatelliteIcon className="w-3.5 h-3.5 text-[#06B6D4]" />
          )}
        </button>

        <button
          onClick={() => setShowAccessibleTable(!showAccessibleTable)}
          className={`w-8 h-8 rounded-lg bg-[#10141B]/90 backdrop-blur border border-[#28313D] flex items-center justify-center shadow-sm transition-colors ${
            showAccessibleTable ? "text-[#F59E0B] bg-[#151A22]" : "text-[#A4AFBF] hover:text-[#F1F5F9] hover:bg-[#151A22]"
          }`}
          title="Toggle tabular observation records"
        >
          <Table className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Bottom-Right: Fire Radiative Power (MW) Legend & Attribution */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1">
        <div className="px-3 py-1.5 rounded-lg bg-[#10141B]/90 backdrop-blur border border-[#28313D] shadow-sm flex flex-col gap-1 text-[11px]">
          <span className="font-medium text-[#F1F5F9]">
            Fire radiative power (MW)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#A4AFBF] text-[10px]">Low (&lt;5 MW)</span>
            <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-[#FDE047] via-[#F59E0B] via-[#EA580C] to-[#DC2626]" />
            <span className="text-[#A4AFBF] text-[10px]">High (&gt;50 MW)</span>
          </div>
        </div>

        <div className="px-2 py-0.5 rounded bg-[#090B0F]/90 backdrop-blur text-[10px] text-[#6E7A8A] font-mono flex items-center gap-1.5 border border-[#28313D]">
          <span>&copy; OpenStreetMap</span>
          <span>&bull;</span>
          <span>NASA FIRMS / ESRI</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#090B0F]/50 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10141B] border border-[#28313D] text-[#F1F5F9] text-xs font-medium shadow-md">
            <span className="w-3 h-3 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
            <span>Harmonizing active fire observations...</span>
          </div>
        </div>
      )}

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
                          ? "bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40"
                          : "bg-[#06B6D4]/20 text-[#67E8F9] border border-[#06B6D4]/40"
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
