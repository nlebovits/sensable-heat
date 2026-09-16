"use client";

import type { ReactNode } from "react";
import { useOnborda } from "onborda";
import type { Step } from "onborda";
import { ArrowRight } from "@/components/icons";

/**
 * Mirrors Onborda's `CardComponentProps`.
 *
 * It is restated here because the published type annotates `arrow` with the
 * global `JSX.Element`, which React 19 removed.
 */
export interface TourCardProps {
  step: Step;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  arrow: ReactNode;
}

/** The tour card, styled to match the side panel rather than Tailwind. */
export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: TourCardProps) {
  const { closeOnborda } = useOnborda();

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="tour-card">
      <div className="tour-card-eyebrow">
        <span>Walkthrough</span>
        <span>
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      <h2 className="tour-card-title">
        {step.icon ? (
          <span className="tour-card-icon" aria-hidden="true">
            {step.icon}
          </span>
        ) : null}
        {step.title}
      </h2>

      <div className="tour-card-body">{step.content}</div>

      <div className="tour-card-footer">
        <button type="button" className="tour-card-skip" onClick={closeOnborda}>
          {isLast ? "Close" : "Skip"}
        </button>

        <div className="tour-card-nav">
          {!isFirst && (
            <button type="button" className="tour-card-btn" onClick={prevStep}>
              Back
            </button>
          )}
          {isLast ? (
            <button
              type="button"
              className="tour-card-btn primary"
              onClick={closeOnborda}
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              className="tour-card-btn primary"
              onClick={nextStep}
            >
              Next <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      <span className="tour-card-arrow">{arrow}</span>
    </div>
  );
}
