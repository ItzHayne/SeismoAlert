import React from 'react';
import { EarthquakeFeature, UserLocation } from '../types/earthquake';
import {
  getMagnitudeTailwind,
  getDepthLabel,
  formatTimeAgo,
  getMmiDescription,
  estimateWaveTimes,
} from '../utils/geoUtils';
import { SeismogramVisualizer } from './SeismogramVisualizer';
import {
  X,
  ExternalLink,
  MapPin,
  Clock,
  Compass,
  AlertTriangle,
  Waves,
  Radio,
  Share2,
  Check,
} from 'lucide-react';

interface EarthquakeDetailModalProps {
  earthquake: EarthquakeFeature | null;
  onClose: () => void;
  userLocation: UserLocation | null;
  onFocusMap: (quake: EarthquakeFeature) => void;
}

export const EarthquakeDetailModal: React.FC<EarthquakeDetailModalProps> = ({
  earthquake,
  onClose,
  userLocation,
  onFocusMap,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!earthquake) return null;

  const { properties, geometry } = earthquake;
  const [lng, lat, depth] = geometry.coordinates;
  const mag = properties.mag ?? 0;
  const magStyle = getMagnitudeTailwind(mag);
  const depthInfo = getDepthLabel(depth);
  const mmiInfo = getMmiDescription(properties.mmi);

  const observerDist = earthquake.distanceKm ?? 0;
  const waveEstimates = observerDist > 0 ? estimateWaveTimes(observerDist, depth) : null;

  const eventDate = new Date(properties.time);
  const utcDateStr = eventDate.toUTCString();
  const localDateStr = eventDate.toLocaleString();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(properties.url || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span
              className={`font-mono font-bold text-2xl tabular-nums px-2.5 py-0.5 rounded border ${magStyle.text} ${magStyle.bg} ${magStyle.border}`}
            >
              M{mag.toFixed(1)}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 truncate max-w-md">
                {properties.place}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span>{formatTimeAgo(properties.time)}</span>
                <span aria-hidden="true">·</span>
                <span>USGS ID: {earthquake.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy event link"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Tsunami or Significant Alert Banner */}
          {properties.tsunami === 1 && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-200">
              <Waves className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold uppercase font-mono tracking-wider text-rose-300">
                  Tsunami Warning / Advisory Flagged
                </div>
                <div className="text-rose-200/90 mt-0.5">
                  USGS flagged oceanic displacement potential for this event. Monitor official coastal warning sirens and NOAA/PTWC bulletins immediately if near coasts.
                </div>
              </div>
            </div>
          )}

          {/* Core Technical Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Focal Depth
              </span>
              <div className="text-lg font-mono font-bold text-slate-100 tabular-nums">
                {depth.toFixed(1)} <span className="text-xs text-slate-400 font-normal">km</span>
              </div>
              <div className={`text-[11px] mt-0.5 font-medium ${depthInfo.class}`}>
                {depthInfo.label}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Coordinates
              </span>
              <div className="text-sm font-mono font-semibold text-slate-100 tabular-nums">
                {lat.toFixed(3)}°N
              </div>
              <div className="text-sm font-mono font-semibold text-slate-100 tabular-nums">
                {lng.toFixed(3)}°E
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Felt Reports (DYFI)
              </span>
              <div className="text-lg font-mono font-bold text-slate-100 tabular-nums">
                {properties.felt ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {properties.felt ? `${properties.felt} user submissions` : 'None logged yet'}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Max Intensity (MMI)
              </span>
              <div className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                {mmiInfo.roman}
              </div>
              <div className="text-[11px] text-slate-400 truncate" title={mmiInfo.description}>
                {mmiInfo.description}
              </div>
            </div>
          </div>

          {/* Observer Proximity & Wave Arrival Times */}
          {userLocation && observerDist > 0 && waveEstimates && (
            <div className="p-4 bg-lime-950/20 border border-lime-700/40 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-lime-400" />
                  <span className="text-xs font-semibold uppercase font-mono tracking-wider text-lime-300">
                    Proximity To Your Location ({userLocation.name})
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-lime-400 tabular-nums">
                  {observerDist} km {earthquake.bearing ? `(${earthquake.bearing})` : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono mt-3">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">P-Wave Travel</span>
                  <span className="text-lime-400 font-semibold tabular-nums text-sm">
                    ~{waveEstimates.pWaveSeconds} seconds
                  </span>
                  <span className="text-[10px] text-slate-500 block">Compressional ~6km/s</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">S-Wave Travel</span>
                  <span className="text-amber-400 font-semibold tabular-nums text-sm">
                    ~{waveEstimates.sWaveSeconds} seconds
                  </span>
                  <span className="text-[10px] text-slate-500 block">Shear wave ~3.5km/s</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Warning Horizon</span>
                  <span className="text-slate-200 font-semibold tabular-nums text-sm">
                    ~{waveEstimates.timeDifferenceSeconds}s interval
                  </span>
                  <span className="text-[10px] text-slate-500 block">Between P and S waves</span>
                </div>
              </div>
            </div>
          )}

          {/* Synthetic Seismogram Simulation */}
          <SeismogramVisualizer
            earthquake={earthquake}
            observerDistanceKm={observerDist > 0 ? observerDist : 350}
          />

          {/* Timestamps & Technical Details */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between text-slate-400">
              <span>Event UTC Time:</span>
              <span className="font-mono text-slate-200">{utcDateStr}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between text-slate-400">
              <span>Your Local Time:</span>
              <span className="font-mono text-slate-200">{localDateStr}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between text-slate-400">
              <span>Data Review Status:</span>
              <span className="font-mono text-slate-200 capitalize">{properties.status}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between text-slate-400">
              <span>Magnitude Type:</span>
              <span className="font-mono text-slate-200 uppercase">{properties.magType || 'M'}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={() => {
              onFocusMap(earthquake);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <MapPin className="w-4 h-4 text-lime-400" />
            <span>Focus on Map</span>
          </button>

          {properties.url && (
            <a
              href={properties.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1.5 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              <span>View USGS Official Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
