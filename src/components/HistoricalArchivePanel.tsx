import React, { useState } from 'react';
import { HistoricalFilter, FamousEarthquake, UserLocation } from '../types/earthquake';
import { FAMOUS_EARTHQUAKES } from '../data/famousEarthquakes';
import { Search, Calendar, Sliders, MapPin, Sparkles, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

interface HistoricalArchivePanelProps {
  filter: HistoricalFilter;
  onFilterChange: (newFilter: HistoricalFilter) => void;
  onExecuteQuery: (filter: HistoricalFilter) => void;
  isLoading: boolean;
  error: string | null;
  resultCount: number;
  userLocation: UserLocation | null;
  onSelectFamous: (famous: FamousEarthquake) => void;
}

export const HistoricalArchivePanel: React.FC<HistoricalArchivePanelProps> = ({
  filter,
  onFilterChange,
  onExecuteQuery,
  isLoading,
  error,
  resultCount,
  userLocation,
  onSelectFamous,
}) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'famous'>('custom');

  const handleInputChange = (field: keyof HistoricalFilter, value: any) => {
    onFilterChange({
      ...filter,
      [field]: value,
    });
  };

  const handleUseMyLocation = () => {
    if (userLocation) {
      onFilterChange({
        ...filter,
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusKm: filter.radiusKm || 1000,
        locationName: `Within 1000km of ${userLocation.name}`,
      });
    }
  };

  const handleClearLocationRadius = () => {
    onFilterChange({
      ...filter,
      lat: undefined,
      lng: undefined,
      radiusKm: undefined,
      locationName: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteQuery(filter);
  };

  // Quick Date presets
  const applyDatePreset = (preset: '30days' | 'year2023' | 'year2011' | 'alltime_m8') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === '30days') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      onFilterChange({
        ...filter,
        startDate: past30.toISOString().split('T')[0],
        endDate: todayStr,
        minMag: 5.0,
      });
    } else if (preset === 'year2023') {
      onFilterChange({
        ...filter,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        minMag: 6.5,
      });
    } else if (preset === 'year2011') {
      onFilterChange({
        ...filter,
        startDate: '2011-03-01',
        endDate: '2011-03-31',
        minMag: 6.0,
      });
    } else if (preset === 'alltime_m8') {
      onFilterChange({
        ...filter,
        startDate: '1970-01-01',
        endDate: todayStr,
        minMag: 8.0,
        maxMag: 10.0,
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider">
            USGS Historical Earthquake Archive
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Query past seismic events dating back decades by date, magnitude, depth, and geography
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'custom'
                ? 'bg-slate-800 text-lime-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Query
          </button>
          <button
            onClick={() => setActiveTab('famous')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'famous'
                ? 'bg-slate-800 text-lime-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Famous Events Archive
          </button>
        </div>
      </div>

      {activeTab === 'custom' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Presets Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 shrink-0">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyDatePreset('30days')}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 hover:text-slate-200 rounded text-slate-300 font-mono transition-colors whitespace-nowrap shrink-0"
            >
              Past 30 Days (M5.0+)
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('alltime_m8')}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 hover:text-slate-200 rounded text-slate-300 font-mono transition-colors whitespace-nowrap shrink-0"
            >
              Great Quakes (M8.0+ Since 1970)
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('year2023')}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 hover:text-slate-200 rounded text-slate-300 font-mono transition-colors whitespace-nowrap shrink-0"
            >
              Year 2023 (M6.5+)
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('year2011')}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 hover:text-slate-200 rounded text-slate-300 font-mono transition-colors whitespace-nowrap shrink-0"
            >
              March 2011 Tohoku Month
            </button>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-1.5">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">From</span>
                  <input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-lime-500"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">To</span>
                  <input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-lime-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Magnitude Range */}
            <div>
              <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-1.5">
                Magnitude Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Min (M)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="10.0"
                    value={filter.minMag}
                    onChange={(e) => handleInputChange('minMag', parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-lime-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Max (M)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="10.0"
                    value={filter.maxMag}
                    onChange={(e) => handleInputChange('maxMag', parseFloat(e.target.value) || 10.0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>
            </div>

            {/* Location or Region */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
                  Location / Region
                </label>
                {userLocation && (
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="text-[10px] font-mono text-lime-400 hover:text-lime-300 transition-colors"
                  >
                    Near Me
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. California, Japan, Chile..."
                  value={filter.locationName}
                  onChange={(e) => handleInputChange('locationName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-lime-500"
                />
                {filter.radiusKm && (
                  <button
                    type="button"
                    onClick={handleClearLocationRadius}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                  >
                    Clear Radius
                  </button>
                )}
              </div>
            </div>

            {/* Depth & Sort */}
            <div>
              <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-1.5">
                Sort & Depth
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Order</span>
                  <select
                    value={filter.orderBy}
                    onChange={(e) => handleInputChange('orderBy', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-lime-500"
                  >
                    <option value="time">Time (Newest)</option>
                    <option value="time-asc">Time (Oldest)</option>
                    <option value="magnitude">Mag (Highest)</option>
                    <option value="magnitude-asc">Mag (Lowest)</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Max Depth</span>
                  <select
                    value={filter.maxDepth ?? 700}
                    onChange={(e) => handleInputChange('maxDepth', parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-lime-500"
                  >
                    <option value={700}>All Depths (0-700km)</option>
                    <option value={70}>Shallow only (&lt;70km)</option>
                    <option value={300}>Intermediate (&lt;300km)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs font-mono text-slate-400">
              {resultCount > 0 && (
                <span>
                  Found <strong className="text-lime-400 tabular-nums">{resultCount}</strong> events for this historical query
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 bg-lime-500 hover:bg-lime-400 disabled:bg-lime-900/50 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-lg shadow-lime-950"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying USGS Archive...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Historical Earthquakes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Famous Earthquakes Catalogue */
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Click any milestone earthquake to automatically query its seismic sequence and inspect its epicenter on the map:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {FAMOUS_EARTHQUAKES.map((famous) => (
              <div
                key={famous.id}
                className="p-3 bg-slate-950/70 border border-slate-800 hover:border-lime-600/80 rounded-lg transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-rose-400 tabular-nums">
                      M{famous.magnitude.toFixed(1)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {famous.dateStr}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-slate-200 mt-1 group-hover:text-lime-300 transition-colors">
                    {famous.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {famous.location}
                  </div>
                  <p className="text-[11px] text-slate-400/90 mt-2 line-clamp-2">
                    {famous.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    Depth: {famous.depthKm}km {famous.tsunami ? '· Tsunami' : ''}
                  </span>
                  <button
                    onClick={() => onSelectFamous(famous)}
                    className="flex items-center gap-1 text-xs font-mono font-semibold text-lime-400 hover:text-lime-300"
                  >
                    <span>Load Sequence</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
