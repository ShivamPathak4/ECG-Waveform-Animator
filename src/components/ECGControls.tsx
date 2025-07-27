import React from 'react';
import type { WaveParams, CustomBeat } from '../types/ecg';

interface ECGControlsProps {
  waveParams: WaveParams;
  setWaveParams: React.Dispatch<React.SetStateAction<WaveParams>>;
  pixelsPerMv: number;
  setPixelsPerMv: React.Dispatch<React.SetStateAction<number>>;
  rWaveEnabled: boolean;
  setRWaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  rWaveCount: number;
  setRWaveCount: React.Dispatch<React.SetStateAction<number>>;
  rWaveInterval: number;
  setRWaveInterval: React.Dispatch<React.SetStateAction<number>>;
  pWaveEnabled: boolean;
  setPWaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  pWaveCount: number;
  setPWaveCount: React.Dispatch<React.SetStateAction<number>>;
  pWaveInterval: number;
  setPWaveInterval: React.Dispatch<React.SetStateAction<number>>;
  useCustomBeatParameters: boolean;
  setUseCustomBeatParameters: React.Dispatch<React.SetStateAction<boolean>>;
  repeatInterval: number;
  setRepeatInterval: React.Dispatch<React.SetStateAction<number>>;
  customBeats: CustomBeat[];
  addCustomBeat: () => void;
  removeCustomBeat: (index: number) => void;
  updateCustomBeat: (index: number, field: keyof CustomBeat, value: number) => void;
  applyChanges: () => void;
}

const ECGControls: React.FC<ECGControlsProps> = ({
  waveParams,
  setWaveParams,
  pixelsPerMv,
  setPixelsPerMv,
  rWaveEnabled,
  setRWaveEnabled,
  rWaveCount,
  setRWaveCount,
  rWaveInterval,
  setRWaveInterval,
  pWaveEnabled,
  setPWaveEnabled,
  pWaveCount,
  setPWaveCount,
  pWaveInterval,
  setPWaveInterval,
  useCustomBeatParameters,
  setUseCustomBeatParameters,
  repeatInterval,
  setRepeatInterval,
  customBeats,
  addCustomBeat,
  removeCustomBeat,
  updateCustomBeat,
  applyChanges,
}) => {
  const inputClass = "flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm";
  const labelClass = "flex-1 min-w-0 text-xs sm:text-sm text-gray-600";
  const groupClass = "flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3";

  return (
    <div className="w-full lg:flex-1 lg:min-w-80 bg-white p-3 sm:p-5 rounded-lg shadow-sm max-h-96 lg:max-h-screen overflow-y-auto">
      {/* Heart Rate Control */}
      <div className={groupClass}>
        <label className={labelClass}>Heart Rate (bpm):</label>
        <input
          type="number"
          className={inputClass}
          value={waveParams.heart_rate}
          onChange={(e) => setWaveParams({...waveParams, heart_rate: parseFloat(e.target.value)})}
          min="20"
          max="250"
          step="1"
        />
      </div>

      {/* Pixels per mV Control */}
      <div className={groupClass}>
        <label className={labelClass}>Pixels per mV:</label>
        <input
          type="number"
          className={inputClass}
          value={pixelsPerMv}
          onChange={(e) => setPixelsPerMv(parseFloat(e.target.value))}
          min="10"
          step="10"
        />
      </div>

      {/* Wave Parameters Section */}
      <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-6 mb-3 sm:mb-4">Wave Parameters (mV, sec)</h3>
      {[
        ['h_p', 'P Wave Height', 0.01],
        ['b_p', 'P Wave Breadth', 0.01],
        ['h_q', 'Q Wave Height', 0.01],
        ['b_q', 'Q Wave Breadth', 0.005],
        ['h_r', 'R Wave Height', 0.1],
        ['b_r', 'R Wave Breadth', 0.01],
        ['h_s', 'S Wave Height', 0.01],
        ['b_s', 'S Wave Breadth', 0.005],
        ['h_t', 'T Wave Height', 0.01],
        ['b_t', 'T Wave Breadth', 0.01],
        ['l_pq', 'PQ Segment Length', 0.01],
        ['l_st', 'ST Segment Length', 0.01],
        ['l_tp', 'TP Segment Length', 0.01],
        ['n_p', 'Default P Waves per QRS', 1]
      ].map(([key, label, step]) => (
        <div key={key as string} className={groupClass}>
          <label className={labelClass}>{label}:</label>
          <input
            type="number"
            className={inputClass}
            value={waveParams[key as keyof WaveParams]}
            onChange={(e) => setWaveParams({...waveParams, [key]: parseFloat(e.target.value)})}
            step={step as number}
          />
        </div>
      ))}

      {/* Dynamic R Wave Pattern Section */}
      <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-6 mb-3 sm:mb-4">Dynamic R Wave Pattern</h3>
      <div className={groupClass}>
        <label className="flex items-center gap-2 text-xs sm:text-sm">
          <input
            type="checkbox"
            checked={rWaveEnabled}
            onChange={(e) => setRWaveEnabled(e.target.checked)}
          />
          Enable R Wave Pattern
        </label>
      </div>
      <div className={groupClass}>
        <label className={labelClass}>R Waves in Pattern:</label>
        <input
          type="number"
          className={inputClass}
          value={rWaveCount}
          onChange={(e) => setRWaveCount(parseInt(e.target.value))}
          min="0"
          step="1"
        />
      </div>
      <div className={groupClass}>
        <label className={labelClass}>Apply After N QRS:</label>
        <input
          type="number"
          className={inputClass}
          value={rWaveInterval}
          onChange={(e) => setRWaveInterval(parseInt(e.target.value))}
          min="0"
          step="1"
        />
      </div>

      {/* Dynamic P Wave Pattern Section */}
      <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-6 mb-3 sm:mb-4">Dynamic P Wave Pattern</h3>
      <div className={groupClass}>
        <label className="flex items-center gap-2 text-xs sm:text-sm">
          <input
            type="checkbox"
            checked={pWaveEnabled}
            onChange={(e) => setPWaveEnabled(e.target.checked)}
          />
          Enable P Wave Pattern
        </label>
      </div>
      <div className={groupClass}>
        <label className={labelClass}>P Waves in Pattern:</label>
        <input
          type="number"
          className={inputClass}
          value={pWaveCount}
          onChange={(e) => setPWaveCount(parseInt(e.target.value))}
          min="0"
          step="1"
        />
      </div>
      <div className={groupClass}>
        <label className={labelClass}>Apply After N QRS:</label>
        <input
          type="number"
          className={inputClass}
          value={pWaveInterval}
          onChange={(e) => setPWaveInterval(parseInt(e.target.value))}
          min="0"
          step="1"
        />
      </div>

      {/* Custom Beat Sequence Section */}
      <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-6 mb-3 sm:mb-4">Custom Beat Sequence</h3>
      <div className={groupClass}>
        <label className="flex items-center gap-2 text-xs sm:text-sm">
          <input
            type="checkbox"
            checked={useCustomBeatParameters}
            onChange={(e) => setUseCustomBeatParameters(e.target.checked)}
          />
          Enable Custom Beat Sequence
        </label>
      </div>
      <div className={groupClass}>
        <label className={labelClass}>Normal Beats Before Repeat:</label>
        <input
          type="number"
          className={inputClass}
          value={repeatInterval}
          onChange={(e) => setRepeatInterval(parseInt(e.target.value))}
          min="0"
          step="1"
        />
      </div>

      {/* Custom Beats List */}
      {customBeats.map((beat, index) => (
        <div key={index} className="border border-gray-200 p-2 sm:p-3 mb-2 sm:mb-3 bg-gray-50 rounded">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-xs sm:text-sm">Custom Beat {index + 1}</h4>
            <button
              onClick={() => removeCustomBeat(index)}
              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
          {/* Layout for custom beat parameters, now a single column */}
          <div className="grid grid-cols-1 gap-1 sm:gap-2">
            {Object.entries(beat).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-xs text-gray-600 min-w-16 sm:min-w-20">
                  {key.replace('_', ' ').toUpperCase()}:
                </label>
                <input
                  type="number"
                  className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs"
                  value={value}
                  onChange={(e) => updateCustomBeat(index, key as keyof CustomBeat, parseFloat(e.target.value))}
                  step="0.01"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Custom Beat Button */}
      <button
        onClick={addCustomBeat}
        className="w-full py-2 bg-green-500 text-white font-medium rounded hover:bg-green-600 mb-3 sm:mb-4 text-sm"
      >
        + Add Custom Beat
      </button>

      {/* Apply Changes Button */}
      <button
        onClick={applyChanges}
        className="w-full py-2 sm:py-3 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 text-sm"
      >
        Apply Changes
      </button>
    </div>
  );
};

export default ECGControls;
