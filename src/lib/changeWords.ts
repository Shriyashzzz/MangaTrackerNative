// A change kept on this phone, in words, for the list the offline strip
// opens: "Chapter 34 → 36"
import type { OfflineChange, ShelfState } from "@/core/lib/offlineChangeRules";

const orNone = (value: unknown) => (value == null ? "none" : String(value));

export function changeWords(change: OfflineChange): string {
  if (change.kind === "owned")
    return `Volumes owned: ${change.started.length} → ${change.ended.length}`;
  const { from, to } = change;
  if (change.kind === "bookmark")
    return `Chapter ${orNone(from)} → ${orNone(to)}`;
  if (change.kind === "readVolume")
    return `Volume read: ${orNone(from)} → ${orNone(to)}`;
  if (change.kind === "state") {
    const { status, planned } = to as ShelfState;
    if (status) return "Marked finished";
    return planned ? "Moved to To read" : "Moved to Reading";
  }
  if (change.kind === "rating") {
    const stars = Number(to) || 0;
    if (!stars) return "Rating removed";
    return `Rated ${stars} ${stars === 1 ? "star" : "stars"}`;
  }
  return to ? "Notes changed" : "Notes cleared";
}
