// My shelf, as the Android app's: the tab's name and count in the shelf's
// bar ("ALL 40 ▾", a tap picks another tab), search and sort beside it, then
// a row per series. Pull down to load it again. Volumes is its own view
// (VolumesView). Who's in each tab, the search and the sort are the web's own
// rules (core filterShelf); it opens on the tab and sort the account chose
import { columnStyle } from "@/lib/wide";
import TourTarget from "@/components/TourTarget";
import { useTour } from "@/store/tour";
import Tap from "@/components/Tap";
import Backdrop from "@/components/Backdrop";
import GuestShelf from "@/components/GuestShelf";
import { useAuth } from "@/store/auth";
import { useEffect, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import Animated, {
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PullPage from "@/components/PullRefresh";
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

function SignedInShelf() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const manga = useShelf((s) => s.manga);
  const failed = useShelf((s) => s.failed);
  const load = useShelf((s) => s.load);
  const releases = useShelf((s) => s.releases);
  const totals = useShelf((s) => s.totals);
  const checkReleases = useShelf((s) => s.checkReleases);
  const prefs = usePrefs((s) => s.prefs);
  const checksOn = prefs.releaseChecks !== "off";
  const trackBy = prefs.trackBy ?? DEFAULT_TRACK_BY;
  // what the account chose until they pick here
  // Kenji's tour: a step about the shelf's Volumes view opens the shelf on
  // it (and one about the list, on All). Their own pick wins again as soon
  // as they make one on that step
  const tourAt = useTour((t) => (t.steps.length ? t.at : -1));
  const tourTab = useTour((t) => {
    const its = t.steps[t.at]?.tab;
    return its === "volumes" || its === "all" ? its : null;
  });
  const [picked, setPicked] = useState<{ tab: TabId; at: number } | null>(null);
  const setTab = (to: TabId) => setPicked({ tab: to, at: tourAt });
  const tabPicked =
    picked && (tourTab === null || picked.at === tourAt) ? picked.tab : null;
  const [sortPicked, setSort] = useState<ShelfSort | null>(null);
  const tab =
    tabPicked ?? tourTab ?? (isTab(prefs.shelfTab) ? prefs.shelfTab : "all");
  const sortBy = sortPicked ?? prefs.shelfSort ?? "";
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState<"tab" | "sort" | null>(null);
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

  // how far the shelf is scrolled: a pull to refresh starts only from 0
  const scrollTop = useSharedValue(0);
  // the + button: 0 in place, 1 slid away under the tab bar
  const fabAway = useSharedValue(0);
  const fabHidden = useSharedValue(false);
  const lastY = useSharedValue(0);
  // on the UI thread: the + leaves as they read down the shelf and comes
  // back the moment they scroll up, as the Android app's does
  const onShelfScroll = useAnimatedScrollHandler((e) => {
    const y = e.contentOffset.y;
    scrollTop.set(y);
    const moved = y - lastY.get();
    if (Math.abs(moved) < 6) return;
    lastY.set(y);
    const hide = moved > 0 && y > 40;
    if (hide === fabHidden.get()) return;
    fabHidden.set(hide);
    fabAway.set(withTiming(hide ? 1 : 0, { duration: 200 }));
  });
  // "Select several" on a row: Select starts with that row picked
  const selectFrom = (id: number) => {
    select.start();
    select.toggle(id);
  };
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
      <Backdrop />
      <AppHeader />
      {/* everything under the header pulls down to refresh */}
      <PullPage refresh={load} scrollTop={scrollTop}>
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
              <Tap
                feel="round"
                onPress={closeSearch}
                hitSlop={10}
                accessibilityLabel="Close search"
              >
                <CloseIcon color={c.inkSoft} width={18} height={18} />
              </Tap>
            </View>
          ) : (
            <Tap
              onPress={() => setPicking("tab")}
              className="flex-1 flex-row items-baseline gap-2"
              accessibilityLabel={`Showing ${shown.label}, ${counts[tab]}. Change what's shown`}
            >
              <Text className="font-brand pr-[7px] text-[30px] tracking-[1px] text-ink uppercase">
                {shown.label}
                {"\u00A0"}
              </Text>
              <Text className="font-mono text-[14px] text-muted">
                {counts[tab]}
              </Text>
              <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
            </Tap>
          )}
          {searching ? null : (
            <Tap
              feel="round"
              onPress={() => setSearching(true)}
              hitSlop={8}
              className="p-2"
              accessibilityLabel="Search your shelf"
            >
              <SearchIcon color={c.ink} width={22} height={22} />
            </Tap>
          )}
          <Tap
            feel="round"
            onPress={() => setPicking("sort")}
            hitSlop={8}
            className="p-2"
            accessibilityLabel={`Sorted by ${sortLabel}. Change the order`}
          >
            <SortIcon
              color={sortBy ? c.accent : c.ink}
              width={22}
              height={22}
            />
          </Tap>
          {tab !== "volumes" && !select.selectOn && !searching ? (
            <Tap
              // on the way down, not on release: it answers at once
              onPressIn={select.start}
              hitSlop={8}
              className="py-2 pl-1"
              accessibilityLabel="Select several"
            >
              <Text className="font-body-semibold text-[14.5px] text-ink">
                Select
              </Text>
            </Tap>
          ) : null}
        </View>
        <View className="mx-4 h-px bg-line" />
        {failed && !manga ? (
          <Text className="px-4 pt-6 font-body text-[15px] text-ink-soft">
            {failed}
          </Text>
        ) : tab === "volumes" ? (
          <VolumesView manga={list} scrollTop={scrollTop} />
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
                    // the fresh answer once it's in; until then (or if the
                    // check failed) how far the series went last time,
                    // kept on the phone
                    latestChapter={
                      releases[item.id]?.latestChapter ??
                      totals[item.id]?.chapter
                    }
                    latestVolume={
                      releases[item.id]?.latestVolume ?? totals[item.id]?.volume
                    }
                    selecting={select.selectOn}
                    checked={select.selectOn && select.picked.has(item.id)}
                    onToggle={select.toggle}
                    onSelectSeveral={selectFrom}
                  />
                </Animated.View>
              )}
              ItemSeparatorComponent={DashedLine}
              // room under the last row for the floating +
              contentContainerClassName="px-4 pb-28"
              contentContainerStyle={columnStyle}
              // the first screenful at once, the rest in small batches
              initialNumToRender={9}
              maxToRenderPerBatch={8}
              windowSize={9}
              // the pull to refresh is the app's own: no system stretch
              overScrollMode="never"
              scrollEventThrottle={16}
              onScroll={onShelfScroll}
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
      </PullPage>
      {/* the floating +: type a title or scan a barcode. Not over Volumes */}
      {tab !== "volumes" && !select.selectOn ? (
        <Animated.View
          style={[
            { position: "absolute", right: 16, bottom: insets.bottom + 20 },
            fabStyle,
          ]}
        >
          <TourTarget name="scan" round>
            <Tap
              onPress={() => setAdding(true)}
              accessibilityLabel="Add manga"
              className="h-14 w-14 items-center justify-center rounded-full bg-accent active:opacity-90"
              style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.35)" }}
            >
              <PlusIcon color={c.onAccent} width={26} height={26} />
            </Tap>
          </TourTarget>
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

// the shelf tab: their shelf, or what a shelf is for when nobody's signed in
export default function ShelfScreen() {
  const isSignedIn = useAuth((st) => st.isSignedIn);
  const insets = useSafeAreaInsets();
  if (isSignedIn) return <SignedInShelf />;
  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <Backdrop />
      <AppHeader />
      <GuestShelf />
    </View>
  );
}
