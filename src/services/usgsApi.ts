import { GeoJsonEarthquakeResponse, HistoricalFilter } from '../types/earthquake';

export const USGS_FEEDS = {
  day_all: {
    label: '1 Day (Past 24h · All Quakes)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    badge: '1 Day',
    timeWindowDays: 1,
  },
  week_all: {
    label: '7 Days (Past Week · All Quakes)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
    badge: '7 Days',
    timeWindowDays: 7,
  },
  month_all: {
    label: '30 Days (Past Month · All Quakes)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
    badge: '30 Days',
    timeWindowDays: 30,
  },
  hour_all: {
    label: '1 Hour (Recent All)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
    badge: '1 Hour',
    timeWindowDays: 0.04,
  },
  day_25: {
    label: '1 Day (M2.5+)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
    badge: '1 Day M2.5+',
    timeWindowDays: 1,
  },
  month_25: {
    label: '30 Days (M2.5+)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson',
    badge: '30 Days M2.5+',
    timeWindowDays: 30,
  },
  day_45: {
    label: '1 Day (M4.5+ Major)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
    badge: '1 Day M4.5+',
    timeWindowDays: 1,
  },
  month_sig: {
    label: '30 Days (Significant)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson',
    badge: '30 Days Sig',
    timeWindowDays: 30,
  },
};

export type FeedKey = keyof typeof USGS_FEEDS;

/**
 * Fetch real-time feed from USGS
 */
export async function fetchLiveFeed(feedUrl: string): Promise<GeoJsonEarthquakeResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`USGS HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data: GeoJsonEarthquakeResponse = await response.json();
    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch real-time USGS feed:', err);
    throw err;
  }
}

/**
 * Fetch historical earthquake events from USGS FDSNWS Event Web Service
 */
export async function fetchHistoricalData(
  filter: HistoricalFilter
): Promise<GeoJsonEarthquakeResponse> {
  const params = new URLSearchParams();
  params.append('format', 'geojson');
  params.append('starttime', filter.startDate);
  params.append('endtime', filter.endDate);

  if (filter.minMag !== undefined && filter.minMag !== null) {
    params.append('minmagnitude', filter.minMag.toString());
  }
  if (filter.maxMag !== undefined && filter.maxMag !== null) {
    params.append('maxmagnitude', filter.maxMag.toString());
  }
  if (filter.minDepth !== undefined && filter.minDepth !== null) {
    params.append('mindepth', filter.minDepth.toString());
  }
  if (filter.maxDepth !== undefined && filter.maxDepth !== null) {
    params.append('maxdepth', filter.maxDepth.toString());
  }
  if (filter.lat !== undefined && filter.lng !== undefined && filter.radiusKm) {
    params.append('latitude', filter.lat.toString());
    params.append('longitude', filter.lng.toString());
    params.append('maxradiuskm', filter.radiusKm.toString());
  }
  params.append('limit', Math.min(filter.limit || 200, 500).toString());
  params.append('orderby', filter.orderBy || 'time');

  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('USGS query returned no matching data or invalid filter parameters.');
      }
      throw new Error(`USGS Query Error ${response.status}: ${response.statusText}`);
    }

    const data: GeoJsonEarthquakeResponse = await response.json();

    // Client-side place filtering if specified
    if (filter.locationName && filter.locationName.trim() !== '') {
      const q = filter.locationName.trim().toLowerCase();
      data.features = data.features.filter((f) =>
        (f.properties.place || '').toLowerCase().includes(q)
      );
      data.metadata.count = data.features.length;
    }

    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch historical earthquake data:', err);
    throw err;
  }
}
