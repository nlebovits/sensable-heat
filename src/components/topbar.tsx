"use client";

import { Wordmark } from "@/components/wordmark";
import { Sun, Moon } from "@/components/icons";
import { useMapStore } from "@/store/map-store";

export function Topbar() {
  const { theme, toggleTheme } = useMapStore();

  return (
    <div className="topbar">
      <div className="flex items-center">
        <Wordmark size={14} />
        <span className="topbar-meta">v0.1 · prototype</span>
      </div>

      <button
        className="iconbtn"
        onClick={toggleTheme}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
