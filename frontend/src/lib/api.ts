import {
  HealthResponse,
  MetadataResponse,
  GeoJSONFeatureCollection,
  CalendarResponse,
  SensorComparisonResponse,
  AnomalyResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchMetadata(): Promise<MetadataResponse> {
  const res = await fetch(`${API_BASE}/metadata`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch metadata");
  return res.json();
}

export async function fetchObservations(params: {
  bbox?: [number, number, number, number];
  startDate?: string;
  endDate?: string;
  sensor?: string;
  classification?: string;
  limit?: number;
}): Promise<GeoJSONFeatureCollection> {
  const query = new URLSearchParams();
  if (params.bbox) query.set("bbox", params.bbox.join(","));
  if (params.startDate) query.set("start_date", params.startDate);
  if (params.endDate) query.set("end_date", params.endDate);
  if (params.sensor) query.set("sensor", params.sensor);
  if (params.classification) query.set("classification", params.classification);
  if (params.limit) query.set("limit", params.limit.toString());

  const res = await fetch(`${API_BASE}/observations?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch observations");
  return res.json();
}

export async function fetchCalendar(params: {
  bbox: [number, number, number, number];
  startDate: string;
  endDate: string;
  gridSizeKm?: number;
}): Promise<CalendarResponse> {
  const query = new URLSearchParams({
    bbox: params.bbox.join(","),
    start_date: params.startDate,
    end_date: params.endDate,
    grid_size_km: (params.gridSizeKm || 1.0).toString(),
  });

  const res = await fetch(`${API_BASE}/calendar?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch calendar");
  return res.json();
}

export async function fetchComparison(params: {
  bbox: [number, number, number, number];
  startDate: string;
  endDate: string;
  spatialToleranceM?: number;
  temporalToleranceMin?: number;
}): Promise<SensorComparisonResponse> {
  const query = new URLSearchParams({
    bbox: params.bbox.join(","),
    start_date: params.startDate,
    end_date: params.endDate,
    spatial_tolerance_m: (params.spatialToleranceM || 1000.0).toString(),
    temporal_tolerance_min: (params.temporalToleranceMin || 60.0).toString(),
  });

  const res = await fetch(`${API_BASE}/compare?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch comparison");
  return res.json();
}

export async function fetchAnomalies(params: {
  bbox: [number, number, number, number];
  targetYear?: number;
}): Promise<AnomalyResponse> {
  const query = new URLSearchParams({
    bbox: params.bbox.join(","),
    target_year: (params.targetYear || 2024).toString(),
  });

  const res = await fetch(`${API_BASE}/anomalies?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}
