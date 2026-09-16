// STAC catalog access for the Landsat LST p95 collection.
//
// The collection publishes 104 items, one per 5-degree tile, each holding a
// single-band uint16 COG. `items.parquet` is the collection's stac-geoparquet
// mirror: one 133 KB request carries every item's bbox, asset hrefs and band
// statistics, where crawling the item JSONs would cost 104 requests and 1.26 MB.

import { parquetReadObjects } from "hyparquet";
import { LST } from "@/lib/config";

/** One tile of the collection, reduced to what the viewer needs. */
export interface LstItem {
  /** STAC item id, e.g. `N00W075`. */
  id: string;
  /** WGS84 bounds as [minX, minY, maxX, maxY], the shape MosaicSource wants. */
  bbox: [number, number, number, number];
  /** Absolute URL of the item's `lst_p95` COG. */
  cogUrl: string;
  /** Band mean, in raw DN. */
  mean: number;
  /** Band standard deviation, in raw DN. */
  stddev: number;
  /** Pixels that survived masking, used to weight the pooled statistics. */
  validPixels: number;
}

/** A temperature range in degrees Celsius. */
export interface CelsiusRange {
  minC: number;
  maxC: number;
}

/** Shape of the parquet columns we read. Everything else is ignored. */
interface ItemRow {
  id: string;
  bbox: { xmin: number; ymin: number; xmax: number; ymax: number };
  assets: Record<
    string,
    { href: string; bands?: { statistics?: Record<string, number> }[] }
  >;
  // hyparquet returns INT64 columns as BigInt.
  "lst:valid_pixels": bigint | number;
}

/** Decode a raw digital number to degrees Celsius. */
export function dnToCelsius(dn: number): number {
  return dn * LST.SCALE + LST.OFFSET;
}

/** Encode degrees Celsius back to a raw digital number. */
export function celsiusToDn(celsius: number): number {
  return (celsius - LST.OFFSET) / LST.SCALE;
}

/**
 * Read the collection's item mirror and reduce each row to an {@link LstItem}.
 *
 * Asset hrefs in the mirror are relative to their own item directory
 * (`./lst_p95.tif`), so resolve them against `<collection>/<item id>/`.
 */
export async function fetchLstItems(signal?: AbortSignal): Promise<LstItem[]> {
  // Read the file whole. Range-reading it column by column costs about 46
  // round-trips, and the file is 133 KB, so one request is both fewer bytes
  // of overhead and faster.
  const response = await fetch(LST.ITEMS_PARQUET_URL, { signal });
  if (!response.ok) {
    throw new Error(
      `items.parquet returned ${response.status} ${response.statusText}`
    );
  }
  const file = await response.arrayBuffer();

  const rows = (await parquetReadObjects({
    file,
    columns: ["id", "bbox", "assets", "lst:valid_pixels"],
  })) as unknown as ItemRow[];

  signal?.throwIfAborted();

  const items: LstItem[] = [];

  for (const row of rows) {
    const asset = row.assets?.[LST.ASSET_KEY];
    const stats = asset?.bands?.[0]?.statistics;

    // A row without the data asset or its statistics cannot be drawn or
    // weighted, so skip it rather than render a tile with no range.
    if (!asset || !stats) continue;

    const { xmin, ymin, xmax, ymax } = row.bbox;
    const href = asset.href.replace(/^\.\//, "");

    items.push({
      id: row.id,
      bbox: [xmin, ymin, xmax, ymax],
      cogUrl: `${LST.COLLECTION_URL}/${row.id}/${href}`,
      mean: stats.mean,
      stddev: stats.stddev,
      validPixels: Number(row["lst:valid_pixels"] ?? 0),
    });
  }

  return items;
}

/**
 * Pool the per-item statistics and return mean +/- {@link LST.SIGMA} sigma.
 *
 * Each item reports the mean and standard deviation of its own pixels. The law
 * of total variance recovers the combined spread of the group:
 *
 *   Var = E[within-item variance] + Var[item means]
 *
 * Both terms are weighted by valid pixel count, so an ocean tile holding 243
 * land pixels cannot pull the range as hard as a tile holding 243 million.
 *
 * Returns `null` when no item carries any valid pixel, which lets callers keep
 * the range they already have instead of collapsing it.
 */
export function pooledRange(items: LstItem[]): CelsiusRange | null {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const item of items) {
    totalWeight += item.validPixels;
    weightedSum += item.validPixels * item.mean;
  }

  if (totalWeight <= 0) return null;

  const mean = weightedSum / totalWeight;

  let variance = 0;
  for (const item of items) {
    const spread = item.mean - mean;
    variance +=
      item.validPixels * (item.stddev * item.stddev + spread * spread);
  }
  variance /= totalWeight;

  const sigma = Math.sqrt(variance);

  return {
    minC: dnToCelsius(mean - LST.SIGMA * sigma),
    maxC: dnToCelsius(mean + LST.SIGMA * sigma),
  };
}
