/**
 * Web Audio API synthesized alert engine.
 * No external media dependencies, instant, works reliably across all browsers.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playAlertSound(type: 'sonar' | 'pulse' | 'siren' = 'sonar', volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    const clampedVol = Math.max(0.01, Math.min(1, volume));
    masterGain.gain.setValueAtTime(clampedVol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'sonar') {
      // Crisp seismic sonar chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.45);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (type === 'pulse') {
      // Sub-bass tectonic rumble pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(45, now + 0.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.8, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.75);
    } else if (type === 'siren') {
      // High urgency double warning tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(700, now);
      osc1.frequency.setValueAtTime(950, now + 0.2);
      osc1.frequency.setValueAtTime(700, now + 0.4);
      osc1.frequency.setValueAtTime(950, now + 0.6);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.9);
    }
  } catch (err) {
    console.warn('Audio alert playback failed:', err);
  }
}
