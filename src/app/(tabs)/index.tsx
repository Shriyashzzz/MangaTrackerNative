// My shelf, as the Android app's: the tab's name and count in the shelf's
// bar ("ALL 40 ▾", a tap picks another tab), search and sort beside it, then
// a row per series. Pull down to load it again. Volumes is its own view
// (VolumesView). Who's in each tab, the search and the sort are the web's own
// rules (core filterShelf); it opens on the tab and sort the account chose
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useKenjiRefresh } from "@/components/PullRefresh";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AppHeader from "@/components/AppHeader";
import DashedLine from "@/components/DashedLine";
import PickSheet from "@/components/PickSheet";
import ShelfRow from "@/components/ShelfRow";
import Toast from "@/components/Toast";
import VolumesView from "@/components/VolumesView";
import AddChoice from "@/components/AddChoice";
import SelectDock, { MovedNote } from "@/components/SelectDock";
import { useSelectMode } from "@/lib/useSelectMode";
import { router } from "expo-router";
import {
  ChevronDownIcon,
  CloseIcon,
  PlusIcon,
  SearchIcon,
  SortIcon,
} from "@/core/components/icons/Icons";
import { SORT_OPTIONS, type ShelfSort } from "@/core/lib/shelf";
import { filterShelf, shelfCounts } from "@/core/pages/Home/shelfViews";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";
import { DEFAULT_TRACK_BY } from "@/lib/trackBy";

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
  const insets = useSafeAreaInsets();
  const manga = useShelf((s) => s.manga);
  const failed = useShelf((s) => s.failed);
  const load = useShelf((s) => s.load);
  const releases = useShelf((s) => s.releases);
  const checkReleases = useShelf((s) => s.checkReleases);
  const prefs = usePrefs((s) => s.prefs);
  const checksOn = prefs.releaseChecks !== "off";
  const trackBy = prefs.trackBy ?? DEFAULT_TRACK_BY;
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
  const [adding, setAdding] = useState(false);
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
  // Select: several moved or deleted at once, with undo. Not on Volumes
  const select = useSelectMode({
    canSelect: tab !== "volumes" && Boolean(manga?.length),
    shown: list,
  });
  const askToDeletePicked = () => {
    const picked = select.pickedShown;
    const one = picked.length === 1 ? picked[0]! : null;
    Alert.alert(
      `Delete ${one ? one.name : `${picked.length} series`}?`,
      one
        ? "It comes off your shelf with its volumes and books, rating, reading progress and notes."
        : `${picked
            .slice(0, 5)
            .map((m) => m.name)
            .join(
              ", ",
            )}${picked.length > 5 ? ` and ${picked.length - 5} more` : ""}. They come off your shelf with their volumes, ratings and reading progress.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => select.setConfirmingDelete(false),
        },
        {
          text: one ? "Delete it" : `Delete ${picked.length}`,
          style: "destructive",
          onPress: () => {
            void select.deletePicked().then((done) => {
              if (!done) Alert.alert("That didn't delete them. Try again.");
            });
          },
        },
      ],
    );
  };
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Last updated";

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  // where the list begins, under the header and the shelf's bar
  const [listTop, setListTop] = useState(0);
  const pull = useKenjiRefresh(load, listTop);
  // the + button: 0 in place, 1 slid away under the tab bar
  const fabAway = useSharedValue(0);
  const fabHidden = useRef(false);
  const lastY = useRef(0);
  const fabStyle = useAnimatedStyle(() => ({
    opacity: 1 - fabAway.value,
    transform: [
      { translateY: fabAway.value * 90 },
      { scale: 1 - fabAway.value * 0.2 },
    ],
  }));
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
          <View className="flex-1 flex-row items-center gap-2 rounded-[14px] border border-line-soft bg-card px-3">
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
        {tab !== "volumes" && !select.selectOn && !searching ? (
          <Pressable
            // on the way down, not on release: it answers at once
            onPressIn={select.start}
            hitSlop={8}
            className="py-2 pl-1"
            accessibilityLabel="Select several"
          >
            <Text className="font-body-semibold text-[14.5px] text-ink">
              Select
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View
        className="mx-4 h-px bg-line"
        onLayout={(e) => setListTop(e.nativeEvent.layout.y + 1)}
      />
      {failed && !manga ? (
        <Text className="px-4 pt-6 font-body text-[15px] text-ink-soft">
          {failed}
        </Text>
      ) : tab === "volumes" ? (
        <VolumesView manga={list} refreshing={refreshing} onRefresh={refresh} />
      ) : (
        <LayoutAnimationConfig skipEntering>
          <Animated.FlatList
            data={list}
            // a series moved or deleted: the rows close up rather than jump
            itemLayoutAnimation={LinearTransition.duration(220)}
            keyExtractor={(m) => String(m.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Animated.View exiting={FadeOut.duration(160)}>
                <ShelfRow
                  manga={item}
                  trackBy={trackBy}
                  latestChapter={releases[item.id]?.latestChapter}
                  latestVolume={releases[item.id]?.latestVolume}
                  select={
                    select.selectOn
                      ? {
                          checked: select.picked.has(item.id),
                          onToggle: () => select.toggle(item.id),
                        }
                      : undefined
                  }
                  onLongPress={() => {
                    select.start();
                    select.toggle(item.id);
                  }}
                />
              </Animated.View>
            )}
            ItemSeparatorComponent={DashedLine}
            // room under the last row for the floating +
            contentContainerClassName="px-4 pb-28"
            refreshControl={pull.refreshControl}
            scrollEventThrottle={32}
            onScroll={(e) => {
              // the + leaves as they read down the shelf, and comes back
              // the moment they scroll up, as the Android app's does
              const y = e.nativeEvent.contentOffset.y;
              const moved = y - lastY.current;
              if (Math.abs(moved) < 6) return;
              lastY.current = y;
              const hide = moved > 0 && y > 40;
              if (hide !== fabHidden.current) {
                fabHidden.current = hide;
                fabAway.set(withTiming(hide ? 1 : 0, { duration: 200 }));
              }
            }}
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
        </LayoutAnimationConfig>
      )}
      {tab !== "volumes" ? pull.indicator : null}
      {/* the floating +: type a title or scan a barcode. Not over Volumes */}
      {tab !== "volumes" && !select.selectOn ? (
        <Animated.View
          style={[
            { position: "absolute", right: 16, bottom: insets.bottom + 20 },
            fabStyle,
          ]}
        >
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityLabel="Add manga"
            className="h-14 w-14 items-center justify-center rounded-full bg-accent active:opacity-90"
            style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.35)" }}
          >
            <PlusIcon color={c.onAccent} width={26} height={26} />
          </Pressable>
        </Animated.View>
      ) : null}
      {adding ? (
        <AddChoice
          onType={() => router.push("/add")}
          onScan={() => router.push("/scan")}
          onClose={() => setAdding(false)}
        />
      ) : null}
      {select.selectOn ? (
        <SelectDock
          select={{
            ...select,
            setConfirmingDelete: (on) => {
              select.setConfirmingDelete(on);
              if (on) askToDeletePicked();
            },
          }}
          shown={list}
          tab={tab}
        />
      ) : (
        <View
          className="absolute inset-x-3"
          style={{ bottom: insets.bottom + 16 }}
        >
          <MovedNote select={select} />
        </View>
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
