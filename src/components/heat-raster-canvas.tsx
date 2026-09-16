"use client";

import { useEffect, useRef } from "react";
import { createGlyphScene, createGlyphOrthographicCamera } from "glyphcss";

type Vec3 = [number, number, number];

/** The baked elevation grid. NOAA ETOPO1, public domain. */
interface WorldRelief {
  n: number;
  x: number[];
  y: number[];
  z: number[];
  b: number[];
}

/**
 * Elevation ramp. The band index is a height.
 *
 * One hue, white through to h4 (#913020), interpolated in nine steps. Band 0
 * alone is water and it holds 67.8 percent of the cells, so the ocean reads as
 * the light ground and the continents darken into the red with height.
 *
 * The ramp runs the full range on purpose. A set of mid tints gives the map
 * nothing to anchor on and it reads as flat. Lowland starts clear of the water
 * tone, which matters because bands 1 and 2 carry 58 percent of the land, and
 * the peaks land on the red itself.
 */
const BAND_COLORS = [
  "#ffffff",
  "#f1e5e3",
  "#e4cbc7",
  "#d6b1ab",
  "#c89890",
  "#ba7e74",
  "#ac6458",
  "#9f4a3c",
  "#913020",
];

/** Camera and light, from the glyphcss flat-map reference. */
const ROT_X = 40;
const ZOOM = 190;
const RELIEF = 0.18;
const LIGHT_AZ = 50;
const LIGHT_EL = 50;

/** Glyph cell size in pixels. Small cells read as a raster, not as text. */
const FONT_PX = 6.5;

/** Unit vector toward the light, from azimuth and elevation in degrees. */
function lightDirection(azDeg: number, elDeg: number): Vec3 {
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  return [
    Math.cos(el) * Math.cos(az),
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
  ];
}

/** Expand the grid into one quad per cell. */
function buildPolygons(grid: WorldRelief) {
  const { n, x, y, z, b } = grid;
  const w = n + 1;
  const polygons = new Array(n * n);
  for (let iy = 0; iy < n; iy++) {
    for (let ix = 0; ix < n; ix++) {
      polygons[iy * n + ix] = {
        vertices: [
          [x[ix], y[iy], z[iy * w + ix]],
          [x[ix + 1], y[iy], z[iy * w + ix + 1]],
          [x[ix + 1], y[iy + 1], z[(iy + 1) * w + ix + 1]],
          [x[ix], y[iy + 1], z[(iy + 1) * w + ix]],
        ] as Vec3[],
        color: BAND_COLORS[b[iy * n + ix]] ?? BAND_COLORS[0],
      };
    }
  }
  return polygons;
}

export default function HeatRasterCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let scene: ReturnType<typeof createGlyphScene> | null = null;

    fetch("/data/world-relief.json")
      .then((r) => r.json())
      .then((grid: WorldRelief) => {
        if (disposed) return;

        const camera = createGlyphOrthographicCamera({
          rotX: ROT_X,
          rotY: 0,
          zoom: ZOOM,
        });
        camera.target = [0, 0, 0];

        scene = createGlyphScene(host, {
          camera,
          autoSize: true,
          mode: "solid",
          charMode: "ascii",
          useColors: true,
          // "lines" is ─ ═ ╬ ║, which draws a literal grid over the map. The
        // block ramp fills each cell instead, so the render reads as a raster.
        glyphPalette: "blocks",
          directionalLight: {
            direction: lightDirection(LIGHT_AZ, LIGHT_EL),
            intensity: 1.15,
          },
          ambientLight: { intensity: 0.4 },
        });
        scene.output.style.fontSize = `${FONT_PX}px`;
        scene.output.style.fontFamily = "var(--font-mono)";
        // Cells butt against each other, so leading between rows shows up as
        // banding across the map.
        scene.output.style.lineHeight = "1";
        scene.output.style.margin = "0";
        scene.fit();
        scene.add(buildPolygons(grid), { scale: [1, 1, RELIEF] });
        scene.rerender();
      })
      .catch(() => {
        // Decoration. A failed fetch just leaves the plain panel background.
      });

    return () => {
      disposed = true;
      scene?.destroy();
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="heat-raster" aria-hidden="true" />;
}
