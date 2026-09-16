"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "@/components/icons";

interface InfoTipProps {
  /** Popup body. May contain links. */
  content: React.ReactNode;
  /** Names the subject in the button's accessible label. */
  label: string;
  /** Which side of the button the popup prefers. */
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * An "i" button that opens an explanation of the item beside it.
 *
 * A click opens the popup and a click outside or Escape closes it. Pointing at
 * the button does nothing, so the explanation stays put while the reader works
 * through the links inside it.
 */
export function InfoTip({ content, label, side = "right" }: InfoTipProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="info-tip-button"
        aria-label={`About ${label}`}
      >
        <Info aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="info-tip-positioner"
          side={side}
          sideOffset={8}
          align="start"
          collisionPadding={12}
        >
          <Popover.Popup className="info-tip-popup">{content}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
