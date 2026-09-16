"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Search as SearchIcon } from "@/components/icons";
import { useMapStore } from "@/store/map-store";
import { useGeocode, type GeocodeSuggestion } from "@/hooks/useGeocode";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

/** Place search, floating over the top-left of the map. */
export function Search() {
  const { admPath, flyTo } = useMapStore();

  const [searchValue, setSearchValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { suggestions, isLoading, clear } = useGeocode(searchValue);

  useGlobalShortcuts({ searchInputRef: inputRef });

  const handleSelect = useCallback(
    (suggestion: GeocodeSuggestion) => {
      flyTo(suggestion.lng, suggestion.lat);
      setSearchValue(suggestion.name);
      setIsDropdownOpen(false);
      clear();
      inputRef.current?.blur();
    },
    [flyTo, clear]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            handleSelect(suggestions[highlightedIndex]);
          }
          break;
        case "Escape":
          setIsDropdownOpen(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [suggestions, highlightedIndex, handleSelect]
  );

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    if (suggestions.length > 0 && searchValue.length >= 2) {
      setIsDropdownOpen(true);
    }
  }, [suggestions, searchValue]);

  return (
    <div className="floating-search">
      <div className="search-input">
        <SearchIcon
          size={16}
          style={{ color: "var(--mute)", flexShrink: 0 }}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          placeholder="City, address, or admin region…"
          aria-label="Search for a place"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsDropdownOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsDropdownOpen(false), 150);
          }}
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          aria-controls="search-suggestions"
          autoComplete="off"
        />
        {isLoading ? (
          <div className="h-4 w-4 border-2 border-[var(--h6-hex)] border-t-transparent animate-spin" />
        ) : (
          <span className="kbd">⌘K</span>
        )}
      </div>

      {isDropdownOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id="search-suggestions"
          role="listbox"
          className="search-suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={index === highlightedIndex ? "active" : ""}
            >
              <span className="name">{suggestion.name}</span>
              <span className="detail">{suggestion.displayName}</span>
            </li>
          ))}
        </ul>
      )}

      {admPath.length > 0 && (
        <div className="breadcrumb">
          {admPath.map((seg, i) => (
            <span key={i}>
              {i > 0 && <span className="sep">›</span>}
              <span className={`seg ${i === admPath.length - 1 ? "active" : ""}`}>
                {seg}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
