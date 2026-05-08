// Variant A — Open Climate Risk lineage. Persistent side panel + flat map.
// Plus shared SidePanel used by Variant B's drawer.

const { useState, useMemo } = React;

// ============== Wordmark ==============
function Wordmark({ size = 16 }) {
  const w = `${size * 0.62}em`; // not used
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <span className="sens-target">
        sens
        <span className="vf-corner tl"></span>
        <span className="vf-corner tr"></span>
        <span className="vf-corner bl"></span>
        <span className="vf-corner br"></span>
      </span>
      able heat
    </span>
  );
}

// ============== Icons (inline SVG) ==============
const I = {
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14"/></svg>,
  sun: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="2.7" y1="2.7" x2="4.1" y2="4.1"/><line x1="11.9" y1="11.9" x2="13.3" y2="13.3"/><line x1="2.7" y1="13.3" x2="4.1" y2="11.9"/><line x1="11.9" y1="4.1" x2="13.3" y2="2.7"/></svg>,
  moon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M13 9.5A6 6 0 1 1 6.5 3a5 5 0 0 0 6.5 6.5z"/></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>,
  minus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="3" y1="8" x2="13" y2="8"/></svg>,
  locate: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/></svg>,
  layers: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><path d="M8 2 L14 5 L8 8 L2 5 Z"/><path d="M2 8 L8 11 L14 8"/><path d="M2 11 L8 14 L14 11"/></svg>,
  info: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="6"/><line x1="8" y1="7.5" x2="8" y2="11.5"/><circle cx="8" cy="5" r="0.5" fill="currentColor"/></svg>,
  chev: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><polyline points="4 6 8 10 12 6"/></svg>,
  arrow: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="3" y1="8" x2="13" y2="8"/><polyline points="9 4 13 8 9 12"/></svg>,
  time: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="6"/><polyline points="8 4 8 8 11 10"/></svg>,
  filter: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 3h12l-4.5 6v4l-3 1.5v-5.5z"/></svg>,
  pin: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5 0 3 4.5 8 4.5 8s4.5-5 4.5-8c0-2.5-2-4.5-4.5-4.5z"/><circle cx="8" cy="6" r="1.5"/></svg>,
};

// ============== Side panel (shared) ==============
function SidePanel({ position, state, dispatch }) {
  const {
    period, years, compositing,
    base, adm, satellite, admPath,
  } = state;
  const isBottom = position === 'bottom';
  return (
    <aside className={`panel ${position}`}>
      <div className="panel-inner">
        {!isBottom && (
          <div className="panel-head">
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 12 }}>
              A Radiant Earth project
            </div>
            <Wordmark size={20} />
            <p className="panel-lede">
              Where heat reaches the ground. A global, high-resolution measurement of land surface temperature, made plain enough to plan against.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="panel-block">
          <div className="label">Where</div>
          <div className="search">
            {I.search}
            <input placeholder="City, address, or admin region…" defaultValue="Karachi, Sindh, Pakistan" />
            <span className="kbd">⌘K</span>
          </div>
          <div className="breadcrumb" style={{ marginTop: 12 }}>
            <span className="seg">Pakistan</span>
            <span className="sep">›</span>
            <span className="seg">Sindh</span>
            <span className="sep">›</span>
            <span className="seg active">Karachi District</span>
          </div>
        </div>

        {/* When */}
        <div className="panel-block">
          <div className="label">
            <span>When</span>
            <span className="info">i</span>
          </div>
          <div className="seg-group" style={{ marginBottom: 10 }}>
            {['single year', 'multi-year', 'rolling avg'].map((p) => (
              <button
                key={p}
                className={period === p ? 'active' : ''}
                onClick={() => dispatch({ period: p })}
              >{p}</button>
            ))}
          </div>
          <div className="year-grid">
            {[2020, 2021, 2022, 2023, 2024, 2025].map((y) => {
              const active = years.includes(y);
              const inRange = period === 'multi-year' && y >= Math.min(...years) && y <= Math.max(...years) && !active;
              return (
                <button
                  key={y}
                  className={active ? 'active' : (inRange ? 'in-range' : '')}
                  onClick={() => dispatch({ toggleYear: y })}
                >{y}</button>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="label" style={{ marginBottom: 8 }}>Compositing</div>
            <div className="chip-row">
              {['p99 — extreme days', 'p95 — hot days', 'mean — typical', 'max — single peak'].map((c) => (
                <button
                  key={c}
                  className={`chip ${compositing === c ? 'active' : ''}`}
                  onClick={() => dispatch({ compositing: c })}
                >{c}</button>
              ))}
            </div>
          </div>
        </div>

        {/* What */}
        <div className="panel-block">
          <div className="label">Layers</div>
          <div className="toggle-row">
            <span><span className="name">Land surface temperature</span><span className="sub">Landsat 8/9 · 30m</span></span>
            <span className="switch on" onClick={() => {}}></span>
          </div>
          <div className="toggle-row">
            <span><span className="name">Admin boundaries</span><span className="sub">GADM · adm0 → adm3</span></span>
            <span className={`switch ${adm ? 'on' : ''}`} onClick={() => dispatch({ adm: !adm })}></span>
          </div>
          <div className="toggle-row">
            <span><span className="name">Satellite imagery</span><span className="sub">Sentinel-2 · cloud-free</span></span>
            <span className={`switch ${satellite ? 'on' : ''}`} onClick={() => dispatch({ satellite: !satellite })}></span>
          </div>
        </div>

        {!isBottom && (
          <>
            <details className="disclose" open>
              <summary>About this measurement {I.chev}</summary>
              <div className="body">
                <p>Land surface temperature (LST) is the temperature of the ground itself — pavement, rooftops, soil — not the air above it. It reaches the body through radiation, contact, and the absence of shade.</p>
                <p>This map composites every cloud-free Landsat 8 and 9 thermal scene over the years and percentile you choose, at 30m resolution. p95 isolates hot days; p99 isolates extremes.</p>
              </div>
            </details>

            <div className="panel-block">
              <div className="label">Resources</div>
              <a className="resource" href="https://coolcities.wri.org/" target="_blank">
                <div>
                  <div className="name">Cool Cities Challenge</div>
                  <div className="source">World Resources Institute</div>
                </div>
                <span className="arrow">{I.arrow}</span>
              </a>
              <a className="resource" href="https://www.wri.org/insights/beyond-thermometer-measuring-heat" target="_blank">
                <div>
                  <div className="name">Beyond the thermometer: measuring heat</div>
                  <div className="source">WRI Insights</div>
                </div>
                <span className="arrow">{I.arrow}</span>
              </a>
            </div>

            <div className="panel-footer">
              <div className="row"><span>Data</span><span>Landsat C2 L2</span></div>
              <div className="row"><span>Hosted</span><span>Source Coop</span></div>
              <div className="row"><span>Build</span><span>v0.1 · 2026-05</span></div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// ============== Variant A: flat map + persistent panel ==============
function VariantA({ panelPos, theme, setTheme, state, dispatch }) {
  // Render heat dots and labels using equirectangular projection
  const heatNodes = useMemo(() => {
    return CITIES.map(([name, lat, lon, intensity], i) => {
      const { x, y } = projEq(lat, lon);
      // Convert 1920x960 viewBox to percentage for absolute positioning
      const px = (x / 1920) * 100;
      const py = (y / 960) * 100;
      return { name, intensity, px, py, i };
    });
  }, []);

  // Show labels for top-intensity cities only
  const labelCities = heatNodes.filter((n) => n.intensity >= 7);

  return (
    <div className="main">
      {panelPos !== 'bottom' && <SidePanel position={panelPos} state={state} dispatch={dispatch} />}

      <div className="map-area">
        <div className="world">
          <ContinentLayer />
          <Graticule kind="eq" />

          <div className="heatfield">
            {heatNodes.map((n) => (
              <HeatDot
                key={n.i}
                x={`${n.px}%`}
                y={`${n.py}%`}
                intensity={n.intensity}
                scale={1.4}
              />
            ))}
            {labelCities.map((n) => (
              <div
                key={'lbl' + n.i}
                className="citylabel"
                style={{ left: `${n.px}%`, top: `${n.py}%`, transform: 'translate(8px, -22px)' }}
              >
                <span className="pin"></span>{n.name}
              </div>
            ))}
          </div>
        </div>

        {/* Floating chrome */}
        <div className="map-chrome bl">
          <div className="floating-legend">
            <div className="head">
              <span>LAND SURFACE TEMPERATURE · °C</span>
              <span className="auto">AUTO · VIEWPORT</span>
            </div>
            <div className="legend-bar">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className="legend-axis">
              <span>28°</span><span>34°</span><span>40°</span><span>46°</span><span>52°</span>
            </div>
            <div className="legend-meta">
              <span>{state.compositing.split('—')[0].trim()} · {state.years.join(', ')}</span>
              <span>°C surface</span>
            </div>
          </div>
        </div>

        <div className="map-chrome tr">
          <div className="zoom-stack">
            <button>{I.plus}</button>
            <button>{I.minus}</button>
            <button>{I.locate}</button>
          </div>
        </div>

        <div className="map-chrome br">
          <div className="attribution">© LANDSAT C2 · USGS · 2026</div>
        </div>

        {panelPos === 'bottom' && (
          <div className="hint">
            <span className="h">Karachi District</span> · 13.4M people · p95 reaches <span className="h">48.2 °C</span>
          </div>
        )}
      </div>

      {panelPos === 'bottom' && <SidePanel position="bottom" state={state} dispatch={dispatch} />}
    </div>
  );
}

// expose
Object.assign(window, { VariantA, SidePanel, Wordmark, I });
