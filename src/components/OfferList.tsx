// A volume's prices, one row per store, as the Android app's (web pages/
// Prices/OfferList.tsx): All / New / Used above them when there's both kinds,
// the cheapest copies stamped (Lowest overall, Cheapest new...), single copies
// first, then box sets, then ebooks, five shown until "Show all". A row opens
// the store. Which copy gets which stamp is the web's own rule (core
// offerLabels awardsOf)
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { ChevronRightIcon } from "@/core/components/icons/Icons";
import { shopName } from "@/core/lib/prices";
import { isCollection, type Offer } from "@/core/lib/types";
import { awardsOf } from "@/core/pages/Prices/offerLabels";
import { useColors } from "@/lib/colors";
import Segmented from "./Segmented";

const VISIBLE_OFFERS = 5;
const CONDITION: Record<string, string> = {
  new: "New",
  used: "Used",
  marketplace: "Resold",
};

type Stamp = { label: string; look: string; ink: string; tilt: string };
const AWARDS: Record<string, Stamp> = {
  lowest: {
    label: "Lowest overall",
    look: "bg-accent",
    ink: "text-on-accent",
    tilt: "-rotate-2",
  },
  newLow: {
    label: "Cheapest new",
    look: "bg-award-new",
    ink: "text-on-award-new",
    tilt: "rotate-1",
  },
  knownLow: {
    label: "Cheapest big store",
    look: "bg-award-new",
    ink: "text-on-award-new",
    tilt: "rotate-1",
  },
  marketLow: {
    label: "Cheapest resold",
    look: "bg-award-market",
    ink: "text-stamp-ink",
    tilt: "-rotate-1",
  },
  market: {
    label: "Resold",
    look: "bg-award-market",
    ink: "text-stamp-ink",
    tilt: "-rotate-1",
  },
  boxSet: {
    label: "Box set",
    look: "bg-award-set",
    ink: "text-on-award-set",
    tilt: "rotate-2",
  },
  omnibus: {
    label: "Omnibus",
    look: "bg-award-set",
    ink: "text-on-award-set",
    tilt: "rotate-2",
  },
};

export default function OfferList({
  offers,
  formatPrice,
}: {
  offers: Offer[];
  formatPrice: (cents: number) => string;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [copies, setCopies] = useState<"all" | "new" | "used">("all");
  const isUsed = (o: Offer) => o.condition !== "new" && o.format !== "ebook";
  const usedToo =
    offers.some((o) => o.condition === "new") && offers.some(isUsed);
  const kept = offers.filter(
    (o) =>
      !(usedToo && copies === "new" && isUsed(o)) &&
      !(usedToo && copies === "used" && !isUsed(o)),
  );
  const listed = [
    ...kept.filter((o) => o.format !== "ebook" && !isCollection(o)),
    ...kept.filter(isCollection),
    ...kept.filter((o) => o.format === "ebook"),
  ];
  const shown = open ? listed : listed.slice(0, VISIBLE_OFFERS);
  const { lowest, newLow, marketLow, knownLow } = awardsOf(offers);
  const highlighted = newLow ?? lowest;
  const toCompare = offers.filter((o) => o.inStock && !isCollection(o)).length;
  const stampsOf = (o: Offer): Stamp[] =>
    o === lowest
      ? toCompare > 1
        ? [AWARDS.lowest!]
        : []
      : [
          ...(o === newLow ? [AWARDS.newLow!] : []),
          ...(o === knownLow ? [AWARDS.knownLow!] : []),
          ...(o === marketLow
            ? [
                newLow && newLow.priceCents <= o.priceCents
                  ? AWARDS.market!
                  : AWARDS.marketLow!,
              ]
            : []),
          ...(o.format === "set" ? [AWARDS.boxSet!] : []),
          ...(o.format === "omnibus" ? [AWARDS.omnibus!] : []),
        ];

  return (
    <View className="gap-2">
      {usedToo ? (
        <Segmented
          label="Which copies"
          options={[
            { value: "all", label: "All" },
            { value: "new", label: "New" },
            { value: "used", label: "Used" },
          ]}
          value={copies}
          onChange={setCopies}
        />
      ) : null}
      <View className="overflow-hidden rounded-[4px] border-2 border-line">
        {shown.map((o, i) => (
          <Pressable
            key={`${o.store}-${o.priceCents}-${i}`}
            disabled={!o.url}
            onPress={() => o.url && Linking.openURL(o.url)}
            className={`flex-row items-center gap-3 px-3 py-3 active:bg-accent-wash ${i ? "border-t border-line-soft" : ""} ${o === highlighted ? "bg-accent-wash" : ""}`}
          >
            <View className="min-w-0 flex-1 gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="font-body-semibold text-[15px] text-ink">
                  {shopName(o.store)}
                </Text>
                {stampsOf(o).map((s) => (
                  <View
                    key={s.label}
                    className={`rounded-[2px] border-[1.5px] border-line px-1.5 ${s.look} ${s.tilt}`}
                  >
                    <Text
                      className={`font-brand pr-1 text-[13px] tracking-[1px] uppercase ${s.ink}`}
                    >
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="font-body text-[12.5px] text-muted">
                {o.format === "ebook"
                  ? "Ebook"
                  : (CONDITION[o.condition] ?? o.condition)}
                {o.inStock ? "" : " · out of stock"}
              </Text>
            </View>
            <Text className="font-mono-medium text-[16px] text-ink">
              {formatPrice(o.priceCents)}
            </Text>
            {o.url ? (
              <ChevronRightIcon color={c.inkSoft} width={18} height={18} />
            ) : null}
          </Pressable>
        ))}
      </View>
      {listed.length > VISIBLE_OFFERS ? (
        <Pressable onPress={() => setOpen(!open)} className="self-start py-1">
          <Text className="font-body-semibold text-[14px] text-ink underline">
            {open ? "Show fewer" : `Show all ${listed.length}`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
