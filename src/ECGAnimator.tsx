import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==================== Types and Interfaces ====================

interface WaveParams {
  heart_rate: number;
  h_p: number;
  b_p: number;
  h_q: number;
  b_q: number;
  h_r: number;
  b_r: number;
  h_s: number;
  b_s: number;
  h_t: number;
  b_t: number;
  l_pq: number;
  l_st: number;
  l_tp: number;
  n_p: number;
}

interface CustomBeat {
  h_p: number;
  b_p: number;
  h_q: number;
  b_q: number;
  h_r: number;
  b_r: number;
  h_s: number;
  b_s: number;
  h_t: number;
  b_t: number;
  l_pq: number;
  l_st: number;
  l_tp: number;
}

interface Point {
  x: number;
  y: number;
}

type WaveParameter = {
  key: keyof WaveParams;
  label: string;
  step: number;
};

type CustomBeatParameter = {
  key: keyof CustomBeat;
  label: string;
};

// ==================== Constants ====================

const DEFAULT_CUSTOM_BEAT: CustomBeat = {
  h_p: 0.15, b_p: 0.08, h_q: -0.1, b_q: 0.025, h_r: 1.2, b_r: 0.05,
  h_s: -0.25, b_s: 0.025, h_t: 0.2, b_t: 0.16,
  l_pq: 0.08, l_st: 0.12, l_tp: 0.3
};

const WAVE_PARAMETERS: WaveParameter[] = [
  { key: 'h_p', label: 'P Wave Height', step: 0.01 },
  { key: 'b_p', label: 'P Wave Breadth', step: 0.01 },
  { key: 'h_q', label: 'Q Wave Height', step: 0.01 },
  { key: 'b_q', label: 'Q Wave Breadth', step: 0.005 },
  { key: 'h_r', label: 'R Wave Height', step: 0.1 },
  { key: 'b_r', label: 'R Wave Breadth', step: 0.01 },
  { key: 'h_s', label: 'S Wave Height', step: 0.01 },
  { key: 'b_s', label: 'S Wave Breadth', step: 0.005 },
  { key: 'h_t', label: 'T Wave Height', step: 0.01 },
  { key: 'b_t', label: 'T Wave Breadth', step: 0.01 },
  { key: 'l_pq', label: 'PQ Segment Length', step: 0.01 },
  { key: 'l_st', label: 'ST Segment Length', step: 0.01 },
  { key: 'l_tp', label: 'TP Segment Length', step: 0.01 },
  { key: 'n_p', label: 'Default P Waves per QRS', step: 1 }
];

const CUSTOM_BEAT_PARAMETERS: CustomBeatParameter[] = [
  { key: 'h_p', label: 'P Height' }, { key: 'b_p', label: 'P Breadth' },
  { key: 'h_q', label: 'Q Height' }, { key: 'b_q', label: 'Q Breadth' },
  { key: 'h_r', label: 'R Height' }, { key: 'b_r', label: 'R Breadth' },
  { key: 'h_s', label: 'S Height' }, { key: 'b_s', label: 'S Breadth' },
  { key: 'h_t', label: 'T Height' }, { key: 'b_t', label: 'T Breadth' },
  { key: 'l_pq', label: 'PQ Length' }, { key: 'l_st', label: 'ST Length' },
  { key: 'l_tp', label: 'TP Length' }
];

const PIXELS_PER_SECOND = 150;
const POINTER_RADIUS = 6;
const ERASE_WIDTH = 12;
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 400;

// ==================== Helper Components ====================

interface CustomBeatEditorProps {
  beat: CustomBeat;
  index: number;
  onUpdate: (index: number, key: keyof CustomBeat, value: number) => void;
  onRemove: (index: number) => void;
}

const CustomBeatEditor: React.FC<CustomBeatEditorProps> = ({ beat, index, onUpdate, onRemove }) => (
  <div className="border border-gray-300 p-3 mb-3 bg-gray-50 rounded">
    <h3 className="text-base font-medium mb-2">Custom Beat {index + 1}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs">
      {CUSTOM_BEAT_PARAMETERS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1">
          <label className="flex-1 text-xs text-gray-600">{label}:</label>
          <input
            type="number"
            value={beat[key]}
            onChange={(e) => onUpdate(index, key, parseFloat(e.target.value))}
            className="flex-1 p-1 border rounded text-xs w-full"
            step="0.01"
          />
        </div>
      ))}
    </div>
    <button
      onClick={() => onRemove(index)}
      className="mt-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 w-full sm:w-auto"
    >
      Remove Beat
    </button>
  </div>
);

// ==================== Main Component ====================

const ECGWaveformAnimator: React.FC = () => {
  // ==================== State Management ====================
  const [pixelsPerMv, setPixelsPerMv] = useState<number>(100);
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

  const [rWaveEnabled, setRWaveEnabled] = useState<boolean>(false);
  const [rWaveCount, setRWaveCount] = useState<number>(2);
  const [rWaveInterval, setRWaveInterval] = useState<number>(5);
  const [pWaveEnabled, setPWaveEnabled] = useState<boolean>(false);
  const [pWaveCount, setPWaveCount] = useState<number>(0);
  const [pWaveInterval, setPWaveInterval] = useState<number>(3);
  const [useCustomBeatParameters, setUseCustomBeatParameters] = useState<boolean>(false);
  const [repeatInterval, setRepeatInterval] = useState<number>(10);
  const [customBeats, setCustomBeats] = useState<CustomBeat[]>([]);

  // ==================== Refs for Animation ====================
  const svgRef = useRef<SVGSVGElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimestamp = useRef<number>(0);
  const pointerX = useRef<number>(0);
  const firstSweep = useRef<boolean>(true);
  const pathPoints = useRef<Point[]>([]);
  const drawnPoints = useRef<(Point | null)[]>([]);
  const pendingUpdateX = useRef<number | null>(null);
  const newParametersReady = useRef<boolean>(false);
  const pendingNextIteration = useRef<boolean>(false);

  // Global counters to persist beat state - these NEVER reset
  const globalBeatCounter = useRef<number>(0);
  const globalCustomIdx = useRef<number>(0);
  const globalWaitingNormalBeats = useRef<number>(0);
  const globalRCycleCounter = useRef<number>(0);
  const globalPCycleCounter = useRef<number>(0);

  // Store applied parameters separately from form inputs
  const appliedParams = useRef<WaveParams>(waveParams);
  const appliedPixelsPerMv = useRef<number>(pixelsPerMv);
  const appliedRWaveEnabled = useRef<boolean>(rWaveEnabled);
  const appliedRWaveCount = useRef<number>(rWaveCount);
  const appliedRWaveInterval = useRef<number>(rWaveInterval);
  const appliedPWaveEnabled = useRef<boolean>(pWaveEnabled);
  const appliedPWaveCount = useRef<number>(pWaveCount);
  const appliedPWaveInterval = useRef<number>(pWaveInterval);
  const appliedUseCustomBeatParameters = useRef<boolean>(useCustomBeatParameters);
  const appliedRepeatInterval = useRef<number>(repeatInterval);
  const appliedCustomBeats = useRef<CustomBeat[]>(customBeats);

  // Store pending new parameters
  const pendingParams = useRef<WaveParams>(waveParams);
  const pendingPixelsPerMv = useRef<number>(pixelsPerMv);
  const pendingRWaveEnabled = useRef<boolean>(rWaveEnabled);
  const pendingRWaveCount = useRef<number>(rWaveCount);
  const pendingRWaveInterval = useRef<number>(rWaveInterval);
  const pendingPWaveEnabled = useRef<boolean>(pWaveEnabled);
  const pendingPWaveCount = useRef<number>(pWaveCount);
  const pendingPWaveInterval = useRef<number>(pWaveInterval);
  const pendingUseCustomBeatParameters = useRef<boolean>(useCustomBeatParameters);
  const pendingRepeatInterval = useRef<number>(repeatInterval);
  const pendingCustomBeats = useRef<CustomBeat[]>(customBeats);

  // ==================== Helper Functions ====================

  const raisedCosinePulse = (t: number, h: number, b: number, t0: number): number => {
    if (b === 0 || t < t0 || t > t0 + b) return 0;
    return (h / 2) * (1 - Math.cos((2 * Math.PI * (t - t0)) / b));
  };

  const pointsToPath = (pts: (Point | null)[]): string => {
    return pts.reduce((str, p, i) => {
      if (!p) return str;
      return str + (i === 0 || !pts[i - 1] ? "M" : " L") + ` ${p.x} ${p.y}`;
    }, "");
  };

  const generateGrid = (): React.ReactElement[] => {
    const elements: React.ReactElement[] = [];
    const small = 8;

    for (let x = 0; x <= SVG_WIDTH; x += small) {
      elements.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={SVG_HEIGHT}
          stroke="#eee"
          strokeWidth="1"
        />
      );
    }

    for (let y = 0; y <= SVG_HEIGHT; y += small) {
      elements.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={SVG_WIDTH}
          y2={y}
          stroke="#eee"
          strokeWidth="1"
        />
      );
    }

    return elements;
  };

  const [, forceUpdate] = useState({});
  const triggerRerender = () => forceUpdate({});

  // ==================== Waveform Generation ====================
  const generateWaveformSegment = useCallback((startTime: number, endTime: number, useNewParams: boolean = false, updateGlobalCounters: boolean = true): Point[] => {
    const y0 = SVG_HEIGHT / 2;
    const pts: Point[] = [];
    const dt = 1 / PIXELS_PER_SECOND;

    // Choose which parameters to use
    const currentWaveParams = useNewParams ? pendingParams.current : appliedParams.current;
    const currentPixelsPerMv = useNewParams ? pendingPixelsPerMv.current : appliedPixelsPerMv.current;
    const currentRWaveEnabled = useNewParams ? pendingRWaveEnabled.current : appliedRWaveEnabled.current;
    const currentRWaveCount = useNewParams ? pendingRWaveCount.current : appliedRWaveCount.current;
    const currentRWaveInterval = useNewParams ? pendingRWaveInterval.current : appliedRWaveInterval.current;
    const currentPWaveEnabled = useNewParams ? pendingPWaveEnabled.current : appliedPWaveEnabled.current;
    const currentPWaveCount = useNewParams ? pendingPWaveCount.current : appliedPWaveCount.current;
    const currentPWaveInterval = useNewParams ? pendingPWaveInterval.current : appliedPWaveInterval.current;
    const currentUseCustomBeatParameters = useNewParams ? pendingUseCustomBeatParameters.current : appliedUseCustomBeatParameters.current;
    const currentRepeatInterval = useNewParams ? pendingRepeatInterval.current : appliedRepeatInterval.current;
    const currentCustomBeats = useNewParams ? pendingCustomBeats.current : appliedCustomBeats.current;

    // Use global counters - THESE ARE CONTINUOUS AND NEVER RESET
    let rCycleCounterLocal = globalRCycleCounter.current;
    let pCycleCounterLocal = globalPCycleCounter.current;
    let beatCounter = globalBeatCounter.current;
    let customIdx = globalCustomIdx.current;
    let waitingNormalBeats = globalWaitingNormalBeats.current;

    let tElapsed = startTime;

    while (tElapsed < endTime) {
      let pCurrent = { ...currentWaveParams };

      if (currentUseCustomBeatParameters) {
        if (currentCustomBeats.length > 0 && waitingNormalBeats === 0) {
          pCurrent = { ...currentWaveParams, ...currentCustomBeats[customIdx] };
          customIdx++;
          if (customIdx >= currentCustomBeats.length) {
            customIdx = 0;
            waitingNormalBeats = currentRepeatInterval;
          }
        } else if (waitingNormalBeats > 0) {
          waitingNormalBeats--;
        }
      }

      let curPCount = pCurrent.n_p;
      if (currentPWaveEnabled) {
        pCycleCounterLocal++;
        if (currentPWaveInterval > 0 && pCycleCounterLocal >= currentPWaveInterval) {
          curPCount = currentPWaveCount;
          pCycleCounterLocal = 0;
        }
      }

      let curRCount = 1;
      if (currentRWaveEnabled) {
        rCycleCounterLocal++;
        if (currentRWaveInterval > 0 && rCycleCounterLocal >= currentRWaveInterval) {
          curRCount = currentRWaveCount;
          rCycleCounterLocal = 0;
        }
      }

      const base = curPCount * (pCurrent.b_p + pCurrent.l_pq)
        + (pCurrent.b_q + pCurrent.b_r + pCurrent.b_s) * (curRCount > 0 ? 1 : 0)
        + pCurrent.l_st + pCurrent.b_t + pCurrent.l_tp;

      const heart_period = 60 / (pCurrent.heart_rate || 60);
      const sf = heart_period / base;

      const s = {
        b_p: pCurrent.b_p * sf, l_pq: pCurrent.l_pq * sf,
        b_q: pCurrent.b_q * sf, b_r: pCurrent.b_r * sf,
        b_s: pCurrent.b_s * sf, l_st: pCurrent.l_st * sf,
        b_t: pCurrent.b_t * sf, l_tp: pCurrent.l_tp * sf
      };

      const cycleDuration = curPCount * (s.b_p + s.l_pq)
        + (curRCount > 0 ? (s.b_q + s.b_r + s.b_s) : 0)
        + s.l_st + s.b_t + s.l_tp;

      const times = (() => {
        let off = tElapsed;
        const t = { P: [] as number[], Q: 0, R: [] as number[], S: [] as number[], T: 0 };

        for (let i = 0; i < curPCount; i++) {
          t.P.push(off + i * (s.b_p + s.l_pq));
        }
        off += curPCount * (s.b_p + s.l_pq);

        if (curRCount > 0) {
          for (let i = 0; i < curRCount; i++) {
            t.Q = off;
            off += s.b_q;
            t.R.push(off);
            off += s.b_r;
            t.S.push(off);
            off += s.b_s;
            if (i < curRCount - 1) off += s.l_pq / 2;
          }
        }
        off += s.l_st;
        t.T = off;
        return t;
      })();

      const tEnd = Math.min(tElapsed + cycleDuration, endTime);

      for (let t = tElapsed; t < tEnd; t += dt) {
        let v = 0;
        for (let start of times.P) {
          if (t >= start && t < start + s.b_p) {
            v = raisedCosinePulse(t, pCurrent.h_p, s.b_p, start);
            break;
          }
        }
        if (!v && curRCount > 0 && t >= times.Q && t < times.Q + s.b_q) {
          v = raisedCosinePulse(t, pCurrent.h_q, s.b_q, times.Q);
        }
        if (!v && curRCount > 0) {
          for (let r of times.R) {
            if (t >= r && t < r + s.b_r) {
              v = raisedCosinePulse(t, pCurrent.h_r, s.b_r, r);
              break;
            }
          }
        }
        if (!v && curRCount > 0) {
          for (let sWave of times.S) {
            if (t >= sWave && t < sWave + s.b_s) {
              v = raisedCosinePulse(t, pCurrent.h_s, s.b_s, sWave);
              break;
            }
          }
        }
        if (!v && t >= times.T && t < times.T + s.b_t) {
          v = raisedCosinePulse(t, pCurrent.h_t, s.b_t, times.T);
        }

        pts.push({
          x: t * PIXELS_PER_SECOND,
          y: y0 - v * currentPixelsPerMv
        });
      }

      if (tEnd >= tElapsed + cycleDuration) {
        tElapsed += cycleDuration;
        beatCounter++;
      } else {
        break;
      }
    }

    // Update global counters only if specified (this maintains continuity)
    if (updateGlobalCounters) {
      globalRCycleCounter.current = rCycleCounterLocal;
      globalPCycleCounter.current = pCycleCounterLocal;
      globalBeatCounter.current = beatCounter;
      globalCustomIdx.current = customIdx;
      globalWaitingNormalBeats.current = waitingNormalBeats;
    }

    return pts;
  }, []);

  const generateWaveformPoints = useCallback((): Point[] => {
    const totalTime = SVG_WIDTH / PIXELS_PER_SECOND;
    return generateWaveformSegment(0, totalTime, false, true);
  }, [generateWaveformSegment]);

  // ==================== Animation Logic ====================
  const animationLoop = useCallback((ts: number) => {
    const dt = lastTimestamp.current ? (ts - lastTimestamp.current) / 1000 : 0;
    lastTimestamp.current = ts;
    pointerX.current += PIXELS_PER_SECOND * dt;

    // Check if we've reached the update point
    if (pendingUpdateX.current !== null && pointerX.current >= pendingUpdateX.current && newParametersReady.current) {
      // Update applied parameters
      appliedParams.current = { ...pendingParams.current };
      appliedPixelsPerMv.current = pendingPixelsPerMv.current;
      appliedRWaveEnabled.current = pendingRWaveEnabled.current;
      appliedRWaveCount.current = pendingRWaveCount.current;
      appliedRWaveInterval.current = pendingRWaveInterval.current;
      appliedPWaveEnabled.current = pendingPWaveEnabled.current;
      appliedPWaveCount.current = pendingPWaveCount.current;
      appliedPWaveInterval.current = pendingPWaveInterval.current;
      appliedUseCustomBeatParameters.current = pendingUseCustomBeatParameters.current;
      appliedRepeatInterval.current = pendingRepeatInterval.current;
      appliedCustomBeats.current = [...pendingCustomBeats.current];

      // Generate new waveform segment from this point onwards
      const currentTimeInSeconds = pointerX.current / PIXELS_PER_SECOND;
      const remainingTime = (SVG_WIDTH - pointerX.current) / PIXELS_PER_SECOND;
      const newSegment = generateWaveformSegment(currentTimeInSeconds, currentTimeInSeconds + remainingTime, true, true);
     
      // Update the path points from current position onwards
      const currentIndex = Math.floor(pointerX.current / (1000 / pathPoints.current.length));
      for (let i = 0; i < newSegment.length && currentIndex + i < pathPoints.current.length; i++) {
        pathPoints.current[currentIndex + i] = newSegment[i];
      }

      pendingUpdateX.current = null;
      newParametersReady.current = false;
    }

    let idx = pathPoints.current.findIndex(pt => pt.x >= pointerX.current);
    if (idx < 0) idx = pathPoints.current.length - 1;

    if (firstSweep.current) {
      drawnPoints.current = pathPoints.current.slice(0, idx + 1);
      if (pointerX.current > SVG_WIDTH) firstSweep.current = false;
    } else {
      if (pointerX.current > SVG_WIDTH) {
        pointerX.current = 0;
        // Apply changes at the beginning of new sweep if they're queued for next iteration
        if (pendingNextIteration.current) {
          appliedParams.current = { ...pendingParams.current };
          appliedPixelsPerMv.current = pendingPixelsPerMv.current;
          appliedRWaveEnabled.current = pendingRWaveEnabled.current;
          appliedRWaveCount.current = pendingRWaveCount.current;
          appliedRWaveInterval.current = pendingRWaveInterval.current;
          appliedPWaveEnabled.current = pendingPWaveEnabled.current;
          appliedPWaveCount.current = pendingPWaveCount.current;
          appliedPWaveInterval.current = pendingPWaveInterval.current;
          appliedUseCustomBeatParameters.current = pendingUseCustomBeatParameters.current;
          appliedRepeatInterval.current = pendingRepeatInterval.current;
          appliedCustomBeats.current = [...pendingCustomBeats.current];
          pendingNextIteration.current = false;
        }
        // IMPORTANT: Generate new waveform but DON'T reset global counters
        // This ensures continuity across screen sweeps
        pathPoints.current = generateWaveformPoints();
      }
     
      const es = pointerX.current - ERASE_WIDTH / 2;
      const ee = pointerX.current + ERASE_WIDTH / 2;
      const si = drawnPoints.current.findIndex(pt => pt && pt.x >= es);
      const ei = drawnPoints.current.findIndex(pt => pt && pt.x > ee);

      for (let i = (si < 0 ? 0 : si); i < (ei < 0 ? drawnPoints.current.length : ei); i++) {
        drawnPoints.current[i] = pathPoints.current[i];
      }
    }

    triggerRerender();
    animationFrameId.current = requestAnimationFrame(animationLoop);
  }, [generateWaveformPoints, generateWaveformSegment]);

  // ==================== Parameter Management ====================
  const applyChanges = () => {
    // Store the new parameters to be applied immediately from current position
    pendingParams.current = { ...waveParams };
    pendingPixelsPerMv.current = pixelsPerMv;
    pendingRWaveEnabled.current = rWaveEnabled;
    pendingRWaveCount.current = rWaveCount;
    pendingRWaveInterval.current = rWaveInterval;
    pendingPWaveEnabled.current = pWaveEnabled;
    pendingPWaveCount.current = pWaveCount;
    pendingPWaveInterval.current = pWaveInterval;
    pendingUseCustomBeatParameters.current = useCustomBeatParameters;
    pendingRepeatInterval.current = repeatInterval;
    pendingCustomBeats.current = [...customBeats];

    // Apply immediately from current position
    pendingUpdateX.current = pointerX.current;
    newParametersReady.current = true;
    pendingNextIteration.current = false; // Clear any pending iteration changes
  };

  const queueChangesForNextIteration = () => {
    pendingParams.current = { ...waveParams };
    pendingPixelsPerMv.current = pixelsPerMv;
    pendingRWaveEnabled.current = rWaveEnabled;
    pendingRWaveCount.current = rWaveCount;
    pendingRWaveInterval.current = rWaveInterval;
    pendingPWaveEnabled.current = pWaveEnabled;
    pendingPWaveCount.current = pWaveCount;
    pendingPWaveInterval.current = pWaveInterval;
    pendingUseCustomBeatParameters.current = useCustomBeatParameters;
    pendingRepeatInterval.current = repeatInterval;
    pendingCustomBeats.current = [...customBeats];

    // Mark that changes should be applied on next iteration
    pendingNextIteration.current = true;
    // Clear any immediate update markers
    pendingUpdateX.current = null;
    newParametersReady.current = false;
  };

  // Auto-queue changes for next iteration when parameters change
  useEffect(() => {
    queueChangesForNextIteration();
  }, [waveParams, pixelsPerMv, rWaveEnabled, rWaveCount, rWaveInterval, pWaveEnabled, pWaveCount, pWaveInterval, useCustomBeatParameters, repeatInterval, customBeats]);

  // ==================== Custom Beat Management ====================
  const addCustomBeat = () => {
    setCustomBeats([...customBeats, { ...DEFAULT_CUSTOM_BEAT }]);
  };

  const removeCustomBeat = (index: number) => {
    setCustomBeats(customBeats.filter((_, i) => i !== index));
  };

  const updateCustomBeat = (index: number, key: keyof CustomBeat, value: number) => {
    const updated = [...customBeats];
    updated[index] = { ...updated[index], [key]: value };
    setCustomBeats(updated);
  };

  // ==================== Initialization and Cleanup ====================
  useEffect(() => {
    pathPoints.current = generateWaveformPoints();
    drawnPoints.current = Array(pathPoints.current.length).fill(null);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    animationFrameId.current = requestAnimationFrame(animationLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animationLoop, generateWaveformPoints]);

  const getCurrentPointer = (): Point => {
    let idx = pathPoints.current.findIndex(pt => pt.x >= pointerX.current);
    if (idx < 0) idx = pathPoints.current.length - 1;
    return pathPoints.current[idx] || { x: 0, y: SVG_HEIGHT / 2 };
  };

  const currentPointer = getCurrentPointer();

  // ==================== Render ====================
  return (
    <div className="font-sans bg-gray-50 text-gray-800 min-h-screen p-5">
      <h1 className="text-3xl font-bold text-gray-700 mb-6 text-center md:text-left">ECG Waveform Animator (Progressive Updates)</h1>

      <div className="flex flex-col lg:flex-row gap-8 flex-wrap">
        {/* Controls Panel */}
        <div className="flex-1 min-w-80 bg-white p-5 rounded-lg shadow-lg max-h-screen overflow-y-auto">
          {/* Basic Parameters */}
          <h2 className="text-xl font-semibold mb-4">Basic Parameters</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <label className="flex-1 sm:min-w-36 text-sm text-gray-600">Heart Rate (bpm):</label>
            <input
              type="number"
              value={waveParams.heart_rate}
              onChange={(e) => setWaveParams({ ...waveParams, heart_rate: parseFloat(e.target.value) })}
              className="flex-1 sm:min-w-16 p-1 border rounded w-full"
              step="1"
              min="20"
              max="250"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <label className="flex-1 sm:min-w-36 text-sm text-gray-600">Pixels per mV:</label>
            <input
              type="number"
              value={pixelsPerMv}
              onChange={(e) => setPixelsPerMv(parseFloat(e.target.value))}
              className="flex-1 sm:min-w-16 p-1 border rounded w-full"
              step="10"
              min="10"
            />
          </div>

          {/* Wave Parameters */}
          <h2 className="text-xl font-semibold mt-6 mb-4">Wave Parameters (mV, sec)</h2>

          {WAVE_PARAMETERS.map(({ key, label, step }) => (
            <div key={key} className="flex flex-col sm:flex-row items-center gap-3 mb-3">
              <label className="flex-1 sm:min-w-36 text-sm text-gray-600">{label}:</label>
              <input
                type="number"
                value={waveParams[key]}
                onChange={(e) => setWaveParams({ ...waveParams, [key]: parseFloat(e.target.value) })}
                className="flex-1 sm:min-w-16 p-1 border rounded w-full"
                step={step}
              />
            </div>
          ))}

          {/* Dynamic R Wave Pattern */}
          <h2 className="text-xl font-semibold mt-6 mb-4">Dynamic R Wave Pattern</h2>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rWaveEnabled}
                onChange={(e) => setRWaveEnabled(e.target.checked)}
              />
              Enable R Wave Pattern
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <label className="flex-1 sm:min-w-36 text-sm text-gray-600">R Waves in Pattern:</label>
            <input
              type="number"
              value={rWaveCount}
              onChange={(e) => setRWaveCount(parseInt(e.target.value))}
              className="flex-1 sm:min-w-16 p-1 border rounded w-full"
              step="1"
              min="0"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <label className="flex-1 sm:min-w-36 text-sm text-gray-600">Apply After N QRS:</label>
            <input
              type="number"
              value={rWaveInterval}
              onChange={(e) => setRWaveInterval(parseInt(e.target.value))}
              className="flex-1 sm:min-w-16 p-1 border rounded w-full"
              step="1"
              min="0"
            />
          </div>

          {/* Dynamic P Wave Pattern */}
          <h2 className="text-xl font-semibold mt-6 mb-4">Dynamic P Wave Pattern</h2>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pWaveEnabled}
                onChange={(e) => setPWaveEnabled(e.target.checked)}
              />
              Enable P Wave Pattern
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <label className="flex-1 sm:min-w-36 text-sm text-gray-600">P Waves in Pattern:</label>
            <input
              type="number"
              value={pWaveCount}
              onChange={(e) => setPWaveCount(parseInt(e.target.value))}
              className="flex-1 sm:min-w-16 p-1 border rounded w-full"
              step="1"
              min="0"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <label className="flex-1 sm:min-w-36 text-sm text-gray-600">Apply After N QRS:</label>
            <input
              type="number"
              value={pWaveInterval}
              onChange={(e) => setPWaveInterval(parseInt(e.target.value))}
              className="flex-1 sm:min-w-16 p-1 border rounded w-full"
              step="1"
              min="0"
            />
          </div>

          {/* Custom Beat Sequence */}
          <h2 className="text-xl font-semibold mt-6 mb-4">Custom Beat Sequence</h2>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useCustomBeatParameters}
                onChange={(e) => setUseCustomBeatParameters(e.target.checked)}
              />
              Enable Custom Beat Sequence
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <label className="flex-1 sm:min-w-36 text-sm text-gray-600">Normal Beats Before Repeat:</label>
            <input
              type="number"
              value={repeatInterval}
              onChange={(e) => setRepeatInterval(parseInt(e.target.value))}
              className="flex-1 sm:min-w-16 p-1 border rounded w-full"
              step="1"
              min="0"
            />
          </div>

          {customBeats.map((beat, index) => (
            <CustomBeatEditor
              key={index}
              beat={beat}
              index={index}
              onUpdate={updateCustomBeat}
              onRemove={removeCustomBeat}
            />
          ))}

          <button
            onClick={addCustomBeat}
            className="w-full bg-green-600 text-white p-2 rounded font-semibold hover:bg-green-700 mb-4"
          >
            + Add Custom Beat
          </button>

          <button
            onClick={applyChanges}
            className="w-full bg-blue-500 text-white p-3 rounded font-semibold text-lg hover:bg-blue-600 mb-4"
          >
            Apply Changes Immediately
          </button>

          {/* Status indicator */}
          {newParametersReady.current && (
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
              Parameters will update when pointer reaches the marked position
            </div>
          )}
        </div>

        {/* SVG Display */}
        <div className="flex-2 w-full lg:min-w-96 overflow-x-auto">
          <svg
            ref={svgRef}
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            className="border border-gray-300 bg-white rounded-lg shadow-lg"
          >
            <g>{generateGrid()}</g>
            <path
              d={pointsToPath(drawnPoints.current)}
              stroke="#2c3e50"
              fill="none"
              strokeWidth="2"
            />
            {/* Show pending update position */}
            {pendingUpdateX.current !== null && newParametersReady.current && (
              <line
                x1={pendingUpdateX.current}
                y1={0}
                x2={pendingUpdateX.current}
                y2={SVG_HEIGHT}
                stroke="#ff6b6b"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
              />
            )}
            <circle
              cx={currentPointer.x}
              cy={currentPointer.y}
              r={POINTER_RADIUS}
              fill="#fff"
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ECGWaveformAnimator;
