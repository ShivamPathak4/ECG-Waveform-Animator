import React from 'react';
import type { Point } from '../types/ecg';
import { useECGAnimation } from '../hooks/useECGAnimation';

interface ECGCanvasProps {
  pathPoints: Point[]; // The array of waveform points to be animated
}

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 400;

const ECGCanvas: React.FC<ECGCanvasProps> = ({ pathPoints }) => {
  // Use the custom hook to handle SVG initialization and animation
  const { svgRef } = useECGAnimation({ pathPoints });

  return (
    <div className="w-full lg:flex-2">
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          className="border border-gray-300 bg-white rounded-lg shadow-sm min-w-full lg:min-w-96"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    </div>
  );
};

export default ECGCanvas;