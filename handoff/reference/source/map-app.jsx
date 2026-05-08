// Variant B (globe-first) + app shell with variant switcher + tweaks panel.

const { useState: useS, useEffect, useRef, useMemo: useM, useReducer } = React;

// ============== Variant B: globe-first ==============
function VariantB({ panelPos, state, dispatch }) {
  const [drawerOpen, setDrawerOpen] = useS(false);
  const [activeRail, setActiveRail] = useS(null);
  const rotLon = 12;
  const R = 310;

  // Project all cities onto the globe; only render those visible.
  const visible = useM(() => {
    return CITIES.map(([name, lat, lon, intensity], i) => {
      const p = projOrtho(lat, lon, rotLon, R);
      return { name, lat, lon, intensity, x: p.x, y: p.y, visible: p.visible, i };
    }).filter((c) => c.visible);
  }, [rotLon]);

  return (
    <div className="main" style={{ display: 'block', position: 'relative' }}>
      <div className="globe-stage">
        <div className="globe">
          <GlobeLand rotLon={rotLon} R={R} />
          {/* Heat dots inside globe — coords are relative to globe center */}
          <div style={{ position: 'absolute', inset: 0 }}>
            {visible.map((c) => (
              <HeatDot
                key={c.i}
                x={`calc(50% + ${c.x}px)`}
                y={`calc(50% + ${c.y}px)`}
                intensity={c.intensity}
                scale={0.8}
              />
            ))}
            {visible.filter((c) => c.intensity >= 7).map((c) => (
              <div
                key={'lbl' + c.i}
                className="citylabel"
                style={{
                  left: `calc(50% + ${c.x}px)`,
                  top: `calc(50% + ${c.y}px)`,
                  transform: `translate(${c.x > 0 ? 12 : -12}px, -10px)`,
                  textAlign: c.x > 0 ? 'left' : 'right',
                  ...(c.x < 0 ? { translate: '-100% 0' } : {}),
                }}
              >
                <span className="pin"></span>{c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero text floating top-left */}
      <div style={{ position: 'absolute', top: 36, left: 36, maxWidth: 420 }}>
        <Wordmark size={28} />
        <p className="b-hero-lede" style={{ marginTop: 22 }}>
          Where heat reaches the ground. A global, high-resolution measurement of land surface temperature, made plain enough to plan against.
        </p>
        <div className="b-snapnote glass" style={{ marginTop: 22, display: 'inline-flex' }}>
          <span className="pulse"></span>
          <span>Click anywhere to drop into a country view</span>
        </div>
      </div>

      {/* Search top-center */}
      <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', width: 420 }}>
        <div className="search glass">
          {I.search}
          <input placeholder="Search any city, address, or admin region…" />
          <span className="kbd">⌘K</span>
        </div>
      </div>

      {/* Right rail */}
      <div className="b-rail" style={{ position: 'absolute', top: 32, right: 32 }}>
        {[
          { id: 'time', icon: I.time, label: 'Time' },
          { id: 'layers', icon: I.layers, label: 'Layers' },
          { id: 'filter', icon: I.filter, label: 'Filter' },
          { id: 'info', icon: I.info, label: 'About' },
        ].map((r) => (
          <button
            key={r.id}
            className={`iconbtn ${activeRail === r.id ? 'active' : ''}`}
            title={r.label}
            onClick={() => { setActiveRail(activeRail === r.id ? null : r.id); setDrawerOpen(true); }}
          >{r.icon}</button>
        ))}
      </div>

      {/* Bottom legend strip */}
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', width: 480 }}>
        <div className="floating-legend glass">
          <div className="head">
            <span>LAND SURFACE TEMPERATURE · °C</span>
            <span className="auto">AUTO · GLOBAL</span>
          </div>
          <div className="legend-bar">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div className="legend-axis">
            <span>22°</span><span>30°</span><span>38°</span><span>46°</span><span>54°</span>
          </div>
          <div className="legend-meta">
            <span>p95 · 2024</span>
            <span>Composite of 1,247 Landsat scenes</span>
          </div>
        </div>
      </div>

      {/* Bottom-left attribution */}
      <div style={{ position: 'absolute', bottom: 32, left: 36 }}>
        <div className="attribution">© LANDSAT C2 · HOSTED ON SOURCE COOP</div>
      </div>

      {/* Bottom-right country teaser */}
      <div style={{ position: 'absolute', bottom: 32, right: 36, maxWidth: 280 }}>
        <div className="glass" style={{ padding: '14px 16px' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 8 }}>HOTTEST · p95 · 2024</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
            {[
              ['Jacobabad, PK', '52.4°'],
              ['Mecca, SA', '51.8°'],
              ['Kuwait City, KW', '50.9°'],
              ['Phoenix, US', '49.1°'],
              ['Delhi, IN', '48.7°'],
            ].map(([city, t]) => (
              <div key={city} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--mute-2)' }}>{city}</span>
                <span style={{ color: 'var(--fg)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer (when activeRail) */}
      {activeRail && drawerOpen && (
        <div
          className="glass"
          style={{
            position: 'absolute', top: 90, right: 80,
            width: 360, padding: '20px 22px', zIndex: 40,
          }}
        >
          {activeRail === 'time' && (
            <>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 14 }}>TIME</div>
              <div className="seg-group" style={{ marginBottom: 12 }}>
                {['single year', 'multi-year', 'rolling avg'].map((p) => (
                  <button key={p} className={state.period === p ? 'active' : ''} onClick={() => dispatch({ period: p })}>{p}</button>
                ))}
              </div>
              <div className="year-grid">
                {[2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                  <button
                    key={y}
                    className={state.years.includes(y) ? 'active' : ''}
                    onClick={() => dispatch({ toggleYear: y })}
                  >{y}</button>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 8 }}>Compositing</div>
                <div className="chip-row">
                  {['p99', 'p95', 'mean', 'max'].map((c) => (
                    <button
                      key={c}
                      className={`chip ${state.compositing.startsWith(c) ? 'active' : ''}`}
                      onClick={() => dispatch({ compositing: c + ' — ' + (c === 'p99' ? 'extreme days' : c === 'p95' ? 'hot days' : c === 'mean' ? 'typical' : 'single peak') })}
                    >{c}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          {activeRail === 'layers' && (
            <>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 14 }}>LAYERS</div>
              <div className="toggle-row">
                <span><span className="name">Land surface temperature</span><span className="sub">Landsat 8/9 · 30m</span></span>
                <span className="switch on"></span>
              </div>
              <div className="toggle-row">
                <span><span className="name">Admin boundaries</span><span className="sub">GADM</span></span>
                <span className={`switch ${state.adm ? 'on' : ''}`} onClick={() => dispatch({ adm: !state.adm })}></span>
              </div>
              <div className="toggle-row">
                <span><span className="name">Satellite</span><span className="sub">Sentinel-2</span></span>
                <span className={`switch ${state.satellite ? 'on' : ''}`} onClick={() => dispatch({ satellite: !state.satellite })}></span>
              </div>
            </>
          )}
          {activeRail === 'info' && (
            <>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 14 }}>ABOUT</div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--mute-2)', margin: '0 0 12px' }}>
                Land surface temperature is the temperature of the ground itself — pavement, rooftops, soil — not the air above it.
              </p>
              <a className="resource" href="https://coolcities.wri.org/" target="_blank">
                <div>
                  <div className="name">Cool Cities Challenge</div>
                  <div className="source">WRI</div>
                </div>
                <span className="arrow">{I.arrow}</span>
              </a>
              <a className="resource" href="https://www.wri.org/insights/beyond-thermometer-measuring-heat" target="_blank">
                <div>
                  <div className="name">Beyond the thermometer</div>
                  <div className="source">WRI Insights</div>
                </div>
                <span className="arrow">{I.arrow}</span>
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============== App shell ==============

function reducer(state, patch) {
  if (patch.toggleYear) {
    const y = patch.toggleYear;
    if (state.period === 'single year') return { ...state, years: [y] };
    if (state.years.includes(y)) {
      return { ...state, years: state.years.filter((x) => x !== y) };
    }
    return { ...state, years: [...state.years, y].sort() };
  }
  return { ...state, ...patch };
}

function App() {
  const [variant, setVariant] = useS('A');
  const [theme, setTheme] = useS('dark');

  const [state, dispatch] = useReducer(reducer, {
    period: 'single year',
    years: [2024],
    compositing: 'p95 — hot days',
    base: 'plain',
    adm: true,
    satellite: false,
    admPath: ['Pakistan', 'Sindh', 'Karachi District'],
  });

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div className="app">
      <div className="topbar">
        <div className="left">
          <Wordmark size={14} />
          <span className="topbar-meta">v0.1 · prototype</span>
        </div>

        <div className="center">
          <div className="variant-tabs">
            <button className={variant === 'A' ? 'active' : ''} onClick={() => setVariant('A')}>A · Sidebar</button>
            <button className={variant === 'B' ? 'active' : ''} onClick={() => setVariant('B')}>B · Globe</button>
          </div>
        </div>

        <div className="right">
          <button
            className="iconbtn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? I.sun : I.moon}
          </button>
        </div>
      </div>

      {variant === 'A' ? (
        <VariantA panelPos="left" theme={theme} setTheme={setTheme} state={state} dispatch={dispatch} />
      ) : (
        <VariantB state={state} dispatch={dispatch} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
