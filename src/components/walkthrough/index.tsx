"use client";

import { useEffect, useRef } from "react";
import { Onborda, OnbordaProvider, useOnborda } from "onborda";
import { useMapStore } from "@/store/map-store";
import { TourCard, type TourCardProps } from "./tour-card";
import { TOURS, TOUR_NAME } from "./steps";

/** Cookie that records the user has skipped or finished the walkthrough. */
const COOKIE_NAME = "sh_walkthrough";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function hasDismissed(): boolean {
  try {
    return document.cookie
      .split(";")
      .some((part) => part.trim().startsWith(`${COOKIE_NAME}=`));
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    document.cookie = `${COOKIE_NAME}=1; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
  } catch {
    // Cookies blocked. The walkthrough will open again next visit.
  }
}

/**
 * Starts the tour and records that the user has seen it.
 *
 * It renders nothing. It has to sit inside `OnbordaProvider` to reach the
 * tour controls.
 */
function TourController() {
  const { startOnborda, isOnbordaVisible, currentStep } = useOnborda();
  const walkthroughOpen = useMapStore((state) => state.walkthroughOpen);
  const setWalkthroughOpen = useMapStore((state) => state.setWalkthroughOpen);

  /** The step Onborda is showing, or undefined before the tour starts. */
  const step = TOURS.find((tour) => tour.tour === TOUR_NAME)?.steps[currentStep];

  // Onborda measures the target first and scrolls it into view second, so
  // the spotlight flies to where the target used to be and then snaps back.
  // This component is a child of Onborda, so this effect runs before the
  // effect that measures. Put the target in its final place here, with no
  // animation. Onborda then measures a settled target, its own scroll does
  // nothing, and the spotlight moves once.
  useEffect(() => {
    if (!isOnbordaVisible || !step) return;
    const target = document.querySelector(step.selector);
    target?.scrollIntoView({ behavior: "instant", block: "center" });
  }, [isOnbordaVisible, step]);

  // The panel content can still shift after the step opens, for example when
  // the legend fills in its values. Onborda only re-measures on a window
  // resize, so ask it to re-measure when the spotlight drifts off the target.
  useEffect(() => {
    if (!isOnbordaVisible || !step) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const realign = () => {
      const target = document.querySelector(step.selector);
      const spot = document.querySelector('[data-name="onborda-pointer"]');
      if (!target || !spot) return;

      const anchor = target.getBoundingClientRect();
      const shown = spot.getBoundingClientRect();
      // Onborda insets the spotlight by half the padding on each side.
      const inset = (step.pointerPadding ?? 30) / 2;
      const offTop = Math.abs(shown.top + inset - anchor.top);
      const offLeft = Math.abs(shown.left + inset - anchor.left);
      if (offTop < 2 && offLeft < 2) return;

      window.dispatchEvent(new Event("resize"));
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(realign, 200);
    };

    // The panel scrolls inside itself, so listen in the capture phase.
    document.addEventListener("scroll", schedule, true);
    const observer = new ResizeObserver(schedule);
    const panel = document.querySelector(".panel-inner");
    if (panel) observer.observe(panel);

    return () => {
      document.removeEventListener("scroll", schedule, true);
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [isOnbordaVisible, step]);

  // Open on first visit. The cookie read runs in the browser only.
  useEffect(() => {
    if (!hasDismissed()) startOnborda(TOUR_NAME);
  }, [startOnborda]);

  // Reopen when the side panel asks for a replay.
  useEffect(() => {
    if (walkthroughOpen) startOnborda(TOUR_NAME);
  }, [walkthroughOpen, startOnborda]);

  // Write the cookie once the tour closes, however it closed.
  const wasVisible = useRef(false);
  useEffect(() => {
    if (isOnbordaVisible) {
      wasVisible.current = true;
      return;
    }
    if (wasVisible.current) {
      wasVisible.current = false;
      setDismissed();
      setWalkthroughOpen(false);
    }
  }, [isOnbordaVisible, setWalkthroughOpen]);

  return null;
}

/** Wraps the app so the tour can highlight any control inside it. */
export function WalkthroughProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnbordaProvider>
      <Onborda
        steps={TOURS}
        cardComponent={TourCard as React.ComponentType<TourCardProps>}
        shadowRgb="0,0,0"
        shadowOpacity="0.6"
        cardTransition={{ type: "tween", duration: 0.2 }}
      >
        <TourController />
        {children}
      </Onborda>
    </OnbordaProvider>
  );
}
