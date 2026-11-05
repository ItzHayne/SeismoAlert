import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { EarthquakeFeature, UserLocation } from '../types/earthquake';
import { getMagnitudeColor, getDepthColor, formatTimeAgo } from '../utils/geoUtils';
import { TECTONIC_PLATES_GEOJSON } from '../data/tectonicPlates';
import { Layers, Crosshair, ZoomIn, ZoomOut, Compass, Eye, Map as MapIcon } from 'lucide-react';

export type MapTileTheme = 'google-roadmap' | 'google-terrain' | 'google-hybrid' | 'dark';

interface EarthquakeMapProps {
  earthquakes: EarthquakeFeature[];
  selectedEarthquake: EarthquakeFeature | null;
  onSelectEarthquake: (quake: EarthquakeFeature) => void;
  userLocation: UserLocation | null;
  proximityKm: number;
  tileTheme: MapTileTheme;
  onTileThemeChange: (theme: MapTileTheme) => void;
  colorMode: 'depth' | 'magnitude';
  onColorModeChange: (mode: 'depth' | 'magnitude') => void;
  showTectonicPlates: boolean;
  onToggleTectonicPlates: () => void;
  showSeismicWaves: boolean;
  onToggleSeismicWaves: () => void;
}

export const EarthquakeMap: React.FC<EarthquakeMapProps> = ({
  earthquakes,
  selectedEarthquake,
  onSelectEarthquake,
  userLocation,
  proximityKm,
  tileTheme,
  onTileThemeChange,
  colorMode,
  onColorModeChange,
  showTectonicPlates,
  onToggleTectonicPlates,
  showSeismicWaves,
  onToggleSeismicWaves,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const earthquakeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tectonicLayerRef = useRef<L.GeoJSON | null>(null);
  const userMarkerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2.2,
      minZoom: 1.5,
      maxZoom: 19,
      zoomControl: false,
      worldCopyJump: true,
      preferCanvas: true,
    });

    earthquakeLayerGroupRef.current = L.layerGroup().addTo(map);
    userMarkerGroupRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Base Tile Layer with Google Maps & Dark Radar options
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let attribution = '&copy; Google Maps';

    if (tileTheme === 'google-roadmap') {
      // Standard Google Maps Roadmap
      tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps';
    } else if (tileTheme === 'google-terrain') {
      // Google Maps Topographic Terrain
      tileUrl = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps Terrain';
    } else if (tileTheme === 'google-hybrid') {
      // Google Maps Satellite with roads and labels
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps Satellite';
    } else if (tileTheme === 'dark') {
      // Dark High-contrast radar
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CARTO &copy; OpenStreetMap';
    }

    const tileLayer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, [tileTheme]);

  // Update Tectonic Plates Layer (Yellow / Gold fault lines)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tectonicLayerRef.current) {
      map.removeLayer(tectonicLayerRef.current);
      tectonicLayerRef.current = null;
    }

    if (showTectonicPlates) {
      const geoLayer = L.geoJSON(TECTONIC_PLATES_GEOJSON as any, {
        style: () => ({
          color: '#eab308', // Warm greenish-yellow / amber fault boundary
          weight: 2.2,
          opacity: 0.85,
          dashArray: '5, 4',
        }),
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindTooltip(
              `<div class="px-2.5 py-1 bg-slate-950 border border-yellow-700/80 text-xs text-yellow-300 font-mono shadow-xl rounded">
                <span class="font-bold block">${feature.properties.name}</span>
                <span class="text-yellow-100/70 text-[11px] block">${feature.properties.type} Fault Zone</span>
              </div>`,
              { sticky: true, opacity: 0.98 }
            );
          }
        },
      }).addTo(map);

      tectonicLayerRef.current = geoLayer;
    }
  }, [showTectonicPlates]);

  // Update User Location & Proximity Ring (Greenish-Yellow radar aesthetic)
  useEffect(() => {
    const layer = userMarkerGroupRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();

    if (userLocation) {
      const { lat, lng, name } = userLocation;

      // Outer proximity zone circle
      if (proximityKm > 0) {
        const radiusMeters = proximityKm * 1000;
        const circle = L.circle([lat, lng], {
          radius: radiusMeters,
          color: '#a3e635', // Luminous greenish-yellow
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#bef264',
          fillOpacity: 0.08,
        });
        circle.bindTooltip(`Observer Zone: ${proximityKm} km`, { sticky: true });
        layer.addLayer(circle);
      }

      // User location marker in vibrant greenish-yellow / lime
      const userIcon = L.divIcon({
        className: 'user-pin-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute w-8 h-8 rounded-full bg-lime-400/40 animate-ping"></span>
            <span class="relative w-4 h-4 rounded-full bg-lime-400 border-2 border-slate-950 shadow-lg shadow-lime-500/80"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 });
      marker.bindTooltip(
        `<div class="px-2.5 py-1.5 bg-slate-950 border border-lime-600 text-xs font-mono text-lime-300 shadow-xl rounded">
          <span class="font-bold block">Observer Station</span>
          <div class="text-slate-200 text-[11px]">${name}</div>
          <div class="text-slate-400 text-[10px]">${lat.toFixed(3)}°, ${lng.toFixed(3)}°</div>
        </div>`,
        { sticky: true }
      );
      layer.addLayer(marker);
    }
  }, [userLocation, proximityKm]);

  // Render Earthquake Markers
  useEffect(() => {
    const layer = earthquakeLayerGroupRef.current;
    if (!layer) return;

    layer.clearLayers();

    const now = Date.now();

    earthquakes.forEach((quake) => {
      const [lng, lat, depth] = quake.geometry.coordinates;
      const mag = quake.properties.mag ?? 1.0;
      const eventTime = quake.properties.time;
      const isRecent = now - eventTime < 2 * 60 * 60 * 1000; // < 2 hours old
      const isSelected = selectedEarthquake?.id === quake.id;

      // Color selection
      const fillColor = colorMode === 'depth' ? getDepthColor(depth) : getMagnitudeColor(mag);

      // Refined smaller marker radius so hundreds/thousands of dots display clearly
      const baseRadius = Math.max(2.2, Math.min(8.0, 1.6 + Math.pow(Math.max(0.5, mag), 1.1) * 0.7));
      const radius = isSelected ? baseRadius * 1.8 : baseRadius;

      // If recent and seismic waves enabled, draw animated wave ring
      if (showSeismicWaves && isRecent && mag >= 3.5) {
        const pulseIcon = L.divIcon({
          className: 'seismic-wave-container',
          html: `
            <div class="relative flex items-center justify-center" style="width:${radius * 3}px; height:${radius * 3}px;">
              <div class="seismic-wave-anim absolute inset-0 rounded-full" style="border: 1.5px solid ${fillColor};"></div>
            </div>
          `,
          iconSize: [radius * 3, radius * 3],
          iconAnchor: [(radius * 3) / 2, (radius * 3) / 2],
        });
        const waveMarker = L.marker([lat, lng], { icon: pulseIcon, interactive: false });
        layer.addLayer(waveMarker);
      }

      const circleMarker = L.circleMarker([lat, lng], {
        radius: isSelected ? radius + 1.5 : radius,
        fillColor,
        color: isSelected ? '#ffffff' : '#020617',
        weight: isSelected ? 2.5 : 0.6,
        opacity: 0.9,
        fillOpacity: isSelected ? 1 : 0.75,
      });

      // Tooltip
      const timeAgo = formatTimeAgo(eventTime);
      const tsunamiBadge = quake.properties.tsunami ? '· TSUNAMI ALERT' : '';
      circleMarker.bindTooltip(
        `<div class="p-2.5 bg-slate-950/95 border border-slate-700 rounded-md text-xs font-mono text-slate-100 shadow-xl">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm" style="color: ${fillColor}">M${mag.toFixed(1)}</span>
            <span class="text-slate-300 font-sans truncate max-w-[200px]">${quake.properties.place}</span>
          </div>
          <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span>Depth: ${depth.toFixed(1)} km</span>
            <span>·</span>
            <span>${timeAgo}</span>
            ${tsunamiBadge ? `<span class="text-rose-400 font-semibold">${tsunamiBadge}</span>` : ''}
          </div>
        </div>`,
        { direction: 'top', offset: [0, -6], opacity: 0.98 }
      );

      circleMarker.on('click', () => {
        onSelectEarthquake(quake);
      });

      layer.addLayer(circleMarker);
    });
  }, [earthquakes, selectedEarthquake, colorMode, showSeismicWaves, onSelectEarthquake]);

  // Fly to selected earthquake when changed
  useEffect(() => {
    if (!selectedEarthquake || !mapRef.current) return;
    const [lng, lat] = selectedEarthquake.geometry.coordinates;
    mapRef.current.flyTo([lat, lng], Math.max(5, mapRef.current.getZoom()), {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedEarthquake]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleResetView = () => {
    mapRef.current?.setView([20, 0], 2.2);
  };

  const handleCenterUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 6, { duration: 1.2 });
    }
  };

  const handleFitAll = () => {
    if (!mapRef.current || earthquakes.length === 0) return;
    const bounds = L.latLngBounds(
      earthquakes.map((q) => [q.geometry.coordinates[1], q.geometry.coordinates[0]])
    );
    mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-950 overflow-hidden flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Top Floating Map Controls HUD */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {/* Google Maps Layer Style Switcher */}
        <div className="flex items-center bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 shadow-xl text-xs font-medium">
          <button
            onClick={() => onTileThemeChange('google-roadmap')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              tileTheme === 'google-roadmap'
                ? 'bg-lime-950/80 text-lime-400 border border-lime-700/70 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Google Maps</span>
          </button>
          <button
            onClick={() => onTileThemeChange('google-terrain')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              tileTheme === 'google-terrain'
                ? 'bg-lime-950/80 text-lime-400 border border-lime-700/70 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Terrain
          </button>
          <button
            onClick={() => onTileThemeChange('google-hybrid')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              tileTheme === 'google-hybrid'
                ? 'bg-lime-950/80 text-lime-400 border border-lime-700/70 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Satellite
          </button>
          <button
            onClick={() => onTileThemeChange('dark')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              tileTheme === 'dark'
                ? 'bg-lime-950/80 text-lime-400 border border-lime-700/70 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dark Radar
          </button>
        </div>

        {/* Tectonic Plates Toggle (Greenish-Yellow accent) */}
        <button
          onClick={onToggleTectonicPlates}
          title="Toggle Tectonic Plate Boundaries & Fault Lines"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition-colors whitespace-nowrap ${
            showTectonicPlates
              ? 'bg-yellow-950/80 border-yellow-600/80 text-yellow-300 shadow-md'
              : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-yellow-400" />
          <span>Tectonic Faults</span>
        </button>

        {/* Seismic Wave Pulse Toggle */}
        <button
          onClick={onToggleSeismicWaves}
          title="Toggle animated seismic wave propagation circles"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition-colors whitespace-nowrap ${
            showSeismicWaves
              ? 'bg-lime-950/80 border-lime-600/80 text-lime-300 shadow-md'
              : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-lime-400" />
          <span>Seismic Wave Waves</span>
        </button>

        {/* Color Mode Switch */}
        <div className="flex items-center bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 shadow-xl text-xs font-medium">
          <span className="text-slate-500 px-2 font-mono text-[11px] uppercase tracking-wider">Color:</span>
          <button
            onClick={() => onColorModeChange('depth')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              colorMode === 'depth'
                ? 'bg-slate-800 text-yellow-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Focal Depth
          </button>
          <button
            onClick={() => onColorModeChange('magnitude')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              colorMode === 'magnitude'
                ? 'bg-slate-800 text-lime-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Magnitude
          </button>
        </div>
      </div>

      {/* Right Map Navigation Utilities */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-lime-400 shadow-xl transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-lime-400 shadow-xl transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          title="Reset Global View"
          className="p-2 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-lime-400 shadow-xl transition-colors"
        >
          <Compass className="w-4 h-4" />
        </button>
        {userLocation && (
          <button
            onClick={handleCenterUser}
            title="Focus on My Location"
            className="p-2 bg-lime-950/90 hover:bg-lime-900 border border-lime-700/80 rounded-lg text-lime-400 shadow-xl transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleFitAll}
          title="Fit All Earthquakes into View"
          className="px-2 py-1.5 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-lime-400 text-[11px] font-mono shadow-xl transition-colors"
        >
          FIT ALL
        </button>
      </div>

      {/* Bottom Map Legend HUD */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-lg px-3.5 py-2.5 shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-6 text-xs">
          {colorMode === 'depth' ? (
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Focal Depth (km)
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-slate-300">0 - 70 (Shallow)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
                  <span className="text-slate-300">70 - 300 (Intermediate)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                  <span className="text-slate-300">&gt; 300 (Deep)</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Richter / Moment Magnitude
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-400 inline-block"></span>
                  <span className="text-slate-300">&lt; 3.0</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
                  <span className="text-slate-300">3.0 - 4.4</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                  <span className="text-slate-300">4.5 - 5.9</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"></span>
                  <span className="text-slate-300">6.0 - 6.9</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-slate-300">&ge; 7.0</span>
                </div>
              </div>
            </div>
          )}

          {showTectonicPlates && (
            <div className="border-l border-slate-800 pl-4 hidden sm:block">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Tectonic Boundary
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-4 h-0.5 bg-yellow-400 inline-block border-b border-dashed border-yellow-400"></span>
                <span className="text-yellow-300">Major Fault / Trench</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
