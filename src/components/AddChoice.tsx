// "Add manga": type its name, or scan the barcode on the back of a volume
// (the web's components/scanSheet/AddChoice.tsx), as a sheet
import { Pressable, Text, View } from "react-native";
import { BarcodeIcon, TypeIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import Sheet from "./Sheet";

export default function AddChoice({
  onType,
  onScan,
  onClose,
}: {
  onType: () => void;
  onScan: () => void;
  onClose: () => void;
}) {
  const c = useColors();
  const choice = (
    Icon: typeof TypeIcon,
    title: string,
    note: string,
    run: () => void,
  ) => (
    <Pressable
      onPress={() => {
        onClose();
        run();
      }}
      className="flex-row items-center gap-3 rounded-[14px] border border-line-soft bg-card p-3 active:bg-accent-wash"
    >
      <Icon color={c.ink} width={28} height={28} />
      <View className="min-w-0 flex-1">
        <Text className="font-body-semibold text-[16px] text-ink">{title}</Text>
        <Text className="font-body text-[13.5px] text-ink-soft">{note}</Text>
      </View>
    </Pressable>
  );
  return (
    <Sheet open onClose={onClose} contentClassName="gap-3 px-4 pb-8">
      <Text className="font-brand pr-[6px] text-[24px] tracking-[1px] text-ink uppercase">
        Add manga
        {"\u00A0"}
      </Text>
      {choice(
        TypeIcon,
        "Type a title",
        "Search by name, add the chapter you've read up to",
        onType,
      )}
      {choice(
        BarcodeIcon,
        "Scan a barcode",
        "Point at the back of a volume, scan a stack in a row",
        onScan,
      )}
      <Pressable onPress={onClose} className="self-center py-2">
        <Text className="font-body-medium text-[15px] text-ink-soft">
          Cancel
        </Text>
      </Pressable>
    </Sheet>
  );
}
