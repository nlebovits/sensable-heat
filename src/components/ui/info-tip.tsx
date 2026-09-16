"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { Info } from "@/components/icons";

interface InfoTipProps {
  /** Tooltip body. Also the accessible name of the trigger. */
  label: string;
  /** Which side of the icon the popup prefers. */
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * An info icon that reveals a short explanation on hover or focus.
 *
 * `Tooltip.Trigger` renders a `button`, so the popup opens from the keyboard
 * as well as the pointer.
 */
export function InfoTip({ label, side = "top" }: InfoTipProps) {
  return (
    <Tooltip.Provider delay={200} closeDelay={80}>
      <Tooltip.Root>
        <Tooltip.Trigger className="info-tip" aria-label={label}>
          <Info size={14} aria-hidden="true" />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner side={side} sideOffset={8}>
            <Tooltip.Popup className="info-tip-popup">{label}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
