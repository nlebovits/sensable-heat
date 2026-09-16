"use client";

import { useState, useCallback } from "react";
import { Wordmark } from "@/components/wordmark";
import { HeatRaster } from "@/components/heat-raster";
import { ArrowRight } from "@/components/icons";
import { InfoTip } from "@/components/ui/info-tip";
import { LayerRamp } from "@/components/side-panel/layer-ramp";
import { HEAT_RAMP, CANOPY_RAMP, CHM } from "@/lib/config";
import { useMapStore } from "@/store/map-store";

function OvertureLink() {
  return (
    <a
      className="sub-link"
      href="https://overturemaps.org/"
      target="_blank"
      rel="noopener noreferrer"
    >
      Overture Maps
    </a>
  );
}

export function SidePanel() {
  const {
    showLst,
    showChm,
    showAdm,
    lstRange,
    showBuildings,
    showSatellite,
    setShowLst,
    setShowChm,
    setShowAdm,
    setShowBuildings,
    setShowSatellite,
  } = useMapStore();

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
        <div className="panel-block panel-header">
          <HeatRaster />
          <div className="mono-label">
            A{" "}
            <a
              href="https://radiant.earth/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Radiant Earth
            </a>{" "}
            project
          </div>
          <Wordmark size={28} />
          <p className="tagline">
            A global map of extreme land surface temperature, derived from
            Landsat 8/9.
          </p>
        </div>

        {/* Layers */}
        <div className="panel-block" role="group" aria-labelledby="layers-label">
          <div className="label" id="layers-label">Layers</div>
          <div className="toggle-row">
            <span id="lst-label">
              <span className="name">
                <InfoTip
                  content={
                    <>
                      The 95th percentile of every cloud-free Landsat 8/9
                      thermal scene from 2021 through 2025. Data via the{" "}
                      <a
                        href="https://www.usgs.gov/landsat-missions/landsat-collection-2-level-2-science-products"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Landsat Collection 2 Level-2 archive
                      </a>{" "}
                      at the{" "}
                      <a
                        href="https://www.usgs.gov/landsat-missions"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        USGS
                      </a>
                      ,{" "}
                      <a
                        href="https://creativecommons.org/publicdomain/zero/1.0/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        CC0-1.0
                      </a>
                      ,{" "}
                      <a
                        href="https://github.com/nlebovits/landsat-lst-smoke"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        processed by Nissim Lebovits
                      </a>
                      .
                    </>
                  }
                >
                  Land surface temperature
                </InfoTip>
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
                <InfoTip
                  content={
                    <>
                      <a
                        href="https://arxiv.org/abs/2603.06382"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Meta DINOv3 canopy height v2
                      </a>
                      , in meters.{" "}
                      <a
                        href="https://creativecommons.org/licenses/by/4.0/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        CC-BY-4.0
                      </a>{" "}
                      via{" "}
                      <a
                        href="https://source.coop/tge-labs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Taylor Geospatial Engine
                      </a>{" "}
                      on{" "}
                      <a
                        href="https://source.coop/tge-labs/meta-chm-v2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source Cooperative
                      </a>
                      .
                    </>
                  }
                >
                  Tree canopy height
                </InfoTip>
              </span>
              <span className="sub">
                <a
                  className="sub-link"
                  href="https://source.coop/tge-labs/meta-chm-v2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Meta CHM v2
                </a>
                {" · 1.19m"}
              </span>
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
              label={`Tree canopy height scale from ${CHM.MIN_METRES} to ${CHM.MAX_METRES} metres. Ground with no canopy is transparent.`}
            />
          )}
          <div className="toggle-row">
            <span id="adm-label">
              <span className="name">Admin boundaries</span>
              <span className="sub">
                <OvertureLink />
              </span>
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
              <span className="name">Building footprints</span>
              <span className="sub">
                <OvertureLink />
              </span>
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
              <span className="sub">Esri</span>
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
