"use client";

import { Tooltip } from "@base-ui/react/tooltip";

interface InfoTipProps {
  /** Tooltip body. May contain links. */
  content: React.ReactNode;
  /** The text that reveals the tooltip on hover or focus. */
  children: React.ReactNode;
  /** Which side of the text the popup prefers. */
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Reveals an explanation when the pointer rests on the text it wraps.
 *
 * The trigger renders as a `span` rather than the default `button`, so the
 * layer name keeps its own type. `tabIndex` keeps it reachable from the
 * keyboard. The popup stays open while the pointer is inside it, which is what
 * makes the links in the body clickable.
 */
export function InfoTip({ content, children, side = "right" }: InfoTipProps) {
  return (
    <Tooltip.Provider delay={150} closeDelay={250}>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={<span />}
          className="info-trigger"
          tabIndex={0}
        >
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner
            className="info-tip-positioner"
            side={side}
            sideOffset={10}
          >
            <Tooltip.Popup className="info-tip-popup">{content}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
