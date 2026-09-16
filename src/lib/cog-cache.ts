// Shared opener for the COGs behind the raster layers.
//
// `COGLayer` takes an already-opened `GeoTIFF`, which is the only way to choose
// the header chunk size, and it re-opens whenever the `geotiff` prop changes
// identity. Both raster layers rebuild their sub-layers on every camera move
// and on every ramp change, so the open has to be memoized by URL. Otherwise
// the map re-reads headers it already holds.

import { GeoTIFF } from "@developmentseed/geotiff";

/**
 * How many open COGs to keep.
 *
 * A city view holds a few dozen sources across both layers, and the LST
 * mosaic opens 63 at its widest affordable zoom. The cap stops a long panning
 * session over either mosaic from pinning every header it has ever touched.
 */
const MAX_OPEN = 1024;

/** Insertion-ordered, so the first key is the least recently used. */
const opened = new Map<string, Promise<GeoTIFF>>();

/**
 * Open a COG, or hand back the open already in flight or finished for this URL.
 *
 * `chunkSize` is how many bytes each header request reads. Size it to the end
 * of the file's tile offset arrays. One request that covers them beats several
 * that tile the same range, and it beats the 64 KB default badly on a file
 * whose header is 16 KB.
 *
 * The result is typed as `GeoTIFF` because that is what `COGLayer.geotiff`
 * declares, but it is the promise. The layer awaits whatever it receives, so
 * the promise resolves before the layer reads it, and passing the promise
 * rather than the resolved value is what keeps the prop stable from the first
 * render onward.
 */
export function openCog(url: string, chunkSize: number): GeoTIFF {
  const key = `${chunkSize}:${url}`;

  const hit = opened.get(key);
  if (hit) {
    // Re-insert to move the entry to the young end of the map.
    opened.delete(key);
    opened.set(key, hit);
    return hit as unknown as GeoTIFF;
  }

  const geotiff = GeoTIFF.fromUrl(url, { chunkSize });

  // A failed open must not stick, or that tile stays broken until a reload.
  // The handler also marks the promise handled, so a source deck.gl drops
  // before anything awaits it cannot raise an unhandled rejection.
  geotiff.catch(() => {
    if (opened.get(key) === geotiff) opened.delete(key);
  });

  opened.set(key, geotiff);

  if (opened.size > MAX_OPEN) {
    const oldest = opened.keys().next().value;
    if (oldest !== undefined) opened.delete(oldest);
  }

  return geotiff as unknown as GeoTIFF;
}
