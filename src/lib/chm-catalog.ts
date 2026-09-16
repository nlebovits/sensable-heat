// Tile index for the Meta canopy height map.
//
// The dataset ships 213,109 native COGs on a zoom-10 quadkey grid. Which
// quadkeys exist is not derivable, because ocean and ice tiles are absent, so
// the viewer reads the published index. `tiles.parquet` carries the three
// columns a mosaic needs and hyparquet fetches only those column chunks, which
// costs about 1.4 MB of the 5 MB file.
//
// Those bytes are cheap next to the round trips that carry them. The index
// sits on an origin that answers in anything from 300 ms to 2.5 s, so the
// read is shaped to spend as few round trips as it can: one suffix range for
// the tail, then only the column chunks that fall outside it.

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
 * Bytes read from the end of the file in the opening request.
 *
 * It has to cover the footer, the metadata behind it, and the dictionary pages
 * hyparquet reaches for next, which together occupy the last 525 KB. Reading
 * past them costs bandwidth. Stopping short of them costs a round trip, which
 * is worth more.
 */
const TAIL_BYTES = 768 * 1024;

/**
 * Read the tile index.
 *
 * The file is one row group, so there is nothing to prune; the saving comes
 * from reading three columns instead of nine. The `geometry` blob alone is
 * most of the file and duplicates `bbox`.
 */
export async function fetchChmTiles(signal?: AbortSignal): Promise<ChmTile[]> {
  const url = CHM.TILES_PARQUET_URL;

  // One suffix range in place of a HEAD followed by a footer read. The total
  // size is the only thing the HEAD ever returned, and `content-range` carries
  // it here for free. The HEAD cost a round trip of its own, measured at 830 ms
  // of the 3.3 s this function used to take.
  const tailResponse = await fetch(url, {
    headers: { range: `bytes=-${TAIL_BYTES}` },
    signal,
  });
  if (!tailResponse.ok) {
    throw new Error(
      `tiles.parquet returned ${tailResponse.status} ${tailResponse.statusText}`
    );
  }

  const tail = await tailResponse.arrayBuffer();

  // A 206 reports the total after the slash in `bytes <start>-<end>/<total>`.
  // A server that ignores the suffix range answers 200 with the whole file,
  // and then the body is its own length.
  let byteLength: number;
  if (tailResponse.status === 206) {
    const contentRange = tailResponse.headers.get("content-range");
    byteLength = Number(contentRange?.split("/")[1]);
    if (!Number.isFinite(byteLength) || byteLength <= 0) {
      throw new Error(
        `tiles.parquet returned an unreadable content-range: ${contentRange}`
      );
    }
  } else {
    byteLength = tail.byteLength;
  }

  const tailStart = byteLength - tail.byteLength;

  const file = {
    byteLength,
    async slice(start: number, end?: number): Promise<ArrayBuffer> {
      const stop = end ?? byteLength;

      // hyparquet walks the footer region again column chunk by column chunk.
      // Four of its seven range requests used to land on bytes it already held,
      // so answer anything inside the tail from memory.
      if (start >= tailStart) {
        return tail.slice(start - tailStart, stop - tailStart);
      }

      const res = await fetch(url, {
        headers: { range: `bytes=${start}-${stop - 1}` },
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
