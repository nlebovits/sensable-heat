// Shared data + helpers for both variants

const CITIES = [
  // [name, lat, lon, intensity 0-8]
  ['Phoenix', 33.4, -112.0, 8],
  ['Las Vegas', 36.2, -115.1, 7],
  ['Houston', 29.7, -95.3, 7],
  ['Los Angeles', 34.0, -118.2, 7],
  ['Mexico City', 19.4, -99.1, 6],
  ['Miami', 25.7, -80.2, 6],
  ['New York', 40.7, -74.0, 5],
  ['Chicago', 41.8, -87.6, 4],
  ['São Paulo', -23.5, -46.6, 6],
  ['Rio de Janeiro', -22.9, -43.2, 7],
  ['Buenos Aires', -34.6, -58.4, 5],
  ['Lima', -12.0, -77.0, 5],
  ['Caracas', 10.5, -66.9, 7],
  ['Madrid', 40.4, -3.7, 6],
  ['Lisbon', 38.7, -9.1, 5],
  ['London', 51.5, -0.1, 3],
  ['Paris', 48.9, 2.3, 4],
  ['Berlin', 52.5, 13.4, 4],
  ['Rome', 41.9, 12.5, 6],
  ['Athens', 37.9, 23.7, 8],
  ['Casablanca', 33.6, -7.6, 6],
  ['Tunis', 36.8, 10.2, 7],
  ['Cairo', 30.0, 31.2, 8],
  ['Lagos', 6.5, 3.4, 7],
  ['Nairobi', -1.3, 36.8, 6],
  ['Johannesburg', -26.2, 28.0, 5],
  ['Riyadh', 24.7, 46.7, 8],
  ['Dubai', 25.0, 55.3, 8],
  ['Tehran', 35.7, 51.4, 7],
  ['Karachi', 24.9, 67.0, 8],
  ['Mumbai', 19.0, 72.8, 7],
  ['Delhi', 28.6, 77.2, 8],
  ['Kolkata', 22.6, 88.4, 7],
  ['Dhaka', 23.8, 90.4, 8],
  ['Bangkok', 13.7, 100.5, 7],
  ['Jakarta', -6.2, 106.8, 7],
  ['Singapore', 1.3, 103.8, 6],
  ['Manila', 14.6, 121.0, 7],
  ['Hong Kong', 22.3, 114.2, 6],
  ['Shanghai', 31.2, 121.5, 6],
  ['Beijing', 39.9, 116.4, 5],
  ['Tokyo', 35.7, 139.7, 5],
  ['Seoul', 37.6, 127.0, 5],
  ['Sydney', -33.9, 151.2, 5],
  ['Perth', -32.0, 115.9, 6],
];

// Equirectangular projection — 1920x960 viewBox
function projEq(lat, lon) {
  return {
    x: (lon + 180) * (1920 / 360),
    y: (90 - lat) * (960 / 180),
  };
}

// Orthographic projection for globe.
// rotLon = longitude facing viewer; R = globe radius in px;
// returns { x, y, visible } in globe-local coords (center=0,0)
function projOrtho(lat, lon, rotLon = 10, R = 310) {
  const phi = (lat * Math.PI) / 180;
  const lam = ((lon - rotLon) * Math.PI) / 180;
  const cosc = Math.cos(phi) * Math.cos(lam);
  return {
    x: R * Math.cos(phi) * Math.sin(lam),
    y: -R * Math.sin(phi),
    visible: cosc > 0.05,
  };
}

// 9-step heat ramp
const RAMP = [
  'oklch(0.18 0.04 25)',
  'oklch(0.26 0.07 25)',
  'oklch(0.34 0.10 27)',
  'oklch(0.42 0.12 28)',
  'oklch(0.50 0.14 30)',
  'oklch(0.58 0.16 32)',
  'oklch(0.66 0.17 34)',
  'oklch(0.74 0.16 36)',
  'oklch(0.82 0.14 40)',
];

// HeatDot component — draws a glow at given position with intensity
function HeatDot({ x, y, intensity, scale = 1 }) {
  const radius = (12 + intensity * 5) * scale;
  const color = RAMP[intensity];
  const inner = RAMP[Math.min(8, intensity + 1)];
  return (
    <div
      className="heatdot"
      style={{
        left: x,
        top: y,
        width: radius * 2,
        height: radius * 2,
        background: `radial-gradient(circle, ${inner} 0%, ${color} 35%, transparent 70%)`,
      }}
    />
  );
}

// CityLabel — small mono label with pin
function CityLabel({ x, y, name, dx = 10, dy = 0, align = 'left' }) {
  const transform = align === 'right'
    ? `translate(calc(-100% + ${-dx}px), ${dy - 8}px)`
    : `translate(${dx}px, ${dy - 8}px)`;
  return (
    <div
      className="citylabel"
      style={{
        left: x,
        top: y,
        transform: `translate(0, 0) ${align === 'right' ? '' : ''}`,
      }}
    >
      <span style={{ display: 'inline-block', transform }}>
        <span className="pin"></span>{name}
      </span>
    </div>
  );
}

// Lat/lon graticule for equirectangular
function Graticule({ kind = 'eq' }) {
  if (kind !== 'eq') return null;
  const lats = [-60, -30, 0, 30, 60];
  const lons = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  return (
    <svg
      className="basemap"
      viewBox="0 0 1920 960"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <g stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.18">
        {lats.map((lat) => {
          const y = (90 - lat) * (960 / 180);
          return <line key={'lat' + lat} x1="0" x2="1920" y1={y} y2={y} strokeDasharray={lat === 0 ? 'none' : '2 4'} />;
        })}
        {lons.map((lon) => {
          const x = (lon + 180) * (1920 / 360);
          return <line key={'lon' + lon} x1={x} x2={x} y1="0" y2="960" strokeDasharray="2 4" />;
        })}
      </g>
      {/* Tropics shading */}
      <g fill="currentColor" opacity="0.04">
        <rect x="0" y={(90 - 23.5) * (960 / 180)} width="1920" height={47 * (960 / 180)} />
      </g>
    </svg>
  );
}

// Major continent outlines — heavily simplified blob paths in equirectangular
// Coordinates approximate at viewBox 1920x960
const CONTINENT_PATHS = [
  // North America
  'M 80 200 Q 70 160 120 150 L 240 130 Q 320 130 380 150 L 460 150 L 540 200 Q 600 220 640 240 L 660 280 L 600 310 Q 560 320 520 320 L 480 330 L 460 360 L 440 400 L 420 430 L 380 450 L 340 460 Q 280 450 250 420 L 220 380 Q 200 350 180 310 L 140 270 Q 100 240 80 200 Z',
  // Greenland
  'M 740 110 Q 730 90 770 90 L 830 100 Q 870 110 870 140 L 850 180 Q 820 200 790 195 Q 760 180 745 150 Z',
  // South America
  'M 470 510 Q 480 480 530 480 L 580 480 Q 640 510 670 560 L 680 620 Q 660 700 620 760 L 580 800 Q 540 810 510 790 L 480 740 Q 460 680 460 620 Q 460 560 470 510 Z',
  // Africa
  'M 980 380 L 1100 360 Q 1180 380 1200 420 L 1230 470 Q 1230 540 1190 600 L 1140 680 Q 1100 720 1060 720 L 1010 700 Q 970 650 970 600 Q 960 540 970 480 L 980 420 Z',
  // Europe
  'M 920 220 L 1010 210 Q 1080 220 1100 250 L 1090 290 Q 1060 320 1010 320 L 970 320 Q 930 310 920 280 Z',
  // Middle East
  'M 1100 290 Q 1140 290 1180 310 L 1230 340 Q 1240 380 1220 410 L 1180 410 Q 1140 400 1110 370 Q 1090 340 1100 290 Z',
  // Asia main
  'M 1100 180 L 1300 170 Q 1480 180 1620 220 L 1700 260 Q 1720 300 1700 340 L 1640 360 Q 1580 360 1540 340 L 1480 340 Q 1420 350 1380 360 L 1320 360 Q 1280 350 1260 320 L 1240 300 Q 1200 280 1170 270 L 1130 260 Q 1090 240 1090 220 Z',
  // India subcontinent
  'M 1320 360 L 1410 370 Q 1450 410 1450 460 L 1430 500 Q 1400 510 1380 490 L 1360 460 Q 1340 420 1320 360 Z',
  // SE Asia / Indochina
  'M 1490 360 L 1560 370 Q 1580 410 1570 450 L 1540 470 Q 1510 460 1500 430 L 1490 400 Z',
  // Indonesia / Philippines (cluster)
  'M 1530 510 L 1590 510 L 1640 520 L 1640 540 L 1590 540 L 1530 530 Z',
  'M 1670 480 L 1700 480 L 1700 510 L 1670 510 Z',
  // Australia
  'M 1620 600 L 1740 600 Q 1780 620 1770 660 L 1730 690 Q 1670 700 1630 680 Q 1600 650 1620 600 Z',
  // Antarctica strip
  'M 0 880 L 1920 880 L 1920 960 L 0 960 Z',
];

function ContinentLayer() {
  return (
    <svg
      className="basemap"
      viewBox="0 0 1920 960"
      preserveAspectRatio="none"
    >
      <g className="land">
        {CONTINENT_PATHS.map((d, i) => <path key={i} d={d} className="land" />)}
      </g>
    </svg>
  );
}

// Globe land paths — same continents but projected orthographically.
// We'll render using outline polygons sampled along continent paths.
// Simpler approach: render the continent paths from CONTINENT_PATHS but
// reproject each x,y back to lat/lon and then orthographically.
// We project each path's points and skip those not visible.

function reprojectToOrtho(d, rotLon, R) {
  // parse SVG path commands manually — only M/L/Q used
  const tokens = d.match(/[MLQZ]|-?\d+(?:\.\d+)?/g);
  if (!tokens) return '';
  let out = '';
  let cmd = '';
  let i = 0;
  let started = false;
  let lastVisible = false;
  let firstPoint = null;
  const xy = (sx, sy) => {
    const lon = (sx / 1920) * 360 - 180;
    const lat = 90 - (sy / 960) * 180;
    const p = projOrtho(lat, lon, rotLon, R);
    return p;
  };
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === 'M' || t === 'L' || t === 'Q' || t === 'Z') {
      cmd = t; i++;
      if (cmd === 'Z') {
        if (started && firstPoint && firstPoint.visible) out += ' Z';
        started = false; lastVisible = false; firstPoint = null;
      }
      continue;
    }
    if (cmd === 'M') {
      const sx = parseFloat(tokens[i]); const sy = parseFloat(tokens[i+1]); i += 2;
      const p = xy(sx, sy);
      firstPoint = p;
      if (p.visible) {
        out += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        started = true; lastVisible = true;
      } else { lastVisible = false; }
    } else if (cmd === 'L') {
      const sx = parseFloat(tokens[i]); const sy = parseFloat(tokens[i+1]); i += 2;
      const p = xy(sx, sy);
      if (p.visible) {
        if (!lastVisible) out += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        else out += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        lastVisible = true;
      } else { lastVisible = false; }
    } else if (cmd === 'Q') {
      const cx = parseFloat(tokens[i]); const cy = parseFloat(tokens[i+1]);
      const sx = parseFloat(tokens[i+2]); const sy = parseFloat(tokens[i+3]); i += 4;
      const c = xy(cx, cy); const p = xy(sx, sy);
      if (p.visible && c.visible) {
        if (!lastVisible) out += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        else out += ` Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        lastVisible = true;
      } else if (p.visible) {
        out += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        lastVisible = true;
      } else { lastVisible = false; }
    }
  }
  return out.trim();
}

function GlobeLand({ rotLon = 10, R = 310 }) {
  const reprojected = React.useMemo(
    () => CONTINENT_PATHS.map((d) => reprojectToOrtho(d, rotLon, R)),
    [rotLon, R],
  );
  const cx = R; const cy = R;
  return (
    <svg className="globe-land" viewBox={`${-R} ${-R} ${R*2} ${R*2}`} preserveAspectRatio="none">
      {/* Faint graticule */}
      <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18">
        <circle cx="0" cy="0" r={R} />
        <ellipse cx="0" cy="0" rx={R} ry={R * 0.34} />
        <ellipse cx="0" cy="0" rx={R} ry={R * 0.66} />
        <line x1="0" y1={-R} x2="0" y2={R} />
        <line x1={-R} y1="0" x2={R} y2="0" />
      </g>
      <defs>
        <clipPath id="globe-clip"><circle cx="0" cy="0" r={R - 1} /></clipPath>
      </defs>
      <g clipPath="url(#globe-clip)">
        {reprojected.map((d, i) => d ? <path key={i} d={d} className="land" /> : null)}
      </g>
    </svg>
  );
}

// Expose
Object.assign(window, {
  CITIES, projEq, projOrtho, RAMP,
  HeatDot, CityLabel, Graticule, ContinentLayer, GlobeLand,
});
