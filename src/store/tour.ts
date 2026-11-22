// Kenji's tour of the practice shelf: which step it's on, whether he's been
// hidden, and where on the screen the thing he's pointing at is. The script
// is the website's own (core components/tour/steps.ts); the app shows it in
// its own way (components/Tour.tsx)
import { create } from "zustand";
import { tourSteps, type TourStep } from "@/core/components/tour/steps";

// Steps about a part of the website the app does differently: left out
const NOT_IN_THE_APP = new Set(["sort", "volume-picker"]);

// The things he points at on a series' page, in the order the app's page has
// them from the top. The website's page is laid out another way, so its
// script jumps about here; steps on one page are told top to bottom instead
const DOWN_THE_PAGE = [
  "edition",
  "buy",
  "spines",
  "chapter-up",
  "release-toggle",
  "your-books",
];
const placeOf = (step: TourStep) => {
  const place = DOWN_THE_PAGE.indexOf(step.target ?? "");
  return place === -1 ? DOWN_THE_PAGE.length : place;
};
// each run of steps on the same page, top to bottom; the pages themselves
// stay in the script's order
function topToBottom(steps: TourStep[]) {
  const told: TourStep[] = [];
  let run: TourStep[] = [];
  const flush = () => {
    told.push(...run.sort((a, b) => placeOf(a) - placeOf(b)));
    run = [];
  };
  for (const step of steps) {
    if (run.length && run[0]!.path !== step.path) flush();
    run.push(step);
  }
  flush();
  return told;
}

// where the thing he's pointing at is on the screen, top and height
type Box = { y: number; height: number };

type TourState = {
  steps: TourStep[];
  at: number;
  hidden: boolean;
  // null while there's nothing to point at, or it hasn't been found yet
  box: Box | null;
  point: (box: Box | null) => void;
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
  box: null,
  point: (box) => set({ box }),
  start: () =>
    set({
      steps: topToBottom(
        tourSteps().filter(
          (step) => !step.skip?.() && !NOT_IN_THE_APP.has(step.target ?? ""),
        ),
      ),
      at: 0,
      hidden: false,
      box: null,
    }),
  end: () => set({ steps: [], at: 0, hidden: false, box: null }),
  move: (by) => {
    const { steps, at } = get();
    let next = at + by;
    // a step that only holds in some cases (single volumes picked) is
    // passed over when it doesn't
    while (steps[next] && steps[next]!.when && !steps[next]!.when!())
      next += by;
    // (the new step's thing is found afresh)
    if (steps[next]) set({ at: next, box: null });
  },
  hide: (hidden) => set({ hidden }),
}));

// what Kenji is pointing at just now, for the thing itself to show it
// (components/TourTarget.tsx); null when there's no tour, or he's hidden
export const useTourTarget = () =>
  useTour((s) => (s.hidden ? null : (s.steps[s.at]?.target ?? null)));
