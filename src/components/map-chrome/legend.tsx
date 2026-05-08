"use client";

import { useMapStore } from "@/store/map-store";

export function Legend() {
  const { compositing, years, admPath } = useMapStore();

  const scopeLabel = admPath.length > 0
    ? admPath[admPath.length - 1].toUpperCase()
    : "VIEWPORT";

  return (
    <div
      className="floating-legend"
      role="figure"
      aria-label={`Land surface temperature legend showing ${compositing} values for ${years.join(", ")}, ranging from 22 to 54 degrees Celsius`}
    >
      <div className="head">
        <span>LAND SURFACE TEMPERATURE · °C</span>
        <span className="auto">AUTO · {scopeLabel}</span>
      </div>
      <div className="legend-bar" aria-hidden="true">
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
      <div className="legend-axis" aria-hidden="true">
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
