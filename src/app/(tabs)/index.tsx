// My shelf, as the Android app's: the tab's name and count in the shelf's
// bar ("ALL 40 ▾", a tap picks another tab), search and sort beside it, then
// a row per series. Pull down to load it again. Volumes is its own view
// (VolumesView). Who's in each tab, the search and the sort are the web's own
// rules (core filterShelf); it opens on the tab and sort the account chose
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AppHeader from "@/components/AppHeader";
import DashedLine from "@/components/DashedLine";
import PickSheet from "@/components/PickSheet";
import ShelfRow from "@/components/ShelfRow";
import Toast from "@/components/Toast";
import VolumesView from "@/components/VolumesView";
import {
  ChevronDownIcon,
  CloseIcon,
  SearchIcon,
  SortIcon,
} from "@/core/components/icons/Icons";
import { SORT_OPTIONS, type ShelfSort } from "@/core/lib/shelf";
import { filterShelf, shelfCounts } from "@/core/pages/Home/shelfViews";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";

const Safe = withUniwind(SafeAreaView);

// the shelf's tabs, as the web's (pages/Home/Home.tsx); Volumes counts
// volumes, not series
const TABS = [
  { value: "all", label: "All" },
  { value: "ongoing", label: "Reading" },
  { value: "finished", label: "Finished" },
  { value: "planned", label: "To read" },
  { value: "volumes", label: "Volumes" },
] as const;
type TabId = (typeof TABS)[number]["value"];
const isTab = (tab: unknown): tab is TabId => TABS.some((t) => t.value === tab);

export default function ShelfScreen() {
  const c = useColors();
  const manga = useShelf((s) => s.manga);
  const failed = useShelf((s) => s.failed);
  const load = useShelf((s) => s.load);
  const releases = useShelf((s) => s.releases);
  const checkReleases = useShelf((s) => s.checkReleases);
  const prefs = usePrefs((s) => s.prefs);
  const checksOn = prefs.releaseChecks !== "off";
  const trackBy = prefs.trackBy ?? "series";
  // what the account chose until they pick here
  const [tabPicked, setTab] = useState<TabId | null>(null);
  const [sortPicked, setSort] = useState<ShelfSort | null>(null);
  const tab = tabPicked ?? (isTab(prefs.shelfTab) ? prefs.shelfTab : "all");
  const sortBy = sortPicked ?? prefs.shelfSort ?? "";
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState<"tab" | "sort" | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // a series just deleted (here or on its page): its Undo, at the foot
  const lastDeleted = useShelf((s) => s.lastDeleted);
  const undoMessage = useShelf((s) => s.undoMessage);
  const undoing = useShelf((s) => s.undoing);

  useEffect(() => {
    void load();
  }, [load]);
  // what's out for each series, once the shelf is here (the rows' "of 13")
  useEffect(() => {
    if (manga && checksOn) void checkReleases();
  }, [manga, checksOn, checkReleases]);

  const shown = TABS.find((t) => t.value === tab)!;
  const list = filterShelf(manga ?? [], releases, {
    tab,
    releaseKind: "volumes",
    viewingHidden: false,
    query,
    sortBy,
  });
  const counts = shelfCounts(manga ?? [], releases);
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Last updated";

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const closeSearch = () => {
    setQuery("");
    setSearching(false);
  };

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <AppHeader />
      {/* the shelf's bar: which tab and how many, or the search box; search
          and sort on the right */}
      <View className="h-[64px] flex-row items-center gap-2 px-4 pt-3">
        {searching ? (
          <View className="flex-1 flex-row items-center gap-2 rounded-[4px] border-2 border-line bg-card px-3">
            <SearchIcon color={c.inkSoft} width={18} height={18} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search your shelf"
              placeholderTextColorClassName="accent-muted"
              autoCorrect={false}
              returnKeyType="search"
              className="flex-1 py-2 font-body text-[16px] text-ink"
            />
            <Pressable
              onPress={closeSearch}
              hitSlop={10}
              accessibilityLabel="Close search"
            >
              <CloseIcon color={c.inkSoft} width={18} height={18} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setPicking("tab")}
            className="flex-1 flex-row items-baseline gap-2"
            accessibilityLabel={`Showing ${shown.label}, ${counts[tab]}. Change what's shown`}
          >
            <Text className="font-brand pr-1 text-[30px] tracking-[1px] text-ink uppercase">
              {shown.label}
            </Text>
            <Text className="font-mono text-[14px] text-muted">
              {counts[tab]}
            </Text>
            <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
          </Pressable>
        )}
        {searching ? null : (
          <Pressable
            onPress={() => setSearching(true)}
            hitSlop={8}
            className="p-2"
            accessibilityLabel="Search your shelf"
          >
            <SearchIcon color={c.ink} width={22} height={22} />
          </Pressable>
        )}
        <Pressable
          onPress={() => setPicking("sort")}
          hitSlop={8}
          className="p-2"
          accessibilityLabel={`Sorted by ${sortLabel}. Change the order`}
        >
          <SortIcon color={sortBy ? c.accent : c.ink} width={22} height={22} />
        </Pressable>
      </View>
      <View className="mx-4 h-px bg-line" />
      {failed && !manga ? (
        <Text className="px-4 pt-6 font-body text-[15px] text-ink-soft">
          {failed}
        </Text>
      ) : tab === "volumes" ? (
        <VolumesView manga={list} refreshing={refreshing} onRefresh={refresh} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(m) => String(m.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ShelfRow
              manga={item}
              trackBy={trackBy}
              latestChapter={releases[item.id]?.latestChapter}
              latestVolume={releases[item.id]?.latestVolume}
            />
          )}
          ItemSeparatorComponent={DashedLine}
          contentContainerClassName="px-4 pb-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[c.accent]}
            />
          }
          ListEmptyComponent={
            manga ? (
              <Text className="pt-6 font-body text-[15px] text-ink-soft">
                {query.trim()
                  ? "Nothing on your shelf matches that."
                  : "Nothing here yet."}
              </Text>
            ) : undefined
          }
        />
      )}
      {lastDeleted || undoMessage ? (
        <Toast
          text={
            undoMessage ||
            `Deleted ${lastDeleted!.length === 1 ? lastDeleted![0]!.name : `${lastDeleted!.length} series`}`
          }
          action={lastDeleted && !undoing ? "Undo" : ""}
          onAction={() => void useShelf.getState().undoDelete()}
          onGone={() => {
            if (useShelf.getState().undoing) return;
            useShelf.getState().setLastDeleted(null);
            useShelf.getState().clearUndoMessage();
          }}
        />
      ) : null}
      <PickSheet
        open={picking === "tab"}
        options={TABS.map((t) => ({ ...t, count: counts[t.value] }))}
        picked={tab}
        onPick={setTab}
        onClose={() => setPicking(null)}
      />
      <PickSheet
        open={picking === "sort"}
        title="Sort by"
        options={SORT_OPTIONS}
        picked={sortBy}
        onPick={setSort}
        onClose={() => setPicking(null)}
      />
    </Safe>
  );
}
