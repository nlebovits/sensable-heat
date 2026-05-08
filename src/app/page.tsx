"use client";

import { Suspense, useEffect } from "react";
import { SidePanel } from "@/components/side-panel";
import { MapContainer } from "@/components/map";
import { useMapStore } from "@/store/map-store";
import { useUrlSync } from "@/hooks/useUrlSync";

function UrlSyncProvider({ children }: { children: React.ReactNode }) {
  useUrlSync();
  return <>{children}</>;
}

function AppContent() {
  const { theme } = useMapStore();

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="flex h-full">
      <SidePanel />
      <MapContainer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <UrlSyncProvider>
        <AppContent />
      </UrlSyncProvider>
    </Suspense>
  );
}
