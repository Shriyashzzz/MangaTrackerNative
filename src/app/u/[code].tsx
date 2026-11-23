// Someone's shared shelf, as the web's pages/SharedShelf/SharedShelf.tsx:
// who it is, their counts and a fan of covers, Follow (someone else's) or
// what others see (their own), their top picks or favourites, the shelf's
// facts, how it sits beside the viewer's own shelf, then Reading, Finished,
// To read and To get as tabs over a searched, sorted list of rows or
// covers. A series opens as a sheet with its facts, synopsis, notes, spines
// and the way to its prices. The rules are the web's (core SharedShelf)
import { useCorners } from "@/lib/mangaThemes";
import TextBox from "@/components/TextBox";
import Tap from "@/components/Tap";
import { openOutside } from "@/lib/openOutside";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Share, Text, View } from "react-native";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Mascot from "@/components/Mascot";
import Page, { H2, P } from "@/components/Page";
import PickSheet from "@/components/PickSheet";
import Segmented from "@/components/Segmented";
import SeriesCover from "@/components/SeriesCover";
import Sheet from "@/components/Sheet";
import StarRating from "@/components/StarRating";
import Switch from "@/components/Switch";
import {
  ChevronDownIcon,
  LinkIcon,
  SearchIcon,
  StarIcon,
} from "@/core/components/icons/Icons";
import {
  getSharedShelf,
  saveShareTop,
  shareUrl,
  type SharedShelf,
} from "@/core/lib/account";
import { apiFetch } from "@/core/lib/api";
import { dayName } from "@/core/lib/collector";
import { setFollowing } from "@/core/lib/friends";
import { formatCents, priceName } from "@/core/lib/prices";
import { seriesPath, volumePath } from "@/core/lib/pricePaths";
import { placeText } from "@/core/lib/reading";
import { titleKey as sameName } from "@/core/lib/titleKey";
import { addToRead } from "@/core/pages/SharedShelf/addToRead";
import { onMyShelf } from "@/core/pages/SharedShelf/compare";
import {
  ownedCountOf,
  ownedVolumesOf,
  shelfOf,
  statusOf,
  volumeRanges,
  type SharedManga,
} from "@/core/pages/SharedShelf/shareParts";
import {
  favouritesOf,
  genreOf,
  genresOn,
  shelfNumbers,
  toGetOf,
} from "@/core/pages/SharedShelf/shelfNumbers";
import {
  plural,
  SECTIONS,
  SORTS,
  type Sort,
  type Tab,
  type View as ShelfView,
} from "@/core/pages/SharedShelf/sharedShelfView";
import { useColors } from "@/lib/colors";
import { readLocal, writeLocal } from "@/lib/deviceStore";
import { openWebPath } from "@/lib/webRoutes";
import { useShelf } from "@/store/shelf";

const PAGE = 20;
const MOST_TOP = 5;
const MOST_IN_ROW = 12;
// each list's own ink (the web's TONES, as theme tokens)
const TONE_CLASS: Record<Tab, string> = {
  Reading: "bg-award-market",
  Finished: "bg-award-new",
  "To read": "bg-award-set",
  "To get": "bg-stamp-get",
};
const SORT_OPTIONS = (Object.keys(SORTS) as Sort[]).map((key) => ({
  value: key,
  label: SORTS[key].label,
}));
const VIEWS = [
  { value: "rows", label: "Rows" },
  { value: "covers", label: "Covers" },
] as const;

const ownsText = (owned: number[]) =>
  `Owns ${owned.length === 1 ? "vol." : "vols."} ${volumeRanges(owned)}`;

function CoverFan({
  manga,
  onOpen,
}: {
  manga: SharedManga[];
  onOpen: (m: SharedManga) => void;
}) {
  const top = manga
    .filter((m) => m.image)
    .sort(
      (a, b) =>
        ownedCountOf(b) - ownedCountOf(a) || (b.rating ?? 0) - (a.rating ?? 0),
    )
    .slice(0, 5);
  if (top.length < 2) return null;
  return (
    <View className="flex-row justify-center">
      {top.map((m, i) => (
        <Tap
          key={`${m.name}-${i}`}
          onPress={() => onOpen(m)}
          style={{
            transform: [{ rotate: `${(i - (top.length - 1) / 2) * 4}deg` }],
            marginLeft: i ? -14 : 0,
          }}
          accessibilityLabel={`${m.name}. Open`}
        >
          <SeriesCover
            name={m.name}
            lightNovel={m.lightNovel}
            url={m.image}
            width={56}
          />
        </Tap>
      ))}
    </View>
  );
}

function CoverRow({
  title,
  note,
  manga,
  stars = false,
  onOpen,
}: {
  title: string;
  note: string;
  manga: SharedManga[];
  stars?: boolean;
  onOpen: (m: SharedManga) => void;
}) {
  const c = useColors();
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline gap-2">
        <H2>{title}</H2>
        <Text className="font-mono text-[12px] text-muted">{note}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {manga.slice(0, MOST_IN_ROW).map((m, i) => (
          <Tap
            key={`${m.name}-${i}`}
            onPress={() => onOpen(m)}
            className="w-[80px] gap-1"
            accessibilityLabel={`${m.name}. Open`}
          >
            <SeriesCover
              name={m.name}
              lightNovel={m.lightNovel}
              url={m.image}
              width={80}
            />
            {stars ? (
              <View className="flex-row gap-[1px]">
                {Array.from({ length: 5 }, (_, n) => (
                  <StarIcon
                    key={n}
                    filled
                    color={c.star}
                    width={11}
                    height={11}
                  />
                ))}
              </View>
            ) : null}
            <Text
              numberOfLines={1}
              className="font-body text-[12px] text-ink-soft"
            >
              {m.name}
            </Text>
          </Tap>
        ))}
      </ScrollView>
    </View>
  );
}

const GENRE_INKS = [
  "bg-accent",
  "bg-ink",
  "bg-award-market",
  "bg-award-set",
  "bg-line-soft",
];
function ShelfFacts({ manga }: { manga: SharedManga[] }) {
  const corners = useCorners();
  const { ownsAll, longestRun, mostly, genres } = shelfNumbers(manga);
  const hasNumbers = ownsAll > 0 || longestRun || mostly;
  if (!hasNumbers && !genres.length) return null;
  const withGenre = genres.reduce((n, g) => n + g.count, 0);
  return (
    <View
      className="gap-2 rounded-[14px] border border-dashed border-line-soft p-3"
      style={corners.panel}
    >
      {hasNumbers ? (
        <View className="gap-0.5">
          {ownsAll > 0 ? (
            <Text className="font-body text-[14px] text-ink-soft">
              Every volume of{" "}
              <Text className="font-body-semibold text-ink">
                {plural(ownsAll, "series", "series")}
              </Text>
            </Text>
          ) : null}
          {longestRun ? (
            <Text className="font-body text-[14px] text-ink-soft">
              Longest run:{" "}
              <Text className="font-body-semibold text-ink">
                {longestRun.name}, {longestRun.volumes}
              </Text>
            </Text>
          ) : null}
          {mostly ? (
            <Text className="font-body text-[14px] text-ink-soft">
              Mostly{" "}
              <Text className="font-body-semibold text-ink">
                {mostly.toLowerCase()}
              </Text>
            </Text>
          ) : null}
        </View>
      ) : null}
      {genres.length ? (
        <View className="gap-1.5">
          <View
            className="h-2 flex-row overflow-hidden rounded-full"
            accessibilityLabel={`Genres: ${genres.map((g) => `${g.name} ${Math.round((g.count / withGenre) * 100)}%`).join(", ")}`}
          >
            {genres.map((g, i) => (
              <View
                key={g.name}
                style={{ flexGrow: g.count }}
                className={GENRE_INKS[i]}
              />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-x-3 gap-y-1">
            {genres.map((g, i) => (
              <View key={g.name} className="flex-row items-center gap-1">
                <View className={`h-2 w-2 rounded-full ${GENRE_INKS[i]}`} />
                <Text className="font-body text-[12.5px] text-ink-soft">
                  {g.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function FollowBar({
  code,
  name,
  following,
}: {
  code: string;
  name: string;
  following: boolean;
}) {
  const corners = useCorners();
  const [on, setOn] = useState(following);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState("");
  const flip = async () => {
    setSaving(true);
    setFailed("");
    try {
      setOn(await setFollowing(code, !on));
    } catch (e) {
      setFailed((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <View
      className="flex-row items-center gap-3 rounded-[14px] border border-line-soft bg-card px-3 py-2.5"
      style={corners.panel}
    >
      <Text className="min-w-0 flex-1 font-body text-[14.5px] text-ink">
        {on ? (
          <>
            <Text className="font-body-semibold">{name}</Text> is in your
            Friends.
          </>
        ) : (
          <>
            Follow <Text className="font-body-semibold">{name}</Text> to keep
            this shelf in Friends.
          </>
        )}
      </Text>
      <Button
        label={on ? "Following" : "Follow"}
        kind={on ? "secondary" : "primary"}
        small
        disabled={saving}
        onPress={() => void flip()}
      />
      {failed ? (
        <Text className="font-body text-[13px] text-accent">{failed}</Text>
      ) : null}
    </View>
  );
}

function Synopsis({ m }: { m: SharedManga }) {
  const [found, setFound] = useState<{
    name: string;
    text: string | null;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch(
      `/api/prices/summary/series?${new URLSearchParams({ name: priceName(m) })}`,
      { signal: controller.signal },
    )
      .then(async (res) =>
        res.status === 200
          ? (
              (await res.json()) as { description?: string }
            ).description?.trim() || null
          : null,
      )
      .then((text) => setFound({ name: m.name, text }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setFound({ name: m.name, text: null });
      });
    return () => controller.abort();
  }, [m]);
  if (found?.name !== m.name || !found.text) return null;
  return (
    <View>
      <Text
        numberOfLines={expanded ? undefined : 4}
        className="font-body text-[14px] leading-[21px] text-ink-soft"
      >
        {found.text}
      </Text>
      {found.text.length > 220 ? (
        <Tap onPress={() => setExpanded(!expanded)} hitSlop={6}>
          <Text className="font-body-medium text-[13.5px] text-ink border-b pb-[2px] border-ink self-start">
            {expanded ? "Show less" : "Read more"}
          </Text>
        </Tap>
      ) : null}
    </View>
  );
}

function AddToShelf({ m }: { m: SharedManga }) {
  const shelf = useShelf((s) => s.manga);
  const loadShelf = useShelf((s) => s.load);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const onShelf = shelf?.find(
    (mine) =>
      Boolean(mine.lightNovel) === Boolean(m.lightNovel) &&
      sameName(mine.name) === sameName(m.name),
  );
  if (onShelf)
    return (
      <Tap
        onPress={() =>
          router.push({
            pathname: "/details/[id]",
            params: { id: String(onShelf.id) },
          })
        }
        hitSlop={6}
      >
        <Text className="font-body-semibold text-[14.5px] text-ink border-b pb-[2px] border-ink self-start decoration-accent">
          {onShelf.planned ? "On your To read list" : "On your shelf too"} →
        </Text>
      </Tap>
    );
  const add = async () => {
    setSaving(true);
    setError("");
    if (await addToRead(m)) await loadShelf();
    else setError("That didn't save. Try again.");
    setSaving(false);
  };
  return (
    <View className="flex-row flex-wrap items-center gap-3">
      <Button
        label={saving ? "Adding…" : "+ Add to my To read"}
        small
        disabled={saving || !shelf}
        onPress={() => void add()}
      />
      {error ? (
        <Text className="font-body text-[13px] text-accent">{error}</Text>
      ) : null}
    </View>
  );
}

function TopPick({
  m,
  top,
  onChange,
}: {
  m: SharedManga;
  top: string[];
  onChange: (top: string[]) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const isTop = top.includes(m.name);
  const isFull = !isTop && top.length >= MOST_TOP;
  const toggle = async () => {
    const next = isTop
      ? top.filter((name) => name !== m.name)
      : [...top, m.name];
    setSaving(true);
    setFailed(false);
    const saved = await saveShareTop(next);
    setSaving(false);
    if (saved) onChange(next);
    else setFailed(true);
  };
  return (
    <View className="gap-1">
      {isFull ? (
        <Text className="font-body text-[13.5px] text-ink-soft">
          You have {MOST_TOP} top picks already. Remove one to add this.
        </Text>
      ) : (
        <Button
          label={isTop ? "Remove from my top picks" : "Add to my top picks"}
          small
          disabled={saving}
          onPress={() => void toggle()}
        />
      )}
      {failed ? (
        <Text className="font-body text-[13px] text-accent">
          That didn't save. Try again.
        </Text>
      ) : null}
    </View>
  );
}

function SeriesSheet({
  m,
  owner,
  code,
  topPick,
  onClose,
}: {
  m: SharedManga;
  owner: string;
  code: string;
  topPick?: { top: string[]; onChange: (top: string[]) => void };
  onClose: () => void;
}) {
  const c = useColors();
  const owned = ownedVolumesOf(m);
  const facts: [string, React.ReactNode][] = [["Status", statusOf(m)]];
  if (m.bookmark && !m.status) facts.push(["Up to", `Chapter ${m.bookmark}`]);
  if (m.readVolume && !m.status)
    facts.push(["Read", `Up to vol. ${m.readVolume}`]);
  facts.push([
    "Owns",
    owned.length
      ? `${owned.length} volume${owned.length === 1 ? "" : "s"}`
      : "None yet",
  ]);
  if (m.rating)
    facts.push(["Their rating", <StarRating key="rating" value={m.rating} />]);
  if (m.genre && m.genre !== "unlabled") facts.push(["Genre", m.genre]);
  if (m.lightNovel) facts.push(["Kind", "Novel"]);
  const link = `${shareUrl(code)}?series=${encodeURIComponent(m.name)}`;
  return (
    <Sheet
      open
      onClose={onClose}
      maxHeight={0.9}
      contentClassName="gap-4 px-5 pt-1 pb-8"
    >
      <View className="flex-row gap-3">
        <SeriesCover
          name={m.name}
          lightNovel={m.lightNovel}
          url={m.image}
          width={72}
        />
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-display text-[20px] leading-[24px] text-ink">
            {m.name}
          </Text>
          {facts.map(([label, value]) => (
            <View key={label} className="flex-row items-baseline gap-2">
              <Text className="w-[84px] font-mono text-[11.5px] tracking-[0.5px] text-muted uppercase">
                {label}
              </Text>
              {typeof value === "string" ? (
                <Text className="font-body text-[14px] text-ink">{value}</Text>
              ) : (
                value
              )}
            </View>
          ))}
        </View>
      </View>
      <Synopsis m={m} />
      {topPick ? <TopPick m={m} {...topPick} /> : <AddToShelf m={m} />}
      {m.notes ? (
        <View className="gap-1">
          <Text className="font-brand pr-[4px] text-[16px] tracking-[1px] text-ink uppercase">
            Notes
            {"\u00A0"}
          </Text>
          <Text className="font-body text-[14.5px] leading-[21px] text-ink">
            {m.notes}
          </Text>
        </View>
      ) : null}
      <View className="gap-2">
        <Text className="font-brand pr-[4px] text-[16px] tracking-[1px] text-ink uppercase">
          On {owner}'s shelf
          {"\u00A0"}
        </Text>
        {owned.length ? (
          <View
            className="flex-row flex-wrap gap-[3px]"
            accessibilityLabel={`${m.name}: owns volumes ${volumeRanges(owned)}`}
          >
            {shelfOf(owned).map(({ v, mine }) => (
              <View
                key={v}
                className={`h-9 w-[22px] items-center justify-end border-[1.5px] pb-0.5 ${mine ? "border-line bg-ink" : "border-dashed border-line-soft bg-paper"}`}
              >
                <Text
                  className={`font-brand pr-[4px] text-[11px] ${mine ? "text-paper" : "text-muted"}`}
                >
                  {v}
                  {"\u00A0"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="font-body text-[14px] text-ink-soft">
            No volumes of this one on the shelf yet.
          </Text>
        )}
      </View>
      <View className="flex-row flex-wrap items-center gap-3">
        <Button
          label="See prices"
          kind="primary"
          small
          onPress={() => {
            onClose();
            openWebPath(seriesPath(priceName(m)));
          }}
        />
        <Tap
          onPress={() =>
            void Share.share({ message: link, url: link }).catch(() => {})
          }
          hitSlop={6}
          className="flex-row items-center gap-1.5"
        >
          <LinkIcon color={c.inkSoft} width={16} height={16} />
          <Text className="font-body-medium text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
            Share link
          </Text>
        </Tap>
      </View>
    </Sheet>
  );
}

export default function SharedShelfScreen() {
  const corners = useCorners();
  const c = useColors();
  const { code, series: openParam } = useLocalSearchParams<{
    code: string;
    series?: string;
  }>();
  const [state, setState] = useState<{
    code: string;
    shelf: SharedShelf | null;
  } | null>(null);
  const shelf = state?.code === code ? state.shelf : null;
  const finished = state?.code === code;
  const [openName, setOpenName] = useState<string | null>(openParam ?? null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("volumes");
  const [pickingSort, setPickingSort] = useState(false);
  const [genre, setGenre] = useState("");
  const [pickingGenre, setPickingGenre] = useState(false);
  const [more, setMore] = useState({ key: "", count: PAGE });
  const [view, setView] = useState<ShelfView>(() =>
    readLocal("shareView") === "covers" ? "covers" : "rows",
  );
  const [picked, setPicked] = useState<Tab | null>(null);
  const [onlyNew, setOnlyNew] = useState(false);
  const [topNow, setTopNow] = useState<string[] | null>(null);
  const myShelf = useShelf((s) => s.manga);
  const loadMyShelf = useShelf((s) => s.load);
  useEffect(() => {
    if (!myShelf) void loadMyShelf();
  }, [myShelf, loadMyShelf]);
  useEffect(() => {
    const controller = new AbortController();
    getSharedShelf(code, controller.signal)
      .then((found) => setState({ code, shelf: found }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ code, shelf: null });
      });
    return () => controller.abort();
  }, [code]);
  const comparing = Boolean(myShelf && shelf && !shelf.yours);
  const isMine = useMemo(() => onMyShelf(myShelf ?? []), [myShelf]);
  const hideMine = comparing && onlyNew;
  const groups = useMemo(() => {
    const words = query.trim().toLowerCase();
    const found = (shelf?.manga ?? [])
      .filter((m) => !words || m.name.toLowerCase().includes(words))
      .filter((m) => !genre || genreOf(m) === genre)
      .filter((m) => !hideMine || !isMine(m))
      .sort(SORTS[sort].order);
    return SECTIONS.map((name) => ({
      name,
      manga: found.filter((m) => statusOf(m) === name),
    }));
  }, [shelf, query, genre, sort, hideMine, isMine]);

  if (!finished) return <Page title="A shared shelf">{null}</Page>;
  if (!shelf)
    return (
      <Page title="A shared shelf">
        <View className="items-center gap-3 py-6">
          <Mascot mood="confused" width={100} />
          <P muted>
            The link might be wrong, or its owner may have made their list
            private.
          </P>
        </View>
      </Page>
    );

  const all = shelf.manga;
  const open =
    (openName &&
      all.find((m) => m.name.toLowerCase() === openName.toLowerCase())) ||
    null;
  const volumes = all.reduce((n, m) => n + ownedCountOf(m), 0);
  const shown = groups.filter((g) => g.manga.length);
  const top = topNow ?? shelf.top ?? [];
  const topPicks = top.flatMap(
    (name) => all.find((m) => m.name === name) ?? [],
  );
  const favourites = favouritesOf(all);
  const hasFavourites = !topPicks.length && favourites.length >= 3;
  const hasFan =
    !topPicks.length &&
    !hasFavourites &&
    all.filter((m) => m.image).length >= 2;
  const shared = comparing ? all.filter(isMine).length : 0;
  const words = query.trim().toLowerCase();
  const toGet = toGetOf(all)
    .filter((m) => !words || m.name.toLowerCase().includes(words))
    .filter((m) => !genre || genreOf(m) === genre)
    .filter((m) => !hideMine || !isMine(m))
    .sort(SORTS[sort].order);
  const genres = genresOn(all);
  const tabs: { name: Tab; count: number }[] = [
    ...shown.map((g) => ({ name: g.name, count: g.manga.length })),
    ...(toGet.length ? [{ name: "To get" as const, count: toGet.length }] : []),
  ];
  const tab = tabs.find((t) => t.name === picked)?.name ?? tabs[0]?.name;
  const list = shown.find((g) => g.name === tab)?.manga ?? [];
  const listed = tab === "To get" ? toGet.length : list.length;
  const listKey = `${tab}|${query}|${genre}|${sort}|${hideMine}`;
  const showing = more.key === listKey ? more.count : PAGE;
  const link = shareUrl(code);

  const row = (m: SharedManga, j: number) => {
    const owned = ownedVolumesOf(m);
    const isTopPick = top.includes(m.name);
    const mine = comparing ? (isMine(m) ? "have" : "dont") : undefined;
    const more = [
      !m.status && placeText(m, "both", true),
      m.lightNovel && "novel",
    ].filter(Boolean);
    const spines = shelfOf(owned);
    const per = Math.ceil(spines.length / 40);
    const ticks = Array.from(
      { length: Math.ceil(spines.length / per) },
      (_, i) => spines.slice(i * per, (i + 1) * per).every((s) => s.mine),
    );
    return (
      <View
        key={`${m.name}-${j}`}
        className="flex-row items-center gap-3 border-b border-dotted border-line-soft py-2"
      >
        <Tap
          onPress={() => setOpenName(m.name)}
          className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-70"
          accessibilityLabel={`${m.name}: ${owned.length ? `owns ${plural(owned.length, "volume")}` : "no volumes yet"}. Open`}
        >
          <SeriesCover
            name={m.name}
            lightNovel={m.lightNovel}
            url={m.image}
            width={view === "covers" ? 64 : 44}
          />
          <View className="min-w-0 flex-1 gap-0.5">
            <Text
              numberOfLines={1}
              className="font-body-semibold text-[15.5px] text-ink"
            >
              {m.name}
            </Text>
            <Text
              numberOfLines={1}
              className="font-mono text-[12px] text-ink-soft"
            >
              {owned.length ? ownsText(owned) : "No volumes yet"}
            </Text>
            {owned.length ? (
              <View className="flex-row gap-[1px]">
                {ticks.map((on, i) => (
                  <View
                    key={i}
                    className={`h-1.5 flex-1 ${on ? "bg-ink" : "bg-line-soft"}`}
                  />
                ))}
              </View>
            ) : null}
            <View className="flex-row flex-wrap items-center gap-x-2">
              {isTopPick ? (
                <View className="flex-row items-center gap-0.5 rounded-[2px] bg-ink px-1">
                  <StarIcon filled color={c.star} width={10} height={10} />
                  <Text className="font-mono text-[10px] text-paper uppercase">
                    Top pick
                  </Text>
                </View>
              ) : null}
              {more.length ? (
                <Text className="font-body text-[12.5px] text-muted">
                  {more.join(" · ")}
                </Text>
              ) : null}
              {m.rating ? <StarRating value={m.rating} /> : null}
            </View>
          </View>
        </Tap>
        {mine === "dont" ? (
          <QuickAdd m={m} onAdded={() => void loadMyShelf()} />
        ) : null}
        {mine === "have" ? (
          <Text className="font-mono text-[11px] tracking-[0.5px] text-ok uppercase">
            Yours too
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <Page title={`${shelf.displayName}'s shelf`}>
      {comparing ? (
        <FollowBar
          key={code}
          code={code}
          name={shelf.displayName}
          following={Boolean(shelf.following)}
        />
      ) : null}
      {shelf.yours ? (
        <View
          className="gap-1 rounded-[14px] bg-accent-wash px-3 py-2"
          style={corners.panel}
        >
          <Text className="font-body text-[14px] text-ink">
            Others see this page, as{" "}
            <Text className="font-body-semibold">{shelf.displayName}</Text>.
            Open a series to add it to your top picks.
          </Text>
          <Tap
            onPress={() =>
              router.push({ pathname: "/settings", params: { tab: "profile" } })
            }
            hitSlop={6}
          >
            <Text className="font-body-medium text-[14px] text-ink border-b pb-[2px] border-ink self-start">
              Change name or what's shared
            </Text>
          </Tap>
        </View>
      ) : null}
      <View className="items-center gap-2">
        <Avatar id={shelf.avatar} size={72} border={3} />
        <Text className="font-display text-[26px] text-ink">
          {shelf.displayName}
        </Text>
        <Text className="font-body text-[14.5px] text-ink-soft">
          <Text className="font-body-semibold text-ink">{all.length}</Text>{" "}
          series ·{" "}
          <Text className="font-body-semibold text-accent">{volumes}</Text>{" "}
          {volumes === 1 ? "volume owned" : "volumes owned"}
        </Text>
        {hasFan ? (
          <CoverFan manga={all} onOpen={(m) => setOpenName(m.name)} />
        ) : null}
        <View className="flex-row gap-3">
          <Button
            center
            label="Share"
            small
            onPress={() =>
              void Share.share({ message: link, url: link }).catch(() => {})
            }
          />
          <Button
            center
            label="Open on the web"
            small
            onPress={() => openOutside(link)}
          />
        </View>
      </View>
      {topPicks.length ? (
        <CoverRow
          title="Top picks"
          note={`Picked by ${shelf.displayName}`}
          manga={topPicks}
          onOpen={(m) => setOpenName(m.name)}
        />
      ) : null}
      {hasFavourites ? (
        <CoverRow
          title="Favourites"
          note="Their 5-star series"
          manga={favourites}
          stars
          onOpen={(m) => setOpenName(m.name)}
        />
      ) : null}
      <ShelfFacts manga={all} />
      {comparing ? (
        <View className="gap-1 rounded-[4px] border-[1.5px] border-line-soft px-3 py-2">
          <Text className="font-body text-[14px] text-ink">
            <Text className="font-body-semibold">
              You both have {plural(shared, "series", "series")}.
            </Text>{" "}
            {all.length - shared} here aren't on your shelf.
          </Text>
          <Switch
            label="Show only ones I don't have"
            value={onlyNew}
            onChange={setOnlyNew}
          />
        </View>
      ) : null}
      {tab ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {tabs.map(({ name, count }) => (
            <Tap
              key={name}
              onPress={() => setPicked(name)}
              accessibilityState={{ selected: name === tab }}
              className={`flex-row items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 ${name === tab ? `border-line ${TONE_CLASS[name]}` : "border-line-soft"}`}
            >
              <Text
                className={`font-body-semibold text-[14px] ${name === tab ? "text-stamp-ink" : "text-ink-soft"}`}
              >
                {name}
              </Text>
              <Text
                className={`font-mono text-[12px] ${name === tab ? "text-stamp-ink" : "text-muted"}`}
              >
                {count}
              </Text>
            </Tap>
          ))}
        </ScrollView>
      ) : null}
      {all.length ? (
        <View className="gap-2">
          <View className="flex-row items-center gap-2 rounded-[4px] border-[1.5px] border-line-soft bg-card px-3">
            <SearchIcon color={c.inkSoft} width={16} height={16} />
            <TextBox
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${shelf.displayName}'s shelf`}
              placeholderTextColor={c.muted}
              className="min-h-[42px] flex-1 font-body text-[15px] text-ink"
            />
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
            <Tap
              onPress={() => setPickingSort(true)}
              className="flex-row items-center gap-1 rounded-[3px] border-[1.5px] border-line-soft px-2.5 py-1.5"
            >
              <Text className="font-body text-[13.5px] text-ink">
                {SORTS[sort].label}
              </Text>
              <ChevronDownIcon color={c.inkSoft} width={14} height={14} />
            </Tap>
            {genres.length > 1 ? (
              <Tap
                onPress={() => setPickingGenre(true)}
                className="flex-row items-center gap-1 rounded-[3px] border-[1.5px] border-line-soft px-2.5 py-1.5"
              >
                <Text className="font-body text-[13.5px] text-ink">
                  {genre || "All genres"}
                </Text>
                <ChevronDownIcon color={c.inkSoft} width={14} height={14} />
              </Tap>
            ) : null}
            <View className="ml-auto w-[150px]">
              <Segmented
                label="Layout"
                options={VIEWS}
                value={view}
                onChange={(v) => {
                  setView(v);
                  writeLocal("shareView", v);
                }}
              />
            </View>
          </View>
        </View>
      ) : (
        <P muted>Nothing on this shelf yet.</P>
      )}
      {all.length > 0 && !tab ? (
        <P muted>
          {query.trim()
            ? `No series here match “${query.trim()}”.`
            : `Nothing in ${genre} here.`}
        </P>
      ) : null}
      {tab === "To get" ? (
        <View className="gap-2">
          <P muted>
            The next volume {shelf.displayName} needs for each series. Handy for
            a gift.
          </P>
          {toGet.slice(0, showing).map((m, i) => {
            const next = m.next!;
            return (
              <Tap
                key={`${m.name}-${i}`}
                onPress={() => openWebPath(volumePath(next.isbn13, next.title))}
                className="flex-row items-center gap-3 border-b border-dotted border-line-soft py-2 active:opacity-70"
              >
                <SeriesCover
                  name={m.name}
                  lightNovel={m.lightNovel}
                  url={m.image}
                  width={44}
                />
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-body-semibold text-[15px] text-ink"
                  >
                    {m.name}
                  </Text>
                  <Text className="font-mono text-[12.5px] text-ink-soft">
                    Vol. {next.volume} next
                    {next.comingOut
                      ? ` · Out ${dayName(next.comingOut)}`
                      : next.fromCents != null
                        ? ` · from ${formatCents(next.fromCents)}`
                        : ""}
                  </Text>
                </View>
                <Text className="font-body-semibold text-[13.5px] text-accent border-b pb-[2px] border-accent self-start">
                  {next.comingOut ? "Preorder" : "See prices"}
                </Text>
              </Tap>
            );
          })}
        </View>
      ) : null}
      {tab && tab !== "To get" ? (
        <View>{list.slice(0, showing).map(row)}</View>
      ) : null}
      {listed > showing ? (
        <View className="flex-row items-baseline justify-between">
          <Tap
            onPress={() => setMore({ key: listKey, count: showing + PAGE })}
            hitSlop={6}
          >
            <Text className="font-body-semibold text-[14px] text-ink border-b pb-[2px] border-ink self-start">
              Show {Math.min(PAGE, listed - showing)} more
            </Text>
          </Tap>
          <Text className="font-mono text-[12px] text-muted">
            {showing} of {listed}
          </Text>
        </View>
      ) : null}
      <PickSheet
        open={pickingSort}
        title="Order"
        options={SORT_OPTIONS}
        picked={sort}
        onPick={setSort}
        onClose={() => setPickingSort(false)}
      />
      <PickSheet
        open={pickingGenre}
        title="Genre"
        options={[
          { value: "", label: "All genres" },
          ...genres.map((g) => ({ value: g, label: g })),
        ]}
        picked={genre}
        onPick={setGenre}
        onClose={() => setPickingGenre(false)}
      />
      {open ? (
        <SeriesSheet
          m={open}
          owner={shelf.displayName}
          code={code}
          topPick={shelf.yours ? { top, onChange: setTopNow } : undefined}
          onClose={() => setOpenName(null)}
        />
      ) : null}
    </Page>
  );
}

function QuickAdd({ m, onAdded }: { m: SharedManga; onAdded: () => void }) {
  const [state, setState] = useState<"" | "saving" | "failed">("");
  const add = async () => {
    setState("saving");
    if (await addToRead(m)) onAdded();
    else setState("failed");
  };
  return (
    <Button
      label={state === "failed" ? "Try again" : "+ To read"}
      small
      disabled={state === "saving"}
      onPress={() => void add()}
    />
  );
}
