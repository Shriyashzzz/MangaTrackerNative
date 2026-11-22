// A volume as a card on the price pages (the web's pages/Prices/
// VolumeCard.tsx): its cover over the series' as a stand-in with the number
// drawn big, "Yours" or "Next", readers' stars, the Vol. tab, the name, a
// line under it, and its price (with what it was, on a deal). A book of
// several volumes fans the covers behind it
import { Image } from "expo-image";
import { router } from "expo-router";
import PressScale from "../PressScale";
import { Text, View } from "react-native";
import { StarIcon } from "@/core/components/icons/Icons";
import { coverSrc, formatCents, novelParts } from "@/core/lib/prices";
import { scoreText } from "@/core/pages/Prices/reviews/reviewText";
import { useColors } from "@/lib/colors";

export function CoverFallback({
  number,
  seriesCoverUrl,
  width,
  plain = false,
  numbered = false,
}: {
  number?: number | null;
  seriesCoverUrl?: string | null;
  width: number;
  plain?: boolean;
  numbered?: boolean;
}) {
  const c = useColors();
  const isItsOwnArt = number == null || number <= 1 || (plain && numbered);
  return (
    <View
      style={{
        position: "absolute",
        width,
        aspectRatio: 2 / 3,
        backgroundColor: c.paper2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {seriesCoverUrl && !isItsOwnArt ? (
        <Image
          source={{ uri: coverSrc(seriesCoverUrl) }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.35,
          }}
          contentFit="cover"
        />
      ) : null}
      <Text
        className="font-brand pr-1 text-ink"
        style={{
          fontSize: width * 0.42,
          opacity: seriesCoverUrl && !isItsOwnArt ? 0.9 : 0.5,
        }}
      >
        {number ?? "?"}
        {"\u00A0"}
      </Text>
    </View>
  );
}

export default function VolumeCard({
  isbn13,
  title,
  volume,
  coverUrl,
  seriesCoverUrl,
  subtitle,
  priceCents,
  wasCents,
  mark,
  holds,
  rating,
  plainStandIn = false,
  bookNumber = null,
  width = 130,
  bare = false,
  pile = "fan",
}: {
  isbn13: string | null;
  title: string;
  volume?: number | null;
  coverUrl?: string | null;
  seriesCoverUrl?: string | null;
  subtitle?: string;
  priceCents?: number | null;
  wasCents?: number | null;
  mark?: "yours" | "next";
  holds?: { from: number; to: number };
  rating?: number | null;
  plainStandIn?: boolean;
  bookNumber?: number | null;
  width?: number;
  // a tile in a grid of one series: the number on the cover says which,
  // so only the price sits under it
  bare?: boolean;
  // how the covers behind a book of several volumes sit: fanned like a
  // hand of cards, a neat pile (a plain omnibus) or none (one big book:
  // Deluxe, Definitive, VIZBIG)
  pile?: "fan" | "neat" | "flat";
}) {
  const c = useColors();
  const shown = novelParts(title);
  const behind =
    !holds || pile === "flat"
      ? 0
      : Math.min(holds.to - holds.from, pile === "neat" ? 2 : 3);
  const fanned = behind;
  // a neat pile: each cover behind a few points up and to the right
  const NEAT_STEP = 4;
  return (
    <PressScale
      onPress={isbn13 ? () => router.push(`/prices/${isbn13}`) : undefined}
      disabled={!isbn13}
      style={{ width }}
      className="gap-1.5"
    >
      <View
        style={{
          width,
          aspectRatio: 2 / 3,
          marginTop: fanned ? (pile === "neat" ? NEAT_STEP * fanned : 6) : 0,
        }}
      >
        {Array.from({ length: fanned }, (_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width,
              aspectRatio: 2 / 3,
              transform:
                pile === "neat"
                  ? [
                      { translateX: NEAT_STEP * (fanned - i) },
                      { translateY: -NEAT_STEP * (fanned - i) },
                    ]
                  : [
                      { rotate: `${3 * (fanned - i)}deg` },
                      { translateX: 5 * (fanned - i) },
                      { translateY: -3 * (fanned - i) },
                    ],
              borderWidth: 1.5,
              borderColor: c.line,
              backgroundColor: c.paper2,
              overflow: "hidden",
            }}
          >
            {coverUrl ? (
              <Image
                source={{ uri: coverSrc(coverUrl) }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : null}
          </View>
        ))}
        <View
          style={{
            width,
            aspectRatio: 2 / 3,
            borderWidth: 1.5,
            borderColor: c.line,
            overflow: "hidden",
            backgroundColor: c.paper2,
            // lifted off the page, softly
            boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.35)",
          }}
        >
          <CoverFallback
            number={volume ?? bookNumber}
            seriesCoverUrl={seriesCoverUrl}
            width={width - 3}
            plain={plainStandIn}
            numbered={volume != null}
          />
          {coverUrl ? (
            <Image
              source={{ uri: coverSrc(coverUrl) }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : null}
          {holds || volume != null ? (
            <View className="absolute top-0 left-0 flex-row items-baseline gap-0.5 bg-ink px-1.5 pb-0.5">
              <Text className="font-brand pr-[4px] text-[10px] tracking-[0.5px] text-paper uppercase">
                {holds ? "Vols." : "Vol."}
                {"\u00A0"}
              </Text>
              <Text className="font-brand pr-[4px] text-[15px] text-paper">
                {holds ? `${holds.from}–${holds.to}` : volume}
                {"\u00A0"}
              </Text>
            </View>
          ) : null}
          {mark ? (
            <View
              className={`absolute bottom-1 left-1 rounded-[2px] border-[1.5px] border-line px-1 ${mark === "next" ? "bg-accent" : "bg-card"}`}
            >
              <Text
                className={`font-brand pr-[4px] text-[11px] tracking-[1px] uppercase ${mark === "next" ? "text-on-accent" : "text-ink"}`}
              >
                {mark === "next" ? "Next" : "Yours"}
                {"\u00A0"}
              </Text>
            </View>
          ) : null}
          {rating != null ? (
            <View
              className="absolute right-1 bottom-1 flex-row items-center gap-0.5 rounded-[2px] bg-ink px-1"
              accessibilityLabel={`Readers rate it ${scoreText(rating)} out of 5`}
            >
              <StarIcon filled color={c.star} width={10} height={10} />
              <Text className="font-mono-medium text-[10.5px] text-paper">
                {scoreText(rating)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {bare ? null : (
        <Text
          numberOfLines={2}
          className="font-body-semibold text-[13.5px] leading-[17px] text-ink"
        >
          {shown.title}
        </Text>
      )}
      {!bare && (subtitle || shown.lightNovel) ? (
        <Text numberOfLines={2} className="font-mono text-[11.5px] text-muted">
          {[
            shown.lightNovel && "Light novel",
            subtitle && novelParts(subtitle).title,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      ) : null}
      {bare && priceCents == null && isbn13 ? (
        <Text className="font-mono text-[12px] text-muted">See price</Text>
      ) : null}
      {priceCents != null ? (
        <Text className="font-mono-medium text-[13px] text-ink">
          {formatCents(priceCents)}
          {wasCents != null ? (
            <Text className="font-mono text-[11.5px] text-muted line-through">
              {" "}
              {formatCents(wasCents)}
            </Text>
          ) : null}
        </Text>
      ) : null}
    </PressScale>
  );
}
