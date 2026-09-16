// Map configuration

export const MAP_CONFIG = {
  TRANSITION_DURATION: 700,
  MIN_ZOOM: 0,
  MAX_ZOOM: 20,
  // Framed on South America, the only continent the LST collection covers.
  INITIAL_VIEW: {
    latitude: -15,
    longitude: -60,
    zoom: 3.2,
    bearing: 0,
    pitch: 0,
  },
};

// Landsat land surface temperature, 95th percentile over 2021-2025.
// A STAC collection of 104 single-band uint16 COGs on Source Cooperative,
// one per 5-degree tile. See https://github.com/nlebovits/landsat-lst-smoke
export const LST = {
  COLLECTION_URL:
    "https://s3.us-west-2.amazonaws.com/us-west-2.opendata.source.coop/nlebovits/landsat-lst/lst-p95-2021-2025",

  /** stac-geoparquet mirror of the collection's items. */
  get ITEMS_PARQUET_URL() {
    return `${this.COLLECTION_URL}/items.parquet`;
  },

  /** Asset key of the temperature raster within each item. */
  ASSET_KEY: "lst_p95",

  // Pixel encoding: celsius = dn * SCALE + OFFSET, and DN 0 means nodata.
  SCALE: 0.01,
  OFFSET: -50.0,
  NODATA_DN: 0,

  /** Widest DN a uint16 texture normalizes against, so shader value = dn / this. */
  MAX_DN: 65535,

  /** Half-width of the display range, in standard deviations. */
  SIGMA: 2,

  /**
   * Smallest change in either range bound, in Celsius, that redraws the ramp.
   * The viewport range is recomputed on tile load, and a redraw can trigger
   * another load event, so an exact comparison would never settle.
   */
  RANGE_EPSILON_C: 0.05,

  ATTRIBUTION: "Landsat C2 L2 · USGS",
};

// Overture Maps release mirrored by the Portolan catalog. Overture puts the
// release date in every path, so this string moves when the release does.
const OVERTURE_RELEASE = "2026-08-19.0";
const OVERTURE_TILES = `https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/${OVERTURE_RELEASE}`;
const OVERTURE_ATTRIBUTION =
  '<a href="https://overturemaps.org">Overture Maps</a>, © OpenStreetMap contributors';

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

  // Glyphs for map labels, served from public/fonts so the map's typeface
  // matches the panel and the legend. See scripts/generate-glyphs.mjs.
  //
  // Self-hosted because no public glyph server carries IBM Plex. The
  // CarbonPlan bucket behind the basemap holds only CarbonPlan's licensed
  // Relative faces plus Roboto Mono, and fonts.openmaptiles.org answers every
  // path with an HTML landing page under a 200.
  glyphs: "/fonts/{fontstack}/{range}.pbf",

  // Overture Maps vector tiles, catalogued at
  // https://nlebovits.github.io/overture-portolan/catalog.json
  //
  // Each archive covers a whole Overture theme. minzoom and maxzoom are read
  // from the PMTiles headers and must be declared: without them MapLibre
  // assumes the archive reaches zoom 22, requests tiles that do not exist, and
  // draws nothing without raising an error.
  divisions: {
    type: "vector" as const,
    tiles: [`pmtiles://${OVERTURE_TILES}/divisions.pmtiles/{z}/{x}/{y}`],
    minzoom: 0,
    maxzoom: 12,
    attribution: OVERTURE_ATTRIBUTION,
  },

  buildings: {
    type: "vector" as const,
    tiles: [`pmtiles://${OVERTURE_TILES}/buildings.pmtiles/{z}/{x}/{y}`],
    minzoom: 0,
    maxzoom: 14,
    attribution: OVERTURE_ATTRIBUTION,
  },
};

/**
 * Zoom at which building footprints appear. The archive carries `building`
 * from zoom 4, so this is a legibility choice rather than a data limit.
 */
export const BUILDINGS_MIN_ZOOM = 11;

// Meta DINOv3 Global Canopy Height Map v2 (ml3), repackaged cloud-native by
// TGE Labs. https://data.source.coop/tge-labs/meta-chm-v2/README.md
//
// Two tiers. One global overview COG carries zoom 0 to 9; above that, 213,109
// native tiles on a zoom-10 quadkey grid at 1.19 m. Everything is EPSG:3857,
// so it needs no reprojection onto a web map.
export const CHM = {
  BASE_URL: "https://data.source.coop/tge-labs/meta-chm-v2",

  /** Single COG covering the world at 611 m per pixel. */
  get OVERVIEW_URL() {
    return `${this.BASE_URL}/overview/chm_overview_z8.tif`;
  },

  /** GeoParquet index of the native tiles: quadkey, absolute URL, WGS84 bbox. */
  get TILES_PARQUET_URL() {
    return `${this.BASE_URL}/tiles.parquet`;
  },

  /** First zoom at which the native tiles beat the global overview. */
  MOSAIC_MIN_ZOOM: 10,

  // Pixels are canopy height in whole metres. The source sets no nodata mask,
  // so 0 means both "measured zero" and "no data". Treating it as nodata is
  // what leaves pavement and bare ground transparent, which is the point: the
  // canopy layer paints only where something is growing.
  NODATA_DN: 0,
  MAX_DN: 255,

  /** Display range in metres. Most canopy worldwide falls inside it. */
  MIN_METRES: 0,
  MAX_METRES: 40,

  ATTRIBUTION: "Meta DINOv3 CHM v2 · TGE Labs",
};

// 9-step canopy ramp, low scrub to tall crown.
//
// The dark end starts at a mid green rather than near black. Canopy draws over
// the heat ramp, and most urban trees are 5 to 15 m, which lands in the lower
// third: a near-black low end turned every street tree into a dark speck that
// read as dirt on the orange rather than as a tree.
export const CANOPY_RAMP = [
  "#2f6b41", // c0
  "#3a7d49", // c1
  "#478f51", // c2
  "#56a15a", // c3
  "#67b364", // c4
  "#7cc471", // c5
  "#95d482", // c6
  "#b2e298", // c7
  "#d3f0b4", // c8
];

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
