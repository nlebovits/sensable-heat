"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Wordmark } from "@/components/wordmark";
import { Search, ChevronDown, ArrowRight, Info } from "@/components/icons";
import { useMapStore, type Period, type Compositing } from "@/store/map-store";
import { useGeocode, type GeocodeSuggestion } from "@/hooks/useGeocode";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

const PERIODS: Period[] = ["single year", "multi-year", "rolling avg"];
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
const COMPOSITING_OPTIONS: { value: Compositing; label: string }[] = [
  { value: "p99", label: "p99 — extreme days" },
  { value: "p95", label: "p95 — hot days" },
  { value: "mean", label: "mean — typical" },
  { value: "max", label: "max — single peak" },
];

export function SidePanel() {
  const {
    period,
    years,
    compositing,
    showAdm,
    showSatellite,
    admPath,
    setPeriod,
    toggleYear,
    setCompositing,
    setShowAdm,
    setShowSatellite,
    flyTo,
  } = useMapStore();

  const [searchValue, setSearchValue] = useState("");
  const [aboutOpen, setAboutOpen] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
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

  const isYearInRange = (year: number) => {
    if (period !== "multi-year" || years.length < 2) return false;
    const min = Math.min(...years);
    const max = Math.max(...years);
    return year > min && year < max && !years.includes(year);
  };

  const toggleMobilePanel = useCallback(() => {
    setIsMobileExpanded((prev) => !prev);
  }, []);

  const panelClassName = ["panel", "left", isMobileExpanded && "expanded"]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={panelClassName}>
      <div
        className="panel-drag-handle"
        onClick={toggleMobilePanel}
        role="button"
        aria-label="Toggle panel"
        aria-expanded={isMobileExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleMobilePanel();
          }
        }}
      ></div>
      <div className="panel-inner">
        {/* Header */}
        <div className="panel-block" style={{ borderBottom: "none", paddingBottom: 8 }}>
          <div className="mono-label" style={{ marginBottom: 12 }}>
            A Radiant Earth project
          </div>
          <Wordmark size={20} />
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--mute-2)",
              lineHeight: 1.5,
              marginTop: 14,
            }}
          >
            Where heat reaches the ground. A global, high-resolution measurement
            of land surface temperature, made plain enough to plan against.
          </p>
        </div>

        {/* Where */}
        <div className="panel-block">
          <div className="label">Where</div>
          <div className="relative">
            <div className="search-input">
              <Search size={16} style={{ color: "var(--mute)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                placeholder="City, address, or admin region…"
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
                <div className="h-4 w-4 border-2 border-[var(--h6-hex)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="kbd">⌘K</span>
              )}
            </div>

            {isDropdownOpen && suggestions.length > 0 && (
              <ul
                ref={listRef}
                id="search-suggestions"
                role="listbox"
                className="absolute z-50 w-full mt-1 bg-[var(--surface)] border border-[var(--line)] rounded max-h-60 overflow-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    onClick={() => handleSelect(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                      index === highlightedIndex
                        ? "bg-[var(--surface-2)] text-[var(--fg)]"
                        : "text-[var(--mute-2)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <div className="font-medium truncate text-[var(--fg)]">
                      {suggestion.name}
                    </div>
                    <div className="text-xs text-[var(--mute)] truncate">
                      {suggestion.displayName}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {admPath.length > 0 && (
            <div className="breadcrumb" style={{ marginTop: 12 }}>
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

        {/* When */}
        <div className="panel-block">
          <div className="label">
            <span>When</span>
            <Info size={14} style={{ color: "var(--mute)", cursor: "help" }} />
          </div>
          <div className="seg-group" style={{ marginBottom: 10 }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                className={period === p ? "active" : ""}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="year-grid">
            {YEARS.map((y) => (
              <button
                key={y}
                className={
                  years.includes(y) ? "active" : isYearInRange(y) ? "in-range" : ""
                }
                onClick={() => toggleYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="label" style={{ marginBottom: 8 }}>
              Compositing
            </div>
            <div className="chip-row">
              {COMPOSITING_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  className={`chip ${compositing === c.value ? "active" : ""}`}
                  onClick={() => setCompositing(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Layers */}
        <div className="panel-block" role="group" aria-labelledby="layers-label">
          <div className="label" id="layers-label">Layers</div>
          <div className="toggle-row">
            <span id="lst-label">
              <span className="name">Land surface temperature</span>
              <span className="sub">Landsat 8/9 · 30m</span>
            </span>
            <button
              className="switch on"
              role="switch"
              aria-checked="true"
              aria-labelledby="lst-label"
              disabled
            />
          </div>
          <div className="toggle-row">
            <span id="adm-label">
              <span className="name">Admin boundaries</span>
              <span className="sub">Overture Maps divisions</span>
            </span>
            <button
              className={`switch ${showAdm ? "on" : ""}`}
              role="switch"
              aria-checked={showAdm}
              aria-labelledby="adm-label"
              onClick={() => setShowAdm(!showAdm)}
            />
          </div>
          <div className="toggle-row">
            <span id="sat-label">
              <span className="name">Satellite imagery</span>
              <span className="sub">Esri · cloud-free</span>
            </span>
            <button
              className={`switch ${showSatellite ? "on" : ""}`}
              role="switch"
              aria-checked={showSatellite}
              aria-labelledby="sat-label"
              onClick={() => setShowSatellite(!showSatellite)}
            />
          </div>
        </div>

        {/* About */}
        <details className="disclose" open={aboutOpen} onToggle={(e) => setAboutOpen(e.currentTarget.open)}>
          <summary>
            About this measurement
            <ChevronDown size={16} />
          </summary>
          <div className="body">
            <p>
              Land surface temperature (LST) is the temperature of the ground
              itself — pavement, rooftops, soil — not the air above it. It
              reaches the body through radiation, contact, and the absence of
              shade.
            </p>
            <p>
              This map composites every cloud-free Landsat 8 and 9 thermal scene
              over the years and percentile you choose, at 30m resolution. p95
              isolates hot days; p99 isolates extremes.
            </p>
          </div>
        </details>

        {/* Resources */}
        <div className="panel-block">
          <div className="label">Resources</div>
          <a
            className="resource"
            href="https://coolcities.wri.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div>
              <div className="name">Cool Cities Challenge</div>
              <div className="source">World Resources Institute</div>
            </div>
            <span className="arrow">
              <ArrowRight size={16} />
            </span>
          </a>
          <a
            className="resource"
            href="https://www.wri.org/insights/beyond-thermometer-measuring-heat"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div>
              <div className="name">Beyond the thermometer: measuring heat</div>
              <div className="source">WRI Insights</div>
            </div>
            <span className="arrow">
              <ArrowRight size={16} />
            </span>
          </a>
        </div>

        {/* Footer */}
        <div className="panel-footer">
          <div className="row">
            <span>Data</span>
            <span>Landsat C2 L2</span>
          </div>
          <div className="row">
            <span>Hosted</span>
            <span>Source Coop</span>
          </div>
          <div className="row">
            <span>Build</span>
            <span>v0.1 · 2026-05</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
