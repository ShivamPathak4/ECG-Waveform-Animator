// src/components/ECGGenerator.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { WaveParams, CustomBeat, Point } from '../types/ecg';
import { useECGWaveformData } from '../hooks/useECGWaveformData';
import ECGControls from './ECGControls';
import ECGCanvas from './ECGCanvas';

const ECGGenerator: React.FC = () => {
  // Wave parameters state
  const [waveParams, setWaveParams] = useState<WaveParams>({
    heart_rate: 70,
    h_p: 0.15,
    b_p: 0.08,
    h_q: -0.1,
    b_q: 0.025,
    h_r: 1.2,
    b_r: 0.05,
    h_s: -0.25,
    b_s: 0.025,
    h_t: 0.2,
    b_t: 0.16,
    l_pq: 0.08,
    l_st: 0.12,
    l_tp: 0.3,
    n_p: 1
  });

  // Display and pattern states
  const [pixelsPerMv, setPixelsPerMv] = useState(100);
  const [rWaveEnabled, setRWaveEnabled] = useState(false);
  const [rWaveCount, setRWaveCount] = useState(2);
  const [rWaveInterval, setRWaveInterval] = useState(5);
  const [pWaveEnabled, setPWaveEnabled] = useState(false);
  const [pWaveCount, setPWaveCount] = useState(0);
  const [pWaveInterval, setPWaveInterval] = useState(3);
  const [useCustomBeatParameters, setUseCustomBeatParameters] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(10);
  const [customBeats, setCustomBeats] = useState<CustomBeat[]>([]);
  const [pathPoints, setPathPoints] = useState<Point[]>([]); // State for waveform points

  // Use the custom hook for waveform data generation
  const { generateWaveformPoints, resetGlobalCounters } = useECGWaveformData({
    waveParams,
    pixelsPerMv,
    rWaveEnabled,
    rWaveCount,
    rWaveInterval,
    pWaveEnabled,
    pWaveCount,
    pWaveInterval,
    useCustomBeatParameters,
    repeatInterval,
    customBeats,
  });

  // Function to apply changes and regenerate waveform points
  const applyChanges = useCallback(() => {
    resetGlobalCounters(); // Reset counters on apply changes
    setPathPoints(generateWaveformPoints()); // Regenerate and set new path points
  }, [generateWaveformPoints, resetGlobalCounters]);

  // Add custom beat
  const addCustomBeat = () => {
    const defaultBeat: CustomBeat = {
      h_p: 0.15, b_p: 0.08, h_q: -0.1, b_q: 0.025, h_r: 1.2, b_r: 0.05,
      h_s: -0.25, b_s: 0.025, h_t: 0.2, b_t: 0.16,
      l_pq: 0.08, l_st: 0.12, l_tp: 0.3
    };
    setCustomBeats([...customBeats, defaultBeat]);
  };

  // Remove custom beat
  const removeCustomBeat = (index: number) => {
    setCustomBeats(customBeats.filter((_, i) => i !== index));
  };

  // Update custom beat
  const updateCustomBeat = (index: number, field: keyof CustomBeat, value: number) => {
    const updated = [...customBeats];
    updated[index] = { ...updated[index], [field]: value };
    setCustomBeats(updated);
  };

  // Initialize waveform on mount
  useEffect(() => {
    applyChanges(); // Generate initial waveform
  }, [applyChanges]);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 overflow-x-hidden"> {/* Added overflow-x-hidden here */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center sm:text-left">
        ECG Waveform Animator (Custom Beats)
      </h1>
      
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Controls Panel */}
        <ECGControls
          waveParams={waveParams}
          setWaveParams={setWaveParams}
          pixelsPerMv={pixelsPerMv}
          setPixelsPerMv={setPixelsPerMv}
          rWaveEnabled={rWaveEnabled}
          setRWaveEnabled={setRWaveEnabled}
          rWaveCount={rWaveCount}
          setRWaveCount={setRWaveCount}
          rWaveInterval={rWaveInterval}
          setRWaveInterval={setRWaveInterval}
          pWaveEnabled={pWaveEnabled}
          setPWaveEnabled={setPWaveEnabled}
          pWaveCount={pWaveCount}
          setPWaveCount={setPWaveCount}
          pWaveInterval={pWaveInterval}
          setPWaveInterval={setPWaveInterval}
          useCustomBeatParameters={useCustomBeatParameters}
          setUseCustomBeatParameters={setUseCustomBeatParameters}
          repeatInterval={repeatInterval}
          setRepeatInterval={setRepeatInterval}
          customBeats={customBeats}
          addCustomBeat={addCustomBeat}
          removeCustomBeat={removeCustomBeat}
          updateCustomBeat={updateCustomBeat}
          applyChanges={applyChanges}
        />

        {/* SVG Canvas */}
        <ECGCanvas pathPoints={pathPoints} />
      </div>
    </div>
  );
};

export default ECGGenerator;
