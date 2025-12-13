import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface PDFZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const PDFZoomControls: React.FC<PDFZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset
}) => {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Zoom out"
      >
        <ZoomOut size={16} />
      </button>

      <span className="w-12 text-center text-gray-600 text-xs font-medium">
        {zoomPercent}%
      </span>

      <button
        onClick={onZoomIn}
        disabled={zoom >= 3}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Zoom in"
      >
        <ZoomIn size={16} />
      </button>

      <button
        onClick={onReset}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors ml-1"
        title="Reset zoom"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
};
