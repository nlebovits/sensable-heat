"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { Map as MapLibreMap } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { MapView, _GlobeView as GlobeView } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "@deck.gl/core";
import type { MapViewState, Layer } from "@deck.gl/core";

import { useMapStore } from "@/store/map-store";
import { Legend } from "@/components/map-chrome/legend";
import { ZoomStack } from "@/components/map-chrome/zoom-stack";
import { Attribution } from "@/components/map-chrome/attribution";

const GLOBE_ZOOM_THRESHOLD = 10;
const TRANSITION_DURATION = 700;

const BASEMAP_STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const BASEMAP_STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function MapContainer() {
  const {
    latitude,
    longitude,
    zoom,
    bearing,
    pitch,
    theme,
    showAdm,
    setViewState,
  } = useMapStore();

  const [isGlobe, setIsGlobe] = useState(zoom < GLOBE_ZOOM_THRESHOLD);

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
    setViewState({ zoom: Math.min(zoom + 1, 20) });
  }, [zoom, setViewState]);

  const handleZoomOut = useCallback(() => {
    setViewState({ zoom: Math.max(zoom - 1, 0) });
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

  const layers = useMemo((): Layer[] => {
    const result: Layer[] = [];

    // TODO(v0.1): Add LST raster layer when COGs are available
    // For now, we show just the basemap

    // TODO(v0.1): Add admin boundaries layer when PMTiles are available

    return result;
  }, [showAdm]);

  const basemapStyle = theme === "dark" ? BASEMAP_STYLE_DARK : BASEMAP_STYLE_LIGHT;

  return (
    <div className="relative flex-1 h-full">
      <DeckGL
        views={views}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layers={layers}
        controller={true}
        style={{ position: "absolute", inset: "0" }}
      >
        {!isGlobe && (
          <MapLibreMap
            mapStyle={basemapStyle}
            attributionControl={false}
          />
        )}
      </DeckGL>

      {/* Globe background for globe view */}
      {isGlobe && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%,
              var(--surface-2) 0%,
              var(--bg) 70%)`,
          }}
        />
      )}

      {/* Map chrome */}
      <div className="map-chrome bl">
        <Legend />
      </div>

      <div className="map-chrome tr">
        <ZoomStack
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocate={handleLocate}
        />
      </div>

      <div className="map-chrome br">
        <Attribution />
      </div>

      {/* View mode indicator */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 mono-label glass px-3 py-1.5"
        style={{ fontSize: 10 }}
      >
        {isGlobe ? "GLOBE VIEW" : "MAP VIEW"} · Z{zoom.toFixed(1)}
      </div>
    </div>
  );
}
