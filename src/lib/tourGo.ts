// Moving Kenji's tour on or back: the step changes, and the app goes to the
// page the new step is about. Used by his own buttons and by the things he
// points at (using one moves on, as on the website)
import { router, type Href } from "expo-router";
import type { TourStep } from "@/core/components/tour/steps";
import { useTour } from "@/store/tour";
import { hrefOf } from "./webRoutes";

// the app's page for a step: the shelf's New tab is a tab of the app's own,
// and the rest are the website's addresses, turned into the app's
function pageOf(step: TourStep): Href | null {
  const to = step.go ?? step.path;
  if (to === "/shelf") return step.tab === "new" ? "/new" : "/";
  if (to.startsWith("/add")) {
    const title = new URLSearchParams(to.split("?")[1] ?? "").get("title");
    return { pathname: "/add", params: title ? { title } : {} };
  }
  if (to.startsWith("/settings/"))
    return { pathname: "/settings", params: { tab: to.split("/")[2]! } };
  return hrefOf(to);
}

// the app's page for the step the tour is on, with the pages over a tab
// closed first (or the tab changes out of sight behind them)
function openPageOf(step: TourStep) {
  const page = pageOf(step);
  if (!page) return;
  const isTab = page === "/" || page === "/new";
  if (isTab && router.canDismiss()) router.dismissAll();
  // (going to the page already in front does nothing)
  router.navigate(page);
}

// A button of the app's was pressed (anything that does something: a row,
// a link, a control): they've started using the page, so Kenji steps aside
// to his small button at the foot and what they opened isn't hidden under
// him. A stray touch or a scroll isn't that, and he stays. His own buttons
// don't count: his bubble says "that was me" as the finger lands, just
// before the press is heard
const MINE_FOR_MS = 1500;
let mineAt = 0;
export const touchIsKenjis = () => {
  mineAt = Date.now();
};
export function controlUsed() {
  if (Date.now() - mineAt < MINE_FOR_MS) return;
  const { steps, hidden, hide } = useTour.getState();
  if (steps.length && !hidden) hide(true);
}

// Kenji called back: his bubble, on the page his step is about (they may
// have wandered off while he was aside)
export function tourBack() {
  const { steps, at, hide } = useTour.getState();
  hide(false);
  if (steps[at]) openPageOf(steps[at]!);
}

// how long the bubble waits where it was for a new step's thing to be found
const FIND_WITHIN_MS = 1400;

export function tourGo(by: 1 | -1) {
  const before = useTour.getState().at;
  useTour.getState().move(by);
  const { steps, at } = useTour.getState();
  if (at === before) return;
  openPageOf(steps[at]!);
  // the thing never showed (a page that didn't open, a part of it folded
  // away): the bubble stops waiting and rests at the foot
  const waitingFor = useTour.getState().box;
  setTimeout(() => {
    const now = useTour.getState();
    if (now.at === at && now.box === waitingFor && waitingFor) now.point(null);
  }, FIND_WITHIN_MS);
}
