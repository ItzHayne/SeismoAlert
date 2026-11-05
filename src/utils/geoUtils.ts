/**
 * Geodetic and seismic calculation utilities
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Great-Circle distance using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate cardinal direction bearing from origin to target
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string {
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(rLat2);
  const x =
    Math.cos(rLat1) * Math.sin(rLat2) -
    Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  return points[Math.round(brng / 45)];
}

/**
 * Estimate seismic wave propagation times
 * Primary wave (P-wave): approx 6.0 km/s in crust
 * Secondary wave (S-wave): approx 3.5 km/s in crust
 */
export function estimateWaveTimes(distanceKm: number, depthKm: number = 10) {
  const hypocenterDist = Math.sqrt(distanceKm * distanceKm + depthKm * depthKm);
  const pWaveSeconds = Math.round((hypocenterDist / 6.0) * 10) / 10;
  const sWaveSeconds = Math.round((hypocenterDist / 3.5) * 10) / 10;
  const timeDifferenceSeconds = Math.max(0, Math.round((sWaveSeconds - pWaveSeconds) * 10) / 10);

  return {
    hypocenterDistKm: Math.round(hypocenterDist),
    pWaveSeconds,
    sWaveSeconds,
    timeDifferenceSeconds,
  };
}

/**
 * Colors based on magnitude (Richter / Moment Magnitude scale)
 */
export function getMagnitudeColor(mag: number | null): string {
  if (mag === null || isNaN(mag)) return '#94a3b8';
  if (mag < 3.0) return '#a3e635'; // Vibrant lime / greenish-yellow - minor
  if (mag < 4.5) return '#eab308'; // Warm yellow - light
  if (mag < 6.0) return '#f59e0b'; // Amber - moderate
  if (mag < 7.0) return '#f97316'; // Orange - strong
  return '#ef4444'; // Red - major / catastrophic
}

export function getMagnitudeTailwind(mag: number | null): {
  text: string;
  bg: string;
  border: string;
  badgeBg: string;
} {
  if (mag === null || isNaN(mag)) {
    return {
      text: 'text-slate-400',
      bg: 'bg-slate-800',
      border: 'border-slate-700',
      badgeBg: 'bg-slate-800/80',
    };
  }
  if (mag < 3.0) {
    return {
      text: 'text-lime-400',
      bg: 'bg-lime-950/40',
      border: 'border-lime-800/60',
      badgeBg: 'bg-lime-500/10',
    };
  }
  if (mag < 4.5) {
    return {
      text: 'text-yellow-400',
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-800/60',
      badgeBg: 'bg-yellow-500/10',
    };
  }
  if (mag < 6.0) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/60',
      badgeBg: 'bg-amber-500/10',
    };
  }
  if (mag < 7.0) {
    return {
      text: 'text-orange-400',
      bg: 'bg-orange-950/40',
      border: 'border-orange-800/60',
      badgeBg: 'bg-orange-500/10',
    };
  }
  return {
    text: 'text-rose-400',
    bg: 'bg-rose-950/50',
    border: 'border-rose-800/80',
    badgeBg: 'bg-rose-500/15',
  };
}

/**
 * Colors based on focal depth (km)
 * Shallow (0-70km): higher surface destruction
 * Intermediate (70-300km)
 * Deep (300km+)
 */
export function getDepthColor(depthKm: number): string {
  if (depthKm < 70) return '#f43f5e'; // Shallow - Rose/Red
  if (depthKm < 300) return '#f59e0b'; // Intermediate - Amber
  return '#8b5cf6'; // Deep - Violet
}

export function getDepthLabel(depthKm: number): { label: string; class: string } {
  if (depthKm < 70) return { label: 'Shallow (0-70km)', class: 'text-rose-400' };
  if (depthKm < 300) return { label: 'Intermediate (70-300km)', class: 'text-amber-400' };
  return { label: 'Deep (300km+)', class: 'text-violet-400' };
}

/**
 * Formats time elapsed relative to now
 */
export function formatTimeAgo(timestampMs: number): string {
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Mercalli Intensity scale (MMI) roman numerals and description
 */
export function getMmiDescription(mmi: number | null): { roman: string; description: string } {
  if (!mmi) return { roman: 'N/A', description: 'Not estimated' };
  const val = Math.round(mmi);
  switch (val) {
    case 1:
      return { roman: 'I', description: 'Not felt except by very few' };
    case 2:
      return { roman: 'II', description: 'Felt only by a few persons at rest' };
    case 3:
      return { roman: 'III', description: 'Felt noticeably indoors' };
    case 4:
      return { roman: 'IV', description: 'Felt indoors by many, outdoors by few' };
    case 5:
      return { roman: 'V', description: 'Felt by nearly everyone; dishes broken' };
    case 6:
      return { roman: 'VI', description: 'Felt by all; some heavy furniture moved' };
    case 7:
      return { roman: 'VII', description: 'Damage negligible in well-built buildings' };
    case 8:
      return { roman: 'VIII', description: 'Damage slight in specially designed structures' };
    case 9:
      return { roman: 'IX', description: 'Damage considerable in specially designed structures' };
    default:
      return { roman: 'X+', description: 'Disastrous destruction' };
  }
}
