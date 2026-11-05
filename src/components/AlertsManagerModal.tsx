import React, { useState } from 'react';
import { AlertSettings, TriggeredAlert, UserLocation } from '../types/earthquake';
import { playAlertSound } from '../utils/audioAlert';
import {
  Bell,
  Volume2,
  VolumeX,
  Radio,
  MapPin,
  Check,
  X,
  Play,
  Shield,
  Trash2,
  Sliders,
} from 'lucide-react';

interface AlertsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings;
  onUpdateSettings: (settings: AlertSettings) => void;
  userLocation: UserLocation | null;
  onUpdateUserLocation: (loc: UserLocation | null) => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
  triggeredAlerts: TriggeredAlert[];
  onClearAlertsHistory: () => void;
}

const PRESET_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Tokyo, Japan', lat: 35.676, lng: 139.65 },
  { name: 'San Francisco, CA, USA', lat: 37.7749, lng: -122.4194 },
  { name: 'Los Angeles, CA, USA', lat: 34.0522, lng: -118.2437 },
  { name: 'Seattle, WA, USA', lat: 47.6062, lng: -122.3321 },
  { name: 'Anchorage, AK, USA', lat: 61.2181, lng: -149.9003 },
  { name: 'Santiago, Chile', lat: -33.4489, lng: -70.6693 },
  { name: 'Istanbul, Turkey', lat: 41.0082, lng: 28.9784 },
  { name: 'Christchurch, New Zealand', lat: -43.5321, lng: 172.6362 },
  { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332 },
  { name: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456 },
  { name: 'Manila, Philippines', lat: 14.5995, lng: 120.9842 },
  { name: 'Rome, Italy', lat: 41.9028, lng: 12.4964 },
];

export const AlertsManagerModal: React.FC<AlertsManagerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  userLocation,
  onUpdateUserLocation,
  onDetectLocation,
  isDetectingLocation,
  triggeredAlerts,
  onClearAlertsHistory,
}) => {
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  if (!isOpen) return null;

  const handleSoundTest = () => {
    playAlertSound(settings.soundType, settings.volume);
  };

  const handleRequestNotification = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        onUpdateSettings({ ...settings, notifyBrowser: true });
        new Notification('SeismoAlert Active', {
          body: 'Real-time earthquake alerts are now armed for your location.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-lime-400" />
            <h2 className="text-base font-bold text-slate-100 uppercase font-mono tracking-wider">
              Alerts & Proximity Engine
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: User Location & Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-lime-400" />
                <span>Observer / Home Base Location</span>
              </span>
              <button
                onClick={onDetectLocation}
                disabled={isDetectingLocation}
                className="text-xs font-mono text-lime-400 hover:text-lime-300 disabled:text-slate-600 transition-colors"
              >
                {isDetectingLocation ? 'Acquiring GPS...' : 'Auto-Detect GPS'}
              </button>
            </div>

            {userLocation ? (
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                <div>
                  <div className="font-semibold text-slate-100">{userLocation.name}</div>
                  <div className="text-slate-400 text-[11px]">
                    {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                  </div>
                </div>
                <button
                  onClick={() => onUpdateUserLocation(null)}
                  className="text-slate-500 hover:text-rose-400 text-[11px]"
                >
                  Clear Location
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/60 border border-dashed border-slate-800 rounded-lg text-xs text-slate-400">
                No location selected. Pick a seismic hotspot city below or detect your coordinates:
              </div>
            )}

            {/* City Preset dropdown */}
            <div>
              <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Select Hotspot City Preset
              </span>
              <select
                onChange={(e) => {
                  const city = PRESET_CITIES.find((c) => c.name === e.target.value);
                  if (city) {
                    onUpdateUserLocation({ lat: city.lat, lng: city.lng, name: city.name, isCustom: true });
                  }
                }}
                defaultValue=""
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-lime-500"
              >
                <option value="" disabled>
                  Choose a location...
                </option>
                {PRESET_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Proximity Radius */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Proximity Alert Radius:</span>
                <span className="text-lime-400 font-bold">{settings.proximityKm} km</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={settings.proximityKm}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, proximityKm: parseInt(e.target.value) })
                }
                className="w-full accent-lime-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                <span>100 km (Immediate)</span>
                <span>2,500 km</span>
                <span>5,000 km (Continental)</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Section 2: Magnitude Threshold */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Magnitude Alert Filter</span>
            </span>

            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Minimum Alert Magnitude:</span>
                <span className="text-amber-400 font-bold">M{settings.minMagnitude.toFixed(1)}+</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="7.0"
                step="0.5"
                value={settings.minMagnitude}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, minMagnitude: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                <span>M2.0 (All felt)</span>
                <span>M4.5 (Moderate)</span>
                <span>M6.0 (Strong)</span>
                <span>M7.0 (Major)</span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings.alertOnlyNearMe}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, alertOnlyNearMe: e.target.checked })
                }
                className="rounded accent-lime-400"
              />
              <span>Only alert if within my proximity zone ({settings.proximityKm} km)</span>
            </label>
          </div>

          <hr className="border-slate-800" />

          {/* Section 3: Audio Synthesizer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200 flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-lime-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span>Acoustic Wave Alert (Web Audio)</span>
              </span>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, soundEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lime-500"></div>
              </label>
            </div>

            {settings.soundEnabled && (
              <div className="space-y-3 p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, soundType: 'sonar' })}
                    className={`p-2 rounded border text-center transition-colors ${
                      settings.soundType === 'sonar'
                        ? 'bg-lime-950 border-lime-600 text-lime-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sonar Ping
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, soundType: 'pulse' })}
                    className={`p-2 rounded border text-center transition-colors ${
                      settings.soundType === 'pulse'
                        ? 'bg-lime-950 border-lime-600 text-lime-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Seismic Pulse
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, soundType: 'siren' })}
                    className={`p-2 rounded border text-center transition-colors ${
                      settings.soundType === 'siren'
                        ? 'bg-rose-950 border-rose-600 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Urgent Siren
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                      Volume: {Math.round(settings.volume * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.volume}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })
                      }
                      className="w-full accent-lime-400 cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSoundTest}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs transition-colors shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 text-lime-400" />
                    <span>Test Sound</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-800" />

          {/* Section 4: Browser Push Notifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Browser System Notifications</span>
              </span>

              {browserPermission === 'granted' ? (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Armed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs transition-colors"
                >
                  Grant Permission
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Receive instant desktop notifications for significant earthquakes even when the tab is in the background.
            </p>
          </div>

          <hr className="border-slate-800" />

          {/* Section 5: Triggered Alerts History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">
                Triggered Alerts This Session ({triggeredAlerts.length})
              </span>
              {triggeredAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAlertsHistory}
                  className="text-xs font-mono text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {triggeredAlerts.length === 0 ? (
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs font-mono text-slate-500 text-center">
                No alert thresholds triggered yet during this session.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {triggeredAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-2.5 bg-slate-950/80 border border-slate-800 rounded flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">M{alt.magnitude.toFixed(1)}</span>
                        <span className="text-slate-300 font-sans truncate max-w-[200px]">
                          {alt.place}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(alt.time).toLocaleTimeString()}
                        {alt.distanceKm ? ` · ${alt.distanceKm} km away` : ''}
                      </div>
                    </div>
                    {alt.isTsunami && (
                      <span className="text-[10px] text-rose-400 uppercase font-bold border border-rose-800 px-1.5 py-0.5 rounded">
                        Tsunami
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
          >
            Save & Arm Alerts
          </button>
        </div>
      </div>
    </div>
  );
};
