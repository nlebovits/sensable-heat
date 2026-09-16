import type { OnbordaProps } from "onborda";

/** The package does not re-export its `Tour` type, so derive it. */
type Tour = OnbordaProps["steps"][number];

/** The single tour this app runs. */
export const TOUR_NAME = "intro";

/**
 * Each step points at a `data-tour` hook in the side panel, so restyling the
 * panel cannot break the tour.
 */
export const TOURS: Tour[] = [
  {
    tour: TOUR_NAME,
    steps: [
      {
        icon: null,
        title: "What this map shows",
        content: (
          <>
            <p>
              This map can help you understand where heat risk concentrates in
              your city. It shows extreme land surface temperature readings
              from satellite imagery, alongside tree canopy cover and building
              footprints. Let&rsquo;s dive in to what that means.
            </p>
            <p className="tour-note">
              <span aria-hidden="true">🚧</span> Note: this is a proof of
              concept, not a finished product. Do not use it for
              decision-making.
            </p>
          </>
        ),
        selector: '[data-tour="intro"]',
        side: "right-top",
        // The panel header touches the top of the viewport. Padding would
        // push the card above it and clip the card border.
        pointerPadding: 0,
        pointerRadius: 0,
      },
      {
        icon: null,
        title: "The heat layer",
        content: (
          <p>
            The heat layer shows 95th percentile land surface temperature
            readings from 2021 through 2025. This is a measure of where the
            ground is hottest,{" "}
            <a
              href="https://www.wri.org/insights/beyond-thermometer-measuring-heat"
              target="_blank"
              rel="noopener noreferrer"
            >
              not where people are most affected by heat
            </a>
            , but it&rsquo;s the best available global proxy for use in
            data-scarce regions.
          </p>
        ),
        selector: '[data-tour="lst"]',
        side: "right",
        pointerPadding: 8,
        pointerRadius: 0,
      },
      {
        icon: null,
        title: "Trees and buildings",
        content: (
          <p>
            Tree canopy cover and buildings are two of the most important
            drivers of heat risk. Good tree canopy cover can mitigate the worst
            impacts of extreme heat. Buildings are more complicated: in some
            cases, they trap heat, producing the urban heat island effect, but
            they can also be a source of shade that cools some areas.
          </p>
        ),
        selector: '[data-tour="canopy"]',
        side: "right",
        pointerPadding: 8,
        pointerRadius: 0,
      },
      {
        icon: null,
        title: "Where people are",
        content: (
          <p>
            Heat risk is about where people are located, not just where
            it&rsquo;s hottest. This is why it&rsquo;s important to analyze
            heat in populated areas specifically. Otherwise, factors like hot
            but unpopulated agricultural fields may skew your analysis.
          </p>
        ),
        selector: '[data-tour="buildings"]',
        side: "right",
        pointerPadding: 8,
        pointerRadius: 0,
      },
      {
        icon: null,
        title: "Explore the data",
        content: (
          <p>
            All of the data used here are available as open-source,
            cloud-native datasets and are linked in the side panel. We
            encourage users to explore the datasets themselves in tools like
            Python and QGIS, and read the documentation. We provide an example
            notebook showing what we consider to be one helpful way to use the
            data for decision-making.
          </p>
        ),
        selector: '[data-tour="resources"]',
        side: "right-bottom",
        pointerPadding: 8,
        pointerRadius: 0,
      },
    ],
  },
];
