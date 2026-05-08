"use client";

import { useMapStore } from "@/store/map-store";

export function Legend() {
  const { compositing, years, admPath } = useMapStore();

  const scopeLabel = admPath.length > 0
    ? admPath[admPath.length - 1].toUpperCase()
    : "VIEWPORT";

  return (
    <div className="floating-legend">
      <div className="head">
        <span>LAND SURFACE TEMPERATURE · °C</span>
        <span className="auto">AUTO · {scopeLabel}</span>
      </div>
      <div className="legend-bar">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="legend-axis">
        <span>22°</span>
        <span>30°</span>
        <span>38°</span>
        <span>46°</span>
        <span>54°</span>
      </div>
      <div className="legend-meta">
        <span>
          {compositing} · {years.join(", ")}
        </span>
        <span>°C surface</span>
      </div>
    </div>
  );
}
