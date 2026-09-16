"use client";

import { useState, useEffect, useMemo } from "react";
import { COGLayer, MosaicLayer } from "@developmentseed/deck.gl-geotiff";
import type { Layer } from "@deck.gl/core";

import { CHM } from "@/lib/config";
import { openCog } from "@/lib/cog-cache";
import { fetchChmTiles, type ChmTile } from "@/lib/chm-catalog";
import { useMapStore } from "@/store/map-store";
import {
  makeGetTileData,
  makeRenderTile,
  type RasterTileData,
} from "@/lib/raster-pipeline";

const getTileData = makeGetTileData("canopy");

// Pixels are canopy height in whole metres, so the display bounds are already
// digital numbers. The range is fixed: the dataset publishes no per-tile
// statistics to derive one from.
const renderTile = makeRenderTile({
  minDn: CHM.MIN_METRES,
  maxDn: CHM.MAX_METRES,
  nodataDn: CHM.NODATA_DN,
});

/**
 * Render the Meta canopy height map.
 *
 * Two tiers, as the dataset is published. One global overview COG covers the
 * world below zoom 10. From there up, native 1.19 m tiles take over through a
 * mosaic, so a city view opens a handful of COGs instead of all 213,109.
 *
 * Only one tier is ever built. deck.gl's `maxZoom` clamps which tile level a
 * layer requests rather than hiding the layer, so leaving the overview mounted
 * past the crossover would keep it drawing stretched zoom-10 tiles under the
 * native ones.
 *
 * The tile index is read on first use rather than at startup, because it costs
 * about 1.4 MB and a second and a half and is wasted while the layer is off.
 */
export function useChmLayer(visible: boolean) {
  const zoom = useMapStore((s) => s.zoom);
  const useNativeTiles = zoom >= CHM.MOSAIC_MIN_ZOOM;

  const [tiles, setTiles] = useState<ChmTile[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible || !useNativeTiles || tiles.length > 0 || error) return;

    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        const loaded = await fetchChmTiles(controller.signal);
        if (controller.signal.aborted) return;

        setTiles(loaded);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("[CHM] Failed to read the tile index:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [visible, useNativeTiles, tiles.length, error]);

  // Build nothing while hidden. deck.gl's TileLayer does not consult `visible`
  // before fetching, so a hidden layer would still pull every tile in view.
  const layers = useMemo((): Layer[] => {
    if (!visible) return [];

    // Native tiles, at 1.19 m. The reason to show this dataset at all.
    if (useNativeTiles) {
      if (tiles.length === 0) return [];

      return [
        new MosaicLayer<ChmTile>({
          id: "chm-mosaic",
          sources: tiles,
          renderSource: (source, { signal }) =>
            new COGLayer<RasterTileData>({
              id: `chm-cog-${source.id}`,
              geotiff: openCog(source.cogUrl, CHM.TILE_HEADER_CHUNK_BYTES),
              signal,
              getTileData,
              renderTile,
            }),
        }),
      ];
    }

    // Below the crossover, one global COG at 611 m stands in for 213,109 tiles.
    return [
      new COGLayer<RasterTileData>({
        id: "chm-overview",
        geotiff: openCog(CHM.OVERVIEW_URL, CHM.OVERVIEW_HEADER_CHUNK_BYTES),
        getTileData,
        renderTile,
      }),
    ];
  }, [tiles, visible, useNativeTiles]);

  return { layers, isLoading, error };
}
