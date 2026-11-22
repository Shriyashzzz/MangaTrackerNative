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

export function tourGo(by: 1 | -1) {
  const before = useTour.getState().at;
  useTour.getState().move(by);
  const { steps, at } = useTour.getState();
  if (at === before) return;
  const page = pageOf(steps[at]!);
  // (going to the page already in front does nothing)
  if (page) router.navigate(page);
}
