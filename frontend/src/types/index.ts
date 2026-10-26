export type SensorType = "MODIS" | "VIIRS";
export type PlatformType = "Terra" | "Aqua" | "Suomi-NPP" | "NOAA-20" | "NOAA-21";
export type ConfidenceCategory = "low" | "nominal" | "high";
export type ClassificationType = "matched" | "MODIS_only" | "VIIRS_only";
export type CoverageStatus = "full" | "partial" | "no_pass" | "cloud_obscured";

export interface DatasetProvenance {
  provenance_type: "LIVE_NASA_FIRMS" | "UPLOADED_NASA_FIRMS_CSV" | "SYNTHETIC_DEMO" | "EMPTY";
  label: string;
  is_synthetic: boolean;
  is_live: boolean;
  description: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  firms_configured: boolean;
  duckdb_ready: boolean;
  active_mode: string;
  provenance?: DatasetProvenance;
}

export interface PresetAoi {
  id: string;
  name: string;
  bbox: [number, number, number, number];
}

export interface MetadataResponse {
  sensors: string[];
  platforms: string[];
  products: Array<{ id: string; name: string; resolution: string }>;
  preset_aois: PresetAoi[];
  active_mode: string;
  firms_configured: boolean;
  provenance?: DatasetProvenance;
  suomi_npp_lifecycle?: {
    cessation_date: string;
    operational_status: string;
    recommended_live_products: string[];
  };
}

export interface GeoJSONPointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    observation_id: string;
    sensor: SensorType;
    platform: PlatformType;
    latitude?: number;
    longitude?: number;
    acq_datetime_utc: string;
    confidence_category: ConfidenceCategory;
    raw_confidence: string | number;
    frp_mw: number | null;
    daynight: "D" | "N";
    classification: ClassificationType;
    grid_cell_id?: string;
    matched_pair_id?: string;
    match_distance_m?: number;
    match_time_delta_min?: number;
    match_score?: number | null;
    is_ambiguous?: boolean;
    candidate_count?: number;
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONPointFeature[];
  total_count: number;
  offset: number;
  limit: number;
  metadata: {
    bbox?: number[];
    sensor_filter?: string;
    classification_filter?: string;
    provenance?: DatasetProvenance;
  };
}

export interface CalendarDaySummary {
  date: string;
  modis_raw_count: number;
  viirs_raw_count: number;
  total_raw_count: number;
  unique_active_cells: number;
  matched_active_cells: number;
  modis_only_cells: number;
  viirs_only_cells: number;
  mean_frp_modis: number | null;
  mean_frp_viirs: number | null;
  max_frp_modis: number | null;
  max_frp_viirs: number | null;
  coverage_status: CoverageStatus;
}

export interface CalendarResponse {
  aoi_bbox: number[];
  start_date: string;
  end_date: string;
  grid_size_km: number;
  total_days: number;
  active_days: number;
  days: CalendarDaySummary[];
  summary: {
    total_modis_raw: number;
    total_viirs_raw: number;
    total_unique_active_cells: number;
    ratio_viirs_to_modis: number;
    harmonized_metric_description: string;
  };
}

export interface QuantileSummary {
  min: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  max: number;
}

export interface SensitivityPoint {
  tolerance_m: number;
  matched_fraction: number;
  matched_pairs: number;
}

export interface SensorComparisonResponse {
  start_date: string;
  end_date: string;
  bbox: number[];
  modis_total_detections: number;
  viirs_total_detections: number;
  matched_pairs_count: number;
  modis_only_count: number;
  viirs_only_count: number;
  matched_fraction_modis: number;
  matched_fraction_viirs: number;
  spatial_agreement_jaccard: number;
  frp_quantiles_modis?: QuantileSummary;
  frp_quantiles_viirs?: QuantileSummary;
  sensitivity_curve: SensitivityPoint[];
  algorithm?: string;
  algorithm_comparison?: {
    greedy_1toMany?: {
      pairs_count: number;
      modis_matched: number;
      viirs_matched: number;
      mean_distance_m: number;
      description: string;
    };
    global_assignment_1to1?: {
      pairs_count: number;
      modis_matched: number;
      viirs_matched: number;
      mean_distance_m: number;
      description: string;
    };
  };
  ambiguity_stats?: {
    ambiguous_modis_count: number;
    ambiguous_viirs_count: number;
    total_ambiguous_detections: number;
  };
  notes: string[];
}

export interface MonthlyBaseline {
  month: number;
  month_name: string;
  historical_years_count: number;
  median_active_cells: number;
  mad_active_cells: number;
  p75_active_cells: number;
  observed_active_cells: number | null;
  deviation_z_score: number | null;
  is_anomaly: boolean;
  is_history_adequate: boolean;
}

export interface AnomalyResponse {
  bbox: number[];
  target_year: number;
  baseline_years: number[];
  method: string;
  months: MonthlyBaseline[];
  overall_assessment: string;
  limitations: string[];
}
