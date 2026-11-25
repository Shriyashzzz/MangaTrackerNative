// A plain page below the tabs (About, FAQ, Privacy...): the platform's own
// header with back and its name (a large title that shrinks as you scroll
// on an iPhone, Material's bar on Android), and its words in a scroll. A
// page that searches gets the header's own search bar. The pieces the
// content pages are set in: a heading, a paragraph, a list line
import { DENSE } from "@/lib/textScale";
import { columnStyle, useWide } from "@/lib/wide";
import { openOutside } from "@/lib/openOutside";
import PullPage, { pause, usePullTop } from "@/components/PullRefresh";
import Backdrop from "@/components/Backdrop";
import { useColors } from "@/lib/colors";
import { themeOf, useWornTheme } from "@/lib/mangaThemes";

import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

// the app's lettering for a page's title: Bangers, or a worn manga theme's
// own face, as the tabs' own headings have it
const BRAND_FONT = "Bangers_400Regular";

export type PageSearch = {
  placeholder: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
};

export default function Page({
  title,
  children,
  right,
  search,
  // the children are a list that scrolls itself (no page scroll around it)
  scroll = true,
  onRefresh,
  center = false,
  ruled = false,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  search?: PageSearch;
  scroll?: boolean;
  // what a pull down asks for again; a page with nothing to ask for still
  // answers the pull
  onRefresh?: () => Promise<unknown>;
  // nothing to list: what's said sits in the middle of the screen
  center?: boolean;
  // a line under the title, as the Android app's title bar has: on an
  // iPhone or iPad, ruled under the large title (Android has its own)
  ruled?: boolean;
}) {
  const pull = usePullTop();
  const c = useColors();
  const ios = Platform.OS === "ios";
  const worn = useWornTheme();
  const { wide } = useWide();
  const titleFont = worn ? themeOf(worn)!.font : BRAND_FONT;
  return (
    <View className="flex-1 bg-paper">
      <Backdrop />
      <Stack.Screen
        options={{
          headerShown: true,
          // (a blank after it: the lettering leans, and its last letter
          // would be cut at the title's edge. A blank, not a space, which
          // Apple's bar trims off)
          title: `${title.toUpperCase()}\u2800`,
          headerTitleAlign: "left",
          // a large title on a phone; on a wide screen the small one, in the
          // middle over the centred column, rather than at the far left
          headerLargeTitle: ios && !wide,
          headerTransparent: ios,
          headerBlurEffect: "systemChromeMaterial",
          headerStyle: { backgroundColor: c.paper },
          headerLargeStyle: { backgroundColor: c.paper },
          headerTintColor: c.ink,
          // in the app's lettering, as every other heading is (the large
          // title as it starts, the small one as the page scrolls)
          headerTitleStyle: ios
            ? { color: c.ink, fontFamily: titleFont, fontSize: 22 }
            : {
                color: c.ink,
                fontFamily: "Bangers_400Regular",
                fontSize: 24,
              },
          headerLargeTitleStyle: {
            color: c.ink,
            fontFamily: titleFont,
            fontSize: 38,
          },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerRight: right ? () => right : undefined,
          headerSearchBarOptions: search
            ? {
                placeholder: search.placeholder,
                hideWhenScrolling: false,
                autoCapitalize: "none",
                textColor: c.ink,
                headerIconColor: c.ink,
                tintColor: c.accent,
                onChangeText: (e) => search.onChangeText(e.nativeEvent.text),
                onSearchButtonPress: (e) =>
                  search.onSubmit?.(e.nativeEvent.text),
              }
            : undefined,
        }}
      />
      {scroll ? (
        <PullPage refresh={onRefresh ?? pause} scrollTop={pull.top}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName={`gap-6 px-4 pt-5 pb-16 ${center ? "grow justify-center" : ""}`}
            // on a wide screen, a readable column in the middle (lib/wide.ts)
            contentContainerStyle={columnStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            overScrollMode="never"
            scrollEventThrottle={16}
            onScroll={pull.track}
          >
            {ruled && ios ? <View className="-mt-1 h-px bg-line" /> : null}
            {children}
          </ScrollView>
        </PullPage>
      ) : (
        children
      )}
    </View>
  );
}

// the line between a page's sections, as the Android app rules them off
export const Rule = () => <View className="h-px bg-line-soft" />;

// a section's title: the lettering with a short accent rule under it
export const H2 = ({ children }: { children: ReactNode }) => (
  <View className="gap-1 self-start w-fit ">
    {/* a section's title shares its line with a count or "See all": it
        grows only so far (lib/textScale.ts) */}
    <Text
      maxFontSizeMultiplier={DENSE}
      className="font-brand min-w-fit pr-[5px] text-[22px] tracking-[1px] text-ink uppercase"
    >
      {children}
      {"\u00A0"}
    </Text>
    <View className="h-[3px] w-10 bg-accent" />
  </View>
);
export const H3 = ({ children }: { children: ReactNode }) => (
  <Text className="font-body-semibold text-[16px] text-ink">{children}</Text>
);
export const P = ({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) => (
  <Text
    className={`font-body text-[15.5px] leading-[23px] ${muted ? "text-ink-soft" : "text-ink"}`}
  >
    {children}
  </Text>
);
export const Bullet = ({ children }: { children: ReactNode }) => (
  <View className="flex-row gap-2 pl-1">
    <Text className="font-body text-[15.5px] leading-[23px] text-ink-soft">
      •
    </Text>
    <Text className="flex-1 font-body text-[15.5px] leading-[23px] text-ink">
      {children}
    </Text>
  </View>
);
export const TextLink = ({
  children,
  onPress,
  href,
}: {
  children: ReactNode;
  onPress?: () => void;
  href?: string;
}) => (
  <Text
    className="font-body-semibold text-[15.5px] text-ink underline"
    onPress={href ? () => openOutside(href) : onPress}
  >
    {children}
  </Text>
);
