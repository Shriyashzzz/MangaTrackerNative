// New, as the Android app's (web pages/Home, its New tab): Volumes, Chapters
// and In Japan with their counts; How New works, Hidden and Hide all; the
// Upcoming Releases bar; then what's out for each series. A short list is
// rows with Hide (a row with several behind opens the list of them); a long
// one, or any far behind, is sorted into piles, each a fan of covers that
// opens to all of them. Nothing new says why. Who's in, where, and the
// words are all the web's own (core shelfViews, piles, farBehind, newTabLinks)
import { Link, router } from "expo-router";
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
import Mascot from "@/components/Mascot";
import NewRow from "@/components/NewRow";
import ReleaseModal from "@/components/ReleaseModal";
import SeriesCover from "@/components/SeriesCover";
import Toast from "@/components/Toast";
import UpcomingReleases from "@/components/UpcomingReleases";
import { editionReleases } from "@/core/lib/editionNews";
import { ownsAny } from "@/core/lib/ownedVolumes";
import { checkedAgo } from "@/core/lib/releaseCache";
import { behindOf } from "@/core/lib/releaseMath";
import { CHECKED_BEFORE_KEY, LAST_NEW_COUNT_KEY } from "@/core/lib/shelf";
import type { Manga } from "@/core/lib/types";
import {
  FAR_BEHIND_NAMED,
  standing,
  type FarBehindSeries,
} from "@/core/pages/Home/farBehind";
import { stampFor } from "@/core/pages/Home/newTabLinks";
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
import {
  BIG_SHELF,
  filterShelf,
  isHiddenAs,
  newsFor,
  opensAList,
  RELEASE_KINDS,
  shelfCounts,
  type ReleaseKind,
} from "@/core/pages/Home/shelfViews";
import { readLocal, writeLocal } from "@/lib/deviceStore";
import { useHideActions } from "@/lib/useHideActions";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";
import { H2 } from "@/components/Page";

const Safe = withUniwind(SafeAreaView);

// covers in a pile's fan, as the web's on a phone
const FAN = 5;
const KINDS = Object.keys(RELEASE_KINDS) as ReleaseKind[];
// Hide all past this many asks twice
const ASK_FROM = 10;
const ASK_MS = 4000;

const Word = ({
  children,
  onPress,
  accent = false,
}: {
  children: string;
  onPress: () => void;
  accent?: boolean;
}) => (
  <Pressable onPress={onPress} hitSlop={6}>
    <Text
      className={`font-body-semibold text-[14px] underline ${accent ? "text-accent" : "text-ink"}`}
    >
      {children}
    </Text>
  </Pressable>
);

export default function NewScreen() {
  const manga = useShelf((s) => s.manga);
  const rawReleases = useShelf((s) => s.releases);
  const outcomes = useShelf((s) => s.outcomes);
  const checkedAt = useShelf((s) => s.checkedAt);
  const load = useShelf((s) => s.load);
  const checkReleases = useShelf((s) => s.checkReleases);
  const checksOn = usePrefs((s) => s.prefs.releaseChecks !== "off");
  // the side New opens on: Chapters for a reader who owns no volumes
  const newOpensOn: ReleaseKind =
    manga && !manga.some(ownsAny) ? "chapters" : "volumes";
  const [kindPicked, setKind] = useState<ReleaseKind | null>(null);
  const kind = kindPicked ?? newOpensOn;
  const [openPile, setOpenPile] = useState<Pile | null>(null);
  const [wantHidden, setWantHidden] = useState(false);
  const [openList, setOpenList] = useState<number | null>(null);
  const [askingHideAll, setAskingHideAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (manga && checksOn) void checkReleases();
  }, [manga, checksOn, checkReleases]);
  useEffect(() => {
    if (!askingHideAll) return;
    const timer = setTimeout(() => setAskingHideAll(false), ASK_MS);
    return () => clearTimeout(timer);
  }, [askingHideAll]);

  // a series collected as an edition is counted in its books (core editionNews)
  const releases = editionReleases(manga ?? [], rawReleases);
  const all = manga ?? [];
  const hiddenCount = all.filter((m) =>
    isHiddenAs(releases[m.id], kind),
  ).length;
  const viewingHidden = wantHidden && hiddenCount > 0;
  const listOf = (k: ReleaseKind, hidden = false) =>
    filterShelf(all, releases, {
      tab: "new",
      releaseKind: k,
      viewingHidden: hidden,
      query: "",
      sortBy: "",
    });
  const list = listOf(kind, viewingHidden);
  const counts = shelfCounts(all, releases);
  const kindCounts: Record<ReleaseKind, number> = {
    volumes: counts.newVolumes,
    chapters: counts.newChapters,
    japan: counts.newInJapan,
  };
  const piled =
    !viewingHidden &&
    (list.length >= PILES_FROM ||
      list.some((m) => pileOf(releases[m.id], kind) === "way"));
  const piles = sortIntoPiles(list, releases, kind);
  const hideActions = useHideActions({
    releases,
    releaseKind: kind,
    viewingHidden,
    shown: list,
  });

  // the check: how far it's got, and how fresh it all is
  const total = all.length;
  const checked = all.filter((m) => m.id in rawReleases).length;
  const checking = checksOn && checked < total;
  const oldestCheck = Math.min(
    ...all.map((m) => checkedAt[m.id] ?? Infinity),
    Infinity,
  );
  const [checkedBefore] = useState(
    () => readLocal(CHECKED_BEFORE_KEY) !== null,
  );
  useEffect(() => {
    if (checked > 0 && checked >= total) {
      writeLocal(CHECKED_BEFORE_KEY, "yes");
      writeLocal(LAST_NEW_COUNT_KEY, String(counts.new));
    }
  }, [checked, total, counts.new]);
  const bigShelfNote =
    checking && !checkedBefore && total >= BIG_SHELF
      ? "The first check on a big shelf can take a few minutes."
      : "";

  // nothing new: why (the web's NothingNew)
  const looked = all.filter((m) => kind === "volumes" || !m.lightNovel);
  const hasNoPlace = (m: Manga) => {
    if (m.status || m.planned) return false;
    if (kind === "chapters") return !m.bookmark;
    return !m.volumesOwned && releases[m.id]?.currentVolume == null;
  };
  const unknownPlace = looked.filter(hasNoPlace).length;
  const chapterOnly =
    kind === "chapters"
      ? 0
      : looked.filter((m) => hasNoPlace(m) && m.bookmark).length;
  const elsewhere = (["volumes", "chapters", "japan"] as ReleaseKind[])
    .map((k) => ({ kind: k, count: kindCounts[k] }))
    .find((s) => s.kind !== kind && s.count > 0);
  const heldBackSeries = looked.filter((m) => {
    const found = releases[m.id];
    if (!found || m.planned) return false;
    if (kind === "volumes")
      return !found.volumeListed && found.nextVolume != null;
    if (kind === "chapters")
      return !found.chapterListed && found.nextChapter != null && !m.status;
    return false;
  });
  const heldBack = heldBackSeries.length;
  const farBehind: FarBehindSeries[] =
    kind === "chapters" && newOpensOn === "chapters"
      ? heldBackSeries.map((m) => ({
          name: m.name,
          on: m.bookmark ?? 0,
          latest: releases[m.id]?.latestChapter ?? null,
        }))
      : [];
  const allFailed =
    !checking &&
    looked.length > 0 &&
    looked.every((m) => outcomes[m.id] === "failed");
  const notFound = looked.filter((m) => outcomes[m.id] === "notFound").length;

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const pickKind = (k: ReleaseKind) => {
    setKind(k);
    setOpenPile(null);
    setWantHidden(false);
  };
  const hideAll = () => {
    if (list.length >= ASK_FROM && !askingHideAll)
      return setAskingHideAll(true);
    setAskingHideAll(false);
    void hideActions.hideAll();
  };
  const openManga = all.find((m) => m.id === openList);
  const rowOf = (m: Manga) => {
    const found = releases[m.id];
    const opens = !viewingHidden && opensAList(found, kind);
    return (
      <NewRow
        manga={m}
        found={found}
        kind={kind}
        onHide={() => void hideActions.hide(m)}
        hideWord={viewingHidden ? "Show" : "Hide"}
        onOpenList={opens ? () => setOpenList(m.id) : undefined}
      />
    );
  };
  const toSettings = () =>
    router.push({ pathname: "/settings", params: { tab: "new-releases" } });

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
            {viewingHidden ? "Hidden" : "New"}
          </Text>
          <Text className="font-mono text-[14px] text-muted">
            {list.length}
          </Text>
        </View>

        {/* the check, while answers are missing */}
        {checking && total > 0 ? (
          <View className="gap-1">
            <View className="h-1 overflow-hidden rounded-full bg-line-soft">
              <View
                className="h-full bg-accent"
                style={{ width: `${(checked / total) * 100}%` }}
              />
            </View>
            <Text className="font-mono text-[12px] text-muted">
              Checking {checked} of {total}
              {bigShelfNote ? ` · ${bigShelfNote}` : ""}
            </Text>
          </View>
        ) : null}

        {!viewingHidden && !openPile ? <UpcomingReleases /> : null}

        {/* Volumes, Chapters, In Japan: one segmented switch */}
        <View className="flex-row overflow-hidden rounded-[4px] border-2 border-line">
          {KINDS.map((k, i) => {
            const on = k === kind;
            const nothingNew = !allFailed && kindCounts[k] === 0;
            return (
              <Pressable
                key={k}
                onPress={() => pickKind(k)}
                accessibilityState={{ selected: on }}
                className={`flex-1 flex-row items-baseline justify-center gap-1.5 py-2.5 ${on ? "bg-accent" : ""} ${i ? "border-l-2 border-line" : ""}`}
              >
                <Text
                  className={`font-brand pr-1 text-[17px] tracking-[1px] uppercase ${on ? "text-on-accent" : nothingNew ? "text-muted" : "text-ink-soft"}`}
                >
                  {RELEASE_KINDS[k].label}
                </Text>
                {!allFailed ? (
                  <Text
                    className={`font-mono text-[13px] ${on ? "text-on-accent" : "text-muted"}`}
                  >
                    {kindCounts[k]}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {viewingHidden ? (
          <Text className="font-body text-[14px] text-ink-soft">
            What you've hidden under {RELEASE_KINDS[kind].label}. Show one to
            put it back.
          </Text>
        ) : RELEASE_KINDS[kind].note ? (
          <Text className="font-body text-[14px] text-ink-soft">
            {RELEASE_KINDS[kind].note}
          </Text>
        ) : null}

        {/* How New works, Hidden, Hide all */}
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
          <Pressable
            onPress={() => router.push("/new-releases")}
            hitSlop={6}
            className="flex-row items-center gap-1.5"
          >
            <View className="h-5 w-5 items-center justify-center rounded-full bg-accent">
              <Text className="font-brand pr-1 text-[12px] text-on-accent">
                ?
              </Text>
            </View>
            <Text className="font-body-medium text-[14px] text-ink">
              How New works
            </Text>
          </Pressable>
          {hiddenCount > 0 && !viewingHidden ? (
            <Word
              onPress={() => setWantHidden(true)}
            >{`Hidden (${hiddenCount})`}</Word>
          ) : null}
          {viewingHidden ? (
            <>
              <Word onPress={() => void hideActions.unhideAll()}>
                Unhide all
              </Word>
              <Word onPress={() => setWantHidden(false)}>Back to New</Word>
            </>
          ) : null}
          {list.length > 0 && !viewingHidden ? (
            <Pressable
              onPress={hideAll}
              hitSlop={6}
              className="ml-auto rounded-[3px] border-[1.5px] border-line px-2.5 py-1"
            >
              <Text className="font-body-medium text-[13.5px] text-ink">
                {askingHideAll
                  ? `Hide all ${list.length}? Press again`
                  : `Hide all ${list.length}`}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {list.length === 0 ? (
          <View className="items-center gap-3 pt-6">
            <Mascot mood="happy" width={110} />
            {farBehind.length > 0 ? (
              <View className="gap-2">
                {farBehind.length > 1 ? (
                  <View className="gap-1">
                    {farBehind.slice(0, FAR_BEHIND_NAMED).map((one) => (
                      <Text
                        key={one.name}
                        className="font-body text-[14px] text-ink-soft"
                      >
                        <Text className="font-body-semibold text-ink">
                          {one.name}:
                        </Text>{" "}
                        {standing(one)}
                      </Text>
                    ))}
                    {farBehind.length > FAR_BEHIND_NAMED ? (
                      <Text className="font-body text-[14px] text-ink-soft">
                        +{farBehind.length - FAR_BEHIND_NAMED} more
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <Text className="text-center font-body text-[14.5px] text-ink-soft">
                  New chapters show here once you're nearly caught up.{" "}
                  <Text
                    className="font-body-semibold text-ink underline"
                    onPress={toSettings}
                  >
                    Change what New shows
                  </Text>
                </Text>
              </View>
            ) : heldBack > 0 ? (
              <>
                <Text className="text-center font-display text-[22px] text-ink">
                  Nothing this close to caught up.
                </Text>
                <Text className="text-center font-body text-[14.5px] text-ink-soft">
                  {heldBack === 1
                    ? "1 series is further behind than your setting shows. "
                    : `${heldBack} series are further behind than your setting shows. `}
                  <Text
                    className="font-body-semibold text-ink underline"
                    onPress={toSettings}
                  >
                    Change what New shows
                  </Text>
                </Text>
              </>
            ) : (
              <>
                <Text className="text-center font-display text-[22px] text-ink">
                  {looked.length > 0 && chapterOnly === looked.length
                    ? "We know your chapter, not your volume."
                    : looked.length > 0 && unknownPlace === looked.length
                      ? "We don't know where you're up to yet."
                      : viewingHidden
                        ? "Nothing hidden."
                        : RELEASE_KINDS[kind].emptyTitle}
                </Text>
                {unknownPlace < looked.length ? (
                  <Text className="text-center font-body text-[15px] text-ink-soft">
                    {RELEASE_KINDS[kind].emptyBody}
                  </Text>
                ) : null}
                {unknownPlace > 0 &&
                (chapterOnly === looked.length ||
                  unknownPlace === looked.length) ? (
                  <Text className="text-center font-body text-[14.5px] text-ink-soft">
                    {chapterOnly === looked.length
                      ? "We can't tell which volume your chapter is in. "
                      : ""}
                    {kind === "chapters"
                      ? "Add the last chapter you read and we'll tell you when the next one's out."
                      : "Add the volumes you own and we'll tell you when the next one's out."}
                  </Text>
                ) : null}
              </>
            )}
            {elsewhere ? (
              <Word
                onPress={() => pickKind(elsewhere.kind)}
                accent
              >{`See ${elsewhere.count} under ${RELEASE_KINDS[elsewhere.kind].label}`}</Word>
            ) : null}
            {looked.length < total ? (
              <Text className="font-body text-[13px] text-muted">
                Light novels aren't checked for new releases yet.
              </Text>
            ) : null}
            {!checking && notFound > 0 ? (
              <Text className="text-center font-body text-[13px] text-muted">
                {notFound === looked.length
                  ? "We couldn't find release news for any of your series."
                  : notFound === 1
                    ? "We couldn't find release news for 1 of your series."
                    : `We couldn't find release news for ${notFound} of your series.`}
              </Text>
            ) : null}
          </View>
        ) : piled ? (
          PILES.filter(
            (p) => piles[p].length && (!openPile || openPile === p),
          ).map((p) => (
            <View key={p} className="gap-2 border-t border-line pt-3">
              <View className="flex-row items-end justify-between">
                <H2>
                  {PILE_TEXT[kind][p].name}{" "}
                  <Text className="font-mono text-[14px] text-muted">
                    {piles[p].length}
                  </Text>
                </H2>
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
                {checking && (p === "few" || p === "way") ? " so far" : ""}
              </Text>
              {openPile === p ? (
                piles[p].map((m, i) => (
                  <View key={m.id}>
                    {i > 0 && <DashedLine />}
                    {rowOf(m)}
                  </View>
                ))
              ) : (
                <View className="flex-row gap-2.5">
                  {piles[p].slice(0, FAN).map((m) => {
                    const found = releases[m.id];
                    const opens = opensAList(found, kind);
                    const inside = (
                      <Pressable
                        onPress={opens ? () => setOpenList(m.id) : undefined}
                        className="w-[58px] gap-1 active:opacity-70"
                      >
                        <View>
                          <SeriesCover
                            name={m.name}
                            lightNovel={m.lightNovel}
                            url={m.image}
                            width={58}
                          />
                          {stampFor(found, kind) ? (
                            <View className="absolute -top-2 -left-1 bg-accent px-1">
                              <Text className="font-brand pr-1 text-[12px] tracking-[0.5px] text-on-accent uppercase">
                                {stampFor(found, kind)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {p !== "one" ? (
                          <Text
                            numberOfLines={1}
                            className="font-body text-[12px] text-ink-soft"
                          >
                            {behindOf(found, kind)} {COUNT_WORD[kind]}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                    return opens ? (
                      <View key={m.id}>{inside}</View>
                    ) : (
                      <Link key={m.id} href={`/details/${m.id}`} asChild>
                        {inside}
                      </Link>
                    );
                  })}
                </View>
              )}
            </View>
          ))
        ) : (
          list.map((m, i) => (
            <View key={m.id}>
              {i > 0 && <DashedLine />}
              {rowOf(m)}
            </View>
          ))
        )}

        {/* a list their setting has shortened says so, under it */}
        {!viewingHidden && !openPile && heldBack > 0 && list.length > 0 ? (
          <Text className="text-center font-body text-[13.5px] text-ink-soft">
            {heldBack === 1
              ? "1 series is further behind than your setting shows. "
              : `${heldBack} series are further behind than your setting shows. `}
            <Text
              className="font-body-semibold text-ink underline"
              onPress={toSettings}
            >
              Change what New shows
            </Text>
          </Text>
        ) : null}
        {!checking && Number.isFinite(oldestCheck) ? (
          <Text className="text-center font-mono text-[12px] text-muted">
            Checked {checkedAgo(oldestCheck)}
          </Text>
        ) : null}
      </ScrollView>

      {hideActions.hidden || hideActions.failed ? (
        <Toast
          text={
            hideActions.failed
              ? "That didn't save. Try again."
              : `${hideActions.hidden!.restored ? "Back on the list" : "Hidden"}: ${hideActions.hidden!.name}`
          }
          action={hideActions.failed ? "" : "Undo"}
          onAction={() => void hideActions.undo()}
          onGone={hideActions.dismiss}
        />
      ) : null}
      {openManga && releases[openManga.id] ? (
        <ReleaseModal
          manga={openManga}
          found={releases[openManga.id]!}
          yours={newsFor(openManga, releases[openManga.id], kind).yours}
          kind={kind === "chapters" ? "chapters" : "volumes"}
          onClose={() => setOpenList(null)}
        />
      ) : null}
    </Safe>
  );
}
