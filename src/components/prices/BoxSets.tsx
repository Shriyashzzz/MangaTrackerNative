// A series' box sets (the web's BoxSets.tsx): the cheapest as a ticket, the
// rest a price list, and the stores to look in; or, with none priced, where
// to look for one (BoxSetSearch). A volume page's "Also in a box set" note
import { Linking, Pressable, Text, View } from "react-native";
import { formatCents, shopName } from "@/core/lib/prices";
import type { BoxSet, Offer, StoreLink } from "@/core/lib/types";
import { setsTitle, shownSets } from "@/core/pages/Prices/boxSetRules";

const KIND: Record<string, string> = { set: "Box set", omnibus: "Omnibus" };
const CONDITION: Record<string, string> = { new: "new", used: "used" };
const AFFILIATE_NOTE =
  "Some store links are affiliate links, which help keep Manga Tracker running at no cost to you.";

const StoreLinks = ({ links }: { links: StoreLink[] }) => (
  <View className="flex-row flex-wrap gap-2">
    {links.map((l) => (
      <Pressable
        key={l.store}
        onPress={() => void Linking.openURL(l.url)}
        className="rounded-[3px] border-[1.5px] border-line px-2.5 py-1.5 active:bg-accent-wash"
        accessibilityLabel={`${l.store} box sets`}
      >
        <Text className="font-body-medium text-[13.5px] text-ink">
          {l.store}
        </Text>
      </Pressable>
    ))}
  </View>
);

export function BoxSetSearch({ links }: { links: StoreLink[] }) {
  if (!links.length) return null;
  return (
    <View className="gap-2">
      <Text className="font-body-semibold text-[15px] text-ink">
        Looking for a box set? Try
      </Text>
      <StoreLinks links={links} />
      {links.some((l) => l.affiliate) ? (
        <Text className="font-body text-[12px] text-muted">
          {AFFILIATE_NOTE}
        </Text>
      ) : null}
    </View>
  );
}

export function BoxSetNote({
  offers,
  onOpen,
}: {
  offers: Pick<Offer, "format" | "inStock" | "priceCents">[];
  onOpen: () => void;
}) {
  const sets = offers.filter((o) => o.format === "set" && o.inStock);
  if (!sets.length) return null;
  return (
    <Pressable onPress={onOpen} hitSlop={6}>
      <Text className="font-body text-[14px] text-ink-soft">
        Also in a box set, from{" "}
        <Text className="font-body-semibold text-ink underline">
          {formatCents(Math.min(...sets.map((o) => o.priceCents)))} →
        </Text>
      </Text>
    </Pressable>
  );
}

export default function BoxSets({
  sets: found,
  links,
  editionsListed,
  bare = false,
}: {
  sets: BoxSet[];
  links: StoreLink[];
  editionsListed: boolean;
  bare?: boolean;
}) {
  const sets = shownSets(found, editionsListed);
  if (!sets.length) return null;
  const affiliate = [...sets, ...links].some((l) => l.affiliate);
  const said = (s: BoxSet) => ({
    kind: KIND[s.format] ?? "Set",
    condition: CONDITION[s.condition] ?? "resold",
    store: shopName(s.store),
    price: formatCents(s.priceCents),
  });
  const [cheapest, ...rest] = sets;
  const lead = said(cheapest!);
  const body = (
    <View className="gap-2">
      <Pressable
        onPress={
          cheapest!.url ? () => void Linking.openURL(cheapest!.url!) : undefined
        }
        className="flex-row items-baseline justify-between gap-3 rounded-[4px] border-2 border-accent bg-accent-wash px-3 py-2.5 active:opacity-90"
      >
        <View className="min-w-0 flex-1">
          <Text className="font-mono-medium text-[11.5px] tracking-[1px] text-accent-ink uppercase">
            Cheapest · {lead.condition}
          </Text>
          <Text className="font-body-semibold text-[15.5px] text-ink">
            {lead.store}
          </Text>
        </View>
        <Text className="font-mono-medium text-[16px] text-accent-ink">
          {lead.price}
        </Text>
      </Pressable>
      {rest.map((s) => {
        const { kind, condition, store, price } = said(s);
        return (
          <Pressable
            key={`${s.store}-${s.priceCents}-${s.url}`}
            onPress={s.url ? () => void Linking.openURL(s.url!) : undefined}
            className="flex-row items-baseline justify-between gap-3 border-b border-dotted border-line-soft py-1.5"
          >
            <Text className="min-w-0 flex-1 font-body text-[14px] text-ink">
              {store}{" "}
              <Text className="text-muted">
                · {s.format === "omnibus" ? `${kind} · ` : ""}
                {condition}
              </Text>
            </Text>
            <Text className="font-mono-medium text-[14px] text-ink">
              {price}
            </Text>
          </Pressable>
        );
      })}
      {links.length ? (
        <View className="gap-1.5 pt-1">
          <Text className="font-body text-[13px] text-ink-soft">
            More box sets at:
          </Text>
          <StoreLinks links={links} />
        </View>
      ) : null}
      {affiliate ? (
        <Text className="font-body text-[12px] text-muted">
          {AFFILIATE_NOTE}
        </Text>
      ) : null}
    </View>
  );
  if (bare) return body;
  return (
    <View className="gap-2">
      <Text className="font-brand pr-1 text-[18px] tracking-[1px] text-ink uppercase">
        {setsTitle(sets)}
      </Text>
      {body}
    </View>
  );
}
