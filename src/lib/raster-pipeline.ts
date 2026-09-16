// Shared COG tile loading and shading for the app's raster layers.
//
// Both the temperature and canopy layers read single-band integer COGs and
// colour them with a ramp, so they differ only in which ramp they use and
// which digital numbers map to the ends of it.

import {
  Colormap,
  CreateTexture,
  FilterNoDataVal,
  LinearRescale,
} from "@developmentseed/deck.gl-raster/gpu-modules";
import type { RenderTileResult } from "@developmentseed/deck.gl-raster";
import type { GetTileDataOptions } from "@developmentseed/deck.gl-geotiff";
import type { GeoTIFF, Overview } from "@developmentseed/geotiff";
import type { Device, Texture, TextureFormat } from "@luma.gl/core";
import { getColormapTexture, type RampName } from "@/lib/colormaps";

/** One COG tile, uploaded to the GPU and ready to shade. */
export interface RasterTileData {
  texture: Texture;
  colormapTexture: Texture;
  /** Multiplier taking a raw DN to the value the shader reads. */
  valueScale: number;
  width: number;
  height: number;
  byteLength: number;
}

/** How this device wants a band of a given sample width delivered. */
interface TexturePlan {
  format: TextureFormat;
  valueScale: number;
  /** Set when the samples must be widened before upload. */
  widen: boolean;
}

/** Cached per device, because the answer is a property of the GL context. */
const texturePlans = new WeakMap<Device, Map<number, TexturePlan>>();

/**
 * Choose an upload format for an unsigned integer band.
 *
 * 8-bit normalizes as `r8unorm` everywhere. 16-bit wants `r16unorm`, which
 * rests on `EXT_texture_norm16` and is missing from software rasterizers and
 * some mobile GPUs; where it is absent the samples widen to float and the
 * shader reads raw DN instead. Every path keeps DN 0 at exactly 0.0, so the
 * nodata test is unaffected.
 */
function texturePlanFor(device: Device, bytesPerSample: number): TexturePlan {
  let perDevice = texturePlans.get(device);
  if (!perDevice) {
    perDevice = new Map();
    texturePlans.set(device, perDevice);
  }

  const cached = perDevice.get(bytesPerSample);
  if (cached) return cached;

  let plan: TexturePlan;
  if (bytesPerSample === 1) {
    plan = { format: "r8unorm", valueScale: 1 / 255, widen: false };
  } else if (device.isTextureFormatSupported("r16unorm")) {
    plan = { format: "r16unorm", valueScale: 1 / 65535, widen: false };
  } else {
    plan = { format: "r32float", valueScale: 1, widen: true };
  }

  perDevice.set(bytesPerSample, plan);
  return plan;
}

/**
 * Build a `getTileData` that reads one COG tile and uploads it as a
 * single-channel texture, tagged with the ramp the tile will be shaded with.
 *
 * Sampling is nearest because `FilterNoDataVal` tests the nodata value
 * exactly. Linear sampling blends edge pixels toward zero without reaching it,
 * which paints a dark fringe wherever data meets a gap.
 */
export function makeGetTileData(ramp: RampName) {
  return async function getTileData(
    image: GeoTIFF | Overview,
    options: GetTileDataOptions
  ): Promise<RasterTileData> {
    const { device, x, y, signal, pool } = options;

    const tile = await image.fetchTile(x, y, { boundless: false, pool, signal });
    const { width, height, count } = tile.array;

    if (count !== 1) {
      throw new Error(`Expected a single-band raster, got ${count} bands.`);
    }

    // A decoder may hand back either layout. With one band they carry the same
    // samples, so read whichever one this tile arrived in.
    const samples =
      tile.array.layout === "band-separate"
        ? tile.array.bands[0]
        : tile.array.data;

    const plan = texturePlanFor(device, samples.BYTES_PER_ELEMENT);
    const data = plan.widen ? Float32Array.from(samples) : samples;

    const texture = device.createTexture({
      data,
      format: plan.format,
      width,
      height,
      sampler: { minFilter: "nearest", magFilter: "nearest" },
    });

    return {
      texture,
      colormapTexture: getColormapTexture(device, ramp),
      valueScale: plan.valueScale,
      width,
      height,
      byteLength: data.byteLength,
    };
  };
}

/** The digital numbers that map to the ends of the ramp, plus the nodata one. */
export interface RenderRange {
  minDn: number;
  maxDn: number;
  nodataDn: number;
}

/**
 * Build the fragment pipeline for one tile.
 *
 * Order matters. `FilterNoDataVal` runs before `LinearRescale`, because the
 * rescale clamps every value below `minDn` to zero, and the nodata test would
 * then discard genuine low readings along with the missing ones.
 */
export function makeRenderTile({ minDn, maxDn, nodataDn }: RenderRange) {
  return function renderTile(data: RasterTileData): RenderTileResult {
    // `valueScale` comes from whichever texture format the device accepted, so
    // the bounds land in the same units as the samples the shader reads.
    const { valueScale } = data;

    return {
      renderPipeline: [
        {
          module: CreateTexture,
          props: { textureName: data.texture },
        },
        {
          module: FilterNoDataVal,
          props: { value: nodataDn * valueScale },
        },
        {
          module: LinearRescale,
          props: {
            rescaleMin: minDn * valueScale,
            rescaleMax: maxDn * valueScale,
          },
        },
        {
          module: Colormap,
          props: { colormapTexture: data.colormapTexture, colormapIndex: 0 },
        },
      ],
    };
  };
}
