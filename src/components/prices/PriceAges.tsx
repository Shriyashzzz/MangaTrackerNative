// "checked 2 h ago" beside Prices (the web's PriceAges): the newest check,
// opening to each store's own when they differ
import Tap from "@/components/Tap";
import { useState } from "react";
import { Text, View } from "react-native";
import Sheet from "../Sheet";
import { shopName, timeAgo } from "@/core/lib/prices";
import type { Offer } from "@/core/lib/types";

function storeAges(offers: Offer[]) {
  const newest = new Map<string, string>();
  for (const offer of offers) {
    const store = shopName(offer.store);
    const seen = newest.get(store);
    if (!seen || Date.parse(offer.fetchedAt) > Date.parse(seen))
      newest.set(store, offer.fetchedAt);
  }
  return [...newest]
    .map(([store, at]) => ({ store, at }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export default function PriceAges({
  offers,
  checkedAt,
}: {
  offers: Offer[];
  checkedAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ages = storeAges(offers);
  const newest = ages[0]?.at ?? checkedAt;
  if (!newest) return null;
  if (ages.length < 2)
    return (
      <Text className="font-body text-[13px] text-muted">
        checked {timeAgo(newest)}
      </Text>
    );
  return (
    <>
      <Tap
        onPress={() => setOpen(true)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Checked ${timeAgo(newest)}. Each store's last check`}
      >
        <Text className="font-body text-[13px] text-muted border-b pb-[2px] border-muted self-start">
          checked {timeAgo(newest)}
        </Text>
      </Tap>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <Text className="pb-3 font-body-semibold text-[13px] tracking-[1px] text-muted uppercase">
          Each store, last checked
        </Text>
        {ages.map(({ store, at }) => (
          <View
            key={store}
            className="flex-row items-baseline justify-between border-t border-line-soft py-3"
          >
            <Text className="font-body text-[15px] text-ink">{store}</Text>
            <Text className="font-mono text-[13px] text-ink-soft">
              {timeAgo(at)}
            </Text>
          </View>
        ))}
      </Sheet>
    </>
  );
}
