"use client";

import { Plus, Minus, Locate, Sun, Moon } from "@/components/icons";
import { useMapStore } from "@/store/map-store";

interface ZoomStackProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

export function ZoomStack({ onZoomIn, onZoomOut, onLocate }: ZoomStackProps) {
  const { theme, toggleTheme } = useMapStore();

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
        onClick={toggleTheme}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "dark" ? (
          <Sun size={16} aria-hidden="true" />
        ) : (
          <Moon size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
