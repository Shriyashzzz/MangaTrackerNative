// A place kept both ways stays one place: reading up to a volume moves the
// chapter to that volume's last, and a chapter moves the volume to the last
// one it finishes. Only from what the list of volume starts is sure of
// (core lib/chapterVolumes.ts): a volume's last chapter is known only when
// the next volume's first is, so nothing is ever guessed
import { volumeHolding, type VolumeStart } from "@/core/lib/chapterVolumes";

const startOf = (volume: number, starts: VolumeStart[]) =>
  starts.find((s) => s.volume === volume) ?? null;

// the last whole chapter in a volume, or null when the list can't say
export function lastChapterOf(volume: number, starts: VolumeStart[]) {
  const here = startOf(volume, starts);
  const next = startOf(volume + 1, starts);
  if (!here || !next) return null;
  const last = Math.ceil(next.firstChapter) - 1;
  return last >= here.firstChapter ? last : null;
}

// how many volumes are read all the way through at this chapter, or null
// when the list can't place the chapter
export function volumesReadAt(chapter: number, starts: VolumeStart[]) {
  const holding = volumeHolding(chapter, starts);
  if (holding == null) return null;
  const last = lastChapterOf(holding, starts);
  return last != null && chapter >= last ? holding : holding - 1;
}
