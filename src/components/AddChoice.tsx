// "Add manga": type its name, or scan the barcode on the back of a volume
// (the web's components/scanSheet/AddChoice.tsx), as a sheet
import { Modal, Pressable, Text, View } from "react-native";
import { BarcodeIcon, TypeIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";

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
      className="flex-row items-center gap-3 rounded-[4px] border-2 border-line bg-paper p-3 active:bg-accent-wash"
    >
      <Icon color={c.ink} width={28} height={28} />
      <View className="min-w-0 flex-1">
        <Text className="font-body-semibold text-[16px] text-ink">{title}</Text>
        <Text className="font-body text-[13.5px] text-ink-soft">{note}</Text>
      </View>
    </Pressable>
  );
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <View className="gap-3 rounded-t-2xl bg-card px-4 pt-3 pb-8">
        <View className="mb-1 h-1 w-9 self-center rounded-full bg-muted/50" />
        <Text className="font-brand pr-1 text-[24px] tracking-[1px] text-ink uppercase">
          Add manga
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
      </View>
    </Modal>
  );
}
