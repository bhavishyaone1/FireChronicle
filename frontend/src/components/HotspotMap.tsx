"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, Eye, CheckCircle2, Flame, Maximize2, Table, Sparkles } from "lucide-react";
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
  
  // Layer visibility & visualization mode
  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showMatched, setShowMatched] = useState(true);
  const [viewMode, setViewMode] = useState<"sensor" | "frp">("sensor");
  const [showAccessibleTable, setShowAccessibleTable] = useState(false);

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

      // Layer 1: MODIS Footprints (~1km circle) - Violet identity (#A78BFA)
      map.current.addLayer({
        id: "modis-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", ["get", "sensor"], "MODIS"],
        paint: {
          "circle-radius": 10,
          "circle-color": "#a78bfa",
          "circle-opacity": 0.45,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#8b5cf6",
        },
      });

      // Layer 2: VIIRS Points (375m circle) - Cyan identity (#38BDF8)
      map.current.addLayer({
        id: "viirs-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", ["get", "sensor"], "VIIRS"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#38bdf8",
          "circle-opacity": 0.85,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#0284c7",
        },
      });

      // Layer 3: Matched Cross-Sensor Dual-Ring Outline (#F8FAFC)
      map.current.addLayer({
        id: "matched-halo-layer",
        type: "circle",
        source: "hotspots",
        filter: ["==", ["get", "classification"], "matched"],
        paint: {
          "circle-radius": 14,
          "circle-color": "transparent",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#f8fafc",
          "circle-stroke-opacity": 0.95,
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

  // Update paint styles when switching between Sensor Identity and Thermal FRP mode
  useEffect(() => {
    if (!map.current || !map.current.getLayer("modis-layer")) return;

    if (viewMode === "frp") {
      // Sequential Thermal Scale: Low #FDE68A -> Mid #FB923C -> High #EF4444
      const frpColorExpression: any = [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "frp_mw"], 10],
        10, "#fde68a",
        35, "#fb923c",
        70, "#ef4444"
      ];
      map.current.setPaintProperty("modis-layer", "circle-color", frpColorExpression);
      map.current.setPaintProperty("modis-layer", "circle-opacity", 0.7);
      map.current.setPaintProperty("viirs-layer", "circle-color", frpColorExpression);
    } else {
      // Sensor Identity Mode: MODIS Violet (#A78BFA) vs VIIRS Cyan (#38BDF8)
      map.current.setPaintProperty("modis-layer", "circle-color", "#a78bfa");
      map.current.setPaintProperty("modis-layer", "circle-opacity", 0.45);
      map.current.setPaintProperty("viirs-layer", "circle-color", "#38bdf8");
    }
  }, [viewMode]);

  // Recenter map on bounding box change
  useEffect(() => {
    if (!map.current) return;
    const centerLon = (bbox[0] + bbox[2]) / 2.0;
    const centerLat = (bbox[1] + bbox[3]) / 2.0;
    map.current.flyTo({ center: [centerLon, centerLat], zoom: 9.5, essential: true });
  }, [bbox]);

  const features = geoJsonData?.features || [];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-xl flex flex-col gap-3 relative">
      {/* Map Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-cyan" />
            Interactive Hotspot & Footprint Map
          </h2>
          <span className="text-xs text-text-secondary">
            Visualizing footprints: MODIS 1000m (violet) vs VIIRS 375m (cyan)
          </span>
        </div>

        {/* View Mode & Layer Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Mode Switcher */}
          <div className="flex bg-surface-muted p-0.5 rounded border border-border">
            <button
              onClick={() => setViewMode("sensor")}
              className={`px-2 py-1 rounded transition-colors font-medium ${
                viewMode === "sensor"
                  ? "bg-action text-white"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              Sensor Identity
            </button>
            <button
              onClick={() => setViewMode("frp")}
              className={`px-2 py-1 rounded transition-colors font-medium ${
                viewMode === "frp"
                  ? "bg-nasa-orange text-white"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              FRP Magnitude
            </button>
          </div>

          <button
            onClick={() => setShowModis(!showModis)}
            className={`px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
              showModis
                ? "bg-purple-950/60 border-purple-500 text-purple-200"
                : "bg-surface border-border text-text-muted line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-accent-violet" />
            MODIS
          </button>

          <button
            onClick={() => setShowViirs(!showViirs)}
            className={`px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
              showViirs
                ? "bg-sky-950/60 border-sky-500 text-sky-200"
                : "bg-surface border-border text-text-muted line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-viirs-cyan" />
            VIIRS
          </button>

          <button
            onClick={() => setShowMatched(!showMatched)}
            className={`px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
              showMatched
                ? "bg-slate-800 border-white text-white"
                : "bg-surface border-border text-text-muted line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full border-2 border-matched" />
            Matched Pair
          </button>

          <button
            onClick={() => setShowAccessibleTable(!showAccessibleTable)}
            className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
              showAccessibleTable ? "bg-accent-cyan text-background font-semibold" : "bg-surface border-border text-text-secondary"
            }`}
            title="Toggle accessible tabular data alternative"
          >
            <Table className="w-3.5 h-3.5" />
            Table View
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative w-full h-[460px] rounded-lg overflow-hidden border border-border">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-md border border-border rounded-lg p-2.5 text-xs text-text-secondary shadow-xl z-10 flex flex-col gap-1.5 pointer-events-none">
          <span className="font-semibold text-text-primary text-[11px] uppercase tracking-wider">
            {viewMode === "sensor" ? "Sensor Identity Legend" : "Thermal FRP Scale (MW)"}
          </span>
          {viewMode === "sensor" ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-500/40 border-2 border-accent-violet inline-block" />
                <span>MODIS (1000m nadir nominal)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-viirs-cyan inline-block ml-0.5" />
                <span>VIIRS (375m I-band nominal)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-matched inline-block" />
                <span>Matched Candidate (Dual-Ring)</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-3 h-3 rounded bg-fire-low inline-block" /> &lt;20 MW
              <span className="w-3 h-3 rounded bg-fire-mid inline-block ml-1" /> 20–50 MW
              <span className="w-3 h-3 rounded bg-fire-high inline-block ml-1" /> &gt;50 MW
            </div>
          )}
        </div>

        {/* Selected Point Inspector Modal */}
        {selectedFeature && (
          <div className="absolute top-3 right-3 bg-surface-elevated/95 backdrop-blur-md border border-accent-cyan rounded-lg p-3.5 text-xs text-text-primary shadow-2xl z-20 w-72">
            <div className="flex items-center justify-between border-b border-border pb-1.5 mb-2">
              <span className="font-bold text-accent-cyan flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-nasa-orange" />
                Observation Details
              </span>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-text-muted hover:text-white font-mono text-xs px-1"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-text-secondary">Record ID: </span>
                <span className="font-mono text-text-primary">{selectedFeature.observation_id}</span>
              </div>
              <div>
                <span className="text-text-secondary">Platform: </span>
                <span className="font-semibold text-white">
                  {selectedFeature.sensor} ({selectedFeature.platform})
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Acquisition UTC: </span>
                <span className="text-text-primary">{selectedFeature.acq_datetime_utc}</span>
              </div>
              <div>
                <span className="text-text-secondary">Confidence: </span>
                <span className="capitalize font-medium text-amber-300">
                  {selectedFeature.confidence_category} ({selectedFeature.raw_confidence})
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Fire Radiative Power: </span>
                <span className="font-bold text-nasa-orange">
                  {selectedFeature.frp_mw ? `${selectedFeature.frp_mw} MW` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Classification: </span>
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
                  <span className="text-text-secondary">Candidate Match: </span>
                  <span className="text-text-primary font-mono">
                    {selectedFeature.match_distance_m}m / {selectedFeature.match_time_delta_min}min delta
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accessible Tabular Alternative for WCAG 2.2 AA Compliance */}
      {showAccessibleTable && (
        <div className="border border-border rounded-lg p-3 bg-surface-elevated mt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-primary">
              Visible Observations Data Table ({features.length} records)
            </span>
            <button
              onClick={() => setShowAccessibleTable(false)}
              className="text-xs text-text-secondary hover:text-white"
            >
              Hide Table
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-border text-text-secondary sticky top-0 bg-surface-elevated">
                <tr>
                  <th className="py-1 px-2">ID</th>
                  <th className="py-1 px-2">Sensor</th>
                  <th className="py-1 px-2">Platform</th>
                  <th className="py-1 px-2">Time (UTC)</th>
                  <th className="py-1 px-2">FRP (MW)</th>
                  <th className="py-1 px-2">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {features.map((f) => (
                  <tr
                    key={f.properties.observation_id}
                    onClick={() => setSelectedFeature(f.properties)}
                    className="hover:bg-surface-muted cursor-pointer"
                  >
                    <td className="py-1 px-2 font-mono text-text-muted">{f.properties.observation_id.slice(0, 8)}</td>
                    <td className="py-1 px-2 font-semibold text-text-primary">{f.properties.sensor}</td>
                    <td className="py-1 px-2">{f.properties.platform}</td>
                    <td className="py-1 px-2">{f.properties.acq_datetime_utc}</td>
                    <td className="py-1 px-2 text-nasa-orange font-bold">{f.properties.frp_mw || "N/A"}</td>
                    <td className="py-1 px-2 capitalize">{f.properties.classification}</td>
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
