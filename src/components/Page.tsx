// A plain page below the tabs (About, FAQ, Privacy...): the app bar with
// back and its name, a double rule, and its words in a scroll. The pieces
// the content pages are set in: a heading, a paragraph, a list line
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import DoubleRule from "./DoubleRule";

const Safe = withUniwind(SafeAreaView);

export default function Page({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  const c = useColors();
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
          {title}
        </Text>
        {right}
      </View>
      <DoubleRule />
      <ScrollView
        contentContainerClassName="gap-6 px-4 pt-5 pb-16"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Safe>
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
