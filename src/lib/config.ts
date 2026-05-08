// Map configuration

export const MAP_CONFIG = {
  GLOBE_ZOOM_THRESHOLD: 10,
  TRANSITION_DURATION: 700,
  MIN_ZOOM: 0,
  MAX_ZOOM: 20,
  INITIAL_VIEW: {
    latitude: 20,
    longitude: 0,
    zoom: 1.5,
    bearing: 0,
    pitch: 0,
  },
};

// Data sources
export const SOURCES = {
  // CarbonPlan PMTiles basemap (Protomaps-derived, free)
  basemap: {
    type: "vector" as const,
    url: "pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/global.pmtiles",
    attribution:
      '<a href="https://protomaps.com">Protomaps</a> · <a href="https://openstreetmap.org">OSM</a>',
  },

  // ESRI satellite (fallback for satellite toggle)
  satellite: {
    type: "raster" as const,
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxzoom: 19,
  },

  // Glyphs for map labels
  glyphs:
    "https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf",

  // Overture Maps divisions (admin boundaries)
  divisions: {
    type: "vector" as const,
    url: "pmtiles://https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2026-01-21/divisions.pmtiles",
    attribution: '<a href="https://overturemaps.org">Overture Maps</a>',
  },
};

// 9-step heat ramp (hex values for GPU/canvas use)
export const HEAT_RAMP = [
  "#2b1410", // h0
  "#401a14", // h1
  "#592118", // h2
  "#75281c", // h3
  "#913020", // h4
  "#ae3a26", // h5
  "#c75426", // h6 (primary accent)
  "#df7438", // h7
  "#ee9a52", // h8
];

// Natural Earth simplified land for globe view
// Using a CDN-hosted GeoJSON for simplicity
export const LAND_GEOJSON_URL =
  "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson";

export const GRATICULE_GEOJSON_URL =
  "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_graticules_15.geojson";
