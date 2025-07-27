/**
 * Interface for the main waveform parameters.
 */
export interface WaveParams {
  heart_rate: number;
  h_p: number; // P Wave Height
  b_p: number; // P Wave Breadth
  h_q: number; // Q Wave Height
  b_q: number; // Q Wave Breadth
  h_r: number; // R Wave Height
  b_r: number; // R Wave Breadth
  h_s: number; // S Wave Height
  b_s: number; // S Wave Breadth
  h_t: number; // T Wave Height
  b_t: number; // T Wave Breadth
  l_pq: number; // PQ Segment Length
  l_st: number; // ST Segment Length
  l_tp: number; // TP Segment Length
  n_p: number;  // Default P Waves per QRS complex
}

/**
 * Interface for defining a custom beat, extending basic wave parameters.
 */
export interface CustomBeat {
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

/**
 * Interface for a point on the SVG path.
 */
export interface Point {
  x: number;
  y: number;
}

