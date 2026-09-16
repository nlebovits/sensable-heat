// Build the MapLibre glyph ranges the map style asks for.
//
// No public glyph server carries IBM Plex, so the app serves its own from
// public/fonts. Run this only when the typeface or the weights change:
//
//   pnpm exec node scripts/generate-glyphs.mjs
//
// The output is committed. Re-running it should produce no diff.

import fontnik from "fontnik";
import fs from "node:fs";
import path from "node:path";

const TTF_BASE =
  "https://github.com/IBM/plex/raw/master/packages/plex-sans/fonts/complete/ttf";

/** Weights the style uses: SemiBold for cities, Regular for towns. */
const FONTS = [
  { file: "IBMPlexSans-Regular.ttf", stack: "IBM Plex Sans Regular" },
  { file: "IBMPlexSans-SemiBold.ttf", stack: "IBM Plex Sans SemiBold" },
];

const OUT_ROOT = path.join(process.cwd(), "public", "fonts");

/**
 * Smallest PBF that can still hold an outline. fontnik returns a short stub
 * for a range the font has no glyphs in, and writing those would trade 200
 * empty files for nothing.
 */
const MIN_USEFUL_BYTES = 60;

async function buildRange(font, start, end) {
  return new Promise((resolve, reject) => {
    fontnik.range({ font, start, end }, (err, data) =>
      err ? reject(err) : resolve(data)
    );
  });
}

async function buildStack({ file, stack }) {
  const ttf = await fetch(`${TTF_BASE}/${file}`);
  if (!ttf.ok) {
    throw new Error(`${file} returned ${ttf.status} ${ttf.statusText}`);
  }
  const font = Buffer.from(await ttf.arrayBuffer());

  const outDir = path.join(OUT_ROOT, stack);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  let written = 0;
  for (let start = 0; start < 65536; start += 256) {
    const end = start + 255;
    const pbf = await buildRange(font, start, end);
    if (pbf.length > MIN_USEFUL_BYTES) {
      fs.writeFileSync(path.join(outDir, `${start}-${end}.pbf`), pbf);
      written++;
    }
  }

  console.log(`${stack}: ${written} ranges`);
}

for (const font of FONTS) {
  await buildStack(font);
}
