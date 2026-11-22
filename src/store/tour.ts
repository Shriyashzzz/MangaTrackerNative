// Kenji's tour of the practice shelf: which step it's on, and whether he's
// been hidden. The script is the website's own (core components/tour/
// steps.ts); the app shows it in its own way (components/Tour.tsx)
import { create } from "zustand";
import { tourSteps, type TourStep } from "@/core/components/tour/steps";

// Steps about a part of the website the app does differently: left out
const NOT_IN_THE_APP = new Set(["sort", "volume-picker"]);

type TourState = {
  steps: TourStep[];
  at: number;
  hidden: boolean;
  // Kenji sits at the top of the screen for this step: what he's pointing
  // at couldn't be moved clear of the foot (components/TourTarget.tsx)
  atTop: boolean;
  sit: (atTop: boolean) => void;
  // a new tour, from its first step (the practice shelf has just opened)
  start: () => void;
  // over: the practice shelf was left
  end: () => void;
  // a step on or back, passing over any that doesn't apply just now
  move: (by: 1 | -1) => void;
  hide: (hidden: boolean) => void;
};

export const useTour = create<TourState>()((set, get) => ({
  steps: [],
  at: 0,
  hidden: false,
  atTop: false,
  sit: (atTop) => set({ atTop }),
  start: () =>
    set({
      steps: tourSteps().filter(
        (step) => !step.skip?.() && !NOT_IN_THE_APP.has(step.target ?? ""),
      ),
      at: 0,
      hidden: false,
    }),
  end: () => set({ steps: [], at: 0, hidden: false }),
  move: (by) => {
    const { steps, at } = get();
    let next = at + by;
    // a step that only holds in some cases (single volumes picked) is
    // passed over when it doesn't
    while (steps[next] && steps[next]!.when && !steps[next]!.when!())
      next += by;
    // (each step starts with Kenji at the foot)
    if (steps[next]) set({ at: next, atTop: false });
  },
  hide: (hidden) => set({ hidden }),
}));

// what Kenji is pointing at just now, for the thing itself to show it
// (components/TourTarget.tsx); null when there's no tour, or he's hidden
export const useTourTarget = () =>
  useTour((s) => (s.hidden ? null : (s.steps[s.at]?.target ?? null)));
