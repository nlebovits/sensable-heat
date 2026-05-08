"use client";

import { Plus, Minus, Locate } from "@/components/icons";
import { useMapStore } from "@/store/map-store";

interface ZoomStackProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

export function ZoomStack({ onZoomIn, onZoomOut, onLocate }: ZoomStackProps) {
  return (
    <div className="zoom-stack">
      <button onClick={onZoomIn} title="Zoom in">
        <Plus size={16} />
      </button>
      <button onClick={onZoomOut} title="Zoom out">
        <Minus size={16} />
      </button>
      <button onClick={onLocate} title="Go to my location">
        <Locate size={16} />
      </button>
    </div>
  );
}
