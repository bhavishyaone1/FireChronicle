"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, Eye, CheckCircle2, Flame, Maximize2 } from "lucide-react";
import { GeoJSONFeatureCollection, GeoJSONPointFeature } from "@/types";

interface HotspotMapProps {
  geoJsonData: GeoJSONFeatureCollection | null;
  bbox: [number, number, number, number];
  selectedDate: string | null;
}

export const HotspotMap: React.FC<HotspotMapProps> = ({
  geoJsonData,
  bbox,
  selectedDate,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONPointFeature["properties"] | null>(null);
  
  // Layer visibility state
  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showMatched, setShowMatched] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const centerLon = (bbox[0] + bbox[2]) / 2.0;
    const centerLat = (bbox[1] + bbox[3]) / 2.0;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap &copy; CARTO",
          },
        },
        layers: [
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [centerLon, centerLat],
      zoom: 9.5,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;

      // Add Hotspots GeoJSON source
      map.current.addSource("hotspots", {
        type: "geojson",
        data: geoJsonData || { type: "FeatureCollection", features: [] },
      });

      // Layer 1: MODIS Footprints (~1km circle)
      map.current.addLayer({
        id: "modis-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", ["get", "sensor"], "MODIS"],
        paint: {
          "circle-radius": 10,
          "circle-color": "#60a5fa",
          "circle-opacity": 0.5,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#2563eb",
        },
      });

      // Layer 2: VIIRS Points (375m circle)
      map.current.addLayer({
        id: "viirs-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", ["get", "sensor"], "VIIRS"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#f97316",
          "circle-opacity": 0.8,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ea580c",
        },
      });

      // Layer 3: Matched Cross-Sensor Halo
      map.current.addLayer({
        id: "matched-halo-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", ["get", "classification"], "matched"],
        paint: {
          "circle-radius": 13,
          "circle-color": "transparent",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#22c55e",
          "circle-stroke-opacity": 0.9,
        },
      });

      // Click to inspect
      const clickHandler = (e: any) => {
        if (!e.features || !e.features.length) return;
        const props = e.features[0].properties;
        setSelectedFeature(props);
      };

      map.current.on("click", "modis-layer", clickHandler);
      map.current.on("click", "viirs-layer", clickHandler);

      // Hover cursor
      map.current.on("mouseenter", "modis-layer", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "modis-layer", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update source data when geoJsonData changes
  useEffect(() => {
    if (!map.current || !map.current.getSource("hotspots")) return;
    const src = map.current.getSource("hotspots") as maplibregl.GeoJSONSource;
    if (src) {
      src.setData(geoJsonData || { type: "FeatureCollection", features: [] });
    }
  }, [geoJsonData]);

  // Update layer visibility
  useEffect(() => {
    if (!map.current || !map.current.getLayer("modis-layer")) return;
    map.current.setLayoutProperty("modis-layer", "visibility", showModis ? "visible" : "none");
    map.current.setLayoutProperty("viirs-layer", "visibility", showViirs ? "visible" : "none");
    map.current.setLayoutProperty("matched-halo-layer", "visibility", showMatched ? "visible" : "none");
  }, [showModis, showViirs, showMatched]);

  // Recenter map on bounding box change
  useEffect(() => {
    if (!map.current) return;
    const centerLon = (bbox[0] + bbox[2]) / 2.0;
    const centerLat = (bbox[1] + bbox[3]) / 2.0;
    map.current.flyTo({ center: [centerLon, centerLat], zoom: 9.5, essential: true });
  }, [bbox]);

  return (
    <div className="bg-nasa-card/90 border border-nasa-border rounded-xl p-4 shadow-lg flex flex-col gap-3 relative">
      {/* Map Header & Layer Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-nasa-cyan" />
            Interactive Hotspot & Footprint Map
          </h2>
          <span className="text-xs text-nasa-slate">
            Visualizing spatial footprints: MODIS 1000m (blue circle) vs VIIRS 375m (orange point)
          </span>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowModis(!showModis)}
            className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
              showModis
                ? "bg-blue-900/60 border-blue-500 text-blue-200"
                : "bg-nasa-dark border-nasa-border text-nasa-slate line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            MODIS (1 km)
          </button>

          <button
            onClick={() => setShowViirs(!showViirs)}
            className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
              showViirs
                ? "bg-orange-900/60 border-orange-500 text-orange-200"
                : "bg-nasa-dark border-nasa-border text-nasa-slate line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            VIIRS (375 m)
          </button>

          <button
            onClick={() => setShowMatched(!showMatched)}
            className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
              showMatched
                ? "bg-green-900/60 border-green-500 text-green-200"
                : "bg-nasa-dark border-nasa-border text-nasa-slate line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full border-2 border-green-400" />
            Cross-Matched Halo
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative w-full h-[460px] rounded-lg overflow-hidden border border-nasa-border">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-nasa-dark/90 backdrop-blur-md border border-nasa-border/80 rounded-lg p-2.5 text-xs text-nasa-slate shadow-xl z-10 flex flex-col gap-1.5 pointer-events-none">
          <span className="font-semibold text-white text-[11px] uppercase tracking-wider">Spatial Footprint Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-500/40 border-2 border-blue-400 inline-block" />
            <span>MODIS (1000m nadir nominal)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block ml-0.5" />
            <span>VIIRS (375m I-band nominal)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-green-400 inline-block" />
            <span>Matched Pair (Collocated Overpass)</span>
          </div>
        </div>

        {/* Selected Point Inspector Modal */}
        {selectedFeature && (
          <div className="absolute top-3 right-3 bg-nasa-dark/95 backdrop-blur-md border border-nasa-cyan rounded-lg p-3 text-xs text-white shadow-2xl z-20 w-72">
            <div className="flex items-center justify-between border-b border-nasa-border pb-1.5 mb-2">
              <span className="font-bold text-nasa-cyan flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-nasa-orange" />
                Detection Details
              </span>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-nasa-slate hover:text-white font-mono text-xs px-1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-[11px]">
              <div>
                <span className="text-nasa-slate">ID: </span>
                <span className="font-mono text-gray-200">{selectedFeature.observation_id}</span>
              </div>
              <div>
                <span className="text-nasa-slate">Sensor / Sat: </span>
                <span className="font-semibold text-white">
                  {selectedFeature.sensor} ({selectedFeature.platform})
                </span>
              </div>
              <div>
                <span className="text-nasa-slate">UTC Time: </span>
                <span className="text-gray-200">{selectedFeature.acq_datetime_utc}</span>
              </div>
              <div>
                <span className="text-nasa-slate">Confidence: </span>
                <span className="capitalize font-medium text-amber-300">
                  {selectedFeature.confidence_category} ({selectedFeature.raw_confidence})
                </span>
              </div>
              <div>
                <span className="text-nasa-slate">Radiative Power: </span>
                <span className="font-bold text-nasa-orange">
                  {selectedFeature.frp_mw ? `${selectedFeature.frp_mw} MW` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-nasa-slate">Classification: </span>
                <span
                  className={`font-semibold ${
                    selectedFeature.classification === "matched" ? "text-green-400" : "text-blue-300"
                  }`}
                >
                  {selectedFeature.classification}
                </span>
              </div>
              {selectedFeature.match_distance_m && (
                <div>
                  <span className="text-nasa-slate">Match Delta: </span>
                  <span className="text-gray-300">
                    {selectedFeature.match_distance_m}m / {selectedFeature.match_time_delta_min}min
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
