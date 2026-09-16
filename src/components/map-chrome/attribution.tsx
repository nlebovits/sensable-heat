"use client";

import { useState } from "react";
import { Info } from "@/components/icons";

const SOURCES = [
  { name: "USGS", href: "https://www.usgs.gov/landsat-missions" },
  { name: "WRI", href: "https://www.wri.org/" },
  {
    name: "Meta",
    href: "https://source.coop/tge-labs/meta-chm-v2",
  },
  { name: "Overture Maps", href: "https://overturemaps.org/" },
  { name: "Esri", href: "https://www.esri.com/" },
];

/**
 * Data sources for the map.
 *
 * Collapsed to an info button. Opening extends the list leftward from the
 * button, so the control keeps the 36px square footprint of the zoom stack.
 */
export function Attribution() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`attribution ${open ? "open" : ""}`}>
      <div className="attribution-reveal">
        <div className="attribution-clip">
          <ul className="attribution-list">
            {SOURCES.map((source) => (
              <li key={source.name}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        className="attribution-toggle"
        aria-expanded={open}
        aria-label="Data sources"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Info size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
