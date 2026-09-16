"use client";

import { Plus, Minus, Locate, CircleQuestionMark } from "@/components/icons";
import { useMapStore } from "@/store/map-store";

interface ZoomStackProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

export function ZoomStack({ onZoomIn, onZoomOut, onLocate }: ZoomStackProps) {
  // The walkthrough is app state rather than a map action, so this button
  // reaches the store directly instead of taking a callback like the others.
  const setWalkthroughOpen = useMapStore((state) => state.setWalkthroughOpen);

  return (
    <div className="zoom-stack" role="group" aria-label="Map controls">
      <button
        onClick={onZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
      <button
        onClick={onZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <button
        onClick={onLocate}
        title="Go to my location"
        aria-label="Go to my location"
      >
        <Locate size={16} aria-hidden="true" />
      </button>
      <button
        onClick={() => setWalkthroughOpen(true)}
        title="Replay the walkthrough"
        aria-label="Replay the walkthrough"
      >
        <CircleQuestionMark size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
