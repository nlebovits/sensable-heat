"use client";

import { Suspense } from "react";
import { SidePanel } from "@/components/side-panel";
import { MapContainer } from "@/components/map";
import { WalkthroughProvider } from "@/components/walkthrough";
import { useUrlSync } from "@/hooks/useUrlSync";

function UrlSyncProvider({ children }: { children: React.ReactNode }) {
  useUrlSync();
  return <>{children}</>;
}

function AppContent() {
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
        <WalkthroughProvider>
          <AppContent />
        </WalkthroughProvider>
      </UrlSyncProvider>
    </Suspense>
  );
}
