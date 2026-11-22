// Your shelf's settings (the web's ShelfSettingsTab): how the shelf lists
// series, how they keep their place, To buy's offer to add, which volume to
// collect next, the first tab, and the sort
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { SHELF_TABS } from "@/core/lib/account";
import { SORT_OPTIONS } from "@/core/lib/shelf";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";
import PickSheet from "../PickSheet";
import { Radios, Section, Tick } from "./parts";

const TRACKING = [
  { value: "series", label: "Let me choose for each series" },
  { value: "chapters", label: "Chapters only" },
  { value: "volumes", label: "Volumes only" },
  { value: "both", label: "Chapters and volumes together" },
] as const;
const NEXT = [
  { value: "after", label: "The one after my highest volume" },
  { value: "gap", label: "The first volume I'm missing" },
] as const;

export default function ShelfSettingsTab() {
  const c = useColors();
  const prefs = usePrefs((s) => s.prefs);
  const save = usePrefs((s) => s.save);
  const [picking, setPicking] = useState<"tab" | "sort" | null>(null);
  const set = (patch: Parameters<typeof save>[0]) =>
    void save(patch).catch(() => {});
  const tabLabel =
    SHELF_TABS.find((t) => t.value === (prefs.shelfTab ?? "all"))?.label ??
    "All";
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === (prefs.shelfSort ?? ""))?.label ??
    "Last updated";
  const pick = (label: string, value: string, open: () => void) => (
    <Pressable
      onPress={open}
      className="min-h-[46px] flex-row items-center justify-between rounded-[2px] border-[1.5px] border-line-soft bg-paper px-3"
      accessibilityLabel={`${label}: ${value}. Change`}
    >
      <Text className="font-body text-[15px] text-ink">{value}</Text>
      <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
    </Pressable>
  );
  return (
    <>
      <Section first title="Keeping your place">
        <Radios
          label="Track by"
          options={TRACKING}
          value={prefs.trackBy ?? "series"}
          onChange={(value) => set({ trackBy: value })}
        />
      </Section>
      <Section title="To buy">
        <Tick
          label="Offer to add a series when I mark a book On my shelf or Ordered"
          value={prefs.offerAdd !== "off"}
          onChange={(on) => set({ offerAdd: on ? "on" : "off" })}
        />
      </Section>
      <Section title="Next volume to collect, when a series has gaps">
        <Radios
          label="Next in line"
          options={NEXT}
          value={prefs.nextFor ?? "after"}
          onChange={(value) => set({ nextFor: value })}
        />
      </Section>
      <Section title="First tab to open">
        {pick("First tab to open", tabLabel, () => setPicking("tab"))}
      </Section>
      <Section title="Sorted by">
        {pick("Sorted by", sortLabel, () => setPicking("sort"))}
      </Section>
      <PickSheet
        open={picking === "tab"}
        title="First tab to open"
        options={SHELF_TABS}
        picked={prefs.shelfTab ?? "all"}
        onPick={(tab) => set({ shelfTab: tab })}
        onClose={() => setPicking(null)}
      />
      <PickSheet
        open={picking === "sort"}
        title="Sorted by"
        options={SORT_OPTIONS}
        picked={prefs.shelfSort ?? ""}
        onPick={(sort) => set({ shelfSort: sort })}
        onClose={() => setPicking(null)}
      />
      <View />
    </>
  );
}
