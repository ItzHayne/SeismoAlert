import React, { useEffect, useRef, useState } from 'react';
import { EarthquakeFeature } from '../types/earthquake';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

interface SeismogramVisualizerProps {
  earthquake: EarthquakeFeature;
  observerDistanceKm: number;
}

export const SeismogramVisualizer: React.FC<SeismogramVisualizerProps> = ({
  earthquake,
  observerDistanceKm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const mag = earthquake.properties.mag ?? 4.0;
  const depth = earthquake.geometry.coordinates[2] || 10;
  const dist = Math.max(10, observerDistanceKm || 300);

  // Approximate seismic wave arrivals
  const pWaveTimeSec = Math.max(2, Math.round(dist / 6.0));
  const sWaveTimeSec = Math.max(pWaveTimeSec + 2, Math.round(dist / 3.5));
  const surfaceWaveTimeSec = Math.max(sWaveTimeSec + 2, Math.round(dist / 2.8));
  const totalDurationSec = Math.max(45, surfaceWaveTimeSec + 35);

  useEffect(() => {
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (!startTime) startTime = time - (progress / 100) * totalDurationSec * 1000;
      const elapsed = (time - startTime) / 1000;
      const currentProg = Math.min(100, (elapsed / totalDurationSec) * 100);

      setProgress(currentProg);

      if (currentProg >= 100) {
        setIsPlaying(false);
      } else if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, totalDurationSec]);

  // Draw Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark seismic canvas background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridRows = 6;
    for (let i = 1; i < gridRows; i++) {
      const y = (height / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Time markings
    const timeCols = 10;
    ctx.fillStyle = '#475569';
    ctx.font = '10px "JetBrains Mono", monospace';
    for (let i = 0; i <= timeCols; i++) {
      const x = (width / timeCols) * i;
      const sec = Math.round((totalDurationSec / timeCols) * i);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.fillText(`${sec}s`, x + 3, height - 6);
    }

    const midY = height / 2;
    const pX = (pWaveTimeSec / totalDurationSec) * width;
    const sX = (sWaveTimeSec / totalDurationSec) * width;
    const surfX = (surfaceWaveTimeSec / totalDurationSec) * width;

    // Draw Phase Markers
    // P-wave (Luminous Lime)
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pX, 0);
    ctx.lineTo(pX, height);
    ctx.stroke();
    ctx.fillStyle = '#a3e635';
    ctx.fillText('P-WAVE ARRIVAL', pX + 4, 18);

    // S-wave (Yellow/Amber)
    ctx.strokeStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(sX, 0);
    ctx.lineTo(sX, height);
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillText('S-WAVE (SHEAR)', sX + 4, 30);

    // Surface wave
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(surfX, 0);
    ctx.lineTo(surfX, height);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.fillText('SURFACE WAVES (PEAK)', surfX + 4, 42);

    ctx.setLineDash([]);

    // Synthesize realistic seismogram signal (Vibrant lime / greenish-yellow trace)
    const samples = width;
    ctx.beginPath();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#bef264';

    for (let x = 0; x < samples; x++) {
      const t = (x / width) * totalDurationSec;
      let amp = 0;

      // Ambient background microseism
      amp += (Math.sin(t * 8.5) + Math.cos(t * 14.2) * 0.5) * 1.5;

      // P-wave packet (higher frequency, lower amplitude)
      if (t >= pWaveTimeSec) {
        const dtP = t - pWaveTimeSec;
        const decayP = Math.exp(-dtP / 12);
        const pAmp = Math.pow(1.5, Math.min(8, mag)) * 1.8 * decayP;
        amp += (Math.sin(dtP * 28.0) * 0.7 + Math.sin(dtP * 45.0) * 0.3) * pAmp;
      }

      // S-wave packet (lower frequency, larger amplitude)
      if (t >= sWaveTimeSec) {
        const dtS = t - sWaveTimeSec;
        const decayS = Math.exp(-dtS / 15);
        const sAmp = Math.pow(1.6, Math.min(8, mag)) * 4.2 * decayS;
        amp += (Math.sin(dtS * 14.0) * 0.8 + Math.cos(dtS * 20.0) * 0.4) * sAmp;
      }

      // Surface waves (Rayleigh/Love - largest amplitude, lowest frequency)
      if (t >= surfaceWaveTimeSec) {
        const dtSurf = t - surfaceWaveTimeSec;
        const decaySurf = Math.exp(-dtSurf / 22);
        const surfAmp = Math.pow(1.7, Math.min(8, mag)) * 7.5 * decaySurf;
        amp += Math.sin(dtSurf * 5.2) * surfAmp * Math.sin(dtSurf * 2.1);
      }

      // Damping & distance geometric attenuation factor
      const distDamping = 100 / Math.sqrt(dist + 50);
      const y = midY + Math.max(-height * 0.42, Math.min(height * 0.42, amp * distDamping * 0.25));

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw Live Playhead
    const currentPlayheadX = (progress / 100) * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentPlayheadX, 0);
    ctx.lineTo(currentPlayheadX, height);
    ctx.stroke();

    // Pulse dot at tip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(currentPlayheadX, midY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [mag, depth, dist, pWaveTimeSec, sWaveTimeSec, surfaceWaveTimeSec, totalDurationSec, progress]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-lime-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
            Synthetic Seismogram Waveform Simulation
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Dist: {Math.round(dist)} km</span>
          <span>·</span>
          <span>Depth: {depth.toFixed(1)} km</span>
        </div>
      </div>

      <div className="relative w-full h-36 bg-slate-950 rounded border border-slate-800/80 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Playback Controls & Wave Phase Details */}
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => {
              setProgress(0);
              setIsPlaying(true);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="Replay from 0s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="text-lime-400">P-wave: +{pWaveTimeSec}s</span>
          <span className="text-amber-400">S-wave: +{sWaveTimeSec}s</span>
          <span className="text-rose-400">S-P Interval: {sWaveTimeSec - pWaveTimeSec}s</span>
        </div>
      </div>
    </div>
  );
};
