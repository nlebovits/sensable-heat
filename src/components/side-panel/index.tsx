"use client";

import { useState, useCallback } from "react";
import { Wordmark } from "@/components/wordmark";
import { ChevronDown, ArrowRight } from "@/components/icons";
import { InfoTip } from "@/components/ui/info-tip";
import { LayerRamp } from "@/components/side-panel/layer-ramp";
import { HEAT_RAMP, CANOPY_RAMP, CHM } from "@/lib/config";
import { useMapStore } from "@/store/map-store";

export function SidePanel() {
  const {
    showLst,
    showChm,
    showAdm,
    lstRange,
    admPath,
    showBuildings,
    showSatellite,
    setShowLst,
    setShowChm,
    setShowAdm,
    setShowBuildings,
    setShowSatellite,
  } = useMapStore();

  const lstScope =
    admPath.length > 0 ? admPath[admPath.length - 1] : "viewport";

  const [aboutOpen, setAboutOpen] = useState(true);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

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
            A{" "}
            <a
              href="https://radiant.earth/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              Radiant Earth
            </a>
            {" "}project
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
            A global, high-resolution map of land surface temperature, derived from Landsat 8/9.
          </p>
        </div>

        {/* Layers */}
        <div className="panel-block" role="group" aria-labelledby="layers-label">
          <div className="label" id="layers-label">Layers</div>
          <div className="toggle-row">
            <span id="lst-label">
              <span className="name">
                Land surface temperature
                <InfoTip
                  label="The 95th percentile of every cloud-free Landsat 8 and 9 thermal scene from 2021 through 2025. Each pixel reads as a hot day rather than a typical one."
                  side="right"
                />
              </span>
              <span className="sub">p95 · 2021–25 composite · 30m</span>
            </span>
            <button
              className={`switch ${showLst ? "on" : ""}`}
              role="switch"
              aria-checked={showLst}
              aria-labelledby="lst-label"
              onClick={() => setShowLst(!showLst)}
            />
          </div>
          {showLst && (
            <LayerRamp
              stops={HEAT_RAMP}
              min={lstRange ? `${Math.round(lstRange.minC)}°` : "—"}
              max={lstRange ? `${Math.round(lstRange.maxC)}°` : "—"}
              note={`auto · ${lstScope}`}
              label={
                lstRange
                  ? `Temperature scale from ${Math.round(lstRange.minC)} to ${Math.round(lstRange.maxC)} degrees Celsius, recomputed from the tiles on screen.`
                  : "Temperature scale, loading the range"
              }
            />
          )}
          <div className="toggle-row">
            <span id="chm-label">
              <span className="name">
                Canopy height
                <InfoTip
                  label="Meta DINOv3 canopy height v2, in metres, at 1.19 m. Zero-height ground is transparent, so this draws only where something is growing and the temperature below shows through."
                  side="right"
                />
              </span>
              <span className="sub">Meta CHM v2 · 1.19m</span>
            </span>
            <button
              className={`switch ${showChm ? "on" : ""}`}
              role="switch"
              aria-checked={showChm}
              aria-labelledby="chm-label"
              onClick={() => setShowChm(!showChm)}
            />
          </div>
          {showChm && (
            <LayerRamp
              stops={CANOPY_RAMP}
              min={`${CHM.MIN_METRES}m`}
              max={`${CHM.MAX_METRES}m`}
              label={`Canopy height scale from ${CHM.MIN_METRES} to ${CHM.MAX_METRES} metres. Ground with no canopy is transparent.`}
            />
          )}
          <div className="toggle-row">
            <span id="adm-label">
              <span className="name">
                Admin boundaries
                <InfoTip
                  label="Overture Maps division boundaries, release 2026-08-19.0. Countries, regions, and counties down to zoom 12."
                  side="right"
                />
              </span>
              <span className="sub">Overture Maps · divisions</span>
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
            <span id="bld-label">
              <span className="name">
                Building footprints
                <InfoTip
                  label="Overture Maps building footprints, release 2026-08-19.0. Drawn as white outlines from zoom 11, so the surface temperature still reads through each roof."
                  side="right"
                />
              </span>
              <span className="sub">Overture Maps · buildings · zoom 11+</span>
            </span>
            <button
              className={`switch ${showBuildings ? "on" : ""}`}
              role="switch"
              aria-checked={showBuildings}
              aria-labelledby="bld-label"
              onClick={() => setShowBuildings(!showBuildings)}
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
              from 2021 through 2025 at 30m resolution. It shows the 95th
              percentile, so each pixel reads as a hot day rather than a typical
              one. Coverage spans South America.
            </p>
            <p>
              The colour range is the mean of the tiles on screen, plus or minus
              two standard deviations. It follows the map as you pan.
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

      </div>

      {/* Footer, pinned below the scrolling region */}
      <div className="panel-footer">
        <div className="row">
          <span>Data</span>
          <span>Landsat C2 L2</span>
        </div>
        <div className="row">
          <span>Hosted</span>
          <a
            href="https://source.coop/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            Source Coop
          </a>
        </div>
        <div className="row">
          <span>Build</span>
          <span>v0.1 · 2026-05</span>
        </div>
      </div>
    </aside>
  );
}
