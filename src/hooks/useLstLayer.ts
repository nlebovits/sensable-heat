"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { COGLayer, MosaicLayer } from "@developmentseed/deck.gl-geotiff";
import type { Layer } from "@deck.gl/core";

import { LST } from "@/lib/config";
import {
  celsiusToDn,
  fetchLstItems,
  pooledRange,
  type CelsiusRange,
  type LstItem,
} from "@/lib/lst-catalog";
import {
  makeGetTileData,
  makeRenderTile,
  type RasterTileData,
} from "@/lib/raster-pipeline";
import { useMapStore } from "@/store/map-store";

const getTileData = makeGetTileData("heat");

/** True when the two ranges differ by enough to be worth a redraw. */
function rangeMoved(a: CelsiusRange, b: CelsiusRange): boolean {
  return (
    Math.abs(a.minC - b.minC) > LST.RANGE_EPSILON_C ||
    Math.abs(a.maxC - b.maxC) > LST.RANGE_EPSILON_C
  );
}

/**
 * Render the Landsat LST collection as a mosaic of Cloud-Optimized GeoTIFFs.
 *
 * `MosaicLayer` holds every item in a Flatbush index and calls `renderSource`
 * only for the tiles the viewport covers, so a zoomed-in map opens a handful of
 * COGs rather than all 104.
 *
 * The color range is mean +/- 2 sigma over the tiles on screen, recomputed as
 * they settle. It is seeded with the collection-wide range so the first paint
 * is already correct.
 */
export function useLstLayer(visible: boolean = true) {
  const [items, setItems] = useState<LstItem[]>([]);
  const [range, setRange] = useState<CelsiusRange | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setLstRange = useMapStore((s) => s.setLstRange);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        const loaded = await fetchLstItems(controller.signal);
        if (controller.signal.aborted) return;

        setItems(loaded);
        setRange(pooledRange(loaded));
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("[LST] Failed to read the collection item mirror:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  // Publish the active range so the legend can label its ramp.
  useEffect(() => {
    setLstRange(range);
  }, [range, setLstRange]);

  // Narrow the range to the tiles on screen. The redraw this causes can fire
  // another load event, so only a move past the epsilon counts as a change.
  const onViewportLoad = useCallback(
    (entries: { source: LstItem }[]) => {
      const visibleItems = entries.map((entry) => entry.source);
      const next = pooledRange(visibleItems);
      if (!next) return;

      setRange((current) =>
        current && !rangeMoved(current, next) ? current : next
      );
    },
    []
  );

  const layer = useMemo((): Layer | null => {
    // Build nothing while hidden. deck.gl's TileLayer does not consult
    // `visible` before fetching, so a hidden layer would still pull every
    // tile in view.
    if (!visible || items.length === 0 || !range) return null;

    const renderTile = makeRenderTile({
      minDn: celsiusToDn(range.minC),
      maxDn: celsiusToDn(range.maxC),
      nodataDn: LST.NODATA_DN,
    });
    const rescaleKey = `${range.minC}:${range.maxC}`;

    return new MosaicLayer<LstItem>({
      id: "lst-mosaic",
      sources: items,
      onViewportLoad,
      renderSource: (source, { signal }) =>
        new COGLayer<RasterTileData>({
          id: `lst-cog-${source.id}`,
          geotiff: source.cogUrl,
          signal,
          getTileData,
          renderTile,
          // Without this the inner RasterTileLayer keeps the sub-layers it
          // already rendered, and the ramp never follows the range.
          updateTriggers: { renderTile: [rescaleKey] },
        }),
    });
  }, [items, range, visible, onViewportLoad]);

  return { layer, isLoading, error };
}
