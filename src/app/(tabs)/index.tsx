// My shelf, as the Android app's: the tab's name and count in the shelf's
// bar ("ALL 40 ▾", a tap picks another tab), then a row per series. Pull down
// to load it again. Volumes is its own view (VolumesView). Search, sort and
// Select come later
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AppHeader from "@/components/AppHeader";
import DashedLine from "@/components/DashedLine";
import ShelfRow from "@/components/ShelfRow";
import VolumesView from "@/components/VolumesView";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { filterShelf, shelfCounts } from "@/core/pages/Home/shelfViews";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";

const Safe = withUniwind(SafeAreaView);

// the shelf's tabs, as the web's (pages/Home/Home.tsx); who's in each is the
// web's own rule (core filterShelf), and Volumes counts volumes, not series
const TABS = [
  { id: "all", label: "All" },
  { id: "ongoing", label: "Reading" },
  { id: "finished", label: "Finished" },
  { id: "planned", label: "To read" },
  { id: "volumes", label: "Volumes" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function ShelfScreen() {
  const c = useColors();
  const manga = useShelf((s) => s.manga);
  const failed = useShelf((s) => s.failed);
  const load = useShelf((s) => s.load);
  const releases = useShelf((s) => s.releases);
  const checkReleases = useShelf((s) => s.checkReleases);
  const checksOn = usePrefs((s) => s.prefs.releaseChecks !== "off");
  const trackBy = usePrefs((s) => s.prefs.trackBy ?? "series");
  const [tab, setTab] = useState<TabId>("all");
  const [picking, setPicking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);
  // what's out for each series, once the shelf is here (the rows' "of 13")
  useEffect(() => {
    if (manga && checksOn) void checkReleases();
  }, [manga, checksOn, checkReleases]);

  const shown = TABS.find((t) => t.id === tab)!;
  const listOf = (id: TabId) =>
    filterShelf(manga ?? [], releases, {
      tab: id,
      releaseKind: "volumes",
      viewingHidden: false,
      query: "",
      sortBy: "",
    });
  const list = listOf(tab);
  const counts = shelfCounts(manga ?? [], releases);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <AppHeader />
      {/* the shelf's bar: which tab, how many */}
      <View className="flex-row items-center px-4 pt-5 pb-2">
        <Pressable
          onPress={() => setPicking(true)}
          className="flex-row items-baseline gap-2"
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
      </View>
      <View className="mx-4 h-px bg-line" />
      {failed && !manga ? null : tab === "volumes" ? (
        <VolumesView manga={list} refreshing={refreshing} onRefresh={refresh} />
      ) : null}
      {failed && !manga ? (
        <Text className="px-4 pt-6 font-body text-[15px] text-ink-soft">
          {failed}
        </Text>
      ) : tab === "volumes" ? null : (
        <FlatList
          data={list}
          keyExtractor={(m) => String(m.id)}
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
                Nothing here yet.
              </Text>
            ) : undefined
          }
        />
      )}
      {/* the tab picker, as an Android sheet */}
      <Modal
        visible={picking}
        transparent
        animationType="slide"
        onRequestClose={() => setPicking(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setPicking(false)}
        />
        <View className="rounded-t-2xl bg-card px-2 pt-2 pb-8">
          <View className="mb-2 h-1 w-9 self-center rounded-full bg-muted/50" />
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => {
                setTab(t.id);
                setPicking(false);
              }}
              className="flex-row items-center justify-between rounded-lg px-4 py-3.5 active:bg-accent-wash"
            >
              <Text
                className={`font-body text-[16px] ${t.id === tab ? "font-body-semibold text-ink" : "text-ink-soft"}`}
              >
                {t.label}
              </Text>
              <Text className="font-mono text-[14px] text-muted">
                {counts[t.id]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </Safe>
  );
}
