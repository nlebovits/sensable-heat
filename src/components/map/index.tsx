"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { Map as ReactMapGL } from "react-map-gl/maplibre";
import { addProtocol, removeProtocol } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import { Protocol } from "pmtiles";
import DeckGL from "@deck.gl/react";
import { MapView, _GlobeView as GlobeView, FlyToInterpolator } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import type { MapViewState, Layer } from "@deck.gl/core";

import { useMapStore } from "@/store/map-store";
import { MAP_CONFIG, SOURCES, LAND_GEOJSON_URL, GRATICULE_GEOJSON_URL } from "@/lib/config";
import { Legend } from "@/components/map-chrome/legend";
import { ZoomStack } from "@/components/map-chrome/zoom-stack";
import { Attribution } from "@/components/map-chrome/attribution";

const { GLOBE_ZOOM_THRESHOLD, TRANSITION_DURATION } = MAP_CONFIG;

export function MapContainer() {
  const {
    latitude,
    longitude,
    zoom,
    bearing,
    pitch,
    theme,
    showAdm,
    showSatellite,
    setViewState,
  } = useMapStore();

  const [isGlobe, setIsGlobe] = useState(zoom < GLOBE_ZOOM_THRESHOLD);
  const [landData, setLandData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [graticuleData, setGraticuleData] = useState<GeoJSON.FeatureCollection | null>(null);

  // Register PMTiles protocol on mount
  useEffect(() => {
    const protocol = new Protocol();
    addProtocol("pmtiles", protocol.tile);

    return () => {
      removeProtocol("pmtiles");
    };
  }, []);

  // Load land and graticule data for globe view
  useEffect(() => {
    fetch(LAND_GEOJSON_URL)
      .then((r) => r.json())
      .then(setLandData)
      .catch(console.error);

    fetch(GRATICULE_GEOJSON_URL)
      .then((r) => r.json())
      .then(setGraticuleData)
      .catch(console.error);
  }, []);

  const viewState: MapViewState = useMemo(
    () => ({
      latitude,
      longitude,
      zoom,
      bearing,
      pitch,
      transitionDuration: TRANSITION_DURATION,
      transitionInterpolator: new FlyToInterpolator(),
    }),
    [latitude, longitude, zoom, bearing, pitch]
  );

  // Track globe/map mode based on zoom
  useEffect(() => {
    const shouldBeGlobe = zoom < GLOBE_ZOOM_THRESHOLD;
    if (shouldBeGlobe !== isGlobe) {
      setIsGlobe(shouldBeGlobe);
    }
  }, [zoom, isGlobe]);

  const onViewStateChange = useCallback(
    ({ viewState: newViewState }: { viewState: MapViewState }) => {
      setViewState({
        latitude: newViewState.latitude,
        longitude: newViewState.longitude,
        zoom: newViewState.zoom,
        bearing: newViewState.bearing || 0,
        pitch: newViewState.pitch || 0,
      });
    },
    [setViewState]
  );

  const handleZoomIn = useCallback(() => {
    setViewState({ zoom: Math.min(zoom + 1, MAP_CONFIG.MAX_ZOOM) });
  }, [zoom, setViewState]);

  const handleZoomOut = useCallback(() => {
    setViewState({ zoom: Math.max(zoom - 1, MAP_CONFIG.MIN_ZOOM) });
  }, [zoom, setViewState]);

  const handleLocate = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            zoom: 12,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
        }
      );
    }
  }, [setViewState]);

  const views = useMemo(() => {
    if (isGlobe) {
      return new GlobeView({ id: "globe", controller: true });
    }
    return new MapView({ id: "map", controller: true });
  }, [isGlobe]);

  // Globe layers: land + graticule
  const globeLayers = useMemo((): Layer[] => {
    if (!isGlobe) return [];

    const layers: Layer[] = [];

    // Graticule (subtle grid lines)
    if (graticuleData) {
      layers.push(
        new GeoJsonLayer({
          id: "graticule",
          data: graticuleData,
          stroked: true,
          filled: false,
          lineWidthMinPixels: 0.5,
          getLineColor: theme === "dark" ? [255, 255, 255, 25] : [0, 0, 0, 25],
        })
      );
    }

    // Land masses
    if (landData) {
      layers.push(
        new GeoJsonLayer({
          id: "land",
          data: landData,
          stroked: true,
          filled: true,
          getFillColor: theme === "dark" ? [26, 29, 34, 255] : [215, 213, 207, 255],
          getLineColor: theme === "dark" ? [35, 39, 45, 255] : [200, 198, 191, 255],
          lineWidthMinPixels: 0.5,
        })
      );
    }

    return layers;
  }, [isGlobe, landData, graticuleData, theme]);

  // Map layers (for flat view)
  const mapLayers = useMemo((): Layer[] => {
    if (isGlobe) return [];

    const layers: Layer[] = [];

    // TODO(v0.1): Add LST raster layer when COGs are available
    // TODO(v0.1): Add admin boundaries layer when PMTiles are available

    return layers;
  }, [isGlobe, showAdm]);

  const layers = useMemo(() => {
    return [...globeLayers, ...mapLayers];
  }, [globeLayers, mapLayers]);

  // Build MapLibre style for flat view
  const mapStyle = useMemo(() => {
    if (isGlobe) return undefined;

    return {
      version: 8 as const,
      glyphs: SOURCES.glyphs,
      sources: {
        basemap: SOURCES.basemap,
        ...(showSatellite ? { satellite: SOURCES.satellite } : {}),
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

        // Boundaries
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

        // Roads (higher zoom)
        {
          id: "roads",
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
            "text-font": ["Helvetica Bold"],
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
            "text-font": ["Helvetica"],
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
  }, [isGlobe, theme, showSatellite]);

  return (
    <div className="relative flex-1 h-full">
      {/* Globe background gradient */}
      {isGlobe && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              theme === "dark"
                ? "radial-gradient(circle at 50% 50%, #1a1d22 0%, #0c0e11 70%)"
                : "radial-gradient(circle at 50% 50%, #ffffff 0%, #f2f1ec 70%)",
          }}
        />
      )}

      <DeckGL
        views={views}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layers={layers}
        controller={true}
        style={{ position: "absolute", inset: "0" }}
      >
        {!isGlobe && mapStyle && (
          <ReactMapGL
            mapStyle={mapStyle}
            attributionControl={false}
          />
        )}
      </DeckGL>

      {/* Map chrome */}
      <div className="map-chrome bl" style={{ zIndex: 10 }}>
        <Legend />
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

      {/* View mode indicator */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 mono-label glass px-3 py-1.5"
        style={{ fontSize: 10, zIndex: 10 }}
      >
        {isGlobe ? "GLOBE VIEW" : "MAP VIEW"} · Z{zoom.toFixed(1)}
      </div>
    </div>
  );
}
