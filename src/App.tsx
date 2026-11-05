/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  EarthquakeFeature,
  UserLocation,
  AlertSettings,
  HistoricalFilter,
  TriggeredAlert,
  FamousEarthquake,
} from './types/earthquake';
import {
  USGS_FEEDS,
  FeedKey,
  fetchLiveFeed,
  fetchHistoricalData,
} from './services/usgsApi';
import {
  calculateDistanceKm,
  calculateBearing,
  estimateWaveTimes,
} from './utils/geoUtils';
import { playAlertSound } from './utils/audioAlert';
import { Header } from './components/Header';
import { EarthquakeMap, MapTileTheme } from './components/EarthquakeMap';
import { EarthquakeList } from './components/EarthquakeList';
import { EarthquakeDetailModal } from './components/EarthquakeDetailModal';
import { HistoricalArchivePanel } from './components/HistoricalArchivePanel';
import { AlertsManagerModal } from './components/AlertsManagerModal';
import { SafetyGuideModal } from './components/SafetyGuideModal';
import {
  Activity,
  Radio,
  MapPin,
  Waves,
  ShieldAlert,
  Flame,
  Clock,
  List,
  Map as MapIcon,
  Filter,
} from 'lucide-react';

export default function App() {
  // Navigation & View States
  const [activeView, setActiveView] = useState<'live' | 'historical'>('live');
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  // Live Feed State - Default to 1 Day (All earthquakes that happened that day)
  const [selectedFeed, setSelectedFeed] = useState<FeedKey>('day_all');
  const [rawEarthquakes, setRawEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(60);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  // Historical Feed State
  const [historicalFilter, setHistoricalFilter] = useState<HistoricalFilter>(() => {
    const d = new Date();
    const end = d.toISOString().split('T')[0];
    const prev = new Date();
    prev.setDate(d.getDate() - 7);
    const start = prev.toISOString().split('T')[0];
    return {
      startDate: start,
      endDate: end,
      minMag: 4.5,
      maxMag: 10.0,
      locationName: '',
      limit: 150,
      orderBy: 'time',
    };
  });
  const [historicalEarthquakes, setHistoricalEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState<boolean>(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  // Selected for Deep Inspection
  const [selectedEarthquake, setSelectedEarthquake] = useState<EarthquakeFeature | null>(null);

  // Modals
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);

  // User Location
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    try {
      const saved = localStorage.getItem('seismo_user_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);

  // Alert Settings
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(() => {
    try {
      const saved = localStorage.getItem('seismo_alert_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      soundEnabled: true,
      soundType: 'sonar',
      volume: 0.5,
      minMagnitude: 4.5,
      proximityKm: 1500,
      notifyBrowser: false,
      alertOnlyNearMe: false,
    };
  });
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);

  // Map Appearance Options - Default to Google Maps
  const [tileTheme, setTileTheme] = useState<MapTileTheme>('google-roadmap');
  const [colorMode, setColorMode] = useState<'depth' | 'magnitude'>('depth');
  const [showTectonicPlates, setShowTectonicPlates] = useState<boolean>(true);
  const [showSeismicWaves, setShowSeismicWaves] = useState<boolean>(true);

  // Persist user location & alerts
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('seismo_user_location', JSON.stringify(userLocation));
    }
  }, [userLocation]);

  useEffect(() => {
    localStorage.setItem('seismo_alert_settings', JSON.stringify(alertSettings));
  }, [alertSettings]);

  // Geolocation detector
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingLocation(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({
          lat,
          lng,
          name: `GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setIsDetectingLocation(false);
        console.warn('Geolocation error:', err.message);
        // Fallback default if denied: Tokyo or San Francisco
        setUserLocation({
          lat: 37.7749,
          lng: -122.4194,
          name: 'San Francisco, CA (Default)',
          isCustom: true,
        });
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  // On first mount, try detecting location if empty
  useEffect(() => {
    if (!userLocation) {
      handleDetectLocation();
    }
  }, [userLocation, handleDetectLocation]);

  // Check incoming events for alerts
  const evaluateAlerts = useCallback(
    (features: EarthquakeFeature[]) => {
      if (!alertSettings.enabled) return;

      const newAlerts: TriggeredAlert[] = [];

      for (const feat of features) {
        // If already seen, skip
        if (seenEventIdsRef.current.has(feat.id)) continue;
        seenEventIdsRef.current.add(feat.id);

        const mag = feat.properties.mag ?? 0;
        const [lng, lat] = feat.geometry.coordinates;
        let distKm: number | undefined;

        if (userLocation) {
          distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
        }

        const isTsunami = feat.properties.tsunami === 1;
        const meetsMag = mag >= alertSettings.minMagnitude;
        const meetsProximity =
          !alertSettings.alertOnlyNearMe || (distKm !== undefined && distKm <= alertSettings.proximityKm);

        if ((meetsMag && meetsProximity) || (isTsunami && meetsProximity)) {
          const alertItem: TriggeredAlert = {
            id: `${feat.id}-${Date.now()}`,
            earthquakeId: feat.id,
            title: `M${mag.toFixed(1)} - ${feat.properties.place}`,
            magnitude: mag,
            place: feat.properties.place,
            time: feat.properties.time,
            distanceKm: distKm,
            isTsunami,
          };
          newAlerts.push(alertItem);
        }
      }

      if (newAlerts.length > 0) {
        setTriggeredAlerts((prev) => [...newAlerts, ...prev].slice(0, 50));

        // Play audio alert
        if (alertSettings.soundEnabled) {
          const hasMajor = newAlerts.some((a) => a.magnitude >= 6.0 || a.isTsunami);
          playAlertSound(hasMajor ? 'siren' : alertSettings.soundType, alertSettings.volume);
        }

        // Browser notification
        if (
          alertSettings.notifyBrowser &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          const topAlert = newAlerts[0];
          new Notification(`⚠️ Earthquake Alert: M${topAlert.magnitude.toFixed(1)}`, {
            body: `${topAlert.place}${topAlert.distanceKm ? ` · ${topAlert.distanceKm}km away` : ''}`,
            icon: '/favicon.ico',
          });
        }
      }
    },
    [alertSettings, userLocation]
  );

  // Load Real-time Feed
  const loadLiveFeed = useCallback(async () => {
    setIsLiveLoading(true);
    setLiveError(null);
    try {
      const feedUrl = USGS_FEEDS[selectedFeed].url;
      const data = await fetchLiveFeed(feedUrl);
      setRawEarthquakes(data.features || []);

      // If first load, seed seen set without blasting alerts
      if (seenEventIdsRef.current.size === 0) {
        data.features.forEach((f) => seenEventIdsRef.current.add(f.id));
      } else {
        evaluateAlerts(data.features || []);
      }
      setSecondsUntilRefresh(60);
    } catch (err: unknown) {
      setLiveError(err instanceof Error ? err.message : 'Failed to fetch USGS feed');
    } finally {
      setIsLiveLoading(false);
    }
  }, [selectedFeed, evaluateAlerts]);

  // Polling Interval for Live Feed (every 60s)
  useEffect(() => {
    loadLiveFeed();

    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          loadLiveFeed();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadLiveFeed]);

  // Execute Historical Query
  const handleExecuteHistoricalQuery = useCallback(async (filter: HistoricalFilter) => {
    setIsHistoricalLoading(true);
    setHistoricalError(null);
    try {
      const data = await fetchHistoricalData(filter);
      setHistoricalEarthquakes(data.features || []);
      if (data.features && data.features.length > 0) {
        setSelectedEarthquake(data.features[0]);
      }
    } catch (err: unknown) {
      setHistoricalError(err instanceof Error ? err.message : 'Error executing historical query');
    } finally {
      setIsHistoricalLoading(false);
    }
  }, []);

  // Handle click on famous earthquake preset
  const handleSelectFamous = useCallback(
    (famous: FamousEarthquake) => {
      const newFilter: HistoricalFilter = {
        startDate: famous.startDate,
        endDate: famous.endDate,
        minMag: Math.max(1.0, famous.magnitude - 1.5),
        maxMag: 10.0,
        locationName: '',
        lat: famous.coordinates[0],
        lng: famous.coordinates[1],
        radiusKm: 600,
        limit: 100,
        orderBy: 'magnitude',
      };
      setHistoricalFilter(newFilter);
      handleExecuteHistoricalQuery(newFilter);
    },
    [handleExecuteHistoricalQuery]
  );

  // Compute distance and wave times for display features
  const activeFeatures = activeView === 'live' ? rawEarthquakes : historicalEarthquakes;

  const processedFeatures = useMemo(() => {
    return activeFeatures.map((f) => {
      const [lng, lat, depth] = f.geometry.coordinates;
      let distKm: number | undefined;
      let bearing: string | undefined;
      let pWaveEtaSeconds: number | undefined;
      let sWaveEtaSeconds: number | undefined;

      if (userLocation) {
        distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
        bearing = calculateBearing(userLocation.lat, userLocation.lng, lat, lng);
        const waveEstimates = estimateWaveTimes(distKm, depth);
        pWaveEtaSeconds = waveEstimates.pWaveSeconds;
        sWaveEtaSeconds = waveEstimates.sWaveSeconds;
      }

      return {
        ...f,
        distanceKm: distKm,
        bearing,
        pWaveEtaSeconds,
        sWaveEtaSeconds,
      };
    });
  }, [activeFeatures, userLocation]);

  // Aggregate Key Statistics for Telemetry Strip (Rule §13: 4-column KPI strip in full-width row)
  const stats = useMemo(() => {
    if (processedFeatures.length === 0) {
      return { maxMag: 0, count: 0, closestDist: null, tsunamiCount: 0, avgDepth: 0 };
    }

    let maxMag = 0;
    let tsunamiCount = 0;
    let totalDepth = 0;
    let closestDist: number | null = null;

    processedFeatures.forEach((q) => {
      const m = q.properties.mag ?? 0;
      if (m > maxMag) maxMag = m;
      if (q.properties.tsunami === 1) tsunamiCount++;
      totalDepth += q.geometry.coordinates[2];
      if (q.distanceKm !== undefined) {
        if (closestDist === null || q.distanceKm < closestDist) {
          closestDist = q.distanceKm;
        }
      }
    });

    return {
      maxMag,
      count: processedFeatures.length,
      closestDist,
      tsunamiCount,
      avgDepth: Math.round(totalDepth / processedFeatures.length),
    };
  }, [processedFeatures]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 3-Zone Top Navigation Bar */}
      <Header
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          if (view === 'historical' && historicalEarthquakes.length === 0) {
            handleExecuteHistoricalQuery(historicalFilter);
          }
        }}
        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
        onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
        alertSettings={alertSettings}
        liveQuakeCount={processedFeatures.length}
        isRefreshing={isLiveLoading}
        onRefreshLive={loadLiveFeed}
        secondsUntilRefresh={secondsUntilRefresh}
      />

      {/* KPI Telemetry Strip (Science & Telemetry aesthetic per frontend-design) */}
      <div className="px-6 py-2 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
        <div className="flex items-center gap-6 overflow-x-auto">
          {/* Active Feed or Query label with 1 Day, 7 Days, 30 Days Quick Switch */}
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Timeframe:</span>
            {activeView === 'live' ? (
              <div className="flex items-center gap-1">
                <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setSelectedFeed('day_all')}
                    title="All earthquakes that happened today / past 24 hours"
                    className={`px-2 py-0.5 rounded font-semibold transition-colors whitespace-nowrap ${
                      selectedFeed === 'day_all'
                        ? 'bg-lime-950 text-lime-400 border border-lime-700/80'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1 Day
                  </button>
                  <button
                    onClick={() => setSelectedFeed('week_all')}
                    title="All earthquakes that happened within the past 7 days"
                    className={`px-2 py-0.5 rounded font-semibold transition-colors whitespace-nowrap ${
                      selectedFeed === 'week_all'
                        ? 'bg-lime-950 text-lime-400 border border-lime-700/80'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setSelectedFeed('month_all')}
                    title="All earthquakes that happened within the past 30 days"
                    className={`px-2 py-0.5 rounded font-semibold transition-colors whitespace-nowrap ${
                      selectedFeed === 'month_all'
                        ? 'bg-lime-950 text-lime-400 border border-lime-700/80'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setSelectedFeed('hour_all')}
                    title="Recent earthquakes in past hour"
                    className={`px-2 py-0.5 rounded font-semibold transition-colors whitespace-nowrap ${
                      selectedFeed === 'hour_all'
                        ? 'bg-lime-950 text-lime-400 border border-lime-700/80'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1 Hour
                  </button>
                </div>

                <select
                  value={selectedFeed}
                  onChange={(e) => setSelectedFeed(e.target.value as FeedKey)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none cursor-pointer hidden md:block"
                >
                  {Object.entries(USGS_FEEDS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-lime-400 font-semibold">
                Historical Query ({historicalFilter.startDate} to {historicalFilter.endDate})
              </span>
            )}
          </div>

          <div className="h-3.5 w-px bg-slate-800"></div>

          {/* KPI 1: Max Magnitude */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">PEAK:</span>
            <span
              className={`font-bold tabular-nums ${
                stats.maxMag >= 6.0 ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              M{stats.maxMag.toFixed(1)}
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800"></div>

          {/* KPI 2: Event Count */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">LOGGED:</span>
            <span className="font-bold text-slate-200 tabular-nums">{stats.count}</span>
          </div>

          <div className="h-3.5 w-px bg-slate-800"></div>

          {/* KPI 3: Proximity to User */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">CLOSEST:</span>
            <span className="font-bold text-lime-400 tabular-nums">
              {stats.closestDist !== null ? `${stats.closestDist} km` : 'No observer pin'}
            </span>
          </div>

          {/* KPI 4: Tsunami alerts */}
          {stats.tsunamiCount > 0 && (
            <>
              <div className="h-3.5 w-px bg-slate-800"></div>
              <div className="flex items-center gap-1 text-rose-400 font-mono font-bold animate-pulse">
                <Waves className="w-3.5 h-3.5" />
                <span>{stats.tsunamiCount} TSUNAMI HAZARD</span>
              </div>
            </>
          )}
        </div>

        {/* User Location Indicator / Fast Switch */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span className="truncate max-w-[200px] text-slate-300">
              {userLocation ? userLocation.name : 'Location unset'}
            </span>
          </div>

          {/* Mobile Map / List tab switcher */}
          <div className="flex lg:hidden bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setMobileTab('map')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                mobileTab === 'map' ? 'bg-slate-800 text-lime-400 font-bold' : 'text-slate-400'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setMobileTab('list')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                mobileTab === 'list' ? 'bg-slate-800 text-lime-400 font-bold' : 'text-slate-400'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Historical Query Filter Accordion/Panel if in historical view */}
      {activeView === 'historical' && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <HistoricalArchivePanel
            filter={historicalFilter}
            onFilterChange={setHistoricalFilter}
            onExecuteQuery={handleExecuteHistoricalQuery}
            isLoading={isHistoricalLoading}
            error={historicalError}
            resultCount={historicalEarthquakes.length}
            userLocation={userLocation}
            onSelectFamous={handleSelectFamous}
          />
        </div>
      )}

      {/* Main Workspace Stage: Interactive Map + Telemetry Feed List */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left/Main Map Stage */}
        <div
          className={`flex-1 h-full relative ${
            mobileTab === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <EarthquakeMap
            earthquakes={processedFeatures}
            selectedEarthquake={selectedEarthquake}
            onSelectEarthquake={(q) => setSelectedEarthquake(q)}
            userLocation={userLocation}
            proximityKm={alertSettings.proximityKm}
            tileTheme={tileTheme}
            onTileThemeChange={setTileTheme}
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            showTectonicPlates={showTectonicPlates}
            onToggleTectonicPlates={() => setShowTectonicPlates(!showTectonicPlates)}
            showSeismicWaves={showSeismicWaves}
            onToggleSeismicWaves={() => setShowSeismicWaves(!showSeismicWaves)}
          />
        </div>

        {/* Right Telemetry List Column */}
        <div
          className={`w-full lg:w-[420px] xl:w-[460px] h-full shrink-0 z-10 ${
            mobileTab === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          <EarthquakeList
            earthquakes={processedFeatures}
            selectedEarthquake={selectedEarthquake}
            onSelectEarthquake={(q) => setSelectedEarthquake(q)}
            userLocation={userLocation}
            proximityKm={alertSettings.proximityKm}
            isLoading={activeView === 'live' ? isLiveLoading : isHistoricalLoading}
          />
        </div>
      </div>

      {/* Earthquake Deep Telemetry Modal */}
      {selectedEarthquake && (
        <EarthquakeDetailModal
          earthquake={selectedEarthquake}
          onClose={() => setSelectedEarthquake(null)}
          userLocation={userLocation}
          onFocusMap={(q) => {
            setSelectedEarthquake(q);
            setMobileTab('map');
          }}
        />
      )}

      {/* Alerts & Sound Engine Modal */}
      <AlertsManagerModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        settings={alertSettings}
        onUpdateSettings={setAlertSettings}
        userLocation={userLocation}
        onUpdateUserLocation={setUserLocation}
        onDetectLocation={handleDetectLocation}
        isDetectingLocation={isDetectingLocation}
        triggeredAlerts={triggeredAlerts}
        onClearAlertsHistory={() => setTriggeredAlerts([])}
      />

      {/* Safety Protocol & Preparedness Guide Modal */}
      <SafetyGuideModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />
    </div>
  );
}
