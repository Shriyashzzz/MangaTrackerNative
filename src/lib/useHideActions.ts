// Hide on New (the web's pages/Home/useHideActions.ts): one series, every
// one shown, or unhide them all, each with its undo; said in a note that
// goes by itself
import { useEffect, useState } from "react";
import type { SeenKind } from "@/core/lib/releaseMath";
import type { Manga } from "@/core/lib/types";
import {
  isHiddenAs,
  newestOf,
  NOTE_MS,
  SEEN_KIND,
  seenOf,
  type ReleaseKind,
  type Releases,
} from "@/core/pages/Home/shelfViews";
import { useShelf } from "@/store/shelf";

type Before = { id: number; previous: number | null; previousList: number[] };
export type Hidden = Before & {
  name: string;
  kind: SeenKind;
  restored?: boolean;
  others?: Before[];
};
const before = (m: Manga, kind: SeenKind): Before => ({
  id: m.id,
  previous: seenOf(m, kind),
  previousList: m.hiddenVolumes ?? [],
});

export function useHideActions({
  releases,
  releaseKind,
  viewingHidden,
  shown,
}: {
  releases: Releases;
  releaseKind: ReleaseKind;
  viewingHidden: boolean;
  shown: Manga[];
}) {
  const markSeen = useShelf((s) => s.markSeen);
  const [hidden, setHidden] = useState<Hidden | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!hidden && !failed) return;
    const timer = setTimeout(() => {
      setHidden(null);
      setFailed(false);
    }, NOTE_MS);
    return () => clearTimeout(timer);
  }, [hidden, failed]);
  const kind = SEEN_KIND[releaseKind];

  const hide = async (m: Manga) => {
    const newest = newestOf(releases[m.id], releaseKind);
    if (newest == null) return;
    const was = before(m, kind);
    setFailed(false);
    const restored = viewingHidden;
    const saved = await markSeen(
      m.id,
      kind,
      restored ? null : newest,
      kind === "volume" && restored ? [] : undefined,
    );
    if (saved) setHidden({ ...was, name: m.name, kind, restored });
    else setFailed(true);
  };
  const many = async (
    series: { m: Manga; number: number | null; list?: number[] }[],
    summary: { name: string; restored?: boolean },
  ) => {
    const others = series.map(({ m }) => before(m, kind));
    setFailed(false);
    const saved = await Promise.all(
      series.map(({ m, number, list }) => markSeen(m.id, kind, number, list)),
    );
    if (saved.every(Boolean))
      setHidden({
        id: 0,
        previous: null,
        previousList: [],
        kind,
        others,
        ...summary,
      });
    else setFailed(true);
  };
  const unhideAll = async () => {
    const series = shown.filter((m) => isHiddenAs(releases[m.id], releaseKind));
    await many(
      series.map((m) => ({
        m,
        number: null,
        list: kind === "volume" ? [] : undefined,
      })),
      { name: `${series.length} series`, restored: true },
    );
  };
  const hideAll = async () => {
    const series = shown.flatMap((m) => {
      const newest = newestOf(releases[m.id], releaseKind);
      return newest == null ? [] : [{ m, number: newest }];
    });
    if (!series.length) return;
    await many(series, {
      name: series.length === 1 ? series[0]!.m.name : `${series.length} series`,
    });
  };
  const undo = async () => {
    if (!hidden) return;
    const { id, kind: k, previous, previousList, others } = hidden;
    setHidden(null);
    if (others) {
      const saved = await Promise.all(
        others.map((o) =>
          markSeen(
            o.id,
            k,
            o.previous,
            k === "volume" ? o.previousList : undefined,
          ),
        ),
      );
      if (!saved.every(Boolean)) setFailed(true);
      return;
    }
    if (
      !(await markSeen(
        id,
        k,
        previous,
        k === "volume" ? previousList : undefined,
      ))
    )
      setFailed(true);
  };
  return {
    hidden,
    failed,
    hide,
    hideAll,
    unhideAll,
    undo,
    dismiss: () => {
      setHidden(null);
      setFailed(false);
    },
  };
}
