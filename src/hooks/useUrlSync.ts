"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useMapStore, type Period, type Compositing } from "@/store/map-store";

const VALID_PERIODS: Period[] = ["single year", "multi-year", "rolling avg"];
const VALID_COMPOSITING: Compositing[] = ["p99", "p95", "mean", "max"];

function parseFloat2(val: string | null, fallback: number): number {
  if (!val) return fallback;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : fallback;
}

function parseYears(val: string | null): number[] | null {
  if (!val) return null;
  const years = val
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n >= 2000 && n <= 2030);
  return years.length > 0 ? years : null;
}

export function useUrlSync() {
  const searchParams = useSearchParams();
  const hasHydrated = useRef(false);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    latitude,
    longitude,
    zoom,
    period,
    years,
    compositing,
    theme,
    showAdm,
    showSatellite,
    setViewState,
    setPeriod,
    setYears,
    setCompositing,
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

    const urlPeriod = searchParams.get("period") as Period | null;
    if (urlPeriod && VALID_PERIODS.includes(urlPeriod)) {
      setPeriod(urlPeriod);
    }

    const urlYears = parseYears(searchParams.get("years"));
    if (urlYears) {
      setYears(urlYears);
    }

    const urlComp = searchParams.get("comp") as Compositing | null;
    if (urlComp && VALID_COMPOSITING.includes(urlComp)) {
      setCompositing(urlComp);
    }

    const urlTheme = searchParams.get("theme");
    if (urlTheme === "light" || urlTheme === "dark") {
      setTheme(urlTheme);
    }

    const urlAdm = searchParams.get("adm");
    if (urlAdm !== null) {
      setShowAdm(urlAdm === "1");
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
    setPeriod,
    setYears,
    setCompositing,
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
      params.set("period", period);
      params.set("years", years.join(","));
      params.set("comp", compositing);
      params.set("theme", theme);
      params.set("adm", showAdm ? "1" : "0");
      params.set("sat", showSatellite ? "1" : "0");

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }, 150);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [latitude, longitude, zoom, period, years, compositing, theme, showAdm, showSatellite]);
}
