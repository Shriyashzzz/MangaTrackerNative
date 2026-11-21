// "checked 2 h ago" beside Prices (the web's PriceAges): the newest check,
// opening to each store's own when they differ
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
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
    <View className="items-end">
      <Pressable
        onPress={() => setOpen(!open)}
        hitSlop={6}
        accessibilityState={{ expanded: open }}
      >
        <Text className="font-body text-[13px] text-muted underline">
          checked {timeAgo(newest)}
        </Text>
      </Pressable>
      {open ? (
        <View className="mt-1 rounded-[3px] border border-line-soft bg-card px-2 py-1">
          {ages.map(({ store, at }) => (
            <Text key={store} className="font-mono text-[11.5px] text-ink-soft">
              {store} · {timeAgo(at)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
