// Deals, as the web's pages/Prices/Deals.tsx: volumes selling for less than
// they usually do, biggest discount first
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Mascot from "@/components/Mascot";
import Page, { P, TextLink } from "@/components/Page";
import VolumeCard from "@/components/prices/VolumeCard";
import { inCanada } from "@/core/lib/country";
import { getDeals } from "@/core/lib/prices";
import type { PriceCard } from "@/core/lib/types";

const percentOff = (d: PriceCard) =>
  Math.round(100 - (100 * d.priceCents) / (d.avgCents ?? d.priceCents));

export default function DealsScreen() {
  const canada = inCanada();
  const [state, setState] = useState<{
    deals: PriceCard[] | null;
    error: boolean;
  }>({ deals: null, error: false });
  useEffect(() => {
    if (canada) return;
    const controller = new AbortController();
    getDeals(controller.signal)
      .then((r) => setState({ deals: r.deals, error: false }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ deals: null, error: true });
      });
    return () => controller.abort();
  }, [canada]);
  const browse = (
    <TextLink onPress={() => router.push("/series")}>
      Browse every series
    </TextLink>
  );
  return (
    <Page title="Deals">
      <P muted>
        Volumes selling for less than they usually do, biggest discount first.
        Open one to see every store's price.
      </P>
      {canada ? (
        <View className="items-center gap-3 py-6">
          <Mascot mood="confused" width={100} />
          <P>Open any volume to see its prices in Canada. {browse}</P>
        </View>
      ) : null}
      {state.error ? (
        <View className="items-center gap-3 py-6">
          <Mascot mood="panic" width={100} />
          <P>Try again in a moment.</P>
        </View>
      ) : null}
      {state.deals?.length === 0 ? (
        <View className="items-center gap-3 py-6">
          <Mascot mood="confused" width={100} />
          <P>Nothing is well under its usual price at the moment. {browse}</P>
        </View>
      ) : null}
      {state.deals && state.deals.length > 0 ? (
        <View
          className="flex-row flex-wrap justify-between"
          style={{ rowGap: 18 }}
        >
          {state.deals.map((d) => (
            <VolumeCard
              key={d.isbn13}
              {...d}
              priceCents={d.priceCents}
              wasCents={d.avgCents}
              subtitle={`${percentOff(d)}% under its usual price`}
              width={104}
            />
          ))}
        </View>
      ) : null}
      {state.deals && state.deals.length > 0 && state.deals.length < 8 ? (
        <P muted>
          That's all for now. More turn up as prices are checked through the
          day.
        </P>
      ) : null}
    </Page>
  );
}
