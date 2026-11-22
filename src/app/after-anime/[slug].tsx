// A show's page, as the web's pages/AfterAnime/AfterAnimeShow.tsx: where the
// anime leaves off and the chapter and volume to start the manga at, what to
// buy and its price, what's left to read, every season, and the questions
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import Button from "@/components/Button";
import FoldRow from "@/components/FoldRow";
import Mascot from "@/components/Mascot";
import Page, { P } from "@/components/Page";
import AnswerWords from "@/components/afterAnime/AnswerWords";
import FixForm from "@/components/afterAnime/FixForm";
import MoreShows from "@/components/afterAnime/MoreShows";
import SeasonBuy, { AllVolumesLink } from "@/components/afterAnime/SeasonBuy";
import SeasonNotes from "@/components/afterAnime/SeasonNotes";
import SeasonPanel from "@/components/afterAnime/SeasonPanel";
import SeasonTable from "@/components/afterAnime/SeasonTable";
import {
  getAfterAnime,
  getBuyOffers,
  type AfterAnime,
  type VolumeOffers,
} from "@/core/lib/afterAnime";
import {
  buyVolume,
  hasNoEndYet,
  keepNumbers,
  latestAnswer,
  latestStop,
  leftLine,
  noAnswerLine,
  placeAfter,
  showQuestions,
  type AnimeStop,
} from "@/core/lib/afterAnimeText";
import { HttpError } from "@/core/lib/api";
import { formatCents, slugify, timeAgo } from "@/core/lib/prices";
import type { SeriesVolume } from "@/core/lib/types";
import { bookFor, bookWords } from "@/core/pages/AfterAnime/bookFor";
import { useSeriesLoad } from "@/core/pages/Prices/useSeriesData";

const TABLE_FROM_SEASONS = 4;

function useAfterAnime(name: string) {
  const [state, setState] = useState<{
    asked: string;
    show: AfterAnime | null;
    problem: "" | "missing" | "failed";
  }>({ asked: "", show: null, problem: "" });

  useEffect(() => {
    const controller = new AbortController();
    getAfterAnime(name, controller.signal)
      .then((show) => setState({ asked: name, show, problem: "" }))
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        const missing = e instanceof HttpError && e.status === 404;
        setState({
          asked: name,
          show: null,
          problem: missing ? "missing" : "failed",
        });
      });
    return () => controller.abort();
  }, [name]);

  const answered = state.asked === name;
  return {
    loading: !answered,
    show: answered ? state.show : null,
    problem: answered ? state.problem : "",
  };
}

// store links for each season's volume to buy, when the answer didn't bring
// them
function useBuyOffers(show: AfterAnime | null, volumes: SeriesVolume[] | null) {
  const isbns =
    show && volumes
      ? show.stops
          .map(buyVolume)
          .filter((volume): volume is number => volume !== null)
          .map((volume) => bookFor(volumes, volume)?.isbn13.trim())
          .filter((isbn): isbn is string => Boolean(isbn))
      : [];
  const sent = show?.offers ?? {};
  const wanted = [...new Set(isbns)]
    .filter((isbn) => !(isbn in sent))
    .sort()
    .join(",");
  const [offers, setOffers] = useState<Record<string, VolumeOffers>>({});
  useEffect(() => {
    if (!wanted) return;
    const controller = new AbortController();
    getBuyOffers(wanted.split(","), controller.signal)
      .then((found) => setOffers((had) => ({ ...had, ...found })))
      .catch(() => {
        // the page says "Check prices" instead
      });
    return () => controller.abort();
  }, [wanted]);
  return { ...sent, ...offers };
}

// the books the answer brought, so the buy box is drawn before the series'
// list is in
function booksFromAnswer(show: AfterAnime | null): SeriesVolume[] {
  if (!show) return [];
  return show.books.map((book) => ({
    isbn13: book.isbn13,
    title: `${show.name}, Vol. ${book.volume}`,
    volume: book.volume,
    coverUrl: `/api/prices/cover/${book.isbn13}`,
    knownPriceCents: book.cents,
  }));
}

const Foot = ({ children }: { children: React.ReactNode }) => (
  <Text className="font-body text-[13px] leading-[19px] text-muted">
    {children}
  </Text>
);

export default function AfterAnimeShowScreen() {
  const params = useLocalSearchParams<{ slug: string; name?: string }>();
  const asked = params.name ?? (params.slug ?? "").replace(/-/g, " ");
  const { loading, show, problem } = useAfterAnime(asked);
  // the series' English books: asked for by the name typed, then by the
  // answer's name when that's another
  const early = useSeriesLoad(asked);
  const earlyFits = Boolean(
    show && early.data && slugify(early.data.name) === slugify(show.name),
  );
  const late = useSeriesLoad(
    show && !early.loading && !earlyFits ? show.name : "",
  );
  const series = !show || earlyFits || early.loading ? early : late;
  const volumes = show && !series.loading ? (series.data?.volumes ?? []) : null;
  const fromAnswer = booksFromAnswer(show);
  const volumesFor = (stop: AnimeStop) => {
    if (volumes) return volumes;
    const toBuy = buyVolume(stop);
    return toBuy !== null && fromAnswer.some((b) => b.volume === toBuy)
      ? fromAnswer
      : null;
  };
  const offers = useBuyOffers(show, volumes ?? fromAnswer);

  const name = show?.name ?? asked;
  const latest = show ? latestStop(show.stops) : undefined;
  const answer =
    latest &&
    latestAnswer(
      latest,
      volumes ? (n) => bookWords(bookFor(volumes, n), n) : undefined,
    );
  const newestFirst = show ? [...show.stops].reverse() : [];
  const earlier = newestFirst.filter((stop) => stop !== latest);
  const left =
    show && latest
      ? leftLine(latest, show.manga, show.books ?? [], formatCents)
      : "";
  const place = latest ? placeAfter(latest) : null;
  const keepPlace = () =>
    router.push({
      pathname: "/add",
      params: {
        title: name,
        ...(place?.chapter ? { chapter: String(place.chapter) } : {}),
        ...(place?.volume ? { readVolume: String(place.volume) } : {}),
      },
    });
  const boxSet = series.data?.boxSets?.find((set) => !/ebay/i.test(set.store));
  const questions = show
    ? showQuestions(show).filter((question) => question.shown)
    : [];
  const hasAnswer = !show || show.stops.length > 0;
  const anAffiliateLink =
    Object.values(offers).some(
      (offer) => offer.new?.affiliate || offer.used?.affiliate,
    ) || Boolean(boxSet?.affiliate);

  return (
    <Page title={name}>
      {/* the series inked in, then what the page is for */}
      <View className="gap-3">
        <Text className="font-brand pr-1 text-[28px] leading-[34px] tracking-[1px] text-ink uppercase">
          {hasAnswer ? "Where to start the manga" : "No answer yet"}
        </Text>
        {answer ? (
          <Text className="font-display text-[21px] leading-[29px] text-ink">
            <AnswerWords text={keepNumbers(answer.lead)} />
          </Text>
        ) : null}
        {show && latest ? (
          <SeasonBuy
            stop={latest}
            seriesName={show.name}
            volumes={volumesFor(latest)}
            offers={offers}
            seriesCoverUrl={show.coverUrl}
            lead
          />
        ) : null}
        {show && latest && answer ? (
          <View className="gap-3">
            <SeasonNotes stop={latest} />
            {!latest.coversAll ? (
              <Text className="font-body text-[14.5px] leading-[21px] text-ink-soft">
                Going to read it?{" "}
                <Text
                  onPress={keepPlace}
                  className="font-body-semibold text-ink underline"
                >
                  Keep your place from where the anime stops
                </Text>
              </Text>
            ) : null}
            <FixForm seriesName={show.name} season={latest.label} />
          </View>
        ) : null}
      </View>

      {loading ? (
        <View className="gap-3" accessibilityLabel="Loading">
          <View className="h-7 w-2/3 rounded bg-paper-2" />
          <View className="h-[132px] rounded bg-paper-2" />
        </View>
      ) : null}

      {problem !== "" ? (
        <View className="items-center gap-3 pt-4">
          <Mascot
            mood={problem === "missing" ? "confused" : "panic"}
            width={110}
          />
          <Text className="text-center font-display text-[20px] text-ink">
            {problem === "missing"
              ? "We don't know that series."
              : "That didn't load."}
          </Text>
          <P muted>
            {problem === "missing"
              ? "Check the spelling, or look it up by name."
              : "Try again in a moment."}
          </P>
          <Button
            label="Search shows"
            onPress={() => router.replace("/after-anime")}
          />
        </View>
      ) : null}

      {show && show.stops.length === 0 ? (
        <View className="gap-4">
          <P>{noAnswerLine(show.name, show.anime)}</P>
          <AllVolumesLink seriesName={show.name} />
          {/* opened ready to fill in, unless the anime hasn't ended: then
              there's nothing to tell us yet, and it stays a closed row */}
          <FixForm
            seriesName={show.name}
            season={null}
            open={!hasNoEndYet(show.anime)}
          />
        </View>
      ) : null}

      {show && show.stops.length > 0 ? (
        <>
          {left ? (
            <View className="gap-2 rounded-[14px] border border-dashed border-line-soft px-3 py-3">
              <Text className="font-brand pr-1 text-[18px] tracking-[1px] text-ink uppercase">
                What's left to read
              </Text>
              <P>{keepNumbers(left)}</P>
              <AllVolumesLink seriesName={show.name} />
            </View>
          ) : null}
          {boxSet?.url ? (
            <P>
              Buying several? A {show.name} box set is{" "}
              <Text className="font-body-semibold text-ink">
                {formatCents(boxSet.priceCents)}
              </Text>{" "}
              at{" "}
              <Text
                onPress={() => void Linking.openURL(boxSet.url!)}
                className="font-body-semibold text-ink underline"
              >
                {boxSet.store}
              </Text>
              .
            </P>
          ) : null}
          {show.stops.length >= TABLE_FROM_SEASONS ? (
            <SeasonTable
              stops={newestFirst}
              seriesName={show.name}
              volumes={volumes}
            />
          ) : null}
          {earlier.length > 0 ? (
            <View className="gap-2">
              <Text className="font-brand pr-1 text-[20px] tracking-[1px] text-ink uppercase">
                Earlier seasons
              </Text>
              {earlier.map((stop) => (
                <SeasonPanel
                  key={stop.label}
                  stop={stop}
                  seriesName={show.name}
                  volumes={volumesFor(stop)}
                  offers={offers}
                  seriesCoverUrl={show.coverUrl}
                />
              ))}
            </View>
          ) : null}
          <View className="gap-2">
            {/* said once: the strip above has it when there's a strip */}
            {!left ? <AllVolumesLink seriesName={show.name} /> : null}
            <Text
              onPress={() => router.push("/after-anime")}
              className="self-start font-body-semibold text-[15px] text-ink underline"
            >
              Look up another show
            </Text>
          </View>
          {questions.length > 0 ? (
            <View>
              <Text className="pb-1 font-brand pr-1 text-[20px] tracking-[1px] text-ink uppercase">
                Questions
              </Text>
              {questions.map(({ q, shown, a, list }) => (
                <FoldRow key={q} title={shown ?? q}>
                  <View className="gap-1.5">
                    <P>{keepNumbers(a)}</P>
                    {list && list.length > 0
                      ? list.map((line) => (
                          <Text
                            key={line}
                            className="font-body text-[14.5px] leading-[21px] text-ink-soft"
                          >
                            • {keepNumbers(line)}
                          </Text>
                        ))
                      : null}
                  </View>
                </FoldRow>
              ))}
            </View>
          ) : null}
          <MoreShows notThis={show.slug} />
          <View className="gap-1.5 border-t border-line-soft pt-4">
            <Foot>
              {show.sourceUrl ? (
                <>
                  Source:{" "}
                  <Text
                    onPress={() => void Linking.openURL(show.sourceUrl!)}
                    className="underline"
                  >
                    MangaUpdates
                  </Text>
                  {show.checkedAt && `, checked ${timeAgo(show.checkedAt)}`}.
                </>
              ) : (
                "Source: sent in by a reader, and checked."
              )}
            </Foot>
            <Foot>
              Volume numbers follow the Japanese edition. English volumes almost
              always match.
            </Foot>
            {anAffiliateLink ? (
              <Foot>
                Some store links are affiliate links. They cost you nothing and
                keep Manga Tracker running.
              </Foot>
            ) : null}
          </View>
        </>
      ) : null}
    </Page>
  );
}
