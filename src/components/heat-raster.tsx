"use client";

import dynamic from "next/dynamic";

/**
 * The glyph world map behind the panel chrome.
 *
 * Client only. The rasterizer measures its host, so it has nothing to render
 * on the server.
 */
export const HeatRaster = dynamic(() => import("./heat-raster-canvas"), {
  ssr: false,
  loading: () => null,
});
