import React from 'react';
import { Activity, Bell, Shield, History, Radio, RefreshCw } from 'lucide-react';
import { AlertSettings } from '../types/earthquake';

interface HeaderProps {
  activeView: 'live' | 'historical';
  onViewChange: (view: 'live' | 'historical') => void;
  onOpenAlertsModal: () => void;
  onOpenSafetyModal: () => void;
  alertSettings: AlertSettings;
  liveQuakeCount: number;
  isRefreshing: boolean;
  onRefreshLive: () => void;
  secondsUntilRefresh: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onOpenAlertsModal,
  onOpenSafetyModal,
  alertSettings,
  liveQuakeCount,
  isRefreshing,
  onRefreshLive,
  secondsUntilRefresh,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
      {/* Zone 1: Brand Wordmark (Single text element wordmark, no compound pill islands) */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-lime-950 border border-lime-700/80 flex items-center justify-center text-lime-400">
          <Activity className="w-5 h-5 text-lime-400" />
        </div>
        <span className="text-base font-extrabold tracking-tight text-slate-100 font-mono">
          SEISMO<span className="text-lime-400">ALERT</span>
        </span>
      </div>

      {/* Zone 2: Clean 4–5 single-line navigation links */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <button
          onClick={() => onViewChange('live')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'live'
              ? 'bg-slate-800 text-lime-400 font-semibold border border-slate-700'
              : 'hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-lime-400" />
          <span>Live Monitor</span>
        </button>

        <button
          onClick={() => onViewChange('historical')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'historical'
              ? 'bg-slate-800 text-lime-400 font-semibold border border-slate-700'
              : 'hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historical Archive</span>
        </button>

        <button
          onClick={onOpenSafetyModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:text-slate-200 hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Safety Guide</span>
        </button>

        {activeView === 'live' && (
          <button
            onClick={onRefreshLive}
            disabled={isRefreshing}
            title="Force refresh live USGS stream"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-slate-400 hover:text-slate-200 font-mono text-[11px] whitespace-nowrap shrink-0 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-lime-400' : ''}`} />
            <span>{secondsUntilRefresh}s</span>
          </button>
        )}
      </nav>

      {/* Zone 3: 1 Primary Action (Alerts & Sound Engine) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenAlertsModal}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 ${
            alertSettings.enabled && alertSettings.soundEnabled
              ? 'bg-lime-950/80 border-lime-600 text-lime-300 shadow-md shadow-lime-950'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${alertSettings.soundEnabled ? 'text-lime-400' : 'text-slate-500'}`} />
          <span>Alerts: {alertSettings.soundEnabled ? `Active (M${alertSettings.minMagnitude}+)` : 'Muted'}</span>
        </button>
      </div>
    </header>
  );
};
