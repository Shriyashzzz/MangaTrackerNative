// A volume's prices, as the Android app's (web pages/Prices/PriceVolume.tsx):
// its cover, title, publisher and ISBN, the series it's part of, then every
// store's price (OfferList) and more places to look. These are the prices
// already checked: a live check needs the website's proof a person is there,
// which the app doesn't have yet
import { Image } from "expo-image";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import DoubleRule from "@/components/DoubleRule";
import OfferList from "@/components/OfferList";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import {
  coverSrc,
  formatCents,
  getVolume,
  shopName,
  timeAgo,
} from "@/core/lib/prices";
import type { VolumePrices } from "@/core/lib/types";
import { useColors } from "@/lib/colors";

const Safe = withUniwind(SafeAreaView);

export default function PriceVolumeScreen() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const c = useColors();
  const [page, setPage] = useState<VolumePrices | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getVolume(isbn, controller.signal)
      .then(setPage)
      .catch((e: Error) => !controller.signal.aborted && setFailed(e.message));
    return () => controller.abort();
  }, [isbn]);

  const title = page?.heading ?? page?.book.title ?? "";

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 font-brand pr-1 text-[24px] tracking-[1px] text-ink uppercase"
        >
          {title || "Prices"}
        </Text>
      </View>
      <DoubleRule />
      {failed ? (
        <Text className="px-4 pt-6 font-body text-[15px] text-ink-soft">
          {failed}
        </Text>
      ) : !page ? null : (
        <ScrollView contentContainerClassName="gap-5 px-4 pt-4 pb-16">
          <View className="flex-row gap-3.5">
            <Image
              source={
                page.book.coverUrl
                  ? { uri: coverSrc(page.book.coverUrl) }
                  : undefined
              }
              style={{
                width: 90,
                aspectRatio: 2 / 3,
                borderWidth: 2,
                borderColor: c.line,
                backgroundColor: c.paper,
              }}
              contentFit="cover"
            />
            <View className="min-w-0 flex-1 gap-1.5">
              <Text className="font-display text-[22px] leading-[26px] text-ink">
                {title}
              </Text>
              <Text className="font-body text-[14px] text-ink-soft">
                {[page.book.publisher, page.book.year]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              <Text className="font-mono text-[12.5px] text-muted">
                ISBN-13 {page.book.isbn13}
              </Text>
              <Link
                href={{
                  pathname: "/prices/series",
                  params: { name: page.series.name },
                }}
              >
                <Text className="font-body text-[14px] text-ink-soft">
                  Part of{" "}
                  <Text className="font-body-semibold text-ink underline">
                    {page.series.name}
                  </Text>
                </Text>
              </Link>
            </View>
          </View>

          {page.preorder ? (
            <Text className="font-body text-[15px] text-ink">
              Out {page.preorder}: no prices yet, preorder below.
            </Text>
          ) : page.offers.length ? (
            <View className="gap-2">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
                  Prices
                </Text>
                {page.checkedAt ? (
                  <Text className="font-body text-[13px] text-muted">
                    checked {timeAgo(page.checkedAt)}
                  </Text>
                ) : null}
              </View>
              <OfferList offers={page.offers} formatPrice={formatCents} />
            </View>
          ) : (
            <Text className="font-body text-[15px] text-ink-soft">
              No prices checked for this one yet.
            </Text>
          )}

          {page.storeLinks.length ? (
            <View className="gap-2">
              <Text className="font-body-medium text-[14px] text-ink-soft">
                More places to look:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {page.storeLinks.map((l) => (
                  <Pressable
                    key={l.url}
                    onPress={() => Linking.openURL(l.url)}
                    className="min-w-[46%] flex-1 items-center rounded-[4px] border-2 border-line py-2.5 active:bg-accent-wash"
                  >
                    <Text className="font-body-semibold text-[14px] text-ink">
                      {shopName(l.store)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </Safe>
  );
}
