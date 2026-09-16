"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMapStore } from "@/store/map-store";

function parseFloat2(val: string | null, fallback: number): number {
  if (!val) return fallback;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : fallback;
}

/** Camera the URL asks for, falling back to whatever the caller already has. */
export function cameraFromUrl(
  params: URLSearchParams | ReadonlyURLSearchParams,
  fallback: { latitude: number; longitude: number; zoom: number }
) {
  return {
    latitude: parseFloat2(params.get("lat"), fallback.latitude),
    longitude: parseFloat2(params.get("lng"), fallback.longitude),
    zoom: parseFloat2(params.get("z"), fallback.zoom),
  };
}

export function useUrlSync() {
  const searchParams = useSearchParams();
  const hasHydrated = useRef(false);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    latitude,
    longitude,
    zoom,
    theme,
    showLst,
    showChm,
    showAdm,
    showBuildings,
    showSatellite,
    setViewState,
    setShowLst,
    setShowChm,
    setShowBuildings,
    setTheme,
    setShowAdm,
    setShowSatellite,
  } = useMapStore();

  // Hydrate store from URL on mount (once)
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const lat = parseFloat2(searchParams.get("lat"), latitude);
    const lng = parseFloat2(searchParams.get("lng"), longitude);
    const z = parseFloat2(searchParams.get("z"), zoom);

    if (lat !== latitude || lng !== longitude || z !== zoom) {
      setViewState({ latitude: lat, longitude: lng, zoom: z });
    }

    const urlLst = searchParams.get("lst");
    if (urlLst !== null) {
      setShowLst(urlLst === "1");
    }

    const urlChm = searchParams.get("chm");
    if (urlChm !== null) {
      setShowChm(urlChm === "1");
    }

    const urlTheme = searchParams.get("theme");
    if (urlTheme === "light" || urlTheme === "dark") {
      setTheme(urlTheme);
    }

    const urlAdm = searchParams.get("adm");
    if (urlAdm !== null) {
      setShowAdm(urlAdm === "1");
    }

    const urlBuildings = searchParams.get("bld");
    if (urlBuildings !== null) {
      setShowBuildings(urlBuildings === "1");
    }

    const urlSat = searchParams.get("sat");
    if (urlSat !== null) {
      setShowSatellite(urlSat === "1");
    }
  }, [
    searchParams,
    latitude,
    longitude,
    zoom,
    setViewState,
    setShowLst,
    setShowChm,
    setShowBuildings,
    setTheme,
    setShowAdm,
    setShowSatellite,
  ]);

  // Update URL when state changes (debounced)
  useEffect(() => {
    if (!hasHydrated.current) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      params.set("lat", latitude.toFixed(4));
      params.set("lng", longitude.toFixed(4));
      params.set("z", zoom.toFixed(2));
      params.set("theme", theme);
      params.set("lst", showLst ? "1" : "0");
      params.set("chm", showChm ? "1" : "0");
      params.set("adm", showAdm ? "1" : "0");
      params.set("bld", showBuildings ? "1" : "0");
      params.set("sat", showSatellite ? "1" : "0");

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }, 150);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [
    latitude,
    longitude,
    zoom,
    theme,
    showLst,
    showChm,
    showAdm,
    showBuildings,
    showSatellite,
  ]);
}
