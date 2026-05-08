"use client";

import { useEffect } from "react";
import { Topbar } from "@/components/topbar";
import { SidePanel } from "@/components/side-panel";
import { MapContainer } from "@/components/map";
import { useMapStore } from "@/store/map-store";

export default function Home() {
  const { theme } = useMapStore();

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="flex flex-col h-full">
      <Topbar />
      <div className="flex flex-1 min-h-0">
        <SidePanel />
        <MapContainer />
      </div>
    </div>
  );
}
