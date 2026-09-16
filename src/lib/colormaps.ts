// Colour ramps, prepared for the GPU.
//
// `Colormap` from deck.gl-raster samples a 2d-array texture whose every layer
// is one 256x1 RGBA row. Each ramp here becomes one such texture, so colouring
// happens in the fragment shader rather than per pixel on the CPU.

import { createColormapTexture } from "@developmentseed/deck.gl-raster/gpu-modules";
import type { Device, Texture } from "@luma.gl/core";
import { HEAT_RAMP, CANOPY_RAMP } from "@/lib/config";

/** Entries in the lookup table. `createColormapTexture` requires exactly 256. */
const LUT_SIZE = 256;

/** Parse hex colors to RGB arrays */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/** Interpolate a list of hex stops into a 256-entry RGBA lookup table. */
function buildLut(stops: readonly string[]): Uint8ClampedArray<ArrayBuffer> {
  const colors = stops.map(hexToRgb);
  const lut = new Uint8ClampedArray(LUT_SIZE * 4);

  for (let i = 0; i < LUT_SIZE; i++) {
    const t = i / (LUT_SIZE - 1);
    const pos = t * (colors.length - 1);
    const idx = Math.floor(pos);
    const frac = pos - idx;

    const c0 = colors[Math.min(idx, colors.length - 1)];
    const c1 = colors[Math.min(idx + 1, colors.length - 1)];

    lut[i * 4 + 0] = Math.round(c0[0] + frac * (c1[0] - c0[0]));
    lut[i * 4 + 1] = Math.round(c0[1] + frac * (c1[1] - c0[1]));
    lut[i * 4 + 2] = Math.round(c0[2] + frac * (c1[2] - c0[2]));
    lut[i * 4 + 3] = 255;
  }

  return lut;
}

/** The ramps the app draws with. */
export const RAMPS = {
  heat: buildLut(HEAT_RAMP),
  canopy: buildLut(CANOPY_RAMP),
} as const;

export type RampName = keyof typeof RAMPS;

// One texture per ramp per GPU device. A WeakMap lets a lost device and its
// textures be collected together, which matters because deck.gl rebuilds the
// device on a context loss.
const textureCache = new WeakMap<Device, Map<RampName, Texture>>();

/**
 * Upload a ramp as a colormap texture, once per device.
 *
 * The returned texture samples linearly and clamps at both edges, so a value
 * at or past either end of the range takes the first or last ramp stop.
 */
export function getColormapTexture(device: Device, ramp: RampName): Texture {
  let perDevice = textureCache.get(device);
  if (!perDevice) {
    perDevice = new Map();
    textureCache.set(device, perDevice);
  }

  const cached = perDevice.get(ramp);
  if (cached) return cached;

  const imageData = new ImageData(RAMPS[ramp], LUT_SIZE, 1);
  const texture = createColormapTexture(device, imageData);
  perDevice.set(ramp, texture);

  return texture;
}
