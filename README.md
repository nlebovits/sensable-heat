# Sensable Heat

**Where heat reaches the ground.** A global, high-resolution measurement of land surface temperature, made plain enough to plan against.

A Radiant Earth project.

## Overview

Sensable Heat is a public, single-page web map that shows municipal decision makers, multilateral program staff, and climate researchers how hot surfaces actually get in cities worldwide. It composites Landsat 8/9 thermal data at 30m resolution across selectable years and percentiles.

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Map:** deck.gl 9 (GlobeView + MapView) + MapLibre GL
- **State:** Zustand
- **Basemap:** CartoCDN (dark-matter / positron)

## Features (v0.1)

- [x] Side panel with time/layer controls
- [x] Year selection (2020-2025) with single/multi-year/rolling avg modes
- [x] Compositing options (p99, p95, mean, max)
- [x] Theme toggle (dark/light)
- [x] 9-step OKLCH heat ramp
- [x] Zoom controls with geolocation
- [x] Globe view at z<10, flat map at z≥10
- [ ] LST raster layer (awaiting COG URLs from Source Cooperative)
- [ ] Admin boundaries layer (awaiting PMTiles)
- [ ] Nominatim geocoding integration
- [ ] URL deep-linking
- [ ] Mobile responsive bottom sheet

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
# LST Cloud-Optimized GeoTIFF pattern (not yet provisioned)
NEXT_PUBLIC_LST_COG_PATTERN=

# Nominatim geocoding endpoint
NEXT_PUBLIC_NOMINATIM_URL=https://nominatim.openstreetmap.org

# Admin boundaries PMTiles (not yet available)
NEXT_PUBLIC_ADM_PMTILES=

# Basemap style URLs (CartoCDN free tier)
NEXT_PUBLIC_BASEMAP_DARK=https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
NEXT_PUBLIC_BASEMAP_LIGHT=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
```

## Data Sources

| Layer | Source | Status |
|-------|--------|--------|
| LST | Landsat C2 L2 via Source Cooperative | Pending COG provisioning |
| Admin boundaries | fieldmaps.io edge-matched | Parquet available, PMTiles needed |
| Basemap | CartoCDN | Active |

## Project Structure

```
src/
├── app/
│   ├── globals.css     # Brand tokens + component styles
│   ├── layout.tsx      # Root layout with IBM Plex fonts
│   └── page.tsx        # Main page component
├── components/
│   ├── map/            # deck.gl map container
│   ├── map-chrome/     # Legend, zoom stack, attribution
│   ├── side-panel/     # Control panel
│   ├── wordmark.tsx    # Brand wordmark with viewfinder brackets
│   └── topbar.tsx      # Top navigation bar
├── store/
│   └── map-store.ts    # Zustand state management
└── lib/
    └── utils.ts        # Utility functions
```

## Design Reference

See `handoff/` for:
- `ENGINEERING.md` — Full engineering spec
- `brand-tokens.css` — CSS custom properties
- `reference/*.html` — Interactive prototypes (open in browser)

## TODO (v0.2)

- User accounts / saved cities
- Time scrubber / animation
- City-vs-city comparison
- CSV/GeoTIFF download
- On-the-fly compositing
- Hover tooltips with point readings
- Embeddable iframe widget
- i18n

## License

[TBD]
