// The bar that floats over the shelf while selecting (the web's pages/Home/
// SelectDock.tsx): how many are picked, Select all, Move to, Delete, Done.
// Under it, or on its own once selecting is over, the note of the last move
// with its Undo
import Tap from "@/components/Tap";
import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseIcon } from "@/core/components/icons/Icons";
import type { Manga } from "@/core/lib/types";
import { MOVE_LABELS } from "@/core/pages/Home/shelfViews";
import { useColors } from "@/lib/colors";
import type { SelectMode } from "@/lib/useSelectMode";
import PickSheet from "./PickSheet";

const MOVES = (["finished", "planned", "reading"] as const).map((to) => ({
  value: to,
  label: MOVE_LABELS[to],
}));

export function MovedNote({ select }: { select: SelectMode }) {
  if (!select.movedShowing) return null;
  return (
    <View className="flex-row items-center gap-4 self-center rounded-[6px] border-[2.5px] border-line bg-card px-4 py-3">
      {select.moveFailed ? (
        <Text className="font-body text-[15px] text-ink">
          That didn't save. Try again.
        </Text>
      ) : (
        <>
          <Text className="shrink font-body text-[15px] text-ink">
            Moved {select.moved!.name || `${select.moved!.was.length} series`}{" "}
            to {MOVE_LABELS[select.moved!.to]}
          </Text>
          <Tap onPress={() => void select.undoMove()} hitSlop={8}>
            <Text className="font-body-semibold text-[15px] tracking-[0.5px] text-accent uppercase">
              Undo
            </Text>
          </Tap>
        </>
      )}
    </View>
  );
}

export default function SelectDock({
  select,
  shown,
  tab,
}: {
  select: SelectMode;
  shown: Manga[];
  tab: string;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [movePicking, setMovePicking] = useState(false);
  const count = select.pickedShown.length;
  const word = (on: boolean) =>
    `font-body-semibold text-[14.5px] ${on ? "text-ink" : "text-muted"}`;
  return (
    <View
      className="absolute inset-x-3 items-center gap-2.5"
      style={{ bottom: insets.bottom + 16 }}
    >
      <MovedNote select={select} />
      <View className="w-full flex-row items-center justify-between rounded-[18px] border border-line-soft bg-card px-4 py-1.5">
        <Text className="font-brand pr-[5px] text-[22px] text-ink">
          {count}
          {"\u00A0"}
        </Text>
        <Tap
          onPress={select.toggleAll}
          className="min-h-[44px] justify-center px-1"
        >
          <Text className={word(true)}>
            {select.allPicked ? "Clear" : `Select all ${shown.length}`}
          </Text>
        </Tap>
        <Tap
          onPress={() => setMovePicking(true)}
          disabled={!count || select.moving}
          className="min-h-[44px] justify-center px-1"
        >
          <Text className={word(Boolean(count) && !select.moving)}>
            {select.moving ? "Moving…" : "Move to"}
          </Text>
        </Tap>
        <Tap
          onPress={() => select.setConfirmingDelete(true)}
          disabled={!count}
          className="min-h-[44px] justify-center px-1"
        >
          <Text
            className={`font-body-semibold text-[14.5px] ${count ? "text-accent" : "text-muted"}`}
          >
            Delete {count || ""}
          </Text>
        </Tap>
        <Tap
          feel="round"
          onPress={select.stop}
          hitSlop={8}
          accessibilityLabel="Done selecting"
          className="min-h-[44px] justify-center pl-2"
        >
          <CloseIcon color={c.ink} width={20} height={20} />
        </Tap>
      </View>
      <PickSheet
        open={movePicking}
        title="Move to"
        options={MOVES.filter(
          (m) => tab !== (m.value === "reading" ? "ongoing" : m.value),
        )}
        picked={"" as (typeof MOVES)[number]["value"]}
        onPick={(to) => void select.moveTo(to)}
        onClose={() => setMovePicking(false)}
      />
    </View>
  );
}
