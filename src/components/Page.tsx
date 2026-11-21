// A plain page below the tabs (About, FAQ, Privacy...): the platform's own
// header with back and its name (a large title that shrinks as you scroll
// on an iPhone, Material's bar on Android), and its words in a scroll. A
// page that searches gets the header's own search bar. The pieces the
// content pages are set in: a heading, a paragraph, a list line
import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { Linking, Platform, ScrollView, Text, View } from "react-native";
import { useColors } from "@/lib/colors";

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
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  search?: PageSearch;
  scroll?: boolean;
}) {
  const c = useColors();
  const ios = Platform.OS === "ios";
  return (
    <View className="flex-1 bg-paper">
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerLargeTitle: ios,
          headerTransparent: ios,
          headerBlurEffect: "systemChromeMaterial",
          headerStyle: { backgroundColor: c.paper },
          headerLargeStyle: { backgroundColor: c.paper },
          headerTintColor: c.ink,
          headerTitleStyle: { color: c.ink },
          headerLargeTitleStyle: { color: c.ink },
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
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="gap-6 px-4 pt-5 pb-16"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );
}

export const H2 = ({ children }: { children: ReactNode }) => (
  <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
    {children}
  </Text>
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
    onPress={href ? () => void Linking.openURL(href) : onPress}
  >
    {children}
  </Text>
);
