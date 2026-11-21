// New, as the Android app's: Volumes, Chapters and In Japan, each with its
// count; then what's out for each series. A short list is rows with Hide; a
// long one, or any far behind, is sorted into piles ("Next for you", "A few
// behind", "Long reads ahead"), each a fan of covers that opens to all of
// them. Who's in, where, and the words are all the web's own (core
// shelfViews, piles, newTabLinks)
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AppHeader from "@/components/AppHeader";
import DashedLine from "@/components/DashedLine";
import NewRow from "@/components/NewRow";
import SeriesCover from "@/components/SeriesCover";
import { editionReleases } from "@/core/lib/editionNews";
import { behindOf } from "@/core/lib/releaseMath";
import { saveSeen } from "@/core/lib/shelf";
import type { Manga } from "@/core/lib/types";
import {
  catchUpText,
  COUNT_WORD,
  PILE_TEXT,
  PILES,
  PILES_FROM,
  pileOf,
  sortIntoPiles,
  type Pile,
} from "@/core/pages/Home/piles";
import { stampFor } from "@/core/pages/Home/newTabLinks";
import {
  filterShelf,
  newestOf,
  RELEASE_KINDS,
  SEEN_KIND,
  type ReleaseKind,
} from "@/core/pages/Home/shelfViews";
import { useShelf } from "@/store/shelf";

const Safe = withUniwind(SafeAreaView);

// covers in a pile's fan, as the web's on a phone
const FAN = 5;
const KINDS = Object.keys(RELEASE_KINDS) as ReleaseKind[];

export default function NewScreen() {
  const manga = useShelf((s) => s.manga);
  const rawReleases = useShelf((s) => s.releases);
  const load = useShelf((s) => s.load);
  const checkReleases = useShelf((s) => s.checkReleases);
  const hideLocally = useShelf((s) => s.hide);
  const [kind, setKind] = useState<ReleaseKind>("volumes");
  const [openPile, setOpenPile] = useState<Pile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (manga) void checkReleases();
  }, [manga, checkReleases]);

  // a series collected as an edition is counted in its books (core editionNews)
  const releases = editionReleases(manga ?? [], rawReleases);
  const listOf = (k: ReleaseKind) =>
    filterShelf(manga ?? [], releases, {
      tab: "new",
      releaseKind: k,
      viewingHidden: false,
      query: "",
      sortBy: "",
    });
  const list = listOf(kind);
  const piled =
    list.length >= PILES_FROM ||
    list.some((m) => pileOf(releases[m.id], kind) === "way");
  const piles = sortIntoPiles(list, releases, kind);

  const hide = (m: Manga) => {
    const number = newestOf(releases[m.id], kind) ?? null;
    hideLocally(m.id, kind);
    saveSeen(m.id, SEEN_KIND[kind], number).catch(() => void load());
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <AppHeader />
      <ScrollView
        contentContainerClassName="gap-4 px-4 pt-5 pb-10"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View className="flex-row items-baseline gap-2">
          <Text className="font-brand pr-1 text-[30px] tracking-[1px] text-ink uppercase">
            New
          </Text>
          <Text className="font-mono text-[14px] text-muted">
            {list.length}
          </Text>
        </View>

        {/* Volumes, Chapters, In Japan: one segmented switch */}
        <View className="flex-row overflow-hidden rounded-[4px] border-2 border-line">
          {KINDS.map((k, i) => {
            const on = k === kind;
            return (
              <Pressable
                key={k}
                onPress={() => {
                  setKind(k);
                  setOpenPile(null);
                }}
                className={`flex-1 flex-row items-baseline justify-center gap-1.5 py-2.5 ${on ? "bg-accent" : ""} ${i ? "border-l-2 border-line" : ""}`}
              >
                <Text
                  className={`font-brand pr-1 text-[17px] tracking-[1px] uppercase ${on ? "text-on-accent" : "text-ink-soft"}`}
                >
                  {RELEASE_KINDS[k].label}
                </Text>
                <Text
                  className={`font-mono text-[13px] ${on ? "text-on-accent" : "text-muted"}`}
                >
                  {listOf(k).length}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {RELEASE_KINDS[kind].note ? (
          <Text className="font-body text-[14px] text-ink-soft">
            {RELEASE_KINDS[kind].note}
          </Text>
        ) : null}

        {list.length === 0 ? (
          <View className="items-center gap-1 pt-10">
            <Text className="text-center font-display text-[22px] text-ink">
              {RELEASE_KINDS[kind].emptyTitle}
            </Text>
            <Text className="font-body text-[15px] text-ink-soft">
              {RELEASE_KINDS[kind].emptyBody}
            </Text>
          </View>
        ) : piled ? (
          PILES.filter(
            (p) => piles[p].length && (!openPile || openPile === p),
          ).map((p) => (
            <View key={p} className="gap-2 border-t border-line pt-3">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
                  {PILE_TEXT[kind][p].name}{" "}
                  <Text className="font-mono text-[14px] text-muted">
                    {piles[p].length}
                  </Text>
                </Text>
                <Pressable
                  onPress={() => setOpenPile(openPile === p ? null : p)}
                  hitSlop={8}
                >
                  <Text className="font-body-semibold text-[14px] text-ink">
                    {openPile === p ? "Back" : "See all"}
                  </Text>
                </Pressable>
              </View>
              <Text className="font-body text-[13.5px] text-ink-soft">
                {PILE_TEXT[kind][p].why}
                {catchUpText(p, piles[p], releases, kind)}
              </Text>
              {openPile === p ? (
                piles[p].map((m, i) => (
                  <View key={m.id}>
                    {i > 0 && <DashedLine />}
                    <NewRow
                      manga={m}
                      found={releases[m.id]}
                      kind={kind}
                      onHide={() => hide(m)}
                    />
                  </View>
                ))
              ) : (
                <View className="flex-row gap-2.5">
                  {piles[p].slice(0, FAN).map((m) => (
                    <Link key={m.id} href={`/details/${m.id}`} asChild>
                      <Pressable className="w-[58px] gap-1 active:opacity-70">
                        <View>
                          <SeriesCover
                            name={m.name}
                            lightNovel={m.lightNovel}
                            url={m.image}
                            width={58}
                          />
                          {stampFor(releases[m.id], kind) ? (
                            <View className="absolute -top-2 -left-1 bg-accent px-1">
                              <Text className="font-brand pr-1 text-[12px] tracking-[0.5px] text-on-accent uppercase">
                                {stampFor(releases[m.id], kind)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {p !== "one" ? (
                          <Text
                            numberOfLines={1}
                            className="font-body text-[12px] text-ink-soft"
                          >
                            {behindOf(releases[m.id], kind)} {COUNT_WORD[kind]}
                          </Text>
                        ) : null}
                      </Pressable>
                    </Link>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          list.map((m, i) => (
            <View key={m.id}>
              {i > 0 && <DashedLine />}
              <NewRow
                manga={m}
                found={releases[m.id]}
                kind={kind}
                onHide={() => hide(m)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Safe>
  );
}
