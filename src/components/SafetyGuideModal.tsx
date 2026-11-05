import React, { useState } from 'react';
import { Shield, X, AlertTriangle, Waves, CheckSquare, Square, BookOpen } from 'lucide-react';

interface SafetyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMERGENCY_SUPPLIES = [
  'Water: 1 gallon per person per day (3-day to 2-week supply)',
  'Non-perishable food (canned items, energy bars, manual can opener)',
  'Flashlight with extra batteries (no candles due to gas leak risk)',
  'First aid kit, essential prescription medications (7-day supply)',
  'Battery-powered or hand-crank NOAA emergency weather radio',
  'Multi-tool or wrench to turn off gas and main water valve',
  'Whistle to signal for search and rescue if trapped',
  'Dust masks, plastic sheeting, and duct tape for particulate filtration',
  'Sturdy shoes and work gloves near your bedside',
  'Portable power bank and USB charging cables for emergency phone use',
];

export const SafetyGuideModal: React.FC<SafetyGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'during' | 'after' | 'tsunami' | 'checklist'>('during');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-lime-400" />
            <h2 className="text-base font-bold text-slate-100 uppercase font-mono tracking-wider">
              Earthquake Preparedness & Safety Protocol
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/30 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('during')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'during'
                ? 'border-lime-400 text-lime-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            During Shaking
          </button>
          <button
            onClick={() => setActiveTab('after')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'after'
                ? 'border-lime-400 text-lime-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Aftershocks & Recovery
          </button>
          <button
            onClick={() => setActiveTab('tsunami')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'tsunami'
                ? 'border-lime-400 text-lime-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tsunami Warning Protocol
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-lime-400 text-lime-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Emergency 72h Kit
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-slate-300">
          {activeTab === 'during' && (
            <div className="space-y-4">
              <div className="p-4 bg-lime-950/40 border border-lime-800/60 rounded-lg">
                <h3 className="font-bold text-sm text-lime-300 mb-2 uppercase font-mono tracking-wider">
                  The Gold Standard: Drop, Cover, and Hold On
                </h3>
                <div className="space-y-2">
                  <p>
                    <strong className="text-white">1. DROP</strong> to your hands and knees. This position protects you from being knocked down and allows you to stay low and crawl to shelter.
                  </p>
                  <p>
                    <strong className="text-white">2. COVER</strong> your head and neck (and your entire body if possible) underneath a sturdy table or desk. If no shelter is nearby, drop next to an interior wall and shield your head with both arms.
                  </p>
                  <p>
                    <strong className="text-white">3. HOLD ON</strong> to your shelter with one hand and be prepared to move with it until the shaking ceases completely.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <h4 className="font-bold text-slate-200 mb-1">If in Bed</h4>
                  <p className="text-slate-400">
                    Stay in bed. Turn face down and cover your head and neck with a pillow. Broken glass on the floor causes severe injuries if you try to step out in the dark.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <h4 className="font-bold text-slate-200 mb-1">If Driving</h4>
                  <p className="text-slate-400">
                    Pull over safely to the shoulder away from overpasses, bridges, power lines, and billboards. Engage the parking brake and remain inside the vehicle.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <h4 className="font-bold text-slate-200 mb-1">If Outdoors</h4>
                  <p className="text-slate-400">
                    Move safely to a clear open area away from buildings, streetlights, brick chimneys, and utility wires. Drop to the ground.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <h4 className="font-bold text-slate-200 mb-1">Do NOT Use Elevators</h4>
                  <p className="text-slate-400">
                    Never enter an elevator during or immediately after a tremor. Power grids often fail instantly and stairwells may have sustained hidden structural strain.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'after' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-lg">
                <h3 className="font-bold text-sm text-amber-300 mb-1 uppercase font-mono tracking-wider">
                  Expect Aftershocks
                </h3>
                <p className="text-amber-200/90">
                  Every major earthquake triggers secondary aftershocks along the ruptured fault system for hours, days, or months. Some aftershocks can be nearly as strong as the mainshock and can cause damaged buildings to collapse.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200">Immediate Post-Shaking Steps:</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Check for Gas Leaks:</strong> If you smell gas or hear a hissing noise, open a window and quickly evacuate. Shut off the gas main valve only if safe to do so. Do not strike matches or turn electrical switches on/off.</li>
                  <li><strong>Check Water & Electrical Lines:</strong> Look for cracked pipes or severed wires. Shut off main circuit breakers if wiring is damaged.</li>
                  <li><strong>Wear Sturdy Shoes:</strong> Broken glass is the #1 cause of immediate emergency room visits following seismic events.</li>
                  <li><strong>Use SMS or Messaging Apps:</strong> Voice phone networks will be saturated with emergency traffic. Send concise text messages to check in with family.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tsunami' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-950/40 border border-rose-800/70 rounded-lg">
                <div className="flex items-center gap-2 text-rose-300 font-bold mb-1">
                  <Waves className="w-5 h-5" />
                  <span className="uppercase font-mono tracking-wider">Natural Tsunami Warning Signs</span>
                </div>
                <p className="text-rose-200/90">
                  If you are on or near a coastal shore and feel strong or long shaking (lasting over 20 seconds), <strong>do not wait for official sirens or texts</strong>. Immediately move inland or to high ground at least 100 feet (30m) above sea level.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200">Key Tsunami Facts:</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Receding Ocean Water:</strong> A rapid, dramatic withdrawal of the shoreline exposing the seafloor is an unmistakable natural warning that a massive tsunami wave is incoming.</li>
                  <li><strong>First Wave Is Rarely the Largest:</strong> Tsunamis arrive in a series of wave crests over hours. The second or third surge is frequently the most destructive.</li>
                  <li><strong>Stay Away from the Coast:</strong> Never walk down to the beach to look at an approaching tsunami; if you can see the wave coming, you are already too close to outrun it.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 uppercase font-mono tracking-wider">
                  Recommended Go-Bag Checklist
                </span>
                <span className="font-mono text-lime-400">
                  {Object.values(checkedItems).filter(Boolean).length} / {EMERGENCY_SUPPLIES.length} packed
                </span>
              </div>

              <div className="space-y-1.5 divide-y divide-slate-800/60">
                {EMERGENCY_SUPPLIES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleItem(idx)}
                    className="w-full flex items-start gap-2.5 py-2 text-left hover:text-white transition-colors group"
                  >
                    {checkedItems[idx] ? (
                      <CheckSquare className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs ${
                        checkedItems[idx] ? 'line-through text-slate-500' : 'text-slate-300'
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 font-mono">
          <span>Sources: USGS Earthquake Hazards Program & FEMA</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
