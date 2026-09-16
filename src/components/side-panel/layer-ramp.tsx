"use client";

/**
 * A colour scale beneath a layer toggle.
 *
 * The map used to float a legend over itself for each raster. The only thing
 * that told you which was the ramp, so it lives with the layer it belongs to.
 */
interface LayerRampProps {
  stops: readonly string[];
  /** Label at the low end of the scale. */
  min: string;
  /** Label at the high end. */
  max: string;
  /** Describes the scale for a screen reader. */
  label: string;
}

export function LayerRamp({ stops, min, max, label }: LayerRampProps) {
  return (
    <div className="layer-ramp" role="figure" aria-label={label}>
      <div className="legend-bar" aria-hidden="true">
        {stops.map((hex) => (
          <span key={hex} style={{ background: hex }} />
        ))}
      </div>
      <div className="layer-ramp-axis" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
