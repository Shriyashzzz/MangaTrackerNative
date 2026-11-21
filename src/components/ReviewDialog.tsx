// The box a reader writes or changes a volume's review in, without leaving
// the series' page (the web's pages/Details/ReviewDialog.tsx): a sheet with
// stars, a few words, the spoiler switch, and the way to delete it
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  deleteShelfReview,
  saveShelfReview,
  type Review,
  type ShelfVolume,
} from "@/core/lib/reviews";
import ReviewForm from "./ReviewForm";
import Sheet from "./Sheet";

export default function ReviewDialog({
  mangaId,
  volume,
  current,
  onChanged,
  onClose,
}: {
  mangaId: number;
  volume: ShelfVolume;
  // their review of it so far; null when they haven't rated it
  current: Review | null;
  // saved or deleted: the page asks for its lists again
  onChanged: () => Promise<void>;
  onClose: () => void;
}) {
  const [deleteFailed, setDeleteFailed] = useState(false);
  const afterSaving = async () => {
    await onChanged();
    onClose();
  };
  const remove = async () => {
    setDeleteFailed(false);
    if (!(await deleteShelfReview(mangaId, volume.volume)))
      return setDeleteFailed(true);
    await onChanged();
    onClose();
  };
  return (
    <Sheet
      open
      onClose={onClose}
      maxHeight={0.85}
      contentClassName="px-5 pt-1 pb-8"
    >
      <Text className="font-display text-[22px] text-ink">
        Your review of vol. {volume.volume}
      </Text>
      <Text className="mb-4 font-body text-[14px] text-ink-soft">
        For readers deciding whether to buy it.
        {/* only true of a volume we have a book, and so a page, for */}
        {volume.isbn13 ? " It shows on the volume's price page." : ""}
      </Text>
      <ReviewForm
        save={(draft) => saveShelfReview(mangaId, volume.volume, draft)}
        current={current}
        onSaved={afterSaving}
        onCancel={onClose}
      />
      {current ? (
        <View className="mt-4 flex-row flex-wrap items-baseline gap-3">
          <Pressable onPress={() => void remove()} hitSlop={6}>
            <Text className="font-body-medium text-[14px] text-accent underline">
              Delete this review
            </Text>
          </Pressable>
          {deleteFailed ? (
            <Text className="font-body text-[14px] text-accent">
              That didn't delete. Try again.
            </Text>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}
