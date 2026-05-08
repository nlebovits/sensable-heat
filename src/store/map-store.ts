import { create } from "zustand";

export type Period = "single year" | "multi-year" | "rolling avg";
export type Compositing = "p99" | "p95" | "mean" | "max";
export type BaseMap = "plain" | "satellite";

interface MapState {
  // Camera
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;

  // Time
  period: Period;
  years: number[];
  compositing: Compositing;

  // Layers
  showAdm: boolean;
  showSatellite: boolean;

  // Admin filter
  admPath: string[];
  admId: string | null;

  // UI
  theme: "dark" | "light";
  panelOpen: boolean;

  // Actions
  setViewState: (viewState: Partial<Pick<MapState, "latitude" | "longitude" | "zoom" | "bearing" | "pitch">>) => void;
  setPeriod: (period: Period) => void;
  toggleYear: (year: number) => void;
  setYears: (years: number[]) => void;
  setCompositing: (compositing: Compositing) => void;
  setShowAdm: (show: boolean) => void;
  setShowSatellite: (show: boolean) => void;
  setAdmFilter: (path: string[], id: string | null) => void;
  clearAdmFilter: () => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setPanelOpen: (open: boolean) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial camera: world view
  latitude: 20,
  longitude: 0,
  zoom: 1.5,
  bearing: 0,
  pitch: 0,

  // Time defaults
  period: "single year",
  years: [2024],
  compositing: "p95",

  // Layers
  showAdm: true,
  showSatellite: false,

  // Admin filter
  admPath: [],
  admId: null,

  // UI
  theme: "dark",
  panelOpen: true,

  // Actions
  setViewState: (viewState) => set((state) => ({ ...state, ...viewState })),

  setPeriod: (period) => {
    const state = get();
    if (period === "single year" && state.years.length > 1) {
      set({ period, years: [state.years[state.years.length - 1]] });
    } else {
      set({ period });
    }
  },

  toggleYear: (year) => {
    const state = get();
    if (state.period === "single year") {
      set({ years: [year] });
    } else {
      if (state.years.includes(year)) {
        const newYears = state.years.filter((y) => y !== year);
        set({ years: newYears.length > 0 ? newYears : [year] });
      } else {
        set({ years: [...state.years, year].sort() });
      }
    }
  },

  setYears: (years) => set({ years }),

  setCompositing: (compositing) => set({ compositing }),

  setShowAdm: (showAdm) => set({ showAdm }),

  setShowSatellite: (showSatellite) => set({ showSatellite }),

  setAdmFilter: (admPath, admId) => set({ admPath, admId }),

  clearAdmFilter: () => set({ admPath: [], admId: null }),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

  setPanelOpen: (panelOpen) => set({ panelOpen }),
}));
