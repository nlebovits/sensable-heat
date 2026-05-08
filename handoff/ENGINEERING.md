# Sensable Heat — Engineering Handoff (v0.1)

A Radiant Earth project. *Where heat reaches the ground.* A global, high-resolution measurement of land surface temperature, made plain enough to plan against.

This document hands a working v0.1 of `app.sensableheat.org` to a Claude Code agent. Read this top-to-bottom before writing any code.

---

## 1. What we're building

A public, single-page web map that lets a non-technical municipal user — a city sustainability director, a WRI/World Bank/GFDRR program officer — pull up any city on Earth and see how hot its surfaces actually get, composited across recent years. No login, no paywall, fully stateless.

**Audience hierarchy (matters for every UX decision):**
1. Municipal decision makers (primary)
2. Multilateral program staff (WRI, World Bank, GFDRR)
3. Climate/remote-sensing technical users (tertiary; we welcome them but don't optimize for them)

**Tone:** calm, declarative, civic. Not alarmist, not gee-whiz. Think tide-gauge or census, not climate dashboard. Reference set: NYT investigative graphics, Open Climate Risk, Source Cooperative, *The Heat Will Kill You First*.

---

## 2. Reference materials in this project

These two HTML files **are the design spec**. Treat them as the source of truth for layout, copy, color, type, behavior. The Claude Code agent should open them in a browser and screenshot regions while building.

| File | What it contains |
|---|---|
| `Sensable Heat - Brand Kit.html` | Logo, wordmark construction with the `[ sens ]able heat` viewfinder bracket, typography (IBM Plex Sans + IBM Plex Mono pairing with scale), neutrals, the **9-step OKLCH heat ramp** with hex callouts and CVD simulations, dithered globe imagery treatment in dark + light, voice/copy guidelines. |
| `Sensable Heat - Map.html` | Working interactive prototype of the v0.1 UI. **Variant A is the target layout.** Variant B (globe-first) shows the world-zoom hero treatment we want re-applied inside Variant A's chrome. Read `map-prototype.jsx`, `map-app.jsx`, `map-data.jsx` for component structure. |

**You are not pixel-cloning the prototype.** You are rebuilding it as a real Next.js app with a real map and shadcn primitives, preserving the layout, copy, color, type, density, and brand language exactly.

---

## 3. Stack

```
Next.js 15 (App Router) · React 19 · TypeScript
Tailwind CSS · shadcn/ui (components only — brand wins on type/color)
deck.gl (raster + vector layers, _GlobeView + MapView)
deck.gl-raster (kylebarron/deck.gl-raster — client-side LST rendering from COGs)
MapLibre GL (basemap underlay)
PMTiles (fieldmaps.io ADM boundaries; @loaders.gl/pmtiles)
Nominatim (geocoding — same setup as Barrios Visibles)
Vercel (hosting; deployed by user)
```

Hosting: user owns the repo and Vercel project; agent works in the repo.

---

## 4. Data layers

### LST (the hero layer)
- **Format:** Cloud-Optimized GeoTIFF on Source Cooperative.
- **URL:** *not yet provisioned.* Use a configurable env var `NEXT_PUBLIC_LST_COG_PATTERN` and stub it with a known public Landsat COG endpoint while the real one is being set up. Document the URL contract in the README.
- **Render:** `deck.gl-raster` (`BitmapLayer` derivatives) reading per-band/per-year COGs and applying the colormap **in the GPU shader** so percentile / year / compositing changes do not re-fetch tiles. This is non-negotiable — it's the perf story.
- **Compositing approaches** (UI exposes all four): `p99` (extreme), `p95` (hot), `mean` (typical), `max` (single peak). For v0.1, ship pre-rendered per-year/per-percentile composites — no client-side reduction yet. Year selection is `2020–2025`, single year / multi-year / rolling avg.
- **Heat ramp:** the 9-step OKLCH ramp from the brand kit. Encode as a 1×9 GPU LUT.

### Admin boundaries (overlay + filter)
- **Source:** [fieldmaps.io](https://fieldmaps.io/) PMTiles — ADM0 → ADM3.
- **Render:** `MVTLayer` from PMTiles via `@loaders.gl/pmtiles`.
- **Behavior:** outline-only stroke at all levels; level shown depends on zoom (adm0 z2–4, adm1 z4–7, adm2 z7–9, adm3 z9+). On click, set the active filter; legend rescales to that geometry's pixel range.

### Basemap
- Plain MapLibre vector basemap (Protomaps Basemaps style, light + dark variants). Toggle to satellite imagery (Sentinel-2 cloud-free or Maxar, configurable). Default plain.

---

## 5. View system (the big one)

**Variant A layout, but the map starts as a 3D globe and snaps to flat at z ≥ 10.** Both directions animate.

```
zoom < 10  →  deck.gl _GlobeView, orthographic-feel, slow auto-rotation off by default
zoom ≥ 10  →  deck.gl MapView (web mercator), MapLibre basemap underneath
```

- **Animated transition** in both directions (~700ms, ease-out): camera lerps view-state across the GlobeView↔MapView swap. Use deck.gl's `transitionInterpolator` + `FlyToInterpolator`. Test: zoom into a city, zoom back out — both transitions feel the same weight.
- **Layer parity:** the LST raster + ADM overlay must render in both views. `deck.gl-raster` works in both view modes; verify ADM PMTiles layer projects correctly in `_GlobeView` (it does, but watch antimeridian).
- **Globe styling:** match the brand kit's dithered globe — subtle dot-grid texture overlay, very low contrast, dark default. Don't ship a Google-Earth photo globe.
- **No interaction modality changes** at the snap — pan/zoom controls work the same. Just the projection swaps.

---

## 6. Layout (Variant A)

```
┌─────────────────────────────────────────────────────────────┐
│ topbar (48px): wordmark · v0.1 · prototype     theme toggle │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  side panel  │              MAP CANVAS                      │
│   (380px)    │   (3D globe at z<10, flat at z≥10)           │
│              │                                              │
│  sticky      │   floating chrome:                           │
│  scroll      │     · top-right: zoom stack                  │
│              │     · bottom-left: legend (auto · viewport)  │
│              │     · bottom-right: attribution              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Side panel sections (in order, all in `map-prototype.jsx` `SidePanel`):**
1. Header — "A Radiant Earth project" eyebrow + wordmark + lede sentence
2. **Where** — search input (Nominatim) + ADM breadcrumb of active filter
3. **When** — period segmented control + year grid (2020–2025) + compositing chips
4. **Layers** — LST toggle (locked on), ADM toggle, satellite toggle
5. About this measurement (collapsible)
6. Resources — link to coolcities.wri.org and the WRI insights article
7. Footer — data/hosting/build version

**Floating legend (bottom-left of map):** auto-rescales to the visible pixel range. When ADM is active, rescales to the filtered geometry's pixel range. Show the rescaling label ("AUTO · VIEWPORT" / "AUTO · KARACHI DISTRICT").

---

## 7. URL schema (deep-linking is required)

```
https://app.sensableheat.org/?
  lat=24.86&lon=67.01&z=9.5&         # camera
  years=2022,2023,2024&p=p95&        # time/composite
  adm=PAK.4.1&                        # active admin filter (GADM-style id)
  base=plain&sat=0&adm_overlay=1&    # layers
  theme=dark
```

Sync state to URL via Next.js `useSearchParams` + `router.replace`. Read on mount. Round-trip every interaction. *Planners share links — this is core UX.*

---

## 8. Responsiveness (1000% important — user's words)

- **Desktop ≥ 1024px:** layout above.
- **Tablet 640–1024px:** side panel becomes a left drawer that opens over the map; collapsed to a floating "panel" pill in the top-left when closed.
- **Mobile < 640px:** side panel becomes a **bottom sheet** with three snap heights (peek 64px / half / full). Map fills the screen above. Legend repositions to top of bottom sheet when peeked, floats over map when full. Zoom stack bottom-right of map. Search becomes a top-anchored pill that expands.
- All controls **44px minimum hit target** on touch.
- Test the 3D→2D snap on mobile — it should be smooth on a mid-range Android.

---

## 9. Brand binding

Bring these into `app/globals.css` or equivalent **before** wiring shadcn:

```css
:root {
  /* Neutrals */
  --bg: #0c0e11; --surface: #14171b; --surface-2: #1a1d22;
  --line: #23272d; --line-2: #2c3036;
  --fg: #f2f1ec; --mute: #6b6e74; --mute-2: #9a9d9f;

  /* 9-step OKLCH heat ramp */
  --h0: oklch(0.18 0.04 25);
  --h1: oklch(0.26 0.07 25);
  --h2: oklch(0.34 0.10 27);
  --h3: oklch(0.42 0.12 28);
  --h4: oklch(0.50 0.14 30);
  --h5: oklch(0.58 0.16 32);
  --h6: oklch(0.66 0.17 34);
  --h7: oklch(0.74 0.16 36);
  --h8: oklch(0.82 0.14 40);
}
body.light { /* see brand kit + map prototype for light tokens */ }
```

Type: **IBM Plex Sans** for UI text, **IBM Plex Mono** for labels/eyebrows/legends/coordinates. Mono labels are 10–11px, uppercase, `letter-spacing: 0.14–0.18em`.

**Wordmark** (use the prototype's CSS exactly — bracket settings are dialed in):
- `padding: 5px 10px` on the `[sens]` target, `margin-right: 4px`
- 10×10 corner brackets, **3px** thickness
- The brackets render via four absolute `<span>`s with two-sided borders. Don't use box-shadow or borders on the parent — the inset corners are the whole point.

shadcn primitives are used as plumbing only — re-skin them with the tokens above. Buttons, inputs, segmented controls, switches, and the breadcrumb already have stylings in the prototype CSS to copy.

---

## 10. Component map (prototype → real app)

| Prototype JSX | Real app |
|---|---|
| `App` / `VariantA` / `VariantB` | `app/page.tsx` |
| `SidePanel` | `components/side-panel/index.tsx` + section subcomponents |
| `Wordmark` | `components/wordmark.tsx` (lift CSS verbatim) |
| `HeatDot`, `CityLabel`, `Graticule`, `ContinentLayer`, `GlobeLand` | **Discard.** All replaced by real deck.gl layers. |
| `I` (icon set) | `lucide-react` equivalents (search, sun, moon, plus, minus, locate, layers, info, chevron, arrow-right, clock) |
| Floating legend, zoom stack, attribution | `components/map-chrome/*.tsx` |

---

## 11. Out of scope for v0.1

Document these as `// TODO(v0.2)` in code, not as bugs:

- User accounts / saved cities
- Time scrubber / animation
- City-vs-city comparison
- CSV/GeoTIFF download of the active view
- On-the-fly compositing (we ship pre-rendered composites only)
- Hover tooltips with point readings (legend rescaling covers most needs)
- Embeddable iframe widget
- i18n (English only for v0.1)

---

## 12. Acceptance checklist

The agent should not call the build done until all of these pass:

- [ ] Globe renders at world zoom; flat map renders at city zoom; both directions animate
- [ ] LST raster renders client-side with the 9-step heat ramp; year/percentile changes do not re-fetch tiles
- [ ] Nominatim search jumps the camera and updates the ADM breadcrumb
- [ ] ADM filter rescales the legend
- [ ] All state round-trips through the URL — refresh preserves view exactly
- [ ] Mobile bottom-sheet pattern works at 375px width
- [ ] Lighthouse score ≥ 90 on desktop perf + accessibility
- [ ] Open the brand kit and the prototype side-by-side with the live app — wordmark, ramp, type sizes, label tracking, panel densities all match

---

## 13. Project setup

```bash
npx create-next-app@latest sensable-heat --typescript --tailwind --app
cd sensable-heat
npx shadcn@latest init
npm i deck.gl @deck.gl/react @deck.gl/layers @deck.gl/geo-layers \
  maplibre-gl react-map-gl \
  @loaders.gl/pmtiles \
  deck.gl-raster
```

Env vars (`.env.local`):
```
NEXT_PUBLIC_LST_COG_PATTERN=https://...source-coop.../{year}/{percentile}/{z}/{x}/{y}.tif
NEXT_PUBLIC_NOMINATIM_URL=https://nominatim.openstreetmap.org
NEXT_PUBLIC_ADM_PMTILES=https://fieldmaps.io/.../adm.pmtiles
NEXT_PUBLIC_BASEMAP_STYLE=https://api.protomaps.com/styles/v4/dark.json?key=...
```

---

## 14. Questions the agent should ask before starting

If any of these blocks progress, ask the user — do not guess:

1. The actual Source Cooperative LST URL pattern and band/percentile encoding
2. The exact fieldmaps.io PMTiles URL for ADM0–3
3. Whether to use the public Nominatim instance or self-host (rate limits will bite at any real traffic)
4. Protomaps API key (or fall back to a free tile server)
5. GitHub repo URL to push to

Everything else: agent decides, documents the choice in the README.
