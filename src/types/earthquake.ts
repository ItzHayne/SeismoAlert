export interface EarthquakeProperties {
  mag: number | null;
  place: string;
  time: number;
  updated: number;
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number | null;
  gap: number | null;
  magType: string;
  type: string;
  title: string;
}

export interface EarthquakeGeometry {
  type: 'Point';
  coordinates: [number, number, number]; // [longitude, latitude, depth_km]
}

export interface EarthquakeFeature {
  type: 'Feature';
  id: string;
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
  // Computed fields:
  distanceKm?: number;
  bearing?: string;
  pWaveEtaSeconds?: number;
  sWaveEtaSeconds?: number;
}

export interface GeoJsonMetadata {
  generated: number;
  url: string;
  title: string;
  status: number;
  api: string;
  count: number;
}

export interface GeoJsonEarthquakeResponse {
  type: 'FeatureCollection';
  metadata: GeoJsonMetadata;
  features: EarthquakeFeature[];
  bbox?: number[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  accuracy?: number;
  isCustom?: boolean;
}

export interface AlertSettings {
  enabled: boolean;
  soundEnabled: boolean;
  soundType: 'sonar' | 'pulse' | 'siren';
  volume: number; // 0 to 1
  minMagnitude: number;
  proximityKm: number; // e.g. 1000
  notifyBrowser: boolean;
  alertOnlyNearMe: boolean;
}

export interface HistoricalFilter {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  minMag: number;
  maxMag: number;
  locationName: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minDepth?: number;
  maxDepth?: number;
  limit: number;
  orderBy: 'time' | 'time-asc' | 'magnitude' | 'magnitude-asc';
}

export interface FamousEarthquake {
  id: string;
  name: string;
  dateStr: string;
  startDate: string;
  endDate: string;
  magnitude: number;
  depthKm: number;
  coordinates: [number, number]; // [lat, lng]
  location: string;
  impact: string;
  tsunami: boolean;
  summary: string;
}

export interface TriggeredAlert {
  id: string;
  earthquakeId: string;
  title: string;
  magnitude: number;
  place: string;
  time: number;
  distanceKm?: number;
  isTsunami: boolean;
}
