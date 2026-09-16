"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { COGLayer, MosaicLayer } from "@developmentseed/deck.gl-geotiff";
import { SolidPolygonLayer } from "@deck.gl/layers";
import type { Layer, Position } from "@deck.gl/core";

import { LST } from "@/lib/config";
import { openCog } from "@/lib/cog-cache";
import { sampleRamp } from "@/lib/colormaps";
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

/** A bbox as the closed ring `SolidPolygonLayer` wants. */
function cellRing([minX, minY, maxX, maxY]: LstItem["bbox"]): Position[] {
  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];
}

/**
 * Render the Landsat LST collection.
 *
 * Two tiers, because the collection publishes no overview. Above
 * {@link LST.MOSAIC_MIN_ZOOM} a `MosaicLayer` holds every item in a Flatbush
 * index and opens a COG per item the viewport covers, which is 63 of them at
 * the crossover and 17 over a country. Below it the same items draw as
 * 5-degree cells coloured by their own mean, which costs no request at all:
 * items.parquet already carried the statistic. The world view would otherwise
 * open all 769 COGs and read 18 MB of header before painting a pixel.
 *
 * A cell fades by how much of its footprint carries data, so a tile holding a
 * sliver of coast reads as a sliver rather than a solid 5-degree block.
 *
 * Both tiers share one colour range, mean +/- 2 sigma. The mosaic narrows it
 * to the tiles on screen as they settle. The cell layer keeps the
 * collection-wide range, which is the honest one when the whole world is in
 * view.
 */
export function useLstLayer(visible: boolean = true) {
  const zoom = useMapStore((s) => s.zoom);
  const useMosaic = zoom >= LST.MOSAIC_MIN_ZOOM;

  const [items, setItems] = useState<LstItem[]>([]);
  const [collectionRange, setCollectionRange] = useState<CelsiusRange | null>(
    null
  );
  const [viewportRange, setViewportRange] = useState<CelsiusRange | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setLstRange = useMapStore((s) => s.setLstRange);

  const range = useMosaic ? (viewportRange ?? collectionRange) : collectionRange;

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

  // Drop the narrowed range on the way down to the cells. Holding a range
  // fitted to one city would recolour the whole world against it, and would
  // still be in force for the first frames of the next zoom in.
  useEffect(() => {
    if (!useMosaic) setViewportRange(null);
  }, [useMosaic]);

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

    const minDn = celsiusToDn(range.minC);
    const maxDn = celsiusToDn(range.maxC);
    const rescaleKey = `${range.minC}:${range.maxC}`;

    // Below the crossover, one cell per item stands in for 769 COGs.
    if (!useMosaic) {
      // A collapsed range would divide by zero and paint every cell the same
      // colour, so give it a span of one digital number to fall back on.
      const span = maxDn - minDn || 1;

      return new SolidPolygonLayer<LstItem>({
        id: "lst-cells",
        data: items,
        getPolygon: (item) => cellRing(item.bbox),
        getFillColor: (item) => {
          const [r, g, b] = sampleRamp("heat", (item.mean - minDn) / span);
          return [r, g, b, Math.round(item.validFraction * 255)];
        },
        // The ramp follows the range, and deck.gl keeps the colours it has
        // already uploaded until something tells it they are stale.
        updateTriggers: { getFillColor: [rescaleKey] },
        pickable: false,
      });
    }

    const renderTile = makeRenderTile({
      minDn,
      maxDn,
      nodataDn: LST.NODATA_DN,
    });

    return new MosaicLayer<LstItem>({
      id: "lst-mosaic",
      sources: items,
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
  }, [items, range, visible, useMosaic, onViewportLoad]);

  return { layer, isLoading, error };
}
