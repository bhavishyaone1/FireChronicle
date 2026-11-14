import {
  HealthResponse,
  MetadataResponse,
  GeoJSONFeatureCollection,
  CalendarResponse,
  SensorComparisonResponse,
  AnomalyResponse,
  CandidateEventsResponse,
  IndianStateInfo,
  SourcesAvailabilityResponse,
  SatelliteConfigPayload,
  FireTypeBreakdownResponse,
} from "@/types";

const API_BASE = typeof window !== "undefined"
  ? "/api"
  : (process.env.NEXT_PUBLIC_API_BASE_URL ||
     (process.env.NODE_ENV === "production"
       ? "https://firechronicle.onrender.com/api"
       : "http://127.0.0.1:8002/api"));

/**
 * Robust JSON fetch wrapper with cloud cold-start detection and clean error parsing.
 */
async function safeFetchJson<T>(url: string, errorPrefix: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    if (raw.includes("Application loading") || raw.includes("Render")) {
      throw new Error("Cloud backend warming up from standby. Auto-reconnecting...");
    }
    throw new Error(`${errorPrefix} (${res.status})`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("json") && !contentType.includes("geo+json")) {
    const text = await res.text().catch(() => "");
    if (text.includes("Application loading") || text.includes("Render")) {
      throw new Error("Cloud backend warming up from standby. Auto-reconnecting...");
    }
    throw new Error(`${errorPrefix}: Expected JSON format`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  return safeFetchJson<HealthResponse>(`${API_BASE}/health`, "Health check failed");
}

export async function fetchMetadata(): Promise<MetadataResponse> {
  return safeFetchJson<MetadataResponse>(`${API_BASE}/metadata`, "Failed to fetch metadata");
}

export async function fetchIndianStates(): Promise<{ states: IndianStateInfo[] }> {
  return safeFetchJson<{ states: IndianStateInfo[] }>(`${API_BASE}/states`, "Failed to fetch Indian states");
}

export async function fetchStatesGeoJson(): Promise<any> {
  return safeFetchJson<any>(`${API_BASE}/states/geojson`, "Failed to fetch states GeoJSON");
}

export async function fetchSourcesAvailability(): Promise<SourcesAvailabilityResponse> {
  return safeFetchJson<SourcesAvailabilityResponse>(`${API_BASE}/sources/availability`, "Failed to fetch sources availability");
}

export async function fetchCandidateEvents(params: {
  bbox?: [number, number, number, number];
  startDate?: string;
  endDate?: string;
  state?: string;
}): Promise<CandidateEventsResponse> {
  const query = new URLSearchParams();
  if (params.bbox) query.set("bbox", params.bbox.join(","));
  if (params.startDate) query.set("start_date", params.startDate);
  if (params.endDate) query.set("end_date", params.endDate);
  if (params.state && params.state !== "ALL") query.set("state", params.state);

  return safeFetchJson<CandidateEventsResponse>(
    `${API_BASE}/events?${query.toString()}`,
    "Failed to fetch candidate events"
  );
}

export async function fetchSatellites(): Promise<SatelliteConfigPayload> {
  return safeFetchJson<SatelliteConfigPayload>(`${API_BASE}/satellites`, "Failed to fetch satellite status");
}

export async function fetchFireTypesBreakdown(params?: {
  bbox?: [number, number, number, number];
  startDate?: string;
  endDate?: string;
}): Promise<FireTypeBreakdownResponse> {
  const query = new URLSearchParams();
  if (params?.bbox) query.set("bbox", params.bbox.join(","));
  if (params?.startDate) query.set("start_date", params.startDate);
  if (params?.endDate) query.set("end_date", params.endDate);

  return safeFetchJson<FireTypeBreakdownResponse>(
    `${API_BASE}/types/breakdown?${query.toString()}`,
    "Failed to fetch fire types breakdown"
  );
}

export async function fetchObservations(params: {
  bbox?: [number, number, number, number];
  startDate?: string;
  endDate?: string;
  sensor?: string;
  classification?: string;
  state?: string;
  contextClass?: string;
  fireType?: string;
  limit?: number;
}): Promise<GeoJSONFeatureCollection> {
  const query = new URLSearchParams();
  if (params.bbox) query.set("bbox", params.bbox.join(","));
  if (params.startDate) query.set("start_date", params.startDate);
  if (params.endDate) query.set("end_date", params.endDate);
  if (params.sensor && params.sensor !== "ALL") query.set("sensor", params.sensor);
  if (params.classification && params.classification !== "ALL") query.set("classification", params.classification);
  if (params.state && params.state !== "ALL") query.set("state", params.state);
  if (params.contextClass && params.contextClass !== "ALL") query.set("context_class", params.contextClass);
  if (params.fireType && params.fireType !== "ALL") query.set("fire_type", params.fireType);
  if (params.limit) query.set("limit", params.limit.toString());

  return safeFetchJson<GeoJSONFeatureCollection>(
    `${API_BASE}/observations?${query.toString()}`,
    "Failed to fetch observations"
  );
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

  return safeFetchJson<CalendarResponse>(
    `${API_BASE}/calendar?${query.toString()}`,
    "Failed to fetch calendar"
  );
}

export async function fetchComparison(params: {
  bbox: [number, number, number, number];
  startDate: string;
  endDate: string;
  spatialToleranceM?: number;
  temporalToleranceMin?: number;
  method?: string;
}): Promise<SensorComparisonResponse> {
  const query = new URLSearchParams({
    bbox: params.bbox.join(","),
    start_date: params.startDate,
    end_date: params.endDate,
    spatial_tolerance_m: (params.spatialToleranceM || 1000.0).toString(),
    temporal_tolerance_min: (params.temporalToleranceMin || 60.0).toString(),
    method: params.method || "greedy",
  });

  return safeFetchJson<SensorComparisonResponse>(
    `${API_BASE}/compare?${query.toString()}`,
    "Failed to fetch comparison"
  );
}

export function getExportUrl(params: {
  bbox?: [number, number, number, number];
  startDate?: string;
  endDate?: string;
  sensor?: string;
  classification?: string;
  format?: "geojson" | "csv";
}): string {
  const query = new URLSearchParams();
  if (params.bbox) query.set("bbox", params.bbox.join(","));
  if (params.startDate) query.set("start_date", params.startDate);
  if (params.endDate) query.set("end_date", params.endDate);
  if (params.sensor && params.sensor !== "ALL") query.set("sensor", params.sensor);
  if (params.classification && params.classification !== "ALL") query.set("classification", params.classification);
  const fmt = params.format || "geojson";
  query.set("export_format", fmt);
  query.set("format", fmt);
  return `${API_BASE}/export?${query.toString()}`;
}

export async function fetchAnomalies(params: {
  bbox: [number, number, number, number];
  targetYear?: number;
}): Promise<AnomalyResponse> {
  const query = new URLSearchParams({
    bbox: params.bbox.join(","),
    target_year: (params.targetYear || 2026).toString(),
  });

  return safeFetchJson<AnomalyResponse>(
    `${API_BASE}/anomalies?${query.toString()}`,
    "Failed to fetch anomalies"
  );
}

export interface ImportCsvResponse {
  status: "success";
  filename: string;
  total_rows: number;
  imported_rows: number;
  malformed_rows: number;
  match_stats: Record<string, any>;
  sample_warnings?: string[];
}

export async function uploadCsvFile(file: File): Promise<ImportCsvResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/import`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Import failed" }));
    throw new Error(errorData.detail || `Import failed (${res.status})`);
  }
  return res.json();
}
