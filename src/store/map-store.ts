import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAP_CONFIG } from "@/lib/config";
import type { CelsiusRange } from "@/lib/lst-catalog";

export type BaseMap = "plain" | "satellite";

interface MapState {
  // Camera
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
  isFlying: boolean;

  // Layers
  showLst: boolean;
  showChm: boolean;
  showAdm: boolean;
  showBuildings: boolean;
  showSatellite: boolean;

  // Active colour range of the LST ramp, published by useLstLayer.
  lstRange: CelsiusRange | null;

  // Admin filter
  admPath: string[];
  admId: string | null;

  // UI
  theme: "dark" | "light";
  panelOpen: boolean;
  /** True while the walkthrough dialog is open by explicit request. */
  walkthroughOpen: boolean;

  // Actions
  setViewState: (viewState: Partial<Pick<MapState, "latitude" | "longitude" | "zoom" | "bearing" | "pitch">>) => void;
  setShowLst: (show: boolean) => void;
  setShowChm: (show: boolean) => void;
  setShowAdm: (show: boolean) => void;
  setShowBuildings: (show: boolean) => void;
  setShowSatellite: (show: boolean) => void;
  setLstRange: (range: CelsiusRange | null) => void;
  setAdmFilter: (path: string[], id: string | null) => void;
  clearAdmFilter: () => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setPanelOpen: (open: boolean) => void;
  setWalkthroughOpen: (open: boolean) => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  setIsFlying: (isFlying: boolean) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      // Initial camera: framed on the LST collection's coverage
      latitude: MAP_CONFIG.INITIAL_VIEW.latitude,
      longitude: MAP_CONFIG.INITIAL_VIEW.longitude,
      zoom: MAP_CONFIG.INITIAL_VIEW.zoom,
      bearing: MAP_CONFIG.INITIAL_VIEW.bearing,
      pitch: MAP_CONFIG.INITIAL_VIEW.pitch,
      isFlying: false,

      // Layers
      showLst: true,
      showChm: false,
      showAdm: true,
      showBuildings: false,
      showSatellite: false,

      lstRange: null,

      // Admin filter
      admPath: [],
      admId: null,

      // UI
      theme: "dark",
      panelOpen: true,
      walkthroughOpen: false,

      // Actions
      setViewState: (viewState) => set((state) => ({ ...state, ...viewState })),

      setShowLst: (showLst) => set({ showLst }),

      setShowChm: (showChm) => set({ showChm }),

      setShowAdm: (showAdm) => set({ showAdm }),

      setShowBuildings: (showBuildings) => set({ showBuildings }),

      setShowSatellite: (showSatellite) => set({ showSatellite }),

      setLstRange: (lstRange) => set({ lstRange }),

      setAdmFilter: (admPath, admId) => set({ admPath, admId }),

      clearAdmFilter: () => set({ admPath: [], admId: null }),

      setTheme: (theme) => set({ theme }),

      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

      setPanelOpen: (panelOpen) => set({ panelOpen }),

      setWalkthroughOpen: (walkthroughOpen) => set({ walkthroughOpen }),

      flyTo: (lng, lat, zoom = 12) =>
        set({
          longitude: lng,
          latitude: lat,
          zoom,
          isFlying: true,
        }),

      setIsFlying: (isFlying) => set({ isFlying }),
    }),
    {
      name: "sensable-heat-settings",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
