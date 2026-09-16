// Tile index for the Meta canopy height map.
//
// The dataset ships 213,109 native COGs on a zoom-10 quadkey grid. Which
// quadkeys exist is not derivable, because ocean and ice tiles are absent, so
// the viewer reads the published index. `tiles.parquet` carries the three
// columns a mosaic needs and hyparquet fetches only those column chunks, which
// costs about 1.4 MB of the 5 MB file.

import { parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { CHM } from "@/lib/config";

/** One native canopy tile. The shape `MosaicLayer` indexes by. */
export interface ChmTile {
  /** Zoom-10 Bing quadkey, unique across the grid. */
  id: string;
  /** WGS84 bounds as [minX, minY, maxX, maxY]. */
  bbox: [number, number, number, number];
  /** Absolute URL of the tile's COG. */
  cogUrl: string;
}

/** Shape of the parquet columns we read. */
interface TileRow {
  quadkey: string;
  cog_url: string;
  bbox: { xmin: number; ymin: number; xmax: number; ymax: number };
}

/**
 * Read the tile index.
 *
 * The file is one row group, so there is nothing to prune; the saving comes
 * from reading three columns instead of nine. The `geometry` blob alone is
 * most of the file and duplicates `bbox`.
 */
export async function fetchChmTiles(signal?: AbortSignal): Promise<ChmTile[]> {
  const url = CHM.TILES_PARQUET_URL;

  const head = await fetch(url, { method: "HEAD", signal });
  if (!head.ok) {
    throw new Error(
      `tiles.parquet returned ${head.status} ${head.statusText}`
    );
  }
  const byteLength = Number(head.headers.get("content-length"));
  if (!Number.isFinite(byteLength) || byteLength <= 0) {
    throw new Error("tiles.parquet reported no content-length");
  }

  const file = {
    byteLength,
    async slice(start: number, end?: number): Promise<ArrayBuffer> {
      const last = (end ?? byteLength) - 1;
      const res = await fetch(url, {
        headers: { range: `bytes=${start}-${last}` },
        signal,
      });
      if (!res.ok) {
        throw new Error(`tiles.parquet range read returned ${res.status}`);
      }
      return res.arrayBuffer();
    },
  };

  const rows = (await parquetReadObjects({
    file,
    columns: ["quadkey", "cog_url", "bbox"],
    // The file is ZSTD, which hyparquet does not decode on its own.
    compressors,
  })) as unknown as TileRow[];

  signal?.throwIfAborted();

  const tiles: ChmTile[] = [];
  for (const row of rows) {
    if (!row.bbox || !row.cog_url) continue;
    const { xmin, ymin, xmax, ymax } = row.bbox;
    tiles.push({
      id: row.quadkey,
      bbox: [xmin, ymin, xmax, ymax],
      cogUrl: row.cog_url,
    });
  }

  return tiles;
}
