/**
 * Satellite Constellation Operational Status Configuration.
 * Sourced directly from NASA FIRMS & NASA Earthdata official announcements.
 * Last Verified: 2026-11-02
 * Verification Source URL: https://firms.modaps.eosdis.nasa.gov/
 */

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

export const SATELLITE_STATUS_CONFIG: SatelliteConfigPayload = {
  last_verified_utc: "2026-11-02",
  verification_source_url: "https://firms.modaps.eosdis.nasa.gov/",
  citation: "NASA LANCE / FIRMS Mission Status & Orbit Specifications",
  timeline_overview: {
    modis_span: "2000–2027",
    viirs_span: "2012–present",
    snpp_end_date: "2026-11-02",
    noaa20_start_year: 2018,
    noaa21_start_year: 2023,
    terra_planned_end: "Jan 2027",
    aqua_planned_end: "Sep 2027"
  },
  satellites: [
    {
      id: "snpp_viirs",
      name: "Suomi NPP",
      sensor: "VIIRS",
      instrument: "Visible Infrared Imaging Radiometer Suite (VIIRS)",
      resolution: "375 m (I-band nadir) / 750 m (M-band)",
      overpass_times: "~13:30 & ~01:30 local solar time",
      status: "Ended — NASA stopped new FIRMS data on 2026-11-02; historical archive only",
      status_type: "ended",
      operational_span: "2012-01-20 to 2026-11-02",
      first_date: "2012-01-20",
      last_date: "2026-11-02",
      notes: "Decommissioned from operational NRT feeds by NASA on 2026-11-02. Replaced by NOAA-20 and NOAA-21."
    },
    {
      id: "noaa20_viirs",
      name: "NOAA-20 (JPSS-1)",
      sensor: "VIIRS",
      instrument: "Visible Infrared Imaging Radiometer Suite (VIIRS)",
      resolution: "375 m (I-band nadir) / 750 m (M-band)",
      overpass_times: "~13:30 & ~01:30 local solar time (~50 min orbital offset from S-NPP)",
      status: "Active",
      status_type: "active",
      operational_span: "2018-01-05 to present",
      first_date: "2018-01-05",
      last_date: "present",
      notes: "Primary operational afternoon VIIRS constellation satellite."
    },
    {
      id: "noaa21_viirs",
      name: "NOAA-21 (JPSS-2)",
      sensor: "VIIRS",
      instrument: "Visible Infrared Imaging Radiometer Suite (VIIRS)",
      resolution: "375 m (I-band nadir) / 750 m (M-band)",
      overpass_times: "~13:30 & ~01:30 local solar time",
      status: "Active",
      status_type: "active",
      operational_span: "2023-01-18 to present",
      first_date: "2023-01-18",
      last_date: "present",
      notes: "Secondary operational VIIRS constellation satellite providing supplementary spatial coverage."
    },
    {
      id: "terra_modis",
      name: "Terra",
      sensor: "MODIS",
      instrument: "Moderate Resolution Imaging Spectroradiometer (MODIS)",
      resolution: "1.0 km (nadir nominal)",
      overpass_times: "~10:30 & ~22:30 local solar time (morning orbit; drifting earlier since 2020)",
      status: "Active, only morning overpass; planned end ~Jan 2027",
      status_type: "active_drifting",
      operational_span: "2000-02-24 to ~Jan 2027",
      first_date: "2000-02-24",
      last_date: "~Jan 2027",
      notes: "Orbital altitude was lowered in Oct 2022 to avoid constellation collisions; orbit has drifted earlier in local solar time."
    },
    {
      id: "aqua_modis",
      name: "Aqua",
      sensor: "MODIS",
      instrument: "Moderate Resolution Imaging Spectroradiometer (MODIS)",
      resolution: "1.0 km (nadir nominal)",
      overpass_times: "~13:30 & ~01:30 local solar time (afternoon orbit)",
      status: "Active; planned end ~Sep 2027",
      status_type: "active",
      operational_span: "2002-07-04 to ~Sep 2027",
      first_date: "2002-07-04",
      last_date: "~Sep 2027",
      notes: "Exited the afternoon constellation (A-Train) in Jan 2022; continued operations projected through Sep 2027."
    }
  ]
};
