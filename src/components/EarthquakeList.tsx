import React, { useMemo, useState } from 'react';
import { EarthquakeFeature, UserLocation } from '../types/earthquake';
import {
  getMagnitudeTailwind,
  getDepthLabel,
  formatTimeAgo,
} from '../utils/geoUtils';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Radio,
  Waves,
  MapPin,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface EarthquakeListProps {
  earthquakes: EarthquakeFeature[];
  selectedEarthquake: EarthquakeFeature | null;
  onSelectEarthquake: (quake: EarthquakeFeature) => void;
  userLocation: UserLocation | null;
  proximityKm: number;
  isLoading: boolean;
}

type QuickFilter = 'all' | 'm25' | 'm45' | 'm60' | 'significant' | 'near_me';
type SortOption = 'recent' | 'magnitude' | 'closest' | 'depth';

export const EarthquakeList: React.FC<EarthquakeListProps> = ({
  earthquakes,
  selectedEarthquake,
  onSelectEarthquake,
  userLocation,
  proximityKm,
  isLoading,
}) => {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const filteredAndSorted = useMemo(() => {
    let result = [...earthquakes];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (eq) =>
          eq.properties.place.toLowerCase().includes(q) ||
          eq.id.toLowerCase().includes(q)
      );
    }

    // Quick filter
    if (quickFilter === 'm25') {
      result = result.filter((eq) => (eq.properties.mag ?? 0) >= 2.5);
    } else if (quickFilter === 'm45') {
      result = result.filter((eq) => (eq.properties.mag ?? 0) >= 4.5);
    } else if (quickFilter === 'm60') {
      result = result.filter((eq) => (eq.properties.mag ?? 0) >= 6.0);
    } else if (quickFilter === 'significant') {
      result = result.filter(
        (eq) => (eq.properties.sig ?? 0) >= 600 || (eq.properties.mag ?? 0) >= 6.5
      );
    } else if (quickFilter === 'near_me') {
      if (userLocation) {
        result = result.filter(
          (eq) => (eq.distanceKm ?? Infinity) <= proximityKm
        );
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return b.properties.time - a.properties.time;
      }
      if (sortBy === 'magnitude') {
        return (b.properties.mag ?? 0) - (a.properties.mag ?? 0);
      }
      if (sortBy === 'closest') {
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      }
      if (sortBy === 'depth') {
        return a.geometry.coordinates[2] - b.geometry.coordinates[2];
      }
      return 0;
    });

    return result;
  }, [earthquakes, searchQuery, quickFilter, sortBy, userLocation, proximityKm]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search region, city, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-lime-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Filter Buttons (Interactive filter tabs allowed per frontend-design) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setQuickFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 ${
              quickFilter === 'all'
                ? 'bg-slate-800 text-lime-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            All ({earthquakes.length})
          </button>
          <button
            onClick={() => setQuickFilter('m25')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 ${
              quickFilter === 'm25'
                ? 'bg-slate-800 text-lime-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            M2.5+
          </button>
          <button
            onClick={() => setQuickFilter('m45')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 ${
              quickFilter === 'm45'
                ? 'bg-slate-800 text-amber-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            M4.5+
          </button>
          <button
            onClick={() => setQuickFilter('m60')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 ${
              quickFilter === 'm60'
                ? 'bg-slate-800 text-rose-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            M6.0+
          </button>
          <button
            onClick={() => setQuickFilter('significant')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 ${
              quickFilter === 'significant'
                ? 'bg-slate-800 text-rose-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Significant
          </button>
          {userLocation && (
            <button
              onClick={() => setQuickFilter('near_me')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 ${
                quickFilter === 'near_me'
                  ? 'bg-lime-950 text-lime-300 font-semibold border border-lime-700'
                  : 'text-lime-400 hover:text-lime-200 hover:bg-lime-950/40'
              }`}
            >
              Near Me
            </button>
          )}
        </div>

        {/* Sort & Result Counter Row */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
          <div className="text-[11px]">
            Showing <strong className="text-slate-200 tabular-nums">{filteredAndSorted.length}</strong> events
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border-0 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="magnitude">Highest Magnitude</option>
              {userLocation && <option value="closest">Closest to Me</option>}
              <option value="depth">Shallowest Depth</option>
            </select>
          </div>
        </div>
      </div>

      {/* Earthquake Feed List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            <div className="animate-spin w-5 h-5 border-2 border-lime-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading seismic telemetry...
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No earthquakes match the current filters.
          </div>
        ) : (
          filteredAndSorted.map((quake) => {
            const { properties, geometry } = quake;
            const mag = properties.mag ?? 0;
            const depth = geometry.coordinates[2];
            const magStyle = getMagnitudeTailwind(mag);
            const depthLabel = getDepthLabel(depth);
            const isSelected = selectedEarthquake?.id === quake.id;

            return (
              <div
                key={quake.id}
                onClick={() => onSelectEarthquake(quake)}
                className={`p-3 cursor-pointer transition-colors group flex items-start gap-3 ${
                  isSelected
                    ? 'bg-slate-800/90 border-l-2 border-l-lime-400'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Magnitude Badge */}
                <div
                  className={`w-12 h-11 shrink-0 rounded flex flex-col items-center justify-center font-mono border ${magStyle.text} ${magStyle.bg} ${magStyle.border}`}
                >
                  <span className="text-sm font-bold tabular-nums">
                    {mag.toFixed(1)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider opacity-80">
                    {properties.magType || 'MAG'}
                  </span>
                </div>

                {/* Info Container */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-xs font-semibold text-slate-200 truncate group-hover:text-lime-300 transition-colors">
                      {properties.place}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums">
                      {formatTimeAgo(properties.time)}
                    </span>
                  </div>

                  {/* Clean unboxed metadata with typographic separators per frontend-design */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-1">
                    <span className={depthLabel.class}>
                      {depth.toFixed(1)} km depth
                    </span>
                    <span aria-hidden="true">·</span>
                    {quake.distanceKm !== undefined ? (
                      <>
                        <span className="text-lime-400 tabular-nums">
                          {quake.distanceKm} km {quake.bearing || ''}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    ) : null}
                    {properties.felt ? (
                      <>
                        <span className="text-amber-400">
                          {properties.felt} felt
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    ) : null}
                    <span>{new Date(properties.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Tsunami Indicator */}
                  {properties.tsunami === 1 && (
                    <div className="flex items-center gap-1 text-[10px] text-rose-400 font-mono font-semibold mt-1">
                      <Waves className="w-3 h-3" />
                      <span>TSUNAMI WARNING POTENTIAL</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 shrink-0 self-center transition-colors" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
