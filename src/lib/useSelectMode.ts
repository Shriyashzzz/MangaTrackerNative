// The shelf's Select: several series picked to move (to Finished, To read or
// Reading) or delete at once, each with undo. As the web's pages/Home/
// useSelectMode.ts; the saving is the shelf store's (moveMany, placeMany,
// removeMany)
import { useEffect, useState } from "react";
import type { Manga } from "@/core/lib/types";
import { NOTE_MS } from "@/core/pages/Home/shelfViews";
import { useShelf, type ShelfMove, type ShelfPlace } from "@/store/shelf";

export type Moved = { to: ShelfMove; was: ShelfPlace[]; name: string };

export function useSelectMode({
  canSelect,
  shown,
}: {
  canSelect: boolean;
  shown: Manga[];
}) {
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(() => new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moved, setMoved] = useState<Moved | null>(null);
  const [moveFailed, setMoveFailed] = useState(false);
  const selectOn = selecting && canSelect;

  // the moved note goes by itself after a while
  useEffect(() => {
    if (!moved && !moveFailed) return;
    const timer = setTimeout(() => {
      setMoved(null);
      setMoveFailed(false);
    }, NOTE_MS);
    return () => clearTimeout(timer);
  }, [moved, moveFailed]);

  const stop = () => {
    setSelecting(false);
    setPicked(new Set());
  };
  const pickedShown = selectOn ? shown.filter((m) => picked.has(m.id)) : [];
  const allPicked =
    pickedShown.length > 0 && pickedShown.length === shown.length;

  const toggle = (id: number) =>
    setPicked((now) => {
      const next = new Set(now);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = () =>
    setPicked(allPicked ? new Set() : new Set(shown.map((m) => m.id)));

  const moveTo = async (to: ShelfMove) => {
    setMoving(true);
    setMoveFailed(false);
    const name = pickedShown.length === 1 ? pickedShown[0]!.name : "";
    const was = await useShelf.getState().moveMany(
      pickedShown.map((m) => m.id),
      to,
    );
    setMoving(false);
    if (!was) {
      setMoveFailed(true);
      return;
    }
    setPicked(new Set());
    setMoved(was.length ? { to, was, name } : null);
  };
  const undoMove = async () => {
    if (!moved) return;
    const { was } = moved;
    setMoved(null);
    if (!(await useShelf.getState().placeMany(was))) setMoveFailed(true);
  };
  const deletePicked = async () => {
    const done = await useShelf
      .getState()
      .removeMany(pickedShown.map((m) => m.id));
    if (done) {
      setConfirmingDelete(false);
      stop();
    }
    return done;
  };

  return {
    selecting,
    selectOn,
    start: () => setSelecting(true),
    stop,
    picked,
    pickedShown,
    allPicked,
    toggle,
    toggleAll,
    moving,
    moved,
    moveFailed,
    movedShowing: Boolean(moved || moveFailed),
    moveTo,
    undoMove,
    dismissMoved: () => {
      setMoved(null);
      setMoveFailed(false);
    },
    confirmingDelete,
    setConfirmingDelete,
    deletePicked,
  };
}

export type SelectMode = ReturnType<typeof useSelectMode>;
