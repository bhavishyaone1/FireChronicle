"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Eye,
  CheckCircle2,
  Flame,
  Maximize2,
  Table,
  Sparkles,
  AlertCircle,
  Download,
  Crosshair,
} from "lucide-react";
import { GeoJSONFeatureCollection, GeoJSONPointFeature } from "@/types";

interface HotspotMapProps {
  geoJsonData: GeoJSONFeatureCollection | null;
  bbox: [number, number, number, number];
  onSelectObservation?: (obsId: string) => void;
  isLoading?: boolean;
}

// OpenFreeMap Dark style - vector tiles, keyless, zero watermarks
const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

export const HotspotMap: React.FC<HotspotMapProps> = ({
  geoJsonData,
  bbox,
  onSelectObservation,
  isLoading = false,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONPointFeature["properties"] | null>(null);

  // Visualization Controls
  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showMatched, setShowMatched] = useState(true);
  const [viewMode, setViewMode] = useState<"sensor" | "frp">("sensor");
  const [showAccessibleTable, setShowAccessibleTable] = useState(false);

  // Keep a reference to the latest data to handle async load races
  const latestDataRef = useRef(geoJsonData);
  latestDataRef.current = geoJsonData;

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      const centerLon = (bbox[0] + bbox[2]) / 2.0;
      const centerLat = (bbox[1] + bbox[3]) / 2.0;

      const instance = new maplibregl.Map({
        container: mapContainer.current,
        style: BASEMAP_STYLE,
        center: [centerLon, centerLat],
        zoom: 9.5,
        attributionControl: false,
      });

      instance.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution:
            '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        }),
        "bottom-right"
      );

      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right"
      );

      instance.on("error", (e) => {
        // Log error but don't crash UI
        if (e && e.error && e.error.message && !e.error.message.includes("tile")) {
          setMapError("Basemap service degraded. Data layers and table remain functional.");
        }
      });

      instance.on("load", () => {
        map.current = instance;
        setIsMapLoaded(true);

        const currentData = latestDataRef.current || {
          type: "FeatureCollection",
          features: [],
        };

        // Source with clustering for low zoom levels
        instance.addSource("hotspots", {
          type: "geojson",
          data: currentData,
          cluster: true,
          clusterMaxZoom: 8,
          clusterRadius: 35,
        });

        // 1. Cluster circle layer (zoom < 9)
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
            "circle-opacity": 0.85,
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

        // 3. Layer: MODIS Footprints (~1km circle) - Violet (#A78BFA)
        instance.addLayer({
          id: "modis-layer",
          type: "circle",
          source: "hotspots",
          filter: ["all", ["!has", "point_count"], ["==", "sensor", "MODIS"]] as any,
          paint: {
            "circle-radius": 11,
            "circle-color": "#a78bfa",
            "circle-opacity": 0.45,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#8b5cf6",
          },
        });

        // 4. Layer: VIIRS Points (375m circle) - Cyan (#38BDF8)
        instance.addLayer({
          id: "viirs-layer",
          type: "circle",
          source: "hotspots",
          filter: ["all", ["!has", "point_count"], ["==", "sensor", "VIIRS"]] as any,
          paint: {
            "circle-radius": 5.5,
            "circle-color": "#38bdf8",
            "circle-opacity": 0.85,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#0284c7",
          },
        });

        // 5. Layer: Matched Cross-Sensor Halo (White dual ring)
        instance.addLayer({
          id: "matched-halo-layer",
          type: "circle",
          source: "hotspots",
          filter: ["all", ["!has", "point_count"], ["==", "classification", "matched"]] as any,
          paint: {
            "circle-radius": 15,
            "circle-color": "transparent",
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#f8fafc",
            "circle-stroke-opacity": 0.95,
          },
        });

        // Click on cluster to zoom in
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

        // Click on unclustered point to inspect
        const handleFeatureClick = (e: any) => {
          if (!e.features || !e.features.length) return;
          const props = e.features[0].properties;
          setSelectedFeature(props);
          if (onSelectObservation && props.observation_id) {
            onSelectObservation(props.observation_id);
          }
        };

        instance.on("click", "modis-layer", handleFeatureClick);
        instance.on("click", "viirs-layer", handleFeatureClick);

        // Hover pointer cursor
        const setCursorPointer = () => {
          if (instance) instance.getCanvas().style.cursor = "pointer";
        };
        const resetCursor = () => {
          if (instance) instance.getCanvas().style.cursor = "";
        };

        instance.on("mouseenter", "clusters", setCursorPointer);
        instance.on("mouseleave", "clusters", resetCursor);
        instance.on("mouseenter", "modis-layer", setCursorPointer);
        instance.on("mouseleave", "modis-layer", resetCursor);
        instance.on("mouseenter", "viirs-layer", setCursorPointer);
        instance.on("mouseleave", "viirs-layer", resetCursor);
      });

      map.current = instance;
    } catch (err) {
      setMapError("Map initialization failed. Displaying tabular alternative.");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update source data whenever geoJsonData changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const src = map.current.getSource("hotspots") as maplibregl.GeoJSONSource;
    if (src) {
      src.setData(geoJsonData || { type: "FeatureCollection", features: [] });
    }
  }, [geoJsonData, isMapLoaded]);

  // Fit bounds when bounding box changes
  useEffect(() => {
    if (!map.current || !bbox || bbox.length !== 4) return;
    try {
      map.current.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 45, maxZoom: 12, duration: 800 }
      );
    } catch (e) {
      // Ignore boundary fly error on unmounted canvas
    }
  }, [bbox]);

  // Update layer visibility
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    if (map.current.getLayer("modis-layer")) {
      map.current.setLayoutProperty("modis-layer", "visibility", showModis ? "visible" : "none");
    }
    if (map.current.getLayer("viirs-layer")) {
      map.current.setLayoutProperty("viirs-layer", "visibility", showViirs ? "visible" : "none");
    }
    if (map.current.getLayer("matched-halo-layer")) {
      map.current.setLayoutProperty("matched-halo-layer", "visibility", showMatched ? "visible" : "none");
    }
  }, [showModis, showViirs, showMatched, isMapLoaded]);

  // Update paint styles when switching view mode
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    if (!map.current.getLayer("modis-layer") || !map.current.getLayer("viirs-layer")) return;

    if (viewMode === "frp") {
      const frpColorExpression: any = [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "frp_mw"], 10],
        5,
        "#fde68a",
        30,
        "#fb923c",
        80,
        "#ef4444",
      ];
      map.current.setPaintProperty("modis-layer", "circle-color", frpColorExpression);
      map.current.setPaintProperty("modis-layer", "circle-opacity", 0.7);
      map.current.setPaintProperty("viirs-layer", "circle-color", frpColorExpression);
    } else {
      map.current.setPaintProperty("modis-layer", "circle-color", "#a78bfa");
      map.current.setPaintProperty("modis-layer", "circle-opacity", 0.45);
      map.current.setPaintProperty("viirs-layer", "circle-color", "#38bdf8");
    }
  }, [viewMode, isMapLoaded]);

  const features = geoJsonData?.features || [];

  const handleResetView = useCallback(() => {
    if (!map.current || !bbox) return;
    map.current.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 45, maxZoom: 12, duration: 600 }
    );
  }, [bbox]);

  // Download visible observations as GeoJSON
  const handleExportGeoJson = () => {
    if (!geoJsonData) return;
    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `firechronicle_hotspots_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-xl flex flex-col gap-3 relative">
      {/* Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-cyan" />
            Interactive Hotspot & Footprint Map
          </h2>
          <span className="text-xs text-text-secondary">
            Resolving footprints: MODIS 1000m (violet) vs VIIRS 375m (cyan) &bull; Clean OpenFreeMap vector basemap
          </span>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Mode Switcher */}
          <div className="flex bg-surface-muted p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("sensor")}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                viewMode === "sensor"
                  ? "bg-action text-white"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              Sensor Identity
            </button>
            <button
              onClick={() => setViewMode("frp")}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                viewMode === "frp"
                  ? "bg-fire-mid text-white"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              FRP Radiance
            </button>
          </div>

          {/* Sensor toggles */}
          <button
            onClick={() => setShowModis(!showModis)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showModis
                ? "bg-purple-950/70 border-accent-violet text-purple-200"
                : "bg-surface border-border text-text-muted line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-accent-violet inline-block" />
            MODIS
          </button>

          <button
            onClick={() => setShowViirs(!showViirs)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showViirs
                ? "bg-sky-950/70 border-viirs-cyan text-sky-200"
                : "bg-surface border-border text-text-muted line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-viirs-cyan inline-block" />
            VIIRS
          </button>

          <button
            onClick={() => setShowMatched(!showMatched)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showMatched
                ? "bg-surface-elevated border-matched text-text-primary"
                : "bg-surface border-border text-text-muted line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full border border-matched inline-block" />
            Matched
          </button>

          {/* Recenter button */}
          <button
            onClick={handleResetView}
            title="Recenter to active AOI"
            className="p-1.5 bg-surface-muted hover:bg-surface-elevated border border-border rounded-lg text-text-secondary hover:text-white transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Toggle Accessible Table */}
          <button
            onClick={() => setShowAccessibleTable(!showAccessibleTable)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showAccessibleTable
                ? "bg-action text-white border-action"
                : "bg-surface border-border text-text-secondary hover:text-white"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            {showAccessibleTable ? "Hide Table" : "Table View"}
          </button>

          {/* Export GeoJSON */}
          {features.length > 0 && (
            <button
              onClick={handleExportGeoJson}
              title="Download visible records as GeoJSON"
              className="p-1.5 bg-surface-muted hover:bg-surface-elevated border border-border rounded-lg text-text-secondary hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Degradation notice banner if basemap errors */}
      {mapError && (
        <div className="bg-amber-950/60 border border-amber-600/70 rounded-lg p-2.5 text-xs text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{mapError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full h-[460px] rounded-xl overflow-hidden border border-border bg-nasa-dark">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-xs font-medium text-accent-cyan bg-surface-elevated px-4 py-2 rounded-lg border border-border shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan animate-ping" />
              Loading Hotspot Observations...
            </div>
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl text-[11px] flex flex-col gap-2 max-w-xs pointer-events-auto">
          <span className="font-bold uppercase tracking-wider text-text-secondary text-[10px]">
            {viewMode === "sensor" ? "Sensor Footprints" : "Thermal Radiance (MW)"}
          </span>

          {viewMode === "sensor" ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-accent-violet/50 border-2 border-accent-violet inline-block shrink-0" />
                <span className="text-text-primary">
                  MODIS (~1000m nadir footprint)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-viirs-cyan border border-sky-400 inline-block shrink-0 ml-0.5" />
                <span className="text-text-primary">
                  VIIRS (375m I-band point)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-matched border-dashed inline-block shrink-0" />
                <span className="text-text-primary">
                  Cross-Sensor Collocated Match
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-fire-mid text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                  3+
                </span>
                <span className="text-text-muted">
                  Overview Cluster (Zoom to expand)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-fire-low inline-block shrink-0" />
                <span className="text-text-primary">Low (&lt; 20 MW)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-fire-mid inline-block shrink-0" />
                <span className="text-text-primary">Moderate (20 – 80 MW)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-fire-high inline-block shrink-0" />
                <span className="text-text-primary">Intense (&gt; 80 MW)</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Hotspot Inspection Drawer */}
        {selectedFeature && (
          <div className="absolute top-3 right-3 bg-surface/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-2xl text-xs max-w-sm flex flex-col gap-2 z-20 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedFeature.sensor === "MODIS" ? "bg-accent-violet" : "bg-viirs-cyan"
                  }`}
                />
                <span className="font-bold text-text-primary">
                  {selectedFeature.sensor} Hotspot Record
                </span>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-text-muted hover:text-white text-xs px-1"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div>
                <span className="text-text-secondary">Platform: </span>
                <span className="text-text-primary font-medium">{selectedFeature.platform}</span>
              </div>
              <div>
                <span className="text-text-secondary">UTC Time: </span>
                <span className="text-text-primary font-mono">{selectedFeature.acq_datetime_utc}</span>
              </div>
              <div>
                <span className="text-text-secondary">FRP Radiance: </span>
                <span className="text-fire-mid font-bold font-mono">
                  {selectedFeature.frp_mw !== null ? `${selectedFeature.frp_mw} MW` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Confidence: </span>
                <span className="text-text-primary font-medium capitalize">
                  {selectedFeature.confidence_category} ({selectedFeature.raw_confidence})
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Equal-Area Cell: </span>
                <span className="text-text-primary font-mono text-[10px]">
                  {selectedFeature.grid_cell_id}
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
            </div>

            {selectedFeature.match_distance_m && (
              <div className="bg-surface-muted/60 p-1.5 rounded border border-border/70 text-[11px]">
                <span className="text-text-secondary">Candidate Match: </span>
                <span className="text-text-primary font-mono font-medium">
                  {selectedFeature.match_distance_m}m separation &bull; {selectedFeature.match_time_delta_min}min &Delta;t
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Tabular Alternative for WCAG 2.2 AA Compliance */}
      {showAccessibleTable && (
        <div className="border border-border rounded-xl p-3 bg-surface-elevated mt-1 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-accent-cyan" />
              Visible Hotspot Records Table ({features.length} records in current window)
            </span>
            <button
              onClick={() => setShowAccessibleTable(false)}
              className="text-xs text-text-secondary hover:text-white"
            >
              Hide Table
            </button>
          </div>
          {features.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted">
              Zero observations recorded in this spatial-temporal query.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="border-b border-border text-text-secondary sticky top-0 bg-surface-elevated">
                  <tr>
                    <th className="py-1 px-2">ID</th>
                    <th className="py-1 px-2">Sensor</th>
                    <th className="py-1 px-2">Platform</th>
                    <th className="py-1 px-2">Acquisition (UTC)</th>
                    <th className="py-1 px-2">FRP (MW)</th>
                    <th className="py-1 px-2">Grid Cell</th>
                    <th className="py-1 px-2">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {features.map((f) => (
                    <tr
                      key={f.properties.observation_id}
                      onClick={() => setSelectedFeature(f.properties)}
                      className="hover:bg-surface-muted cursor-pointer transition-colors"
                    >
                      <td className="py-1 px-2 font-mono text-text-muted">{f.properties.observation_id.slice(0, 8)}</td>
                      <td className="py-1 px-2 font-semibold text-text-primary">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            f.properties.sensor === "MODIS" ? "bg-accent-violet" : "bg-viirs-cyan"
                          }`}
                        />
                        {f.properties.sensor}
                      </td>
                      <td className="py-1 px-2">{f.properties.platform}</td>
                      <td className="py-1 px-2 font-mono">{f.properties.acq_datetime_utc}</td>
                      <td className="py-1 px-2 text-fire-mid font-bold font-mono">
                        {f.properties.frp_mw !== null ? `${f.properties.frp_mw}` : "N/A"}
                      </td>
                      <td className="py-1 px-2 font-mono text-[10px] text-text-muted">
                        {f.properties.grid_cell_id}
                      </td>
                      <td className="py-1 px-2 capitalize font-medium">
                        <span
                          className={
                            f.properties.classification === "matched"
                              ? "text-green-400"
                              : "text-blue-300"
                          }
                        >
                          {f.properties.classification}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
