export type SensorType = "MODIS" | "VIIRS";
export type PlatformType = "Terra" | "Aqua" | "Suomi-NPP" | "NOAA-20" | "NOAA-21";
export type ConfidenceCategory = "low" | "nominal" | "high";
export type ClassificationType = "matched" | "MODIS_only" | "VIIRS_only";
export type CoverageStatus = "full" | "partial" | "no_pass" | "cloud_obscured";

export interface DatasetProvenance {
  provenance_type: "LIVE_NASA_FIRMS" | "NASA_FIRMS_ARCHIVE" | "UPLOADED_NASA_FIRMS_CSV" | "SYNTHETIC_DEMO" | "EMPTY";
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
    anomaly_type?: number | null;
    fire_type_category?: "VEGETATION" | "VOLCANO" | "STATIC" | "OFFSHORE" | "UNCLASSIFIED" | string;
    fire_type_short_name?: string;
    fire_type_label?: string;
    fire_type_source?: string;
    fire_type_method?: string;
    fire_type_limitations?: string;
    fire_type_is_inferred?: boolean;
    has_firms_type?: boolean;
    raw_firms_type?: number | null;
    scan_km?: number | null;
    track_km?: number | null;
    brightness_kelvin?: number | null;
    brightness_channel_1?: number | null;
    brightness_channel_1_name?: string | null;
    brightness_channel_1_unit?: string;
    brightness_channel_2?: number | null;
    brightness_channel_2_name?: string | null;
    brightness_channel_2_unit?: string;
    source_agency?: "NASA_FIRMS" | "FSI" | "BHUVAN" | "IMD" | "GFWED" | string;
    acq_datetime_ist?: string | null;
    india_state?: string | null;
    india_district?: string | null;
    context_class?: "FSI_SUPPORTED_FOREST_ALERT" | "LIKELY_FOREST_CONTEXT" | "BHUVAN_AGRICULTURAL_FIRE_RECORD" | "LIKELY_AGRICULTURAL_CONTEXT" | "SEASONAL_AGRICULTURAL_RESIDUE_HEURISTIC" | "OTHER_STATIC_THERMAL_SOURCE" | "OFFSHORE" | "VOLCANIC" | "UNCLASSIFIED" | string;
    context_evidence?: string[];
    context_confidence?: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
    fsi_alert_id?: string | null;
    bhuvan_record_id?: string | null;
    event_id?: string | null;
    is_large_fire_candidate?: boolean;
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

export interface CandidateEvent {
  event_id: string;
  start_datetime_utc: string;
  end_datetime_utc: string;
  duration_hours: number;
  total_detections: number;
  sensor_breakdown: {
    MODIS: number;
    VIIRS: number;
  };
  centroid: {
    latitude: number;
    longitude: number;
  };
  max_frp_mw: number | null;
  max_brightness_kelvin: number | null;
  india_state: string;
  india_district: string | null;
  context_class: string;
  is_large_fire_candidate: boolean;
  member_observation_ids: string[];
}

export interface CandidateEventsResponse {
  candidate_events: CandidateEvent[];
  total_events: number;
  total_participating_observations: number;
  parameters: {
    spatial_radius_km: number;
    temporal_gap_hours: number;
    fsi_lff_rule: string;
  };
}

export interface IndianStateInfo {
  state: string;
  districts: string[];
}

export interface SourcesAvailabilityResponse {
  sources: Record<string, {
    name: string;
    status: string;
    configured?: boolean;
    portal_url?: string;
    sensors?: string[];
    latency?: string;
    active_seasons?: string[];
    ingestion_method?: string;
    licence?: string;
    notes?: string;
    parameters?: string[];
    large_fire_indicator?: string;
  }>;
  timestamp: string;
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

export interface BootstrapInterval {
  point_estimate: number;
  ci_lower: number;
  ci_upper: number;
  standard_error: number;
  sample_size_n: number;
  confidence_level?: number;
  n_bootstraps?: number;
}

export interface UncertaintyReport {
  modis_matched_fraction_ci: BootstrapInterval;
  viirs_matched_fraction_ci: BootstrapInterval;
  spatial_jaccard_ci: BootstrapInterval;
  cell_density_reduction_ci?: BootstrapInterval;
  scientific_methodology?: string;
}

export interface TemporalSensitivityPoint {
  temporal_window_min: number;
  matched_pairs: number;
  modis_matched_fraction: number;
  viirs_matched_fraction: number;
}

export interface DiscontinuityMetrics {
  raw_point_ratio_viirs_to_modis: number;
  grid_cell_ratio_viirs_to_modis: number;
  discontinuity_mitigation_percent: number;
  pre_2012_record_regime?: string;
  overlap_regime_2012_present?: string;
  future_regime_post_2026?: string;
  explanation?: string;
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
  temporal_sensitivity_curve?: TemporalSensitivityPoint[];
  uncertainty?: UncertaintyReport;
  discontinuity?: DiscontinuityMetrics;
  confidence_filter_applied?: string;
  low_confidence_counts?: {
    modis_low_count?: number;
    viirs_low_count?: number;
  };
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

export interface SatelliteMetadata {
  id: string;
  name: string;
  sensor: "MODIS" | "VIIRS";
  instrument: string;
  resolution: string;
  overpass_times: string;
  status: string;
  status_type: "active" | "active_drifting" | "ended";
  operational_span: string;
  first_date: string;
  last_date: string;
  notes: string;
  loaded_first_date?: string | null;
  loaded_last_date?: string | null;
  loaded_count?: number;
}

export interface SatelliteConfigPayload {
  last_verified_utc: string;
  verification_source_url: string;
  citation: string;
  timeline_overview: {
    modis_span: string;
    viirs_span: string;
    snpp_end_date: string;
    noaa20_start_year: number;
    noaa21_start_year: number;
    terra_planned_end: string;
    aqua_planned_end: string;
  };
  satellites: SatelliteMetadata[];
}

export interface FireTypeBreakdownResponse {
  total_detections: number;
  has_firms_reported_type: boolean;
  firms_reported_total: number;
  nrt_inferred_total: number;
  reported_by_firms: {
    vegetation_type_0: number;
    active_volcano_type_1: number;
    other_static_land_source_type_2: number;
    offshore_type_3: number;
  };
  inferred_nrt: {
    agricultural_context: number;
    forest_context: number;
    static_industrial_context: number;
    offshore_context: number;
    volcanic_context: number;
    unclassified_context: number;
  };
  scientific_disclaimer: string;
}
