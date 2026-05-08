"use client";

import { useEffect, type RefObject } from "react";

interface UseGlobalShortcutsOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function useGlobalShortcuts({ searchInputRef }: UseGlobalShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ⌘K (Mac) or Ctrl+K (Windows/Linux) - focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchInputRef]);
}
