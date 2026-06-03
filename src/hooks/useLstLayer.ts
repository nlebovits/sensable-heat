"use client";

import { useState, useEffect, useMemo } from "react";
import { ZarrLayer } from "@developmentseed/deck.gl-zarr";
import type { GetTileDataOptions } from "@developmentseed/deck.gl-zarr";
import * as zarr from "zarrita";
import { HEAT_RAMP } from "@/lib/config";

// Source Cooperative S3 bucket - path-style URL
const LST_ZARR_URL =
  "https://s3.us-west-2.amazonaws.com/us-west-2.opendata.source.coop/nlebovits/landsat-lst/2024/N40W075.zarr";

// LST encoding: celsius = dn * scale_factor + add_offset
const LST_SCALE_FACTOR = 0.01;
const LST_ADD_OFFSET = -50.0;

// Temperature range for colormap (Celsius)
const MIN_CELSIUS = 15;
const MAX_CELSIUS = 45;
const CELSIUS_RANGE = MAX_CELSIUS - MIN_CELSIUS;

// Parse hex colors to RGB arrays
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

// Build a 256-entry lookup table from the heat ramp
const HEAT_LUT = (() => {
  const colors = HEAT_RAMP.map(hexToRgb);
  const lut = new Uint8Array(256 * 4);

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
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
})();

interface LstTileData {
  data: Uint16Array;
  width: number;
  height: number;
}

export function useLstLayer(visible: boolean = true) {
  const [zarrArray, setZarrArray] = useState<zarr.Array<zarr.Uint16, zarr.FetchStore> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function openStore() {
      try {
        setIsLoading(true);
        const store = new zarr.FetchStore(LST_ZARR_URL);
        // Open lst_p95 array directly as v3 (bypasses deck.gl-zarr's internal v2-first detection)
        const root = zarr.root(store);
        const arr = await zarr.open.v3(root.resolve("lst_p95"), { kind: "array" });
        if (!cancelled) {
          setZarrArray(arr as zarr.Array<zarr.Uint16, zarr.FetchStore>);
          setError(null);
        }
      } catch (err) {
        console.error("[LST] Failed to open Zarr array:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    openStore();
    return () => {
      cancelled = true;
    };
  }, []);

  const layer = useMemo(() => {
    if (!zarrArray || !visible) return null;

    // GeoZarr metadata — icechunk doesn't write these conventions yet
    // Shape: [18000, 18001] from zarr.json
    // GDAL GeoTransform: "-75.00004444 0.00027778 0.0 40.00004222 0.0 -0.00027778"
    //   = [x_origin, x_res, x_rot, y_origin, y_rot, y_res]
    // GeoZarr spatial:transform uses Affine order: [a, b, c, d, e, f]
    //   = [x_res, x_rot, x_origin, y_rot, y_res, y_origin]
    const geoZarrMetadata = {
      "spatial:dimensions": ["latitude", "longitude"],
      "spatial:transform": [0.00027778, 0.0, -75.00004444, 0.0, -0.00027778, 40.00004222] as [number, number, number, number, number, number],
      "spatial:shape": [18000, 18001] as [number, number],
      "proj:code": "EPSG:4326",
    };

    return new ZarrLayer<zarr.FetchStore, zarr.Uint16, LstTileData>({
      id: "lst-layer",
      node: zarrArray,
      metadata: geoZarrMetadata,
      selection: {},

      async getTileData(
        arr: zarr.Array<zarr.Uint16, zarr.FetchStore>,
        options: GetTileDataOptions
      ): Promise<LstTileData> {
        try {
          const chunk = await zarr.get(arr, options.sliceSpec);
          return {
            data: chunk.data as Uint16Array,
            width: options.width,
            height: options.height,
          };
        } catch (err) {
          console.error("[LST] Tile fetch failed", { x: options.x, y: options.y, z: options.z, err });
          throw err;
        }
      },

      renderTile(tileData: LstTileData) {
        const { data, width, height } = tileData;
        const pixels = new Uint8ClampedArray(width * height * 4);

        for (let i = 0; i < data.length; i++) {
          const dn = data[i];

          // nodata = 0
          if (dn === 0) {
            pixels[i * 4 + 3] = 0;
            continue;
          }

          // Decode to Celsius
          const celsius = dn * LST_SCALE_FACTOR + LST_ADD_OFFSET;

          // Normalize to 0-255 for colormap lookup
          const normalized = Math.max(
            0,
            Math.min(255, ((celsius - MIN_CELSIUS) / CELSIUS_RANGE) * 255)
          );
          const idx = Math.floor(normalized);

          pixels[i * 4 + 0] = HEAT_LUT[idx * 4 + 0];
          pixels[i * 4 + 1] = HEAT_LUT[idx * 4 + 1];
          pixels[i * 4 + 2] = HEAT_LUT[idx * 4 + 2];
          pixels[i * 4 + 3] = HEAT_LUT[idx * 4 + 3];
        }

        return {
          image: new ImageData(pixels, width, height),
        };
      },
    });
  }, [zarrArray, visible]);

  return { layer, isLoading, error };
}
