"use client";

import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import {
  Map as ReactMapGL,
  useControl,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import { addProtocol, removeProtocol } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import { Protocol } from "pmtiles";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer, LayerProps } from "@deck.gl/core";

import { useSearchParams } from "next/navigation";
import { useMapStore } from "@/store/map-store";
import { cameraFromUrl } from "@/hooks/useUrlSync";
import { MAP_CONFIG, SOURCES, BUILDINGS_MIN_ZOOM } from "@/lib/config";
import { useLstLayer } from "@/hooks/useLstLayer";
import { useChmLayer } from "@/hooks/useChmLayer";
import { Search } from "@/components/map-chrome/search";
import { ZoomStack } from "@/components/map-chrome/zoom-stack";
import { Attribution } from "@/components/map-chrome/attribution";

/**
 * MapLibre layer the interleaved raster is inserted before. Every style layer
 * declared from here on draws above the temperature data.
 */
const OVERLAY_ANCHOR_LAYER = "roads";

/**
 * How far the store camera may sit from MapLibre's own before the map is moved
 * to match. The two round-trip through `onMove`, so they never agree exactly.
 */
const CAMERA_EPSILON_DEG = 1e-6;
const CAMERA_EPSILON_ZOOM = 1e-3;

/**
 * Mounts deck.gl inside MapLibre's own GL context.
 *
 * `interleaved` is what makes the Overture vector layers legible: the deck
 * layers are inserted into MapLibre's layer stack rather than painted over the
 * whole map, so anything MapLibre draws after them sits on top of the raster.
 */
function DeckOverlay({ layers }: { layers: Layer[] }) {
  const overlay = useControl(
    () => new MapboxOverlay({ interleaved: true, layers })
  );
  overlay.setProps({ layers });
  return null;
}

export function MapContainer() {
  const {
    latitude,
    longitude,
    zoom,
    bearing,
    pitch,
    theme,
    showLst,
    showChm,
    showAdm,
    showBuildings,
    showSatellite,
    isFlying,
    setViewState,
    setIsFlying,
  } = useMapStore();

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Frame the map from the URL on the first render. useUrlSync writes the same
  // values to the store, but only in an effect, and by then the raster would
  // already have loaded every tile of the default view.
  const searchParams = useSearchParams();
  const [initialCamera] = useState(() =>
    cameraFromUrl(searchParams, { latitude, longitude, zoom })
  );

  // LST COG mosaic, drawn over the MapLibre basemap
  const { layer: lstLayer, error: lstError } = useLstLayer(showLst);

  // Canopy height, drawn over the temperature. Its zero-height pixels are
  // transparent, so the heat ramp shows through every paved and bare surface.
  const { layers: chmLayers, error: chmError } = useChmLayer(showChm);

  // Register PMTiles protocol on mount
  useEffect(() => {
    const protocol = new Protocol();
    addProtocol("pmtiles", protocol.tile);

    return () => {
      removeProtocol("pmtiles");
    };
  }, []);

  // Write the camera back to the store as the user drags and zooms.
  const onMove = useCallback(
    (e: ViewStateChangeEvent) => {
      const { latitude, longitude, zoom, bearing, pitch } = e.viewState;
      setViewState({ latitude, longitude, zoom, bearing, pitch });
    },
    [setViewState]
  );

  // A store-driven flight, from the place search. MapLibre animates it, so it
  // runs once per request rather than on every camera write.
  useEffect(() => {
    if (!isFlying) return;

    mapRef.current?.flyTo({
      center: [longitude, latitude],
      zoom,
      duration: MAP_CONFIG.TRANSITION_DURATION,
    });
    setIsFlying(false);
  }, [isFlying, longitude, latitude, zoom, setIsFlying]);

  // MapLibre owns the camera, so a store change that did not come from the map
  // has to be pushed back into it. This is what lands a shared ?lat&lng&z URL,
  // which useUrlSync writes to the store only after the map has mounted.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isFlying || map.isMoving()) return;

    const center = map.getCenter();
    const diverged =
      Math.abs(center.lat - latitude) > CAMERA_EPSILON_DEG ||
      Math.abs(center.lng - longitude) > CAMERA_EPSILON_DEG ||
      Math.abs(map.getZoom() - zoom) > CAMERA_EPSILON_ZOOM;

    if (diverged) {
      map.jumpTo({ center: [longitude, latitude], zoom, bearing, pitch });
    }
  }, [latitude, longitude, zoom, bearing, pitch, isFlying, isMapLoaded]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomTo(Math.min(zoom + 1, MAP_CONFIG.MAX_ZOOM), {
      duration: 200,
    });
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomTo(Math.max(zoom - 1, MAP_CONFIG.MIN_ZOOM), {
      duration: 200,
    });
  }, [zoom]);

  const handleLocate = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 12,
            duration: MAP_CONFIG.TRANSITION_DURATION,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
        }
      );
    }
  }, []);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  const layers = useMemo((): Layer[] => {
    // `beforeId` places these underneath the first MapLibre layer that must
    // stay readable over them. Everything declared after that id in the style,
    // which is every Overture layer and every label, draws on top.
    //
    // @deck.gl/mapbox reads this off `layer.props`, but deck.gl's core
    // LayerProps does not declare it, so the prop needs a cast to be set.
    const anchored = { beforeId: OVERLAY_ANCHOR_LAYER } as unknown as Partial<
      Required<LayerProps>
    >;

    // Temperature first, canopy second. deck.gl draws in array order, so the
    // canopy lands on top and its transparent ground lets the heat through.
    const stack = lstLayer ? [lstLayer, ...chmLayers] : chmLayers;
    return stack.map((layer) => layer.clone(anchored));
  }, [lstLayer, chmLayers]);

  // Build the MapLibre basemap style
  const mapStyle = useMemo(() => {
    return {
      version: 8 as const,
      glyphs: SOURCES.glyphs,
      sources: {
        basemap: SOURCES.basemap,
        ...(showSatellite ? { satellite: SOURCES.satellite } : {}),
        ...(showAdm ? { divisions: SOURCES.divisions } : {}),
        ...(showBuildings ? { buildings: SOURCES.buildings } : {}),
      },
      layers: [
        // Satellite base (if enabled)
        ...(showSatellite
          ? [
              {
                id: "satellite",
                type: "raster" as const,
                source: "satellite",
                paint: {
                  "raster-saturation": -0.5,
                  "raster-opacity": 0.7,
                },
              },
            ]
          : []),

        // Land fill (if no satellite)
        ...(!showSatellite
          ? [
              {
                id: "land",
                type: "fill" as const,
                source: "basemap",
                "source-layer": "land",
                paint: {
                  "fill-color": theme === "dark" ? "#14171b" : "#f7f6f1",
                },
              },
            ]
          : []),

        // Water
        {
          id: "water",
          type: "fill" as const,
          source: "basemap",
          "source-layer": "water",
          paint: {
            "fill-color": theme === "dark" ? "#0c0e11" : "#d4e4ec",
          },
        },

        // Boundaries (from basemap)
        {
          id: "boundaries",
          type: "line" as const,
          source: "basemap",
          "source-layer": "boundaries",
          paint: {
            "line-color":
              theme === "dark"
                ? "rgba(255, 255, 255, 0.25)"
                : "rgba(0, 0, 0, 0.2)",
            "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.5, 10, 1.5],
          },
        },

        // ------------------------------------------------------------------
        // The deck.gl raster is interleaved immediately before "roads", so
        // every layer from here down draws on top of the temperature data.
        // ------------------------------------------------------------------

        // Roads (higher zoom)
        {
          id: OVERLAY_ANCHOR_LAYER,
          type: "line" as const,
          source: "basemap",
          "source-layer": "roads",
          filter: ["in", "kind", "highway", "major_road"],
          minzoom: 8,
          paint: {
            "line-color":
              theme === "dark"
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.1)",
            "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 14, 2],
          },
        },

        // Admin boundaries (Overture divisions)
        ...(showAdm
          ? [
              {
                id: "admin-boundaries",
                type: "line" as const,
                source: "divisions",
                // Boundary lines rather than area outlines, so a border shared
                // by two divisions is drawn once instead of twice.
                "source-layer": "division_boundary",
                paint: {
                  "line-color":
                    theme === "dark"
                      ? "rgba(255, 255, 255, 0.45)"
                      : "rgba(0, 0, 0, 0.42)",
                  "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    2, 0.3,
                    6, 0.8,
                    10, 1.5,
                    14, 2.5,
                  ],
                },
              },
            ]
          : []),

        // Building footprints (Overture buildings)
        ...(showBuildings
          ? [
              {
                id: "building-outline",
                type: "line" as const,
                source: "buildings",
                "source-layer": "building",
                // Outline only. A fill would hide the roof temperature that
                // makes the footprint worth showing.
                minzoom: BUILDINGS_MIN_ZOOM,
                paint: {
                  // White in both themes. Footprints sit on the heat ramp,
                  // which runs dark red to orange, so white is the value that
                  // separates from it at either end.
                  "line-color": "#ffffff",
                  "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    BUILDINGS_MIN_ZOOM, 0.4,
                    14, 0.7,
                    17, 1.2,
                    19, 2,
                  ],
                  "line-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    BUILDINGS_MIN_ZOOM, 0.45,
                    14, 0.75,
                    17, 0.9,
                  ],
                },
              },
            ]
          : []),

        // Place labels - cities
        {
          id: "place-city",
          type: "symbol" as const,
          source: "basemap",
          "source-layer": "places",
          filter: ["all", ["==", "kind", "locality"], [">=", "population_rank", 6]],
          minzoom: 4,
          layout: {
            "text-field": "{name}",
            "text-font": ["IBM Plex Sans SemiBold"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 4, 10, 12, 16],
          },
          paint: {
            "text-color": theme === "dark" ? "#f2f1ec" : "#0c0e11",
            "text-halo-color": theme === "dark" ? "#0c0e11" : "#f2f1ec",
            "text-halo-width": 1.5,
          },
        },

        // Place labels - towns
        {
          id: "place-town",
          type: "symbol" as const,
          source: "basemap",
          "source-layer": "places",
          filter: [
            "all",
            ["==", "kind", "locality"],
            ["<", "population_rank", 6],
            [">=", "population_rank", 3],
          ],
          minzoom: 8,
          layout: {
            "text-field": "{name}",
            "text-font": ["IBM Plex Sans Regular"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 12, 13],
          },
          paint: {
            "text-color": theme === "dark" ? "#9a9d9f" : "#5e5e5a",
            "text-halo-color": theme === "dark" ? "#0c0e11" : "#f2f1ec",
            "text-halo-width": 1,
          },
        },
      ],
    } as StyleSpecification;
  }, [theme, showSatellite, showAdm, showBuildings]);

  return (
    <div
      className="relative flex-1 h-full"
      role="application"
      aria-label="Interactive land surface temperature map"
    >
      <ReactMapGL
        ref={mapRef}
        mapStyle={mapStyle}
        initialViewState={{ ...initialCamera, bearing, pitch }}
        onMove={onMove}
        onLoad={handleMapLoad}
        minZoom={MAP_CONFIG.MIN_ZOOM}
        maxZoom={MAP_CONFIG.MAX_ZOOM}
        attributionControl={false}
        style={{ position: "absolute", inset: 0 }}
      >
        <DeckOverlay layers={layers} />
      </ReactMapGL>

      {/* Loading indicator */}
      {!isMapLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-8 w-8 border-2 border-[var(--h6-hex)] border-t-transparent animate-spin"
            />
            <span className="mono-label" style={{ fontSize: 10 }}>
              LOADING MAP
            </span>
          </div>
        </div>
      )}

      {/* Catalog failure. Without it a broken collection reads as an empty map. */}
      {(lstError || chmError) && (
        <div
          className="absolute inset-x-0 top-0 flex justify-center"
          style={{ zIndex: 20 }}
          role="alert"
        >
          <div
            className="mono-label"
            style={{
              fontSize: 10,
              padding: "6px 12px",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--h8-hex)",
            }}
          >
            {lstError
              ? `TEMPERATURE DATA UNAVAILABLE — ${lstError.message}`
              : `CANOPY DATA UNAVAILABLE — ${chmError?.message}`}
          </div>
        </div>
      )}

      {/* Map chrome */}
      <div className="map-chrome tl" style={{ zIndex: 11 }}>
        <Search />
      </div>

      <div className="map-chrome tr" style={{ zIndex: 10 }}>
        <ZoomStack
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocate={handleLocate}
        />
      </div>

      <div className="map-chrome br" style={{ zIndex: 10 }}>
        <Attribution />
      </div>
    </div>
  );
}
