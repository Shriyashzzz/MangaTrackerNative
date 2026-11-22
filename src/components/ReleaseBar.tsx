// "There's a new one", for someone who's caught up (core releaseNews says
// when), as the web's pages/Details/ReleaseBar.tsx: a red bar with the news,
// a Psst! stamp on its edge, the white button to buy or preorder the book,
// and an × that silences this one release
import { Pressable, Text, View } from "react-native";
import { InkCrossIcon } from "@/core/components/icons/Icons";
import { openWebPath } from "@/lib/webRoutes";

export default function ReleaseBar({
  headline,
  link,
  onClose,
}: {
  headline: string;
  link: { to: string; label: string } | null;
  onClose: () => void;
}) {
  return (
    <View className="mt-3">
      <View className="flex-row flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-[14px] bg-accent py-2 pr-10 pl-3">
        <Text className="min-w-0 flex-1 font-brand pr-[5px] text-[21px] leading-[24px] tracking-[1px] text-on-accent">
          {headline}
          {"\u00A0"}
        </Text>
        {link ? (
          <Pressable
            onPress={() => openWebPath(link.to)}
            className="rounded-[3px] border-[1.5px] border-line bg-white px-2.5 py-1.5 active:opacity-90"
          >
            <Text className="font-body-semibold text-[13.5px] text-[#963d31]">
              {link.label} →
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityLabel="Hide this news"
          className="absolute top-2 right-2.5"
        >
          <InkCrossIcon color="#fffaf2" width={14} height={14} />
        </Pressable>
      </View>
      <View className="absolute -top-3 right-9 rotate-6 rounded-[4px] border-2 border-accent bg-paper px-1.5">
        <Text className="font-brand pr-[4px] text-[14px] tracking-[1.5px] text-accent">
          Psst!
          {"\u00A0"}
        </Text>
      </View>
    </View>
  );
}
