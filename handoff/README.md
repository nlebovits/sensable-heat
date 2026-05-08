# Sensable Heat — Handoff Kit

A Radiant Earth project. *Where heat reaches the ground.*

This kit is everything a Claude Code agent (or any engineer) needs to build v0.1 of the Sensable Heat web map at `app.sensableheat.org`.

## What's in here

| Path | What it is |
|---|---|
| `ENGINEERING.md` | **Read this first.** The full engineering spec — stack, data layers, view system, URL schema, responsiveness, acceptance checklist. |
| `brand-tokens.css` | Drop-in CSS custom properties: neutrals, the 9-step OKLCH heat ramp, type tokens, semantic surfaces. Both dark + light themes. |
| `reference/Sensable Heat - Brand Kit.html` | Visual brand spec — wordmark, type pairing, color, heat ramp with CVD checks, voice. Open in a browser. |
| `reference/Sensable Heat - Map.html` | Working interactive prototype of the v0.1 UI (Variant A is the target). Open in a browser; treat as the design source of truth. |
| `reference/source/*.jsx` | Prototype source files. Layout, copy, and component structure to mirror in the real app. |

## How to use

1. Open both HTML files side-by-side in a browser. Click around. The prototype is the design.
2. Read `ENGINEERING.md` end-to-end.
3. Drop `brand-tokens.css` into the new Next.js app's `app/globals.css`.
4. The five questions at the bottom of `ENGINEERING.md` need user answers before you can ship — ask before guessing.

## Stack summary

Next.js 15 · React 19 · TypeScript · Tailwind · shadcn · deck.gl · deck.gl-raster · MapLibre · PMTiles · Nominatim · Vercel.

3D globe at `z < 10`, flat map at `z ≥ 10`, animated transition both directions.
