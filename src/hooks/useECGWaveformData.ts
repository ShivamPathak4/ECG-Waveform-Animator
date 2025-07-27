import { useCallback, useRef } from 'react';
import type { WaveParams, CustomBeat, Point } from '../types/ecg';

interface ECGWaveformDataHookProps {
  waveParams: WaveParams;
  pixelsPerMv: number;
  rWaveEnabled: boolean;
  rWaveCount: number;
  rWaveInterval: number;
  pWaveEnabled: boolean;
  pWaveCount: number;
  pWaveInterval: number;
  useCustomBeatParameters: boolean;
  repeatInterval: number;
  customBeats: CustomBeat[];
}

interface GlobalCounters {
  beatCounter: number;
  customIdx: number;
  waitingNormalBeats: number;
  rCycleCounter: number;
  pCycleCounter: number;
}

const PIXELS_PER_SECOND = 150;
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 400;

/**
 * Custom hook to generate ECG waveform data points.
 * It encapsulates the complex waveform generation logic and state management related to beat patterns.
 */
export const useECGWaveformData = ({
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
}: ECGWaveformDataHookProps) => {

  // Global counters to persist beat state across re-renders for a continuous waveform
  const globalCountersRef = useRef<GlobalCounters>({
    beatCounter: 0,
    customIdx: 0,
    waitingNormalBeats: 0,
    rCycleCounter: 0,
    pCycleCounter: 0,
  });

  /**
   * Utility function to calculate a raised cosine pulse.
   * This is used to model the shape of the ECG waves (P, QRS, T).
   * @param t Current time.
   * @param h Height (amplitude) of the pulse.
   * @param b Breadth (duration) of the pulse.
   * @param t0 Start time of the pulse.
   * @returns The amplitude at time 't'.
   */
  const raisedCosinePulse = useCallback((t: number, h: number, b: number, t0: number): number => {
    if (b === 0 || t < t0 || t > t0 + b) return 0;
    return (h / 2) * (1 - Math.cos((2 * Math.PI * (t - t0)) / b));
  }, []);

  /**
   * Generates an array of points representing the ECG waveform.
   * This function calculates the shape of P, QRS, and T waves based on parameters,
   * applying dynamic patterns and custom beats.
   * @returns An array of Point objects {x, y} for the waveform.
   */
  const generateWaveformPoints = useCallback((): Point[] => {
    const totalTime = SVG_WIDTH / PIXELS_PER_SECOND;
    const y0 = SVG_HEIGHT / 2; // Midline of the SVG for baseline
    const pts: Point[] = [];
    const dt = 1 / PIXELS_PER_SECOND; // Time step for generating points

    // Destructure mutable counters from the ref
    let { beatCounter, customIdx, waitingNormalBeats, rCycleCounter, pCycleCounter } = globalCountersRef.current;
    let tElapsed = 0; // Time elapsed within the current waveform generation

    // Loop to generate points until the entire SVG width is covered
    while (tElapsed <= totalTime) {
      let pCurrent = { ...waveParams }; // Use a mutable copy of waveParams for this cycle

      // --- Apply Custom Beat Parameters ---
      if (useCustomBeatParameters && customBeats.length > 0) {
        if (waitingNormalBeats === 0) {
          // If no normal beats are pending, apply a custom beat
          pCurrent = { ...pCurrent, ...customBeats[customIdx] };
          customIdx++;
          // Reset customIdx and set normal beat interval if all custom beats are used
          if (customIdx >= customBeats.length) {
            customIdx = 0;
            waitingNormalBeats = repeatInterval;
          }
        } else if (waitingNormalBeats > 0) {
          // Decrement normal beat counter
          waitingNormalBeats--;
        }
      }

      // --- Apply Dynamic P Wave Pattern ---
      let curPCount = pCurrent.n_p; // Default P wave count
      if (pWaveEnabled) {
        pCycleCounter++;
        // If the P wave interval is reached, apply the custom P wave count
        if (pWaveInterval > 0 && pCycleCounter >= pWaveInterval) {
          curPCount = pWaveCount;
          pCycleCounter = 0; // Reset P wave cycle counter
        }
      }

      // --- Apply Dynamic R Wave Pattern ---
      let curRCount = 1; // Default R wave count (1 R wave per QRS)
      if (rWaveEnabled) {
        rCycleCounter++;
        // If the R wave interval is reached, apply the custom R wave count
        if (rWaveInterval > 0 && rCycleCounter >= rWaveInterval) {
          curRCount = rWaveCount;
          rCycleCounter = 0; // Reset R wave cycle counter
        }
      }

      // Calculate the base duration of a single ECG cycle based on current parameters
      const base = curPCount * (pCurrent.b_p + pCurrent.l_pq) +
                   (pCurrent.b_q + pCurrent.b_r + pCurrent.b_s) * (curRCount > 0 ? 1 : 0) +
                   pCurrent.l_st + pCurrent.b_t + pCurrent.l_tp;

      // Calculate the scaling factor (sf) to adjust the beat duration to the desired heart rate
      const heart_period = 60 / (pCurrent.heart_rate || 60); // Period for the target heart rate
      const sf = heart_period / base; // Scaling factor

      // Scaled durations of segments
      const s = {
        b_p: pCurrent.b_p * sf,
        l_pq: pCurrent.l_pq * sf,
        b_q: pCurrent.b_q * sf,
        b_r: pCurrent.b_r * sf,
        b_s: pCurrent.b_s * sf,
        l_st: pCurrent.l_st * sf,
        b_t: pCurrent.b_t * sf,
        l_tp: pCurrent.l_tp * sf,
      };

      // Calculate the total duration of the current ECG cycle
      const cycleDuration = curPCount * (s.b_p + s.l_pq) +
                            (curRCount > 0 ? (s.b_q + s.b_r + s.b_s) : 0) +
                            s.l_st + s.b_t + s.l_tp;

      // Initialize offsets for wave timings within the current cycle
      let off = tElapsed;
      const times = {
        P: [] as number[], // Array to store start times of P waves
        Q: 0,
        R: [] as number[], // Array to store start times of R waves
        S: [] as number[], // Array to store start times of S waves
        T: 0,
      };

      // --- Calculate Wave Timing Offsets for the Current Cycle ---
      // P waves
      for (let i = 0; i < curPCount; i++) {
        times.P.push(off + i * (s.b_p + s.l_pq));
      }
      off += curPCount * (s.b_p + s.l_pq);

      // QRS complex
      if (curRCount > 0) {
        for (let i = 0; i < curRCount; i++) {
          times.Q = off; // Start of Q wave
          off += s.b_q;
          times.R.push(off); // Start of R wave
          off += s.b_r;
          times.S.push(off); // Start of S wave
          off += s.b_s;
          // Add extra spacing between multiple QRS complexes within a cycle
          if (i < curRCount - 1) off += s.l_pq / 2;
        }
      }
      off += s.l_st; // ST segment
      times.T = off; // Start of T wave

      const tEnd = tElapsed + cycleDuration; // End time of the current cycle

      // --- Generate Points for This Cycle ---
      for (let t = tElapsed; t < tEnd; t += dt) {
        let v = 0; // Voltage value at current time 't'

        // P waves contribution
        for (let start of times.P) {
          if (t >= start && t < start + s.b_p) {
            v = raisedCosinePulse(t, pCurrent.h_p, s.b_p, start);
            break;
          }
        }

        // Q wave contribution (only if no P wave contribution at this time)
        if (!v && curRCount > 0 && t >= times.Q && t < times.Q + s.b_q) {
          v = raisedCosinePulse(t, pCurrent.h_q, s.b_q, times.Q);
        }

        // R waves contribution (only if no P or Q wave contribution)
        if (!v && curRCount > 0) {
          for (let r of times.R) {
            if (t >= r && t < r + s.b_r) {
              v = raisedCosinePulse(t, pCurrent.h_r, s.b_r, r);
              break;
            }
          }
        }

        // S waves contribution (only if no P, Q, or R wave contribution)
        if (!v && curRCount > 0) {
          for (let sWave of times.S) {
            if (t >= sWave && t < sWave + s.b_s) {
              v = raisedCosinePulse(t, pCurrent.h_s, s.b_s, sWave);
              break;
            }
          }
        }

        // T wave contribution (only if no other wave contribution)
        if (!v && t >= times.T && t < times.T + s.b_t) {
          v = raisedCosinePulse(t, pCurrent.h_t, s.b_t, times.T);
        }

        // Add the calculated point to the array
        pts.push({
          x: t * PIXELS_PER_SECOND, // Convert time to SVG x-coordinate
          y: y0 - v * pixelsPerMv // Convert voltage to SVG y-coordinate (inverted for SVG)
        });
      }

      tElapsed += cycleDuration; // Move to the next cycle's start time
      beatCounter++; // Increment beat counter
    }

    // Update global counters for the next call to persist state
    globalCountersRef.current = {
      beatCounter,
      customIdx,
      waitingNormalBeats,
      rCycleCounter,
      pCycleCounter,
    };

    return pts;
  }, [
    waveParams, pixelsPerMv, rWaveEnabled, rWaveCount, rWaveInterval,
    pWaveEnabled, pWaveCount, pWaveInterval, useCustomBeatParameters,
    repeatInterval, customBeats, raisedCosinePulse
  ]);

  // Reset the global counters (e.g., when "Apply Changes" button is clicked)
  const resetGlobalCounters = useCallback(() => {
    globalCountersRef.current = {
      beatCounter: 0,
      customIdx: 0,
      waitingNormalBeats: 0,
      rCycleCounter: 0,
      pCycleCounter: 0,
    };
  }, []);

  return { generateWaveformPoints, resetGlobalCounters };
};
