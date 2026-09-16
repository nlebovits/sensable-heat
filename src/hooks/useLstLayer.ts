"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { COGLayer, MosaicLayer } from "@developmentseed/deck.gl-geotiff";
import type { Layer } from "@deck.gl/core";

import { LST } from "@/lib/config";
import { openCog } from "@/lib/cog-cache";
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
 * Render the Landsat LST collection.
 *
 * One tier, at every zoom. A `MosaicLayer` holds all 769 items in a Flatbush
 * index and opens a COG per item the viewport covers. `COGLayer` then reads
 * the overview level that matches the screen, so a wide view costs each item
 * its header plus one 281 by 281 tile rather than any full-resolution pixels.
 *
 * The opening view is framed on the data rather than on the globe, which is
 * what keeps this affordable: 60N to 60S fills the map at zoom 2, and that
 * covers 621 items instead of the whole collection.
 *
 * The colour range is mean +/- 2 sigma, pooled from the per-item statistics
 * that items.parquet already carries. It starts collection-wide and narrows
 * to the tiles on screen as they settle.
 */
export function useLstLayer(visible: boolean = true) {
  const zoom = useMapStore((s) => s.zoom);
  // A boolean, not the zoom itself. Depending on the zoom would rebuild every
  // source layer on every wheel tick.
  const dropSlivers = zoom < LST.SLIVER_MAX_ZOOM;

  const [items, setItems] = useState<LstItem[]>([]);
  const [collectionRange, setCollectionRange] = useState<CelsiusRange | null>(
    null
  );
  const [viewportRange, setViewportRange] = useState<CelsiusRange | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setLstRange = useMapStore((s) => s.setLstRange);

  const range = viewportRange ?? collectionRange;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        const loaded = await fetchLstItems(controller.signal);
        if (controller.signal.aborted) return;

        setItems(loaded);
        setCollectionRange(pooledRange(loaded));
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
  const onViewportLoad = useCallback((entries: { source: LstItem }[]) => {
    const visibleItems = entries.map((entry) => entry.source);
    const next = pooledRange(visibleItems);
    if (!next) return;

    setViewportRange((current) =>
      current && !rangeMoved(current, next) ? current : next
    );
  }, []);

  const layer = useMemo((): Layer | null => {
    // Build nothing while hidden. deck.gl's TileLayer does not consult
    // `visible` before fetching, so a hidden layer would still pull every
    // tile in view.
    if (!visible || items.length === 0 || !range) return null;

    // A tile holding a sliver of coast draws less than one screen pixel at a
    // wide zoom, so the header and tile it costs buy nothing. items.parquet
    // already carries the coverage, so this decision needs no request.
    const drawn = dropSlivers
      ? items.filter((item) => item.validFraction >= LST.MIN_COVERAGE)
      : items;

    const minDn = celsiusToDn(range.minC);
    const maxDn = celsiusToDn(range.maxC);
    const rescaleKey = `${range.minC}:${range.maxC}`;

    const renderTile = makeRenderTile({
      minDn,
      maxDn,
      nodataDn: LST.NODATA_DN,
    });

    return new MosaicLayer<LstItem>({
      id: "lst-mosaic",
      sources: drawn,
      onViewportLoad,
      renderSource: (source, { signal }) =>
        new COGLayer<RasterTileData>({
          id: `lst-cog-${source.id}`,
          geotiff: openCog(source.cogUrl, LST.HEADER_CHUNK_BYTES),
          signal,
          getTileData,
          renderTile,
          // Without this the inner RasterTileLayer keeps the sub-layers it
          // already rendered, and the ramp never follows the range.
          updateTriggers: { renderTile: [rescaleKey] },
        }),
    });
  }, [items, range, visible, dropSlivers, onViewportLoad]);

  return { layer, isLoading, error };
}
